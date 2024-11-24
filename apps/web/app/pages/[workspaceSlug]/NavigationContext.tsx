"use client";

import { createContext, useContext, useState } from "react";

export const NavigationContext = createContext<{
	isSidebarOpen: boolean;
	setIsSidebarOpen: (isOpen: boolean) => void;
}>({ isSidebarOpen: false, setIsSidebarOpen: () => {} });

export const useNavigationContext = () => {
	const context = useContext(NavigationContext);
	if (!context) {
		throw new Error("useNavigationContext must be used within a NavigationProvider");
	}
	return context;
};

export const NavigationProvider = ({ children }: { children: React.ReactNode }) => {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	return <NavigationContext.Provider value={{ isSidebarOpen, setIsSidebarOpen }}>{children}</NavigationContext.Provider>;
};
