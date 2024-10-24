import {
	DndContext,
	DragOverlay,
	KeyboardSensor,
	Over,
	PointerSensor,
	rectIntersection,
	useDroppable,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { FolderPlusIcon, PlusIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "src/components/Button";
import { useWorkspace } from "src/stores/workspace";
import { cn } from "src/utils";
import {
	FlattenedItem,
	syncItemIndices,
	useCreateFolder,
	useLibraryItems,
	useMakeInitialLibrary,
	useMoveOutOfLibrary,
	useSetLibraryItems,
} from "src/utils/folders";
import { makeProjectDocUrl } from "src/utils/thought";

import { useProject } from "../projects/ProjectContext";
import { SortableItem } from "./SortableItem";

const findDescendantFolderIds = (items: FlattenedItem[], folderId: string): string[] => {
	const descendants: string[] = [];
	const stack = [folderId];

	while (stack.length > 0) {
		const currentId = stack.pop()!;
		const children = items.filter(item => item.parentId === currentId);

		for (const child of children) {
			if (child.type === "folder") {
				descendants.push(child.id);
				stack.push(child.id);
			}
		}
	}

	return descendants;
};

export const LibraryView = () => {
	// const [items, setItems] = useState<FlattenedItem[]>([
	// 	{
	// 		id: "1",
	// 		type: "folder",
	// 		name: "Folder 1",
	// 		depth: 0,
	// 		parentId: "<ROOT>",
	// 	},
	// 	{
	// 		id: "5",
	// 		type: "document",
	// 		name: "Document 4",
	// 		depth: 1,
	// 		parentId: "1",
	// 	},
	// 	{
	// 		id: "6",
	// 		type: "folder",
	// 		name: "Folder 2",
	// 		depth: 1,
	// 		parentId: "1",
	// 	},
	// 	{
	// 		id: "7",
	// 		type: "document",
	// 		name: "Document 5",
	// 		depth: 2,
	// 		parentId: "6",
	// 	},
	// 	{
	// 		id: "2",
	// 		type: "document",
	// 		name: "Document 1",
	// 		depth: 0,
	// 		parentId: "<ROOT>",
	// 	},
	// 	{
	// 		id: "3",
	// 		type: "document",
	// 		name: "Document 2",
	// 		depth: 0,
	// 		parentId: "<ROOT>",
	// 	},
	// 	{
	// 		id: "4",
	// 		type: "document",
	// 		name: "Document 3",
	// 		depth: 0,
	// 		parentId: "<ROOT>",
	// 	},
	// 	{
	// 		id: "r2",
	// 		type: "document",
	// 		name: "Recent Document 1",
	// 		depth: 0,
	// 		parentId: null,
	// 	},
	// 	{
	// 		id: "r3",
	// 		type: "document",
	// 		name: "Recent Document 2",
	// 		depth: 0,
	// 		parentId: null,
	// 	},
	// 	{
	// 		id: "r4",
	// 		type: "document",
	// 		name: "Recent Document 3",
	// 		depth: 0,
	// 		parentId: null,
	// 	},
	// ]);
	const navigate = useNavigate();
	const workspace = useWorkspace();
	const project = useProject();

	const { data: items } = useLibraryItems();
	const setLibraryItemsMutation = useSetLibraryItems();
	const makeInitialLibraryMutation = useMakeInitialLibrary();
	const moveOutOfLibraryMutation = useMoveOutOfLibrary();
	const createFolderMutation = useCreateFolder();

	const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

	const [activeId, setActiveId] = useState<string | null>(null);

	const setItems = useCallback(
		(itemsSetter: (items: FlattenedItem[]) => FlattenedItem[]) => {
			const newItems = itemsSetter(items);
			setLibraryItemsMutation.mutate({ prevItems: items, newItems });
		},
		[items, setLibraryItemsMutation],
	);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const visibleItems = items.filter(item => {
		if (item.parentId === "<ROOT>") return true;
		return item.parentId && expandedFolders.has(item.parentId);
	});

	const recentItems = items.filter(item => item.parentId === null);

	const handleDragStart = ({ active }: { active: any }) => {
		setActiveId(active.id);
	};

	const handleDragEnd = ({ active, over }: { active: any; over: Over | null }) => {
		setActiveId(null);
		if (!over) return;

		if (over.id === "initial") {
			makeInitialLibraryMutation.mutate(active.id);
		} else if (over.id === "out-of-library") {
			moveOutOfLibraryMutation.mutate(active.id);
		} else if (active.id !== over.id) {
			let id = over.id as string;
			const isBefore = id.startsWith("before:");
			const isAfter = id.startsWith("after:");
			id = id.includes(":") ? id.split(":")[1] : id;

			setItems(items => {
				const oldIndex = items.findIndex(item => item.id === active.id);
				const newIndex = items.findIndex(item => item.id === id);

				const activeItem = items.find(item => item.id === active.id);
				if (!activeItem) {
					throw new Error("Active item not found");
				}
				const currentItemAtNewIndex = items[newIndex];

				let newItems = items;

				const updateActiveItem = (newItem: FlattenedItem) => {
					newItems = [...items.slice(0, oldIndex), newItem, ...items.slice(oldIndex + 1)];
				};

				const oldIndexIsBeforeNewIndex = oldIndex < newIndex;

				if (currentItemAtNewIndex.type === "folder" && !isBefore && !isAfter) {
					const newActiveItem = {
						...activeItem,
						parentId: currentItemAtNewIndex.id,
						depth: currentItemAtNewIndex.depth + 1,
					};

					updateActiveItem(newActiveItem);
					newItems = arrayMove(newItems, oldIndex, newIndex + 1 - (oldIndexIsBeforeNewIndex ? 1 : 0));
				} else {
					if (currentItemAtNewIndex.parentId) {
						// Make sure the active item is in the same folder as the new index
						const newActiveItem = {
							...activeItem,
							parentId: currentItemAtNewIndex.parentId,
							depth: currentItemAtNewIndex.depth,
						};

						updateActiveItem(newActiveItem);
					} else {
						if (activeItem.type === "folder") {
							// Can't move a folder to recents.
							return newItems;
						}
						// Moving to recents, clear any parents if there are any
						const newActiveItem = {
							...activeItem,
							parentId: null,
							depth: 0,
						};

						updateActiveItem(newActiveItem);
					}

					newItems = arrayMove(
						newItems,
						oldIndex,
						(isAfter ? newIndex + 1 : newIndex) - (oldIndexIsBeforeNewIndex ? 1 : 0),
					);
				}

				newItems = syncItemIndices(newItems);

				return newItems;
			});
		}
	};

	const toggleFolder = (folderId: string) => {
		setExpandedFolders(prev => {
			const newSet = new Set(prev);
			if (newSet.has(folderId)) {
				// Closing the folder
				newSet.delete(folderId);
				// Remove all descendant folder IDs
				const descendantIds = findDescendantFolderIds(items, folderId);
				for (const id of descendantIds) {
					newSet.delete(id);
				}
			} else {
				// Opening the folder
				newSet.add(folderId);
			}
			return newSet;
		});
	};

	const activeItem = activeId ? items.find(item => item.id === activeId) : null;

	return (
		<div className="flex w-full flex-col">
			<DndContext
				sensors={sensors}
				collisionDetection={rectIntersection}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}>
				<SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
					<div className="flex w-full flex-col gap-1">
						<div className="flex flex-row items-center justify-between gap-1">
							<h3 className="whitespace-nowrap text-sm font-semibold text-secondary">Library</h3>
							<Button
								variant="ghost"
								size="icon-sm"
								className="text-secondary"
								onClick={() => createFolderMutation.mutate()}>
								<FolderPlusIcon className="size-4" />
							</Button>
						</div>
						{visibleItems.length > 0 ? (
							<ul className="flex flex-col gap-1">
								{visibleItems.map((item, index, arr) => {
									const nextItem = arr[index + 1];
									const isLastItemWithParent = Boolean(item.parentId && !nextItem?.parentId);
									return (
										<SortableItem
											key={item.id}
											id={item.id}
											depth={item.depth}
											type={item.type}
											name={item.name}
											expanded={expandedFolders.has(item.id)}
											toggleFolder={toggleFolder}
											navigateToDoc={() => {
												if (item.type === "document") {
													navigate(makeProjectDocUrl(workspace.slug, project!.slug, item.id));
												}
											}}
											hasAfterDroppable={index === arr.length - 1 || isLastItemWithParent}
											isInLibrary
										/>
									);
								})}
							</ul>
						) : (
							<EmptyLibraryDroppable />
						)}
						<div className="flex flex-row items-center gap-1">
							<h3 className="whitespace-nowrap text-sm font-semibold text-secondary">Recent Docs</h3>
						</div>
						<MoveOutOfLibraryDroppable hasRecentDocs={recentItems.length > 0} />
						<ul className="flex flex-col gap-1">
							{recentItems.map((item, index, arr) => {
								return (
									<SortableItem
										key={item.id}
										id={item.id}
										depth={item.depth}
										type={item.type}
										name={item.name}
										expanded={false}
										toggleFolder={toggleFolder}
										navigateToDoc={() => {
											if (item.type === "document") {
												navigate(makeProjectDocUrl(workspace.slug, project!.slug, item.id));
											}
										}}
										hasAfterDroppable={index === arr.length - 1}
									/>
								);
							})}
						</ul>
					</div>
				</SortableContext>
				<DragOverlay>
					{activeItem ? (
						<div className="shadow-md">
							<SortableItem
								id={activeItem.id}
								depth={activeItem.depth}
								type={activeItem.type}
								name={activeItem.name}
								expanded={false}
								toggleFolder={() => {}}
								isOverlay={true}
							/>
						</div>
					) : null}
				</DragOverlay>
			</DndContext>
		</div>
	);
};

const EmptyLibraryDroppable = () => {
	const { isOver, setNodeRef } = useDroppable({
		id: "initial",
	});

	return (
		<div
			ref={setNodeRef}
			className={cn(
				"my-1 w-full rounded border border-dashed border-border p-2 text-center text-xs text-tertiary",
				isOver && "bg-card text-accent",
			)}>
			Move a doc here to start building your library
		</div>
	);
};

const MoveOutOfLibraryDroppable = ({ hasRecentDocs }: { hasRecentDocs: boolean }) => {
	const { isOver, setNodeRef, active } = useDroppable({
		id: "out-of-library",
	});

	if (!active) {
		if (hasRecentDocs) {
			return null;
		}
		return (
			<Button variant="outline" size="sm" className="my-1 text-tertiary">
				<PlusIcon className="size-4" />
				<span>No recent docs, create one</span>
			</Button>
		);
	}

	console.log("active", active);
	if (!active.data.current?.isInLibrary) {
		return null;
	}

	return (
		<div
			ref={setNodeRef}
			className={cn(
				"my-1 w-full rounded border border-dashed border-border p-2 text-center text-xs text-tertiary",
				isOver && "bg-card text-accent",
			)}>
			Move out of library
		</div>
	);
};
