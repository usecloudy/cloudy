import { type VariantProps, cva } from "class-variance-authority";
import React from "react";

import { cn } from "src/utils";

const spinnerVariants = cva("rounded-full border-solid animate-spin", {
	variants: {
		size: {
			xs: "w-3.5 h-3.5 border-2",
			sm: "w-6 h-6 border-2",
			md: "w-10 h-10 border-4",
			lg: "w-16 h-16 border-4",
		},
		variant: {
			primary: "border-accent border-t-transparent",
			secondary: "border-secondary border-t-transparent",
		},
	},
	defaultVariants: {
		size: "md",
		variant: "primary",
	},
});

interface LoadingSpinnerProps extends VariantProps<typeof spinnerVariants> {
	className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size, variant, className }) => {
	return (
		<div className="flex items-center justify-center">
			<div className={cn(spinnerVariants({ size, variant }), className)} />
		</div>
	);
};

export default LoadingSpinner;
