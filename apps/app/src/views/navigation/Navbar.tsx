import { Tag } from "@cloudy/ui";
import {
	ArrowLeft,
	ArrowRight,
	CheckIcon,
	CircleHelpIcon,
	CreditCardIcon,
	HandshakeIcon,
	Home,
	LogOut,
	MenuIcon,
	Plus,
	ScrollTextIcon,
	SettingsIcon,
	TimerIcon,
} from "lucide-react";
import { FC } from "react";
import { Link, useLocation } from "react-router-dom";

import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { Dropdown, DropdownItem } from "src/components/Dropdown";
import { FeedbackDropdown } from "src/components/Feedback";
import { useAllUserWorkspaces, useUserStore } from "src/stores/user";
import { useWorkspace, useWorkspaceStore } from "src/stores/workspace";
import { cn } from "src/utils";
import { pluralize } from "src/utils/strings";
import { useCustomerStatus } from "src/utils/useCustomerStatus";

import { SidebarDropdown } from "./SidebarDropdown";

export const Navbar: FC = () => {
	const user = useUserStore(s => s.user);
	const workspace = useWorkspaceStore(s => s.workspace);

	const { data } = useCustomerStatus();

	const customerStatus = data?.customerStatus;

	const location = useLocation();
	const isHomePage = location.pathname === "/";

	const handleSignOut = () => {
		console.log("Signing out");
		supabase.auth.signOut();
	};

	return (
		<nav className="md:hidden relative bg-background flex w-full flex-row items-center justify-between px-4 py-4 md:py-3 border-b border-border z-20 md:justify-end">
			<ul className="flex flex-row items-center gap-2 md:hidden">
				<li>
					<Link to="/">
						<Button aria-label="Home" variant="ghost" size="icon">
							<Home className="size-6" />
						</Button>
					</Link>
				</li>

				<li>
					<Button onClick={() => window.history.back()} aria-label="Go back" variant="ghost" size="icon">
						<ArrowLeft className="size-6" />
					</Button>
				</li>
				<li>
					<Button onClick={() => window.history.forward()} aria-label="Go forward" variant="ghost" size="icon">
						<ArrowRight className="size-6" />
					</Button>
				</li>
			</ul>
			<div className="block md:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
				<img src="/logo.png" className="w-10" alt="Logo" />
				<div className="absolute top-1/2 -translate-y-1/2 -right-10 scale-75">
					<Tag className="text-accent/80">beta</Tag>
				</div>
			</div>
			<div className="flex flex-row items-center gap-2">
				<div className="hidden md:block">
					{customerStatus?.isTrialing && (
						<Dropdown
							trigger={
								<div className="bg-card px-2 py-1 rounded flex flex-row items-center gap-1 text-secondary cursor-pointer hover:bg-accent/20">
									<TimerIcon className="h-3.5 w-3.5" />
									<span className="text-xs">
										{`${pluralize(customerStatus.remainingDaysInTrial ?? 0, "day")} remaining in trial`}
									</span>
								</div>
							}>
							<Link to={`/workspaces/${workspace?.slug}/settings`}>
								<DropdownItem className="text-accent">
									<CreditCardIcon className="size-4" />
									<span>Manage subscription</span>
								</DropdownItem>
							</Link>
						</Dropdown>
					)}
				</div>
				<FeedbackDropdown />
				<div className="flex md:hidden">
					<SidebarDropdown />
				</div>
			</div>
		</nav>
	);
};
