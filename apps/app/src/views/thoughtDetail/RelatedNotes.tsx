import { ThoughtSignals, handleSupabaseError } from "@cloudy/utils/common";
import { useQuery } from "@tanstack/react-query";
import { FileSymlinkIcon, LinkIcon, SparklesIcon } from "lucide-react";
import { useEffect, useMemo } from "react";

import { queryClient } from "src/api/queryClient";
import { supabase } from "src/clients/supabase";
import LoadingSpinner from "src/components/LoadingSpinner";
import { ThoughtCard } from "src/components/ThoughtCard";
import { Tooltip, TooltipContent, TooltipTrigger } from "src/components/Tooltip";
import { fixOneToOne } from "src/utils";

import { useThought } from "./hooks";

const useIsAiEmbeddingLoading = (thoughtId?: string) => {
	const { data: thought } = useThought(thoughtId);

	return useMemo(() => {
		const signals = thought?.signals as string[] | null;
		return signals?.includes(ThoughtSignals.EMBEDDING_UPDATE);
	}, [thought?.signals]);
};

const useRelatedThoughts = (thoughtId?: string) => {
	useEffect(() => {
		if (!thoughtId) {
			return;
		}

		const thoughtEmbeddingsChannel = supabase
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
						queryKey: ["relatedThoughts", thoughtId],
					});
				},
			)
			.subscribe();

		const thoughtLinksChannel = supabase
			.channel("thoughtLinks")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "thought_links",
					filter: `linked_from=eq.${thoughtId}`,
				},
				() => {
					queryClient.invalidateQueries({
						queryKey: ["relatedThoughts", thoughtId],
					});
				},
			)
			.subscribe();

		return () => {
			thoughtEmbeddingsChannel.unsubscribe();
			thoughtLinksChannel.unsubscribe();
		};
	}, [thoughtId]);

	return useQuery({
		queryKey: ["relatedThoughts", thoughtId],
		queryFn: async () => {
			if (!thoughtId) {
				return [];
			}

			const data = handleSupabaseError(
				await supabase
					.from("thought_embedding_matches")
					.select(
						`
                        id,
                        thought:thoughts!matches_thought_id (
                            id,
                            title,
                            content_md,
                            content_plaintext,
                            created_at,
                            updated_at,
                            collection_thoughts (
                                collections (
                                    id,
                                    title
                                )
                            )
                        )
                    `,
					)
					.eq("thought_id", thoughtId),
			).flatMap(d => d.thought);

			const linkedData = handleSupabaseError(
				await supabase
					.from("thought_links")
					.select(
						`id,
                        thought:thoughts!linked_to (
                            id,
                            title,
                            content_md,
                            content_plaintext,
                            created_at,
                            updated_at,
                            collection_thoughts (
                                collections (
                                    id,
                                    title
                                )
                            ))`,
					)
					.or(`linked_from.eq.${thoughtId},linked_to.eq.${thoughtId}`),
			)
				.flatMap(d => d.thought)
				.filter(thought => thought.id !== thoughtId)
				.map(thought => ({ ...thought, isLinkedManually: true }));

			const thoughts: Record<
				string,
				{
					id: string;
					title: string | null;
					content_md: string | null;
					content_plaintext: string | null;
					created_at: string;
					updated_at: string;
					collections: { id: string; title: string | null }[];
					isLinkedManually: boolean;
				}
			> = {};

			[...data, ...linkedData].forEach(thought => {
				thoughts[thought.id] = {
					id: thought.id,
					title: thought.title,
					content_md: thought.content_md,
					content_plaintext: thought.content_plaintext,
					created_at: thought.created_at,
					updated_at: thought.updated_at,
					collections: thought.collection_thoughts?.flatMap(collection =>
						collection.collections ? [collection.collections] : [],
					),
					isLinkedManually: Boolean("isLinkedManually" in thought),
				};
			});

			return Object.values(thoughts).sort((a, b) => {
				if (a.isLinkedManually !== b.isLinkedManually) {
					return a.isLinkedManually ? -1 : 1;
				}
				return b.updated_at.localeCompare(a.updated_at);
			});
		},
		throwOnError: true,
	});
};

export const RelatedNotes = ({ thoughtId }: { thoughtId?: string }) => {
	const isAiEmbeddingLoading = useIsAiEmbeddingLoading(thoughtId);
	const { data: relatedThoughts, isLoading } = useRelatedThoughts(thoughtId);

	const manuallyLinked = useMemo(() => relatedThoughts?.filter(t => t.isLinkedManually) || [], [relatedThoughts]);
	const automaticallyLinked = useMemo(() => relatedThoughts?.filter(t => !t.isLinkedManually) || [], [relatedThoughts]);

	return (
		<div className="border-border flex flex-col w-full gap-2 rounded-md border p-4">
			{isLoading ? (
				<div className="flex w-full justify-center py-4">
					<LoadingSpinner size="sm" />
				</div>
			) : (
				<>
					<RelatedNotesSection
						title="Linked Notes"
						thoughts={manuallyLinked}
						icon={<LinkIcon className="text-secondary size-4 mr-1" />}
						emptyMessage="No linked notes"
					/>
					<RelatedNotesSection
						title="Related Notes"
						thoughts={automaticallyLinked}
						icon={<SparklesIcon className="text-secondary size-4 mr-1" />}
						emptyMessage="No related notes (yet, keep typing!)"
						isLoading={isAiEmbeddingLoading}
					/>
				</>
			)}
		</div>
	);
};

const RelatedNotesSection = ({
	title,
	thoughts,
	icon,
	emptyMessage,
	isLoading,
}: {
	title: string;
	thoughts: ReturnType<typeof useRelatedThoughts>["data"];
	icon: React.ReactNode;
	emptyMessage: string;
	isLoading?: boolean;
}) => (
	<div className="mb-4">
		<h5 className="text-sm font-medium text-secondary mb-2 flex items-center">
			{icon}
			{title}
			{isLoading && <LoadingSpinner size="xs" className="ml-2" />}
		</h5>
		{thoughts && thoughts.length > 0 ? (
			thoughts.map(thought => <ThoughtCard key={thought.id} thought={thought} variant="compact" />)
		) : (
			<div className="text-tertiary text-sm">{emptyMessage}</div>
		)}
	</div>
);
