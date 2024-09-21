import { useQuery } from "@tanstack/react-query";
import { FileIcon, MessageCircleWarningIcon } from "lucide-react";
import { useEffect } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";

import { queryClient } from "src/api/queryClient";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { MainLayout } from "src/components/MainLayout";
import { SimpleLayout } from "src/components/SimpleLayout";
import { ThoughtList } from "src/components/ThoughtList";
import { useUser } from "src/stores/user";
import { useWorkspace, useWorkspaceSlug } from "src/stores/workspace";
import { makeHeadTitle } from "src/utils/strings";
import { useCustomerStatus } from "src/utils/useCustomerStatus";

import { CollectionsColumn } from "./CollectionsColumn";
import { SearchBar } from "./SearchBar";
import { ThoughtsEmptyState } from "./ThoughtsEmptyState";

const useThoughts = () => {
	const workspace = useWorkspace();

	useEffect(() => {
		const channel = supabase
			.channel("thoughts")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "thoughts",
					filter: `workspace_id.eq.${workspace.id}`,
				},
				() => {
					queryClient.invalidateQueries({
						queryKey: ["thoughts"],
					});
				},
			)
			.subscribe();

		return () => {
			channel.unsubscribe();
		};
	}, [workspace.id]);

	return useQuery({
		queryKey: [workspace.slug, "thoughts"],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("thoughts")
				.select(
					`*, 
					collections:collection_thoughts(
						collection_id,
						collection:collections(
							id,
							title
						)
					)`,
				)
				.eq("workspace_id", workspace.id);

			if (error) {
				throw error;
			}

			return data?.map(thought => ({
				...thought,
				collections: thought.collections.flatMap(collection => (collection.collection ? [collection.collection] : [])),
			}));
		},
		throwOnError: true,
	});
};

export const HomeView = () => {
	const wsSlug = useWorkspaceSlug();
	const { data: thoughts, isLoading } = useThoughts();
	const { isLoading: isCustomerStatusLoading, data: customerStatus } = useCustomerStatus();

	return (
		<MainLayout isLoading={isLoading || isCustomerStatusLoading} className="no-scrollbar flex-1 overflow-y-scroll">
			<Helmet>
				<title>{makeHeadTitle("Home")}</title>
			</Helmet>
			<div className="flex w-full flex-col-reverse gap-4 py-4 md:flex-row md:py-8">
				<div className="h-8 md:hidden" />
				<div className="mt-6 flex flex-1 flex-col gap-4">
					<div className="flex flex-col gap-2">
						<div className="flex flex-row items-center gap-1">
							<FileIcon className="size-4 text-secondary" />
							<h3 className="whitespace-nowrap font-semibold text-secondary">Notes</h3>
						</div>
						<SearchBar />
					</div>
					{!customerStatus?.customerStatus?.isActive && (
						<div className="flex w-full flex-row items-center gap-2 rounded-md border border-red-400 p-4 text-red-600">
							<MessageCircleWarningIcon className="size-5" />
							<p className="flex-1">
								Your subscription plan is inactive, you will not be able to create new notes.
							</p>
							<Link to={`/workspaces/${wsSlug}/settings`}>
								<Button variant="default" className="text-background" size="sm">
									{" "}
									Go to workspace settings
								</Button>
							</Link>
						</div>
					)}
					{thoughts && thoughts.length > 0 ? <ThoughtList thoughts={thoughts} /> : <ThoughtsEmptyState />}
				</div>
			</div>
		</MainLayout>
	);
};
