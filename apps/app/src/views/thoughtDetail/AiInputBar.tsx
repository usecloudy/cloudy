import { SendHorizonalIcon } from "lucide-react";
import { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

import { Button } from "src/components/Button";

import { useRespond } from "./hooks";
import { useThoughtStore } from "./thoughtStore";

export const AiInputBar = ({ disabled }: { disabled?: boolean }) => {
	const { feedMode, activeThreadCommentId } = useThoughtStore();
	const [textInput, setTextInput] = useState("");
	const { mutate: respond } = useRespond();

	const canSubmit = textInput.length > 0 && !disabled;

	const handleSubmit = () => {
		if (!canSubmit) {
			return;
		}

		respond({ message: textInput, commentId: activeThreadCommentId });
		setTextInput("");
	};

	return (
		<div className="relative w-full">
			<TextareaAutosize
				placeholder={feedMode === "thread" ? "Respond to Cloudy" : "Ask Cloudy something"}
				className="min-h-10 w-full resize-none rounded-md border border-border bg-white/20 py-2 pl-3 pr-12 font-sans text-sm outline-none hover:outline-none focus:outline-none"
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
					className="rounded ease-out animate-in fade-in zoom-in"
					onClick={handleSubmit}
					disabled={!canSubmit}>
					<SendHorizonalIcon className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
};
