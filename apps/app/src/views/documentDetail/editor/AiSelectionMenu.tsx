import { RepoReference } from "@cloudy/utils/common";
import { FloatingFocusManager, offset, shift, useFloating } from "@floating-ui/react";
import { SparklesIcon } from "lucide-react";
import { useEffect } from "react";
import { useContext, useRef } from "react";
import { useMount } from "react-use";

import { AiTextArea } from "src/views/aiTextArea/AiTextArea";

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

	// useEffect(() => {
	// 	const floating = refs.floating.current;
	// 	if (!floating) return;

	// 	const isElementInViewport = (el: HTMLElement) => {
	// 		const rect = el.getBoundingClientRect();
	// 		return (
	// 			rect.top >= 0 &&
	// 			rect.left >= 0 &&
	// 			rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
	// 			rect.right <= (window.innerWidth || document.documentElement.clientWidth)
	// 		);
	// 	};

	// 	if (!isElementInViewport(floating)) {
	// 		floating.scrollIntoView({ behavior: "smooth", block: "nearest" });
	// 	}
	// }, [refs.floating]);

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
				className="z-50 flex w-[32rem] flex-col gap-0.5 rounded-md border border-border bg-background px-2 py-2">
				<div className="flex flex-row items-center gap-1 pb-1 pl-2 pt-1">
					<SparklesIcon className="h-4 w-4 text-accent" />
					<span className="text-sm font-medium">Ask Cloudy</span>
				</div>
				<div className="flex flex-row items-end gap-1 px-2">
					<AiTextArea
						onSubmit={threadId ? handleReply : handleSubmit}
						onCancel={onCancel}
						secondaryButtonText="New thread"
						onSecondaryAction={threadId ? handleSubmit : undefined}
						submitButtonText={threadId ? "Ask in thread" : "New thread"}
						existingLinkedFiles={existingLinkedFiles}
						showConnectTooltip
						addButtonText="Files"
					/>
				</div>
			</div>
		</FloatingFocusManager>
	);
};
