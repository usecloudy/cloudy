import { Navbar } from "app/components/Navbar";
import { PagesSidebar } from "app/pages/[workspaceSlug]/PagesSidebar";

export const PagesLayout = async ({
	children,
	params,
}: {
	children: React.ReactNode;
	params: { workspaceSlug: string; projectSlug?: string };
}) => {
	console.log("PagesLayout", params);
	return (
		<div className="flex">
			<PagesSidebar workspaceSlug={params.workspaceSlug} projectSlug={params.projectSlug} />
			<div className="flex flex-col w-full">
				<Navbar />
				{children}
			</div>
		</div>
	);
};
