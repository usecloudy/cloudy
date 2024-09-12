import {
	FloatingFocusManager,
	flip,
	offset,
	size,
	useDismiss,
	useFloating,
	useFocus,
	useInteractions,
	useListNavigation,
	useRole,
} from "@floating-ui/react";
import { useQuery } from "@tanstack/react-query";
import { NotebookTextIcon, SearchIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TextareaAutosize from "react-textarea-autosize";

import { supabase } from "src/clients/supabase";
import LoadingSpinner from "src/components/LoadingSpinner";
import { useUser } from "src/stores/user";
import { cn } from "src/utils";
import { makeHumanizedTime } from "src/utils/strings";

const useSearchThoughts = (query: string) => {
	const user = useUser();

	return useQuery({
		enabled: !!query && query.length > 1,
		queryKey: ["thoughts", query],
		queryFn: async () => {
			const { data, error } = await supabase
				.rpc("search_thoughts", {
					search_query: query,
					user_id: user.id,
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

export const SearchBar = () => {
	const [query, setQuery] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const { data, isFetching } = useSearchThoughts(query);
	const [activeIndex, setActiveIndex] = useState<number | null>(null);

	const navigate = useNavigate();

	const listRef = useRef<Array<HTMLElement | null>>([]);
	const listContainerRef = useRef<HTMLDivElement>(null);

	const { refs, floatingStyles, context } = useFloating({
		open: isOpen,
		onOpenChange: setIsOpen,
		middleware: [
			offset(5),
			flip({ padding: 10 }),
			size({
				apply({ rects, elements }) {
					Object.assign(elements.floating.style, {
						width: `${rects.reference.width}px`,
						maxHeight: "300px",
					});
				},
			}),
		],
	});

	const focus = useFocus(context);
	const dismiss = useDismiss(context);
	const role = useRole(context);
	const listNav = useListNavigation(context, {
		listRef,
		activeIndex,
		onNavigate: setActiveIndex,
		loop: true,
		virtual: true,
		scrollItemIntoView: true,
	});

	const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([focus, dismiss, role, listNav]);

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setQuery(e.target.value);
		setIsOpen(e.target.value.length > 0);
	};

	const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter") {
			if (activeIndex !== null) {
				const thought = data?.[activeIndex];
				if (thought) {
					navigate(`/thoughts/${thought.id}`);
				}
			}
		}
	};

	const renderSearchResults = () => {
		if (!data || data.length === 0) {
			return query.length > 2 ? (
				<div className="p-3 text-sm text-secondary">No results found</div>
			) : (
				<div className="p-3 text-sm text-tertiary">Continue typing to search</div>
			);
		}

		return (
			<div ref={listContainerRef} className="max-h-[300px] overflow-y-auto">
				{data.map((thought, index) => (
					<Link
						to={`/thoughts/${thought.id}`}
						key={thought.id}
						ref={node => {
							listRef.current[index] = node;
						}}
						{...getItemProps({
							onClick: () => setIsOpen(false),
						})}>
						<div
							className={cn(
								"flex items-center gap-2 px-3 py-1 hover:bg-card cursor-pointer rounded",
								activeIndex === index && "bg-accent/10",
							)}>
							<NotebookTextIcon className="h-4 w-4 flex-shrink-0 text-secondary" />
							<div className="flex flex-col flex-1 min-w-0">
								<span className="text-xs text-secondary">{makeHumanizedTime(thought.updated_at)}</span>
								<span className={cn("text-sm truncate", thought.title ? "font-medium" : "text-primary/80")}>
									{thought.title || thought.content_plaintext || thought.content_md}
								</span>
							</div>
						</div>
					</Link>
				))}
			</div>
		);
	};

	return (
		<div className="relative w-full flex items-center">
			<div className="relative flex items-center w-full">
				<SearchIcon className="absolute left-3 top-3 size-4 text-secondary" />
				<TextareaAutosize
					className="w-full rounded-md bg-white/20 border-border border min-h-10 resize-none text-sm font-sans pl-9 pr-9 py-2 outline-none hover:outline-none focus:outline-none"
					placeholder="Search for notes..."
					value={query}
					ref={refs.setReference}
					{...getReferenceProps({
						onChange: handleInputChange,
						onKeyDown: handleInputKeyDown,
					})}
				/>
				{isFetching && (
					<div className="absolute right-3 top-3 animate-in fade-in duration-200">
						<LoadingSpinner size="xs" />
					</div>
				)}
			</div>
			{isOpen && query.length > 0 && (
				<FloatingFocusManager context={context} initialFocus={-1}>
					<div
						ref={refs.setFloating}
						style={floatingStyles}
						{...getFloatingProps()}
						className="z-10 w-full bg-background border border-border rounded-md shadow-md p-2 animate-in fade-in duration-200">
						{renderSearchResults()}
					</div>
				</FloatingFocusManager>
			)}
		</div>
	);
};