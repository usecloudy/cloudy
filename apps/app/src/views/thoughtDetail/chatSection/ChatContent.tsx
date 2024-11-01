/* eslint-disable @typescript-eslint/no-unused-vars */
import { ChatRole, makeHumanizedTime } from "@cloudy/utils/common";
import { SparklesIcon, UserIcon } from "lucide-react";
import { useRef } from "react";
import { useEffect } from "react";
import Markdown from "react-markdown";

import LoadingSpinner from "src/components/LoadingSpinner";
import { Avatar } from "src/components/users/Avatar";
import { useUserProfile } from "src/utils/users";

import { SuggestionContent } from "./SuggestionContent";
import { ChatMessageContext, UseChatThreadReturnType } from "./chat";

export const ChatContent = ({ chatThread, isAnyLoading }: { chatThread: UseChatThreadReturnType; isAnyLoading?: boolean }) => {
	const threadRef = useRef<HTMLDivElement>(null);

	// Add this useEffect to scroll to bottom when comments change
	useEffect(() => {
		if (threadRef.current) {
			threadRef.current.scrollTo({
				top: threadRef.current.scrollHeight,
				behavior: "smooth",
			});
		}
	}, [chatThread?.messages]);

	return (
		<div ref={threadRef} className="no-scrollbar flex h-full w-full flex-col gap-2 overflow-y-auto">
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
	const isLoading = message.role === ChatRole.Assistant && !message.completed_at && !message.content;

	return (
		<div className="flex flex-col gap-2 rounded bg-background p-3 text-sm outline-offset-2 animate-in fade-in slide-in-from-top-4 fill-mode-forwards hover:outline-accent/40">
			<div className="flex flex-row items-center justify-between gap-1">
				{message.role === ChatRole.User && message.user_id ? (
					<UserHeader userId={message.user_id} />
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

const UserHeader = ({ userId }: { userId: string }) => {
	const { data: userProfile } = useUserProfile(userId);

	return (
		<div className="flex flex-row items-center gap-1">
			<Avatar fallback={userProfile?.name ?? userProfile?.email} size="xs" />
			<div className="text-xs font-medium text-secondary">
				{userProfile?.name ?? userProfile?.email ?? "Unknown User"}
			</div>
		</div>
	);
};
