import { handleSupabaseError } from "@cloudy/utils/common";
import { useMutation, useQuery } from "@tanstack/react-query";
import { produce } from "immer";

import { queryClient } from "src/api/queryClient";
import { projectQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";
import { useWorkspace } from "src/stores/workspace";
import { useProject } from "src/views/projects/ProjectContext";

import { deepEqual, keyBy } from "./object";

export const assignDocumentToFolder = async (docId: string, folderId: string) => {
	await supabase
		.from("thoughts")
		.update({ folder_id: folderId, index: await getFolderChildrenCount(folderId) })
		.eq("id", docId);
};

export const getRootFolder = async (projectId: string) => {
	return handleSupabaseError(
		await supabase.from("folders").select("id").eq("project_id", projectId).eq("is_root", true).maybeSingle(),
	);
};

export const createRootFolder = async (projectId: string) => {
	return handleSupabaseError(
		await supabase.from("folders").insert({ project_id: projectId, name: "<ROOT>", is_root: true }).select().single(),
	);
};

export const getFolderChildrenCount = async (folderId: string) => {
	return handleSupabaseError(await supabase.rpc("get_folder_children_count", { p_folder_id: folderId }));
};

export type FlattenedItem = {
	id: string;
	type: "folder" | "document";
	name: string;
	depth: number;
	index: number;
	parentId: string | null;
};

export type PreFlattenedFolder = FlattenedItem & {
	type: "folder";
	children: FlattenedItem[];
};

export const useLibraryItems = () => {
	const project = useProject();
	return useQuery({
		queryKey: projectQueryKeys.library(project?.id),
		queryFn: async () => {
			if (!project) return [];
			const recentDocs = handleSupabaseError(
				await supabase.from("thoughts").select("id, title").eq("project_id", project.id).is("folder_id", null),
			);
			const docs = handleSupabaseError(
				await supabase
					.from("thoughts")
					.select("id, title, index, folder:folders!inner(id, is_root)")
					.eq("project_id", project.id)
					.not("folder_id", "is", null),
			);
			const rootFolder = await getRootFolder(project.id);
			if (!rootFolder) return [];
			const folders = handleSupabaseError(
				await supabase
					.from("folders")
					.select("id, name, parent_id, is_root, index")
					.eq("project_id", project.id)
					.eq("is_root", false),
			);

			console.log("docs", docs);
			console.log("root", rootFolder);
			const getFolderChildren = (folderId: string, depth: number): FlattenedItem[] => {
				console.log("getFolderChildren", folderId, depth);
				const parentId = folderId === rootFolder.id ? "<ROOT>" : folderId;
				const childDocs = docs
					.filter(doc => doc.folder?.id === folderId)
					.map(
						doc =>
							({
								id: doc.id,
								type: "document",
								name: doc.title,
								depth,
								index: doc.index!,
								parentId,
							}) as FlattenedItem,
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
								index: folder.index!,
								parentId,
							}) as FlattenedItem,
					);

				const combinedItems = [...childDocs, ...childFolders];

				const sortedItemsAtThisDepth = combinedItems.sort((a, b) => a.index - b.index);

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

			const rootItems = getFolderChildren(rootFolder.id, 0);

			let items = [
				...rootItems,
				...recentDocs.map(doc => ({
					id: doc.id,
					type: "document",
					name: doc.title,
					depth: 0,
					parentId: null,
				})),
			];

			console.log("items", items);

			return items as FlattenedItem[];
		},
		enabled: Boolean(project),
		initialData: [],
	});
};

export const useSetLibraryItems = () => {
	const workspace = useWorkspace();
	const project = useProject();

	return useMutation({
		mutationFn: async (payload: { prevItems: FlattenedItem[]; newItems: FlattenedItem[] }) => {
			if (!project) return;
			const { prevItems, newItems } = payload;

			console.log("prevItems", prevItems);
			console.log("newItems", newItems);

			const rootFolder = await getRootFolder(project.id);

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

			handleSupabaseError(
				await supabase.from("thoughts").upsert(
					docsToUpdate.map(doc => ({
						id: doc.id,
						folder_id: doc.parentId,
						index: doc.index,
						workspace_id: workspace.id,
					})),
				),
			);

			handleSupabaseError(
				await supabase.from("folders").upsert(
					foldersToUpdate.map(folder => ({
						id: folder.id,
						index: folder.index,
						parent_id: folder.parentId,
						project_id: project.id,
					})),
				),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: projectQueryKeys.library(project?.id) });
		},
	});
};

export const useMakeInitialLibrary = () => {
	const project = useProject();
	return useMutation({
		mutationFn: async (initialDocId?: string) => {
			if (!project) return;

			let rootFolder = await getRootFolder(project.id);
			if (!rootFolder) {
				rootFolder = await createRootFolder(project.id);
			}

			if (initialDocId) {
				await assignDocumentToFolder(initialDocId, rootFolder.id);
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: projectQueryKeys.library(project?.id) });
		},
	});
};

export const useMoveOutOfLibrary = () => {
	const project = useProject();
	return useMutation({
		mutationFn: async (docId: string) => {
			await supabase.from("thoughts").update({ folder_id: null }).eq("id", docId);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: projectQueryKeys.library(project?.id) });
		},
	});
};

export const useCreateFolder = () => {
	const project = useProject();
	return useMutation({
		mutationFn: async () => {
			if (!project) return;
			const rootFolder = await getRootFolder(project.id);
			if (!rootFolder) return;
			await supabase.from("folders").insert({
				project_id: project.id,
				name: "New Folder",
				is_root: false,
				parent_id: rootFolder.id,
				index: await getFolderChildrenCount(rootFolder.id),
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: projectQueryKeys.library(project?.id) });
		},
	});
};

export const syncItemIndices = (items: FlattenedItem[]) =>
	produce(items, draft => {
		let currentFolder: string | null = "<ROOT>";
		let currentFolderIndex = 0;
		for (const item of draft) {
			if (item.parentId !== currentFolder) {
				currentFolder = item.parentId;
				currentFolderIndex = 0;
			}
			item.index = currentFolderIndex;
			currentFolderIndex++;
		}
	});
