import { handleSupabaseError } from "@cloudy/utils/common";
import { useMutation, useQuery } from "@tanstack/react-query";
import { NotebookIcon, PlusIcon, SparklesIcon, XIcon } from "lucide-react";
import { useContext, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

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
import { useWorkspace, useWorkspaceSlug } from "src/stores/workspace";
import { makeCollectionUrl } from "src/utils/collection";
import { makeThoughtUrl } from "src/utils/thought";

import { useEditThought, useThought } from "./hooks";
import { ThoughtContext } from "./thoughtContext";

const useCollections = () => {
	const workspace = useWorkspace();
	return useQuery({
		queryKey: [workspace.slug, "collections"],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("collections")
				.select("*")
				.eq("workspace_id", workspace.id)
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
	const workspace = useWorkspace();

	const navigate = useNavigate();

	return useMutation({
		mutationFn: async (payload: { title: string; thoughtId?: string | null }) => {
			let thoughtIdToUse = payload.thoughtId;

			if (!thoughtIdToUse) {
				const thought = await editThought();
				thoughtIdToUse = thought?.id;
				if (thought?.id) {
					navigate(makeThoughtUrl(workspace.slug, thought.id), { replace: true, preventScrollReset: true });
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
						workspace_id: workspace.id,
					})
					.select()
					.single(),
			);

			await supabase.from("collection_thoughts").insert({
				collection_id: newCollection.id,
				thought_id: thoughtIdToUse,
				workspace_id: workspace.id,
			});

			return newCollection;
		},
	});
};

const useAddToCollection = () => {
	const { mutateAsync: editThought } = useEditThought();
	const workspace = useWorkspace();

	const navigate = useNavigate();

	return useMutation({
		mutationFn: async (payload: { collectionId: string; thoughtId?: string | null }) => {
			if (!payload.thoughtId) {
				const thought = await editThought();
				payload.thoughtId = thought?.id;
				if (thought?.id) {
					navigate(makeThoughtUrl(workspace.slug, thought.id), { replace: true, preventScrollReset: true });
				}
			}
			if (!payload.thoughtId) {
				return;
			}

			const { error } = await supabase.from("collection_thoughts").insert({
				collection_id: payload.collectionId,
				thought_id: payload.thoughtId,
				workspace_id: workspace.id,
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

const useIgnoreCollectionSuggestion = () => {
	return useMutation({
		mutationFn: async (payload: { collectionId: string; thoughtId: string }) => {
			const ignoredCollectionSuggestions = handleSupabaseError(
				await supabase
					.from("thoughts")
					.select("collection_suggestions, ignored_collection_suggestions")
					.eq("id", payload.thoughtId)
					.single(),
			);

			const collectionSuggestions = ignoredCollectionSuggestions.collection_suggestions as string[] | null;
			const newIgnoredCollectionSuggestions = Array.from(
				new Set([
					...((ignoredCollectionSuggestions.ignored_collection_suggestions as string[] | null) ?? []),
					payload.collectionId,
				]),
			);
			const newCollectionSuggestions = collectionSuggestions?.filter(id => id !== payload.collectionId);

			await supabase
				.from("thoughts")
				.update({
					ignored_collection_suggestions: newIgnoredCollectionSuggestions,
					collection_suggestions: newCollectionSuggestions,
				})
				.eq("id", payload.thoughtId);

			return payload.thoughtId;
		},
	});
};

export const CollectionCarousel = () => {
	const { thoughtId } = useContext(ThoughtContext);

	const { data: allCollections } = useCollections();
	const { data: thought } = useThought(thoughtId);
	const wsSlug = useWorkspaceSlug();

	const { mutateAsync: createCollection } = useNewCollection();
	const { mutateAsync: addToCollection } = useAddToCollection();
	const { mutateAsync: removeFromCollection } = useRemoveFromCollection();
	const { mutateAsync: ignoreCollectionSuggestion } = useIgnoreCollectionSuggestion();

	const thoughtCollectionSet = useMemo(
		() => new Set(thought?.collections?.map(collection => collection.id)),
		[thought?.collections],
	);

	const collectionIds = useMemo(() => {
		return new Set(thought?.collections?.map(collection => collection.id) ?? []);
	}, [thought?.collections]);

	const suggestedCollections = useMemo(() => {
		return (thought?.collection_suggestions as string[] | null)
			?.map(collectionId => {
				return allCollections?.find(collection => collection.id === collectionId);
			})
			.filter(collection => collection !== undefined);
	}, [thought?.collection_suggestions, allCollections]);

	return (
		<div className="no-scrollbar -ml-6 w-screen overflow-x-auto pl-6 md:ml-0 md:w-full md:pl-0">
			<div className="flex flex-nowrap gap-2 pb-2">
				{thoughtId &&
					thought?.collections?.map(collection => (
						<Link key={collection.id} to={makeCollectionUrl(wsSlug, collection.id)}>
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
								<NotebookIcon className="h-4 w-4 flex-shrink-0" />
								<span>{collection.title || "Untitled Collection"}</span>
							</Chip>
						</Link>
					))}
				{thought &&
					thoughtId &&
					suggestedCollections?.map(
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
									}}
									rightElements={
										<Chip.Delete
											icon={<XIcon className="h-3.5 w-3.5 flex-shrink-0" />}
											onClick={e => {
												e.preventDefault();
												e.stopPropagation();
												ignoreCollectionSuggestion({
													collectionId: suggestedCollection.id,
													thoughtId,
												});
											}}
										/>
									}>
									<SparklesIcon className="h-3.5 w-3.5 flex-shrink-0 text-accent" />
									<span>{"Add to "}</span>
									<span className="font-bold">{suggestedCollection.title}</span>
								</Chip>
							),
					)}
				<CollectionDropdown
					trigger={
						<Chip size="sm" variant="secondary">
							<PlusIcon className="h-4 w-4 flex-shrink-0 stroke-2" />
							<span>Add to collection</span>
						</Chip>
					}
					collections={allCollections ?? []}
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
