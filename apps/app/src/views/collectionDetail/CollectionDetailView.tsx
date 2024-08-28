import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useParams } from "react-router-dom";

import { queryClient } from "src/api/queryClient";
import { supabase } from "src/clients/supabase";
import { SimpleLayout } from "src/components/SimpleLayout";
import { ThoughtList } from "src/components/ThoughtList";
import { ellipsizeText, makeHeadTitle, pluralize } from "src/utils/strings";
import { useSave } from "src/utils/useSave";

export const useCollection = (collectionId: string) => {
	return useQuery({
		queryKey: ["collection", collectionId],
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
		queryKey: ["collectionThoughts", collectionId],
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
				queryKey: ["collection", collectionId],
			});
		},
	});
};

export const CollectionDetailView = () => {
	const { collectionId } = useParams<{ collectionId: string }>();

	if (!collectionId) {
		throw new Error("Collection ID is required");
	}

	const { data: collection, isLoading: isCollectionLoading } = useCollection(collectionId);
	const { data: thoughts, isLoading: areThoughtsLoading } = useCollectionThoughts(collectionId);

	const { mutate: editCollection } = useEditCollection(collectionId);
	const { onChange: onTitleChange } = useSave(editCollection);

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

	return (
		<SimpleLayout isLoading={isCollectionLoading || areThoughtsLoading}>
			<Helmet>
				<title>{makeHeadTitle(collection?.title ? ellipsizeText(collection.title, 16) : "Untitled Collection")}</title>
			</Helmet>
			{collection && (
				<div className="p-8">
					<div className="text-sm text-secondary">Collection • {pluralize(thoughts?.length ?? 0, "note")}</div>
					<input
						className="mb-4 w-full appearance-none border-none bg-transparent text-3xl font-bold leading-5 outline-none"
						contentEditable={true}
						placeholder="Untitled Collection"
						value={title ?? ""}
						onChange={e => handleTitleChange(e.target.value)}
					/>
					<ThoughtList thoughts={thoughts ?? []} />
				</div>
			)}
		</SimpleLayout>
	);
};
