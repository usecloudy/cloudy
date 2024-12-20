import { WorkspaceRole, handleSupabaseError } from "@cloudy/utils/common";
import { useMutation } from "@tanstack/react-query";
import { SendIcon, UserPlus2Icon } from "lucide-react";
import { useFeatureFlagEnabled } from "posthog-js/react";
import { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

import { queryClient } from "src/api/queryClient";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "src/components/Dialog";
import { useWorkspace } from "src/stores/workspace";

const useAddMembers = () => {
	const workspace = useWorkspace();

	return useMutation({
		mutationFn: async (emails: string[]) => {
			const userIds = handleSupabaseError(await supabase.from("users").select("id").in("email", emails));
			handleSupabaseError(
				await supabase.from("workspace_users").insert(
					userIds.map(user => ({
						workspace_id: workspace.id,
						user_id: user.id,
						role: WorkspaceRole.MEMBER,
					})),
				),
			);
		},
		onSuccess: () => {
			// Invalidate and refetch relevant queries
			queryClient.invalidateQueries({ queryKey: [workspace.slug, "members"] });
		},
	});
};

export const AddMembersModal = () => {
	const enableAddWorkspaceMembers = useFeatureFlagEnabled("enable-add-workspace-members");

	const [isOpen, setIsOpen] = useState(false);
	const [emails, setEmails] = useState("");
	const { mutate: addMembers, isPending } = useAddMembers();

	const handleAddMembers = () => {
		const emailList = emails.split(/[\s,]+/).filter(Boolean);
		addMembers(emailList, {
			onSuccess: () => {
				setIsOpen(false);
				setEmails("");
			},
		});
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm" className="self-start" disabled={!enableAddWorkspaceMembers}>
					<UserPlus2Icon className="size-4" />
					<span>Add members</span>
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add Members to Workspace</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-4 py-4">
					<TextareaAutosize
						placeholder="Enter email addresses (separated by commas or new lines)"
						className="min-h-24 w-full resize-none rounded border border-border bg-white/20 px-4 py-3 font-sans text-sm outline-none hover:outline-none focus:outline-none"
						value={emails}
						onChange={e => setEmails(e.target.value)}
					/>
					<Button onClick={handleAddMembers} disabled={isPending || !emails.trim()}>
						<SendIcon className="mr-2 size-4" />
						<span>{isPending ? "Adding..." : "Add Members"}</span>
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};
