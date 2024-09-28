import { handleSupabaseError } from "@cloudy/utils/common";
import { useMutation } from "@tanstack/react-query";
import { diffLines } from "diff";
import { CheckCircle2Icon, ChevronsLeftIcon, ClipboardCheckIcon, CopyIcon, XCircleIcon } from "lucide-react";
import React, { useContext, useMemo, useState } from "react";
import Markdown from "react-markdown";
import { toast } from "react-toastify";

import { apiClient } from "src/api/client";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import LoadingSpinner from "src/components/LoadingSpinner";
import { simpleHash } from "src/utils/hash";
import { processSearches } from "src/utils/tiptapSearchAndReplace";

import { ThreadCommentContext } from "./AiCommentThread";
import { ThoughtContext } from "./thoughtContext";

const useApplySuggestion = () => {
	const { thoughtId, editor } = useContext(ThoughtContext);

	return useMutation({
		mutationFn: async ({ suggestionContent }: { suggestionContent: string }) => {
			const response = await fetch(apiClient.getUri({ url: "/api/ai/apply-change" }), {
				method: "POST",
				// @ts-ignore
				headers: {
					...apiClient.defaults.headers.common,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ thoughtId, suggestionContent }),
			});

			if (!response.ok) {
				throw new Error("Failed to apply suggestion");
			}

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const reader = response.body?.getReader();
			if (!reader) {
				throw new Error("Failed to get reader from response");
			}

			let content = "";
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				const chunk = new TextDecoder().decode(value);
				content += chunk;

				const currentLines = content.split("\n");
				const firstLine = currentLines[0];
				if (firstLine.startsWith("```")) {
					content = currentLines.slice(1).join("\n");
				}
				const lastLine = currentLines.at(-1);
				console.log("lastLine", lastLine);
				if (lastLine?.startsWith("```")) {
					content = currentLines.slice(0, -1).join("\n");
				}

				editor?.commands.setContent(content);
			}

			editor?.commands.setContent(content);
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

			await applySuggestionMutation.mutateAsync({ suggestionContent });

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

	const handleCopy = () => {
		if (!suggestionContent) {
			return;
		}

		navigator.clipboard.writeText(suggestionContent);
		toast.success("Copied to clipboard");
		setIsCopied(true);

		setTimeout(() => {
			setIsCopied(false);
		}, 2000);
	};

	return (
		<pre className="my-1 rounded bg-card px-3 py-2 font-sans">
			<p className="text-wrap break-words">
				<Markdown>{suggestionContent}</Markdown>
			</p>
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
									<span>Copy</span>
								</>
							)}
						</Button>
					</>
				)}
			</div>
		</pre>
	);
};
