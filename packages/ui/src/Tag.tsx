import { cn } from "./utils";

export const Tag = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <div
            className={cn(
                "text-xs text-accent font-medium bg-card rounded px-2 py-0.5 flex items-center",
                className
            )}
        >
            {children}
        </div>
    );
};
