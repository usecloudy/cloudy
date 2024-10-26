import { AccessStrategies } from "@cloudy/utils/common";
import { ChevronDownIcon, GlobeIcon, LinkIcon, LockIcon, UsersIcon } from "lucide-react";
import { useContext, useState } from "react";

import { Button } from "src/components/Button";
import { CopyButton } from "src/components/CopyButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "src/components/Dialog";
import { Input } from "src/components/Input";
import { SelectDropdown, SelectOption } from "src/components/SelectDropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "src/components/Tooltip";
import { useWorkspace } from "src/stores/workspace";

import { useEditThought, useThought } from "./hooks";
import { ThoughtContext } from "./thoughtContext";

const makeAccessStrategyInfo = (accessStrategy: AccessStrategies) => {
	switch (accessStrategy) {
		case AccessStrategies.PUBLIC:
			return { label: "Public", icon: <GlobeIcon className="size-4" /> };
		case AccessStrategies.PRIVATE:
			return { label: "Invite only", icon: <LockIcon className="size-4" /> };
		case AccessStrategies.WORKSPACE:
			return { label: "Workspace", icon: <UsersIcon className="size-4" /> };
	}
};

export const ShareDialog = () => {
	const { id: workspaceId } = useWorkspace();
	const { thoughtId } = useContext(ThoughtContext);
	const { data: thought } = useThought(thoughtId);
	const editThoughtMutation = useEditThought(thoughtId);

	const [isOpen, setIsOpen] = useState(false);

	const shareLink = `https://app.usecloudy.com/workspaces/${workspaceId}/thoughts/${thoughtId}`;

	const accessControlOptions: SelectOption[] = [
		{ value: AccessStrategies.PRIVATE, label: "Invite only", icon: <LockIcon className="mr-2 size-4" /> },
		{ value: AccessStrategies.WORKSPACE, label: "Anyone in the workspace", icon: <UsersIcon className="mr-2 size-4" /> },
		{
			value: AccessStrategies.PUBLIC,
			label: "Public (Coming soon)",
			icon: <GlobeIcon className="mr-2 size-4" />,
			disabled: true,
		},
	];

	const handleUpdateAccessStrategy = async (accessStrategy: AccessStrategies) => {
		console.log("updating access strat", accessStrategy);
		await editThoughtMutation.mutateAsync({ accessStrategy, ts: new Date() });
	};

	console.log("access strategy", thought?.access_strategy);

	const currentAccessStrategy = (thought?.access_strategy as AccessStrategies | undefined) ?? AccessStrategies.PRIVATE;
	const { label, icon } = makeAccessStrategyInfo(currentAccessStrategy);

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger>
				<Tooltip durationPreset="short">
					<TooltipTrigger asChild>
						<span>
							<Button variant="outline" size="sm" className="pr-1">
								{icon}
								<span>{label}</span>
								<ChevronDownIcon className="size-4" />
							</Button>
						</span>
					</TooltipTrigger>
					<TooltipContent>
						<span>Document access control</span>
					</TooltipContent>
				</Tooltip>
			</DialogTrigger>
			<DialogContent size="lg">
				<DialogHeader>
					<DialogTitle>Document Sharing</DialogTitle>
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
							value={(thought?.access_strategy as AccessStrategies | undefined) ?? AccessStrategies.PRIVATE}
							onChange={value => handleUpdateAccessStrategy(value as AccessStrategies)}
							placeholder="Select access control"
							className="mt-1 w-full"
						/>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
