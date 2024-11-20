import { Hotkey } from "@cloudy/ui";
import { useContext } from "react";

import { Button } from "src/components/Button";
import { useBreakpoint } from "src/utils/tailwind";

import { ThoughtContext } from "./thoughtContext";

export const FooterRow = () => {
	const { showAiEditor, isShowingAiEditorMenu } = useContext(ThoughtContext);

	const isMdBreakpoint = useBreakpoint("md");

	return (
		<div className="pointer-events-none sticky bottom-0 z-10 flex w-full items-center justify-center p-4 md:justify-between">
			<div className="pointer-events-auto">
				<div>
					{!isShowingAiEditorMenu && (
						<Button size="sm" onClick={showAiEditor}>
							{isMdBreakpoint && <Hotkey keys={["Command", "O"]} />}
							<span>Chat</span>
						</Button>
					)}
				</div>
			</div>
		</div>
	);
};
