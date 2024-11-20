import { PlusIcon } from "lucide-react";

import { Button } from "src/components/Button";

import { useCreateDocument } from "../documentDetail/editor/hooks";

export const ThoughtsEmptyState = () => {
	const createThoughtMutation = useCreateDocument();

	return (
		<div className="flex w-full flex-col items-center justify-center gap-4">
			<span className="text-tertiary">Bummer. No docs here (yet!)</span>

			<Button onClick={() => createThoughtMutation.mutate({})}>
				<PlusIcon className="size-4 stroke-[3px]" />
				<span>Create your first doc</span>
			</Button>
		</div>
	);
};
