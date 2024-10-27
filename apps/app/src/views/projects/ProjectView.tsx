import { useProject } from "./ProjectContext";

export const ProjectView = () => {
	const project = useProject();
	return (
		<div className="flex flex-1 items-center justify-center">
			<div className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 text-tertiary">
				<span>Viewing project {project?.name}</span>
				<span>Open or create a doc from the sidebar to get started</span>
			</div>
		</div>
	);
};
