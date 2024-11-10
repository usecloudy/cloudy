import { useTheme } from "next-themes";
import { useMountedState } from "react-use";

export const useCodeThemeClass = () => {
	const { theme } = useTheme();

	const isMounted = useMountedState();

	return isMounted() && theme === "dark" ? "code-theme-github-dark" : "code-theme-github";
};
