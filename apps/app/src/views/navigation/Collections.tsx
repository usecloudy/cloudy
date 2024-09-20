import { useQuery } from "@tanstack/react-query";
import { ChevronDownIcon, ChevronUpIcon, NotebookIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { useWorkspace, useWorkspaceSlug, useWorkspaceStore } from "src/stores/workspace";
import { cn } from "src/utils";
import { makeCollectionUrl } from "src/utils/collection";

const useCollections = () => {
	const workspace = useWorkspaceStore(s => s.workspace);
	return useQuery({
		queryKey: [workspace?.slug, "collections"],
		queryFn: async () => {
			if (!workspace) {
				return [];
			}

			const { data } = await supabase
				.from("collections")
				.select("*, collection_thoughts(id)")
				.eq("workspace_id", workspace.id)
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
	const [showAll, setShowAll] = useState(false);

	if (isLoading || !collections) {
		return null;
	}

	const displayedCollections = showAll ? collections : collections.slice(0, 6);
	const hasMore = collections.length > 6;

	return (
		<div className="flex w-full flex-col gap-2">
			<div className="flex flex-row items-center gap-1">
				<h3 className="whitespace-nowrap text-sm font-semibold text-secondary">Collections</h3>
			</div>
			{workspace && (
				<ul className="flex flex-col gap-1">
					{displayedCollections.map(collection => (
						<li key={collection.id}>
							<Link
								to={makeCollectionUrl(workspace.slug, collection.id)}
								className="flex flex-row items-center gap-1 rounded px-2 py-1 hover:bg-card">
								<NotebookIcon className="size-4 shrink-0" />
								<span className="truncate text-sm font-medium">{collection.title}</span>
							</Link>
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
