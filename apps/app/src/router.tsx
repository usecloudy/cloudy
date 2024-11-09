import { FC } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";

import { useChannelListeners } from "./channelListeners";
import { useCodeThemeClass } from "./stores/theme";
import { useUserGuard, useUserHandler } from "./stores/user";
import { cn } from "./utils";
import { useDebugQuery } from "./utils/debug";
import { AuthView } from "./views/auth/AuthView";
import { ForgotPassword } from "./views/auth/ForgotPassword";
import { InviteAcceptView } from "./views/auth/InviteAcceptView";
import { PasswordResetView } from "./views/auth/PasswordResetView";
import { PendingAccountSetupView } from "./views/auth/PendingAccountSetupView";
import { SignIn } from "./views/auth/SignIn";
import { SignOutView } from "./views/auth/SignOutView";
import { SignUp } from "./views/auth/SignUp";
import { CollectionDetailView } from "./views/collectionDetail/CollectionDetailView";
import { ConnectGithubToWorkspaceView } from "./views/github/ConnectGithubToWorkspaceView";
import { HomeView } from "./views/home/HomeView";
import { RedirectToDefaultOrg } from "./views/home/RedirectToDefaultOrg";
import { LoadingView } from "./views/loading/LoadingView";
import { MobileTabBar } from "./views/navigation/MobileTabBar";
import { Navbar } from "./views/navigation/Navbar";
import { SidebarView } from "./views/navigation/SidebarView";
import { NotFoundView } from "./views/notFound/NotFoundView";
import { PaymentSuccessDialog } from "./views/pricing/PaymentSuccessDialog";
import { NewProjectView } from "./views/projects/NewProjectView";
import { ProjectOutlet } from "./views/projects/ProjectContext";
import { ProjectSettingsView } from "./views/projects/ProjectSettingsView";
import { ProjectView } from "./views/projects/ProjectView";
import { SearchBarControl } from "./views/search/SearchBar";
import { ThoughtDetailView } from "./views/thoughtDetail/ThoughtDetailView";
import { WorkspacelessThoughtRedirectView } from "./views/thoughtDetail/WorkspacelessThoughtRedirectView";
import { InitialCollectionsView } from "./views/workspaces/InitialCollectionsView";
import { NewWorkspaceView } from "./views/workspaces/NewWorkspaceView";
import { WorkspaceLayout } from "./views/workspaces/WorkspaceLayout";
import { WorkspaceSettingsView } from "./views/workspaces/WorkspaceSettingsView";
import { WorkspaceWebsiteOnboardingView } from "./views/workspaces/WorkspaceWebsiteOnboardingView";

const ProtectedLayout: FC = () => {
	useDebugQuery();
	const { user, isLoadingAuth, isReady } = useUserGuard();

	useChannelListeners();

	const codeThemeClass = useCodeThemeClass();

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
		<div className={cn("flex h-dvh w-screen flex-col", codeThemeClass)}>
			<Outlet />
		</div>
	);
};

const SidebarLayout: FC = () => {
	return (
		<>
			<Navbar />
			<div className="flex flex-1 flex-row overflow-hidden">
				<SidebarView />
				<main className="flex h-full w-full flex-col overflow-hidden md:h-screen md:w-auto md:flex-1 md:overflow-hidden">
					<Outlet />
				</main>
			</div>
			<MobileTabBar />
			<SearchBarControl />
			<PaymentSuccessDialog />
		</>
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
					<Route element={<SidebarLayout />}>
						<Route path="/" element={<RedirectToDefaultOrg />} />
						<Route path="/404" element={<NotFoundView />} />
						<Route path="/thoughts/:thoughtId" element={<WorkspacelessThoughtRedirectView />} />
						<Route path="/workspaces/:wsSlug" element={<WorkspaceLayout />}>
							<Route path="/workspaces/:wsSlug" element={<HomeView />} />
							<Route path="/workspaces/:wsSlug/settings" element={<WorkspaceSettingsView />} />
							<Route path="/workspaces/:wsSlug/thoughts/:thoughtId" element={<ThoughtDetailView />} />
							<Route path="/workspaces/:wsSlug/collections/:collectionId" element={<CollectionDetailView />} />
							<Route path="/workspaces/:wsSlug/projects/new" element={<NewProjectView />} />
							<Route path="/workspaces/:wsSlug/projects/:projectSlug" element={<ProjectOutlet />}>
								<Route path="/workspaces/:wsSlug/projects/:projectSlug" element={<ProjectView />} />
								<Route
									path="/workspaces/:wsSlug/projects/:projectSlug/docs/:thoughtId"
									element={<ThoughtDetailView />}
								/>
								<Route
									path="/workspaces/:wsSlug/projects/:projectSlug/settings"
									element={<ProjectSettingsView />}
								/>
							</Route>
						</Route>
						<Route path="/auth/password-reset" element={<PasswordResetView />} />
						<Route path="/auth/invite-accept" element={<InviteAcceptView />} />
						<Route path="/auth/complete-account-setup" element={<PendingAccountSetupView />} />
					</Route>
					<Route path="/onboarding/workspaces/new" element={<NewWorkspaceView />} />
					<Route path="/onboarding/workspaces/new/website-onboarding" element={<WorkspaceWebsiteOnboardingView />} />
					<Route path="/onboarding/integrations/github/connect" element={<ConnectGithubToWorkspaceView />} />
					<Route path="/onboarding/workspaces/:wsSlug" element={<WorkspaceLayout />}>
						<Route path="/onboarding/workspaces/:wsSlug/initial-collections" element={<InitialCollectionsView />} />
					</Route>
				</Route>
				<Route path="/signout" element={<SignOutView />} />
			</Routes>
		</BrowserRouter>
	);
};
