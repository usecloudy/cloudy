import { InputHTMLAttributes, ReactNode, forwardRef } from "react";

import { cn } from "../utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	className?: string;
	error?: boolean;
	prefix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error, prefix, ...props }, ref) => {
	return (
		<div
			className={cn(
				"flex h-10 w-full items-center rounded-md border border-border bg-background ring-offset-background focus-within:outline-none focus-within:ring-0",
				error && "border-red-500 focus-within:ring-red-500",
				className,
			)}>
			{prefix && <div className="flex items-center pl-3 text-sm text-secondary">{prefix}</div>}
			<input
				className={cn(
					"h-full w-full bg-transparent px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-placeholder focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
					prefix && "pl-0",
					"focus:outline-none focus:ring-0", // Add this line
				)}
				ref={ref}
				{...props}
			/>
		</div>
	);
});

Input.displayName = "Input";
