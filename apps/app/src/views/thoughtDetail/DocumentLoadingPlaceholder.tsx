type DocumentLoadingPlaceholderProps = {
	lines?: number;
};

export const DocumentLoadingPlaceholder = ({ lines = 5 }: DocumentLoadingPlaceholderProps) => {
	return (
		<div className="w-full animate-pulse">
			<div className="flex flex-col gap-y-4">
				{Array.from({ length: lines }).map((_, index) => (
					<div key={index} className="flex flex-col gap-y-2">
						{/* Each paragraph has 2-3 lines */}
						<div className="h-4 w-full rounded-md bg-card/40" />
						<div className="h-4 w-11/12 rounded-md bg-card/40" />
						{index % 2 === 0 && <div className="h-4 w-4/5 rounded-md bg-card/40" />}
					</div>
				))}
			</div>
		</div>
	);
};
