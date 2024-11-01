import { type VariantProps, cva } from "class-variance-authority";
import { UserIcon } from "lucide-react";

import { cn } from "src/utils";

const avatarVariants = cva("flex items-center justify-center rounded-full", {
	variants: {
		size: {
			xs: "size-5",
			sm: "size-6",
			md: "size-8",
			lg: "size-10",
		},
	},
	defaultVariants: {
		size: "md",
	},
});

const iconVariants = cva("", {
	variants: {
		size: {
			xs: "size-4",
			sm: "size-5",
			md: "size-6",
			lg: "size-7",
		},
	},
	defaultVariants: {
		size: "md",
	},
});

const textVariants = cva("text-sm font-medium text-secondary", {
	variants: {
		size: {
			xs: "text-[0.57rem] border border-border",
			sm: "text-xs",
			md: "text-sm",
			lg: "text-base",
		},
	},
	defaultVariants: {
		size: "md",
	},
});

interface AvatarProps extends VariantProps<typeof avatarVariants> {
	src?: string | null;
	fallback?: string | null;
	className?: string;
}

export const Avatar = ({ src, fallback, size, className }: AvatarProps) => {
	if (src) {
		return <img src={src} alt="Avatar" className={cn("object-cover", avatarVariants({ size, className }))} />;
	}

	if (!fallback) {
		return (
			<div className={cn("bg-card text-secondary", avatarVariants({ size, className }))}>
				<UserIcon className={iconVariants({ size })} />
			</div>
		);
	}

	return (
		<div className={cn("bg-card", textVariants({ size, className }), avatarVariants({ size, className }))}>
			{fallback.slice(0, 2).toUpperCase()}
		</div>
	);
};
