import { useQuery } from "@tanstack/react-query";
import { FileIcon, SearchIcon, TriangleAlertIcon, XCircleIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import TextareaAutosize from "react-textarea-autosize";

import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { Dialog, DialogContent } from "src/components/Dialog";
import LoadingSpinner from "src/components/LoadingSpinner";
import { useWorkspace, useWorkspaceStore } from "src/stores/workspace";
import { cn } from "src/utils";
import { makeHumanizedTime } from "src/utils/strings";
import { useBreakpoint } from "src/utils/tailwind";
import { makeDocUrl, makeThoughtUrl } from "src/utils/thought";

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
				.rpc("search_docs", {
					search_query: query.replaceAll(" ", "+"),
					p_workspace_id: workspace.id,
				})
				.order("doc_updated_at", { ascending: false });

			if (error) throw error;

			return data.map(t => ({
				id: t.doc_id,
				title: t.doc_title,
				content_md: t.doc_content_md,
				content_plaintext: t.doc_content_plaintext,
				updated_at: t.doc_updated_at,
				project_id: t.doc_project_id,
				project_name: t.project_name,
				project_slug: t.project_slug,
			}));
		},
		retry: false,
	});
};

const SearchBar = ({ isOpen, onClose }: SearchBarProps) => {
	const [query, setQuery] = useState("");
	const navigate = useNavigate();
	const workspace = useWorkspaceStore(({ workspace }) => workspace);
	const isMdBreakpoint = useBreakpoint("md");

	const listRef = useRef<Array<HTMLElement | null>>([]);
	const listContainerRef = useRef<HTMLDivElement>(null);

	const { data, isFetching, isError } = useSearchThoughts(query);
	const [activeIndex, setActiveIndex] = useState<number | null>(null);

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setQuery(e.target.value);
	};

	const handleResultClick = (docId: string, projectSlug?: string | null) => {
		if (!workspace?.slug) return;
		navigate(makeDocUrl({ workspaceSlug: workspace.slug, docId, projectSlug }));
		handleClose();
	};

	const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (!workspace?.slug) {
			return;
		}

		if (e.key === "Enter") {
			e.preventDefault();
			if (activeIndex !== null && data) {
				const thought = data[activeIndex];
				if (thought) {
					handleResultClick(thought.id, thought.project_slug);
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
		if (!workspace) {
			return;
		}

		if (isError) {
			return (
				<div className="flex items-center gap-2 p-3 text-sm text-red-600">
					<TriangleAlertIcon className="size-4" />
					<span>Something went wrong. Please try again.</span>
				</div>
			);
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
						onClick={() => handleResultClick(thought.id, thought.project_slug)}
						className={cn(
							"flex cursor-pointer items-center gap-2 rounded px-3 py-1 hover:bg-card",
							activeIndex === index && "bg-accent/10",
						)}>
						<FileIcon className="h-4 w-4 flex-shrink-0 text-secondary" />
						<div className="flex min-w-0 flex-1 flex-col">
							<span className="text-xs text-secondary">
								{thought.project_name ? `Project: ${thought.project_name}` : `Workspace: ${workspace.name}`}
							</span>

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
			<DialogContent
				className="max-w-[calc(100vw-2rem)] overflow-hidden p-0 md:max-w-lg"
				position="top"
				offset={isMdBreakpoint ? "33%" : "8%"}>
				<div className="relative flex w-full flex-col items-center">
					<div className="relative flex w-full items-center">
						<div className="absolute left-3 top-0 flex h-full items-center">
							<SearchIcon className="size-5 text-secondary" />
						</div>
						<TextareaAutosize
							className="min-h-10 w-full resize-none bg-white/30 py-4 pl-11 pr-16 font-sans outline-none hover:outline-none focus:outline-none"
							placeholder="Search for docs..."
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
