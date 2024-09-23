import { PlusIcon } from "lucide-react";

import { Button } from "src/components/Button";
import { useCreateThought } from "src/utils/thought";

export const ThoughtsEmptyState = () => {
	const createThoughtMutation = useCreateThought();

	return (
		<div className="flex w-full flex-col items-center justify-center gap-4">
			<span className="text-tertiary">Bummer. No notes here (yet!)</span>

			<Button onClick={() => createThoughtMutation.mutate({})}>
				<PlusIcon className="size-4 stroke-[3px]" />
				<span>Create your first note</span>
			</Button>
		</div>
	);
};
