import React from "react";
import {
    Command,
    Option,
    ArrowUp,
    ArrowBigUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    CornerDownLeftIcon,
} from "lucide-react";
import { cn } from "./utils";

const iconMap: { [key: string]: React.ElementType } = {
    cmd: Command,
    command: Command,
    option: Option,
    shift: ArrowBigUp,
    alt: Option,
    up: ArrowUp,
    down: ArrowDown,
    left: ArrowLeft,
    right: ArrowRight,
    enter: CornerDownLeftIcon,
};

interface HotkeyProps {
    keys: string[];
    className?: string;
}

export const Hotkey: React.FC<HotkeyProps> = ({ keys, className }) => {
    return (
        <div className={cn("flex items-center gap-0.5", className)}>
            {keys.map((key, index) => {
                const IconComponent = iconMap[key.toLowerCase()];
                return (
                    <React.Fragment key={index}>
                        <kbd
                            className={cn(
                                "flex items-center justify-center text-xs font-sans font-normal text-secondary bg-background dark:text-primary dark:bg-white/20 dark:border-white/10 border border-border rounded",
                                IconComponent ? "size-5" : "h-5"
                            )}
                        >
                            {IconComponent ? (
                                <IconComponent className="size-3" />
                            ) : (
                                <span className="px-1">{key}</span>
                            )}
                        </kbd>
                    </React.Fragment>
                );
            })}
        </div>
    );
};

interface HotkeysProps {
    shortcuts: { keys: string[]; label: string }[];
    className?: string;
}

export const Hotkeys: React.FC<HotkeysProps> = ({ shortcuts, className }) => {
    return (
        <div className={cn("space-y-2", className)}>
            {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-secondary">
                        {shortcut.label}
                    </span>
                    <Hotkey keys={shortcut.keys} />
                </div>
            ))}
        </div>
    );
};
