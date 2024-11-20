import { AccessStrategies } from "@cloudy/utils/common";
import { ChevronDownIcon, GlobeIcon, LockIcon, PlusIcon, UsersIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "src/components/Button";
import { CopyButton } from "src/components/CopyButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "src/components/Dialog";
import { Input } from "src/components/Input";
import { SelectDropdown, SelectOption } from "src/components/SelectDropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "src/components/Tooltip";
import { Avatar } from "src/components/users/Avatar";
import { useUser } from "src/stores/user";
import { useWorkspace } from "src/stores/workspace";
import { makeDocUrl } from "src/utils/thought";
import { useProject } from "src/views/projects/ProjectContext";

import { useDocumentContext } from "../DocumentContext";
import { useAddDocumentUser, useDocumentAccessControl, useRemoveDocumentUser } from "../accessControl";
import { useEditThought } from "../editor/hooks";
import { useThought } from "../editor/hooks";

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

type ShareDialogTriggerProps = {
	accessStrategy: AccessStrategies;
};

export const ShareDialogTrigger = ({ accessStrategy }: ShareDialogTriggerProps) => {
	const { label, icon } = makeAccessStrategyInfo(accessStrategy ?? AccessStrategies.PRIVATE);

	return (
		<Button variant="outline" size="sm" className="pr-1">
			{icon}
			<span>{label}</span>
			<ChevronDownIcon className="size-4" />
		</Button>
	);
};

type ShareDialogProps = {
	trigger?: React.ReactNode;
};

export const ShareDialog = ({ trigger }: ShareDialogProps) => {
	const workspace = useWorkspace();
	const project = useProject();
	const user = useUser();

	const { documentId } = useDocumentContext();
	const { data: thought } = useThought(documentId);
	const { accessStrategy, users } = useDocumentAccessControl(documentId);
	const editThoughtMutation = useEditThought(documentId);

	const [isOpen, setIsOpen] = useState(false);
	const [email, setEmail] = useState("");
	const addUserMutation = useAddDocumentUser(documentId);
	const removeUserMutation = useRemoveDocumentUser(documentId);

	const shareLink = `https://app.usecloudy.com${makeDocUrl({
		workspaceSlug: workspace.slug,
		docId: documentId,
		projectSlug: project?.slug,
	})}`;

	const publicLink = `https://usecloudy.com/pages/document/${documentId}`;

	const isAuthor = thought?.author_id === user.id;

	const accessControlOptions: SelectOption[] = [
		{
			value: AccessStrategies.PRIVATE,
			label: isAuthor ? "Invite only" : "Invite only (only the author can set it to this)",
			icon: <LockIcon className="mr-2 size-4" />,
			disabled: !isAuthor,
		},
		{ value: AccessStrategies.WORKSPACE, label: "Anyone in the workspace", icon: <UsersIcon className="mr-2 size-4" /> },
		{
			value: AccessStrategies.PUBLIC,
			label: "Public",
			icon: <GlobeIcon className="mr-2 size-4" />,
		},
	];

	const handleUpdateAccessStrategy = async (accessStrategy: AccessStrategies) => {
		// Prevent non-authors from setting private access
		if (accessStrategy === AccessStrategies.PRIVATE && !isAuthor) {
			return;
		}
		await editThoughtMutation.mutateAsync({ accessStrategy, ts: new Date() });
	};

	const currentAccessStrategy = accessStrategy ?? AccessStrategies.PRIVATE;

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
			<Tooltip durationPreset="short">
				<TooltipTrigger asChild>
					<DialogTrigger>{trigger ?? <ShareDialogTrigger accessStrategy={currentAccessStrategy} />}</DialogTrigger>
				</TooltipTrigger>
				<TooltipContent>
					<span>Control sharing and who has access</span>
				</TooltipContent>
			</Tooltip>
			<DialogContent size="lg">
				<DialogHeader>
					<DialogTitle>Document Sharing</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div>
						<label htmlFor="share-link" className="text-sm">
							Internal link
						</label>
						<div className="mt-1 flex gap-2">
							<Input id="share-link" value={shareLink} readOnly className="flex-grow" />
							<CopyButton textToCopy={shareLink} />
						</div>
					</div>

					{currentAccessStrategy === AccessStrategies.PUBLIC && (
						<div>
							<label htmlFor="public-link" className="text-sm">
								Public link
							</label>
							<div className="mt-1 flex gap-2">
								<Input id="public-link" value={publicLink} readOnly className="flex-grow" />
								<CopyButton textToCopy={publicLink} />
							</div>
						</div>
					)}

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
						<label className="text-sm">People with access</label>
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
										{user.isAuthor ? (
											<div className="text-xs text-secondary">Author</div>
										) : (
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
										)}
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
