import { getLibraryItems, handleSupabaseError } from "@cloudy/utils/common";

import { getSupabaseAnonClient } from "app/utils/supabase";

import { LibraryView } from "./LibraryView";

export const PagesSidebar = async ({ workspaceSlug, projectSlug }: { workspaceSlug: string; projectSlug?: string }) => {
	const supabase = await getSupabaseAnonClient();

	const workspaceId = handleSupabaseError(
		await supabase.from("workspaces").select("id").eq("slug", workspaceSlug).single(),
	).id;
	const projectId = projectSlug
		? (handleSupabaseError(await supabase.from("projects").select("id").eq("slug", projectSlug).maybeSingle())?.id ?? null)
		: null;

	const libraryItems = await getLibraryItems({ workspaceId, projectId }, supabase);

	return (
		<div className="flex flex-col w-1/3 border-r border-border h-dvh sticky top-0 pt-12">
			<LibraryView items={libraryItems} />
		</div>
	);
};
