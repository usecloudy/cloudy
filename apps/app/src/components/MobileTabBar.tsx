import { HomeIcon, LightbulbIcon, PlusIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { cn } from "src/utils";

export const MobileTabBar = () => {
	return (
		<nav className="md:hidden relative bg-background flex w-full flex-row items-center justify-between py-3 z-50 border-t border-border">
			<Tab icon={<HomeIcon className="size-5" />} label="Home" href="/" />
			{/* <Tab icon={<LightbulbIcon className="size-5" />} label="Quick note" onClick={() => {}} /> */}
			<Tab icon={<PlusIcon className="size-5" />} label="New note" href="/thoughts/new" />
		</nav>
	);
};

const Tab = ({ icon, label, onClick, href }: { icon: React.ReactNode; label: string; onClick?: () => void; href?: string }) => {
	const location = useLocation();
	const isActive = location.pathname === href;

	const inner = (
		<button
			onClick={onClick}
			className={cn("flex flex-col items-center justify-center gap-1 flex-1", isActive && "text-accent")}>
			{icon}
			<span className="text-xs">{label}</span>
		</button>
	);

	if (href) {
		return (
			<Link to={href} className="flex flex-1">
				{inner}
			</Link>
		);
	}

	return inner;
};
