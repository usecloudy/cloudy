import { fixOneToOne } from "./supabase";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { handleSupabaseError } from "./supabase";
import { AccessStrategies } from "./thought";

export enum FolderAccessStrategies {
    PUBLIC = "public",
    WORKSPACE = "workspace",
}

export type BaseItem = {
    id: string;
    name?: string | null;
    depth: number;
    index?: number | null;
    parentId: string | null;
    category?: "shared" | "private" | "workspace";
};

export type FolderItem = BaseItem & {
    type: "folder";
    accessStrategy?: FolderAccessStrategies;
};

export type DocumentItem = BaseItem & {
    type: "document";
    isPublished: boolean;
    accessStrategy?: AccessStrategies;
};

export type FlattenedItem = FolderItem | DocumentItem;

export const getRootFolder = async (
    {
        workspaceId,
        projectId,
    }: {
        workspaceId: string;
        projectId?: string | null;
    },
    supabase: SupabaseClient<Database>
) => {
    let rootFolderQuery = supabase
        .from("folders")
        .select("id")
        .eq("is_root", true);
    if (projectId) {
        rootFolderQuery = rootFolderQuery.eq("project_id", projectId);
    } else {
        rootFolderQuery = rootFolderQuery
            .eq("workspace_id", workspaceId)
            .is("project_id", null);
    }
    return handleSupabaseError(await rootFolderQuery.maybeSingle());
};

export const getFolderBranch = <
    T extends { id: string; parentId: string | null },
>(
    folderId: string,
    allFolders: T[]
): T[] => {
    const folder = allFolders.find((f) => f.id === folderId);
    if (!folder) {
        return [];
    }
    return [
        folder,
        ...(folder.parentId
            ? getFolderBranch(folder.parentId, allFolders)
            : []),
    ];
};

export const getLibraryItems = async (
    {
        workspaceId,
        projectId,
        userId,
    }: {
        workspaceId: string;
        projectId?: string | null;
        userId?: string | null;
    },
    supabase: SupabaseClient<Database>
) => {
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
				`
        )
        .eq("workspace_id", workspaceId)
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
				`
        )
        .eq("workspace_id", workspaceId)
        .not("folder_id", "is", null);

    let foldersQuery = supabase
        .from("folders")
        .select("id, name, parent_id, is_root, index")
        .eq("workspace_id", workspaceId)
        .eq("is_root", false);

    if (projectId) {
        recentDocsQuery = recentDocsQuery.eq("project_id", projectId);
        docsQuery = docsQuery.eq("project_id", projectId);
        foldersQuery = foldersQuery.eq("project_id", projectId);
    } else {
        recentDocsQuery = recentDocsQuery.is("project_id", null);
        docsQuery = docsQuery.is("project_id", null);
        foldersQuery = foldersQuery.is("project_id", null);
    }

    const recentDocs = userId ? handleSupabaseError(await recentDocsQuery) : [];
    const docs = handleSupabaseError(await docsQuery);
    const rootFolder = await getRootFolder(
        { workspaceId, projectId },
        supabase
    );
    const folders = handleSupabaseError(await foldersQuery);

    const getFolderChildren = (
        folderId: string,
        depth: number
    ): FlattenedItem[] => {
        const parentId = folderId === rootFolder!.id ? "<ROOT>" : folderId;
        const childDocs = docs
            .filter((doc) => doc.folder?.id === folderId)
            .map(
                (doc) =>
                    ({
                        id: doc.id,
                        type: "document",
                        name:
                            fixOneToOne(doc.latest_version)?.title ?? doc.title,
                        depth,
                        index: doc.index,
                        parentId,
                        accessStrategy: doc.access_strategy as AccessStrategies,
                        isPublished: !!fixOneToOne(doc.latest_version),
                    }) satisfies DocumentItem
            );

        const childFolders = folders
            .filter((folder) => folder.parent_id === folderId)
            .map(
                (folder) =>
                    ({
                        id: folder.id,
                        type: "folder",
                        name: folder.name,
                        depth,
                        index: folder.index,
                        parentId,
                    }) satisfies FolderItem
            );

        const combinedItems = [...childDocs, ...childFolders];

        const sortedItemsAtThisDepth = combinedItems.sort(
            (a, b) => a.index! - b.index!
        );

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
        .filter(
            (doc) =>
                doc.access_strategy === AccessStrategies.PRIVATE &&
                doc.author_id !== userId
        )
        .map(
            (doc) =>
                ({
                    id: doc.id,
                    type: "document",
                    name: fixOneToOne(doc.latest_version)?.title ?? doc.title,
                    depth: 0,
                    parentId: null,
                    category: "shared" as const,
                    accessStrategy: doc.access_strategy as AccessStrategies,
                    isPublished: !!fixOneToOne(doc.latest_version),
                }) satisfies DocumentItem
        );

    const privateDocs = recentDocs
        .filter(
            (doc) =>
                doc.access_strategy === AccessStrategies.PRIVATE &&
                doc.author_id === userId
        )
        .map(
            (doc) =>
                ({
                    id: doc.id,
                    type: "document",
                    name: fixOneToOne(doc.latest_version)?.title ?? doc.title,
                    depth: 0,
                    parentId: null,
                    category: "private" as const,
                    accessStrategy: doc.access_strategy as AccessStrategies,
                    isPublished: !!fixOneToOne(doc.latest_version),
                }) satisfies DocumentItem
        );

    const workspaceDocs = recentDocs
        .filter((doc) => doc.access_strategy !== AccessStrategies.PRIVATE)
        .map(
            (doc) =>
                ({
                    id: doc.id,
                    type: "document",
                    name: fixOneToOne(doc.latest_version)?.title ?? doc.title,
                    depth: 0,
                    parentId: null,
                    category: "workspace" as const,
                    accessStrategy: doc.access_strategy as AccessStrategies,
                    isPublished: !!fixOneToOne(doc.latest_version),
                }) satisfies DocumentItem
        );

    let items = [...rootItems, ...sharedDocs, ...privateDocs, ...workspaceDocs];

    return items as (FlattenedItem & {
        category?: "shared" | "private" | "workspace";
    })[];
};
