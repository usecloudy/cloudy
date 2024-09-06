import { handleSupabaseError } from "@cloudy/utils/common";
import { useMutation } from "@tanstack/react-query";
import { GoalIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TextareaAutosize from "react-textarea-autosize";

import { supabase } from "src/clients/supabase";
import { useSave } from "src/utils/useSave";

import { useEditThought, useThought } from "./hooks";

const useSetIntent = (thoughtId?: string) => {
	const { mutateAsync: editThought } = useEditThought();

	const navigate = useNavigate();

	return useMutation({
		mutationFn: async (intent: string) => {
			let thoughtIdToUse = thoughtId;

			if (!thoughtId) {
				const thought = await editThought();
				thoughtIdToUse = thought?.id;
				if (!thoughtId && thoughtIdToUse) {
					navigate(`/thoughts/${thoughtIdToUse}`, { replace: true, preventScrollReset: true });
				}
			}

			if (!thoughtIdToUse) {
				return;
			}

			handleSupabaseError(
				await supabase
					.from("thoughts")
					.update({
						user_intent: intent,
					})
					.eq("id", thoughtIdToUse),
			);
		},
	});
};

export const GoalCard = ({ thoughtId }: { thoughtId?: string }) => {
	const { data: thought } = useThought(thoughtId);

	const [intent, setIntent] = useState(thought?.user_intent || "");

	const { mutate: confirmSetIntent } = useSetIntent(thoughtId);

	const { onChange } = useSave(confirmSetIntent);

	const handleSetIntent = (value: string) => {
		setIntent(value);
		onChange(value);
	};

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center gap-1">
				<GoalIcon className="h-4 w-4 text-secondary" />
				<h5 className="text-sm font-medium text-secondary">Set a goal</h5>
			</div>
			<TextareaAutosize
				placeholder="Setting a goal for your note will help Cloudy give better suggestions."
				className="w-full rounded bg-white/20 border-border border resize-none font-sans px-4 py-3 min-h-10 outline-none hover:outline-none focus:outline-none text-sm"
				value={intent}
				onChange={e => handleSetIntent(e.target.value)}
			/>
		</div>
	);
};
