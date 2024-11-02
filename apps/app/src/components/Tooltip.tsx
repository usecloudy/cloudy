import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";

import { cn } from "src/utils";

const TooltipProvider = TooltipPrimitive.Provider;

type DurationPreset = "default" | "short" | "instant";

const durationValues: Record<DurationPreset, number> = {
	default: 700,
	short: 300,
	instant: 100,
};

interface TooltipProps extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root> {
	durationPreset?: DurationPreset;
}

const Tooltip = ({ durationPreset = "default", ...props }: TooltipProps) => (
	<TooltipPrimitive.Root delayDuration={durationValues[durationPreset]} {...props} />
);

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
	React.ElementRef<typeof TooltipPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
	<TooltipPrimitive.Content
		ref={ref}
		sideOffset={sideOffset}
		className={cn(
			"z-[80] overflow-hidden rounded-md border border-border bg-background px-3 py-1.5 text-sm text-primary shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
			className,
		)}
		{...props}
	/>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
