import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Navigate } from "react-router-dom";

import { supabase } from "src/clients/supabase";
import { SimpleLayout } from "src/components/SimpleLayout";
import { useUserGuard } from "src/stores/user";

export const AuthView = () => {
	const { user } = useUserGuard();

	if (user) {
		return <Navigate to="/" />;
	}

	return (
		<SimpleLayout>
			<div className="flex w-full h-dvh flex-col items-center justify-center p-8 overflow-y-scroll">
				<div className="max-w-md">
					<div className="flex flex-col items-center justify-center gap-4">
						<img src="/logo.png" className="w-24" alt="Cloudy" />
						<div className="text-2xl font-bold font-display text-center">Supercharge your thoughts.</div>
						<div className="text-lg font-medium text-secondary text-center">Sign in to Cloudy</div>
					</div>
					<div className="w-full">
						<Auth
							supabaseClient={supabase}
							providers={["google"]}
							appearance={{
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
							}}
						/>
					</div>
				</div>
			</div>
		</SimpleLayout>
	);
};
