import { useProject } from "./ProjectContext";

export const ProjectView = () => {
	const project = useProject();
	return <div>Project: {project?.slug}</div>;
};
