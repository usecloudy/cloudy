import { AccessStrategies, handleSupabaseError } from "@cloudy/utils/common";
import { useIsMutating, useMutation, useQuery } from "@tanstack/react-query";
import { JSONContent } from "@tiptap/react";
import { distance } from "fastest-levenshtein";
import posthog from "posthog-js";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { apiClient } from "src/api/client";
import { queryClient } from "src/api/queryClient";
import { collectionQueryKeys, projectQueryKeys, thoughtQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";
import { useUser } from "src/stores/user";
import { useWorkspace, useWorkspaceStore } from "src/stores/workspace";
import { makeDocUrl } from "src/utils/thought";
import { useProject } from "src/views/projects/ProjectContext";

import { useDocumentContext } from "../DocumentContext";
import { ThoughtContext } from "./thoughtContext";

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

export interface DocumentEditPayload {
	title?: string;
	contentHtml?: string;
	contentMd?: string;
	contentPlainText?: string;
	contentJson?: JSONContent;
	collectionId?: string;
	accessStrategy?: AccessStrategies;
	ts: Date;
}

export const useEditDocument = (documentId?: string) => {
	const workspace = useWorkspace();
	const project = useProject();

	const isMutating = Boolean(useIsMutating({ mutationKey: ["editDocument"] }));

	return useMutation({
		mutationKey: ["editDocument"],
		mutationFn: async (payload?: DocumentEditPayload | void) => {
			if (isMutating) {
				console.log("Return on edit thought to prevent race conditions");
				return;
			}

			let titleObj = {};
			if (payload?.title !== undefined) {
				titleObj = { title: payload.title, title_ts: payload.ts, title_suggestion: null };
			}

			let contentHtmlObj = {};
			if (payload?.contentHtml !== undefined) {
				contentHtmlObj = { content: payload.contentHtml };
			}

			let contentJsonObj = {};
			if (payload?.contentJson !== undefined) {
				contentJsonObj = { content_json: payload.contentJson, content_ts: payload.ts };
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

			const newDocument = handleSupabaseError(
				await supabase
					.from("thoughts")
					.upsert({
						id: documentId,
						workspace_id: workspace.id,
						project_id: project?.id ?? null,
						updated_at: payload?.ts.toISOString() ?? new Date().toISOString(),
						...titleObj,
						...contentHtmlObj,
						...contentJsonObj,
						...contentMdObj,
						...contentPlainTextObj,
						...accessStrategyObj,
					})
					.select("*, collections:collection_thoughts(collection_id, collection:collections(id))")
					.single(),
			);

			triggerAiUpdatesWhenChangeIsSignificant(
				newDocument.id,
				newDocument.content_md ?? "",
				newDocument.last_suggestion_content_md,
			);

			posthog.capture("edit_thought", {
				documentId,
			});

			return newDocument;
		},
		onError: e => {
			console.error(e);
		},
		onSuccess: doc => {
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

			if (doc) {
				queryClient.invalidateQueries({
					queryKey: thoughtQueryKeys.sharedWith(doc.id),
				});
			}
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
	const { editor, setTitle } = useContext(ThoughtContext);

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

export const usePublishDocumentVersion = () => {
	const user = useUser();
	const workspace = useWorkspace();
	const project = useProject();

	const { documentId } = useDocumentContext();
	const { data: document } = useThought(documentId);

	const { editor } = useContext(ThoughtContext);

	return useMutation({
		mutationFn: async () => {
			if (!editor) {
				throw new Error("Editor not found");
			}

			const result = handleSupabaseError(
				await supabase
					.from("document_versions")
					.insert({
						document_id: documentId,
						published_by: user.id,
						title: document!.title!,
						content_json: editor.getJSON(),
						content_md: editor.storage.markdown.getMarkdown(),
						content_html: editor.getHTML(),
					})
					.select("id")
					.single(),
			);
			handleSupabaseError(await supabase.from("thoughts").update({ latest_version_id: result.id }).eq("id", documentId));
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: thoughtQueryKeys.latestPublishedVersion(documentId),
			});
			queryClient.invalidateQueries({
				queryKey: projectQueryKeys.library(workspace.id, project?.id),
			});
		},
	});
};

export const useCreateDocument = () => {
	const workspace = useWorkspaceStore(s => s.workspace);
	const project = useProject();

	const editDocumentMutation = useEditDocument();
	const navigate = useNavigate();

	return useMutation({
		mutationFn: async (payload: { collectionId?: string }) => {
			if (!workspace) {
				throw new Error("Workspace not found");
			}

			const newDocument = await editDocumentMutation.mutateAsync({
				collectionId: payload.collectionId,
				ts: new Date(),
			});

			return newDocument;
		},
		onError: e => {
			console.error(e);
			toast.error("Failed to create document");
		},
		onSuccess: newDocument => {
			if (workspace && newDocument) {
				navigate(makeDocUrl({ workspaceSlug: workspace.slug, projectSlug: project?.slug, docId: newDocument.id }));
			}
		},
	});
};
