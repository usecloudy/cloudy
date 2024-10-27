import { FolderGit2Icon, FolderIcon, FolderKanbanIcon, MessageCircleWarningIcon, PlusIcon } from "lucide-react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";

import { Button } from "src/components/Button";
import { MainLayout } from "src/components/MainLayout";
import { useWorkspace } from "src/stores/workspace";
import { makeNewProjectUrl, makeProjectHomeUrl } from "src/utils/projects";
import { makeHeadTitle } from "src/utils/strings";
import { useWorkspaceProjects } from "src/utils/workspaces";

export const HomeView = () => {
	const workspace = useWorkspace();
	const { data: projects, isLoading, error } = useWorkspaceProjects();

	return (
		<MainLayout className="no-scrollbar flex-1 overflow-y-scroll">
			<Helmet>
				<title>{makeHeadTitle("Home")}</title>
			</Helmet>

			<div className="container mx-auto px-4 py-8">
				<div className="flex items-center justify-between">
					<h1 className="font-display text-3xl font-bold">Welcome to {workspace.name}</h1>
					<Link to={makeNewProjectUrl(workspace.slug)}>
						<Button variant="outline">
							<PlusIcon className="size-4" />
							New Project
						</Button>
					</Link>
				</div>

				{isLoading && (
					<div className="mt-8 flex items-center justify-center">
						<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					</div>
				)}

				{error && (
					<div className="bg-destructive/10 text-destructive mt-8 rounded-lg p-4">
						<div className="flex items-center">
							<MessageCircleWarningIcon className="size-5" />
							<p>Failed to load projects</p>
						</div>
					</div>
				)}

				{projects && projects.length === 0 && (
					<div className="mt-8 rounded-lg border border-dashed p-8">
						<div className="text-center">
							<FolderIcon className="mx-auto size-12 stroke-1 text-tertiary" />
							<h3 className="mt-4 text-lg font-medium text-secondary">No projects yet</h3>
							<p className="mt-1 text-sm text-tertiary">Get started by creating your first project</p>
							<Link to={makeNewProjectUrl(workspace.slug)}>
								<Button variant="default" className="mt-4">
									<PlusIcon className="size-4" />
									Create Project
								</Button>
							</Link>
						</div>
					</div>
				)}

				{projects && projects.length > 0 && (
					<div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{projects.map(project => (
							<Link
								key={project.id}
								to={makeProjectHomeUrl(workspace.slug, project.slug)}
								className="group rounded-lg border bg-card p-6 transition-all hover:opacity-50">
								<div className="flex items-center justify-between">
									<div className="flex items-center">
										{project.hasRepositoryConnection ? (
											<FolderGit2Icon className="size-6 text-primary" />
										) : (
											<FolderKanbanIcon className="size-6 text-primary" />
										)}
										<h3 className="ml-3 font-medium">{project.name}</h3>
									</div>
								</div>
							</Link>
						))}
					</div>
				)}
			</div>
		</MainLayout>
	);
};
