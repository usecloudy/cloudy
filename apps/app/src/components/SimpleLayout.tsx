import { cn } from "src/utils";

import LoadingSpinner from "./LoadingSpinner";

export const SimpleLayout = ({ children, isLoading }: { children: React.ReactNode; isLoading?: boolean }) => {
	return (
		<div className="flex w-full flex-col px-6 md:px-8 lg:px-12 py-24">
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
