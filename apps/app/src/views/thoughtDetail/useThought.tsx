import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { queryClient } from "src/api/queryClient";
import { supabase } from "src/clients/supabase";

export const useThought = (thoughtId?: string) => {
	useEffect(() => {
		if (!thoughtId) {
			return;
		}

		const channel = supabase
			.channel("thought")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "thoughts",
					filter: `id=eq.${thoughtId}`,
				},
				() => {
					queryClient.invalidateQueries({
						queryKey: ["thought", thoughtId],
					});
				},
			)
			.subscribe();

		return () => {
			channel.unsubscribe();
		};
	}, [thoughtId]);

	useEffect(() => {
		if (!thoughtId) {
			return;
		}

		const channel = supabase
			.channel("thoughtCollectionsLoad")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "collection_thoughts",
					filter: `thought_id=eq.${thoughtId}`,
				},
				() => {
					queryClient.invalidateQueries({
						queryKey: ["thought", thoughtId],
					});
				},
			)
			.subscribe();

		return () => {
			channel.unsubscribe();
		};
	}, [thoughtId]);

	return useQuery({
		queryKey: ["thought", thoughtId ?? "new"],
		queryFn: async () => {
			if (!thoughtId) {
				return null;
			}

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
				.eq("id", thoughtId)
				.single();

			if (error) {
				throw error;
			}

			return {
				...data,
				collections: data.collections.flatMap(collection => (collection.collection ? [collection.collection] : [])),
			};
		},
		enabled: !!thoughtId,
	});
};
