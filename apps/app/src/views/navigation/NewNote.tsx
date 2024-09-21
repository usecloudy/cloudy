import { FilePlusIcon } from "lucide-react";

import { Button } from "src/components/Button";
import LoadingSpinner from "src/components/LoadingSpinner";
import { useCreateThought } from "src/utils/thought";

export const NewNote = ({ collectionId }: { collectionId?: string }) => {
	const createThoughtMutation = useCreateThought();

	return (
		<Button
			variant="outline"
			className="w-full justify-start"
			onClick={() => createThoughtMutation.mutate({ collectionId })}>
			{createThoughtMutation.isPending ? (
				<LoadingSpinner size="xs" variant="background" />
			) : (
				<>
					<FilePlusIcon className="size-4" />
					<span>New note{collectionId ? ` in collection` : ""}</span>
				</>
			)}
		</Button>
	);
};
