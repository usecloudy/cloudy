import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "src/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group",
	{
		variants: {
			variant: {
				default: "bg-accent text-background hover:bg-accent/80 group-hover:bg-accent/80",
				destructive: "bg-red-600 text-background hover:bg-red-600/70 group-hover:bg-red-600/70",
				outline: "border border-input hover:bg-card hover:text-accent group-hover:bg-card group-hover:text-accent",
				secondary: "bg-card text-primary hover:opacity-70 group-hover:opacity-70 group-hover:text-background",
				ghost: "hover:bg-accent hover:text-background group-hover:bg-accent group-hover:text-background active:bg-accent active:text-background",
				link: "text-primary underline-offset-4 hover:underline group-hover:underline",
			},
			size: {
				default: "h-10 px-4 py-2 gap-2",
				sm: "h-8 rounded-md px-3 text-xs gap-1",
				lg: "h-11 rounded-md px-6 text-base gap-2",
				icon: "size-10 text-xs",
				"icon-sm": "size-8 text-xs",
				"icon-sm-overflow": "size-8 -m-2 text-xs",
				"icon-xs": "size-6 rounded text-xs",
				"icon-xs-overflow": "size-6 rounded -m-1 text-xs",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
