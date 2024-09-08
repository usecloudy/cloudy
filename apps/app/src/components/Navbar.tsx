import { Tag } from "@cloudy/ui";
import { useMutation } from "@tanstack/react-query";
import {
	ArrowLeft,
	ArrowRight,
	CircleFadingArrowUpIcon,
	CircleHelpIcon,
	CreditCardIcon,
	HandshakeIcon,
	Home,
	LightbulbIcon,
	LogOut,
	MenuIcon,
	Plus,
	ScrollTextIcon,
	TimerIcon,
} from "lucide-react";
import { FC } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { apiClient } from "src/api/client";
import { supabase } from "src/clients/supabase";
import { useUser } from "src/stores/user";
import { pluralize } from "src/utils/strings";
import { useCustomerStatus } from "src/utils/useCustomerStatus";
import { useSubscriptionModalStore } from "src/views/pricing/subscriptionModalStore";
import { QuickThoughtDropdown } from "src/views/quickThought/QuickThoughtDropdown";

import { Button } from "./Button";
import { Dropdown, DropdownItem } from "./Dropdown";
import { FeedbackDropdown } from "./Feedback";

const useBillingPortal = () => {
	return useMutation({
		mutationFn: async () => {
			const res = await apiClient.get<{ url: string }>(`/api/payments/billing`, {
				params: {
					returnUrl: window.location.href,
				},
			});
			return res.data;
		},
	});
};

export const Navbar: FC = () => {
	const user = useUser();
	const { data } = useCustomerStatus();
	const { mutateAsync: getBillingPortalUrl } = useBillingPortal();

	const { setIsOpen: setShowSubscriptionModal } = useSubscriptionModalStore();

	const customerStatus = data?.customerStatus;
	const location = useLocation();
	const navigate = useNavigate();
	const isHomePage = location.pathname === "/";

	const handleOpenSubscriptionModal = () => {
		setShowSubscriptionModal(true, true);
	};

	const handleOpenBillingPortal = async () => {
		const { url } = await getBillingPortalUrl();
		window.location.href = url;
	};

	const handleSignOut = () => {
		console.log("Signing out");
		supabase.auth.signOut();
	};

	return (
		<nav className="relative bg-background flex w-full flex-row items-center justify-between p-4 z-50 border-b border-border">
			<ul className="flex flex-row items-center gap-4">
				<div className="flex-row items-center gap-2 flex">
					{!isHomePage && (
						<li>
							<Link to="/">
								<Button aria-label="Home" variant="ghost" size="icon">
									<Home className="size-6" />
								</Button>
							</Link>
						</li>
					)}
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
					<li className="hidden md:block">
						<Link to="/thoughts/new">
							<Button variant="ghost" size="icon" aria-label="New thought">
								<Plus className="size-6" />
							</Button>
						</Link>
					</li>
					{/* <QuickThoughtDropdown /> */}
				</div>
			</ul>

			{/* Center logo */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
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
							<DropdownItem className="text-accent" onSelect={handleOpenSubscriptionModal}>
								<CircleFadingArrowUpIcon className="size-4" />
								<span>Subscribe</span>
							</DropdownItem>
						</Dropdown>
					)}
				</div>
				<FeedbackDropdown />
				<Dropdown
					trigger={
						<Button variant="ghost" size="icon" aria-label="New thought">
							<MenuIcon size={24} />
						</Button>
					}
					className="w-64">
					<div className="flex flex-col mb-2">
						<div className="flex flex-col gap-1 p-2 border-b border-border">
							<span className="text-sm font-medium text-secondary">Signed in as</span>
							<span className="text-sm">{user.email}</span>
						</div>
						{customerStatus?.isTrialing && (
							<div className="flex flex-col gap-1 p-2 border-b border-border">
								<span className="text-sm font-medium text-secondary">Trial Status</span>
								<span className="text-sm">
									{`${pluralize(customerStatus.remainingDaysInTrial ?? 0, "day")} remaining`}
								</span>
							</div>
						)}
					</div>
					{customerStatus?.isTrialing && (
						<DropdownItem className="text-accent" onSelect={handleOpenSubscriptionModal}>
							<CircleFadingArrowUpIcon className="size-4" />
							<span>Subscribe</span>
						</DropdownItem>
					)}
					{customerStatus?.isActive && (
						<DropdownItem onSelect={handleOpenBillingPortal}>
							<CreditCardIcon className="size-4" />
							<span>Manage Subscription</span>
						</DropdownItem>
					)}
					<div className="border-b border-border my-2" />
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
						<LogOut className="size-4" />
						<span>Sign out</span>
					</DropdownItem>
				</Dropdown>
			</div>
		</nav>
	);
};
