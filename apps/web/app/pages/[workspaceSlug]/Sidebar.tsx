import { LibraryItem } from "@cloudy/utils/common";

import { LibraryView } from "./LibraryView";

export const Sidebar = ({ libraryItems }: { libraryItems: LibraryItem[] }) => {
	return (
		<div className="hidden md:flex fixed left-0 top-0 flex-col w-[25vw] border-r border-border h-dvh pt-16 bg-background z-20">
			<LibraryView items={libraryItems} />
		</div>
	);
};
