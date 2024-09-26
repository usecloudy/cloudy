import { SparklesIcon, UserIcon } from "lucide-react";
import { createContext, useEffect, useRef } from "react";
import Markdown from "react-markdown";

import LoadingSpinner from "src/components/LoadingSpinner";
import { makeHumanizedTime } from "src/utils/strings";

import { SuggestionContent } from "./SuggestionContent";
import { useCommentThread } from "./hooks";
import { useThoughtStore } from "./thoughtStore";

export const AiCommentThread = () => {
	const { activeThreadCommentId } = useThoughtStore();

	if (!activeThreadCommentId) {
		return null;
	}

	return <CommentThread commentId={activeThreadCommentId} />;
};

type CommentThreadType = ReturnType<typeof useCommentThread>["data"];

const CommentThread = ({ commentId }: { commentId: string }) => {
	const { data: comment, isLoading } = useCommentThread(commentId);

	return (
		<div className="flex max-h-[60dvh] w-full flex-col overflow-hidden">
			<AiCommentThreadInner comment={comment} isLoading={isLoading} />
		</div>
	);
};

export const AiCommentThreadInner = ({ comment, isLoading }: { comment: CommentThreadType; isLoading: boolean }) => {
	const threadRef = useRef<HTMLDivElement>(null);

	const isAnyLoading = isLoading || comment?.is_thread_loading;

	// Add this useEffect to scroll to bottom when comments change
	useEffect(() => {
		if (threadRef.current) {
			threadRef.current.scrollTo({
				top: threadRef.current.scrollHeight,
				behavior: "smooth",
			});
		}
	}, [comment?.thought_chat_threads]);

	return (
		<div ref={threadRef} className="no-scrollbar flex w-full flex-col gap-2 overflow-y-auto">
			{comment ? (
				<>
					<ThreadComment
						threadCommentId={comment.id}
						role={comment.role as "user" | "assistant"}
						content={comment.content!}
						createdAt={comment.created_at}
						appliedSuggestionHashes={[]}
						status="done"
					/>
					{comment.thought_chat_threads.map((threadComment, i, arr) => (
						<ThreadComment
							key={threadComment.id}
							threadCommentId={threadComment.id}
							role={threadComment.role as "user" | "assistant"}
							content={threadComment.content!}
							createdAt={threadComment.created_at}
							appliedSuggestionHashes={threadComment.applied_suggestion_hashes}
							status={threadComment.status as "pending" | "done"}
						/>
					))}
					{isAnyLoading && (
						<div className="flex size-12 items-center justify-center rounded bg-background p-3">
							<LoadingSpinner size="xs" />
						</div>
					)}
				</>
			) : isLoading ? (
				<div className="flex w-full items-center justify-center p-4">
					<LoadingSpinner size="sm" />
				</div>
			) : null}
		</div>
	);
};

const ThreadComment = ({
	threadCommentId,
	role,
	content,
	createdAt,
	appliedSuggestionHashes,
	status,
}: {
	threadCommentId: string;
	role: "user" | "assistant";
	content: string;
	appliedSuggestionHashes: string[];
	createdAt: string;
	status: "pending" | "done";
}) => {
	return (
		<div className="flex flex-col gap-2 rounded bg-background p-3 text-sm outline-offset-2 animate-in fade-in slide-in-from-top-4 fill-mode-forwards hover:outline-accent/40">
			<div className="flex flex-row items-center justify-between gap-1">
				<div className="flex flex-row items-center gap-1">
					{role === "user" ? (
						<UserIcon className="h-4 w-4 text-secondary" />
					) : (
						<SparklesIcon className="h-4 w-4 text-accent" />
					)}
					<span className="text-xs font-medium text-secondary">{role === "user" ? "You" : "Cloudy"}</span>
				</div>
				<div className="text-xs text-secondary">{makeHumanizedTime(createdAt)}</div>
			</div>
			<div>
				<ThreadCommentContext.Provider value={{ status, appliedSuggestionHashes, threadCommentId }}>
					<Markdown
						components={{
							pre: SuggestionContent,
						}}>
						{content}
					</Markdown>
				</ThreadCommentContext.Provider>
			</div>
		</div>
	);
};

export const ThreadCommentContext = createContext<{
	status: "pending" | "done";
	threadCommentId: string;
	appliedSuggestionHashes: string[];
}>({
	threadCommentId: "",
	appliedSuggestionHashes: [],
	status: "pending",
});
