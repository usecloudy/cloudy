import { cn } from "src/utils";

import LoadingSpinner from "./LoadingSpinner";

export const SimpleLayout = ({
	children,
	isLoading,
	className,
}: {
	children: React.ReactNode;
	isLoading?: boolean;
	className?: string;
}) => {
	return (
		<div className={cn("flex flex-col flex-1 box-border overflow-y-scroll no-scrollbar px-6 md:px-16 lg:px-20", className)}>
			{isLoading ? (
				<div className="flex h-[calc(100vh-20rem)] flex-col items-center justify-center">
					<LoadingSpinner />
				</div>
			) : (
				children
			)}
		</div>
	);
};

export const SimpleLayoutView = ({ children, className }: { children: React.ReactNode; className?: string }) => {
	return <div className={cn("flex flex-col bg-background", className)}>{children}</div>;
};

SimpleLayout.View = SimpleLayoutView;
