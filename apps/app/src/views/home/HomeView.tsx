import { useQuery } from "@tanstack/react-query";
import { FileIcon } from "lucide-react";
import { useEffect } from "react";
import { Helmet } from "react-helmet";

import { queryClient } from "src/api/queryClient";
import { supabase } from "src/clients/supabase";
import { SimpleLayout } from "src/components/SimpleLayout";
import { ThoughtList } from "src/components/ThoughtList";
import { useUser } from "src/stores/user";
import { makeHeadTitle } from "src/utils/strings";
import { useCustomerStatus } from "src/utils/useCustomerStatus";

import { CollectionsColumn } from "./CollectionsColumn";
import { SearchBar } from "./SearchBar";
import { ThoughtsEmptyState } from "./ThoughtsEmptyState";

const useThoughts = () => {
	const user = useUser();

	useEffect(() => {
		const channel = supabase
			.channel("thoughts")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "thoughts",
					filter: `author_id=eq.${user.id}`,
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
	}, []);

	return useQuery({
		queryKey: ["thoughts"],
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
				.eq("author_id", user.id);

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
	const { data: thoughts, isLoading } = useThoughts();
	const { isLoading: isCustomerStatusLoading } = useCustomerStatus();

	return (
		<SimpleLayout isLoading={isLoading || isCustomerStatusLoading}>
			<Helmet>
				<title>{makeHeadTitle("Home")}</title>
			</Helmet>
			<div className="flex flex-col-reverse md:flex-row gap-4 py-4 md:py-8 w-full ">
				<div className="h-8 md:hidden" />
				<div className="flex-1 flex-col flex gap-4 mt-6">
					{/* <div>
						<Generate />
					</div> */}
					<div className="flex flex-col gap-2">
						<div className="flex flex-row items-center gap-1">
							<FileIcon className="size-4 text-secondary" />
							<h3 className="text-secondary font-semibold whitespace-nowrap">Notes</h3>
						</div>
						<SearchBar />
					</div>
					{thoughts && thoughts.length > 0 ? <ThoughtList thoughts={thoughts} /> : <ThoughtsEmptyState />}
				</div>
				<CollectionsColumn />
			</div>
		</SimpleLayout>
	);
};
