import { FilePlusIcon } from "lucide-react";

import { Button } from "src/components/Button";
import LoadingSpinner from "src/components/LoadingSpinner";
import { useCreateThought } from "src/utils/thought";

export const NewNote = () => {
	const createThoughtMutation = useCreateThought();

	return (
		<Button variant="outline" className="w-full justify-start" onClick={() => createThoughtMutation.mutate()}>
			{createThoughtMutation.isPending ? (
				<LoadingSpinner size="xs" variant="background" />
			) : (
				<>
					<FilePlusIcon className="size-4" />
					<span>New note</span>
				</>
			)}
		</Button>
	);
};
