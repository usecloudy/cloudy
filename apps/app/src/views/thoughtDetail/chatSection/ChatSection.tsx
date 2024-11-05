import { ChatRole, RepoReference } from "@cloudy/utils/common";
import { useContext, useEffect, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";

import { cn } from "src/utils";

import { AiTextArea } from "../../aiTextArea/AiTextArea";
import { useExistingLinkedFiles } from "../hooks";
import { ThoughtContext } from "../thoughtContext";
import { ChatContent } from "./ChatContent";
import { ChatHomeView } from "./ChatHomeView";
import { useChatThread, useReplyToThread, useStartThread } from "./chat";

export const ChatSection = () => {
	const { editor, hideAiEditor, thoughtId, threadId, setThreadId } = useContext(ThoughtContext);

	const { data: existingLinkedFiles } = useExistingLinkedFiles(thoughtId);

	const startThreadMutation = useStartThread();
	const replyToThreadMutation = useReplyToThread();

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
			<div className="flex flex-1 items-center justify-center overflow-hidden px-4">
				{thread ? <ChatContent chatThread={thread} /> : <ChatHomeView />}
			</div>
			<div className={cn("w-full border-t border-border px-4 py-4", isThreadLoading && "pointer-events-none opacity-70")}>
				<AiTextArea
					onSubmit={handleSubmit}
					onCancel={handleOnCancel}
					existingLinkedFiles={existingLinkedFiles}
					placeholder="Ask a question or describe the change you want to make"
					submitButtonText={threadId ? "Reply in thread" : "Start new thread"}
					addButtonText="Files"
				/>
			</div>
		</div>
	);
};
