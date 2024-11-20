import { Hotkey } from "@cloudy/ui";
import { PanelLeftOpenIcon, XIcon } from "lucide-react";
import { useContext } from "react";

import { Button } from "src/components/Button";
import { useBreakpoint } from "src/utils/tailwind";
import { useSidebarContext } from "src/views/navigation/SidebarProvider";

import { ThoughtContext } from "../thoughtContext";
import { ChatSection } from "./ChatSection";

export const ChatSectionView = () => {
	const isMd = useBreakpoint("md");
	const { hideAiEditor } = useContext(ThoughtContext);

	const { setIsSidebarCollapsed } = useSidebarContext();

	return (
		<div className="absolute right-0 top-0 flex h-full w-full shrink-0 flex-col overflow-hidden border-r border-border md:w-[33vw]">
			<div className="flex flex-row items-center justify-end px-4 py-3 md:justify-between">
				<Button onClick={() => setIsSidebarCollapsed(false)} variant="ghost" size="icon-sm" className="hidden md:flex">
					<PanelLeftOpenIcon className="size-5" />
				</Button>
				<Button onClick={() => hideAiEditor()} variant="outline" size="sm">
					{isMd ? <Hotkey keys={["esc"]} /> : <XIcon className="size-4" />}
					<span>Close chat</span>
				</Button>
			</div>
			<ChatSection />
		</div>
	);
};
