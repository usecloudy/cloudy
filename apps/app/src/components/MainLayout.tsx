import { cn } from "src/utils";

import LoadingSpinner from "./LoadingSpinner";

export const MainLayout = ({
	children,
	isLoading,
	className,
}: {
	children: React.ReactNode;
	isLoading?: boolean;
	className?: string;
}) => {
	return (
		<div className={cn("h-full w-full px-6 md:px-16", className)}>
			{isLoading ? (
				<div className="flex h-full flex-col items-center justify-center">
					<LoadingSpinner />
				</div>
			) : (
				children
			)}
		</div>
	);
};
