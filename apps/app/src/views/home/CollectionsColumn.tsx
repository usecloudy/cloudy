import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "src/components/Button";
import { supabase } from "src/clients/supabase";
import { useUser } from "src/stores/user";
import { makeHumanizedTime, pluralize } from "src/utils/strings";
import { PlusIcon } from "lucide-react";

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

export const CollectionsColumn = () => {
	const { data } = useLatestCollections();
	return (
		<div>
			<div className="flex md:w-[18rem] lg:w-[28rem] flex-col gap-4 rounded-lg border border-border py-6">
				<div className="flex justify-between items-center px-6">
					<h2 className="font-semibold text-secondary">Collections</h2>
					<Button variant="ghost" size="icon" asChild>
						<Link to="/collections/new">
							<PlusIcon className="h-4 w-4" />
							<span className="sr-only">Add new collection</span>
						</Link>
					</Button>
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
