import { Editor } from "@tiptap/react";
import { CircleIcon, MessageCircleIcon } from "lucide-react";
import { RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { Button } from "src/components/Button";
import { cn } from "src/utils";
import { processSearches } from "src/utils/tiptapSearchAndReplace";

import { useComments } from "./hooks";
import { useThoughtStore } from "./thoughtStore";

type Comment = ReturnType<typeof useComments>["data"][number];

export const CommentColumn = (props: { editor: Editor | null; thoughtId?: string; disableUpdatesRef: RefObject<boolean> }) => {
	if (!props.thoughtId || !props.editor) return null;

	return <CommentColumnInner thoughtId={props.thoughtId} editor={props.editor} disableUpdatesRef={props.disableUpdatesRef} />;
};

const CommentColumnInner = ({
	thoughtId,
	editor,
	disableUpdatesRef,
}: {
	thoughtId: string;
	editor: Editor;
	disableUpdatesRef: RefObject<boolean>;
}) => {
	const { data: comments } = useComments(thoughtId);
	const { commentFilter, setCommentFilter } = useThoughtStore();

	const [commentsWithOffset, setCommentsWithOffset] = useState<{ comments: Comment[]; offset: number }[]>([]);

	const containerRef = useRef<HTMLDivElement>(null);

	const [windowWidth, setWindowWidth] = useState(window.innerWidth);
	const [resizeKey, setResizeKey] = useState(0);

	const handleResize = useCallback(() => {
		setWindowWidth(window.innerWidth);
	}, []);

	useEffect(() => {
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [handleResize]);

	useEffect(() => {
		setInterval(() => {
			setResizeKey(prev => prev + 1);
		}, 1000);
	}, []);

	useEffect(() => {
		if (disableUpdatesRef.current) return;

		let groupedComments: Record<string, { comments: Comment[]; offset: number }> = {};

		const activeComments = comments.filter(comment => !comment.is_archived);
		activeComments.forEach(comment => {
			const commentTarget = comment.related_chunks?.at(0) ?? null;
			if (!commentTarget) return 0;

			const ranges = processSearches(editor.state.doc, commentTarget);
			const range0 = ranges[0];

			if (!range0) return 0;

			let node = editor.view.nodeDOM(range0.pos);

			if (node?.parentElement) {
				const topOffset = node.parentElement.getBoundingClientRect().top;
				if (!groupedComments[topOffset]) {
					groupedComments[topOffset] = {
						comments: [],
						offset: node.parentElement.getBoundingClientRect().top,
					};
				}

				groupedComments[topOffset].comments.push(comment);
			}
		});

		const containerOffset = containerRef.current?.getBoundingClientRect()?.top ?? 0;

		const commentsWithOffset = Object.values(groupedComments).map(({ comments, offset }) => ({
			comments,
			offset: offset - containerOffset,
		}));

		setCommentsWithOffset(commentsWithOffset);
	}, [comments, editor, editor.state.doc, disableUpdatesRef, windowWidth, resizeKey]);

	return (
		<div
			className={cn("relative -mr-6 h-full w-14 md:mr-0 md:w-16", commentsWithOffset.length === 0 && "hidden md:block")}
			ref={containerRef}>
			{commentsWithOffset.map(({ offset, comments }) => {
				const isSelected = commentFilter?.selectedGroupId === offset.toString();
				const hasUnreadComments = comments.some(comment => !comment.is_seen); // Add this line

				return (
					<div key={offset} style={{ top: offset }} className="absolute left-0 -mt-1 w-12">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								if (isSelected) {
									setCommentFilter(null);
								} else {
									setCommentFilter({
										selectedGroupId: offset.toString(),
										commentIds: comments.map(c => c.id),
									});
								}
							}}
							className={cn("relative h-7 px-2", isSelected && "bg-accent/80 text-background")}>
							<MessageCircleIcon className="h-5 w-5" />
							<span className="text-xs">{comments.length}</span>
							{hasUnreadComments && (
								<CircleIcon className="absolute right-0.5 top-1 h-2 w-2 fill-current text-accent" />
							)}
						</Button>
					</div>
				);
			})}
		</div>
	);
};
