import { handleSupabaseError } from "@cloudy/utils/common";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, SparklesIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiClient } from "src/api/client";
import { supabase } from "src/clients/supabase";
import { AiTextArea } from "src/components/AiTextArea";
import { Button } from "src/components/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "src/components/Dialog";
import { useWorkspace } from "src/stores/workspace";
import { useBreakpoint } from "src/utils/tailwind";
import { makeThoughtUrl } from "src/utils/thought";

const useCreateNoteWithGeneration = () => {
	const workspace = useWorkspace();
	return useMutation({
		mutationFn: async (prompt: string) => {
			return handleSupabaseError(
				await supabase
					.from("thoughts")
					.insert({
						generation_prompt: prompt,
						workspace_id: workspace.id,
					})
					.select()
					.single(),
			);
		},
	});
};

export const GenerateDoc = () => {
	const [isOpen, setIsOpen] = useState(false);
	const isMdBreakpoint = useBreakpoint("md");
	const createNoteWithGeneration = useCreateNoteWithGeneration();
	const navigate = useNavigate();
	const workspace = useWorkspace();

	const handleSubmit = async (prompt: string) => {
		const thought = await createNoteWithGeneration.mutateAsync(prompt);
		setIsOpen(false);
		navigate(makeThoughtUrl(workspace.slug, thought.id));
	};

	return (
		<>
			<Button onClick={() => setIsOpen(true)} size="icon" className="shrink-0 text-accent" variant="outline">
				<SparklesIcon className="size-4" />
			</Button>
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="max-w-[calc(100vw-2rem)] overflow-hidden p-0 md:max-w-lg">
					<div className="flex w-full items-center justify-between gap-2 border-b border-border px-4 py-2 font-medium">
						<div className="flex items-center gap-1 text-sm">
							<SparklesIcon className="size-4 text-accent" />
							<span>Generate Document</span>
						</div>
					</div>
					<AiTextArea
						onSubmit={handleSubmit}
						onCancel={() => setIsOpen(false)}
						placeholder="Describe the document you want to generate"
						submitButtonText="Generate"
					/>
				</DialogContent>
			</Dialog>
		</>
	);
};
