import { FileSymlinkIcon, TrashIcon, ZapIcon } from "lucide-react";
import { useState } from "react";
import { useUnmount } from "react-use";

import LoadingSpinner from "src/components/LoadingSpinner";
import { ThoughtCard } from "src/components/ThoughtCard";

import { Button } from "../../components/Button";
import { AiCommentThread } from "./AiCommentThread";
import { AiFeed } from "./AiFeed";
import { GoalCard } from "./GoalCard";
import { useDeleteThought, useRelatedThoughts } from "./hooks";
import { useThreadStore } from "./threadStore";

export const ControlColumn = ({ thoughtId }: { thoughtId?: string }) => {
	const { data: relatedThoughts, isLoading } = useRelatedThoughts(thoughtId);
	const { mutateAsync: deleteThought } = useDeleteThought(thoughtId);

	const { activeThreadCommentId, setActiveThreadCommentId } = useThreadStore();

	const [isViewingArchive, setIsViewingArchive] = useState(false);

	useUnmount(() => {
		setActiveThreadCommentId(null);
	});

	return (
		<div className="relative h-full box-border overflow-y-auto flex w-full lg:w-[26rem] no-scrollbar ">
			<div className="w-full md:pt-4 lg:pt-8">
				{activeThreadCommentId ? (
					<AiCommentThread commentId={activeThreadCommentId} />
				) : (
					<div className="flex flex-col md:flex-row lg:flex-col gap-4 w-full">
						<AiFeed
							thoughtId={thoughtId}
							isViewingArchive={isViewingArchive}
							setIsViewingArchive={setIsViewingArchive}
						/>
						<div className="flex flex-col md:w-1/2 lg:w-full gap-4 w-full">
							<div className="border-border flex flex-col w-full gap-2 rounded-md border p-4">
								<div className="flex items-center gap-1 mb-2 ">
									<FileSymlinkIcon className="h-4 w-4 text-secondary" />
									<h4 className="text-sm font-medium text-secondary">Related Notes</h4>
								</div>
								{isLoading ? (
									<div className="flex w-full justify-center py-4">
										<LoadingSpinner size="sm" />
									</div>
								) : relatedThoughts && relatedThoughts.length > 0 ? (
									<div>
										{relatedThoughts.map(thought => (
											<ThoughtCard key={thought.id} thought={thought} variant="compact" />
										))}
									</div>
								) : (
									<div className="text-tertiary text-sm">No related notes (yet, keep typing!)</div>
								)}
							</div>
							<div className="border-border flex flex-col w-full rounded-md border p-4">
								<GoalCard thoughtId={thoughtId} />
								{thoughtId && (
									<div className="flex flex-col gap-2">
										<div className="flex items-center gap-1 mb-0.5 mt-4">
											<ZapIcon className="h-4 w-4 text-secondary" />
											<h4 className="text-sm font-medium text-secondary">Note Actions</h4>
										</div>
										<Button
											variant="ghost"
											className="justify-start text-red-600 hover:bg-red-600"
											onClick={() => {
												deleteThought();
												window.history.back();
											}}>
											<TrashIcon className="h-4 w-4" />
											<span>Delete note</span>
										</Button>
									</div>
								)}
							</div>
						</div>
					</div>
				)}
				<div className="h-8" />
			</div>
		</div>
	);
};
