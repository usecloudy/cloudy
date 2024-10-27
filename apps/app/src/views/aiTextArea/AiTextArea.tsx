import { Hotkey } from "@cloudy/ui";
import { RepoReference } from "@cloudy/utils/common";
import { SiGithub } from "@icons-pack/react-simple-icons";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import Text from "@tiptap/extension-text";
import { EditorContent, useEditor } from "@tiptap/react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "src/components/Button";
import { useWorkspace } from "src/stores/workspace";
import { makeNewProjectUrl, makeProjectSettingsUrl, useProjectRepos } from "src/utils/projects";

import { useProject } from "../projects/ProjectContext";
import { FileReferenceRow } from "./FileReferenceRow";

interface AiTextAreaProps {
	onSubmit: (text: string, references: RepoReference[]) => void;
	onCancel: () => void;
	placeholder?: string;
	submitButtonText?: string;
	showEditButton?: boolean;
	onEdit?: () => void;
}

const useHasGitRepoConnected = () => {
	const project = useProject();
	const { data: projectRepos } = useProjectRepos(project?.id);

	return Boolean(project && projectRepos && projectRepos.length > 0);
};

export const AiTextArea = ({
	onSubmit,
	onCancel,
	placeholder = "Ask a question or describe what you want to do",
	submitButtonText = "Submit",
	onEdit,
}: AiTextAreaProps) => {
	const workspace = useWorkspace();
	const project = useProject();

	const hasGitRepoConnected = useHasGitRepoConnected();

	const [fileReferences, setFileReferences] = useState<RepoReference[]>([]);

	const editor = useEditor({
		extensions: [
			Document,
			Text,
			Paragraph,
			Placeholder.configure({
				placeholder: placeholder,
			}),
		],
		content: "",
		editable: true,
		autofocus: true,
		editorProps: {
			attributes: {
				class: "no-scrollbar w-full resize-none appearance-none border-none bg-transparent text-sm outline-none",
			},
		},
	});

	useEffect(() => {
		if (editor) {
			editor.commands.focus();
		}
	}, [editor]);

	const handleSubmit = useCallback(() => {
		if (editor) {
			onSubmit(editor.getText(), fileReferences);
		}
	}, [editor, onSubmit, fileReferences]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				handleSubmit();
			} else if (e.key === "Escape") {
				onCancel();
			}
		},
		[handleSubmit, onCancel],
	);

	return (
		<div className="relative flex w-full flex-col gap-4">
			<EditorContent editor={editor} onKeyDown={handleKeyDown} />
			<div className="flex flex-row items-start justify-between gap-1">
				{hasGitRepoConnected ? (
					<FileReferenceRow fileReferences={fileReferences} setFileReferences={setFileReferences} />
				) : project ? (
					<Link to={makeProjectSettingsUrl(workspace.slug, project.slug)}>
						<Button size="xs" variant="outline">
							<SiGithub className="size-3" />
							<span>Connect a git repo to reference files</span>
						</Button>
					</Link>
				) : (
					<Link to={makeNewProjectUrl(workspace.slug)}>
						<Button size="xs" variant="outline">
							<SiGithub className="size-3" />
							<span>Create a project with a git repo to reference files</span>
						</Button>
					</Link>
				)}
				<Button size="sm" variant="default" onClick={handleSubmit}>
					<Hotkey keys={["Enter"]} />
					<span>{submitButtonText}</span>
				</Button>
			</div>
		</div>
	);
};
