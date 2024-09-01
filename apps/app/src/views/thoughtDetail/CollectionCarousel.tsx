import { handleSupabaseError } from "@cloudy/utils/common";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ListIcon, PlusIcon, SparklesIcon } from "lucide-react";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUpdateEffect } from "react-use";

import { supabase } from "src/clients/supabase";
import {
	Dialog,
	DialogAction,
	DialogCancel,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "src/components/AlertDialog";
import { Chip } from "src/components/Chip";
import { CollectionDropdown } from "src/components/CollectionDropdown";
import { useSuggestedCollectionsStore } from "src/stores/suggestedCollection";
import { useUser } from "src/stores/user";

import { useEditThought } from "./hooks";

interface Collection {
	id: string;
	title: string | null;
}

const useCollections = () => {
	const user = useUser();
	return useQuery({
		queryKey: ["collections"],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("collections")
				.select("*")
				.eq("author_id", user.id)
				.order("created_at", { ascending: false });

			if (error) {
				throw new Error(error.message);
			}

			return data;
		},
	});
};

const useNewCollection = () => {
	const { mutateAsync: editThought } = useEditThought();

	const navigate = useNavigate();

	return useMutation({
		mutationFn: async (payload: { title: string; thoughtId?: string | null }) => {
			let thoughtIdToUse = payload.thoughtId;

			if (!thoughtIdToUse) {
				const thought = await editThought({});
				thoughtIdToUse = thought?.id;
				if (thought?.id) {
					navigate(`/thoughts/${thought.id}`, { replace: true, preventScrollReset: true });
				}
			}

			if (!thoughtIdToUse) {
				return;
			}

			const newCollection = handleSupabaseError(
				await supabase
					.from("collections")
					.insert({
						title: payload.title,
					})
					.select()
					.single(),
			);

			await supabase.from("collection_thoughts").insert({
				collection_id: newCollection.id,
				thought_id: thoughtIdToUse,
			});

			return newCollection;
		},
	});
};

const useAddToCollection = () => {
	const { mutateAsync: editThought } = useEditThought();

	const navigate = useNavigate();

	return useMutation({
		mutationFn: async (payload: { collectionId: string; thoughtId?: string | null }) => {
			if (!payload.thoughtId) {
				const thought = await editThought({});
				payload.thoughtId = thought?.id;
				if (thought?.id) {
					navigate(`/thoughts/${thought.id}`, { replace: true, preventScrollReset: true });
				}
			}
			if (!payload.thoughtId) {
				return;
			}

			const { error } = await supabase.from("collection_thoughts").insert({
				collection_id: payload.collectionId,
				thought_id: payload.thoughtId,
			});

			if (error) {
				throw error;
			}

			return payload.thoughtId;
		},
	});
};

const useRemoveFromCollection = () => {
	return useMutation({
		mutationFn: async (payload: { collectionId: string; thoughtId: string }) => {
			handleSupabaseError(
				await supabase
					.from("collection_thoughts")
					.delete()
					.eq("collection_id", payload.collectionId)
					.eq("thought_id", payload.thoughtId),
			);

			return payload.thoughtId;
		},
	});
};

export const CollectionCarousel = ({ thoughtId, collections }: { thoughtId?: string; collections: Collection[] }) => {
	const { data: allCollections } = useCollections();

	const { suggestedCollections, setSuggestedCollections } = useSuggestedCollectionsStore();

	const { mutateAsync: createCollection } = useNewCollection();
	const { mutateAsync: addToCollection } = useAddToCollection();
	const { mutateAsync: removeFromCollection } = useRemoveFromCollection();

	const thoughtCollectionSet = useMemo(() => new Set(collections?.map(collection => collection.id)), [collections]);

	const collectionsWhereThoughtIsNotIn = useMemo(
		() => allCollections?.filter(collection => !thoughtCollectionSet.has(collection.id)),
		[allCollections, thoughtCollectionSet],
	);

	const collectionIds = useMemo(() => {
		return new Set(collections?.map(collection => collection.id) ?? []);
	}, [collections]);

	useUpdateEffect(() => {
		setSuggestedCollections([]);
	}, [thoughtId]);

	return (
		<div className="w-screen -ml-6 pl-6 md:ml-0 md:pl-0 md:w-full overflow-x-auto no-scrollbar">
			<div className="flex flex-nowrap gap-2 pb-2">
				{thoughtId &&
					collections?.map(collection => (
						<Link key={collection.id} to={`/collections/${collection.id}`}>
							<Chip
								size="sm"
								variant="secondary"
								rightElements={
									<div
										className="h-full"
										onClick={e => {
											e.preventDefault();
											e.stopPropagation();
										}}>
										<Dialog>
											<DialogTrigger className="h-full appearance-none">
												<Chip.Delete />
											</DialogTrigger>
											<DialogContent>
												<DialogHeader>
													<DialogTitle>Remove from collection</DialogTitle>
												</DialogHeader>
												<DialogDescription>
													Are you sure you want to remove this thought from this collection?
												</DialogDescription>
												<DialogFooter>
													<DialogCancel>Cancel</DialogCancel>
													<DialogAction
														className="bg-red-600 hover:bg-red-500"
														onClick={() => {
															removeFromCollection({
																collectionId: collection.id,
																thoughtId,
															});
														}}>
														Remove
													</DialogAction>
												</DialogFooter>
											</DialogContent>
										</Dialog>
									</div>
								}>
								<ListIcon className="h-4 w-4 flex-shrink-0" />
								<span>{collection.title}</span>
							</Chip>
						</Link>
					))}
				{thoughtId &&
					suggestedCollections.map(
						suggestedCollection =>
							!collectionIds.has(suggestedCollection.id) && (
								<Chip
									key={suggestedCollection.id}
									size="sm"
									variant="secondary"
									className="bg-accent/15"
									onClick={() => {
										addToCollection({
											collectionId: suggestedCollection.id,
											thoughtId,
										});
										setSuggestedCollections(
											suggestedCollections.filter(collection => collection.id !== suggestedCollection.id),
										);
									}}>
									<SparklesIcon className="h-3.5 w-3.5 flex-shrink-0 text-accent" />
									<span>{"Add to "}</span>
									<span className="font-bold">{suggestedCollection.title}</span>
								</Chip>
							),
					)}
				<CollectionDropdown
					trigger={
						<Chip size="sm" variant="secondary">
							<PlusIcon className="h-4 w-4 stroke-2 flex-shrink-0" />
							<span>Add to collection</span>
						</Chip>
					}
					collections={collectionsWhereThoughtIsNotIn ?? []}
					onSelect={collectionId => {
						addToCollection({
							collectionId,
							thoughtId,
						});
					}}
					onCreate={newCollectionName => {
						createCollection({
							title: newCollectionName,
							thoughtId,
						});
					}}
				/>
			</div>
		</div>
	);
};
