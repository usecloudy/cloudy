import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDownIcon, ChevronRightIcon, FileIcon, FolderIcon, FolderOpenIcon, MoreHorizontalIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useEditable } from "use-editable";

import { Button } from "src/components/Button";
import { Dropdown, DropdownItem } from "src/components/Dropdown";
import { cn } from "src/utils";
import { useClickOutside } from "src/utils/hooks/useClickOutside";

type SortableItemProps = {
	id: string;
	depth: number;
	type: "folder" | "document";
	name: string;
	expanded: boolean;
	toggleFolder: (id: string) => void;
	isOverlay?: boolean;
	isOverFolder?: boolean;
	hasAfterDroppable?: boolean;
	isInLibrary?: boolean;
	navigateToDoc?: (id: string) => void;
};

export const SortableItem = ({
	id,
	depth,
	type,
	name,
	expanded,
	toggleFolder,
	navigateToDoc,
	isOverlay = false,
	isOverFolder = false,
	hasAfterDroppable = false,
	isInLibrary = false,
}: SortableItemProps) => {
	const {
		attributes,
		listeners,
		setNodeRef: sortableRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id, data: { isInLibrary } });

	const { isOver: isOverBefore, setNodeRef: droppableBeforeRef } = useDroppable({ id: `before:${id}` });
	const { isOver, setNodeRef: droppableRef } = useDroppable({
		id,
	});
	const { isOver: isOverAfter, setNodeRef: droppableAfterRef } = useDroppable({ id: `after:${id}` });

	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	const setBeforeRefs = (node: HTMLElement | null) => {
		droppableBeforeRef(node);
	};

	const setRefs = (node: HTMLElement | null) => {
		sortableRef(node);
		if (type === "folder") {
			droppableRef(node);
		}
	};

	const setAfterRefs = (node: HTMLElement | null) => {
		droppableAfterRef(node);
	};

	const style = isOverlay
		? {}
		: {
				transition,
				opacity: isDragging ? 0.5 : 1,
				backgroundColor: isOverFolder ? "#f0f0f0" : undefined, // Highlight folder on hover
			};

	const dropdownRef = useClickOutside(() => {
		setIsDropdownOpen(false);
	});

	return (
		<li style={style} className="list-none">
			<div ref={setBeforeRefs} className="pointer-events-none -my-4 flex h-8 flex-col justify-center">
				{isOverBefore && <div className="h-0.5 bg-border" style={{ marginLeft: `${depth * 16 + 8}px` }} />}
			</div>
			<div
				ref={setRefs}
				className={cn(
					"group/item relative flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-sm",
					isDragging ? "bg-transparent" : "hover:bg-card",
					isOver ? "bg-card" : undefined,
				)}
				style={{ paddingLeft: `${depth * 1.33 + 0.5}rem` }}
				onClick={() => {
					if (type === "folder" && !isDragging) {
						toggleFolder(id);
					} else if (type === "document") {
						navigateToDoc?.(id);
					}
				}}
				{...(!isOverlay ? { ...attributes, ...listeners } : {})}>
				{type === "folder" && (
					<>
						{expanded ? (
							<>
								<FolderOpenIcon className="size-4 shrink-0 group-hover/item:hidden" />
								<ChevronDownIcon className="hidden size-4 shrink-0 group-hover/item:block" />
							</>
						) : (
							<>
								<FolderIcon className="size-4 shrink-0 group-hover/item:hidden" />
								<ChevronRightIcon className="hidden size-4 shrink-0 group-hover/item:block" />
							</>
						)}
					</>
				)}
				{type === "document" && <FileIcon className="size-4 shrink-0" />}
				<span className="flex-1 truncate">{name || "Untitled"}</span>
				<Button
					variant="ghost"
					size="icon-xs-overflow"
					className="relative hidden size-5 shrink-0 rounded-sm hover:bg-border hover:text-accent group-hover/item:flex group-hover:flex"
					onClick={e => {
						e.stopPropagation();
						setIsDropdownOpen(true);
					}}>
					<MoreHorizontalIcon className="size-4" />
				</Button>
				{isDropdownOpen && (
					<div className="absolute bottom-0 left-0 h-0 w-full">
						<div
							ref={dropdownRef}
							className="absolute top-0 z-20 flex w-full flex-col rounded border border-border bg-background p-1">
							<Button size="sm" variant="ghost" className="justify-start">
								Rename
							</Button>
							<Button size="sm" variant="ghost" className="justify-start">
								Delete
							</Button>
						</div>
					</div>
				)}
			</div>
			{hasAfterDroppable && (
				<div ref={setAfterRefs} className="pointer-events-none -my-4 flex h-8 flex-col justify-center">
					{isOverAfter && <div className="h-0.5 bg-border" style={{ marginLeft: `${depth * 16 + 8}px` }} />}
				</div>
			)}
		</li>
	);
};
