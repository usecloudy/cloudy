import { handleSupabaseError } from "@cloudy/utils/common";
import { useMutation } from "@tanstack/react-query";
import { diffLines, diffWords } from "diff";
import { CheckCircle2Icon, ChevronsLeftIcon, ClipboardCheckIcon, CopyIcon, XCircleIcon } from "lucide-react";
import React, { useContext, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { apiClient } from "src/api/client";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import LoadingSpinner from "src/components/LoadingSpinner";
import { cn } from "src/utils";
import { simpleHash } from "src/utils/hash";
import { processSearches } from "src/utils/tiptapSearchAndReplace";

import { ThreadCommentContext } from "./AiCommentThread";
import { ThoughtContext } from "./thoughtContext";

const useApplySuggestion = () => {
	const { thoughtId, editor } = useContext(ThoughtContext);

	return useMutation({
		mutationFn: async ({ suggestionContent }: { suggestionContent: string }) => {
			const {
				data: { originalSnippet, replacementSnippet },
			} = await apiClient.post<{ originalSnippet: string; replacementSnippet: string }>("/api/ai/apply-change", {
				thoughtId,
				suggestionContent,
			});

			const currentHtml = editor?.getHTML();
			if (!currentHtml) {
				throw new Error("No current HTML");
			}
			const currentHtmlWithoutEditTags = currentHtml.replace(/<\/?edit>/g, "");

			if (!currentHtmlWithoutEditTags.includes(originalSnippet)) {
				throw new Error("Original snippet not found");
			}

			const newHtml = currentHtmlWithoutEditTags.replace(originalSnippet, replacementSnippet);

			editor?.commands.setContent(newHtml ?? currentHtml ?? "");
		},
	});
};

const useMarkAsApplied = () => {
	return useMutation({
		mutationFn: async ({ threadCommentId, suggestionHash }: { threadCommentId: string; suggestionHash: string }) => {
			const { applied_suggestion_hashes: appliedSuggestionHashes } = handleSupabaseError(
				await supabase
					.from("thought_chat_threads")
					.select("applied_suggestion_hashes")
					.eq("id", threadCommentId)
					.single(),
			);

			await supabase
				.from("thought_chat_threads")
				.update({
					applied_suggestion_hashes: [...appliedSuggestionHashes, suggestionHash],
				})
				.eq("id", threadCommentId);
		},
	});
};

const makeSuggestionHash = (suggestionContent?: string) => {
	return suggestionContent && suggestionContent.length > 0 ? simpleHash(suggestionContent) : "";
};

export const SuggestionContent = ({ children }: JSX.IntrinsicElements["pre"]) => {
	const { status, threadCommentId, appliedSuggestionHashes } = useContext(ThreadCommentContext);
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
	const isApplied = appliedSuggestionHashes.includes(suggestionHash);

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

		await markAsAppliedMutation.mutateAsync({ threadCommentId, suggestionHash });
	};

	const revertSuggestion = () => {
		setPreviewingKey(null);
		setIsEditingDisabled(false);
		restoreFromLastContent();
		clearStoredContent();
		disableUpdatesRef.current = false;
	};

	const [isCopied, setIsCopied] = useState(false);

	// Parse the suggestionContent for original and replacement content
	const parseSuggestionContent = (content: string) => {
		const originalMatch = content.match(/<original_content>([\s\S]*?)<\/original_content>/);
		const replacementMatch = content.match(/<replacement_content>([\s\S]*?)<\/replacement_content>/);
		return {
			original: originalMatch ? originalMatch[1] : "",
			replacement: replacementMatch ? replacementMatch[1] : "",
		};
	};

	const { original, replacement } = useMemo(() => parseSuggestionContent(suggestionContent || ""), [suggestionContent]);

	// Compute the word-level diff
	const diff = useMemo(() => diffWords(original, replacement), [original, replacement]);

	// Add state for active tab
	const [activeTab, setActiveTab] = useState<"diff" | "replacement">("diff");

	const handleCopy = () => {
		if (!replacement) {
			return;
		}

		navigator.clipboard.writeText(replacement);
		toast.success("Copied to clipboard");
		setIsCopied(true);

		setTimeout(() => {
			setIsCopied(false);
		}, 2000);
	};

	return (
		<pre className="my-1 rounded bg-card px-3 py-2 font-sans">
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
							className={cn(part.added ? "bg-green-200" : part.removed ? "bg-red-200 line-through" : "")}>
							{part.value}
						</span>
					))}
				</p>
			) : (
				<p className="text-wrap break-words">{replacement}</p>
			)}

			{/* ... existing UI elements ... */}
			<div className="mt-2 flex w-full flex-row items-center gap-1.5">
				{applySuggestionMutation.isPending || status === "pending" ? (
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
						<Button size="sm" variant="outline" className="bg-background" onClick={handleCopy}>
							{isCopied ? (
								<>
									<ClipboardCheckIcon className="size-4" />
									<span>Copied</span>
								</>
							) : (
								<>
									<CopyIcon className="size-4" />
									<span>Copy result</span>
								</>
							)}
						</Button>
					</>
				)}
			</div>
		</pre>
	);
};
