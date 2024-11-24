"use client";

import { MenuIcon } from "lucide-react";

import { Button } from "app/components/Button";
import { ThemeToggle } from "app/components/ThemeToggle";

import { useNavigationContext } from "./NavigationContext";

export const Navbar = () => {
	const { setIsSidebarOpen } = useNavigationContext();

	return (
		<nav className="fixed flex w-full items-center justify-between px-3 h-16 z-10">
			<Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
				<MenuIcon />
			</Button>
			<ThemeToggle />
		</nav>
	);
};
