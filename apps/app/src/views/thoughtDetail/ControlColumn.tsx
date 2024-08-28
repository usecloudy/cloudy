import { useMutation, useQuery } from "@tanstack/react-query";
import { FileSymlinkIcon, MessageCircleIcon, TrashIcon, ZapIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useUnmount } from "react-use";

import { queryClient } from "src/api/queryClient";
import { supabase } from "src/clients/supabase";
import LoadingSpinner from "src/components/LoadingSpinner";
import { ThoughtCard } from "src/components/ThoughtCard";
import { useSuggestedCollectionsStore } from "src/stores/suggestedCollection";
import { fixOneToOne } from "src/utils";

import { Button } from "../../components/Button";
import { AiCommentThread } from "./AiCommentThread";
import { AiFeed } from "./AiFeed";
import { IntentDialog } from "./IntentDialog";
import { useThreadStore } from "./threadStore";

const useThoughtEmbeddings = (thoughtId?: string) => {
	useEffect(() => {
		if (!thoughtId) {
			return;
		}

		const channel = supabase
			.channel("thoughtEmbeddings")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "thought_embedding_matches",
					filter: `thought_id=eq.${thoughtId}`,
				},
				() => {
					queryClient.invalidateQueries({
						queryKey: ["thoughtEmbeddings", thoughtId],
					});
				},
			)
			.subscribe();

		return () => {
			channel.unsubscribe();
		};
	}, [thoughtId]);

	return useQuery({
		queryKey: ["thoughtEmbeddings", thoughtId],
		queryFn: async () => {
			if (!thoughtId) {
				return [];
			}

			const { data, error } = await supabase
				.from("thought_embedding_matches")
				.select(
					`
					id,
					thought_embeddings!matches (
						thoughts (
							id,
							title,
							created_at,
							updated_at,
							collection_thoughts (
								collections (
									id,
									title
								)
							)
						)
					)
				`,
				)
				.eq("thought_id", thoughtId);

			if (error) {
				throw error;
			}

			const thoughts: Record<
				string,
				{
					id: string;
					title: string | null;
					created_at: string;
					updated_at: string;
					collections: { id: string; title: string | null }[];
				}
			> = {};

			data.forEach(match => {
				const thoughtEmbedding = fixOneToOne(match.thought_embeddings);
				if (thoughtEmbedding?.thoughts) {
					const thought = thoughtEmbedding.thoughts;
					thoughts[thought.id] = {
						id: thought.id,
						title: thought.title,
						created_at: thought.created_at,
						updated_at: thought.updated_at,
						collections: thought.collection_thoughts?.flatMap(collection =>
							collection.collections ? [collection.collections] : [],
						),
					};
				}
			});

			return Object.values(thoughts);
		},
		throwOnError: true,
	});
};

const useDeleteThought = (thoughtId?: string) => {
	return useMutation({
		mutationFn: async () => {
			if (!thoughtId) {
				return;
			}
			return supabase.from("thoughts").delete().eq("id", thoughtId);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["thoughts"],
			});
		},
	});
};

export const ControlColumn = ({ thoughtId }: { thoughtId?: string }) => {
	const { data: relatedThoughts, isLoading, dataUpdatedAt } = useThoughtEmbeddings(thoughtId);
	const { mutateAsync: deleteThought } = useDeleteThought(thoughtId);

	const { setSuggestedCollections } = useSuggestedCollectionsStore();
	const { activeThreadCommentId, setActiveThreadCommentId } = useThreadStore();

	const [isViewingArchive, setIsViewingArchive] = useState(false);

	useEffect(() => {
		if (relatedThoughts && relatedThoughts.length > 0) {
			const allRelatedCollections = Object.values(
				Object.fromEntries(
					relatedThoughts.flatMap(thought => thought.collections.map(collection => [collection.id, collection])),
				),
			);

			setSuggestedCollections(allRelatedCollections);
		} else {
			setSuggestedCollections([]);
		}
	}, [relatedThoughts, dataUpdatedAt]);

	useUnmount(() => {
		setActiveThreadCommentId(null);
	});

	return (
		<div className="relative h-full box-border overflow-y-auto flex w-full lg:w-[28rem] no-scrollbar ">
			<div className="w-full px-6 md:px-4 md:pt-4 lg:px-8 lg:pt-8">
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
							{thoughtId && (
								<div className="border-border flex flex-col w-full rounded-md border p-4">
									<IntentDialog thoughtId={thoughtId} />
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
				)}
				<div className="h-8" />
			</div>
		</div>
	);
};
