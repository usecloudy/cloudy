import { Locale, format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

export const makeHeadTitle = (title: string) => {
	return `${title} | Cloudy`;
};

export const makeHumanizedTime = (
	date: Date | string,
	options?: {
		hoursOnly?: boolean;
		includeSeconds?: boolean;
		locale?: Locale;
	},
) => {
	if (typeof date === "string") {
		date = new Date(date);
	}

	const now = new Date();
	const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);
	const isInPast = diffInSeconds < 0;
	const absDiff = Math.abs(diffInSeconds);

	// Handle future dates
	if (!isInPast) {
		if (absDiff <= 30) return "in a few seconds";
		return formatDistanceToNow(date, {
			addSuffix: true,
			locale: options?.locale,
		});
	}

	// Handle past dates
	if (absDiff <= 30) {
		return "just now";
	} else if (absDiff < 60 * 60) {
		// Less than an hour ago
		if (options?.includeSeconds) {
			return formatDistanceToNow(date, {
				addSuffix: true,
				includeSeconds: true,
				locale: options?.locale,
			});
		}
		return formatDistanceToNow(date, {
			addSuffix: true,
			locale: options?.locale,
		});
	} else if (absDiff < 24 * 60 * 60) {
		if (options?.hoursOnly) {
			// Less than a day ago, use time format
			return format(date, "h:mm a");
		}
		// Less than a day ago, use "today" or "yesterday" with time
		if (isToday(date)) {
			return `Today at ${format(date, "h:mm a")}`;
		} else if (isYesterday(date)) {
			return `Yesterday at ${format(date, "h:mm a")}`;
		}
		return format(date, "MMM d 'at' h:mm a");
	} else {
		// More than a day ago, use date format
		const currentYear = new Date().getFullYear();
		return date.getFullYear() === currentYear ? format(date, "MMM d") : format(date, "MMM d, yyyy");
	}
};

export const capitalizeFirstLetter = (text: string) => {
	return text.charAt(0).toUpperCase() + text.slice(1);
};

export const pluralize = (count: number, noun: string) => {
	return `${count} ${noun}${count !== 1 ? "s" : ""}`;
};
