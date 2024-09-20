import {
	CheckIcon,
	CircleHelpIcon,
	HandshakeIcon,
	LogOutIcon,
	MenuIcon,
	PlusIcon,
	ScrollTextIcon,
	SettingsIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { Dropdown, DropdownItem } from "src/components/Dropdown";
import { useAllUserWorkspaces, useUserRecord } from "src/stores/user";
import { useWorkspace, useWorkspaceStore } from "src/stores/workspace";
import { cn } from "src/utils";
import { pluralize } from "src/utils/strings";
import { useCustomerStatus } from "src/utils/useCustomerStatus";

export const SidebarDropdown = () => {
	const userRecord = useUserRecord();
	const workspace = useWorkspaceStore(s => s.workspace);

	const { data } = useCustomerStatus();
	const customerStatus = data?.customerStatus;

	const handleSignOut = () => {
		supabase.auth.signOut();
	};

	return (
		<Dropdown
			trigger={
				<Button variant="ghost" size="icon" aria-label="New thought">
					<MenuIcon size={24} />
				</Button>
			}
			className="w-64 pt-2">
			<div className="flex flex-col md:hidden">
				{userRecord && (
					<div className="flex flex-col gap-1 px-2">
						<span className="text-sm font-medium text-secondary">Signed in as</span>
						<span className="text-sm">{userRecord.email}</span>
					</div>
				)}
				<div className="border-b border-border my-2" />
				<WorkspaceList />
				{customerStatus?.isTrialing && (
					<>
						<div className="border-b border-border my-2" />
						<div className="flex flex-col gap-1 px-2">
							<span className="text-sm font-medium text-secondary">Trial Status</span>
							<span className="text-sm">
								{`${pluralize(customerStatus.remainingDaysInTrial ?? 0, "day")} remaining`}
							</span>
						</div>
					</>
				)}
				<div className="border-b border-border my-2" />
			</div>
			<a href="https://usecloudy.com/support">
				<DropdownItem>
					<CircleHelpIcon className="size-4" />
					<span>Support</span>
				</DropdownItem>
			</a>
			<a href="https://usecloudy.com/pp">
				<DropdownItem>
					<HandshakeIcon className="size-4" />
					<span>Privacy Policy</span>
				</DropdownItem>
			</a>
			<a href="https://usecloudy.com/tos">
				<DropdownItem>
					<ScrollTextIcon className="size-4" />
					<span>Terms of Service</span>
				</DropdownItem>
			</a>
			<div className="border-b border-border my-2" />
			<DropdownItem onSelect={handleSignOut} className="text-red-600">
				<LogOutIcon className="size-4" />
				<span>Sign out</span>
			</DropdownItem>
		</Dropdown>
	);
};

const WorkspaceList = () => {
	const currentWorkspace = useWorkspace();
	const { data: allUserWorkspaces } = useAllUserWorkspaces();

	return (
		<div className="flex flex-col">
			<span className="text-sm font-medium text-secondary px-2">Workspace</span>
			{allUserWorkspaces?.map(workspace => (
				<Link to={`/workspaces/${workspace.slug}`} key={workspace.id}>
					<DropdownItem className={cn(workspace.id === currentWorkspace.id ? "bg-card/50" : "")}>
						{workspace.id === currentWorkspace.id ? (
							<CheckIcon className="size-4 stroke-[2.5]" />
						) : (
							<span className="w-4" />
						)}
						<span className={cn("text-sm flex flex-1", workspace.id === currentWorkspace.id ? "font-medium" : "")}>
							{workspace.name}
						</span>
						<Link to={`/workspaces/${workspace.slug}/settings`}>
							<Button variant="ghost" size="icon-xs">
								<SettingsIcon className="size-4" />
							</Button>
						</Link>
					</DropdownItem>
				</Link>
			))}
			<Link to="/workspaces/new">
				<DropdownItem>
					<PlusIcon className="size-4" />
					<span className="text-sm">Create new workspace</span>
				</DropdownItem>
			</Link>
		</div>
	);
};
