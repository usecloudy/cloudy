import { useDebouncedCallback, useThrottledCallback } from "use-debounce";

export const useSave = <T>(
	onSave: (payload: T) => void,
	{
		debounceDurationMs = 500,
	}: {
		debounceDurationMs?: number;
	} = {},
) => {
	const handleSave = (payload: T) => {
		// Use generic type T instead of any
		onSave(payload);
	};

	const debouncedSave = useDebouncedCallback(handleSave, debounceDurationMs);

	const onChange = (payload: T) => {
		debouncedSave(payload);
	};

	return { onChange };
};

export const useThrottledSave = <T>(
	onSave: (payload: T) => void,
	{
		throttleDurationMs = 500,
	}: {
		throttleDurationMs?: number;
	} = {},
) => {
	return useThrottledCallback(onSave, throttleDurationMs, {
		leading: false,
		trailing: true,
	});
};
