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
import { LoadingView } from "./views/loading/LoadingView";
import { SubscriptionModal } from "./views/pricing/PaymentGuard";
import { PaymentSuccessDialog } from "./views/pricing/PaymentSuccessDialog";
import { ThoughtDetailView } from "./views/thoughtDetail/ThoughtDetailView";

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
			<SubscriptionModal />
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
					<Route path="/" element={<HomeView />} />
					<Route path="thoughts/:thoughtId" element={<ThoughtDetailView />} />
					<Route path="collections/:collectionId" element={<CollectionDetailView />} />
					<Route path="/auth/password-reset" element={<PasswordResetView />} />
					<Route path="/signout" element={<SignOutView />} />
				</Route>
			</Routes>
		</BrowserRouter>
	);
};
