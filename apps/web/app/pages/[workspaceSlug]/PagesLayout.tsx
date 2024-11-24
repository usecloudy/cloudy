import { getLibraryItems, handleSupabaseError } from "@cloudy/utils/common";

import { getSupabaseAnonClient } from "app/utils/supabase";

import { MobileSidebar } from "./MobileSidebar";
import { Navbar } from "./Navbar";
import { NavigationProvider } from "./NavigationContext";
import { Sidebar } from "./Sidebar";

export const PagesLayout = async ({
	children,
	params,
}: {
	children: React.ReactNode;
	params: { workspaceSlug: string; projectSlug?: string };
}) => {
	const supabase = await getSupabaseAnonClient();

	const workspaceId = handleSupabaseError(
		await supabase.from("workspaces").select("id").eq("slug", params.workspaceSlug).single(),
	).id;
	const projectId = params.projectSlug
		? (handleSupabaseError(await supabase.from("projects").select("id").eq("slug", params.projectSlug).maybeSingle())?.id ??
			null)
		: null;

	const libraryItems = await getLibraryItems({ workspaceId, projectId, publishedOnly: true, noEmptyFolders: true }, supabase);

	return (
		<div className="flex">
			<NavigationProvider>
				<Sidebar libraryItems={libraryItems} />
				<MobileSidebar libraryItems={libraryItems} />
				<Navbar />
			</NavigationProvider>
			<div className="md:w-1/4 w-0"></div>
			<div className="flex flex-col w-full md:w-3/4 pt-16">{children}</div>
		</div>
	);
};
