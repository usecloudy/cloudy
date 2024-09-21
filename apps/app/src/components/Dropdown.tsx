import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { type VariantProps, cva } from "class-variance-authority";
import React, { useState } from "react";

import { Button, ButtonProps } from "src/components/Button";

import { cn } from "../utils";

interface DropdownProps {
	trigger: React.ReactNode;
	children: React.ReactNode | ((props: { open: boolean; close: () => void }) => React.ReactNode);
	align?: "start" | "center" | "end";
	side?: "top" | "right" | "bottom" | "left";
	className?: string;
	onClose?: () => void;
}

export const Dropdown: React.FC<DropdownProps> = ({
	trigger,
	children,
	align = "end",
	side = "bottom",
	className,
	onClose,
}) => {
	const [open, setOpen] = useState(false);
	return (
		<DropdownMenu.Root
			open={open}
			onOpenChange={open => {
				setOpen(open);
				if (!open) {
					onClose?.();
				}
			}}>
			<DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content
					align={align}
					sideOffset={5}
					side={side}
					className={cn(
						"z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-background p-1 shadow-md animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
						className,
					)}>
					{typeof children === "function"
						? children({
								open,
								close: () => {
									setOpen(false);
								},
							})
						: children}
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	);
};

const dropdownItemVariants = cva(
	"relative flex cursor-pointer select-none items-center gap-2 rounded px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
	{
		variants: {
			variant: {
				default: "focus:bg-card",
				ghost: "hover:bg-accent focus:bg-accent focus:text-background",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export interface DropdownItemProps extends DropdownMenu.DropdownMenuItemProps, VariantProps<typeof dropdownItemVariants> {}

export const DropdownItem = React.forwardRef<HTMLDivElement, DropdownItemProps>(({ className, variant, ...props }, ref) => (
	<DropdownMenu.Item ref={ref} className={cn(dropdownItemVariants({ variant, className }))} {...props} />
));

DropdownItem.displayName = "DropdownItem";

export const DropdownItemButton = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, ...props }, ref) => (
	<DropdownMenu.Item asChild>
		<Button ref={ref} className={cn("w-full justify-start", className)} {...props} />
	</DropdownMenu.Item>
));
DropdownItemButton.displayName = "DropdownItemButton";

export const DropdownSeparator = React.forwardRef<HTMLDivElement, DropdownMenu.DropdownMenuSeparatorProps>(
	({ className, ...props }, ref) => (
		<DropdownMenu.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
	),
);
DropdownSeparator.displayName = "DropdownSeparator";
