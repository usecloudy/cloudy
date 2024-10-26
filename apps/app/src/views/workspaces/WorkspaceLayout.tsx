import { WorkspaceRole, handleSupabaseError } from "@cloudy/utils/common";
import { useEffect } from "react";
import { Navigate, Outlet, useNavigate, useParams } from "react-router-dom";
import { useAsync, useLocation } from "react-use";

import { supabase } from "src/clients/supabase";
import { useUser, useUserOptions } from "src/stores/user";
import { useWorkspaceStore } from "src/stores/workspace";

import { LoadingView } from "../loading/LoadingView";
import { SubscriptionModal } from "../pricing/PaymentGuard";
import { useProject, useProjectStore } from "../projects/ProjectContext";

const useWorkspaceSlug = (wsSlug: string) => {
	const user = useUser();
	const { workspace, role, setWorkspace, setRole } = useWorkspaceStore();

	const navigate = useNavigate();

	useAsync(async () => {
		try {
			const workspace = handleSupabaseError(await supabase.from("workspaces").select("*").eq("slug", wsSlug).single());
			const { role } = handleSupabaseError(
				await supabase
					.from("workspace_users")
					.select("role")
					.eq("user_id", user.id)
					.eq("workspace_id", workspace.id)
					.single(),
			);

			setWorkspace(workspace);
			setRole(role as WorkspaceRole);

			return workspace;
		} catch (error) {
			console.error(error);
			navigate("/404");
		}
	}, [wsSlug, user.id]);

	return { isReady: Boolean(workspace && role), workspace, role };
};

export const WorkspaceLayout = () => {
	const { wsSlug, projectSlug } = useParams();
	const userOptions = useUserOptions();
	const { isReady } = useWorkspaceSlug(wsSlug!);

	const { setProject } = useProjectStore();

	useEffect(() => {
		if (wsSlug && wsSlug !== "undefined") {
			userOptions.set("last_opened_workspace", wsSlug);
		}
	}, [wsSlug]);

	useEffect(() => {
		if (!projectSlug) {
			// Clear project when leaving project view
			setProject(null);
		}
	}, [projectSlug, setProject]);

	if (!wsSlug || wsSlug === "undefined") {
		return <Navigate to="/" />;
	}

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
