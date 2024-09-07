import { forwardRef, useState } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "./utils";

export interface SliderProps
    extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
    className?: string;
}

export const Slider = forwardRef<
    React.ElementRef<typeof SliderPrimitive.Root>,
    SliderProps & { showValue?: boolean }
>(({ className, showValue, onValueChange, ...props }, ref) => {
    const [value, setValue] = useState(props.defaultValue ?? [0]);

    const handleValueChange = (newValue: number[]) => {
        setValue(newValue);
        onValueChange?.(newValue);
    };

    return (
        <div className="flex items-center w-full">
            <SliderPrimitive.Root
                ref={ref}
                className={cn(
                    "relative flex w-full touch-none select-none items-center",
                    className
                )}
                {...props}
                value={value}
                onValueChange={handleValueChange}
            >
                <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-card cursor-pointer">
                    <SliderPrimitive.Range className="absolute h-full bg-accent" />
                </SliderPrimitive.Track>
                <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full hover:bg-accent border-2 active:scale-90 border-accent bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab" />
            </SliderPrimitive.Root>
            {showValue && (
                <div className="ml-4 min-w-[3ch] text-sm">{value[0]}</div>
            )}
        </div>
    );
});

Slider.displayName = SliderPrimitive.Root.displayName;
