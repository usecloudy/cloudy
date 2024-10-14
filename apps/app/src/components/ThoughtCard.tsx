import { VariantProps, cva } from "class-variance-authority";
import { FileIcon, MoreHorizontalIcon, NotebookTextIcon, Trash2Icon } from "lucide-react";
import { Link } from "react-router-dom";

import { useWorkspaceSlug } from "src/stores/workspace";
import { cn } from "src/utils";
import { ellipsizeText, makeHumanizedTime } from "src/utils/strings";
import { makeThoughtUrl } from "src/utils/thought";
import { useDeleteThought } from "src/views/thoughtDetail/hooks";

import { Button } from "./Button";
import { Dropdown, DropdownItem } from "./Dropdown";

interface Collection {
	id: string;
	title: string | null;
}

interface Thought {
	id: string;
	title: string | null;
	content_md: string | null;
	content_plaintext: string | null;
	created_at: string;
	updated_at: string | null;
	collections: Collection[];
}

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
	rightContent,
	hoursOnlyForUpdatedAt = true,
}: {
	thought: Thought;
	variant?: VariantProps<typeof thoughtCardVariants>["variant"];
	rightContent?: React.ReactNode;
	hoursOnlyForUpdatedAt?: boolean;
}) => {
	const wsSlug = useWorkspaceSlug();
	const { mutate: deleteThought } = useDeleteThought();

	return (
		<Link to={makeThoughtUrl(wsSlug, thought.id)}>
			<div className={cn(thoughtCardVariants({ variant }))}>
				<div className="flex flex-1 flex-row items-center gap-2">
					{thought.collections.length > 0 ? (
						<NotebookTextIcon className="size-5 flex-shrink-0 text-tertiary" />
					) : (
						<FileIcon className="size-5 flex-shrink-0 text-tertiary" />
					)}
					<div className="flex flex-col">
						<span className="mt-1 text-xs text-secondary">
							{makeHumanizedTime(thought.updated_at ?? thought.created_at, { hoursOnly: hoursOnlyForUpdatedAt })}
							{thought.collections.length > 0 ? (
								<span className="text-xs text-secondary">
									{" • "}
									{thought.collections.map(collection => collection.title || "Untitled").join(", ")}
								</span>
							) : null}
						</span>
						<h3 className={cn(thought.title ? "font-medium text-primary" : "font-normal text-primary/80")}>
							{thought.title || ellipsizeText(thought.content_plaintext || thought.content_md || "Untitled", 36)}
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
							<DropdownItem onSelect={() => deleteThought(thought.id)}>
								<Trash2Icon className="h-5 w-5" />
								Delete Thought
							</DropdownItem>
						</Dropdown>
					</div>
				)}
			</div>
		</Link>
	);
};
