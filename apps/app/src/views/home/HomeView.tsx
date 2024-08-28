import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";

import { supabase } from "src/clients/supabase";
import { SimpleLayout } from "src/components/SimpleLayout";
import { ThoughtList } from "src/components/ThoughtList";
import { useUser } from "src/stores/user";
import { makeHeadTitle } from "src/utils/strings";

import { CollectionsColumn } from "./CollectionsColumn";
import { ThoughtsEmptyState } from "./ThoughtsEmptyState";

const useThoughts = () => {
	const user = useUser();
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
	return (
		<SimpleLayout isLoading={isLoading}>
			<Helmet>
				<title>{makeHeadTitle("Home")}</title>
			</Helmet>
			<div className="flex flex-col-reverse md:flex-row gap-4 px-4 md:p-8 w-full ">
				<div className="h-8 md:hidden" />
				<div className="flex-1 flex-col flex gap-4">
					{/* <div>
						<Generate />
					</div> */}
					{thoughts && thoughts.length > 0 ? <ThoughtList thoughts={thoughts} /> : <ThoughtsEmptyState />}
				</div>
				<CollectionsColumn />
			</div>
		</SimpleLayout>
	);
};
