import { Hotkey } from "@cloudy/ui";
import { handleSupabaseError } from "@cloudy/utils/common";
import { useQuery } from "@tanstack/react-query";
import { SuggestionProps } from "@tiptap/suggestion";
import { ArrowRightIcon, NotebookTextIcon, PlusIcon } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

import { supabase } from "src/clients/supabase";
import LoadingSpinner from "src/components/LoadingSpinner";
import { useWorkspace } from "src/stores/workspace";
import { cn } from "src/utils";
import { makeHumanizedTime } from "src/utils/strings";
import { makeThoughtLabel } from "src/utils/thought";

import { useEditThought } from "./hooks";

const useSearchThoughts = (query: string) => {
	const workspace = useWorkspace();

	return useQuery({
		enabled: !!query && query.length > 2,
		queryKey: ["thoughts", query],
		queryFn: async () => {
			const results = handleSupabaseError(
				await supabase
					.rpc("search_thoughts", {
						search_query: query,
						p_workspace_id: workspace.id,
					})
					.order("thought_updated_at", { ascending: false }),
			);

			return results.map(t => ({
				id: t.thought_id,
				title: t.thought_title,
				content_md: t.thought_content_md,
				content_plaintext: t.thought_content_plaintext,
				updated_at: t.thought_updated_at,
			}));
		},
		staleTime: 1000,
	});
};

const useLatestThoughts = () => {
	const workspace = useWorkspace();

	return useQuery({
		queryKey: [workspace.slug, "latest_thoughts"],
		queryFn: async () => {
			const results = handleSupabaseError(
				await supabase
					.from("thoughts")
					.select("id, title, content_md, content_plaintext, updated_at")
					.eq("workspace_id", workspace.id)
					.order("updated_at", { ascending: false })
					.limit(8),
			);
			return results;
		},
	});
};

const menuOptions = ["latest_notes", "new_note"];

export const MentionHandler = forwardRef(({ query, command }: SuggestionProps, ref: React.Ref<any>) => {
	const { data, isLoading: isLoadingThoughtSearch } = useSearchThoughts(query);
	const { data: latestThoughts, isLoading: isLoadingLatestThoughts } = useLatestThoughts();
	const editThoughtMutation = useEditThought();

	const [currentView, setCurrentView] = useState<"latest_notes" | "default" | "search">("default");
	const [selectedIndex, setSelectedIndex] = useState(0);

	const displayingData = (currentView === "search" ? data : latestThoughts) ?? [];

	const upHandler = () => {
		if (currentView === "default") {
			setSelectedIndex((selectedIndex + menuOptions.length - 1) % menuOptions.length);
			return;
		}
		if (displayingData.length === 0) {
			return;
		}
		setSelectedIndex((selectedIndex + displayingData.length - 1) % displayingData.length);
	};

	const downHandler = () => {
		if (currentView === "default") {
			setSelectedIndex((selectedIndex + 1) % menuOptions.length);
			return;
		}
		if (displayingData.length === 0) {
			return;
		}
		setSelectedIndex((selectedIndex + 1) % displayingData.length);
	};

	const apply = (index: number) => {
		const selectedThought = displayingData[index];
		command({
			id: selectedThought.id,
			label: makeThoughtLabel(selectedThought),
		});
	};

	const enterHandler = () => {
		if (currentView === "default") {
			if (selectedIndex === 0) {
				setCurrentView("latest_notes");
			} else if (selectedIndex === 1) {
				editThoughtMutation.mutateAsync().then(newThought => {
					if (newThought) {
						command({
							id: newThought.id,
							label: "Untitled",
						});
					}
				});
			}
		} else if (currentView === "search") {
			apply(selectedIndex);
		} else if (currentView === "latest_notes") {
			apply(selectedIndex);
		}
	};

	useEffect(() => setSelectedIndex(0), [data, currentView]);
	useEffect(() => {
		if (data && data.length > 0) {
			setCurrentView("search");
		}
	}, [data]);

	useEffect(() => {
		if (query && query.length > 0) {
			setCurrentView("search");
		} else {
			setCurrentView("default");
		}
	}, [query]);

	useImperativeHandle(ref, () => ({
		onKeyDown: ({ event, hide }: { event: React.KeyboardEvent<HTMLDivElement>; hide: () => void }) => {
			if (event.key === "ArrowUp") {
				upHandler();
				return true;
			}

			if (event.key === "ArrowDown") {
				downHandler();
				return true;
			}

			if (event.key === "Enter") {
				enterHandler();
				return true;
			}

			if (event.key === "Escape") {
				if (currentView === "latest_notes") {
					setCurrentView("default");
					return true;
				}
				hide();
				return true;
			}

			return false;
		},
	}));

	let title;
	switch (currentView) {
		case "search":
			title = isLoadingThoughtSearch ? "Searching..." : "Viewing search results";
			break;
		case "latest_notes":
			title = isLoadingLatestThoughts ? "Searching..." : "Viewing latest notes";
			break;
		default:
			title = "Link a note, type to search for notes.";
	}

	const viewMap = {
		default: (
			<>
				<div
					className={cn(
						"flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1 text-sm hover:bg-card",
						selectedIndex === 0 && "bg-accent/10",
					)}
					onClick={() => setCurrentView("latest_notes")}>
					<ArrowRightIcon className="size-4 flex-shrink-0 text-secondary" />
					<span className="flex-1">View latest notes</span>
					<div className="flex flex-shrink-0 items-center gap-1 text-xs text-secondary">
						<Hotkey keys={["enter"]} />
						<span>Open</span>
					</div>
				</div>
				<div
					className={cn(
						"flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1 text-sm hover:bg-card",
						selectedIndex === 1 && "bg-accent/10",
					)}
					onClick={() => {}}>
					<PlusIcon className="size-4 flex-shrink-0 text-secondary" />
					<span className="flex-1">New note</span>
					<div className="flex flex-shrink-0 items-center gap-1 text-xs text-secondary">
						<Hotkey keys={["enter"]} />
						<span>Create new note</span>
					</div>
				</div>
			</>
		),
		latest_notes: (
			<ResultsView
				displayingData={latestThoughts ?? []}
				selectedIndex={selectedIndex}
				apply={apply}
				isLoading={isLoadingLatestThoughts}
			/>
		),
		search: (
			<ResultsView
				displayingData={data ?? []}
				selectedIndex={selectedIndex}
				apply={apply}
				isLoading={isLoadingThoughtSearch}
			/>
		),
	};

	return (
		<div className="w-full rounded-md border border-border bg-background p-2 shadow-md md:w-[28rem]">
			<div className="mb-2 ml-1 text-sm text-secondary">{title}</div>
			{viewMap[currentView]}
		</div>
	);
});

type DisplayingDataType = NonNullable<ReturnType<typeof useLatestThoughts>["data"]>;

const ResultsView = ({
	displayingData,
	selectedIndex,
	apply,
	isLoading,
}: {
	displayingData: DisplayingDataType;
	selectedIndex: number;
	apply: (index: number) => void;
	isLoading: boolean;
}) => {
	if (isLoading) {
		return (
			<div>
				<LoadingSpinner size="xs" />
			</div>
		);
	}

	if (displayingData.length === 0) {
		return <div className="p-2 text-center text-sm text-secondary">No results found.</div>;
	}

	return (
		<>
			{displayingData.map((thought, index) => (
				<div
					key={thought.id}
					className={cn(
						"flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1 hover:bg-card",
						selectedIndex === index ? "bg-accent/10" : "",
					)}
					onClick={() => apply(index)}>
					<NotebookTextIcon className="size-4 flex-shrink-0 text-secondary" />
					<div className="flex min-w-0 flex-1 flex-col">
						<span className="text-xs text-secondary">{makeHumanizedTime(thought.updated_at)}</span>
						<span className={cn("truncate text-sm", thought.title ? "font-medium" : "text-primary/80")}>
							{thought.title || thought.content_plaintext || thought.content_md}
						</span>
					</div>
					<div className="flex flex-shrink-0 items-center gap-1 text-xs text-secondary">
						<Hotkey keys={["enter"]} />
						<span>Link</span>
					</div>
				</div>
			))}
		</>
	);
};
