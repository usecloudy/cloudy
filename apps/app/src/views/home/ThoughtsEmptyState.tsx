import { PlusIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "src/components/Button";
import { useOrganizationSlug } from "src/stores/organization";
import { makeThoughtUrl } from "src/utils/thought";

export const ThoughtsEmptyState = () => {
	const orgSlug = useOrganizationSlug();

	return (
		<div className="flex flex-col items-center justify-center w-full gap-4">
			<span className="text-tertiary">Looks like you got no notes yet.</span>
			<Link to={makeThoughtUrl(orgSlug, "new")}>
				<Button>
					<PlusIcon className="size-4 stroke-[3px]" />
					<span>Create your first note</span>
				</Button>
			</Link>
		</div>
	);
};
