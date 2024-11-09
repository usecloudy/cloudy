import { CircleHelpIcon, HandshakeIcon, LogOutIcon, MenuIcon, MoonIcon, ScrollTextIcon, SunIcon } from "lucide-react";

import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { Dropdown, DropdownItem } from "src/components/Dropdown";
import { useTheme } from "src/stores/theme";

export const SidebarDropdown = () => {
	const { theme, toggleTheme } = useTheme();

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
			<DropdownItem onSelect={toggleTheme}>
				{theme === "light" ? <MoonIcon className="size-4" /> : <SunIcon className="size-4" />}
				<span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
			</DropdownItem>
			<div className="my-2 border-b border-border" />
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
			<div className="my-2 border-b border-border" />
			<DropdownItem onSelect={handleSignOut} className="text-red-600">
				<LogOutIcon className="size-4" />
				<span>Sign out</span>
			</DropdownItem>
		</Dropdown>
	);
};
