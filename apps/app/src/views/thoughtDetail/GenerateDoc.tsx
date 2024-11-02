import { ChatRole, RepoReference, handleSupabaseError } from "@cloudy/utils/common";
import { useMutation } from "@tanstack/react-query";
import { SparklesIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { Dialog, DialogContent } from "src/components/Dialog";
import { useUser } from "src/stores/user";
import { useWorkspace } from "src/stores/workspace";
import { makeProjectDocUrl } from "src/utils/thought";
import { AiTextArea } from "src/views/aiTextArea/AiTextArea";

import { useProject } from "../projects/ProjectContext";

const useCreateNoteWithGeneration = () => {
	const workspace = useWorkspace();
	const project = useProject();
	const user = useUser();

	return useMutation({
		mutationFn: async (payload: { prompt: string; references: RepoReference[] }) => {
			if (!project) {
				throw new Error("Project not loaded");
			}

			const doc = handleSupabaseError(
				await supabase
					.from("thoughts")
					.insert({
						generation_prompt: payload.prompt,
						workspace_id: workspace.id,
						project_id: project.id,
						author_id: user.id,
					})
					.select()
					.single(),
			);

			handleSupabaseError(
				await supabase.from("document_repo_links").insert(
					payload.references.map(ref => ({
						doc_id: doc.id,
						path: ref.path,
						repo_connection_id: ref.repoConnectionId,
						type: ref.type,
					})),
				),
			);

			const thread = handleSupabaseError(
				await supabase
					.from("chat_threads")
					.insert({
						document_id: doc.id,
						workspace_id: workspace.id,
						is_default: true,
					})
					.select("id")
					.single(),
			);

			handleSupabaseError(
				await supabase.from("chat_messages").insert([
					{
						thread_id: thread.id,
						role: ChatRole.User,
						user_id: user.id,
						content: payload.prompt,
					},
					{
						thread_id: thread.id,
						role: ChatRole.Assistant,
						content: "I've created your document. You can edit it now.",
						completed_at: new Date().toISOString(),
					},
				]),
			);

			return doc;
		},
	});
};

export const GenerateDoc = () => {
	const [isOpen, setIsOpen] = useState(false);
	const createNoteWithGeneration = useCreateNoteWithGeneration();
	const navigate = useNavigate();
	const location = useLocation();
	const workspace = useWorkspace();
	const project = useProject();

	// Add effect to close dialog on location change
	useEffect(() => {
		setIsOpen(false);
	}, [location]);

	const handleSubmit = async (prompt: string, references: RepoReference[]) => {
		if (!project) {
			throw new Error("Project not loaded");
		}

		const thought = await createNoteWithGeneration.mutateAsync({
			prompt,
			references,
		});
		setIsOpen(false);
		navigate(makeProjectDocUrl(workspace.slug, project.slug, thought.id));
	};

	return (
		<>
			<Button onClick={() => setIsOpen(true)} size="icon" className="shrink-0 text-accent" variant="outline">
				<SparklesIcon className="size-4" />
			</Button>
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0 md:max-w-lg">
					<div className="flex w-full items-center justify-between gap-2 border-b border-border px-4 py-2 font-medium">
						<div className="flex items-center gap-1 text-sm">
							<SparklesIcon className="size-4 text-accent" />
							<span>Generate Document</span>
						</div>
					</div>
					<div className="p-4">
						<AiTextArea
							onSubmit={handleSubmit}
							onCancel={() => setIsOpen(false)}
							placeholder="Describe the document you want to generate"
							submitButtonText="Generate"
						/>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};
