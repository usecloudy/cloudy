import {
	FlattenedItem,
	FolderAccessStrategies,
	createRootFolder,
	getLibraryItems,
	getRootFolder,
	handleSupabaseError,
} from "@cloudy/utils/common";
import { useMutation, useQuery } from "@tanstack/react-query";
import { produce } from "immer";

import { queryClient } from "src/api/queryClient";
import { projectQueryKeys, thoughtQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";
import { useUser } from "src/stores/user";
import { useWorkspace } from "src/stores/workspace";
import { useProject } from "src/views/projects/ProjectContext";

import { deepEqual, keyBy } from "./object";

export const assignDocumentToFolder = async (docId: string, folderId: string) => {
	await supabase
		.from("thoughts")
		.update({ folder_id: folderId, index: await getFolderChildrenCount(folderId) })
		.eq("id", docId);
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
			const data = await getLibraryItems(
				{ workspaceId: workspace.id, projectId: project?.id, userId: user?.id },
				supabase,
			);

			return data;
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

			const rootFolder = await getRootFolder({ workspaceId: workspace.id, projectId: project?.id }, supabase);

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
			let rootFolder = await getRootFolder({ workspaceId: workspace.id, projectId: project?.id }, supabase);
			if (!rootFolder) {
				rootFolder = await createRootFolder({ workspaceId: workspace.id, projectId: project?.id }, supabase);
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
			const rootFolder = await getRootFolder({ workspaceId: workspace.id, projectId: project?.id }, supabase);
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
