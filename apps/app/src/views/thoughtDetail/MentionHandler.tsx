import { Hotkey } from "@cloudy/ui";
import { handleSupabaseError } from "@cloudy/utils/common";
import { useQuery } from "@tanstack/react-query";
import { SuggestionProps } from "@tiptap/suggestion";
import { ArrowRightIcon, NotebookTextIcon } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

import { supabase } from "src/clients/supabase";
import LoadingSpinner from "src/components/LoadingSpinner";
import { useUser } from "src/stores/user";
import { cn } from "src/utils";
import { makeHumanizedTime } from "src/utils/strings";

const useSearchThoughts = (query: string) => {
	const user = useUser();

	return useQuery({
		enabled: !!query && query.length > 2,
		queryKey: ["thoughts", query],
		queryFn: async () => {
			const results = handleSupabaseError(
				await supabase
					.rpc("search_thoughts", {
						search_query: query,
						user_id: user.id,
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
	const user = useUser();

	return useQuery({
		queryKey: ["latest_thoughts", user.id],
		queryFn: async () => {
			const results = handleSupabaseError(
				await supabase
					.from("thoughts")
					.select("id, title, content_md, content_plaintext, updated_at")
					.eq("author_id", user.id)
					.order("updated_at", { ascending: false })
					.limit(8),
			);
			return results;
		},
	});
};

export const MentionHandler = forwardRef(({ query, command }: SuggestionProps, ref: React.Ref<any>) => {
	const { data, isLoading: isLoadingThoughtSearch } = useSearchThoughts(query);
	const { data: latestThoughts, isLoading: isLoadingLatestThoughts } = useLatestThoughts();

	const [currentView, setCurrentView] = useState<"notes" | "default">("default");
	const [selectedIndex, setSelectedIndex] = useState(0);

	const displayingData = (currentView === "default" ? data : latestThoughts) ?? [];

	const upHandler = () => {
		if (displayingData.length === 0) {
			return;
		}
		setSelectedIndex((selectedIndex + displayingData.length - 1) % displayingData.length);
	};

	const downHandler = () => {
		if (displayingData.length === 0) {
			return;
		}
		setSelectedIndex((selectedIndex + 1) % displayingData.length);
	};

	const apply = (index: number) => {
		const selectedThought = displayingData[index];
		command({
			id: selectedThought.id,
			label: selectedThought.title || selectedThought.content_plaintext || selectedThought.content_md,
		});
	};

	const enterHandler = () => {
		if (currentView === "default") {
			if (!data) {
				setCurrentView("notes");
			} else {
				apply(selectedIndex);
			}
		} else if (currentView === "notes") {
			apply(selectedIndex);
		}
	};

	useEffect(() => setSelectedIndex(0), [data, currentView]);
	useEffect(() => setCurrentView("default"), [data]);

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
				if (currentView === "notes") {
					setCurrentView("default");
					return true;
				}
				hide();
				return true;
			}

			return false;
		},
	}));

	let title = "Link a note, type to search for notes.";
	if (isLoadingThoughtSearch || isLoadingLatestThoughts) {
		title = "Searching...";
	} else if (displayingData && displayingData.length > 0) {
		if (currentView === "notes") {
			title = "Viewing latest notes";
		} else {
			title = "Viewing search results";
		}
	}
	return (
		<div className="bg-background border border-border rounded-md p-2 shadow-md w-[28rem]">
			<div className="text-sm text-secondary mb-2 ml-1">{title}</div>
			{isLoadingThoughtSearch || isLoadingLatestThoughts ? (
				<div>
					<LoadingSpinner size="xs" />
				</div>
			) : displayingData && displayingData.length > 0 ? (
				displayingData.map((thought, index) => (
					<div
						key={thought.id}
						className={cn(
							"flex items-center gap-2 px-2 py-1 rounded-sm cursor-pointer w-full  hover:bg-card",
							selectedIndex === index ? "bg-accent/10" : "",
						)}
						onClick={() => apply(index)}>
						<NotebookTextIcon className="size-4 flex-shrink-0 text-secondary" />
						<div className="flex flex-col flex-1 min-w-0">
							<span className="text-xs text-secondary">{makeHumanizedTime(thought.updated_at)}</span>
							<span className={cn("text-sm truncate", thought.title ? "font-medium" : "text-primary/80")}>
								{thought.title || thought.content_plaintext || thought.content_md}
							</span>
						</div>
						<div className="flex items-center text-xs text-secondary gap-1 flex-shrink-0">
							<Hotkey keys={["enter"]} />
							<span>Link</span>
						</div>
					</div>
				))
			) : (
				<div
					className={cn(
						"flex items-center gap-2 text-sm px-2 py-1 rounded-sm cursor-pointer w-full hover:bg-card",
						selectedIndex === 0 && "bg-accent/10",
					)}
					onClick={() => setCurrentView("notes")}>
					<ArrowRightIcon className="size-4 flex-shrink-0 text-secondary" />
					<span className="flex-1">View latest notes</span>
					<div className="flex items-center text-xs text-secondary gap-1 flex-shrink-0">
						<Hotkey keys={["enter"]} />
						<span>Open</span>
					</div>
				</div>
			)}
		</div>
	);
});
