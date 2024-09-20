import { useMutation } from "@tanstack/react-query";
import { CheckCircle2Icon, Eye, EyeOff } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// Import Lucide icons
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { Input } from "src/components/Input";
import LoadingSpinner from "src/components/LoadingSpinner";
import { SimpleLayout, SimpleLayoutView } from "src/components/SimpleLayout";
import { useUser } from "src/stores/user";

export const PasswordResetView: React.FC = () => {
	const user = useUser();
	const navigate = useNavigate();
	const [newPassword, setNewPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const resetPasswordMutation = useMutation({
		mutationFn: async (password: string) => {
			const { error } = await supabase.auth.updateUser({ password });
			if (error) throw error;
		},
		onSuccess: () => {
			setNewPassword("");
			setError(null);
			navigate("/");
			toast.success("Password updated successfully", { icon: <CheckCircle2Icon className="h-4 w-4" /> });
		},
		onError: error => {
			setError(`Error updating password: ${error.message}`);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		resetPasswordMutation.mutate(newPassword);
	};

	return (
		<SimpleLayout>
			<SimpleLayoutView className="flex h-dvh flex-col items-center justify-center">
				<div className="flex w-full flex-col items-start gap-4 md:w-[24rem]">
					<div className="flex flex-col gap-1">
						<h1 className="font-medium text-secondary">Reset Password</h1>
						<div className="text-sm text-secondary">Resetting password for {user?.email}</div>
					</div>
					<form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
						<div className="relative">
							<Input
								type={showPassword ? "text" : "password"}
								value={newPassword}
								onChange={e => setNewPassword(e.target.value)}
								placeholder="New Password"
								required
							/>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-1 top-1/2 -translate-y-1/2 transform">
								{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
							</Button>
						</div>
						{error && <div className="text-xs text-red-600">{error}</div>}
						<Button type="submit" disabled={resetPasswordMutation.isPending || !newPassword}>
							{resetPasswordMutation.isPending ? (
								<LoadingSpinner size="xs" variant="background" />
							) : (
								"Update Password"
							)}
						</Button>
					</form>
				</div>
			</SimpleLayoutView>
		</SimpleLayout>
	);
};
