import { EditorContent, JSONContent, useEditor } from "@tiptap/react";
import { PenIcon } from "lucide-react";
import { useEffect } from "react";

import { Button } from "../../components/Button";
import { useDocumentContext } from "./DocumentContext";
import { useLatestDocumentVersionContext } from "./LatestDocumentVersionContext";
import { tiptapExtensions } from "./editor/tiptap";
import { NavBar } from "./navBar/NavBar";

export const PublishedDocumentView = () => {
	const { setIsEditMode } = useDocumentContext();
	const { latestDocumentVersion } = useLatestDocumentVersionContext();

	const editor = useEditor({
		editorProps: {
			attributes: { class: "main-editor" },
		},
		extensions: tiptapExtensions,
		content: "",
		editable: false,
	});

	useEffect(() => {
		if (latestDocumentVersion) {
			editor?.commands.setContent(
				latestDocumentVersion.content_json
					? (latestDocumentVersion.content_json as JSONContent)
					: latestDocumentVersion.content_html || latestDocumentVersion.content_md,
			);
		}
	}, [latestDocumentVersion, editor]);

	return (
		<div className="no-scrollbar relative box-border flex flex-grow flex-col items-center overflow-y-scroll">
			<nav className="sticky top-[-1px] z-30 -mr-2 w-full bg-background px-6 py-2 md:top-0 md:py-3">
				<NavBar editor={editor} />
			</nav>
			<div className="box-border flex w-full max-w-screen-lg grow flex-col px-6 md:px-20 md:pt-16 lg:flex-1">
				<h1 className="mb-4 text-2xl font-bold leading-8 outline-none md:text-3xl md:leading-10">
					{latestDocumentVersion?.title}
				</h1>
				<div
					// On larger screens, we need left padding to avoid some characters being cut off
					className="relative flex flex-row md:pl-[2px]">
					{latestDocumentVersion ? (
						<EditorContent editor={editor} className="w-full" />
					) : (
						<div className="flex w-full flex-col items-center justify-center">
							<div className="flex flex-col items-center justify-center rounded border border-dashed border-border p-4 text-center text-tertiary">
								<span>
									This document hasn't been published yet, open the editor to publish the first version.
								</span>
								<Button className="mt-4" onClick={() => setIsEditMode(true)}>
									<PenIcon className="size-4" />
									<span>Open Editor</span>
								</Button>
							</div>
						</div>
					)}
				</div>
				<div className="h-[75dvh]" />
			</div>
		</div>
	);
};
