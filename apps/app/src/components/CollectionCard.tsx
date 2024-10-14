import { VariantProps, cva } from "class-variance-authority";
import { FolderIcon, MoreHorizontalIcon, Trash2Icon } from "lucide-react";
import { Link } from "react-router-dom";

import { useWorkspaceSlug } from "src/stores/workspace";
import { cn } from "src/utils";
import { makeCollectionUrl } from "src/utils/collection";
import { useDeleteCollection } from "src/utils/collection";
import { makeHumanizedTime } from "src/utils/strings";

import { Button } from "./Button";
import { Dropdown, DropdownItem } from "./Dropdown";

interface Collection {
	id: string;
	title: string | null;
	updated_at: string;
}

const collectionCardVariants = cva(
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

export const CollectionCard = ({
	collection,
	variant = "default",
	rightContent,
	hoursOnlyForUpdatedAt = true,
}: {
	collection: Collection;
	variant?: VariantProps<typeof collectionCardVariants>["variant"];
	rightContent?: React.ReactNode;
	hoursOnlyForUpdatedAt?: boolean;
}) => {
	const wsSlug = useWorkspaceSlug();
	const { mutate: deleteCollection } = useDeleteCollection();

	return (
		<Link to={makeCollectionUrl(wsSlug, collection.id)}>
			<div className={cn(collectionCardVariants({ variant }))}>
				<div className="flex flex-1 flex-row items-center gap-2">
					<FolderIcon className="size-5 flex-shrink-0 text-tertiary" />
					<div className="flex flex-col">
						<span className="mt-1 text-xs text-secondary">
							{makeHumanizedTime(collection.updated_at, {
								hoursOnly: hoursOnlyForUpdatedAt,
							})}
							{/* <span className="text-xs text-secondary">
								{" • "}
								{collection.thought_count} thought{collection.thought_count !== 1 ? "s" : ""}
							</span> */}
						</span>
						<h3 className={cn(collection.title ? "font-medium text-primary" : "font-normal text-primary/80")}>
							{collection.title || "Untitled Collection"}
						</h3>
					</div>
					{rightContent}
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
							<DropdownItem onSelect={() => deleteCollection({ collectionId: collection.id })}>
								<Trash2Icon className="h-5 w-5" />
								Delete Collection
							</DropdownItem>
						</Dropdown>
					</div>
				)}
			</div>
		</Link>
	);
};
