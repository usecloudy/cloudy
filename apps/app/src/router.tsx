import { FC } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";

import { Navbar } from "./components/Navbar";
import { useUserGuard, useUserHandler } from "./stores/user";
import { AuthView } from "./views/auth/AuthView";
// Add this import
import { CollectionDetailView } from "./views/collectionDetail/CollectionDetailView";
import { HomeView } from "./views/home/HomeView";
import { LoadingView } from "./views/loading/LoadingView";
import { ThoughtDetailView } from "./views/thoughtDetail/ThoughtDetailView";

const ProtectedLayout: FC = () => {
	const { user, isLoading } = useUserGuard();

	if (isLoading) {
		return <LoadingView />;
	}

	if (!user) {
		return <Navigate to="/auth" />;
	}
	return (
		<>
			<Navbar />
			<Outlet />
		</>
	);
};

export const Router: FC = () => {
	useUserHandler();
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/auth" element={<AuthView />} />
				<Route element={<ProtectedLayout />}>
					<Route path="/" element={<HomeView />} />
					<Route path="thoughts/:thoughtId" element={<ThoughtDetailView />} />
					<Route path="collections/:collectionId" element={<CollectionDetailView />} />
				</Route>
			</Routes>
		</BrowserRouter>
	);
};
