import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useLocalStorage } from "react-use";

export const useDebug = () => {
	const [debug] = useLocalStorage("debug", false);

	return debug;
};

export const useDebugQuery = () => {
	const [searchParams] = useSearchParams();
	const [_, setDebug] = useLocalStorage("debug", false);

	const shouldEnableDebug = searchParams.get("debug") === "1";
	const shouldDisableDebug = searchParams.get("debug") === "0";

	useEffect(() => {
		if (shouldEnableDebug) {
			console.log("Setting debug to true");
			setDebug(true);
		} else if (shouldDisableDebug) {
			console.log("Setting debug to false");
			setDebug(false);
		}
	}, [shouldEnableDebug, shouldDisableDebug]);
};
