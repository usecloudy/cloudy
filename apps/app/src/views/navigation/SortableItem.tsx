import { AccessStrategies, FlattenedItem } from "@cloudy/utils/common";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import {
	ChevronDownIcon,
	ChevronRightIcon,
	FileIcon,
	FileLock2Icon,
	FilePenLineIcon,
	FolderIcon,
	FolderOpenIcon,
	GlobeIcon,
	MoreHorizontalIcon,
	PencilIcon,
	TrashIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { Button } from "src/components/Button";
import { cn } from "src/utils";
import { useDeleteItem, useRenameItem } from "src/utils/folders";
import { useClickOutside } from "src/utils/hooks/useClickOutside";

type SortableItemProps = {
	item: FlattenedItem;
	expanded: boolean;
	toggleFolder: (id: string) => void;
	isOverlay?: boolean;
	isOverFolder?: boolean;
	hasAfterDroppable?: boolean;
	isInLibrary?: boolean;
	navigateToDoc?: (id: string) => void;
};

export const SortableItem = ({
	item,
	expanded,
	toggleFolder,
	navigateToDoc,
	isOverlay = false,
	isOverFolder = false,
	hasAfterDroppable = false,
	isInLibrary = false,
}: SortableItemProps) => {
	const location = useLocation();

	const renameItemMutation = useRenameItem();
	const deleteItemMutation = useDeleteItem();

	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editedName, setEditedName] = useState(item.name ?? "");

	const {
		attributes,
		listeners,
		setNodeRef: sortableRef,
		transition,
		isDragging,
	} = useSortable({
		id: item.id,
		data: { isInLibrary, type: item.type },
		disabled: isEditing, // Add this line to disable dragging while editing
	});

	const { isOver: isOverBefore, setNodeRef: droppableBeforeRef } = useDroppable({ id: `before:${item.id}` });
	const { isOver, setNodeRef: droppableRef } = useDroppable({
		id: item.id,
	});
	const { isOver: isOverAfter, setNodeRef: droppableAfterRef } = useDroppable({ id: `after:${item.id}` });

	const inputRef = useRef<HTMLInputElement>(null);

	const setBeforeRefs = (node: HTMLElement | null) => {
		droppableBeforeRef(node);
	};

	const setRefs = (node: HTMLElement | null) => {
		sortableRef(node);
		if (item.type === "folder") {
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

	useEffect(() => {
		if (isEditing) {
			inputRef.current?.focus();
			inputRef.current?.select();
		}
	}, [isEditing]);

	const handleDoubleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		setIsEditing(true);
		setEditedName(item.name ?? "");
	};

	const handleSubmit = () => {
		if (editedName !== item.name) {
			renameItemMutation.mutate({ id: item.id, name: editedName ? editedName.trim() : "", type: item.type });
		}
		setIsEditing(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSubmit();
		} else if (e.key === "Escape") {
			setIsEditing(false);
			setEditedName(item.name ?? "");
		}
	};

	const isCurrentlyOpen = location.pathname.includes(item.id);

	return (
		<li style={style} className="list-none">
			{isInLibrary && (
				<div ref={setBeforeRefs} className="pointer-events-none -my-4 flex h-8 flex-col justify-center">
					{isOverBefore && <div className="h-0.5 bg-border" style={{ marginLeft: `${item.depth * 16 + 8}px` }} />}
				</div>
			)}
			<div
				ref={setRefs}
				className={cn(
					"group/item relative flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-sm",
					isDragging ? "bg-transparent" : "hover:bg-card",
					isOver ? "bg-card" : undefined,
					isEditing ? "cursor-text" : undefined, // Add cursor-text when editing
					isCurrentlyOpen ? "bg-card" : undefined,
				)}
				style={{ paddingLeft: `${item.depth * 1.33 + 0.5}rem` }}
				onClick={() => {
					if (!isEditing) {
						// Only handle clicks when not editing
						if (item.type === "folder" && !isDragging) {
							toggleFolder(item.id);
						} else {
							navigateToDoc?.(item.id);
						}
					}
				}}
				{...(!isOverlay && !isEditing ? { ...attributes, ...listeners } : {})} // Only spread drag listeners if not editing
			>
				{item.type === "folder" && (
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
				{item.type === "document" && (
					<>
						{item.isPublished ? (
							<>
								{item.accessStrategy === AccessStrategies.PRIVATE ? (
									<FileLock2Icon className="size-4 shrink-0" />
								) : item.accessStrategy === AccessStrategies.PUBLIC ? (
									<GlobeIcon className="size-4 shrink-0" />
								) : (
									<FileIcon className="size-4 shrink-0" />
								)}
							</>
						) : (
							<FilePenLineIcon className="size-4 shrink-0" />
						)}
					</>
				)}

				{isEditing ? (
					<input
						ref={inputRef}
						type="text"
						value={editedName}
						onChange={e => setEditedName(e.target.value)}
						onBlur={handleSubmit}
						onKeyDown={handleKeyDown}
						onClick={e => e.stopPropagation()}
						className="flex-1 rounded border border-border bg-background px-1 py-0.5 text-sm focus:outline-none focus:ring-0"
						autoFocus
					/>
				) : (
					<span className={cn("flex-1 truncate", !item.name && "text-secondary")} onDoubleClick={handleDoubleClick}>
						{item.name || "Untitled"}
					</span>
				)}
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
				<SortableItemDropdown
					isOpen={isDropdownOpen}
					setIsOpen={setIsDropdownOpen}
					onStartEditing={() => {
						setIsEditing(true);
						setEditedName(item.name ?? "");
					}}
					onDelete={() => deleteItemMutation.mutate({ id: item.id, type: item.type })}
				/>
			</div>
			{isInLibrary && hasAfterDroppable && (
				<div ref={setAfterRefs} className="pointer-events-none -my-4 flex h-8 flex-col justify-center">
					{isOverAfter && <div className="h-0.5 bg-border" style={{ marginLeft: `${item.depth * 16 + 8}px` }} />}
				</div>
			)}
		</li>
	);
};

const SortableItemDropdown = ({
	isOpen,
	setIsOpen,
	onStartEditing,
	onDelete,
}: {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	onStartEditing: () => void;
	onDelete: () => void;
}) => {
	const dropdownRef = useClickOutside(() => {
		setIsOpen(false);
	});

	if (!isOpen) return null;

	return (
		<div className="absolute bottom-0 left-0 h-0 w-full">
			<div
				ref={dropdownRef}
				className="absolute top-0 z-20 flex w-full flex-col rounded border border-border bg-background p-1">
				<SortableItemDropdownItem
					onClick={() => {
						setIsOpen(false);
						onStartEditing();
					}}>
					<PencilIcon className="mr-2 size-4" />
					Rename
				</SortableItemDropdownItem>
				<SortableItemDropdownItem
					onClick={() => {
						setIsOpen(false);
						onDelete();
					}}>
					<TrashIcon className="mr-2 size-4" />
					Delete
				</SortableItemDropdownItem>
			</div>
		</div>
	);
};

const SortableItemDropdownItem = ({
	children,
	...props
}: { children: React.ReactNode } & React.ComponentProps<typeof Button>) => {
	return (
		<Button
			size="sm"
			variant="ghost"
			className="w-full justify-start rounded-sm text-sm hover:bg-card hover:text-primary"
			{...props}>
			{children}
		</Button>
	);
};
