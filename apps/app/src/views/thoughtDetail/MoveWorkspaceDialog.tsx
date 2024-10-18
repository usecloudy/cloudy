import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRightIcon, CheckIcon } from "lucide-react";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { Dropdown, DropdownItem } from "src/components/Dropdown";
import { useAllUserWorkspaces } from "src/stores/user";
import { useWorkspace } from "src/stores/workspace";
import { makeThoughtUrl } from "src/utils/thought";

import { ThoughtContext } from "./thoughtContext";

export const MoveWorkspaceDialog = () => {
	const { thoughtId } = useContext(ThoughtContext);
	const currentWorkspace = useWorkspace();
	const navigate = useNavigate();

	const { data: allUserWorkspaces } = useAllUserWorkspaces();

	const moveThoughtMutation = useMutation({
		mutationFn: async (newWorkspaceId: string) => {
			await supabase.from("thoughts").update({ workspace_id: newWorkspaceId }).eq("id", thoughtId);
			await supabase.from("collection_thoughts").delete().eq("thought_id", thoughtId); // Delete from all collections because they dont span workspaces
		},
		onSuccess: (_, newWorkspaceId) => {
			const newWorkspace = allUserWorkspaces?.find(w => w.id === newWorkspaceId);
			if (newWorkspace) {
				navigate(makeThoughtUrl(newWorkspace.slug, thoughtId));
			}
		},
	});

	if (!allUserWorkspaces || allUserWorkspaces.length <= 1) {
		return null;
	}

	return (
		<Dropdown
			trigger={
				<Button variant="ghost" size="sm" className="justify-start">
					<ArrowRightIcon className="size-4" />
					Move to workspace
				</Button>
			}>
			{allUserWorkspaces
				.filter(workspace => workspace.id !== currentWorkspace.id)
				.map(workspace => (
					<DropdownItem key={workspace.id} onSelect={() => moveThoughtMutation.mutate(workspace.id)}>
						{workspace.name}
						{moveThoughtMutation.isPending && moveThoughtMutation.variables === workspace.id && (
							<CheckIcon className="ml-2 h-4 w-4 animate-spin" />
						)}
					</DropdownItem>
				))}
		</Dropdown>
	);
};
