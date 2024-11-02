import { RepoReference } from "@cloudy/utils/common";
import { FloatingFocusManager, offset, shift, useFloating } from "@floating-ui/react";
import { SparklesIcon } from "lucide-react";
import { useEffect } from "react";
import { useContext, useRef } from "react";
import { useMount } from "react-use";

import { Button } from "src/components/Button";
import LoadingSpinner from "src/components/LoadingSpinner";

import { AiTextArea } from "../aiTextArea/AiTextArea";
import { useReplyToThread, useStartThread } from "./chatSection/chat";
import { useExistingLinkedFiles } from "./hooks";
import { ThoughtContext } from "./thoughtContext";

export const AiSelectionMenu = ({
	onCancel,
	onClose,
}: {
	onCancel: (isSelectionEvent?: boolean) => void;
	onClose: () => void;
}) => {
	const { editor, threadId, setThreadId, thoughtId, showAiEditor } = useContext(ThoughtContext);

	const { data: existingLinkedFiles } = useExistingLinkedFiles(thoughtId);

	const startThreadMutation = useStartThread();
	const replyToThreadMutation = useReplyToThread();

	const { refs, floatingStyles, context } = useFloating({
		open: true,
		placement: "bottom",
		middleware: [offset(10), shift()],
	});

	const textAreaRef = useRef<HTMLTextAreaElement>(null);

	useMount(() => {
		refs.setPositionReference({
			// @ts-ignore
			getBoundingClientRect() {
				return document.querySelector("edit")?.getBoundingClientRect();
			},
		});
	});

	useEffect(() => {
		const handleSelectionUpdate = () => {
			onCancel(true);
		};

		editor?.on("selectionUpdate", handleSelectionUpdate);

		return () => {
			editor?.off("selectionUpdate", handleSelectionUpdate);
		};
	}, [editor, onCancel]);

	const handleSubmit = async (text: string, fileReferences: RepoReference[]) => {
		const thread = await startThreadMutation.mutateAsync({ content: text, fileReferences });

		onClose();

		showAiEditor();
		setThreadId(thread.id);
	};

	const handleReply = async (text: string, fileReferences: RepoReference[]) => {
		if (!threadId) {
			throw new Error("Thread ID is not set");
		}

		await replyToThreadMutation.mutateAsync({ threadId, content: text, fileReferences });

		onClose();
	};

	return (
		<FloatingFocusManager context={context} initialFocus={textAreaRef}>
			<div
				ref={refs.setFloating}
				style={floatingStyles}
				className="z-50 flex w-[28rem] flex-col gap-0.5 rounded-md border border-border bg-background px-2 py-2">
				<div className="flex flex-row items-center gap-1 pb-1 pl-2 pt-1">
					<SparklesIcon className="h-4 w-4 text-accent" />
					<span className="text-sm font-medium">Ask Cloudy</span>
				</div>
				<div className="flex flex-row items-end gap-1 px-2">
					<AiTextArea
						onSubmit={threadId ? handleReply : handleSubmit}
						onCancel={onCancel}
						secondaryButtonText="Start new thread"
						onSecondaryAction={threadId ? handleSubmit : undefined}
						submitButtonText={threadId ? "Ask in thread" : "Start new thread"}
						disableNewFileReference
						existingLinkedFiles={existingLinkedFiles}
					/>
				</div>
			</div>
		</FloatingFocusManager>
	);
};
