import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

export const makeHumanizedTime = (
    date: Date | string,
    options?: { hoursOnly?: boolean }
) => {
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
    } else if (diffInSeconds < 24 * 60 * 60) {
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
        return date.getFullYear() === currentYear
            ? format(date, "MMM d")
            : format(date, "MMM d, yyyy");
    }
};
