import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { type VariantProps, cva } from "class-variance-authority";
import { XIcon } from "lucide-react";
import * as React from "react";

import { cn } from "src/utils";

import { Button } from "./Button";

const Dialog = AlertDialogPrimitive.Root;
const DialogTrigger = AlertDialogPrimitive.Trigger;
const DialogPortal = AlertDialogPrimitive.Portal;

const DialogOverlay = React.forwardRef<
	React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
	<AlertDialogPrimitive.Overlay
		className={cn(
			"fixed inset-0 z-50 bg-background/20 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
			className,
		)}
		{...props}
		ref={ref}
	/>
));
DialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

const dialogVariants = cva(
	"fixed z-50 gap-4 bg-background border flex flex-col rounded-lg border-border p-6 transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
	{
		variants: {
			position: {
				center: "left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
				// top: "left-[50%] top-[5%] translate-x-[-50%] rounded-b-lg data-[state=open]:slide-in-from-top-0",
				// bottom: "left-[50%] bottom-[5%] translate-x-[-50%] rounded-t-lg data-[state=open]:slide-in-from-bottom-0",
				// left: "left-4 top-[50%] translate-y-[-50%] rounded-r-lg data-[state=open]:slide-in-from-left-0",
				// right: "right-4 top-[50%] translate-y-[-50%] rounded-l-lg data-[state=open]:slide-in-from-right-0",
			},
			size: {
				sm: "w-full max-w-sm",
				md: "w-full max-w-md",
				lg: "w-full max-w-lg",
				xl: "w-full max-w-xl",
				full: "w-[95vw] h-[95vh]",
			},
		},
		defaultVariants: {
			position: "center",
			size: "md",
		},
	},
);

interface DialogContentProps
	extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>,
		VariantProps<typeof dialogVariants> {
	onClose?: () => void;
}

const DialogContent = React.forwardRef<React.ElementRef<typeof AlertDialogPrimitive.Content>, DialogContentProps>(
	({ className, position, size, onClose, children, ...props }, ref) => (
		<DialogPortal>
			<DialogOverlay />
			<AlertDialogPrimitive.Content ref={ref} className={cn(dialogVariants({ position, size }), className)} {...props}>
				{children}
				{onClose && (
					<AlertDialogPrimitive.Cancel
						className="focus:ring-ring data-[state=open]:text-muted-foreground absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent"
						onClick={onClose}>
						<XIcon className="h-4 w-4" />
						<span className="sr-only">Close</span>
					</AlertDialogPrimitive.Cancel>
				)}
			</AlertDialogPrimitive.Content>
		</DialogPortal>
	),
);
DialogContent.displayName = AlertDialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
	React.ElementRef<typeof AlertDialogPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
	<AlertDialogPrimitive.Title
		ref={ref}
		className={cn("text-lg font-semibold leading-none tracking-tight", className)}
		{...props}
	/>
));
DialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
	React.ElementRef<typeof AlertDialogPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
	<AlertDialogPrimitive.Description ref={ref} className={cn("text-sm text-secondary", className)} {...props} />
));
DialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

const DialogCancel = React.forwardRef<
	React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
	<AlertDialogPrimitive.Cancel
		ref={ref}
		className={cn(
			"focus:ring-ring mt-2 inline-flex h-10 items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-semibold ring-offset-background transition-colors hover:bg-card focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:mt-0",
			className,
		)}
		{...props}
	/>
));
DialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

const DialogAction = React.forwardRef<
	React.ElementRef<typeof AlertDialogPrimitive.Action>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> & { destructive?: boolean }
>(({ className, destructive = false, ...props }, ref) => (
	<AlertDialogPrimitive.Action asChild ref={ref} {...props}>
		<Button
			variant={destructive ? "destructive" : "default"}
			className={cn(
				"focus:ring-ring inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
				className,
			)}>
			{props.children}
		</Button>
	</AlertDialogPrimitive.Action>
));
DialogAction.displayName = AlertDialogPrimitive.Action.displayName;

export {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription,
	DialogCancel,
	DialogAction,
};
