import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2Icon, XIcon } from "lucide-react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import { queryClient } from "src/api/queryClient";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import LoadingSpinner from "src/components/LoadingSpinner";
import { SimpleLayout, SimpleLayoutView } from "src/components/SimpleLayout";
import { useUser } from "src/stores/user";

export const InviteAcceptView = () => {
	const user = useUser();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const inviteId = searchParams.get("inviteId");

	const { data: inviteData, isLoading: isLoadingInvite } = useQuery({
		queryKey: ["invite", inviteId],
		queryFn: async () => {
			if (!inviteId) throw new Error("No invite ID provided");
			const { data, error } = await supabase
				.from("user_pending_invites")
				.select("*, workspaces(name)")
				.eq("id", inviteId)
				.single();
			if (error) throw error;
			return data;
		},
		enabled: !!inviteId,
	});

	const acceptInviteMutation = useMutation({
		mutationFn: async () => {
			await supabase.from("workspace_users").insert({
				role: "member",
				user_id: user.id,
				workspace_id: inviteData?.workspace_id!,
			});
			await supabase.from("user_pending_invites").delete().eq("id", inviteId!);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["workspaces"] });
			navigate("/");
			toast.success("Account setup completed successfully", { icon: <CheckCircle2Icon className="h-4 w-4" /> });
		},
	});

	const declineInviteMutation = useMutation({
		mutationFn: async () => {
			await supabase.from("user_pending_invites").delete().eq("id", inviteId!);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["workspaces"] });
			navigate("/");
			toast.success("Invite declined", { icon: <XIcon className="h-4 w-4" /> });
		},
	});

	const onAccept = () => {
		acceptInviteMutation.mutate();
	};

	const onDecline = () => {
		declineInviteMutation.mutate();
	};

	if (isLoadingInvite) {
		return <LoadingSpinner />;
	}

	if (!inviteData) {
		return <Navigate to="/" />;
	}

	return (
		<SimpleLayout>
			<SimpleLayoutView className="flex h-dvh flex-col items-center justify-center">
				<div className="flex w-full flex-col items-start gap-4 rounded-md border border-border p-4 md:w-[24rem]">
					<div className="flex flex-col gap-1">
						<h1 className="font-display text-lg font-bold tracking-wide">Accept Invite</h1>
						{inviteData && (
							<div className="text-sm text-secondary">
								You've been invited to join{" "}
								<span className="font-medium text-primary">{inviteData.workspaces?.name}</span>
							</div>
						)}
					</div>
					<div className="flex w-full flex-col gap-1">
						<Button onClick={onAccept} className="w-full">
							<CheckCircle2Icon className="h-4 w-4" />
							<span>Accept invite</span>
						</Button>
						<Button onClick={onDecline} className="w-full text-red-600 hover:bg-red-600" variant="ghost">
							<XIcon className="h-4 w-4" />
							<span>Decline invite</span>
						</Button>
					</div>
				</div>
			</SimpleLayoutView>
		</SimpleLayout>
	);
};
