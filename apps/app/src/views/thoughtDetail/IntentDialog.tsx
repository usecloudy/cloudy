import { handleSupabaseError } from "@cloudy/utils/common";
import { useMutation } from "@tanstack/react-query";
import { GoalIcon, MessageCircleIcon } from "lucide-react";
import { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "src/components/Dialog";
import { ellipsizeText } from "src/utils/strings";
import { useSave } from "src/utils/useSave";

import { useThought } from "./useThought";

const useSetIntent = (thoughtId: string) => {
	return useMutation({
		mutationFn: async (intent: string) => {
			handleSupabaseError(
				await supabase
					.from("thoughts")
					.update({
						user_intent: intent,
					})
					.eq("id", thoughtId),
			);
		},
	});
};

export const IntentDialog = ({ thoughtId }: { thoughtId: string }) => {
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
				className="w-full rounded bg-white/20 border-border border resize-none text-base font-sans px-4 py-3 min-h-10 outline-none hover:outline-none focus:outline-none text-sm"
				value={intent}
				onChange={e => handleSetIntent(e.target.value)}
			/>
		</div>
	);
};
