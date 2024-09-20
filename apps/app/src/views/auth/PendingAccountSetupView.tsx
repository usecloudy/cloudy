import { SiGoogle } from "@icons-pack/react-simple-icons";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2Icon, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { queryClient } from "src/api/queryClient";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { Input } from "src/components/Input";
import LoadingSpinner from "src/components/LoadingSpinner";
import { SimpleLayout, SimpleLayoutView } from "src/components/SimpleLayout";
import { useUser, useUserRecord } from "src/stores/user";

type FormData = {
	displayName: string;
	password?: string;
};

export const PendingAccountSetupView = () => {
	const user = useUser();
	const userRecord = useUserRecord();
	const navigate = useNavigate();
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors, isValid },
	} = useForm<FormData>({
		mode: "onChange",
	});

	const setupAccountMutation = useMutation({
		mutationFn: async ({ displayName, password }: FormData) => {
			const updateData: any = { data: { display_name: displayName } };
			if (password) {
				updateData.password = password;
			}
			const { error: updateError } = await supabase.auth.updateUser(updateData);
			if (updateError) throw updateError;
			await supabase
				.from("users")
				.update({
					name: displayName,
					is_pending: false,
				})
				.eq("id", user.id);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [user?.id, "userRecord"] });
			setError(null);
			navigate("/");
			toast.success("Account setup completed successfully", { icon: <CheckCircle2Icon className="h-4 w-4" /> });
		},
		onError: error => {
			setError(`Error setting up account: ${error.message}`);
		},
	});

	const hasGoogleProvider = user.app_metadata.providers.includes("google");

	const onSubmit = (data: FormData) => {
		setupAccountMutation.mutate(data);
	};

	const handleGoogleLink = async () => {
		const { error } = await supabase.auth.linkIdentity({
			provider: "google",
			options: {
				redirectTo: window.location.origin,
			},
		});
		if (error) setError(`Error linking Google account: ${error.message}`);
	};

	if (!userRecord.is_pending) {
		return <Navigate to="/" />;
	}

	return (
		<SimpleLayout>
			<SimpleLayoutView className="flex h-dvh flex-col items-center justify-center">
				<div className="flex w-full flex-col items-start gap-4 md:w-[24rem]">
					<div className="flex flex-col gap-1">
						<h1 className="font-display text-lg font-bold tracking-wide">Complete Setup</h1>
						<div className="text-sm text-secondary">Setting up account for {user?.email}</div>
					</div>
					<form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col gap-4">
						<Input
							{...register("displayName", { required: "Display name is required" })}
							placeholder="Display Name"
							inputMode="text"
						/>
						{errors.displayName && <div className="text-xs text-red-600">{errors.displayName.message}</div>}
						{!hasGoogleProvider && (
							<div className="relative">
								<Input
									{...register("password", { required: "Password is required" })}
									type={showPassword ? "text" : "password"}
									placeholder="Password"
								/>
								{errors.password && <div className="text-xs text-red-600">{errors.password.message}</div>}
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-1 top-1/2 -translate-y-1/2 transform">
									{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
								</Button>
							</div>
						)}
						{error && <div className="text-xs text-red-600">{error}</div>}
						<Button type="submit" disabled={setupAccountMutation.isPending || !isValid}>
							{setupAccountMutation.isPending ? (
								<LoadingSpinner size="xs" variant="background" />
							) : (
								"Complete Setup"
							)}
						</Button>
					</form>
					<div className="flex w-full items-center">
						<div className="flex-grow border-t border-gray-300"></div>
						<span className="px-3 text-sm text-gray-500">Or</span>
						<div className="flex-grow border-t border-gray-300"></div>
					</div>
					{!hasGoogleProvider && (
						<Button onClick={handleGoogleLink} className="w-full">
							<SiGoogle className="size-4" />
							<span>Link Google Account</span>
						</Button>
					)}
				</div>
			</SimpleLayoutView>
		</SimpleLayout>
	);
};
