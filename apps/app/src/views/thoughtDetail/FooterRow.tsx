import { Hotkey } from "@cloudy/ui";
import { ChevronsDownIcon, ChevronsUpIcon } from "lucide-react";
import { useContext } from "react";

import { Button } from "src/components/Button";
import { useBreakpoint } from "src/utils/tailwind";

import { ThoughtContext } from "./thoughtContext";

export const FooterRow = () => {
	const { hideControlColumn, setHideControlColumn, showAiEditor, isShowingAiEditorMenu } = useContext(ThoughtContext);

	const isMdBreakpoint = useBreakpoint("md");

	return (
		<div className="pointer-events-none sticky bottom-0 z-10 flex w-full items-center justify-center p-4 md:justify-between">
			<div className="pointer-events-auto">
				<div>
					{!isShowingAiEditorMenu && (
						<Button size="sm" onClick={showAiEditor}>
							{isMdBreakpoint && <Hotkey keys={["Command", "i"]} />}
							<span>Chat</span>
						</Button>
					)}
				</div>
				<div className="block lg:hidden">
					{hideControlColumn ? (
						<Button
							className="bg-background text-secondary"
							variant="outline"
							size="sm"
							onClick={() => setHideControlColumn(false)}>
							<ChevronsUpIcon className="size-5" />
							<span>Show panel</span>
						</Button>
					) : (
						<Button
							className="bg-background text-secondary"
							variant="outline"
							size="sm"
							onClick={() => setHideControlColumn(true)}>
							<ChevronsDownIcon className="size-5" />
							<span>Hide panel</span>
						</Button>
					)}
				</div>
			</div>
		</div>
	);
};
