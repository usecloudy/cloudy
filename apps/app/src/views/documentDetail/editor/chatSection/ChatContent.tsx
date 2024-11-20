/* eslint-disable @typescript-eslint/no-unused-vars */
import { ChatRole, makeHumanizedTime } from "@cloudy/utils/common";
import { ArrowUpIcon, SparklesIcon, UserIcon } from "lucide-react";
import { useContext, useRef } from "react";
import { useEffect } from "react";
import Markdown from "react-markdown";
import { usePrevious } from "react-use";

import { Button } from "src/components/Button";
import LoadingSpinner from "src/components/LoadingSpinner";
import { Avatar } from "src/components/users/Avatar";
import { useUserProfile } from "src/utils/users";

import { ThoughtContext } from "../thoughtContext";
import { ChatMessageUserHeader } from "./ChatMessageUserHeader";
import { SuggestionContent } from "./SuggestionContent";
import { ChatMessageContext, UseChatThreadReturnType } from "./chat";

export const ChatContent = ({ chatThread, isAnyLoading }: { chatThread: UseChatThreadReturnType; isAnyLoading?: boolean }) => {
	const { setThreadId } = useContext(ThoughtContext);

	const threadRef = useRef<HTMLDivElement>(null);

	const prevNumOfMessages = usePrevious(chatThread.messages.length ?? 0);

	// Add this useEffect to scroll to bottom when comments change
	useEffect(() => {
		if (threadRef.current && prevNumOfMessages !== chatThread.messages.length) {
			threadRef.current.scrollTo({
				top: threadRef.current.scrollHeight,
				behavior: "smooth",
			});
		}
	}, [chatThread?.messages, prevNumOfMessages]);

	return (
		<div ref={threadRef} className="no-scrollbar relative flex h-full w-full flex-col gap-2 overflow-y-auto">
			<div className="sticky top-0 z-40 flex flex-row items-center justify-center px-4 py-2">
				<Button variant="outline" size="sm" onClick={() => setThreadId(null)} className="bg-background">
					<ArrowUpIcon className="size-4" />
					<span>Exit thread</span>
				</Button>
			</div>
			{chatThread.messages?.map(message => <ChatMessage key={message.id} message={message} />)}
			{isAnyLoading && (
				<div className="flex size-12 items-center justify-center rounded bg-background p-3">
					<LoadingSpinner size="xs" />
				</div>
			)}
		</div>
	);
};

type ChatMessageProps = {
	message: UseChatThreadReturnType["messages"][number];
};

const ChatMessage = ({ message }: ChatMessageProps) => {
	const isLoading = message.role === ChatRole.Assistant && !message.completed_at;

	return (
		<div className="flex flex-col gap-2 rounded bg-background p-3 text-sm outline-offset-2 animate-in fade-in slide-in-from-top-4 fill-mode-forwards hover:outline-accent/40">
			<div className="flex flex-row items-center justify-between gap-1">
				{message.role === ChatRole.User && message.user_id ? (
					<ChatMessageUserHeader userId={message.user_id} />
				) : (
					<div className="flex flex-row items-center gap-1">
						<SparklesIcon className="h-4 w-4 text-accent" />
						<span className="text-xs font-medium text-secondary">Cloudy</span>
						{isLoading && <LoadingSpinner size="xs" />}
					</div>
				)}
				<div className="text-xs text-secondary">{makeHumanizedTime(message.created_at)}</div>
			</div>
			<div>
				<ChatMessageContext.Provider value={{ message }}>
					<Markdown
						className="tiptap"
						components={{
							pre: SuggestionContent,
						}}>
						{message.content}
					</Markdown>
				</ChatMessageContext.Provider>
			</div>
		</div>
	);
};
