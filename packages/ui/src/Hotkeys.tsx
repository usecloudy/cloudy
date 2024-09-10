import React from "react";
import {
    Command,
    Option,
    ArrowUp,
    ArrowBigUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowDownLeft,
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
        <div className={cn("flex items-center space-x-1", className)}>
            {keys.map((key, index) => {
                const IconComponent = iconMap[key.toLowerCase()];
                return (
                    <React.Fragment key={index}>
                        <kbd className="flex items-center justify-center min-w-[1.5em] h-6 px-1 text-xs font-sans font-medium text-secondary bg-background border border-border rounded">
                            {IconComponent ? (
                                <IconComponent className="w-3 h-3" />
                            ) : (
                                key
                            )}
                        </kbd>
                        {index < keys.length - 1 && (
                            <span className="text-secondary text-xs">+</span>
                        )}
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
