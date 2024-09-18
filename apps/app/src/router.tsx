import { FC } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";

import { useChannelListeners } from "./channelListeners";
import { MobileTabBar } from "./components/MobileTabBar";
import { Navbar } from "./components/Navbar";
import { useUserGuard, useUserHandler } from "./stores/user";
import { AuthView } from "./views/auth/AuthView";
import { ForgotPassword } from "./views/auth/ForgotPassword";
import { InviteAcceptView } from "./views/auth/InviteAcceptView";
import { PasswordResetView } from "./views/auth/PasswordResetView";
import { SignIn } from "./views/auth/SignIn";
import { SignOutView } from "./views/auth/SignOutView";
import { SignUp } from "./views/auth/SignUp";
import { CollectionDetailView } from "./views/collectionDetail/CollectionDetailView";
import { HomeView } from "./views/home/HomeView";
import { RedirectToDefaultOrg } from "./views/home/RedirectToDefaultOrg";
import { LoadingView } from "./views/loading/LoadingView";
import { NotFoundView } from "./views/notFound/NotFoundView";
import { PaymentSuccessDialog } from "./views/pricing/PaymentSuccessDialog";
import { NewThoughtView } from "./views/thoughtDetail/NewThoughtView";
import { ThoughtDetailView } from "./views/thoughtDetail/ThoughtDetailView";
import { WorkspacelessThoughtRedirectView } from "./views/thoughtDetail/WorkspacelessThoughtRedirectView";
import { TopicsView } from "./views/topics/TopicsView";
import { NewWorkspaceView } from "./views/workspaces/NewWorkspaceView";
import { WorkspaceLayout } from "./views/workspaces/WorkspaceLayout";
import { WorkspaceSettingsView } from "./views/workspaces/WorkspaceSettingsView";

const ProtectedLayout: FC = () => {
	const { user, isLoadingAuth, isReady } = useUserGuard();

	useChannelListeners();

	if (isLoadingAuth) {
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
					<Route path="/404" element={<NotFoundView />} />
					<Route path="/workspaces/new" element={<NewWorkspaceView />} />
					<Route path="/thoughts/:thoughtId" element={<WorkspacelessThoughtRedirectView />} />
					<Route path="/workspaces/:wsSlug" element={<WorkspaceLayout />}>
						<Route path="/workspaces/:wsSlug" element={<HomeView />} />
						<Route path="/workspaces/:wsSlug/settings" element={<WorkspaceSettingsView />} />
						<Route path="/workspaces/:wsSlug/thoughts/new" element={<NewThoughtView />} />
						<Route path="/workspaces/:wsSlug/thoughts/:thoughtId" element={<ThoughtDetailView />} />
						<Route path="/workspaces/:wsSlug/collections/:collectionId" element={<CollectionDetailView />} />
						<Route path="/workspaces/:wsSlug/topics" element={<TopicsView />} />
					</Route>
					<Route path="/auth/password-reset" element={<PasswordResetView />} />
					<Route path="/auth/invite-accept" element={<InviteAcceptView />} />
					<Route path="/signout" element={<SignOutView />} />
				</Route>
			</Routes>
		</BrowserRouter>
	);
};
