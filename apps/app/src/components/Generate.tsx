import { useMutation } from "@tanstack/react-query";
import { SparklesIcon } from "lucide-react";
import { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

import { supabase } from "src/clients/supabase";

import { Button } from "./Button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./Dialog";

const useGenerateDocument = () => {
	return useMutation({
		mutationFn: async (prompt: string) => {
			const { data, error } = await supabase.functions.invoke("document-gen", {
				body: {
					prompt,
				},
			});

			if (error) {
				throw error;
			}

			return data;
		},
		// throwOnError: true,
	});
};

export const Generate = () => {
	const [open, setOpen] = useState(false);
	const [prompt, setPrompt] = useState("");

	const { mutateAsync: generateDocument } = useGenerateDocument();

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger>
				<Button>
					<SparklesIcon className="w-4 h-4" />
					<span>Generate</span>
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Generate a new document</DialogTitle>
					<p className="text-sm text-secondary">Give instructions of what to generate</p>
				</DialogHeader>
				<TextareaAutosize
					placeholder="Enter a prompt"
					className="w-full rounded bg-white/20 border-border border resize-none text-base font-sans px-4 py-3 min-h-24 outline-none hover:outline-none focus:outline-none"
					value={prompt}
					onChange={e => setPrompt(e.target.value)}
				/>
				<DialogFooter>
					<Button
						onClick={() => {
							generateDocument(prompt);
							setOpen(false);
						}}>
						<SparklesIcon className="w-4 h-4" />
						<span>Generate</span>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
