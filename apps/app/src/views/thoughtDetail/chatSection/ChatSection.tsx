import { ChatRole, RepoReference, makeHumanizedTime } from "@cloudy/utils/common";
import { ArrowUpIcon, MoreHorizontalIcon, TrashIcon } from "lucide-react";
import { useContext, useEffect, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";

import { Button } from "src/components/Button";
import { Dropdown, DropdownItem } from "src/components/Dropdown";
import LoadingSpinner from "src/components/LoadingSpinner";
import { cn } from "src/utils";

import { AiTextArea } from "../../aiTextArea/AiTextArea";
import { useExistingLinkedFiles } from "../hooks";
import { ThoughtContext } from "../thoughtContext";
import { ChatContent } from "./ChatContent";
import { ChatMessageUserHeader } from "./ChatMessageUserHeader";
import {
	UseThreadsForDocReturnType,
	useChatThread,
	useDeleteThread,
	useReplyToThread,
	useStartThread,
	useThreadsForDoc,
} from "./chat";

export const ChatSection = () => {
	const { editor, hideAiEditor, thoughtId, threadId, setThreadId } = useContext(ThoughtContext);

	const { data: existingLinkedFiles } = useExistingLinkedFiles(thoughtId);

	const startThreadMutation = useStartThread();
	const replyToThreadMutation = useReplyToThread();

	const { data: threadsForDoc } = useThreadsForDoc(thoughtId);
	const { data: thread } = useChatThread(threadId);

	const textAreaRef = useRef<HTMLTextAreaElement>(null);

	const handleOnCancel = () => {
		hideAiEditor();
	};

	const handleSubmit = async (text: string, fileReferences: RepoReference[]) => {
		if (threadId) {
			await replyToThreadMutation.mutateAsync({ threadId, content: text, fileReferences });
		} else {
			await handleStartThread(text, fileReferences);
		}
	};

	const handleStartThread = async (text: string, fileReferences: RepoReference[]) => {
		if (!editor) {
			throw new Error("Editor is not initialized");
		}

		const { id } = await startThreadMutation.mutateAsync({ content: text, fileReferences });
		setThreadId(id);
	};

	useHotkeys("esc", () => handleOnCancel());

	useEffect(() => {
		// For some reason, autofocus doesn't work and we have to manually focus the text area
		textAreaRef.current?.focus();
	}, []);

	const isThreadLoading = thread?.messages.some(message => message.role === ChatRole.Assistant && !message.completed_at);

	return (
		<div className="flex w-full flex-1 flex-col overflow-hidden">
			{thread && (
				<div className="flex flex-row items-center justify-center px-4 py-2">
					<Button variant="outline" size="sm" onClick={() => setThreadId(null)}>
						<ArrowUpIcon className="size-4" />
						<span>Exit thread</span>
					</Button>
				</div>
			)}
			<div className="flex flex-1 items-center justify-center overflow-hidden px-4">
				{thread ? (
					<ChatContent chatThread={thread} />
				) : threadsForDoc ? (
					<div className="no-scrollbar flex h-full w-full flex-col gap-2 overflow-y-auto py-4">
						<div className="flex flex-row items-center justify-between">
							<h3 className="text-lg font-semibold">Recent Threads</h3>
						</div>
						{threadsForDoc.length === 0 ? (
							<div className="flex flex-col items-center justify-center gap-y-2 text-secondary">
								<p>No chat threads yet</p>
								<p>Start a new conversation below</p>
							</div>
						) : (
							threadsForDoc.map(thread => (
								<ThreadButton key={thread.id} thread={thread} setThreadId={setThreadId} />
							))
						)}
					</div>
				) : (
					<LoadingSpinner />
				)}
			</div>
			<div className={cn("w-full border-t border-border px-4 py-4", isThreadLoading && "pointer-events-none opacity-70")}>
				<AiTextArea
					onSubmit={handleSubmit}
					onCancel={handleOnCancel}
					existingLinkedFiles={existingLinkedFiles}
					disableNewFileReference
					placeholder="Ask a question or describe the change you want to make"
					submitButtonText={threadId ? "Reply in thread" : "Start new thread"}
				/>
			</div>
		</div>
	);
};

const ThreadButton = ({
	thread,
	setThreadId,
}: {
	thread: UseThreadsForDocReturnType[number];
	setThreadId: (id: string) => void;
}) => {
	const deleteThreadMutation = useDeleteThread(thread.id);

	const firstMessage = thread.first_message[0];

	return (
		<button
			key={thread.id}
			onClick={e => {
				// Only set thread ID if not clicking dropdown item
				if (!(e.target as HTMLElement).closest(".dropdown-item")) {
					setThreadId(thread.id);
				}
			}}
			className="flex w-full flex-row items-start justify-between gap-x-2 rounded-lg border border-border p-4 text-left hover:bg-card">
			{firstMessage && (
				<div className="flex flex-1 flex-col pt-0.5">
					{firstMessage.role === ChatRole.User && firstMessage.user_id && (
						<ChatMessageUserHeader userId={firstMessage.user_id} />
					)}
					<div className="line-clamp-2 text-sm">{firstMessage.content || "Empty thread"}</div>
				</div>
			)}
			<div className="flex flex-row items-center justify-between gap-x-2">
				<div className="shrink-0 text-xs text-secondary">{makeHumanizedTime(thread.created_at)}</div>
				<Dropdown
					trigger={
						<Button variant="ghost" size="icon-xs" className="text-secondary">
							<MoreHorizontalIcon className="size-4" />
						</Button>
					}>
					<DropdownItem
						className="dropdown-item"
						onSelect={() => {
							deleteThreadMutation.mutate();
						}}>
						<TrashIcon className="size-4" />
						<span>Delete thread</span>
					</DropdownItem>
				</Dropdown>
			</div>
		</button>
	);
};
