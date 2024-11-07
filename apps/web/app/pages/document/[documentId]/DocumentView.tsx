"use client";

import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import "highlight.js/styles/atom-one-light.css";
import { common, createLowlight } from "lowlight";

interface DocumentViewProps {
	document: {
		id: string;
		title: string;
		content: string;
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

export const DocumentView = ({ document }: DocumentViewProps) => {
	const editor = useEditor({
		extensions,
		content: document?.content,
		editable: false,
	});

	return (
		<div className="no-scrollbar relative flex h-dvh w-screen flex-col overflow-hidden px-0 md:w-full md:px-0 lg:px-0">
			<div className="no-scrollbar relative box-border flex flex-grow flex-col items-center overflow-y-scroll">
				<div className="box-border flex w-full max-w-screen-lg grow flex-col px-3 md:px-16 md:pt-16">
					<h1 className="mb-8 text-3xl font-semibold">{document.title || "Untitled"}</h1>
					<div className="relative flex flex-row md:pl-[2px]">
						<EditorContent editor={editor} className="main-editor w-full" />
					</div>
					<div className="h-[75dvh]" />
				</div>
			</div>
		</div>
	);
};
