import { useQuery } from "@tanstack/react-query";
import {
	ChevronDownIcon,
	ChevronUpIcon,
	EllipsisIcon,
	FolderIcon,
	FolderPlusIcon,
	PlusIcon,
	SparklesIcon,
	TrashIcon,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { collectionQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { Dropdown, DropdownItem, DropdownItemButton } from "src/components/Dropdown";
import { Input } from "src/components/Input";
import { Tooltip, TooltipContent, TooltipTrigger } from "src/components/Tooltip";
import { useWorkspaceStore } from "src/stores/workspace";
import { cn } from "src/utils";
import { makeCollectionUrl, useCreateCollection, useDeleteCollection } from "src/utils/collection";

const useCollections = () => {
	const workspace = useWorkspaceStore(s => s.workspace);
	return useQuery({
		queryKey: collectionQueryKeys.workspaceCollections(workspace?.id),
		queryFn: async () => {
			if (!workspace) {
				return [];
			}

			const { data } = await supabase
				.from("collections")
				.select("*, collection_thoughts(id)")
				.eq("workspace_id", workspace.id)
				.is("parent_collection_id", null) // top level collections only
				.order("updated_at", { ascending: false });

			return data?.map(collection => ({
				...collection,
				thoughtsCount: collection.collection_thoughts.length,
			}));
		},
	});
};

export const Collections = () => {
	const workspace = useWorkspaceStore(s => s.workspace);
	const { data: collections, isLoading } = useCollections();

	const createCollectionMutation = useCreateCollection();
	const deleteCollectionMutation = useDeleteCollection();

	const [showAll, setShowAll] = useState(false);
	const [newCollectionName, setNewCollectionName] = useState("");

	const location = useLocation();

	if (isLoading || !collections) {
		return null;
	}

	const isViewingCollection = location.pathname.includes("collections");
	const collectionId = location.pathname.split("/").pop();

	const displayedCollections = showAll ? collections : collections.slice(0, 6);
	const hasMore = collections.length > 6;

	const handleCreateCollection = () => {
		if (newCollectionName.trim()) {
			createCollectionMutation.mutate({ title: newCollectionName.trim() });
			setNewCollectionName("");
		}
	};

	return (
		<div className="flex w-full flex-col gap-2">
			<div className="flex flex-row items-center justify-between gap-1">
				<h3 className="whitespace-nowrap text-sm font-semibold text-secondary">Collections</h3>
				<Dropdown
					trigger={
						<div>
							<Tooltip>
								<TooltipTrigger>
									<Button variant="ghost" size="icon-sm" className="text-secondary">
										<FolderPlusIcon className="size-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Create collection</TooltipContent>
							</Tooltip>
						</div>
					}
					className="w-64"
					align="end">
					<div className="p-2">
						<Input
							type="text"
							placeholder="New collection name..."
							value={newCollectionName}
							onChange={e => setNewCollectionName(e.target.value)}
							className="mb-2"
							onKeyDown={e => {
								if (e.key === "Enter") {
									handleCreateCollection();
								}
							}}
							autoFocus
						/>
						<DropdownItemButton
							className="w-full justify-center"
							variant="default"
							size="sm"
							disabled={!newCollectionName.trim()}
							onClick={handleCreateCollection}>
							<PlusIcon className="size-4" />
							<span>Create Collection</span>
						</DropdownItemButton>
					</div>
				</Dropdown>
			</div>
			{workspace && (
				<ul className="flex flex-col gap-1">
					{displayedCollections.map(collection => (
						<li
							key={collection.id}
							className={cn(
								"group/collection flex flex-row items-center justify-between gap-1 rounded pr-0.5 hover:bg-card",
								isViewingCollection && collection.id === collectionId && "bg-accent/10",
							)}>
							<Link
								to={makeCollectionUrl(workspace.slug, collection.id)}
								className="flex flex-1 flex-row items-center gap-1 overflow-hidden px-2 py-1">
								{collection.is_auto ? (
									<SparklesIcon className="size-4 shrink-0" />
								) : (
									<FolderIcon className="size-4 shrink-0" />
								)}
								<span className="truncate text-sm font-medium">{collection.title}</span>
							</Link>
							<Dropdown
								trigger={
									<Button
										variant="ghost"
										size="icon-xs"
										className="text-secondary opacity-0 group-hover/collection:opacity-100">
										<EllipsisIcon className="size-4" />
									</Button>
								}
								className="w-48"
								align="end">
								<DropdownItem
									onSelect={e => {
										e.stopPropagation();
										e.preventDefault();
										deleteCollectionMutation.mutate({ collectionId: collection.id });
									}}
									className="text-red-600">
									<TrashIcon className="size-4" />
									<span>Delete collection</span>
								</DropdownItem>
							</Dropdown>
						</li>
					))}
				</ul>
			)}
			{hasMore && (
				<Button variant="ghost" size="sm" className="justify-start text-secondary" onClick={() => setShowAll(!showAll)}>
					{showAll ? (
						<>
							<ChevronUpIcon className="size-4" />
							Show less
						</>
					) : (
						<>
							<ChevronDownIcon className="size-4" />
							View all collections
						</>
					)}
				</Button>
			)}
		</div>
	);
};
