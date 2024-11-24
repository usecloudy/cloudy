import { getLibraryItems, handleSupabaseError } from "@cloudy/utils/common";

import { getSupabaseAnonClient } from "app/utils/supabase";

import { Sidebar } from "./Sidebar";

export const PagesSidebar = async ({ workspaceSlug, projectSlug }: { workspaceSlug: string; projectSlug?: string }) => {
	const supabase = await getSupabaseAnonClient();

	const workspaceId = handleSupabaseError(
		await supabase.from("workspaces").select("id").eq("slug", workspaceSlug).single(),
	).id;
	const projectId = projectSlug
		? (handleSupabaseError(await supabase.from("projects").select("id").eq("slug", projectSlug).maybeSingle())?.id ?? null)
		: null;

	const libraryItems = await getLibraryItems({ workspaceId, projectId, publishedOnly: true, noEmptyFolders: true }, supabase);

	return <Sidebar libraryItems={libraryItems} />;
};
