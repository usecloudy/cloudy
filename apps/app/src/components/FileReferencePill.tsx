import { SiGithub } from "@icons-pack/react-simple-icons";
import { ExternalLinkIcon, XIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "./Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

export type FileReferencePillProps = {
	repoFullName: string;
	path: string;
	fileUrl: string;
	onRemove?: () => void;
};

export const FileReferencePill = ({ repoFullName, path, fileUrl, onRemove }: FileReferencePillProps) => {
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
				<div className="flex flex-col items-center gap-1">
					<div className="flex flex-row items-center gap-1">
						<SiGithub className="size-3.5 text-secondary" />
						<span className="text-xs text-secondary">{repoFullName}</span>
					</div>
					<Link to={fileUrl} target="_blank">
						<div className="flex flex-row items-center gap-1 text-accent hover:opacity-60">
							<span className="text-xs underline">{path}</span>
							<ExternalLinkIcon className="size-3" />
						</div>
					</Link>
				</div>
			</TooltipContent>
		</Tooltip>
	);
};
