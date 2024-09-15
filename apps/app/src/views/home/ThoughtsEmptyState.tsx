import { PlusIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "src/components/Button";
import { useWorkspaceSlug } from "src/stores/workspace";
import { makeThoughtUrl } from "src/utils/thought";

export const ThoughtsEmptyState = () => {
	const wsSlug = useWorkspaceSlug();

	return (
		<div className="flex flex-col items-center justify-center w-full gap-4">
			<span className="text-tertiary">Looks like you got no notes yet.</span>
			<Link to={makeThoughtUrl(wsSlug, "new")}>
				<Button>
					<PlusIcon className="size-4 stroke-[3px]" />
					<span>Create your first note</span>
				</Button>
			</Link>
		</div>
	);
};
