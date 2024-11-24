"use client";

import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";

import { cn } from "app/utils/cn";
import { useCodeThemeClass } from "app/utils/useCodeThemeClass";

interface DocumentViewProps {
	documentVersion: {
		id: string;
		title: string;
		content_json: string;
	};
}

const lowlight = createLowlight(common);

const extensions = [
	StarterKit,
	Link.configure({
		autolink: false,
		linkOnPaste: false,
		protocols: ["http", "https", "mailto"],
	}),
	CodeBlockLowlight.configure({
		lowlight,
	}),
];

export const DocumentView = ({ documentVersion }: DocumentViewProps) => {
	const codeThemeClass = useCodeThemeClass();

	const editor = useEditor({
		editorProps: {
			attributes: {
				class: "main-editor",
			},
		},
		extensions,
		content: documentVersion?.content_json,
		editable: false,
	});

	return (
		<div
			className={cn(
				"no-scrollbar relative flex h-dvh w-screen flex-col overflow-hidden px-0 md:w-full md:px-0 lg:px-0",
				codeThemeClass,
			)}>
			<div className="no-scrollbar relative box-border flex flex-grow flex-col items-center overflow-y-scroll">
				<div className="box-border flex w-full max-w-screen-lg grow flex-col px-6 md:px-16 md:pt-16">
					<h1 className="mb-8 text-3xl font-semibold">{documentVersion.title || "Untitled"}</h1>
					<div className="relative flex flex-row md:pl-[2px]">
						<EditorContent editor={editor} className="w-full" />
					</div>
					<div className="h-[75dvh]" />
				</div>
			</div>
		</div>
	);
};
