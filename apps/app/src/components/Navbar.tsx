import { ArrowLeft, ArrowRight, Home, LogOut, MenuIcon, Plus } from "lucide-react";
import { FC } from "react";
import { Link, useLocation } from "react-router-dom";

import { supabase } from "src/clients/supabase";
import { useUser } from "src/stores/user";

import { Button } from "./Button";
import { Dropdown, DropdownItem } from "./Dropdown";

export const Navbar: FC = () => {
	const user = useUser();

	const location = useLocation();
	const isHomePage = location.pathname === "/";

	const handleSignOut = () => {
		console.log("Signing out");
		supabase.auth.signOut();
	};

	return (
		<nav className="fixed bg-background flex w-full flex-row items-center justify-between p-4 z-50">
			<ul className="flex flex-row items-center gap-4">
				<div className="flex flex-row items-center gap-2">
					{!isHomePage && (
						<li>
							<Link to="/">
								<Button aria-label="Home" variant="ghost" size="icon">
									<Home size={24} />
								</Button>
							</Link>
						</li>
					)}
					<li className="hidden md:block">
						<Button onClick={() => window.history.back()} aria-label="Go back" variant="ghost" size="icon">
							<ArrowLeft size={24} className="text-current" />
						</Button>
					</li>
					<li className="hidden md:block">
						<Button onClick={() => window.history.forward()} aria-label="Go forward" variant="ghost" size="icon">
							<ArrowRight size={24} />
						</Button>
					</li>
					<li>
						<Link to="/thoughts/new">
							<Button variant="ghost" size="icon" aria-label="New thought">
								<Plus size={24} />
							</Button>
						</Link>
					</li>
				</div>
			</ul>

			{/* Center logo */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
				<img src="/logo.png" className="w-10" alt="Logo" />
			</div>

			<div>
				<Dropdown
					trigger={
						<Button variant="ghost" size="icon" aria-label="New thought">
							<MenuIcon size={24} />
						</Button>
					}
					className="w-64">
					<div className="flex flex-col gap-1 p-2 mb-2 border-b border-border">
						<span className="text-sm font-medium text-secondary">Signed in as</span>
						<span className="text-sm">{user.email}</span>
					</div>
					<DropdownItem onSelect={handleSignOut}>
						<LogOut className="h-4 w-4" />
						<span>Sign Out</span>
					</DropdownItem>
				</Dropdown>
			</div>
		</nav>
	);
};