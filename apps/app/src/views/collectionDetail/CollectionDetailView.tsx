import { Switch } from "@cloudy/ui";
import { CollectionSummary } from "@cloudy/utils/common";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PlusIcon, SparklesIcon } from "lucide-react";
import { PostHogFeature } from "posthog-js/react";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useParams } from "react-router-dom";

import { queryClient } from "src/api/queryClient";
import { collectionQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { MainLayout } from "src/components/MainLayout";
import { ThoughtList } from "src/components/ThoughtList";
import { useWorkspace } from "src/stores/workspace";
import { ellipsizeText, makeHeadTitle, pluralize } from "src/utils/strings";
import { useSave } from "src/utils/useSave";

import { NewNote } from "../navigation/NewNote";
import { CollectionSummaryCard } from "./CollectionSummaryCard";

export const useCollectionListener = (collectionId: string) => {
	useEffect(() => {
		const channel = supabase
			.channel("collection-detail")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "collections", filter: `id=eq.${collectionId}` },
				() => {
					queryClient.invalidateQueries({ queryKey: collectionQueryKeys.collectionDetail(collectionId) });
				},
			);

		return () => {
			supabase.removeChannel(channel);
		};
	}, [collectionId]);
};

export const useCollection = (collectionId?: string) => {
	return useQuery({
		queryKey: collectionQueryKeys.collectionDetail(collectionId ?? ""),
		queryFn: async () => {
			if (!collectionId) {
				return null;
			}

			const { data, error } = await supabase.from("collections").select("*").eq("id", collectionId).single();

			if (error) {
				throw error;
			}

			return data;
		},
		enabled: !!collectionId,
	});
};

export const useCollectionThoughts = (collectionId: string) => {
	return useQuery({
		queryKey: collectionQueryKeys.collectionDetailThoughts(collectionId),
		queryFn: async () => {
			if (!collectionId) {
				return [];
			}

			const { data, error } = await supabase
				.from("collection_thoughts")
				.select(
					`thought_id, thoughts(
                        id,
                        title,
                        created_at,
						updated_at,
						content_md,
						content_plaintext,
                        collections:collection_thoughts(
                            collection_id,
                            collection:collections(
                                id,
                                title
                            )   
					    )
                    )`,
				)
				.eq("collection_id", collectionId)
				.order("created_at", { ascending: false });

			if (error) {
				throw error;
			}

			return data.flatMap(item =>
				item.thoughts
					? [
							{
								...item.thoughts,
								collections: item.thoughts.collections.flatMap(collection =>
									collection.collection ? [collection.collection] : [],
								),
							},
						]
					: [],
			);
		},
		enabled: !!collectionId,
	});
};

const useEditCollection = (collectionId: string) => {
	const workspace = useWorkspace();

	return useMutation({
		mutationFn: async (payload: { title: string }) => {
			if (!collectionId) {
				throw new Error("Collection ID is required");
			}
			const { data, error } = await supabase
				.from("collections")
				.update({ title: payload.title })
				.eq("id", collectionId)
				.single();

			if (error) {
				throw error;
			}
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: collectionQueryKeys.collectionDetail(collectionId),
			});
			queryClient.invalidateQueries({
				queryKey: collectionQueryKeys.workspaceCollections(workspace.id),
			});
		},
	});
};

const useToggleAutoCollection = (collectionId: string) => {
	const workspace = useWorkspace();

	return useMutation({
		mutationFn: async (isAuto: boolean) => {
			if (!collectionId) {
				throw new Error("Collection ID is required");
			}
			const { data, error } = await supabase
				.from("collections")
				.update({ is_auto: isAuto })
				.eq("id", collectionId)
				.single();

			if (error) {
				throw error;
			}
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: collectionQueryKeys.collectionDetail(collectionId),
			});
			queryClient.invalidateQueries({
				queryKey: collectionQueryKeys.workspaceCollections(workspace.id),
			});
		},
	});
};

export const CollectionDetailView = () => {
	const { collectionId } = useParams<{ collectionId: string }>();

	if (!collectionId) {
		throw new Error("Collection ID is required");
	}

	useCollectionListener(collectionId);
	const { data: collection, isLoading: isCollectionLoading } = useCollection(collectionId);
	const { data: thoughts, isLoading: areThoughtsLoading } = useCollectionThoughts(collectionId);

	const { mutate: editCollection } = useEditCollection(collectionId);
	const { onChange: onTitleChange } = useSave(editCollection);

	const { mutate: toggleAutoCollection } = useToggleAutoCollection(collectionId);

	const [title, setTitle] = useState<string | null>(null);

	useEffect(() => {
		if (collection) {
			setTitle(collection.title);
		}
	}, [collection]);

	const handleTitleChange = (newTitle: string) => {
		setTitle(newTitle);
		onTitleChange({ title: newTitle });
	};

	const handleAutoCollectionToggle = (checked: boolean) => {
		toggleAutoCollection(checked);
	};

	return (
		<MainLayout isLoading={isCollectionLoading || areThoughtsLoading} className="h-screen overflow-y-scroll">
			<Helmet>
				<title>{makeHeadTitle(collection?.title ? ellipsizeText(collection.title, 16) : "Untitled Collection")}</title>
			</Helmet>
			{collection && (
				<div className="flex flex-col py-8">
					<div className="text-sm text-secondary">Collection • {pluralize(thoughts?.length ?? 0, "note")}</div>
					<input
						className="mb-4 w-full appearance-none border-none bg-transparent text-3xl font-bold leading-5 outline-none"
						contentEditable={true}
						placeholder="Untitled Collection"
						value={title ?? ""}
						onChange={e => handleTitleChange(e.target.value)}
					/>
					<PostHogFeature flag="collection-summary" match>
						<CollectionSummaryCard
							summary={collection.summary as CollectionSummary | null}
							collectionId={collectionId}
							canGenerateSummary={Boolean(thoughts && thoughts.length > 0)}
							summaryUpdatedAt={collection.summary_updated_at}
						/>
					</PostHogFeature>
					<div className="my-4 flex flex-row items-center gap-2">
						{/* <Button variant="outline">
							<PlusIcon className="size-4" />
							New sub-collection
						</Button> */}
						<div>
							<NewNote collectionId={collectionId} />
						</div>
						<div className="flex flex-row items-center gap-1 rounded border border-border px-2 py-1.5">
							<SparklesIcon className="size-4 text-accent" />
							<span className="text-sm text-secondary">Automatically add notes to this collection</span>
							<Switch checked={collection.is_auto} onCheckedChange={handleAutoCollectionToggle} />
						</div>
					</div>
					<ThoughtList thoughts={thoughts ?? []} />
				</div>
			)}
		</MainLayout>
	);
};
