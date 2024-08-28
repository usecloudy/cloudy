import React, { InputHTMLAttributes, forwardRef } from "react";

import { cn } from "../utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	className?: string;
	error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error, ...props }, ref) => {
	return (
		<input
			className={cn(
				"placeholder:text-placeholder flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
				error && "border-red-500 focus-visible:ring-red-500",
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
});

Input.displayName = "Input";
