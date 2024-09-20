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
		<div className={cn("w-full px-6 md:pl-16 md:pr-4 lg:pl-20 lg:pr-4 h-full", className)}>
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
