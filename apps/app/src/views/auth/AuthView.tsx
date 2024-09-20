import { HeroBackground } from "@cloudy/ui";
import { SocialAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";

import { supabase } from "src/clients/supabase";
import { SimpleLayout } from "src/components/SimpleLayout";
import { useUserGuard } from "src/stores/user";

const appearance = {
	theme: ThemeSupa,
	variables: {
		default: {
			colors: {
				brand: "rgb(var(--color-accent))",
				brandAccent: "rgb(var(--color-accent) / 0.8)",
			},
			radii: {
				borderRadiusButton: "0.25rem",
			},
		},
	},
	className: {
		container: "font-sans",
		// button: "bg-accent text-background border-none font-sans font-medium rounded-md hover:bg-red-500",
		label: "font-sans font-medium",
		input: "font-sans rounded",
		message: "font-sans",
		anchor: "font-sans",
	},
};

export const AuthView = () => {
	const { user } = useUserGuard();
	const location = useLocation();

	if (user) {
		return <Navigate to="/" />;
	}

	return (
		<SimpleLayout className="p-2 md:p-8">
			<HeroBackground />
			<div className="flex h-dvh w-full flex-col items-center justify-center overflow-y-scroll p-0 md:p-8">
				<div className="absolute top-4 flex w-full justify-center">
					<img src="/logo.png" className="w-12" alt="Cloudy" />
				</div>
				<div className="relative w-full rounded-lg border border-border bg-background/90 p-6 md:w-[28rem] md:p-8">
					<div className="flex flex-col items-center justify-center gap-4">
						<div className="text-center font-display text-2xl font-bold">
							{location.pathname === "/auth/signup" ? "Sign up to Cloudy" : "Sign in to Cloudy"}
						</div>
					</div>
					<div className="w-full">
						<SocialAuth supabaseClient={supabase} providers={["google"]} appearance={appearance} />
						<Outlet />
					</div>
					<div className="absolute -bottom-12 left-0 flex w-full justify-center md:-bottom-8">
						<p className="mx-8 text-center text-xs text-tertiary">
							By signing up, you agree to our{" "}
							<Link to="https://usecloudy.com/tos" className="text-accent hover:text-accent/70 hover:underline">
								Terms of Service
							</Link>
							{" and "}
							<Link to="https://usecloudy.com/pp" className="text-accent hover:text-accent/70 hover:underline">
								Privacy Policy
							</Link>
							.
						</p>
					</div>
				</div>
			</div>
		</SimpleLayout>
	);
};
