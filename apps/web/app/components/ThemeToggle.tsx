"use client";

import { useMounted } from "@cloudy/ui";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "./Button";

export const ThemeToggle = () => {
	const { theme, setTheme } = useTheme();
	const isMounted = useMounted();

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
			aria-label="Toggle theme">
			{isMounted && theme === "dark" ? <SunIcon /> : <MoonIcon />}
		</Button>
	);
};
