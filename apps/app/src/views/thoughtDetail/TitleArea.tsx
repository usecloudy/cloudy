import { Hotkey } from "@cloudy/ui";
import { MoreHorizontalIcon, XIcon } from "lucide-react";
import { useContext } from "react";
import TextareaAutosize from "react-textarea-autosize";

import { Button } from "src/components/Button";
import { Dropdown, DropdownItem } from "src/components/Dropdown";

import { CollectionCarousel } from "./CollectionCarousel";
import { useThought, useToggleDisableTitleSuggestions } from "./hooks";
import { ThoughtContext } from "./thoughtContext";

export const TitleArea = ({ title, onChange }: { title?: string | null; onChange: (title: string) => void }) => {
	const { thoughtId } = useContext(ThoughtContext);
	const { data: thought } = useThought(thoughtId);

	const toggleDisableTitleSuggestionsMutation = useToggleDisableTitleSuggestions();

	const handleAcceptTitleSuggestion = () => {
		if (thought?.title_suggestion) {
			onChange(thought.title_suggestion);
		}
	};

	return (
		<div className="ml-8 flex flex-col gap-3 pb-4">
			<div className="flex-start flex">
				<TextareaAutosize
					className="no-scrollbar w-full resize-none appearance-none border-none bg-transparent text-2xl font-bold leading-8 outline-none md:text-3xl md:leading-10"
					contentEditable={true}
					placeholder={thought?.title_suggestion || "Untitled"}
					value={title || ""}
					onChange={e => {
						onChange(e.target.value);
					}}
					onKeyDown={e => {
						if (e.key === "Tab") {
							handleAcceptTitleSuggestion();
							e.preventDefault();
							e.stopPropagation();
						}
					}}
					suppressContentEditableWarning
				/>
				{thought?.title_suggestion && !title && (
					<div className="mt-1.5 flex gap-1">
						<Button size="sm" variant="outline" onClick={handleAcceptTitleSuggestion}>
							<Hotkey keys={["tab"]} />
							<span>Accept</span>
						</Button>
						<Dropdown
							trigger={
								<Button size="icon-sm" variant="outline">
									<MoreHorizontalIcon className="size-4" />
								</Button>
							}>
							<DropdownItem
								onSelect={() =>
									toggleDisableTitleSuggestionsMutation.mutate({ thoughtId, disableTitleSuggestions: true })
								}>
								<XIcon className="size-4" />
								<span>Disable title suggestions for this note</span>
							</DropdownItem>
						</Dropdown>
					</div>
				)}
			</div>
		</div>
	);
};
