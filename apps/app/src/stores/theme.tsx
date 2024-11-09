import { PropsWithChildren, createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark";

type ThemeContextType = {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	toggleTheme: () => void;
	isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: PropsWithChildren) => {
	const [theme, setTheme] = useState<Theme>(() => {
		if (typeof window === "undefined") return "light";

		// Check localStorage first
		if (localStorage.theme === "dark") return "dark";
		if (localStorage.theme === "light") return "light";

		// Fall back to system preference
		return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
	});

	useEffect(() => {
		// Update document data-theme attribute
		document.documentElement.setAttribute("data-theme", theme);
		// Keep the dark class for other styles that might depend on it
		if (theme === "dark") {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	}, [theme]);

	const toggleTheme = () => {
		const newTheme = theme === "light" ? "dark" : "light";
		setTheme(newTheme);
		localStorage.theme = newTheme;
	};

	const value = {
		theme,
		setTheme,
		toggleTheme,
		isDark: theme === "dark",
	};

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useThemeContext must be used within a ThemeProvider");
	}
	return context;
};

export const useCodeThemeClass = () => {
	const { isDark } = useTheme();
	return isDark ? "code-theme-github-dark" : "code-theme-github";
};
