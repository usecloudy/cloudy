import { Hotkey } from "@cloudy/ui";
import { RepoReference } from "@cloudy/utils/common";
import { SiGithub } from "@icons-pack/react-simple-icons";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import Text from "@tiptap/extension-text";
import { EditorContent, Extension, useEditor } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "src/components/Button";
import { useWorkspace } from "src/stores/workspace";
import { makeNewProjectUrl, makeProjectSettingsUrl, useProjectRepos } from "src/utils/projects";

import { useProject } from "../projects/ProjectContext";
import { FileReferenceRow } from "./FileReferenceRow";

interface AiTextAreaProps {
	onSubmit: (text: string, references: RepoReference[]) => void;
	onSecondaryAction?: (text: string, references: RepoReference[]) => void;
	onCancel: () => void;
	placeholder?: string;
	secondaryButtonText?: string;
	submitButtonText?: string;
	showEditButton?: boolean;
	onEdit?: () => void;
	existingLinkedFiles?: { path: string }[];
	disableNewFileReference?: boolean;
}

const useHasGitRepoConnected = () => {
	const project = useProject();
	const { data: projectRepos } = useProjectRepos(project?.id);

	return Boolean(project && projectRepos && projectRepos.length > 0);
};

export const AiTextArea = ({
	onSubmit,
	onSecondaryAction,
	onCancel,
	placeholder = "Ask a question or describe what you want to do",
	submitButtonText = "Submit",
	onEdit,
	existingLinkedFiles,
	disableNewFileReference,
	secondaryButtonText,
}: AiTextAreaProps) => {
	const workspace = useWorkspace();
	const project = useProject();

	const hasGitRepoConnected = useHasGitRepoConnected();

	const [fileReferences, setFileReferences] = useState<RepoReference[]>([]);

	const handleSubmitRef = useRef<((isSecondaryAction?: boolean) => void) | null>(null);

	const editor = useEditor({
		extensions: [
			Document,
			Text,
			Paragraph,
			Placeholder.configure({
				placeholder: placeholder,
			}),
			Extension.create({
				name: "hotkeys",
				addKeyboardShortcuts() {
					return {
						Enter: () => {
							handleSubmitRef.current?.();
							return true;
						},
						"Mod-Enter": () => {
							handleSubmitRef.current?.(true);
							return true;
						},
						"Shift-Enter": ({ editor }) =>
							editor.commands.first(({ commands }) => [
								() => commands.newlineInCode(),
								() => commands.createParagraphNear(),
								() => commands.liftEmptyBlock(),
								() => commands.splitBlock(),
							]),
						Escape: () => {
							onCancel();
							return true;
						},
					};
				},
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

	const hasContent = (editor?.getText().trim().length ?? 0) > 0;

	const handleSubmit = useCallback(
		(isSecondaryAction = false) => {
			console.log("handleSubmit", isSecondaryAction);
			if (editor && editor?.getText().trim()) {
				if (isSecondaryAction) {
					onSecondaryAction?.(editor.getText(), fileReferences);
				} else {
					onSubmit(editor.getText(), fileReferences);
				}
				editor.commands.clearContent();
			}
		},
		[editor, onSubmit, fileReferences, hasContent],
	);

	handleSubmitRef.current = handleSubmit;

	return (
		<div className="relative flex w-full flex-col gap-4">
			<EditorContent editor={editor} />
			<div className="flex flex-row items-start justify-between gap-2">
				{hasGitRepoConnected ? (
					<FileReferenceRow
						fileReferences={fileReferences}
						setFileReferences={setFileReferences}
						existingLinkedFiles={existingLinkedFiles}
						disableAdd={disableNewFileReference}
					/>
				) : project ? (
					<Link to={makeProjectSettingsUrl(workspace.slug, project.slug)}>
						<Button size="xs" variant="outline">
							<SiGithub className="size-3" />
							<span>Connect a git repo to reference files</span>
						</Button>
					</Link>
				) : (
					<div className="flex-1 overflow-hidden">
						<Link to={makeNewProjectUrl(workspace.slug)} className="block">
							<Button size="xs" variant="outline" className="mt-0.5 w-full">
								<SiGithub className="size-3 shrink-0" />
								<span className="truncate">Create a project with a git repo to reference files</span>
							</Button>
						</Link>
					</div>
				)}
				<div className="flex shrink-0 flex-row gap-1">
					{onSecondaryAction && (
						<Button
							size="sm"
							variant="ghost"
							className="text-accent"
							onClick={() => handleSubmit(true)}
							disabled={!hasContent}>
							<Hotkey keys={["cmd", "Enter"]} />
							<span>{secondaryButtonText}</span>
						</Button>
					)}
					<Button size="sm" variant="default" onClick={() => handleSubmit()} disabled={!hasContent}>
						<Hotkey keys={["Enter"]} />
						<span>{submitButtonText}</span>
					</Button>
				</div>
			</div>
		</div>
	);
};
