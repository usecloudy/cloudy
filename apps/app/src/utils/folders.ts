import { AccessStrategies, handleSupabaseError } from "@cloudy/utils/common";
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

export const getRootFolder = async (projectId?: string) => {
	let rootFolderQuery = supabase.from("folders").select("id").eq("is_root", true);
	if (projectId) {
		rootFolderQuery = rootFolderQuery.eq("project_id", projectId);
	} else {
		rootFolderQuery = rootFolderQuery.is("project_id", null);
	}
	return handleSupabaseError(await rootFolderQuery.maybeSingle());
};

export const createRootFolder = async (projectId?: string) => {
	return handleSupabaseError(
		await supabase
			.from("folders")
			.insert({ project_id: projectId ?? null, name: "<ROOT>", is_root: true })
			.select()
			.single(),
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
	category?: "shared" | "private" | "workspace";
	accessStrategy?: AccessStrategies;
};

export type PreFlattenedFolder = FlattenedItem & {
	type: "folder";
	children: FlattenedItem[];
};

export const useLibraryItems = () => {
	const project = useProject();
	const user = useUser();

	return useQuery({
		queryKey: projectQueryKeys.library(project?.id),
		queryFn: async () => {
			let recentDocsQuery = supabase
				.from("thoughts")
				.select("id, title, access_strategy, author_id")
				.is("folder_id", null);

			let docsQuery = supabase
				.from("thoughts")
				.select("id, title, index, folder:folders!inner(id, is_root), access_strategy")
				.not("folder_id", "is", null);

			let foldersQuery = supabase.from("folders").select("id, name, parent_id, is_root, index").eq("is_root", false);

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
			const rootFolder = await getRootFolder(project?.id);
			const folders = handleSupabaseError(await foldersQuery);

			console.log("docs", docs);
			console.log("root", rootFolder);
			const getFolderChildren = (folderId: string, depth: number): FlattenedItem[] => {
				console.log("getFolderChildren", folderId, depth);
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
								index: doc.index!,
								parentId,
								accessStrategy: doc.access_strategy,
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

			const rootItems = rootFolder ? getFolderChildren(rootFolder.id, 0) : [];

			// Separate recent docs into categories
			const sharedDocs = recentDocs
				.filter(doc => doc.access_strategy === AccessStrategies.PRIVATE && doc.author_id !== user.id)
				.map(doc => ({
					id: doc.id,
					type: "document" as const,
					name: doc.title,
					depth: 0,
					parentId: null,
					category: "shared" as const,
					accessStrategy: doc.access_strategy,
				}));

			const privateDocs = recentDocs
				.filter(doc => doc.access_strategy === AccessStrategies.PRIVATE && doc.author_id === user.id)
				.map(doc => ({
					id: doc.id,
					type: "document" as const,
					name: doc.title,
					depth: 0,
					parentId: null,
					category: "private" as const,
					accessStrategy: doc.access_strategy,
				}));

			const workspaceDocs = recentDocs
				.filter(doc => doc.access_strategy !== AccessStrategies.PRIVATE)
				.map(doc => ({
					id: doc.id,
					type: "document" as const,
					name: doc.title,
					depth: 0,
					parentId: null,
					category: "workspace" as const,
					accessStrategy: doc.access_strategy,
				}));

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

			console.log("prevItems", prevItems);
			console.log("newItems", newItems);

			const rootFolder = await getRootFolder(project?.id);

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
						project_id: project?.id,
					})),
				),
			);

			handleSupabaseError(
				await supabase.from("folders").upsert(
					foldersToUpdate.map(folder => ({
						id: folder.id,
						index: folder.index,
						parent_id: folder.parentId,
						project_id: project?.id,
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
			let rootFolder = await getRootFolder(project?.id);
			if (!rootFolder) {
				rootFolder = await createRootFolder(project?.id);
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
			handleSupabaseError(await supabase.from("thoughts").update({ folder_id: null }).eq("id", docId).select());
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
			const rootFolder = await getRootFolder(project?.id);
			if (!rootFolder) return;
			handleSupabaseError(
				await supabase.from("folders").insert({
					project_id: project?.id,
					name: "New Folder",
					is_root: false,
					parent_id: rootFolder.id,
					index: await getFolderChildrenCount(rootFolder.id),
				}),
			);
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

export const useRenameItem = () => {
	const project = useProject();

	return useMutation({
		mutationFn: async (payload: { id: string; name: string; type: "document" | "folder" }) => {
			const { id, name, type } = payload;

			if (type === "document") {
				handleSupabaseError(await supabase.from("thoughts").update({ title: name }).eq("id", id));
			} else {
				handleSupabaseError(await supabase.from("folders").update({ name }).eq("id", id));
			}
		},
		onSuccess: (_, payload) => {
			queryClient.invalidateQueries({ queryKey: projectQueryKeys.library(project?.id) });
			if (payload.type === "document") {
				queryClient.invalidateQueries({ queryKey: thoughtQueryKeys.thoughtDetail(payload.id) });
			}
		},
	});
};

export const useDeleteItem = () => {
	const project = useProject();
	return useMutation({
		mutationFn: async (payload: { id: string; type: "document" | "folder" }) => {
			const { id, type } = payload;
			if (type === "document") {
				handleSupabaseError(await supabase.from("thoughts").delete().eq("id", id));
			} else {
				handleSupabaseError(await supabase.from("folders").delete().eq("id", id));
			}
		},
		onSuccess: (_, payload) => {
			queryClient.invalidateQueries({ queryKey: projectQueryKeys.library(project?.id) });
			if (payload.type === "document") {
				queryClient.invalidateQueries({ queryKey: thoughtQueryKeys.thoughtDetail(payload.id) });
			}
		},
	});
};
