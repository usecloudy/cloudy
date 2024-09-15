import { WorkspaceRole, handleSupabaseError } from "@cloudy/utils/common";
import { Outlet, useParams } from "react-router-dom";
import { useAsync } from "react-use";

import { supabase } from "src/clients/supabase";
import { useUser } from "src/stores/user";
import { useWorkspaceStore } from "src/stores/workspace";

import { LoadingView } from "../loading/LoadingView";
import { SubscriptionModal } from "../pricing/PaymentGuard";

const useWorkspaceSlug = (wsSlug: string) => {
	const user = useUser();
	const { workspace, role, setWorkspace, setRole } = useWorkspaceStore();

	useAsync(async () => {
		console.log("here");
		const workspace = handleSupabaseError(await supabase.from("workspaces").select("*").eq("slug", wsSlug).single());
		const { role } = handleSupabaseError(
			await supabase
				.from("workspace_users")
				.select("role")
				.eq("user_id", user.id)
				.eq("workspace_id", workspace.id)
				.single(),
		);

		console.log("workspace", workspace);

		setWorkspace(workspace);
		setRole(role as WorkspaceRole);

		return workspace;
	}, [wsSlug, user.id]);

	return Boolean(workspace && role);
};

export const OrganizationLayout = () => {
	const { wsSlug } = useParams();

	const isReady = useWorkspaceSlug(wsSlug!);

	if (!isReady) {
		return <LoadingView />;
	}

	return (
		<>
			<Outlet />
			<SubscriptionModal />
		</>
	);
};
