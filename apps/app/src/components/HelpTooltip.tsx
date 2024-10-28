import { CircleHelpIcon } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

type HelpTooltipProps = {
	content: React.ReactNode;
	iconClassName?: string;
};

export const HelpTooltip = ({ content, iconClassName = "size-3.5" }: HelpTooltipProps) => {
	return (
		<Tooltip durationPreset="instant">
			<TooltipTrigger>
				<CircleHelpIcon className={`${iconClassName} cursor-help text-tertiary`} />
			</TooltipTrigger>
			<TooltipContent className="max-w-80 text-xs">{content}</TooltipContent>
		</Tooltip>
	);
};
