import { Hotkey } from "@cloudy/ui";
import { PanelLeftOpenIcon } from "lucide-react";
import { useContext } from "react";

import { Button } from "src/components/Button";
import { useSidebarContext } from "src/views/navigation/SidebarProvider";

import { ThoughtContext } from "../thoughtContext";
import { ChatSection } from "./ChatSection";

export const ChatSectionView = () => {
	const { hideAiEditor } = useContext(ThoughtContext);

	const { setIsSidebarCollapsed } = useSidebarContext();

	return (
		<div className="absolute right-0 top-0 flex h-dvh w-[33vw] shrink-0 flex-col overflow-hidden border-r border-border">
			<div className="flex flex-row items-center justify-between px-4 py-3">
				<Button onClick={() => setIsSidebarCollapsed(false)} variant="ghost" size="icon-sm">
					<PanelLeftOpenIcon className="size-5" />
				</Button>
				<Button onClick={() => hideAiEditor()} variant="outline" size="sm">
					<Hotkey keys={["esc"]} />
					<span>Close chat</span>
				</Button>
			</div>
			<ChatSection />
		</div>
	);
};
