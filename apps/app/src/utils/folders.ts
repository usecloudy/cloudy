import { AccessStrategies, fixOneToOne, handleSupabaseError } from "@cloudy/utils/common";
import { useMutation, useQuery } from "@tanstack/react-query";
import { produce } from "immer";

import { queryClient } from "src/api/queryClient";
import { projectQueryKeys, thoughtQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";
import { useUser } from "src/stores/user";
import { useWorkspace } from "src/stores/workspace";
import { useProject } from "src/views/projects/ProjectContext";

import { deepEqual, keyBy } from "./object";

type BaseItem = {
	id: string;
	name?: string | null;
	depth: number;
	index?: number | null;
	parentId: string | null;
	category?: "shared" | "private" | "workspace";
};

type FolderItem = BaseItem & {
	type: "folder";
};

type DocumentItem = BaseItem & {
	type: "document";
	isPublished: boolean;
	accessStrategy?: AccessStrategies;
};

export type FlattenedItem = FolderItem | DocumentItem;

export const assignDocumentToFolder = async (docId: string, folderId: string) => {
	await supabase
		.from("thoughts")
		.update({ folder_id: folderId, index: await getFolderChildrenCount(folderId) })
		.eq("id", docId);
};

export const getRootFolder = async (workspaceId: string, projectId?: string) => {
	let rootFolderQuery = supabase.from("folders").select("id").eq("is_root", true);
	if (projectId) {
		rootFolderQuery = rootFolderQuery.eq("project_id", projectId);
	} else {
		rootFolderQuery = rootFolderQuery.eq("workspace_id", workspaceId).is("project_id", null);
	}
	return handleSupabaseError(await rootFolderQuery.maybeSingle());
};

export const createRootFolder = async (workspaceId: string, projectId?: string) => {
	return handleSupabaseError(
		await supabase
			.from("folders")
			.insert({ project_id: projectId ?? null, name: "<ROOT>", is_root: true, workspace_id: workspaceId })
			.select()
			.single(),
	);
};

export const getFolderChildrenCount = async (folderId: string) => {
	return handleSupabaseError(await supabase.rpc("get_folder_children_count", { p_folder_id: folderId }));
};

export const useLibraryItems = () => {
	const workspace = useWorkspace();
	const project = useProject();
	const user = useUser();

	return useQuery({
		queryKey: projectQueryKeys.library(workspace.id, project?.id),
		queryFn: async () => {
			let recentDocsQuery = supabase
				.from("thoughts")
				.select(
					`
					id, 
					access_strategy,
					author_id,
					title,
					updated_at,
					latest_version:document_versions!latest_version_id(
						id,
						title,
						created_at
					)
				`,
				)
				.eq("workspace_id", workspace.id)
				.is("folder_id", null);

			let docsQuery = supabase
				.from("thoughts")
				.select(
					`
					id, 
					title, 
					index, 
					folder:folders!inner(id, is_root), 
					access_strategy,
					latest_version:document_versions!latest_version_id(
						id,
						title,
						created_at
					)
				`,
				)
				.eq("workspace_id", workspace.id)
				.not("folder_id", "is", null);

			let foldersQuery = supabase
				.from("folders")
				.select("id, name, parent_id, is_root, index")
				.eq("workspace_id", workspace.id)
				.eq("is_root", false);

			if (project) {
				recentDocsQuery = recentDocsQuery.eq("project_id", project.id);
				docsQuery = docsQuery.eq("project_id", project.id);
				foldersQuery = foldersQuery.eq("project_id", project.id);
			} else {
				recentDocsQuery = recentDocsQuery.is("project_id", null);
				docsQuery = docsQuery.is("project_id", null);
				foldersQuery = foldersQuery.is("project_id", null);
			}

			const recentDocs = handleSupabaseError(await recentDocsQuery);
			const docs = handleSupabaseError(await docsQuery);
			const rootFolder = await getRootFolder(workspace.id, project?.id);
			const folders = handleSupabaseError(await foldersQuery);

			const getFolderChildren = (folderId: string, depth: number): FlattenedItem[] => {
				const parentId = folderId === rootFolder!.id ? "<ROOT>" : folderId;
				const childDocs = docs
					.filter(doc => doc.folder?.id === folderId)
					.map(
						doc =>
							({
								id: doc.id,
								type: "document",
								name: doc.title,
								depth,
								index: doc.index,
								parentId,
								accessStrategy: doc.access_strategy as AccessStrategies,
								isPublished: !!fixOneToOne(doc.latest_version),
							}) satisfies DocumentItem,
					);

				const childFolders = folders
					.filter(folder => folder.parent_id === folderId)
					.map(
						folder =>
							({
								id: folder.id,
								type: "folder",
								name: folder.name,
								depth,
								index: folder.index,
								parentId,
							}) satisfies FolderItem,
					);

				const combinedItems = [...childDocs, ...childFolders];

				const sortedItemsAtThisDepth = combinedItems.sort((a, b) => a.index! - b.index!);

				// Get children for each folder and insert them after their parent folder
				let result: FlattenedItem[] = [];
				for (const item of sortedItemsAtThisDepth) {
					result.push(item);
					if (item.type === "folder") {
						const folderChildren = getFolderChildren(item.id, depth + 1);
						result.push(...folderChildren);
					}
				}

				return result;
			};

			const rootItems = rootFolder ? getFolderChildren(rootFolder.id, 0) : [];

			recentDocs.sort((a, b) => {
				const aLatestVersion = fixOneToOne(a.latest_version);
				const bLatestVersion = fixOneToOne(b.latest_version);

				return (
					new Date(bLatestVersion?.created_at ?? b.updated_at).getTime() -
					new Date(aLatestVersion?.created_at ?? a.updated_at).getTime()
				);
			});

			// Separate recent docs into categories
			const sharedDocs = recentDocs
				.filter(doc => doc.access_strategy === AccessStrategies.PRIVATE && doc.author_id !== user.id)
				.map(
					doc =>
						({
							id: doc.id,
							type: "document",
							name: fixOneToOne(doc.latest_version)?.title ?? doc.title,
							depth: 0,
							parentId: null,
							category: "shared" as const,
							accessStrategy: doc.access_strategy as AccessStrategies,
							isPublished: !!fixOneToOne(doc.latest_version),
						}) satisfies DocumentItem,
				);

			const privateDocs = recentDocs
				.filter(doc => doc.access_strategy === AccessStrategies.PRIVATE && doc.author_id === user.id)
				.map(
					doc =>
						({
							id: doc.id,
							type: "document",
							name: fixOneToOne(doc.latest_version)?.title ?? doc.title,
							depth: 0,
							parentId: null,
							category: "private" as const,
							accessStrategy: doc.access_strategy as AccessStrategies,
							isPublished: !!fixOneToOne(doc.latest_version),
						}) satisfies DocumentItem,
				);

			const workspaceDocs = recentDocs
				.filter(doc => doc.access_strategy !== AccessStrategies.PRIVATE)
				.map(
					doc =>
						({
							id: doc.id,
							type: "document",
							name: fixOneToOne(doc.latest_version)?.title ?? doc.title,
							depth: 0,
							parentId: null,
							category: "workspace" as const,
							accessStrategy: doc.access_strategy as AccessStrategies,
							isPublished: !!fixOneToOne(doc.latest_version),
						}) satisfies DocumentItem,
				);

			let items = [...rootItems, ...sharedDocs, ...privateDocs, ...workspaceDocs];

			return items as (FlattenedItem & { category?: "shared" | "private" | "workspace" })[];
		},
		initialData: [],
	});
};

export const useSetLibraryItems = () => {
	const workspace = useWorkspace();
	const project = useProject();

	return useMutation({
		mutationFn: async (payload: { prevItems: FlattenedItem[]; newItems: FlattenedItem[] }) => {
			const { prevItems, newItems } = payload;

			const rootFolder = await getRootFolder(workspace.id, project?.id);

			if (!rootFolder) {
				return;
			}

			const deRootedPrevItems = prevItems.map(item =>
				produce(item, draft => {
					if (draft.parentId === "<ROOT>") {
						draft.parentId = rootFolder.id;
					}
				}),
			) as FlattenedItem[];
			const deRootedNewItems = newItems.map(item =>
				produce(item, draft => {
					if (draft.parentId === "<ROOT>") {
						draft.parentId = rootFolder.id;
					}
				}),
			) as FlattenedItem[];

			const prevItemsById = keyBy(deRootedPrevItems, "id");

			const itemsToUpdate = deRootedNewItems.filter(item => {
				const prevItem = prevItemsById[item.id];
				if (deepEqual(prevItem, item)) return false;
				return true;
			});

			const docsToUpdate = itemsToUpdate.filter(item => item.type === "document");
			const foldersToUpdate = itemsToUpdate.filter(item => item.type === "folder");

			await Promise.all([
				handleSupabaseError(
					await supabase.from("thoughts").upsert(
						docsToUpdate.map(doc => ({
							id: doc.id,
							folder_id: doc.parentId,
							index: doc.index,
							workspace_id: workspace.id,
							project_id: project?.id,
						})),
					),
				),
				handleSupabaseError(
					await supabase.from("folders").upsert(
						foldersToUpdate.map(folder => ({
							id: folder.id,
							index: folder.index,
							parent_id: folder.parentId,
							project_id: project?.id,
							workspace_id: workspace.id,
						})),
					),
				),
			]);
		},
		onMutate: ({ newItems }) => {
			queryClient.setQueryData(projectQueryKeys.library(workspace.id, project?.id), newItems);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: projectQueryKeys.library(workspace.id, project?.id) });
		},
	});
};

export const useMakeInitialLibrary = () => {
	const workspace = useWorkspace();
	const project = useProject();

	return useMutation({
		mutationFn: async (initialDocId?: string) => {
			let rootFolder = await getRootFolder(workspace.id, project?.id);
			if (!rootFolder) {
				rootFolder = await createRootFolder(workspace.id, project?.id);
			}

			if (initialDocId) {
				await assignDocumentToFolder(initialDocId, rootFolder.id);
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: projectQueryKeys.library(workspace.id, project?.id) });
		},
	});
};

export const useMoveOutOfLibrary = () => {
	const workspace = useWorkspace();
	const project = useProject();

	return useMutation({
		mutationFn: async (docId: string) => {
			handleSupabaseError(await supabase.from("thoughts").update({ folder_id: null }).eq("id", docId).select());
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: projectQueryKeys.library(workspace.id, project?.id) });
		},
	});
};

export const useCreateFolder = () => {
	const workspace = useWorkspace();
	const project = useProject();

	return useMutation({
		mutationFn: async () => {
			const rootFolder = await getRootFolder(workspace.id, project?.id);
			if (!rootFolder) return;
			handleSupabaseError(
				await supabase.from("folders").insert({
					project_id: project?.id,
					name: "New Folder",
					is_root: false,
					parent_id: rootFolder.id,
					index: await getFolderChildrenCount(rootFolder.id),
					workspace_id: workspace.id,
				}),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: projectQueryKeys.library(workspace.id, project?.id) });
		},
	});
};

export const syncItemIndices = (items: FlattenedItem[]) =>
	produce(items, draft => {
		// Create a map to store indices for each folder level
		const folderIndices = new Map<string, number>();

		// Helper to get the current index for a parent and increment it
		const getNextIndex = (parentId: string | null) => {
			const key = parentId ?? "<ROOT>";
			const currentIndex = folderIndices.get(key) ?? 0;
			folderIndices.set(key, currentIndex + 1);
			return currentIndex;
		};

		// Process items in order, maintaining hierarchy
		for (let i = 0; i < draft.length; i++) {
			const item = draft[i];
			const parentId = item.parentId;

			// Set the index for this item
			item.index = getNextIndex(parentId);

			// If this is a folder, ensure all its immediate children come next
			if (item.type === "folder") {
				// Find all immediate children of this folder
				let insertPosition = i + 1;
				let j = insertPosition;

				// Collect and move all immediate children right after their parent
				while (j < draft.length) {
					if (draft[j].parentId === item.id) {
						// If not already in the right position, move it
						if (j !== insertPosition) {
							const [child] = draft.splice(j, 1);
							draft.splice(insertPosition, 0, child);
						}
						insertPosition++;
					}
					j++;
				}
			}
		}
	});

export const useRenameItem = () => {
	const workspace = useWorkspace();
	const project = useProject();

	return useMutation({
		mutationFn: async (payload: { id: string; name: string; type: "document" | "folder" | "document-not-published" }) => {
			const { id, name, type } = payload;

			if (type === "folder") {
				handleSupabaseError(await supabase.from("folders").update({ name }).eq("id", id));
			} else {
				handleSupabaseError(await supabase.from("thoughts").update({ title: name }).eq("id", id));
			}
		},
		onSuccess: (_, payload) => {
			queryClient.invalidateQueries({ queryKey: projectQueryKeys.library(workspace.id, project?.id) });
			if (payload.type === "document") {
				queryClient.invalidateQueries({ queryKey: thoughtQueryKeys.thoughtDetail(payload.id) });
			}
		},
	});
};

export const useDeleteItem = () => {
	const workspace = useWorkspace();
	const project = useProject();

	return useMutation({
		mutationFn: async (payload: { id: string; type: "document" | "folder" | "document-not-published" }) => {
			const { id, type } = payload;
			if (type === "folder") {
				handleSupabaseError(await supabase.from("folders").delete().eq("id", id));
			} else {
				handleSupabaseError(await supabase.from("thoughts").delete().eq("id", id));
			}
		},
		onSuccess: (_, payload) => {
			queryClient.invalidateQueries({ queryKey: projectQueryKeys.library(workspace.id, project?.id) });
			if (payload.type !== "folder") {
				queryClient.invalidateQueries({ queryKey: thoughtQueryKeys.thoughtDetail(payload.id) });
			}
		},
	});
};
