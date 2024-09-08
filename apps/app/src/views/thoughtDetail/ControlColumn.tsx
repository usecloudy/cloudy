import { ThoughtSignals } from "@cloudy/utils/common";
import { FileSymlinkIcon } from "lucide-react";
import { useMemo } from "react";

import LoadingSpinner from "src/components/LoadingSpinner";
import { ThoughtCard } from "src/components/ThoughtCard";

import { AiFeed } from "./AiFeed";
import { useRelatedThoughts, useThought } from "./hooks";

const useIsAiEmbeddingLoading = (thoughtId?: string) => {
	const { data: thought } = useThought(thoughtId);

	return useMemo(() => {
		const signals = thought?.signals as string[] | null;
		return signals?.includes(ThoughtSignals.EMBEDDING_UPDATE);
	}, [thought?.signals]);
};

export const ControlColumn = ({ thoughtId }: { thoughtId?: string }) => {
	const isAiEmbeddingLoading = useIsAiEmbeddingLoading(thoughtId);
	const { data: relatedThoughts, isLoading } = useRelatedThoughts(thoughtId);

	return (
		<div className="relative h-full box-border overflow-y-auto flex w-full lg:w-[26rem] no-scrollbar px-1 pt-1 md:pt-0 px-4 md:px-0">
			<div className="w-full md:pt-4 lg:pt-8">
				<div className="flex flex-col md:flex-row lg:flex-col gap-4 w-full">
					<AiFeed thoughtId={thoughtId} />
					<div className="flex flex-col md:w-1/2 lg:w-full gap-4 w-full">
						<div className="border-border flex flex-col w-full gap-2 rounded-md border p-4">
							<div className="flex items-center gap-1 mb-2 ">
								<FileSymlinkIcon className="h-4 w-4 text-secondary" />
								<h4 className="text-sm font-medium text-secondary">Related Notes</h4>
								{isAiEmbeddingLoading && <LoadingSpinner size="xs" className="ml-2" />}
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
					</div>
				</div>
				<div className="h-8" />
			</div>
		</div>
	);
};
