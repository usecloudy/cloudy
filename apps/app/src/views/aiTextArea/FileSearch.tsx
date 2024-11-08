import { Hotkey } from "@cloudy/ui";
import { RepoFilesGetResponse, RepoReference } from "@cloudy/utils/common";
import { useQuery } from "@tanstack/react-query";
import { ChevronRightIcon, SearchIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";

import { apiClient } from "src/api/client";
import { Button } from "src/components/Button";
import { cn } from "src/utils";

import { useProject } from "../projects/ProjectContext";
import { RepoReferenceWithMention, useAiTextAreaContext } from "./AiTextAreaContext";
import { FILE_REFERENCE_LIMIT } from "./constants";

type FileTreeItem = RepoReference & {
	fileName: string;
	children?: FileTreeItem[];
};

const buildFileTree = (files: RepoReference[]): FileTreeItem[] => {
	const tree: FileTreeItem[] = [];
	const itemsByPath: { [key: string]: FileTreeItem } = {};

	// Sort function to be used at each level
	const sortItems = (items: FileTreeItem[]) => {
		return items.sort((a, b) => {
			if (a.type === "directory" && b.type !== "directory") return -1;
			if (a.type !== "directory" && b.type === "directory") return 1;
			return a.fileName.localeCompare(b.fileName);
		});
	};

	// First convert all items to FileTreeItems
	files.forEach(file => {
		const item: FileTreeItem = {
			...file,
			fileName: file.path.split("/").pop()!,
			children: file.type === "directory" ? [] : undefined,
		};
		itemsByPath[file.path] = item;
	});

	// Then build the tree structure
	files.forEach(file => {
		const parentPath = file.path.split("/").slice(0, -1).join("/");
		if (parentPath && itemsByPath[parentPath]) {
			itemsByPath[parentPath].children?.push(itemsByPath[file.path]);
		} else {
			tree.push(itemsByPath[file.path]);
		}
	});

	// Sort all levels of the tree
	const sortTree = (items: FileTreeItem[]) => {
		sortItems(items);
		items.forEach(item => {
			if (item.children) {
				sortTree(item.children);
			}
		});
	};

	sortTree(tree);
	return tree;
};

const useRepoPaths = () => {
	const project = useProject();
	return useQuery({
		queryKey: [project?.id, "repoFileAutocomplete"],
		queryFn: async () => {
			if (!project) {
				throw new Error("Project not loaded");
			}

			const results = await apiClient.get<RepoFilesGetResponse>(`/api/integrations/github/repo-files`, {
				params: {
					projectId: project!.id,
				},
			});

			return buildFileTree(results.data.paths);
		},
		enabled: !!project,
	});
};

const FileTreeItemComponent = ({
	item,
	depth = 0,
	expandedDirs,
	onToggle,
	onSelect,
	selectedFiles,
	onRemove,
	keyboardSelectedPath,
	scrollRef,
}: {
	item: FileTreeItem;
	depth?: number;
	expandedDirs: Set<string>;
	onToggle: (path: string) => void;
	onSelect: (file: FileTreeItem) => void;
	selectedFiles: Set<string>;
	onRemove: (file: FileTreeItem) => void;
	keyboardSelectedPath?: string | null;
	scrollRef: React.RefObject<HTMLDivElement>;
}) => {
	const paddingLeft = `${depth * 1.25 + 0.25}rem`;
	const isExpanded = expandedDirs.has(item.path);
	const isDirectory = item.type === "directory";
	const isSelected = selectedFiles.has(item.path);

	const itemRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (keyboardSelectedPath === item.path && itemRef.current && scrollRef.current) {
			const itemElement = itemRef.current;
			const scrollContainer = scrollRef.current;

			const itemRect = itemElement.getBoundingClientRect();
			const containerRect = scrollContainer.getBoundingClientRect();

			if (itemRect.bottom > containerRect.bottom) {
				itemElement.scrollIntoView({ block: "nearest" });
			} else if (itemRect.top < containerRect.top) {
				itemElement.scrollIntoView({ block: "nearest" });
			}
		}
	}, [keyboardSelectedPath, item.path]);

	return (
		<>
			<div
				ref={itemRef}
				className={cn(
					"relative flex cursor-pointer flex-row items-center gap-1 rounded px-2 py-0.5 text-sm hover:bg-card",
					item.path === keyboardSelectedPath ? "bg-accent/10" : isSelected ? "bg-card/50" : "",
				)}
				style={{ paddingLeft }}
				onClick={() => (isDirectory ? onToggle(item.path) : onSelect(item))}>
				{depth > 0 && (
					<>
						{[...Array(depth)].map((_, index) => (
							<div
								key={index}
								className="absolute left-0 h-full w-px bg-border"
								style={{ left: `${index * 1.125 + 0.875}rem` }}
							/>
						))}
					</>
				)}
				<div>
					{isDirectory ? (
						<ChevronRightIcon className={`size-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
					) : (
						<div className="h-4 w-2" />
					)}
				</div>
				<span className="shrink-0">{item.fileName}</span>
				<span className="flex-1 truncate text-xs text-tertiary">{item.path}</span>
				{isSelected && !isDirectory && (
					<Button
						size="icon-xs"
						variant="ghost"
						className="text-secondary hover:bg-red-600/20 hover:text-red-600"
						onClick={e => {
							e.stopPropagation();
							onRemove(item);
						}}>
						<XIcon className="size-4" />
					</Button>
				)}
			</div>
			{isExpanded && item.children && (
				<div className="relative flex flex-col gap-0.5">
					{item.children.map(child => (
						<FileTreeItemComponent
							key={child.path}
							item={child}
							depth={depth + 1}
							expandedDirs={expandedDirs}
							onToggle={onToggle}
							onSelect={onSelect}
							selectedFiles={selectedFiles}
							onRemove={onRemove}
							keyboardSelectedPath={keyboardSelectedPath}
							scrollRef={scrollRef}
						/>
					))}
				</div>
			)}
		</>
	);
};

const LoadingState = () => {
	return (
		<div className="flex flex-col gap-0.5 px-2">
			{[...Array(3)].map((_, i) => (
				<div key={i} className="flex h-7 animate-pulse items-center gap-2 rounded bg-card/50 px-2">
					<div className="h-4 w-4 rounded bg-card" />
					<div className="h-4 w-24 rounded bg-card" />
				</div>
			))}
		</div>
	);
};

export interface FileSearchRef {
	onKeyDown: (params: { event: React.KeyboardEvent<HTMLDivElement>; hide: () => void }) => boolean;
}

const flattenTree = (tree: FileTreeItem[], expandedDirs: Set<string>): FileTreeItem[] => {
	const flattened: FileTreeItem[] = [];

	const traverse = (items: FileTreeItem[]) => {
		items.forEach(item => {
			flattened.push(item);
			if (item.type === "directory" && expandedDirs.has(item.path) && item.children) {
				traverse(item.children);
			}
		});
	};

	traverse(tree);
	return flattened;
};

export const FileSearch = forwardRef(
	(
		{ query, onSelect, shouldMention }: { query: string; onSelect?: (file: FileTreeItem) => void; shouldMention?: boolean },
		ref: React.Ref<FileSearchRef>,
	) => {
		const { fileReferences, setFileReferences } = useAiTextAreaContext();

		const { data: repoPaths, isLoading } = useRepoPaths();

		const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

		const selectedFiles = useMemo(() => new Set(fileReferences.map(f => f.path)), [fileReferences]);
		const isAtFileLimit = fileReferences.length >= FILE_REFERENCE_LIMIT;

		const filteredFiles = useMemo(() => {
			if (!repoPaths) return [];

			if (query) {
				const searchResults: FileTreeItem[] = [];
				const search = (items: FileTreeItem[]) => {
					items.forEach(item => {
						if (item.path.toLowerCase().includes(query.toLowerCase())) {
							searchResults.push(item);
						}
						if (item.children) {
							search(item.children);
						}
					});
				};
				search(repoPaths);
				return searchResults;
			}

			return repoPaths;
		}, [repoPaths, query]);

		const toggleDirectory = (path: string) => {
			setExpandedDirs(prev => {
				const next = new Set(prev);
				if (next.has(path)) {
					next.delete(path);
				} else {
					next.add(path);
				}
				return next;
			});
		};

		const handleSelect = (file: FileTreeItem) => {
			if (file.type !== "directory" && !selectedFiles.has(file.path) && !isAtFileLimit) {
				setFileReferences([
					...fileReferences,
					{ ...file, mentioned: shouldMention } satisfies RepoReferenceWithMention,
				]);
				onSelect?.(file);
			}
		};

		const handleRemove = (file: FileTreeItem) => {
			setFileReferences(fileReferences.filter(f => f.path !== file.path));
		};

		const [keyboardSelectedPath, setKeyboardSelectedPath] = useState<string | null>(null);

		// Get flattened list of visible items for keyboard navigation
		const flattenedItems = useMemo(() => {
			return flattenTree(filteredFiles, expandedDirs);
		}, [filteredFiles, expandedDirs]);

		const handleArrowDown = () => {
			const currentIndex = keyboardSelectedPath
				? flattenedItems.findIndex(item => item.path === keyboardSelectedPath)
				: -1;

			const nextIndex = currentIndex + 1;
			if (nextIndex < flattenedItems.length) {
				setKeyboardSelectedPath(flattenedItems[nextIndex].path);
			}
		};

		const handleArrowUp = () => {
			const currentIndex = keyboardSelectedPath
				? flattenedItems.findIndex(item => item.path === keyboardSelectedPath)
				: 0;

			const nextIndex = currentIndex - 1;
			if (nextIndex >= 0) {
				setKeyboardSelectedPath(flattenedItems[nextIndex].path);
			}
		};

		const handleArrowRight = () => {
			if (!keyboardSelectedPath) return;
			const selectedItem = flattenedItems.find(item => item.path === keyboardSelectedPath);
			if (selectedItem?.type === "directory") {
				setExpandedDirs(prev => new Set([...Array.from(prev), selectedItem.path]));
			}
		};

		const handleArrowLeft = () => {
			if (!keyboardSelectedPath) return;
			const selectedItem = flattenedItems.find(item => item.path === keyboardSelectedPath);
			if (selectedItem?.type === "directory" && expandedDirs.has(selectedItem.path)) {
				setExpandedDirs(prev => {
					const next = new Set(prev);
					next.delete(selectedItem.path);
					return next;
				});
			}
		};

		const handleEnter = (): void => {
			if (!keyboardSelectedPath) return;
			const selectedItem = flattenedItems.find(item => item.path === keyboardSelectedPath);
			if (!selectedItem) return;

			if (selectedItem.type === "directory") {
				toggleDirectory(selectedItem.path);
			} else {
				if (selectedFiles.has(selectedItem.path)) {
					handleRemove(selectedItem);
				} else {
					handleSelect(selectedItem);
				}
			}
		};

		useImperativeHandle(ref, () => ({
			onKeyDown: ({ event, hide }: { event: React.KeyboardEvent<HTMLDivElement>; hide: () => void }) => {
				switch (event.key) {
					case "ArrowDown":
						handleArrowDown();
						return true;
					case "ArrowUp":
						handleArrowUp();
						return true;
					case "ArrowRight":
						handleArrowRight();
						return true;
					case "ArrowLeft":
						handleArrowLeft();
						return true;
					case "Enter":
						handleEnter();
						return true;
					default:
						return false;
				}
			},
		}));

		// Update keyboardSelectedPath when filteredFiles changes
		useEffect(() => {
			if (filteredFiles.length > 0) {
				setKeyboardSelectedPath(filteredFiles[0].path);
			} else {
				setKeyboardSelectedPath(null);
			}
		}, [filteredFiles]);

		const scrollContainerRef = useRef<HTMLDivElement>(null);

		return (
			<>
				<div
					ref={scrollContainerRef}
					className="no-scrollbar flex max-h-[40dvh] min-h-36 flex-col gap-0.5 overflow-y-auto px-2 py-2">
					{isLoading ? (
						<LoadingState />
					) : filteredFiles.length > 0 ? (
						filteredFiles.map(file => (
							<FileTreeItemComponent
								key={file.path}
								item={file}
								expandedDirs={expandedDirs}
								onToggle={toggleDirectory}
								onSelect={handleSelect}
								selectedFiles={selectedFiles}
								onRemove={handleRemove}
								keyboardSelectedPath={keyboardSelectedPath}
								scrollRef={scrollContainerRef}
							/>
						))
					) : query ? (
						<div className="flex flex-col items-center justify-center gap-2 py-8">
							<SearchIcon className="size-5 text-tertiary" />
							<div className="text-sm text-tertiary">
								No results found for <span className="text-primary">"{query}"</span>
							</div>
						</div>
					) : null}
				</div>
				<div className="flex w-full flex-col gap-2 border-t border-border px-3 py-2">
					{isAtFileLimit && (
						<div className="flex w-full items-center gap-1">
							<TriangleAlertIcon className="size-4 text-red-600" />
							<span className="text-xs text-red-600">Maximum of 8 files reached</span>
						</div>
					)}
					<div className="flex w-full items-center gap-3">
						<div className="text-xs text-tertiary">Type to search</div>
						<div className="flex items-center gap-1">
							<Hotkey keys={["up", "down"]} />
							<span className="text-xs text-tertiary">Move selection</span>
						</div>
						<div className="flex items-center gap-1">
							<Hotkey keys={["Enter"]} />
							<span className="text-xs text-tertiary">Select file/Open folder</span>
						</div>
					</div>
				</div>
			</>
		);
	},
);
