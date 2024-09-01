import { AuthError } from "@supabase/supabase-js";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import { supabase } from "../../clients/supabase";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";

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

	const onSubmit = async (data: LoginFormData) => {
		try {
			const { error } = await supabase.auth.signInWithPassword({
				email: data.email,
				password: data.password,
			});
			if (error) throw error;
		} catch (error) {
			if (error instanceof AuthError) {
				setLoginError(error.message);
			} else {
				setLoginError("An error occurred");
			}
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4">
			<div className="flex flex-col gap-2">
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
			</div>
			<div className="flex flex-col gap-2">
				<label htmlFor="password" className="font-medium text-secondary">
					Password
				</label>
				<div className="relative">
					<Input
						type={showPassword ? "text" : "password"}
						className="bg-white/30"
						placeholder="•••••••"
						{...register("password", { required: "Password is required" })}
					/>
					<div className="absolute right-1 top-0 h-full flex items-center">
						<Button type="button" variant="ghost" size="icon-sm" onClick={() => setShowPassword(!showPassword)}>
							{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
						</Button>
					</div>
				</div>
				{errors.password && <p className="text-red-600 text-sm">{errors.password.message}</p>}
			</div>
			{loginError && <p className="text-red-600 text-sm mb-2">{loginError}</p>}
			<Button type="submit" className="self-stretch">
				Sign In
			</Button>
			<div className="text-sm text-muted-foreground mt-4 flex flex-row gap-2 items-center justify-between">
				<Link to="/auth/signup" className="text-accent text-left hover:text-accent/70 hover:underline">
					Don't have an account?
				</Link>
				<Link to="/auth/forgot-password" className="text-accent text-right hover:text-accent/70 hover:underline">
					Forgot your password?
				</Link>
			</div>
		</form>
	);
};
