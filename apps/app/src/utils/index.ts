import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function fixOneToOne<T>(objectOrNull: T[]): T | null {
	return (objectOrNull as T) || null;
}
