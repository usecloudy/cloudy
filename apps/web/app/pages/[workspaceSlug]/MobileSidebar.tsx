"use client";

import { LibraryItem } from "@cloudy/utils/common";
import { XIcon } from "lucide-react";

import { Button } from "app/components/Button";

import { LibraryView } from "./LibraryView";
import { useNavigationContext } from "./NavigationContext";

type MobileSidebarProps = {
	libraryItems: LibraryItem[];
};

export const MobileSidebar = ({ libraryItems }: MobileSidebarProps) => {
	const { isSidebarOpen, setIsSidebarOpen } = useNavigationContext();

	return (
		<div className="md:hidden block">
			{isSidebarOpen && (
				<div
					className="fixed top-0 left-0 w-full h-full bg-background/50 backdrop-blur-sm z-20"
					onClick={() => setIsSidebarOpen(false)}
				/>
			)}
			<div
				className={`transform transition-transform duration-150 ease-in-out
          flex flex-col w-3/4 border-r border-border h-dvh fixed top-0 pt-4 gap-4
          bg-background z-20 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
				<div className="px-4">
					<Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
						<XIcon />
					</Button>
				</div>
				<LibraryView items={libraryItems} />
			</div>
		</div>
	);
};
