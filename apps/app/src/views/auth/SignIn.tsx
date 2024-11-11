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

type LoginFormData = {
	email: string;
	password: string;
};

export const SignIn = () => {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginFormData>();
	const [loginError, setLoginError] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);

	const signInMutation = useMutation({
		mutationFn: async (data: LoginFormData) => {
			const { error } = await supabase.auth.signInWithPassword({
				email: data.email,
				password: data.password,
			});
			if (error) throw error;
		},
		onError: error => {
			if (error instanceof AuthError) {
				setLoginError(error.message);
			} else {
				setLoginError("An error occurred");
			}
		},
		throwOnError: false,
	});

	const onSubmit = (data: LoginFormData) => {
		signInMutation.mutate(data);
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<label htmlFor="email" className="font-medium text-secondary">
					Email
				</label>
				<Input
					type="email"
					placeholder="founders@usecloudy.com"
					{...register("email", { required: "Email is required" })}
				/>
				{errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
			</div>
			<div className="flex flex-col gap-2">
				<label htmlFor="password" className="font-medium text-secondary">
					Password
				</label>
				<div className="relative">
					<Input
						type={showPassword ? "text" : "password"}
						placeholder="•••••••"
						{...register("password", { required: "Password is required" })}
					/>
					<div className="absolute right-1 top-0 flex h-full items-center">
						<Button type="button" variant="ghost" size="icon-sm" onClick={() => setShowPassword(!showPassword)}>
							{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
						</Button>
					</div>
				</div>
				{errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
			</div>
			{loginError && <p className="mb-2 text-sm text-red-600">{loginError}</p>}
			<Button type="submit" className="self-stretch" disabled={signInMutation.isPending}>
				{signInMutation.isPending ? <LoadingSpinner size="xs" variant="background" /> : "Sign In"}
			</Button>
			<div className="mt-4 flex flex-row items-center justify-between gap-2 text-sm text-secondary">
				<Link to="/auth/signup" className="text-left text-accent hover:text-accent/70 hover:underline">
					Don't have an account?
				</Link>
				<Link to="/auth/forgot-password" className="text-right text-accent hover:text-accent/70 hover:underline">
					Forgot your password?
				</Link>
			</div>
		</form>
	);
};
