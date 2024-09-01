import { handleSupabaseError } from "@cloudy/utils/common";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { apiClient } from "../../api/client";
import { queryClient } from "../../api/queryClient";
import { supabase } from "../../clients/supabase";
import { fixOneToOne } from "../../utils";
import { useThoughtStore } from "./thoughtStore";

export const useEditThought = (thoughtId?: string) => {
	const { setLastLocalThoughtContentTs, setLastLocalThoughtTitleTs } = useThoughtStore();

	return useMutation({
		mutationKey: ["newThought"],
		mutationFn: async (payload: { title?: string; content?: string; contentMd?: string }) => {
			let titleObj = {};
			if (payload.title !== undefined) {
				const titleTs = new Date();
				titleObj = { title: payload.title, title_ts: titleTs.toISOString() };
				setLastLocalThoughtTitleTs(titleTs);
			}

			let contentObj = {};
			if (payload.content !== undefined) {
				const contentTs = new Date();
				contentObj = { content: payload.content, content_ts: contentTs.toISOString() };
				setLastLocalThoughtContentTs(contentTs);
			}

			const data = handleSupabaseError(
				await supabase
					.from("thoughts")
					.upsert({
						id: thoughtId,
						...titleObj,
						...contentObj,
						...(payload.contentMd !== undefined && { content_md: payload.contentMd }),
					})
					.select(),
			);

			return data?.at(0);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["thoughtEmbeddings"],
			});
			setTimeout(() => {
				queryClient.invalidateQueries({
					queryKey: ["thoughtEmbeddings"],
				});
			}, 2500);
		},
	});
};

export const useTriggerAiSuggestion = (thoughtId?: string) => {
	return useMutation({
		mutationFn: async () => {
			if (thoughtId) {
				return apiClient.post(`/api/ai/thought-ideate`, {
					thoughtId,
				});
			}
		},
	});
};

export const useTriggerAiTitleSuggestion = (thoughtId?: string) => {
	return useMutation({
		mutationFn: async () => {
			if (thoughtId) {
				return apiClient.post(`/api/ai/suggest-title`, {
					thoughtId,
				});
			}
		},
	});
};

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

			const thought = handleSupabaseError(
				await supabase
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
					.single(),
			);

			return {
				...thought,
				collections: thought.collections.flatMap(collection => (collection.collection ? [collection.collection] : [])),
			};
		},
		enabled: !!thoughtId,
	});
};

export const useThoughtEmbeddings = (thoughtId?: string) => {
	useEffect(() => {
		if (!thoughtId) {
			return;
		}

		const channel = supabase
			.channel("thoughtEmbeddings")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "thought_embedding_matches",
					filter: `thought_id=eq.${thoughtId}`,
				},
				() => {
					queryClient.invalidateQueries({
						queryKey: ["thoughtEmbeddings", thoughtId],
					});
				},
			)
			.subscribe();

		return () => {
			channel.unsubscribe();
		};
	}, [thoughtId]);

	return useQuery({
		queryKey: ["thoughtEmbeddings", thoughtId],
		queryFn: async () => {
			if (!thoughtId) {
				return [];
			}

			const { data, error } = await supabase
				.from("thought_embedding_matches")
				.select(
					`
					id,
					thought_embeddings!matches (
						thoughts (
							id,
							title,
							created_at,
							updated_at,
							collection_thoughts (
								collections (
									id,
									title
								)
							)
						)
					)
				`,
				)
				.eq("thought_id", thoughtId);

			if (error) {
				throw error;
			}

			const thoughts: Record<
				string,
				{
					id: string;
					title: string | null;
					created_at: string;
					updated_at: string;
					collections: { id: string; title: string | null }[];
				}
			> = {};

			data.forEach(match => {
				const thoughtEmbedding = fixOneToOne(match.thought_embeddings);
				if (thoughtEmbedding?.thoughts) {
					const thought = thoughtEmbedding.thoughts;
					thoughts[thought.id] = {
						id: thought.id,
						title: thought.title,
						created_at: thought.created_at,
						updated_at: thought.updated_at,
						collections: thought.collection_thoughts?.flatMap(collection =>
							collection.collections ? [collection.collections] : [],
						),
					};
				}
			});

			return Object.values(thoughts);
		},
		throwOnError: true,
	});
};

export const useDeleteThought = (thoughtId?: string) => {
	return useMutation({
		mutationFn: async () => {
			if (!thoughtId) {
				return;
			}
			return supabase.from("thoughts").delete().eq("id", thoughtId);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["thoughts"],
			});
		},
	});
};
