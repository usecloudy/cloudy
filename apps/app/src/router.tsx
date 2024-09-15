import { FC } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";

import { MobileTabBar } from "./components/MobileTabBar";
import { Navbar } from "./components/Navbar";
import { useUserGuard, useUserHandler } from "./stores/user";
import { AuthView } from "./views/auth/AuthView";
import { ForgotPassword } from "./views/auth/ForgotPassword";
import { PasswordResetView } from "./views/auth/PasswordResetView";
import { SignIn } from "./views/auth/SignIn";
import { SignOutView } from "./views/auth/SignOutView";
import { SignUp } from "./views/auth/SignUp";
// Add this import
import { CollectionDetailView } from "./views/collectionDetail/CollectionDetailView";
import { HomeView } from "./views/home/HomeView";
import { RedirectToDefaultOrg } from "./views/home/RedirectToDefaultOrg";
import { LoadingView } from "./views/loading/LoadingView";
import { PaymentSuccessDialog } from "./views/pricing/PaymentSuccessDialog";
import { ThoughtDetailView } from "./views/thoughtDetail/ThoughtDetailView";
import { TopicsView } from "./views/topics/TopicsView";
import { NewOrganizationView } from "./views/workspaces/NewOrganizationView";
import { OrganizationLayout } from "./views/workspaces/OrganizationLayout";
import { OrganizationSettingsView } from "./views/workspaces/OrganizationSettingsView";

const ProtectedLayout: FC = () => {
	const { user, isLoading, isReady } = useUserGuard();

	if (isLoading) {
		return <LoadingView />;
	}

	if (!user) {
		return <Navigate to="/auth" />;
	}

	if (!isReady) {
		return <LoadingView />;
	}

	return (
		<div className="h-dvh w-screen flex flex-col">
			<Navbar />
			<Outlet />
			<MobileTabBar />
			<PaymentSuccessDialog />
		</div>
	);
};

export const Router: FC = () => {
	useUserHandler();
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/auth" element={<AuthView />}>
					<Route path="/auth/" element={<SignIn />} />
					<Route path="/auth/signup" element={<SignUp />} />
					<Route path="/auth/forgot-password" element={<ForgotPassword />} />
				</Route>
				<Route element={<ProtectedLayout />}>
					<Route path="/" element={<RedirectToDefaultOrg />} />
					<Route path="/workspaces/new" element={<NewOrganizationView />} />
					<Route element={<OrganizationLayout />}>
						<Route path="/workspaces/:wsSlug" element={<HomeView />} />
						<Route path="/workspaces/:wsSlug/settings" element={<OrganizationSettingsView />} />
						<Route path="/workspaces/:wsSlug/thoughts/:thoughtId" element={<ThoughtDetailView />} />
						<Route path="/workspaces/:wsSlug/collections/:collectionId" element={<CollectionDetailView />} />
						<Route path="/workspaces/:wsSlug/topics" element={<TopicsView />} />
					</Route>
					<Route path="/auth/password-reset" element={<PasswordResetView />} />
					<Route path="/signout" element={<SignOutView />} />
				</Route>
			</Routes>
		</BrowserRouter>
	);
};
