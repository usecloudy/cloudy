import { Editor } from "@tiptap/react";
import { CircleIcon, MessageCircleIcon } from "lucide-react";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";

import { Button } from "src/components/Button";
import { cn } from "src/utils";
import { processSearches } from "src/utils/tiptapSearchAndReplace";

import { useComments } from "./hooks";
import { useThoughtStore } from "./thoughtStore";

type Comment = ReturnType<typeof useComments>["data"][number];

export const CommentColumn = (props: { editor: Editor | null; thoughtId?: string; isHighlightingRef: RefObject<boolean> }) => {
	if (!props.thoughtId || !props.editor) return null;

	return <CommentColumnInner thoughtId={props.thoughtId} editor={props.editor} isHighlightingRef={props.isHighlightingRef} />;
};

const CommentColumnInner = ({
	thoughtId,
	editor,
	isHighlightingRef,
}: {
	thoughtId: string;
	editor: Editor;
	isHighlightingRef: RefObject<boolean>;
}) => {
	const { data: comments } = useComments(thoughtId);
	const { commentFilter, setCommentFilter } = useThoughtStore();

	const [commentsWithOffset, setCommentsWithOffset] = useState<{ comments: Comment[]; offset: number }[]>([]);

	const containerRef = useRef<HTMLDivElement>(null);

	const [windowWidth, setWindowWidth] = useState(window.innerWidth);

	const handleResize = useCallback(() => {
		setWindowWidth(window.innerWidth);
	}, []);

	useEffect(() => {
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [handleResize]);

	useEffect(() => {
		if (isHighlightingRef.current) return;

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
	}, [comments, editor, editor.state.doc, isHighlightingRef, windowWidth]);

	return (
		<div
			className={cn("h-full w-16 relative -mr-6 md:mr-0", commentsWithOffset.length === 0 && "hidden md:block")}
			ref={containerRef}>
			{commentsWithOffset.map(({ offset, comments }) => {
				const isSelected = commentFilter?.selectedGroupId === offset.toString();
				const hasUnreadComments = comments.some(comment => !comment.is_seen); // Add this line

				return (
					<div key={offset} style={{ top: offset }} className="absolute left-0 w-12 -mt-1">
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
							className={cn("px-2 relative", isSelected && "bg-accent/80 text-background")}>
							<MessageCircleIcon className="w-5 h-5" />
							<span className="text-xs">{comments.length}</span>
							{hasUnreadComments && (
								<CircleIcon className="absolute top-1 right-0.5 w-2 h-2 text-accent fill-current" />
							)}
						</Button>
					</div>
				);
			})}
		</div>
	);
};
