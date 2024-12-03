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
    path?: string | null;
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

export const createRootFolder = async (
    { workspaceId, projectId }: { workspaceId: string; projectId?: string },
    supabase: SupabaseClient<Database>
) => {
    return handleSupabaseError(
        await supabase
            .from("folders")
            .insert({
                project_id: projectId ?? null,
                name: "<ROOT>",
                is_root: true,
                workspace_id: workspaceId,
                access_strategy: FolderAccessStrategies.PUBLIC,
            })
            .select()
            .single()
    );
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
        publishedOnly,
        noEmptyFolders,
        documentExtension,
        includePrDrafts,
    }: {
        workspaceId: string;
        projectId?: string | null;
        userId?: string | null;
        publishedOnly?: boolean;
        noEmptyFolders?: boolean;
        documentExtension?: string;
        includePrDrafts?: boolean;
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
					),
					document_pr_drafts(
						id
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

    if (publishedOnly) {
        recentDocsQuery = recentDocsQuery.not("latest_version", "is", null);
        docsQuery = docsQuery.not("latest_version", "is", null);
    }

    if (!includePrDrafts) {
        recentDocsQuery = recentDocsQuery.is("document_pr_drafts", null);
        // docsQuery = docsQuery.is("document_pr_drafts", null);
    }

    const recentDocs = userId ? handleSupabaseError(await recentDocsQuery) : [];
    console.log("recentDocs", recentDocs);
    const docs = handleSupabaseError(await docsQuery);
    const rootFolder = await getRootFolder(
        { workspaceId, projectId },
        supabase
    );
    const folders = handleSupabaseError(await foldersQuery);

    const getFolderChildren = (
        folderId: string,
        depth: number,
        parentPath: string = ""
    ): FlattenedItem[] => {
        const parentId = folderId === rootFolder!.id ? "<ROOT>" : folderId;
        const childDocs = docs
            .filter((doc) => doc.folder?.id === folderId)
            .map((doc) => {
                const name =
                    fixOneToOne(doc.latest_version)?.title ?? doc.title;
                return {
                    id: doc.id,
                    type: "document",
                    name,
                    depth,
                    index: doc.index,
                    parentId,
                    path: `${parentPath}/${name}${documentExtension || ""}`,
                    accessStrategy: doc.access_strategy as AccessStrategies,
                    isPublished: !!fixOneToOne(doc.latest_version),
                } satisfies DocumentItem;
            });

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
                        path: `${parentPath}/${folder.name}`,
                    }) satisfies FolderItem
            );

        const combinedItems = [...childDocs, ...childFolders];

        const sortedItemsAtThisDepth = combinedItems.sort(
            (a, b) => a.index! - b.index!
        );

        // Get children for each folder and insert them after their parent folder
        let results: FlattenedItem[] = [];
        for (const item of sortedItemsAtThisDepth) {
            if (item.type === "folder") {
                const folderChildren = getFolderChildren(
                    item.id,
                    depth + 1,
                    item.path
                );
                if (!noEmptyFolders || folderChildren.length > 0) {
                    results.push(item);
                    results.push(...folderChildren);
                }
            } else {
                results.push(item);
            }
        }

        return results;
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
                    path: null,
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
                    path: null,
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
                    path: null,
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

export type LibraryItem = FlattenedItem & {
    category?: "shared" | "private" | "workspace";
};
