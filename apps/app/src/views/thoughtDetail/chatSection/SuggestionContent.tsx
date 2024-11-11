import { ChatRole, extractInnerTextFromXml, handleSupabaseError } from "@cloudy/utils/common";
import { useMutation } from "@tanstack/react-query";
import { diffLines, diffWords } from "diff";
import { CheckCircle2Icon, ChevronsLeftIcon, XCircleIcon } from "lucide-react";
import posthog from "posthog-js";
import React, { useContext, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { queryClient } from "src/api/queryClient";
import { chatThreadQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { CopyButton } from "src/components/CopyButton";
import LoadingSpinner from "src/components/LoadingSpinner";
import { useWorkspace } from "src/stores/workspace";
import { cn } from "src/utils";
import { simpleHash } from "src/utils/hash";
import { processSearches } from "src/utils/tiptapSearchAndReplace";

import { ThoughtContext } from "../thoughtContext";
import { ChatMessageContext } from "./chat";

const useApplySuggestion = () => {
	const workspace = useWorkspace();
	const { editor } = useContext(ThoughtContext);

	return useMutation({
		mutationFn: async ({ suggestionContent }: { suggestionContent: string }) => {
			// const {
			// 	data: { originalSnippet, replacementSnippet },
			// } = await apiClient.post<{ originalSnippet: string; replacementSnippet: string | null }>("/api/ai/apply-change", {
			// 	thoughtId,
			// 	suggestionContent,
			// });

			// const currentHtml = editor?.getHTML();
			// if (!currentHtml) {
			// 	throw new Error("No current HTML");
			// }
			// const currentHtmlWithoutEditTags = currentHtml.replace(/<\/?edit>/g, "");

			// if (!currentHtmlWithoutEditTags.includes(originalSnippet)) {
			// 	throw new Error("Original snippet not found");
			// }

			// console.log("replacing", originalSnippet, "with", replacementSnippet);

			// if (!replacementSnippet) {
			// 	throw new Error("Replacement snippet not found");
			// }

			// const newHtml = currentHtmlWithoutEditTags.replace(originalSnippet, replacementSnippet);

			// console.log("newHtml", newHtml);

			// editor?.commands.setContent(newHtml ?? currentHtml ?? "", false, { preserveWhitespace: false });

			let originalSnippet = extractInnerTextFromXml(suggestionContent, "original_content").trim();
			let replacementSnippet = extractInnerTextFromXml(suggestionContent, "replacement_content").trim();
			const contentMd = editor!.storage.markdown.getMarkdown() as string;

			originalSnippet = originalSnippet.replaceAll("\\`\\`\\`", "```");
			replacementSnippet = replacementSnippet.replaceAll("\\`\\`\\`", "```");

			if (contentMd.includes(originalSnippet)) {
				editor?.commands.setContent(contentMd.replace(originalSnippet, replacementSnippet));
			} else {
				console.log("Will need advanced replace.", contentMd, originalSnippet);
				posthog.capture("advanced_replace_needed", {
					workspace_id: workspace.id,
					workspace_slug: workspace.slug,
				});
				throw new Error("Advanced replace not implemented yet.");
			}
		},
		throwOnError: false,
	});
};

const useMarkAsApplied = () => {
	return useMutation({
		mutationFn: async ({ messageId, suggestionHash }: { messageId: string; suggestionHash: string }) => {
			const { applied_suggestion_hashes: appliedSuggestionHashes } = handleSupabaseError(
				await supabase.from("chat_messages").select("applied_suggestion_hashes").eq("id", messageId).single(),
			);

			const { thread_id: threadId } = handleSupabaseError(
				await supabase
					.from("chat_messages")
					.update({
						applied_suggestion_hashes: [...appliedSuggestionHashes, suggestionHash],
					})
					.eq("id", messageId)
					.select("thread_id")
					.single(),
			);

			return threadId;
		},
		onSuccess: threadId => {
			queryClient.invalidateQueries({ queryKey: chatThreadQueryKeys.thread(threadId) });
		},
	});
};

const makeSuggestionHash = (suggestionContent?: string) => {
	return suggestionContent && suggestionContent.length > 0 ? simpleHash(suggestionContent) : "";
};

export const SuggestionContent = ({ children }: JSX.IntrinsicElements["pre"]) => {
	const { message } = useContext(ChatMessageContext);
	const {
		previewingKey,
		storeContentIfNeeded,
		setPreviewingKey,
		setIsEditingDisabled,
		restoreFromLastContent,
		clearStoredContent,
		editor,
		disableUpdatesRef,
		applySuggestedChanges,
		onStartAiEdits,
		onFinishAiEdits,
	} = useContext(ThoughtContext);
	const applySuggestionMutation = useApplySuggestion();
	const markAsAppliedMutation = useMarkAsApplied();

	const content = React.Children.map(children, child => {
		if (React.isValidElement(child) && child.type === "code") {
			return child.props.children;
		}
		return child;
	});
	const suggestionContent = content?.at(0)?.trim();

	const suggestionHash = useMemo(() => makeSuggestionHash(suggestionContent), [suggestionContent]);
	const isApplied = message.applied_suggestion_hashes.includes(suggestionHash);
	const isGenerating = message.role === ChatRole.Assistant && !message.completed_at;

	const currentIsPreviewing = previewingKey === suggestionHash;

	const applySuggestion = async () => {
		if (!suggestionContent || !editor) {
			return;
		}

		if (typeof suggestionContent === "string") {
			disableUpdatesRef.current = true;
			storeContentIfNeeded();
			setPreviewingKey(suggestionHash);
			onStartAiEdits();

			const existingContentText = editor.getText() ?? "";

			try {
				await applySuggestionMutation.mutateAsync({ suggestionContent });
			} catch (error) {
				toast.error("Failed to apply suggestion");
				setPreviewingKey(null);
			}

			const newContentText = editor?.getText() ?? "";
			const diff = diffLines(existingContentText, newContentText);

			const addedLines = diff.filter(part => part.added);
			addedLines.forEach(part => {
				if (editor) {
					const lines = part.value.split("\n").filter(line => line.trim().length > 0);
					lines.forEach(line => {
						const results = processSearches(editor.state.doc, line);

						const firstResult = results?.at(0);

						if (firstResult) {
							editor.chain().blur().setTextSelection(firstResult).setMark("additionHighlight").run();
						}
					});
				}
			});

			onFinishAiEdits();
		}
	};

	const confirmSuggestion = async () => {
		applySuggestedChanges();

		await markAsAppliedMutation.mutateAsync({ messageId: message.id, suggestionHash });
	};

	const revertSuggestion = () => {
		setPreviewingKey(null);
		setIsEditingDisabled(false);
		restoreFromLastContent();
		clearStoredContent();
		disableUpdatesRef.current = false;
	};

	// Parse the suggestionContent for original and replacement content
	const parseSuggestionContent = (content: string) => {
		const originalMatch = content.match(/<original_content>([\s\S]*?)<\/original_content>/);
		const replacementMatch = content.match(/<replacement_content>([\s\S]*?)<\/replacement_content>/);

		let originalContent = originalMatch ? originalMatch[1] : "";
		let replacementContent = replacementMatch ? replacementMatch[1] : "";

		originalContent = originalContent.replaceAll("\\`\\`\\`", "```");
		replacementContent = replacementContent = replacementContent.replaceAll("\\`\\`\\`", "```");

		return {
			original: originalContent,
			replacement: replacementContent,
		};
	};

	const { original, replacement } = useMemo(() => parseSuggestionContent(suggestionContent || ""), [suggestionContent]);

	// Compute the word-level diff
	const diff = useMemo(() => diffWords(original, replacement), [original, replacement]);

	// Add state for active tab
	const [activeTab, setActiveTab] = useState<"diff" | "replacement">("diff");

	return (
		<pre className="my-1 rounded bg-card px-3 py-2 !font-sans">
			{/* Tab Bar */}
			<div className="flex border-b">
				<button
					className={`px-4 py-2 ${activeTab === "diff" ? "border-b-2 border-accent text-accent" : "text-gray-500"}`}
					onClick={() => setActiveTab("diff")}>
					Diff
				</button>
				<button
					className={`px-4 py-2 ${
						activeTab === "replacement" ? "border-b-2 border-accent text-accent" : "text-gray-500"
					}`}
					onClick={() => setActiveTab("replacement")}>
					Result
				</button>
			</div>

			{/* Conditional Rendering based on activeTab */}
			{activeTab === "diff" ? (
				<p className="text-wrap break-words">
					{diff.map((part, index) => (
						<span
							key={index}
							className={cn(
								part.added
									? "bg-green-200 dark:bg-green-800"
									: part.removed
										? "bg-red-200 line-through dark:bg-red-800"
										: "",
							)}>
							{part.value}
						</span>
					))}
				</p>
			) : (
				<p className="text-wrap break-words">{replacement}</p>
			)}

			{/* ... existing UI elements ... */}
			<div className="mt-2 flex w-full flex-row items-center gap-1.5">
				{applySuggestionMutation.isPending || isGenerating ? (
					<LoadingSpinner size="xs" />
				) : currentIsPreviewing ? (
					<>
						<Button
							size="sm"
							variant="default"
							className="bg-green-600 hover:bg-green-600/80"
							onClick={confirmSuggestion}>
							<CheckCircle2Icon className="size-4" />
							<span>Accept</span>
						</Button>
						<Button size="sm" variant="destructive" onClick={revertSuggestion}>
							<XCircleIcon className="size-4" />
							<span>Reject</span>
						</Button>
					</>
				) : (
					<>
						<Button
							size="sm"
							variant="outline"
							className="bg-background text-accent hover:bg-accent/20"
							onClick={applySuggestion}
							disabled={isApplied}>
							{isApplied ? (
								<>
									<CheckCircle2Icon className="size-4" />
									<span>Applied</span>
								</>
							) : (
								<>
									<ChevronsLeftIcon className="size-4" />
									<span>Apply</span>
								</>
							)}
						</Button>
						<CopyButton textToCopy={replacement} size="sm" variant="outline" className="bg-background" />
					</>
				)}
			</div>
		</pre>
	);
};
