import { createContext, useContext, useEffect, useState } from "react";
import { useLocalStorage, useLocation } from "react-use";

export const SidebarContext = createContext<{
	isSidebarCollapsed?: boolean;
	setIsSidebarCollapsed: (isSidebarCollapsed: boolean) => void;
	isMobileSidebarOpen?: boolean;
	setIsMobileSidebarOpen: (isMobileSidebarOpen: boolean) => void;
}>({
	isSidebarCollapsed: false,
	setIsSidebarCollapsed: () => {},
	isMobileSidebarOpen: false,
	setIsMobileSidebarOpen: () => {},
});

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage("isSidebarCollapsed", false);
	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

	const location = useLocation();

	useEffect(() => {
		setIsMobileSidebarOpen(false);
	}, [location.pathname]);

	return (
		<SidebarContext.Provider
			value={{ isSidebarCollapsed, setIsSidebarCollapsed, isMobileSidebarOpen, setIsMobileSidebarOpen }}>
			{children}
		</SidebarContext.Provider>
	);
};

export const useSidebarContext = () => {
	return useContext(SidebarContext);
};
