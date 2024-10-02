import { LinkIcon, LockIcon, SquareArrowOutUpRightIcon, UsersIcon } from "lucide-react";
import { useContext, useState } from "react";

import { Button } from "src/components/Button";
import { CopyButton } from "src/components/CopyButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "src/components/Dialog";
import { Input } from "src/components/Input";
import { SelectDropdown, SelectOption } from "src/components/SelectDropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "src/components/Tooltip";
import { useWorkspace } from "src/stores/workspace";

import { ThoughtContext } from "./thoughtContext";

export const ShareDialog = () => {
	const { id: workspaceId } = useWorkspace();
	const { thoughtId } = useContext(ThoughtContext);
	const [isOpen, setIsOpen] = useState(false);
	const [accessControl, setAccessControl] = useState("workspace");

	const shareLink = `https://app.usecloudy.com/workspaces/${workspaceId}/thoughts/${thoughtId}`;

	const accessControlOptions: SelectOption[] = [
		{ value: "workspace", label: "Anyone in the workspace", icon: <UsersIcon className="mr-2 size-4" /> },
		{ value: "public", label: "Public (Coming soon)", icon: <LinkIcon className="mr-2 size-4" />, disabled: true },
		{ value: "private", label: "Invite only (Coming soon)", icon: <LockIcon className="mr-2 size-4" />, disabled: true },
	];

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger>
				<Tooltip durationPreset="short">
					<TooltipTrigger asChild>
						<span>
							<Button variant="ghost" size="icon-sm">
								<SquareArrowOutUpRightIcon className="size-5" />
							</Button>
						</span>
					</TooltipTrigger>
					<TooltipContent>
						<span>Share note</span>
					</TooltipContent>
				</Tooltip>
			</DialogTrigger>
			<DialogContent size="lg">
				<DialogHeader>
					<DialogTitle>Share Note</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div>
						<label htmlFor="share-link" className="text-sm">
							Share link
						</label>
						<div className="mt-1 flex gap-2">
							<Input id="share-link" value={shareLink} readOnly className="flex-grow" />
							<CopyButton textToCopy={shareLink} />
						</div>
					</div>
					<div>
						<label htmlFor="access-control" className="text-sm">
							Access Control
						</label>
						<SelectDropdown
							options={accessControlOptions}
							value={accessControl}
							onChange={setAccessControl}
							placeholder="Select access control"
							className="mt-1 w-full"
						/>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
