import { type VariantProps, cva } from "class-variance-authority";
// Assuming you have a cn utility function
import { MinusCircle, XIcon } from "lucide-react";
import * as React from "react";

import { cn } from "src/utils";

const chipVariants = cva(
	"inline-flex items-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer whitespace-nowrap",
	{
		variants: {
			variant: {
				default: "bg-accent text-background hover:bg-accent/90",
				secondary: "bg-card text-primary hover:bg-accent hover:text-background active:bg-accent/80",
				outline: "border border-input bg-background hover:bg-accent hover:text-background",
				ghost: "bg-transparent text-primary hover:bg-accent hover:text-background",
			},
			size: {
				default: "h-8 text-sm px-3",
				sm: "h-7 text-xs px-2",
				lg: "h-10 text-base px-4",
			},
			hasDelete: {
				true: "pr-0",
				false: "",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
			hasDelete: false,
		},
	},
);

type ChipComponent = React.ForwardRefExoticComponent<ChipProps & React.RefAttributes<HTMLDivElement>> & {
	Delete: typeof ChipDelete;
};

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof chipVariants> {
	rightElements?: React.ReactNode;
}

export const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
	({ className, variant, size, children, rightElements, ...props }, ref) => {
		const hasDelete = React.Children.toArray(rightElements).length > 0;

		return (
			<div ref={ref} className={cn(chipVariants({ variant, size, hasDelete, className }), "group")} {...props}>
				<div className="flex items-center gap-1">
					{React.Children.map(children, child =>
						React.isValidElement(child)
							? React.cloneElement(child, {
									// @ts-ignore
									className: cn(child.props.className, "group-hover:text-inherit"),
								})
							: child,
					)}
				</div>
				{rightElements}
			</div>
		);
	},
) as ChipComponent;

Chip.displayName = "Chip";

interface ChipDeleteProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const ChipDelete = React.forwardRef<HTMLButtonElement, ChipDeleteProps>(({ className, ...props }, ref) => {
	return (
		<button
			ref={ref}
			type="button"
			className={cn(
				"ml-1 inline-flex h-full items-center justify-center rounded-r-full border-l border-border pl-1 pr-2 hover:bg-red-600 focus:outline-none active:bg-opacity-60 group-hover:text-inherit",
				className,
			)}
			{...props}>
			<span className="sr-only">Remove</span>
			<MinusCircle className="h-3.5 w-3.5 stroke-2" />
		</button>
	);
});

ChipDelete.displayName = "Chip.Delete";

Chip.Delete = ChipDelete;
