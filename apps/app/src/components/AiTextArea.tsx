import { Hotkey } from "@cloudy/ui";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Portal } from "react-portal";
import TextareaAutosize from "react-textarea-autosize";

import { octokit } from "src/clients/github";
import { Button } from "src/components/Button";
import { cn } from "src/utils";

interface AiTextAreaProps {
	onSubmit: (text: string) => void;
	onCancel: () => void;
	placeholder?: string;
	submitButtonText?: string;
	showEditButton?: boolean;
	onEdit?: () => void;
	dropdownOptions?: string[];
}

const useSearchGithub = (query: string) => {
	const { data: validPaths } = useQuery({
		queryKey: ["github"],
		queryFn: async () => {
			const results = await octokit.rest.git.getTree({
				owner: "getsentry",
				repo: "seer",
				tree_sha: "main",
				recursive: "true",
			});

			return results.data.tree.map(t => t.path!).filter(Boolean);
		},
	});

	console.log("validPaths", validPaths);

	const githubPathSearchResults = useMemo(() => validPaths?.filter(path => path.includes(query)), [validPaths, query]);

	return githubPathSearchResults;
};

export const AiTextArea = ({
	onSubmit,
	onCancel,
	placeholder = "Ask a question or describe what you want to do",
	submitButtonText = "Submit",
	showEditButton = false,
	onEdit,
	dropdownOptions = [],
}: AiTextAreaProps) => {
	const [text, setText] = useState("");
	const [showDropdown, setShowDropdown] = useState(false);
	const [dropdownQuery, setDropdownQuery] = useState("");
	const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
	const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
	const textAreaRef = useRef<HTMLTextAreaElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const [selectedIndex, setSelectedIndex] = useState(-1);

	useEffect(() => {
		textAreaRef.current?.focus();
	}, []);

	const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newText = e.target.value;
		setText(newText);

		const cursorPosition = e.target.selectionStart;
		const textBeforeCursor = newText.slice(0, cursorPosition);
		const lastAtSymbolIndex = textBeforeCursor.lastIndexOf("@");

		if (lastAtSymbolIndex !== -1) {
			const textAfterLastAt = textBeforeCursor.slice(lastAtSymbolIndex + 1);
			if (textAfterLastAt.includes(" ") || textAfterLastAt.includes("\n")) {
				setShowDropdown(false);
			} else {
				setShowDropdown(true);
				setDropdownQuery(textAfterLastAt);
				updateCursorPosition();
			}
		} else {
			setShowDropdown(false);
		}
	};

	const updateCursorPosition = () => {
		if (textAreaRef.current) {
			const { selectionStart, offsetLeft, offsetTop } = textAreaRef.current;
			const textBeforeCursor = textAreaRef.current.value.substring(0, selectionStart);
			const lines = textBeforeCursor.split("\n");
			const lineHeight = parseInt(window.getComputedStyle(textAreaRef.current).lineHeight);
			const top = offsetTop + lines.length * lineHeight;
			const left = offsetLeft + lines[lines.length - 1].length * 8; // Approximate character width

			const rect = textAreaRef.current.getBoundingClientRect();
			setDropdownPosition({
				top: rect.top + top,
				left: rect.left + left,
			});
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (showDropdown && filteredOptions.length > 0) {
			switch (e.key) {
				case "ArrowDown":
					e.preventDefault();
					setSelectedIndex(prevIndex => (prevIndex < filteredOptions.length - 1 ? prevIndex + 1 : prevIndex));
					break;
				case "ArrowUp":
					e.preventDefault();
					setSelectedIndex(prevIndex => (prevIndex > 0 ? prevIndex - 1 : prevIndex));
					break;
				case "Enter":
					e.preventDefault();
					if (selectedIndex >= 0) {
						handleOptionSelect(filteredOptions[selectedIndex]);
					} else {
						onSubmit(text);
					}
					break;
				case "Escape":
					setShowDropdown(false);
					break;
			}
		} else if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			onSubmit(text);
		} else if (e.key === "Escape") {
			onCancel();
		}
	};

	const handleOptionSelect = (option: string) => {
		const textBeforeCursor = text.slice(0, textAreaRef.current?.selectionStart);
		const textAfterCursor = text.slice(textAreaRef.current?.selectionStart);
		const newText = textBeforeCursor.replace(/@[^@\s]*$/, `@${option} `) + textAfterCursor;
		setText(newText);
		setShowDropdown(false);
		setSelectedIndex(-1);
	};

	const githubSearchResults = useSearchGithub(dropdownQuery);

	const filteredOptions = [
		...dropdownOptions.filter(option => option.toLowerCase().includes(dropdownQuery.toLowerCase())),
		...(githubSearchResults || []),
	];

	return (
		<div className="relative w-full px-4 pb-4">
			<TextareaAutosize
				ref={textAreaRef}
				className="no-scrollbar w-full resize-none appearance-none border-none bg-transparent px-2 py-3 text-sm outline-none"
				placeholder={placeholder}
				value={text}
				onChange={handleTextChange}
				onKeyDown={handleKeyDown}
			/>
			{showDropdown && (
				<Portal>
					<div
						ref={dropdownRef}
						className="fixed z-50 mt-4 max-h-60 w-64 overflow-auto rounded-md border border-gray-300 bg-white shadow-lg"
						style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px` }}>
						{filteredOptions.length > 0 ? (
							<ul className="py-1">
								{filteredOptions.map((option, index) => (
									<li
										key={index}
										className={cn(
											"cursor-pointer px-4 py-2 hover:bg-gray-100",
											index === selectedIndex && "bg-gray-100",
										)}
										onClick={() => handleOptionSelect(option)}>
										{option}
									</li>
								))}
							</ul>
						) : (
							<div className="px-4 py-2 text-gray-500">No results found</div>
						)}
					</div>
				</Portal>
			)}
			<div className="flex flex-row items-center justify-end gap-1">
				{showEditButton && (
					<Button size="sm" variant="ghost" onClick={onEdit}>
						<Hotkey keys={["Command", "Enter"]} />
						<span>Edit</span>
					</Button>
				)}
				<Button size="sm" variant="default" onClick={() => onSubmit(text)}>
					<Hotkey keys={["Enter"]} />
					<span>{submitButtonText}</span>
				</Button>
			</div>
		</div>
	);
};
