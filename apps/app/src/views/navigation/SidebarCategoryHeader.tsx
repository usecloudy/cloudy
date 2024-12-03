export const CategoryHeader = ({ title, children }: { title: string; children?: React.ReactNode }) => (
	<div className="flex flex-row items-center gap-1">
		<h3 className="whitespace-nowrap text-sm font-semibold text-secondary">{title}</h3>
		{children}
	</div>
);
