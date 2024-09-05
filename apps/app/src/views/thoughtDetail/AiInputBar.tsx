import { SendHorizonalIcon } from "lucide-react";
import { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

import { Button } from "src/components/Button";

import { useRespond } from "./hooks";
import { useThoughtStore } from "./thoughtStore";

export const AiInputBar = () => {
	const { feedMode, activeThreadCommentId } = useThoughtStore();
	const [textInput, setTextInput] = useState("");
	const { mutate: respond } = useRespond(activeThreadCommentId);

	const handleSubmit = () => {
		if (textInput.length === 0) {
			return;
		}

		respond(textInput);
		setTextInput("");
	};

	const canSubmit = textInput.length > 0;

	return (
		<div className="relative w-full">
			<TextareaAutosize
				placeholder={feedMode === "thread" ? "Respond to Cloudy" : "Ask Cloudy something"}
				className="w-full rounded-md bg-white/20 border-border border min-h-10 resize-none text-sm font-sans pl-3 pr-12 py-2 outline-none hover:outline-none focus:outline-none"
				value={textInput}
				onChange={e => setTextInput(e.target.value)}
				onKeyDown={e => {
					if (e.key === "Enter" && !e.shiftKey) {
						e.preventDefault();
						handleSubmit();
					}
				}}
			/>
			<div className="absolute right-1 top-1">
				<Button
					size="icon-sm"
					className="rounded animate-in zoom-in ease-out fade-in"
					onClick={handleSubmit}
					disabled={!canSubmit}>
					<SendHorizonalIcon className="w-4 h-4" />
				</Button>
			</div>
		</div>
	);
};
