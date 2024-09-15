import { useQuery } from "@tanstack/react-query";
import { NotebookIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { supabase } from "src/clients/supabase";
import { useWorkspace, useWorkspaceSlug } from "src/stores/workspace";
import { makeCollectionUrl } from "src/utils/collection";
import { makeHumanizedTime, pluralize } from "src/utils/strings";

const useLatestCollections = () => {
	const workspace = useWorkspace();
	return useQuery({
		queryKey: [workspace.slug, "latestCollections"],
		queryFn: async () => {
			const { data } = await supabase
				.from("collections")
				.select("*, collection_thoughts(id)")
				.eq("workspace_id", workspace.id)
				.order("updated_at", { ascending: false })
				.limit(20);
			return data?.map(collection => ({
				...collection,
				thoughtsCount: collection.collection_thoughts.length,
			}));
		},
	});
};

export const CollectionsColumn = () => {
	const wsSlug = useWorkspaceSlug();
	const { data } = useLatestCollections();
	return (
		<div>
			<div className="flex md:w-[18rem] lg:w-[28rem] flex-col gap-4 rounded-lg border border-border py-6">
				<div className="flex items-center gap-1 px-6">
					<NotebookIcon className="size-4 text-secondary" />
					<h2 className="font-semibold text-secondary">Collections</h2>
				</div>
				<div className="flex flex-col px-3">
					{data && data.length > 0 ? (
						data.map(collection => (
							<Link key={collection.id} to={makeCollectionUrl(wsSlug, collection.id)}>
								<div className="flex flex-col hover:bg-card rounded py-2 px-3 cursor-pointer">
									<div className="text-xs text-secondary">
										{`${makeHumanizedTime(collection.updated_at ?? collection.created_at)} • ${pluralize(collection.thoughtsCount, "note")}`}
									</div>
									<div className="font-medium">{collection.title}</div>
								</div>
							</Link>
						))
					) : (
						<div className="flex px-3">
							<span className="text-tertiary text-sm">
								You have no collections yet. Create one on the thoughts screen.
							</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
