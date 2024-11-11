import { AuthError } from "@supabase/supabase-js";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import { supabase } from "../../clients/supabase";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import LoadingSpinner from "../../components/LoadingSpinner";

export const ForgotPassword = () => {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<{ email: string }>();
	const [resetError, setResetError] = useState<string | null>(null);
	const [resetSuccess, setResetSuccess] = useState<boolean>(false);

	const resetPasswordMutation = useMutation({
		mutationFn: async (email: string) => {
			const { error } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: "https://app.usecloudy.com/auth/password-reset",
			});
			if (error) throw error;
		},
		onSuccess: () => {
			setResetSuccess(true);
		},
		onError: error => {
			if (error instanceof AuthError) {
				setResetError(error.message);
			} else {
				setResetError("An error occurred during password reset");
			}
		},
	});

	const onSubmit = (data: { email: string }) => {
		resetPasswordMutation.mutate(data.email);
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-2">
			<label htmlFor="email" className="font-medium text-secondary">
				Email
			</label>
			<Input
				type="email"
				className="mb-2"
				placeholder="iforgot@usecloudy.com"
				{...register("email", { required: "Email is required" })}
			/>
			{errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
			{resetError && <p className="mb-2 text-sm text-red-600">{resetError}</p>}
			{resetSuccess && <p className="mb-2 text-sm text-green-600">Password reset email sent. Please check your inbox.</p>}
			{!resetSuccess && (
				<Button type="submit" className="self-stretch" disabled={resetPasswordMutation.isPending}>
					{resetPasswordMutation.isPending ? <LoadingSpinner size="xs" variant="background" /> : "Reset Password"}
				</Button>
			)}
			<div className="mt-4 text-center text-sm text-secondary">
				Suddenly remember your password?{" "}
				<Link to="/auth" className="text-accent hover:text-accent/70 hover:underline">
					Sign in
				</Link>
			</div>
		</form>
	);
};
