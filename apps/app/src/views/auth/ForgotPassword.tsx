import { AuthError } from "@supabase/supabase-js";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import { supabase } from "../../clients/supabase";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";

export const ForgotPassword = () => {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<{ email: string }>();
	const [resetError, setResetError] = useState<string | null>(null);
	const [resetSuccess, setResetSuccess] = useState<boolean>(false);

	const onSubmit = async (data: { email: string }) => {
		try {
			const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
				redirectTo: "https://app.usecloudy.com/auth/password-reset",
			});
			if (error) throw error;
			setResetSuccess(true);
		} catch (error) {
			if (error instanceof AuthError) {
				setResetError(error.message);
			} else {
				setResetError("An error occurred during password reset");
			}
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-2">
			<label htmlFor="email" className="font-medium text-secondary">
				Email
			</label>
			<Input
				type="email"
				className="bg-white/30 mb-2"
				placeholder="iforgot@usecloudy.com"
				{...register("email", { required: "Email is required" })}
			/>
			{errors.email && <p className="text-red-600 text-sm">{errors.email.message}</p>}
			{resetError && <p className="text-red-600 text-sm mb-2">{resetError}</p>}
			{resetSuccess && <p className="text-green-600 text-sm mb-2">Password reset email sent. Please check your inbox.</p>}
			{!resetSuccess && (
				<Button type="submit" className="self-stretch">
					Reset Password
				</Button>
			)}
			<div className="text-sm text-muted-foreground text-center mt-4">
				Suddenly remember your password?{" "}
				<Link to="/auth" className="text-accent hover:text-accent/70 hover:underline">
					Sign in
				</Link>
			</div>
		</form>
	);
};
