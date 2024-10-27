import { UserIcon } from "lucide-react";

import { cn } from "src/utils";

interface AvatarProps {
	src?: string | null;
	fallback?: string | null;
	size?: "sm" | "md" | "lg";
	className?: string;
}

const sizeClasses = {
	sm: "size-8",
	md: "size-10",
	lg: "size-12",
} as const;

const iconSizeClasses = {
	sm: "size-4",
	md: "size-5",
	lg: "size-6",
} as const;

export const Avatar = ({ src, fallback, size = "md", className }: AvatarProps) => {
	const sizeClass = sizeClasses[size];
	const iconSizeClass = iconSizeClasses[size];

	if (src) {
		return <img src={src} alt="Avatar" className={cn("rounded-full object-cover", sizeClass, className)} />;
	}

	if (!fallback) {
		return (
			<div
				className={cn("flex items-center justify-center rounded-full bg-card", "text-secondary", sizeClass, className)}>
				<UserIcon className={iconSizeClass} />
			</div>
		);
	}

	return (
		<div
			className={cn(
				"flex items-center justify-center rounded-full bg-card",
				"text-sm font-medium text-secondary",
				sizeClass,
				className,
			)}>
			{fallback.slice(0, 2).toUpperCase()}
		</div>
	);
};
