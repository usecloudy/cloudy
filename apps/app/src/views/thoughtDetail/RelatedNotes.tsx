import { handleSupabaseError } from "@cloudy/utils/common";
import { useQuery } from "@tanstack/react-query";
import { ChevronDownIcon, ChevronUpIcon, LinkIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { queryClient } from "src/api/queryClient";
import { thoughtQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import LoadingSpinner from "src/components/LoadingSpinner";
import { ThoughtCard } from "src/components/ThoughtCard";
import { fixOneToOne } from "src/utils";

const useRelatedThoughts = (thoughtId?: string) => {
	useEffect(() => {
		if (!thoughtId) {
			return;
		}

		const thoughtSummaryMatchesChannel = supabase
			.channel("thoughtSummaryMatches")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "thought_relations",
					filter: `matches=eq.${thoughtId}`,
				},
				() => {
					console.log("thoughtSummaryMatchesChannel", thoughtId);
					queryClient.invalidateQueries({
						queryKey: thoughtQueryKeys.relatedThoughts(thoughtId),
					});
				},
			)
			.subscribe();

		const thoughtSummaryMatchedByChannel = supabase
			.channel("thoughtSummaryMatchedBy")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "thought_relations",
					filter: `matched_by=eq.${thoughtId}`,
				},
				() => {
					console.log("thoughtSummaryMatchedByChannel", thoughtId);
					queryClient.invalidateQueries({
						queryKey: thoughtQueryKeys.relatedThoughts(thoughtId),
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
						queryKey: thoughtQueryKeys.relatedThoughts(thoughtId),
					});
				},
			)
			.subscribe();

		return () => {
			thoughtSummaryMatchesChannel.unsubscribe();
			thoughtSummaryMatchedByChannel.unsubscribe();
			thoughtLinksChannel.unsubscribe();
		};
	}, [thoughtId]);

	return useQuery({
		queryKey: thoughtQueryKeys.relatedThoughts(thoughtId),
		queryFn: async () => {
			if (!thoughtId) {
				return {
					linkedData: [],
					relatedData: [],
				};
			}

			const data = handleSupabaseError(
				await supabase
					.from("thought_relations")
					.select(
						`
                        matches:thoughts!matches (
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
							),
						matched_by:thoughts!matched_by (
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
						),
						similarity_score
                    `,
					)
					.or(`matched_by.eq.${thoughtId},matches.eq.${thoughtId}`)
					.order("similarity_score", { ascending: false }),
			).flatMap(d => {
				if (fixOneToOne(d.matched_by)?.id === thoughtId) {
					const matches = fixOneToOne(d.matches);
					if (matches) {
						return [matches];
					}
					return [];
				}
				const matchedBy = fixOneToOne(d.matched_by);
				if (matchedBy) {
					return [matchedBy];
				}
				return [];
			});

			const linkedFromData = handleSupabaseError(
				await supabase
					.from("thought_links")
					.select(
						`
                        id,
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
                            )
                        )
                    `,
					)
					.eq("linked_from", thoughtId),
			);

			const linkedToData = handleSupabaseError(
				await supabase
					.from("thought_links")
					.select(
						`
                        id,
                        thought:thoughts!linked_from (
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
					.eq("linked_to", thoughtId),
			);

			const linkedData = [...linkedFromData, ...linkedToData]
				.flatMap(d => d.thought)
				.map(thought => ({
					...thought,
					isLinkedManually: true,
					collections: thought.collection_thoughts
						?.map(c => ({
							id: c.collections?.id!,
							title: c.collections?.title ?? null,
						}))
						.filter(c => c.id),
				}))
				.sort((a, b) => {
					return b.updated_at.localeCompare(a.updated_at);
				});

			const relatedData = data.map(thought => ({
				...thought,
				isLinkedManually: false,
				collections: thought.collection_thoughts
					?.map(c => ({
						id: c.collections?.id!,
						title: c.collections?.title ?? null,
					}))
					.filter(c => c.id),
			}));

			return {
				linkedData,
				relatedData,
			};
		},
		throwOnError: true,
	});
};

export const RelatedNotes = ({ thoughtId }: { thoughtId?: string }) => {
	const { data: relatedThoughts, isLoading } = useRelatedThoughts(thoughtId);

	const manuallyLinked = relatedThoughts?.linkedData ?? [];

	return (
		<div className="flex w-full flex-col gap-2 rounded-md border border-border p-4">
			{isLoading ? (
				<div className="flex w-full justify-center py-4">
					<LoadingSpinner size="sm" />
				</div>
			) : (
				<RelatedNotesSection
					title="Linked Docs"
					thoughts={manuallyLinked}
					icon={<LinkIcon className="mr-1 size-4 text-secondary" />}
					emptyMessage="No linked docs"
				/>
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
	thoughts:
		| NonNullable<ReturnType<typeof useRelatedThoughts>["data"]>["linkedData"]
		| NonNullable<ReturnType<typeof useRelatedThoughts>["data"]>["relatedData"];
	icon: React.ReactNode;
	emptyMessage: string;
	isLoading?: boolean;
}) => {
	const [showAll, setShowAll] = useState(false);
	const displayedThoughts = showAll ? thoughts : thoughts?.slice(0, 4);

	return (
		<div className="mb-4">
			<h5 className="mb-2 flex items-center text-sm font-medium text-secondary">
				{icon}
				{title}
				{isLoading && <LoadingSpinner size="xs" className="ml-2" />}
			</h5>
			<div className="flex w-full flex-col">
				{thoughts && thoughts.length > 0 ? (
					<>
						{displayedThoughts?.map(thought => (
							<ThoughtCard key={thought.id} thought={thought} variant="compact" hoursOnlyForUpdatedAt={false} />
						))}
						{thoughts.length > 4 ? (
							!showAll ? (
								<Button
									variant="ghost"
									size="sm"
									className="mt-2 self-start text-secondary"
									onClick={() => setShowAll(true)}>
									<ChevronDownIcon className="size-4" />
									<span>Show more</span>
								</Button>
							) : (
								<Button
									variant="ghost"
									size="sm"
									className="mt-2 self-start text-secondary"
									onClick={() => setShowAll(false)}>
									<ChevronUpIcon className="size-4" />
									<span>Show less</span>
								</Button>
							)
						) : null}
					</>
				) : (
					<div className="text-sm text-tertiary">{emptyMessage}</div>
				)}
			</div>
		</div>
	);
};
