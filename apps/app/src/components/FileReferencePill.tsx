import { XIcon } from "lucide-react";

import { Button } from "./Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

export type FileReferencePillProps = {
	path: string;
	onRemove?: () => void;
};

export const FileReferencePill = ({ path, onRemove }: FileReferencePillProps) => {
	return (
		<Tooltip durationPreset="instant">
			<TooltipTrigger>
				<div className="flex h-6 cursor-default flex-row items-center gap-0.5 rounded border border-border px-1.5 text-xs hover:bg-card">
					<span className="truncate">{path.split("/").pop()}</span>
					{onRemove && (
						<Button
							size="icon-xs-overflow"
							variant="ghost"
							className="-mr-2 hover:bg-transparent hover:text-accent active:bg-transparent"
							onClick={onRemove}>
							<XIcon className="size-3" />
						</Button>
					)}
				</div>
			</TooltipTrigger>
			<TooltipContent>
				<span className="text-xs text-secondary">{path}</span>
			</TooltipContent>
		</Tooltip>
	);
};
