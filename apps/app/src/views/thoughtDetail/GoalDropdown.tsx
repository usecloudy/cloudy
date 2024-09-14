import { handleSupabaseError } from "@cloudy/utils/common";
import { useMutation } from "@tanstack/react-query";
import { GoalIcon, SaveIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TextareaAutosize from "react-textarea-autosize";

import { queryClient } from "src/api/queryClient";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { useWorkspaceSlug } from "src/stores/workspace";
import { makeThoughtUrl } from "src/utils/thought";

import { useEditThought, useThought } from "./hooks";

const useSetIntent = (thoughtId?: string) => {
	const { mutateAsync: editThought } = useEditThought();
	const wsSlug = useWorkspaceSlug();

	const navigate = useNavigate();

	return useMutation({
		mutationFn: async (intent: string) => {
			let thoughtIdToUse = thoughtId;

			if (!thoughtId) {
				const thought = await editThought();
				thoughtIdToUse = thought?.id;
				if (!thoughtId && thoughtIdToUse) {
					navigate(makeThoughtUrl(wsSlug, thoughtIdToUse), { replace: true, preventScrollReset: true });
				}
			}

			if (!thoughtIdToUse) {
				return;
			}

			console.log("saving");
			handleSupabaseError(
				await supabase
					.from("thoughts")
					.update({
						user_intent: intent,
					})
					.eq("id", thoughtIdToUse),
			);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["thought", "new"] });
			await queryClient.invalidateQueries({ queryKey: ["thought", thoughtId] });
		},
	});
};

export const GoalDropdown = ({ thoughtId, onClose }: { thoughtId?: string; onClose: () => void }) => {
	const { data: thought, isLoading } = useThought(thoughtId);
	const [intent, setIntent] = useState(thought?.user_intent || "");
	const { mutate: confirmSetIntent } = useSetIntent(thoughtId);

	useEffect(() => {
		// This is here because for some reason using isLoading makes this thing load?
	}, [isLoading]);

	return (
		<div className="flex flex-col gap-2 p-4 w-80">
			<div className="flex flex-row justify-between items-center">
				<div className="flex items-center gap-1">
					<GoalIcon className="h-4 w-4 text-secondary" />
					<h5 className="text-sm font-medium text-secondary">Set a goal</h5>
				</div>
			</div>
			<TextareaAutosize
				placeholder="Setting a goal for your note will help Cloudy give better suggestions."
				className="w-full rounded bg-white/20 border-border border resize-none font-sans px-4 py-3 min-h-10 outline-none hover:outline-none focus:outline-none text-sm"
				value={intent}
				onChange={e => setIntent(e.target.value)}
			/>
			<div className="flex flex-row justify-end gap-2">
				<Button variant="outline" size="sm" onClick={onClose}>
					Cancel
				</Button>
				<Button
					size="sm"
					onClick={() => {
						confirmSetIntent(intent);
						onClose();
					}}>
					<SaveIcon className="size-4" />
					<span>Save</span>
				</Button>
			</div>
		</div>
	);
};
