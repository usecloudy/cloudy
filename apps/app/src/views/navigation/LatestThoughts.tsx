import { useQuery } from "@tanstack/react-query";
import { FileIcon, NotebookTextIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { supabase } from "src/clients/supabase";
import { useWorkspace, useWorkspaceStore } from "src/stores/workspace";
import { cn } from "src/utils";
import { makeThoughtLabel, makeThoughtUrl } from "src/utils/thought";

const useLatestThoughts = () => {
	const workspace = useWorkspaceStore(s => s.workspace);

	return useQuery({
		queryKey: [workspace?.slug, "latestThoughts"],
		queryFn: async () => {
			if (!workspace) {
				return [];
			}

			const { data, error } = await supabase
				.from("thoughts")
				.select("id, title, content_plaintext, content_md, created_at, collections:collection_thoughts(id)")
				.eq("workspace_id", workspace.id)
				.order("created_at", { ascending: false })
				.limit(6);

			if (error) {
				throw error;
			}

			return data.map(thought => ({
				...thought,
				hasCollection: thought.collections.length > 0,
			}));
		},
		throwOnError: true,
	});
};

export const LatestThoughts = () => {
	const workspace = useWorkspace();
	const { data: latestThoughts, isLoading } = useLatestThoughts();

	const location = useLocation();
	const thoughtId = location.pathname.split("/").pop();

	if (isLoading || !latestThoughts) {
		return null;
	}

	return (
		<div className="flex w-full flex-col gap-2">
			<div className="flex flex-row items-center gap-1">
				<h3 className="whitespace-nowrap text-sm font-semibold text-secondary">Latest Notes</h3>
			</div>
			<ul className="flex flex-col gap-1">
				{latestThoughts.map(thought => (
					<li key={thought.id}>
						<Link
							to={makeThoughtUrl(workspace.slug, thought.id)}
							className={cn(
								"flex flex-row items-center gap-1 rounded px-2 py-1 hover:bg-card",
								thought.id === thoughtId && "bg-accent/10",
							)}>
							{thought.hasCollection ? (
								<NotebookTextIcon className="size-4 shrink-0" />
							) : (
								<FileIcon className="size-4 shrink-0" />
							)}
							<span className={cn("truncate text-sm", thought.title && "font-medium")}>
								{makeThoughtLabel(thought)}
							</span>
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
};
