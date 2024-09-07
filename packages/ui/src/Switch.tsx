import { useState } from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "./utils";

export interface SwitchProps
    extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
    label?: string;
}

export const Switch = ({ className, label, ...props }: SwitchProps) => {
    return (
        <SwitchPrimitive.Root
            className={cn(
                "peer inline-flex h-[24px] w-[44px] shrink-0 bg-card cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-accent data-[state=unchecked]:bg-input",
                className
            )}
            {...props}
        >
            <SwitchPrimitive.Thumb
                className={cn(
                    "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
                )}
            />
        </SwitchPrimitive.Root>
    );
};

Switch.displayName = "Switch";
