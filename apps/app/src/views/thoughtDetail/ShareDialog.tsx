import { AccessStrategies } from "@cloudy/utils/common";
import { ChevronDownIcon, GlobeIcon, LinkIcon, LockIcon, PlusIcon, UsersIcon, XIcon } from "lucide-react";
import { useContext, useState } from "react";

import { Button } from "src/components/Button";
import { CopyButton } from "src/components/CopyButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "src/components/Dialog";
import { Input } from "src/components/Input";
import { SelectDropdown, SelectOption } from "src/components/SelectDropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "src/components/Tooltip";
import { Avatar } from "src/components/users/Avatar";
import { useWorkspace } from "src/stores/workspace";

import { useAddDocumentUser, useDocumentAccessControl, useRemoveDocumentUser } from "./accessControl";
import { useEditThought } from "./hooks";
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

	const { accessStrategy, users } = useDocumentAccessControl(thoughtId);
	const editThoughtMutation = useEditThought(thoughtId);

	const [isOpen, setIsOpen] = useState(false);
	const [email, setEmail] = useState("");
	const addUserMutation = useAddDocumentUser(thoughtId);
	const removeUserMutation = useRemoveDocumentUser(thoughtId);

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

	const currentAccessStrategy = accessStrategy ?? AccessStrategies.PRIVATE;
	const { label, icon } = makeAccessStrategyInfo(currentAccessStrategy);

	const handleInviteUser = async () => {
		try {
			await addUserMutation.mutateAsync(email);
			setEmail(""); // Clear input on success
		} catch (error) {
			// You might want to show an error toast here
			console.error("Failed to invite user:", error);
		}
	};

	const handleRemoveUser = async (userId: string) => {
		try {
			await removeUserMutation.mutateAsync(userId);
		} catch (error) {
			console.error("Failed to remove user:", error);
		}
	};

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
							value={currentAccessStrategy}
							onChange={value => handleUpdateAccessStrategy(value as AccessStrategies)}
							placeholder="Select access control"
							className="mt-1 w-full"
						/>
					</div>

					{/* New user sharing section */}
					<div>
						<label htmlFor="invite-users" className="text-sm">
							Invite Users
						</label>
						<div className="mt-1 flex gap-2">
							<Input
								id="invite-users"
								placeholder="Enter email address"
								className="flex-grow"
								value={email}
								onChange={e => setEmail(e.target.value)}
								onKeyDown={e => {
									if (e.key === "Enter" && email) {
										handleInviteUser();
									}
								}}
							/>
							<Button variant="outline" onClick={handleInviteUser} disabled={!email || addUserMutation.isPending}>
								{addUserMutation.isPending ? (
									<span className="animate-spin">...</span>
								) : (
									<>
										<PlusIcon className="size-4" />
										Invite
									</>
								)}
							</Button>
						</div>
					</div>
					<div>
						<label className="text-sm">People with access</label>
						<div className="mt-2 space-y-2">
							{users?.map(user => (
								<div key={user.id} className="flex items-center justify-between rounded-md border p-2">
									<div className="flex items-center gap-2">
										<Avatar fallback={user.name} size="sm" />
										<div>
											<div className="text-sm font-medium">{user.name || user.email}</div>
											<div className="text-xs text-secondary">{user.email}</div>
										</div>
									</div>
									<div className="flex items-center gap-1">
										{user.isExternal && <div className="text-xs text-secondary">External</div>}
										<Button
											variant="ghost"
											size="icon-sm"
											onClick={() => handleRemoveUser(user.id)}
											disabled={removeUserMutation.isPending}>
											{removeUserMutation.isPending ? (
												<span className="animate-spin">...</span>
											) : (
												<XIcon className="size-4" />
											)}
										</Button>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
