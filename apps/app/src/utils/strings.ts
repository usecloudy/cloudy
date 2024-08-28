import { format, formatDistanceToNow } from "date-fns";

export const ellipsizeText = (text: string, maxLength: number) => {
	return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

export const makeHeadTitle = (title: string) => {
	return `${title} | Cloudy`;
};

export const makeHumanizedTime = (date: Date | string, options?: { hoursOnly?: boolean }) => {
	if (typeof date === "string") {
		date = new Date(date);
	}

	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	if (diffInSeconds <= 30) {
		return "just now";
	} else if (diffInSeconds < 60 * 60) {
		// Less than an hour ago, use "X minutes/seconds ago"
		return formatDistanceToNow(date, { addSuffix: true });
	} else if (diffInSeconds < 24 * 60 * 60 || options?.hoursOnly) {
		// Less than a day ago, use time format
		return format(date, "h:mm a");
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
