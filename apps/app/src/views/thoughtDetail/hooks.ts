import { AccessStrategies, RepoReference, handleSupabaseError } from "@cloudy/utils/common";
import { useIsMutating, useMutation, useQuery } from "@tanstack/react-query";
import { distance } from "fastest-levenshtein";
import posthog from "posthog-js";
import { useContext, useEffect, useState } from "react";

import { collectionQueryKeys, commentThreadQueryKeys, projectQueryKeys, thoughtQueryKeys } from "src/api/queryKeys";
import { useWorkspace } from "src/stores/workspace";

import { apiClient } from "../../api/client";
import { queryClient } from "../../api/queryClient";
import { supabase } from "../../clients/supabase";
import { useProject } from "../projects/ProjectContext";
// import { handleSubmitChat } from "./chat";
import { ThoughtContext } from "./thoughtContext";
import { useThoughtStore } from "./thoughtStore";
import { useTitleStore } from "./titleStore";

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

export interface ThoughtEditPayload {
	title?: string;
	content?: string;
	contentMd?: string;
	contentPlainText?: string;
	collectionId?: string;
	accessStrategy?: AccessStrategies;
	ts: Date;
}

export const useEditThought = (thoughtId?: string) => {
	const workspace = useWorkspace();
	const project = useProject();

	const isMutating = Boolean(useIsMutating({ mutationKey: ["editThought"] }));

	return useMutation({
		mutationKey: ["editThought"],
		mutationFn: async (payload?: ThoughtEditPayload | void) => {
			if (isMutating) {
				console.log("Return on edit thought to prevent race conditions");
				return;
			}

			let titleObj = {};
			if (payload?.title !== undefined) {
				titleObj = { title: payload.title, title_ts: payload.ts, title_suggestion: null };
			}

			let contentObj = {};
			if (payload?.content !== undefined) {
				contentObj = { content: payload.content, content_ts: payload.ts };
			}

			let contentMdObj = {};
			if (payload?.contentMd !== undefined) {
				contentMdObj = { content_md: payload.contentMd };
			}

			let contentPlainTextObj = {};
			if (payload?.contentPlainText !== undefined) {
				contentPlainTextObj = { content_plaintext: payload.contentPlainText };
			}

			let accessStrategyObj = {};
			if (payload?.accessStrategy !== undefined) {
				accessStrategyObj = { access_strategy: payload.accessStrategy };
			}

			const newThought = handleSupabaseError(
				await supabase
					.from("thoughts")
					.upsert({
						id: thoughtId,
						workspace_id: workspace.id,
						project_id: project?.id ?? null,
						updated_at: payload?.ts.toISOString() ?? new Date().toISOString(),
						...titleObj,
						...contentObj,
						...contentMdObj,
						...contentPlainTextObj,
						...accessStrategyObj,
					})
					.select("*, collections:collection_thoughts(collection_id, collection:collections(id))")
					.single(),
			);

			triggerAiUpdatesWhenChangeIsSignificant(
				newThought.id,
				newThought.content_md ?? "",
				newThought.last_suggestion_content_md,
			);

			if (payload?.collectionId) {
				// TODO: make sure this doesn't cause duplicate entries
				await supabase.from("collection_thoughts").insert({
					collection_id: payload.collectionId,
					thought_id: newThought.id,
					workspace_id: workspace.id,
				});
			}

			await supabase
				.from("collections")
				.update({
					updated_at: new Date().toISOString(),
				})
				.in("id", newThought.collections.map(collection => collection.collection?.id).filter(Boolean));

			posthog.capture("edit_thought", {
				thoughtId,
			});

			return newThought;
		},
		onError: e => {
			console.error(e);
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
			queryClient.invalidateQueries({
				queryKey: projectQueryKeys.library(workspace.id, project?.id),
			});
		},
	});
};

export const useForceAiUpdate = (thoughtId?: string) => {
	return useMutation({
		mutationFn: async () => {
			if (!thoughtId) {
				return;
			}

			const { contentMd, lastSuggestionContentMd } = handleSupabaseError(
				await supabase
					.from("thoughts")
					.select("contentMd:content_md, lastSuggestionContentMd:last_suggestion_content_md")
					.eq("id", thoughtId)
					.single(),
			);
			return triggerAiUpdatesWhenChangeIsSignificant(thoughtId, contentMd ?? "", lastSuggestionContentMd, true);
		},
	});
};

export const useThoughtChannelListeners = (thoughtId: string) => {
	useEffect(() => {
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

	useEffect(() => {
		const channel = supabase
			.channel("document_updates")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "document_updates",
					filter: `document_id=eq.${thoughtId}`,
				},
				() => {
					queryClient.invalidateQueries({
						queryKey: thoughtQueryKeys.recentChanges(thoughtId),
					});
				},
			)
			.subscribe();

		return () => {
			channel.unsubscribe();
		};
	}, [thoughtId]);

	useEffect(() => {
		const channel = supabase
			.channel("document_chat_threads")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "chat_threads",
					filter: `document_id=eq.${thoughtId}`,
				},
				() => {
					queryClient.invalidateQueries({
						queryKey: thoughtQueryKeys.threadsForDoc(thoughtId),
					});
				},
			)
			.subscribe();

		return () => {
			channel.unsubscribe();
		};
	}, [thoughtId]);
};

export const useThought = (thoughtId?: string) => {
	return useQuery({
		queryKey: thoughtQueryKeys.thoughtDetail(thoughtId),
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
					.maybeSingle(),
			);

			return thought
				? {
						...thought,
						collections:
							thought.collections.flatMap(collection => (collection.collection ? [collection.collection] : [])) ??
							[],
					}
				: null;
		},
		enabled: !!thoughtId,
	});
};

export const useDeleteThought = () => {
	const workspace = useWorkspace();

	return useMutation({
		mutationFn: async (thoughtId: string) => {
			await supabase.from("thoughts").delete().eq("id", thoughtId);
			return thoughtId;
		},
		onSuccess: (thoughtId: string) => {
			queryClient.invalidateQueries({
				queryKey: thoughtQueryKeys.thoughtDetail(thoughtId),
			});
			queryClient.invalidateQueries({
				queryKey: thoughtQueryKeys.workspaceSidebarLatestThoughts(workspace.id),
			});
			queryClient.invalidateQueries({
				queryKey: collectionQueryKeys.collectionDetailThoughts(),
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

export const useRespond = () => {
	const { thoughtId } = useContext(ThoughtContext);
	const { setActiveThreadCommentId } = useThoughtStore();

	return useMutation({
		mutationFn: async ({ message, commentId }: { message: string; commentId?: string | null }) => {
			let commentIdToSend = commentId;
			if (!commentId) {
				const comment = handleSupabaseError(
					await supabase
						.from("thought_chats")
						.insert({
							thought_id: thoughtId,
							role: "user",
							type: "comment",
							content: message,
							is_thread_loading: true,
						})
						.select()
						.single(),
				);

				if (comment) {
					setActiveThreadCommentId(comment.id);
					commentIdToSend = comment.id;
				}
			} else {
				await supabase
					.from("thought_chat_threads")
					.insert({
						comment_id: commentId,
						role: "user",
						content: message,
					})
					.single();

				await supabase
					.from("thought_chats")
					.update({
						is_thread_loading: true,
					})
					.eq("id", commentId);
			}

			if (!commentIdToSend) {
				throw new Error("Comment ID is not set");
			}

			// handleSubmitChat(commentIdToSend, thoughtId);
		},
		onMutate: ({ commentId }) => {
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

export const useComment = (commentId?: string | null) => {
	useEffect(() => {
		if (!commentId) {
			return;
		}

		const channel = supabase
			.channel("comment")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "thought_chats",
					filter: `id=eq.${commentId}`,
				},
				() => {
					queryClient.invalidateQueries({
						queryKey: commentThreadQueryKeys.comment(commentId),
					});
				},
			)
			.subscribe();

		return () => {
			channel.unsubscribe();
		};
	}, [commentId]);

	return useQuery({
		queryKey: commentThreadQueryKeys.comment(commentId),
		queryFn: async () => {
			if (!commentId) {
				return null;
			}

			const { data } = await supabase.from("thought_chats").select("*").eq("id", commentId).single();

			return data;
		},
		enabled: !!commentId,
		// refetchInterval: q => (q.state.data?.is_thread_loading ? 500 : false),
	});
};

export const useThreadComments = (commentId?: string | null) => {
	useEffect(() => {
		if (!commentId) {
			return;
		}

		const channel = supabase
			.channel("commentThread")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "thought_chat_threads",
					filter: `comment_id=eq.${commentId}`,
				},
				() => {
					queryClient.invalidateQueries({
						queryKey: commentThreadQueryKeys.threadComments(commentId),
					});
				},
			)
			.subscribe();

		return () => {
			channel.unsubscribe();
		};
	}, [commentId]);

	return useQuery({
		queryKey: commentThreadQueryKeys.threadComments(commentId),
		queryFn: async () => {
			if (!commentId) {
				return [];
			}

			const data = handleSupabaseError(
				await supabase.from("thought_chat_threads").select("*").eq("comment_id", commentId).order("created_at"),
			);

			return data;
		},
	});
};

export const useTemporaryComment = (commentId?: string | null) => {
	return useQuery({
		queryKey: commentThreadQueryKeys.temporaryComment(commentId),
		queryFn: async () => {
			if (!commentId) {
				return null;
			}

			return null;
		},
	});
};

export const useToggleDisableTitleSuggestions = () => {
	return useMutation({
		mutationFn: async (payload: { thoughtId: string; disableTitleSuggestions?: boolean }) => {
			let outcome = !payload.disableTitleSuggestions;
			if (typeof payload.disableTitleSuggestions !== "boolean") {
				const currentValue = handleSupabaseError(
					await supabase.from("thoughts").select("disable_title_suggestions").eq("id", payload.thoughtId).single(),
				);

				outcome = !currentValue.disable_title_suggestions;
			}

			await supabase
				.from("thoughts")
				.update({ disable_title_suggestions: outcome, title_suggestion: null })
				.eq("id", payload.thoughtId);
		},

		onSuccess: (_, payload) => {
			queryClient.invalidateQueries({
				queryKey: thoughtQueryKeys.thoughtDetail(payload.thoughtId),
			});
		},
	});
};

export const useGenerateDocument = () => {
	const { editor } = useContext(ThoughtContext);
	const { setTitle } = useTitleStore();

	const [hasStarted, setHasStarted] = useState(false);

	const mutation = useMutation({
		mutationFn: async (docId: string) => {
			if (!editor) {
				throw new Error("Editor not found");
			}

			const response = await fetch(apiClient.getUri({ url: "/api/ai/generate-document" }), {
				method: "POST",
				// @ts-ignore
				headers: {
					...apiClient.defaults.headers.common,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ docId }),
			});

			const reader = response.body?.getReader();
			if (!reader) {
				throw new Error("Failed to get reader from response");
			}

			setHasStarted(true);

			let fullText = "";
			let title = "";
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				const chunk = new TextDecoder().decode(value);
				fullText += chunk;

				if (fullText.startsWith("```title:") && fullText.includes("\n")) {
					title = fullText.split("\n")[0].replace("```title:", "").trim();
					fullText = fullText.split("\n").slice(1).join("\n");
				}

				setTitle(title);
				editor.commands.setContent(fullText);
			}

			if (fullText.split("\n").at(-1)?.trim() === "```") {
				fullText = fullText.split("\n").slice(0, -1).join("\n");
			}

			editor.commands.setContent(fullText);

			setHasStarted(false);

			await supabase.from("thoughts").update({ title, generated_at: new Date().toISOString() }).eq("id", docId);
		},
		onSettled: () => {
			setHasStarted(false);
		},
	});

	return { ...mutation, hasStarted };
};

export const useDefaultThreadId = () => {
	const { thoughtId } = useContext(ThoughtContext);

	return useQuery({
		queryKey: thoughtQueryKeys.defaultThreadId(thoughtId),
		queryFn: async () => {
			const result = handleSupabaseError(
				await supabase
					.from("chat_threads")
					.select("id")
					.eq("document_id", thoughtId)
					.eq("is_default", true)
					.maybeSingle(),
			);

			return result?.id ?? null;
		},
	});
};

export const useExistingLinkedFiles = (docId: string) => {
	return useQuery({
		queryKey: thoughtQueryKeys.existingLinkedFiles(docId),
		queryFn: async () => {
			const repoReferences = handleSupabaseError(
				await supabase
					.from("document_repo_links")
					.select("*, repository_connections(owner, name, default_branch)")
					.eq("document_id", docId),
			);

			return repoReferences.map(repoReference => {
				const branch = repoReference.branch ?? repoReference.repository_connections!.default_branch;
				return {
					...repoReference,
					repoConnectionId: repoReference.repo_connection_id,
					fileName: repoReference.path.split("/").pop(),
					repoFullName: `${repoReference.repository_connections!.owner}/${repoReference.repository_connections!.name}`,
					branch,
					fileUrl: `https://github.com/${repoReference.repository_connections!.owner}/${repoReference.repository_connections!.name}/blob/${branch}/${repoReference.path}`,
				};
			});
		},
	});
};
