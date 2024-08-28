import { PlusIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "src/components/Button";

export const ThoughtsEmptyState = () => {
	return (
		<div className="flex flex-col items-center justify-center w-full gap-4">
			<span className="text-tertiary">Looks like you got no thoughts yet.</span>
			<Link to="/thoughts/new">
				<Button>
					<PlusIcon className="size-4 stroke-[3px]" />
					<span>Create your first thought</span>
				</Button>
			</Link>
		</div>
	);
};
