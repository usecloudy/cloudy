import { AuthError } from "@supabase/supabase-js";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import { supabase } from "../../clients/supabase";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import LoadingSpinner from "../../components/LoadingSpinner";

type SignUpFormData = {
	fullName: string;
	email: string;
	password: string;
	confirmPassword: string;
};

export const SignUp = () => {
	const {
		register,
		handleSubmit,
		formState: { errors },
		watch,
	} = useForm<SignUpFormData>();
	const [signUpError, setSignUpError] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const signUpMutation = useMutation({
		mutationFn: async (data: SignUpFormData) => {
			const { error } = await supabase.auth.signUp({
				email: data.email,
				password: data.password,
				options: {
					emailRedirectTo: window.location.href,
					data: {
						full_name: data.fullName,
					},
				},
			});
			if (error) throw error;
		},
		onError: error => {
			if (error instanceof AuthError) {
				setSignUpError(error.message);
			} else {
				setSignUpError("An error occurred during sign-up");
			}
		},
	});

	const onSubmit = (data: SignUpFormData) => {
		signUpMutation.mutate(data);
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-2">
			<label htmlFor="fullName" className="font-medium text-secondary">
				Full Name
			</label>
			<Input
				type="text"
				className="bg-white/30"
				placeholder="John Doe"
				{...register("fullName", { required: "Full name is required" })}
			/>
			{errors.fullName && <p className="text-red-500 text-sm">{errors.fullName.message}</p>}
			<label htmlFor="email" className="font-medium text-secondary">
				Email
			</label>
			<Input
				type="email"
				className="bg-white/30"
				placeholder="founders@usecloudy.com"
				{...register("email", { required: "Email is required" })}
			/>
			{errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
			<label htmlFor="password" className="font-medium text-secondary">
				Password
			</label>
			<div className="relative">
				<Input
					type={showPassword ? "text" : "password"}
					className="bg-white/30"
					placeholder="•••••••"
					{...register("password", {
						required: "Password is required",
						minLength: { value: 6, message: "Password must be at least 6 characters" },
					})}
				/>
				<div className="absolute right-1 top-0 h-full flex items-center">
					<Button type="button" variant="ghost" size="icon-sm" onClick={() => setShowPassword(!showPassword)}>
						{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
					</Button>
				</div>
			</div>
			{errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}

			<label htmlFor="confirmPassword" className="font-medium text-secondary">
				Confirm Password
			</label>
			<div className="relative">
				<Input
					type={showConfirmPassword ? "text" : "password"}
					className="bg-white/30"
					placeholder="•••••••"
					{...register("confirmPassword", {
						required: "Please confirm your password",
						validate: (val: string) => {
							if (watch("password") !== val) {
								return "Your passwords do not match";
							}
						},
					})}
				/>
				<div className="absolute right-1 top-0 h-full flex items-center">
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
						{showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
					</Button>
				</div>
			</div>
			{errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>}

			{signUpError && <p className="text-red-600 text-sm mb-2">{signUpError}</p>}
			<Button type="submit" className="self-stretch mt-4" disabled={signUpMutation.isPending}>
				{signUpMutation.isPending ? <LoadingSpinner size="xs" variant="background" /> : "Sign Up"}
			</Button>
			<div className="text-sm text-muted-foreground text-center mt-4">
				Already have an account?{" "}
				<Link to="/auth" className="text-accent hover:text-accent/70 hover:underline">
					Sign in
				</Link>
			</div>
		</form>
	);
};
