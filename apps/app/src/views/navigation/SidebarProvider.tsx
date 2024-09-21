import { createContext, useContext } from "react";
import { useLocalStorage } from "react-use";

export const SidebarContext = createContext<{
	isSidebarCollapsed?: boolean;
	setIsSidebarCollapsed: (isSidebarCollapsed: boolean) => void;
}>({
	isSidebarCollapsed: false,
	setIsSidebarCollapsed: () => {},
});

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage("isSidebarCollapsed", false);

	return <SidebarContext.Provider value={{ isSidebarCollapsed, setIsSidebarCollapsed }}>{children}</SidebarContext.Provider>;
};

export const useSidebarContext = () => {
	return useContext(SidebarContext);
};
