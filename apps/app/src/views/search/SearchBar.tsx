import { useQuery } from "@tanstack/react-query";
import { NotebookTextIcon, SearchIcon, XCircleIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TextareaAutosize from "react-textarea-autosize";

import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { Dialog, DialogContent } from "src/components/Dialog";
import LoadingSpinner from "src/components/LoadingSpinner";
import { useWorkspace, useWorkspaceSlug, useWorkspaceStore } from "src/stores/workspace";
import { cn } from "src/utils";
import { makeHumanizedTime } from "src/utils/strings";
import { makeThoughtUrl } from "src/utils/thought";

import { useSearchBarStore } from "./searchBarStore";

interface SearchBarProps {
	isOpen: boolean;
	onClose: () => void;
}

const useSearchThoughts = (query: string) => {
	const workspace = useWorkspace();

	return useQuery({
		enabled: !!query && query.length > 1,
		queryKey: ["thoughts", query],
		queryFn: async () => {
			const { data, error } = await supabase
				.rpc("search_thoughts", {
					search_query: query.replaceAll(" ", "+"),
					p_workspace_id: workspace.id,
				})
				.order("thought_updated_at", { ascending: false });

			if (error) throw error;

			return data.map((t: any) => ({
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

const SearchBar = ({ isOpen, onClose }: SearchBarProps) => {
	const [query, setQuery] = useState("");
	const navigate = useNavigate();
	const wsSlug = useWorkspaceStore(({ workspace }) => workspace?.slug);

	const listRef = useRef<Array<HTMLElement | null>>([]);
	const listContainerRef = useRef<HTMLDivElement>(null);

	const { data, isFetching } = useSearchThoughts(query);
	const [activeIndex, setActiveIndex] = useState<number | null>(null);

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setQuery(e.target.value);
	};

	const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (!wsSlug) {
			return;
		}

		if (e.key === "Enter") {
			e.preventDefault();
			if (activeIndex !== null && data) {
				const thought = data[activeIndex];
				if (thought) {
					navigate(makeThoughtUrl(wsSlug, thought.id));
					onClose();
				}
			}
		} else if (e.key === "ArrowDown") {
			e.preventDefault();
			if (data) {
				setActiveIndex(prev => (prev === null || prev === data.length - 1 ? 0 : prev + 1));
			}
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			if (data) {
				setActiveIndex(prev => (prev === null || prev === 0 ? data.length - 1 : prev - 1));
			}
		}
	};

	const handleClose = () => {
		onClose();
		setQuery("");
		setActiveIndex(null);
	};

	const handleResultClick = (thoughtId: string) => {
		if (!wsSlug) return;
		navigate(makeThoughtUrl(wsSlug, thoughtId));
		handleClose();
	};

	const handleClearQuery = () => {
		setQuery("");
		setActiveIndex(null);
	};

	useEffect(() => {
		if (activeIndex !== null && listRef.current[activeIndex]) {
			listRef.current[activeIndex]?.scrollIntoView({
				behavior: "smooth",
				block: "nearest",
			});
		}
	}, [activeIndex]);

	const renderSearchResults = () => {
		if (!wsSlug) {
			return;
		}

		if (!data || data.length === 0) {
			return query.length > 2 ? (
				<div className="p-3 text-sm text-secondary">No results found</div>
			) : (
				<div className="p-3 text-sm text-tertiary">Continue typing to search</div>
			);
		}

		return (
			<div ref={listContainerRef} className="no-scrollbar max-h-[300px] w-full overflow-y-auto p-4">
				{data.map((thought, index) => (
					<div
						key={thought.id}
						ref={node => {
							listRef.current[index] = node;
						}}
						onClick={() => handleResultClick(thought.id)}
						className={cn(
							"flex cursor-pointer items-center gap-2 rounded px-3 py-1 hover:bg-card",
							activeIndex === index && "bg-accent/10",
						)}>
						<NotebookTextIcon className="h-4 w-4 flex-shrink-0 text-secondary" />
						<div className="flex min-w-0 flex-1 flex-col">
							<span className="text-xs text-secondary">{makeHumanizedTime(thought.updated_at)}</span>
							<span className={cn("truncate text-sm", thought.title ? "font-medium" : "text-primary/80")}>
								{thought.title || thought.content_plaintext || thought.content_md}
							</span>
						</div>
					</div>
				))}
			</div>
		);
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={open => {
				if (!open) {
					handleClose();
				}
			}}>
			<DialogContent className="overflow-hidden p-0" position="top" offset="33%">
				<div className="relative flex w-full flex-col items-center">
					<div className="relative flex w-full items-center">
						<div className="absolute left-3 top-0 flex h-full items-center">
							<SearchIcon className="size-5 text-secondary" />
						</div>
						<TextareaAutosize
							className="min-h-10 w-full resize-none bg-white/30 py-4 pl-11 pr-16 font-sans outline-none hover:outline-none focus:outline-none"
							placeholder="Search for notes..."
							value={query}
							onChange={handleInputChange}
							onKeyDown={handleInputKeyDown}
						/>
						<div className="absolute right-3 top-0 flex h-full items-center gap-2">
							{isFetching && <LoadingSpinner size="xs" />}
							{query.length > 0 && (
								<Button onClick={handleClearQuery} variant="ghost" size="icon-sm" className="text-secondary">
									<XCircleIcon className="size-4" />
								</Button>
							)}
						</div>
					</div>
					{query.length > 0 && renderSearchResults()}
				</div>
			</DialogContent>
		</Dialog>
	);
};

export const SearchBarControl = () => {
	const { isOpen, setIsOpen } = useSearchBarStore();

	return <SearchBar isOpen={isOpen} onClose={() => setIsOpen(false)} />;
};
