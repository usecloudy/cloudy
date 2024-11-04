import { RepoFilesGetResponse, RepoReference } from "@cloudy/utils/common";
import { useQuery } from "@tanstack/react-query";
import { ChevronRightIcon, FolderIcon, PlusIcon, SearchIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { apiClient } from "src/api/client";
import { Button } from "src/components/Button";
import { Dropdown } from "src/components/Dropdown";
import { FileReferencePill } from "src/components/FileReferencePill";
import { Input } from "src/components/Input";
import { Tooltip, TooltipContent, TooltipTrigger } from "src/components/Tooltip";

import { useProject } from "../projects/ProjectContext";

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
}: {
	item: FileTreeItem;
	depth?: number;
	expandedDirs: Set<string>;
	onToggle: (path: string) => void;
	onSelect: (file: FileTreeItem) => void;
	selectedFiles: Set<string>;
	onRemove: (file: FileTreeItem) => void;
}) => {
	const paddingLeft = `${depth * 1.25 + 0.25}rem`;
	const isExpanded = expandedDirs.has(item.path);
	const isDirectory = item.type === "directory";
	const isSelected = selectedFiles.has(item.path);

	return (
		<>
			<div
				className={`relative flex cursor-pointer flex-row items-center gap-1 rounded px-2 py-0.5 text-sm hover:bg-card ${
					isSelected ? "bg-card/70" : ""
				}`}
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

export const FileReferenceRow = ({
	existingLinkedFiles,
	fileReferences,
	setFileReferences,
	disableAdd,
}: {
	fileReferences: RepoReference[];
	existingLinkedFiles?: { path: string; repoFullName: string; fileUrl: string }[];
	setFileReferences: (files: RepoReference[]) => void;
	disableAdd?: boolean;
}) => {
	const [query, setQuery] = useState("");
	const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
	const { data: repoPaths, isLoading } = useRepoPaths();
	const selectedFiles = useMemo(() => new Set(fileReferences.map(f => f.path)), [fileReferences]);
	const isAtFileLimit = fileReferences.length >= 8;

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
			setFileReferences([...fileReferences, file]);
		}
	};

	const handleRemove = (file: FileTreeItem) => {
		setFileReferences(fileReferences.filter(f => f.path !== file.path));
	};

	return (
		<div className="flex flex-row flex-wrap items-center gap-1 pt-1">
			{!disableAdd && (
				<Dropdown
					align="start"
					className="w-[32rem] p-0"
					trigger={
						<Button size={fileReferences.length === 0 ? "xs" : "icon-xs"} variant="outline">
							<PlusIcon className="size-4" />
							{fileReferences.length === 0 && <span>Link files</span>}
						</Button>
					}>
					<div className="w-[32rem]">
						<div className="border-b border-border bg-card/50 px-1 py-1">
							<Input
								placeholder="Search files"
								className="border-none bg-transparent"
								prefix={<SearchIcon className="mr-2 size-4" />}
								value={query}
								onChange={e => setQuery(e.target.value)}
								autoFocus
							/>
						</div>
						<div className="no-scrollbar flex max-h-[40dvh] min-h-36 flex-col gap-0.5 overflow-y-auto px-2 py-2">
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
						{isAtFileLimit && (
							<div className="flex w-full items-center gap-1 border-t border-border px-3 py-2">
								<TriangleAlertIcon className="size-4 text-red-600" />
								<span className="text-xs text-red-600">Maximum of 8 files reached</span>
							</div>
						)}
					</div>
				</Dropdown>
			)}
			{fileReferences?.map(file => (
				<FileReferencePill
					key={file.path}
					path={file.path}
					repoFullName={file.repoFullName}
					fileUrl={file.fileUrl}
					onRemove={() => setFileReferences(fileReferences.filter(f => f.path !== file.path))}
				/>
			))}
			{existingLinkedFiles?.map(file => (
				<FileReferencePill key={file.path} path={file.path} repoFullName={file.repoFullName} fileUrl={file.fileUrl} />
			))}
			{isAtFileLimit && <span className="text-xs text-red-600">Maximum of 8 files reached</span>}
		</div>
	);
};
