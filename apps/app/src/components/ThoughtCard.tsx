import { useMutation } from "@tanstack/react-query";
import { VariantProps, cva } from "class-variance-authority";
import { LightbulbIcon, ListIcon, MoreHorizontalIcon, Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { queryClient } from "src/api/queryClient";
import { supabase } from "src/clients/supabase";
import { cn } from "src/utils";
import { makeHumanizedTime } from "src/utils/strings";

import { Button } from "./Button";
import { Dropdown, DropdownItem } from "./Dropdown";

interface Collection {
	id: string;
	title: string | null;
}

interface Thought {
	id: string;
	title: string | null;
	created_at: string;
	updated_at: string | null;
	collections: Collection[];
}

const useDeleteThought = () => {
	return useMutation({
		mutationFn: async (thoughtId: string) => {
			return supabase.from("thoughts").delete().eq("id", thoughtId);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["thoughts"],
			});
		},
	});
};

const thoughtCardVariants = cva(
	"flex flex-row items-center justify-between gap-2 rounded-md bg-background px-4 py-1 hover:bg-card",
	{
		variants: {
			variant: {
				default: "px-4",
				compact: "px-3",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export const ThoughtCard = ({
	thought,
	variant = "default",
}: {
	thought: Thought;
	variant?: VariantProps<typeof thoughtCardVariants>["variant"];
}) => {
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
	const { mutate: deleteThought } = useDeleteThought();

	const handleDeleteClick = (e: Event) => {
		e.preventDefault();
		e.stopPropagation();
		setShowDeleteConfirmation(true);
	};

	const handleConfirmDelete = () => {
		deleteThought(thought.id);
		setShowDeleteConfirmation(false);
	};

	return (
		<>
			<Link to={`/thoughts/${thought.id}`}>
				<div className={cn(thoughtCardVariants({ variant }))}>
					<div className="flex flex-row items-center gap-2">
						{thought.collections.length > 0 ? (
							<ListIcon className="text-tertiary size-5 flex-shrink-0" />
						) : (
							<LightbulbIcon className="text-tertiary size-5 flex-shrink-0" />
						)}
						<div className="flex flex-col">
							<span className="mt-1 text-xs text-secondary">
								{makeHumanizedTime(thought.updated_at ?? thought.created_at, { hoursOnly: true })}
								{thought.collections.length > 0 ? (
									<span className="text-xs text-secondary">
										{" • "}
										{thought.collections.map(collection => collection.title ?? "Untitled").join(", ")}
									</span>
								) : null}
							</span>
							<h3 className="font-medium">{thought.title ?? "Untitled"}</h3>
						</div>
					</div>
					{variant === "default" && (
						<div onClick={e => e.stopPropagation()}>
							<Dropdown
								trigger={
									<Button variant="ghost" size="icon">
										<MoreHorizontalIcon className="h-6 w-6" />
									</Button>
								}
								className="w-56">
								<DropdownItem onSelect={handleDeleteClick}>
									<Trash2Icon className="h-5 w-5" />
									Delete Thought
								</DropdownItem>
							</Dropdown>
						</div>
					)}
				</div>
			</Link>

			{showDeleteConfirmation && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white primary-gradient p-6 rounded-lg shadow-lg max-w-md w-full">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-xl font-bold">Delete Thought</h2>
							<Button variant="ghost" size="icon" onClick={() => setShowDeleteConfirmation(false)}>
								<XIcon className="h-4 w-4" />
							</Button>
						</div>
						<p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
							Are you sure you want to delete this thought? This action cannot be undone.
						</p>
						<div className="flex justify-end space-x-2">
							<Button variant="destructive" onClick={() => setShowDeleteConfirmation(false)}>
								Cancel
							</Button>
							<Button variant="secondary" onClick={handleConfirmDelete}>
								Delete
							</Button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};
