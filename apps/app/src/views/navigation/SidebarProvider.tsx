import { createContext, useContext, useEffect, useState } from "react";
import { useLocalStorage, useLocation } from "react-use";

export const SidebarContext = createContext<{
	isSidebarCollapsed?: boolean;
	setIsSidebarCollapsed: (isSidebarCollapsed: boolean) => void;
	isSidebarFixed?: boolean;
	setIsSidebarFixed: (isSidebarFixed: boolean) => void;
	isMobileSidebarOpen?: boolean;
	setIsMobileSidebarOpen: (isMobileSidebarOpen: boolean) => void;
}>({
	isSidebarCollapsed: false,
	setIsSidebarCollapsed: () => {},
	isSidebarFixed: false,
	setIsSidebarFixed: () => {},
	isMobileSidebarOpen: false,
	setIsMobileSidebarOpen: () => {},
});

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage("isSidebarCollapsed", false);
	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
	const [isSidebarFixed, setIsSidebarFixed] = useState(false);

	const location = useLocation();

	useEffect(() => {
		setIsMobileSidebarOpen(false);
	}, [location.pathname]);

	return (
		<SidebarContext.Provider
			value={{
				isSidebarCollapsed,
				setIsSidebarCollapsed,
				isMobileSidebarOpen,
				setIsMobileSidebarOpen,
				isSidebarFixed,
				setIsSidebarFixed,
			}}>
			{children}
		</SidebarContext.Provider>
	);
};

export const useSidebarContext = ({ isFixed }: { isFixed?: boolean } = {}) => {
	const context = useContext(SidebarContext);

	useEffect(() => {
		if (typeof isFixed === "boolean") {
			context.setIsSidebarFixed(isFixed);
		}
	}, [isFixed, context]);

	return context;
};
