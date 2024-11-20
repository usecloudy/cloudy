type DocumentLoadingPlaceholderProps = {
	lines?: number;
	noTitle?: boolean;
};

export const DocumentLoadingPlaceholder = ({ lines = 5, noTitle }: DocumentLoadingPlaceholderProps) => {
	return (
		<div className="flex w-full animate-pulse flex-col gap-y-4">
			{/* Title */}
			{!noTitle && <div className="mb-6 h-12 w-4/5 rounded-md bg-card/40" />}
			{Array.from({ length: lines }).map((_, index) => (
				<div key={index} className="flex flex-col gap-y-2">
					{/* Each paragraph has 2-3 lines */}
					<div className="h-4 w-full rounded-md bg-card/40" />
					<div className="h-4 w-11/12 rounded-md bg-card/40" />
					{index % 2 === 0 && <div className="h-4 w-4/5 rounded-md bg-card/40" />}
				</div>
			))}
		</div>
	);
};

export const DocumentLoadingPlaceholderWithPadding = () => {
	return (
		<div className="flex w-full flex-col items-center justify-center pt-12">
			<div className="w-full max-w-screen-lg px-3 md:px-20 md:pt-16">
				<DocumentLoadingPlaceholder />
			</div>
		</div>
	);
};
