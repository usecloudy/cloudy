import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { supabase } from "src/clients/supabase";
import { DialogCancel } from "src/components/AlertDialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "src/components/AlertDialog";
import { Button } from "src/components/Button";
import { Input } from "src/components/Input";
import { useUser } from "src/stores/user";
import { makeHumanizedTime, pluralize } from "src/utils/strings";

const useLatestCollections = () => {
	const user = useUser();
	return useQuery({
		queryKey: ["latestCollections"],
		queryFn: async () => {
			const { data } = await supabase
				.from("collections")
				.select("*, collection_thoughts(id)")
				.eq("author_id", user.id)
				.order("updated_at", { ascending: false })
				.limit(20);
			return data?.map(collection => ({
				...collection,
				thoughtsCount: collection.collection_thoughts.length,
			}));
		},
	});
};

const useNewCollection = () => {
	return useMutation({
		mutationFn: async (title: string) => {
			const { data, error } = await supabase.from("collections").insert({ title }).select();

			if (error) {
				throw error;
			}

			return data[0];
		},
	});
};

export const CollectionsColumn = () => {
	const { data } = useLatestCollections();
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [newCollectionTitle, setNewCollectionTitle] = useState("");
	const { mutateAsync: createCollection } = useNewCollection();
	const queryClient = useQueryClient();

	const handleCreateCollection = async () => {
		if (newCollectionTitle.trim()) {
			await createCollection(newCollectionTitle);
			setNewCollectionTitle("");
			setIsDialogOpen(false);
			queryClient.invalidateQueries({ queryKey: ["latestCollections"] });
		}
	};

	return (
		<div>
			<div className="flex md:w-[18rem] lg:w-[28rem] flex-col gap-4 rounded-lg border border-border py-6">
				<div className="flex justify-between items-center px-6">
					<h2 className="font-semibold text-secondary">Collections</h2>
					<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
						<Button variant="ghost" size="icon" onClick={() => setIsDialogOpen(true)}>
							<PlusIcon className="h-4 w-4" />
							<span className="sr-only">Add new collection</span>
						</Button>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Create New Collection</DialogTitle>
							</DialogHeader>
							<Input
								value={newCollectionTitle}
								onChange={e => setNewCollectionTitle(e.target.value)}
								placeholder="Enter collection title"
							/>
							<DialogFooter>
								<DialogCancel asChild>
									<Button variant="secondary">Cancel</Button>
								</DialogCancel>
								<Button onClick={handleCreateCollection}>Create</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
				<div className="flex flex-col px-3">
					{data && data.length > 0 ? (
						data.map(collection => (
							<Link key={collection.id} to={`/collections/${collection.id}`}>
								<div className="flex flex-col hover:bg-card rounded py-2 px-3 cursor-pointer">
									<div className="text-xs text-secondary">
										{`${makeHumanizedTime(collection.updated_at ?? collection.created_at)} • ${pluralize(collection.thoughtsCount, "note")}`}
									</div>
									<div className="font-medium">{collection.title}</div>
								</div>
							</Link>
						))
					) : (
						<div className="flex px-3">
							<span className="text-tertiary text-sm">
								Create topics you'd like to keep track of, or let Cloudy suggest topics for you as yo write.
							</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
