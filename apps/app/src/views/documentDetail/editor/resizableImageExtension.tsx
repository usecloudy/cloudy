// Inspired/plagiarized from
// https://github.com/ueberdosis/tiptap/issues/333#issuecomment-1056434177
import TipTapImage from "@tiptap/extension-image";
import { type NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { MoveDiagonal2Icon } from "lucide-react";
import { type CSSProperties, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const useEvent = <T extends (...args: any[]) => any>(handler: T): T => {
	const handlerRef = useRef<T | null>(null);

	useLayoutEffect(() => {
		handlerRef.current = handler;
	}, [handler]);

	return useCallback((...args: Parameters<T>): ReturnType<T> => {
		if (handlerRef.current === null) {
			throw new Error("Handler is not assigned");
		}
		return handlerRef.current(...args);
	}, []) as T;
};

const MIN_WIDTH = 60;

const ResizableImageTemplate = ({ node, updateAttributes }: NodeViewProps) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const imgRef = useRef<HTMLImageElement>(null);
	const [editing, setEditing] = useState(false);
	const [resizingStyle, setResizingStyle] = useState<Pick<CSSProperties, "width"> | undefined>();

	// Lots of work to handle "not" div click events.
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setEditing(false);
			}
		};
		// Add click event listener and remove on cleanup
		document.addEventListener("click", handleClickOutside);
		return () => {
			document.removeEventListener("click", handleClickOutside);
		};
	}, [editing]);

	const handleMouseDown = useEvent((event: React.MouseEvent<HTMLDivElement>) => {
		if (!imgRef.current) return;
		event.preventDefault();
		const direction = event.currentTarget.dataset.direction || "--";
		const initialXPosition = event.clientX;
		const currentWidth = imgRef.current.width;
		let newWidth = currentWidth;
		const transform = direction[1] === "w" ? -1 : 1;

		const removeListeners = () => {
			window.removeEventListener("mousemove", mouseMoveHandler);
			window.removeEventListener("mouseup", removeListeners);
			updateAttributes({ width: newWidth });
			setResizingStyle(undefined);
		};

		const mouseMoveHandler = (event: MouseEvent) => {
			newWidth = Math.max(currentWidth + transform * (event.clientX - initialXPosition), MIN_WIDTH);
			setResizingStyle({ width: newWidth });
			// If mouse is up, remove event listeners
			if (!event.buttons) removeListeners();
		};

		window.addEventListener("mousemove", mouseMoveHandler);
		window.addEventListener("mouseup", removeListeners);
	});

	const dragCornerButton = (direction: string) => (
		<div
			role="button"
			tabIndex={0}
			onMouseDown={handleMouseDown}
			data-direction={direction}
			className="size-[20px] translate-x-[7px] translate-y-[7px] cursor-grab rounded-sm border-2 border-accent bg-background text-accent hover:bg-accent hover:text-background active:cursor-grabbing active:bg-accent/60 active:text-background"
			style={{
				position: "absolute",
				...{ n: { top: 0 }, s: { bottom: 0 } }[direction[0]],
				...{ w: { left: 0 }, e: { right: 0 } }[direction[1]],
			}}>
			<MoveDiagonal2Icon className="size-[16px]" />
		</div>
	);

	return (
		<NodeViewWrapper
			ref={containerRef}
			as="div"
			draggable
			data-drag-handle
			onClick={() => setEditing(true)}
			onBlur={() => setEditing(false)}
			style={{
				position: "relative",
				display: "inline-block",
				// Weird! Basically tiptap/prose wraps this in a span and the line height causes an annoying buffer.
				lineHeight: "0px",
			}}>
			<img
				{...node.attrs}
				ref={imgRef}
				style={{
					...resizingStyle,
					cursor: "default",
				}}
			/>
			{editing && (
				<>
					{/* Don't use a simple border as it pushes other content around. */}
					{[
						{ left: 0, top: 0, height: "100%", width: "1px" },
						{ right: 0, top: 0, height: "100%", width: "1px" },
						{ top: 0, left: 0, width: "100%", height: "1px" },
						{ bottom: 0, left: 0, width: "100%", height: "1px" },
					].map((style, i) => (
						<div key={i} className="bg-accent/40" style={{ position: "absolute", ...style }}></div>
					))}
					{dragCornerButton("se")}
				</>
			)}
		</NodeViewWrapper>
	);
};

const ResizableImageExtension = TipTapImage.extend({
	addAttributes() {
		return {
			...this.parent?.(),
			width: { renderHTML: ({ width }) => ({ width }) },
			height: { renderHTML: ({ height }) => ({ height }) },
		};
	},
	addNodeView() {
		return ReactNodeViewRenderer(ResizableImageTemplate);
	},
}).configure({ inline: true });

export default ResizableImageExtension;
