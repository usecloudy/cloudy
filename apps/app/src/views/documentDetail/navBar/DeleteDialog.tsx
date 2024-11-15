import { TrashIcon } from "lucide-react";
import { useState } from "react";

import {
	Dialog,
	DialogAction,
	DialogCancel,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogTitle,
	DialogTrigger,
} from "src/components/AlertDialog";
import { Button } from "src/components/Button";

import { useDeleteThought } from "../../thoughtDetail/hooks";

export const DeleteDialog = ({ thoughtId }: { thoughtId: string }) => {
	const { mutateAsync: deleteThought } = useDeleteThought();

	const handleDelete = async () => {
		await deleteThought(thoughtId);
		setIsDeleteDialogOpen(false);
		window.history.back();
	};

	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	return (
		<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
			<DialogTrigger asChild>
				<Button variant="ghost" className="justify-start text-red-600 hover:bg-red-600 hover:text-white" size="sm">
					<TrashIcon className="h-4 w-4" />
					<span>Delete doc</span>
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogTitle>Delete Doc</DialogTitle>
				<DialogDescription>Are you sure you want to delete this doc? This action cannot be undone.</DialogDescription>
				<DialogFooter>
					<DialogCancel>Cancel</DialogCancel>
					<DialogAction destructive onClick={handleDelete}>
						Delete
					</DialogAction>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
