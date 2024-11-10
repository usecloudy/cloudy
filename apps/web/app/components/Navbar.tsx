import { ThemeToggle } from "./ThemeToggle";

export const Navbar = () => {
	return (
		<nav className="flex w-full items-center justify-end py-2 px-2">
			<ThemeToggle />
		</nav>
	);
};
