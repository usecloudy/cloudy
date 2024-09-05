import { handleSupabaseError } from "@cloudy/utils/common";
import { useMutation, useQuery } from "@tanstack/react-query";
import { distance } from "fastest-levenshtein";
import posthog from "posthog-js";
import { useEffect } from "react";

import { apiClient } from "../../api/client";
import { queryClient } from "../../api/queryClient";
import { supabase } from "../../clients/supabase";
import { fixOneToOne } from "../../utils";
import { useThoughtStore } from "./thoughtStore";

const MINIMUM_CONTENT_LENGTH = 3;
const MINIMUM_EDIT_DISTANCE = 64;

const triggerAiUpdatesWhenChangeIsSignificant = async (
	thoughtId: string,
	contentMd: string,
	lastContentMd?: string | null,
	force?: boolean,
) => {
	if (!force) {
		if (lastContentMd === contentMd) {
			return;
		}

		if (contentMd.length < MINIMUM_CONTENT_LENGTH) {
			return;
		}

		if (lastContentMd) {
			const editDistance = distance(contentMd, lastContentMd);

			if (editDistance < MINIMUM_EDIT_DISTANCE) {
				return;
			}
		}
	}

	await apiClient.post(
		`/api/ai/update-thought`,
		{
			thoughtId,
			force,
		},
		{ timeout: 90000 },
	);
};

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

			const newThought = handleSupabaseError(
				await supabase
					.from("thoughts")
					.upsert({
						id: thoughtId,
						...titleObj,
						...contentObj,
						...(payload.contentMd !== undefined && { content_md: payload.contentMd }),
					})
					.select()
					.single(),
			);

			triggerAiUpdatesWhenChangeIsSignificant(
				newThought.id,
				newThought.content_md ?? "",
				newThought.last_suggestion_content_md,
			);

			posthog.capture("edit_thought", {
				thoughtId,
			});

			return newThought;
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

export const useRelatedThoughts = (thoughtId?: string) => {
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
					thought:thoughts!matches_thought_id (
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
				const thought = fixOneToOne(match.thought);
				if (thought) {
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

export const useComments = (thoughtId: string) => {
	useEffect(() => {
		const channel = supabase
			.channel("ideaSuggestions")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "thought_chats",
					filter: `thought_id=eq.${thoughtId}`,
				},
				() => {
					queryClient.invalidateQueries({
						queryKey: ["ideaSuggestions", thoughtId],
					});
				},
			)
			.subscribe();

		return () => {
			channel.unsubscribe();
		};
	}, [thoughtId]);

	const useQueryResult = useQuery({
		queryKey: ["ideaSuggestions", thoughtId],
		queryFn: async () => {
			if (thoughtId === "new") return [];

			const { data, error } = await supabase
				.from("thought_chats")
				.select("*, thought_chat_threads(count)")
				.eq("thought_id", thoughtId);

			if (error) throw error;

			const suggestions = data.map(item => ({
				...item,
				threadCount: item.thought_chat_threads[0].count,
			}));

			return suggestions.sort((a, b) => {
				if (a.is_archived !== b.is_archived) return a.is_archived ? 1 : -1;
				if (a.is_pinned !== b.is_pinned) return b.is_pinned ? 1 : -1;
				if (a.type === "title_suggestion" && b.type !== "title_suggestion") return -1;
				if (a.type !== "title_suggestion" && b.type === "title_suggestion") return 1;
				return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
			});
		},
		initialData: [],
	});

	return useQueryResult;
};

export const useRespond = (commentId?: string | null) => {
	const { thoughtId, setActiveThreadCommentId } = useThoughtStore();

	return useMutation({
		mutationFn: async (content: string) => {
			if (!commentId) {
				const comment = handleSupabaseError(
					await supabase
						.from("thought_chats")
						.insert({
							thought_id: thoughtId,
							role: "user",
							type: "comment",
							content,
						})
						.select()
						.single(),
				);

				if (comment) {
					setActiveThreadCommentId(comment.id);
					await apiClient.post("/api/ai/comment-respond", {
						threadId: comment.id,
					});
				}
			} else {
				console.log("commentId", commentId);
				await supabase
					.from("thought_chat_threads")
					.insert({
						comment_id: commentId,
						role: "user",
						content,
					})
					.single();

				await supabase
					.from("thought_chats")
					.update({
						is_thread_loading: true,
					})
					.eq("id", commentId);
			}
		},
		onMutate: () => {
			queryClient.setQueryData(["aiCommentThread", commentId], (data: any) => {
				if (data) {
					return {
						...data,
						is_thread_loading: true,
					};
				}
			});
		},
	});
};
