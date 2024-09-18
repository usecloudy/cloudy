import { SiGoogle } from "@icons-pack/react-simple-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2Icon, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import { queryClient } from "src/api/queryClient";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { Input } from "src/components/Input";
import LoadingSpinner from "src/components/LoadingSpinner";
import { SimpleLayout, SimpleLayoutView } from "src/components/SimpleLayout";
import { useUser } from "src/stores/user";

type FormData = {
	displayName: string;
	password: string;
};

export const InviteAcceptView = () => {
	const user = useUser();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const inviteId = searchParams.get("inviteId");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors, isValid },
	} = useForm<FormData>({
		mode: "onChange",
	});

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
		mutationFn: async ({ displayName, password }: FormData) => {
			const { error: updateError } = await supabase.auth.updateUser({
				password,
				data: { display_name: displayName },
			});
			if (updateError) throw updateError;
			await supabase
				.from("users")
				.update({
					name: displayName,
					is_pending: false,
				})
				.eq("id", user.id);
			await supabase.from("workspace_users").insert({
				role: "member",
				user_id: user.id,
				workspace_id: inviteData?.workspace_id!,
			});
			await supabase.from("user_pending_invites").delete().eq("id", inviteId!);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["workspaces"] });
			setError(null);
			navigate("/");
			toast.success("Account setup completed successfully", { icon: <CheckCircle2Icon className="w-4 h-4" /> });
		},
		onError: error => {
			setError(`Error setting up account: ${error.message}`);
		},
	});

	const onSubmit = (data: FormData) => {
		acceptInviteMutation.mutate(data);
	};

	const handleGoogleLink = async () => {
		const { error } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo: `${window.location.origin}/auth/callback`,
			},
		});
		if (error) setError(`Error linking Google account: ${error.message}`);
	};

	if (isLoadingInvite) {
		return <LoadingSpinner />;
	}

	return (
		<SimpleLayout>
			<SimpleLayoutView className="flex flex-col items-center justify-center h-dvh">
				<div className="flex flex-col gap-4 items-start w-full md:w-[24rem]">
					<div className="flex flex-col gap-1">
						<h1 className="font-bold font-display tracking-wide text-lg">Accept Invite</h1>
						{inviteData && (
							<div className="text-secondary text-sm">
								You're invited to join{" "}
								<span className="font-medium text-primary">{inviteData.workspaces?.name}</span>
							</div>
						)}
						<div className="text-secondary text-sm">Setting up account for {user?.email}</div>
					</div>
					<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 w-full">
						<Input
							{...register("displayName", { required: "Display name is required" })}
							placeholder="Display Name"
							inputMode="text"
						/>
						{errors.displayName && <div className="text-red-600 text-xs">{errors.displayName.message}</div>}
						<div className="relative">
							<Input
								{...register("password", { required: "Password is required" })}
								type={showPassword ? "text" : "password"}
								placeholder="Password"
							/>
							{errors.password && <div className="text-red-600 text-xs">{errors.password.message}</div>}
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-1 top-1/2 transform -translate-y-1/2">
								{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
							</Button>
						</div>
						{error && <div className="text-red-600 text-xs">{error}</div>}
						<Button type="submit" disabled={acceptInviteMutation.isPending || !isValid}>
							{acceptInviteMutation.isPending ? (
								<LoadingSpinner size="xs" variant="background" />
							) : (
								"Complete Setup"
							)}
						</Button>
					</form>
					<div className="flex items-center w-full">
						<div className="flex-grow border-t border-gray-300"></div>
						<span className="px-3 text-sm text-gray-500">Or</span>
						<div className="flex-grow border-t border-gray-300"></div>
					</div>
					<Button onClick={handleGoogleLink} className="w-full">
						<SiGoogle className="size-4" />
						<span>Link Google Account</span>
					</Button>
				</div>
			</SimpleLayoutView>
		</SimpleLayout>
	);
};
