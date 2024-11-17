import { handleSupabaseError } from "@cloudy/utils/common";
import { useQuery } from "@tanstack/react-query";
import { EditorContent, JSONContent, useEditor } from "@tiptap/react";
import { useEffect } from "react";

import { thoughtQueryKeys } from "../../api/queryKeys";
import { supabase } from "../../clients/supabase";
import { MainLayout } from "../../components/MainLayout";
import { DocumentLoadingPlaceholder } from "../thoughtDetail/DocumentLoadingPlaceholder";
import { tiptapExtensions } from "../thoughtDetail/tiptap";
import { useDocumentContext } from "./DocumentContext";
import { useLatestPublishedDocumentVersion } from "./hooks";
import { NavBar } from "./navBar/NavBar";

export const PublishedDocumentView = () => {
	const { data, isLoading } = useLatestPublishedDocumentVersion();

	const editor = useEditor({
		editorProps: {
			attributes: { class: "main-editor" },
		},
		extensions: tiptapExtensions,
		content: "",
		editable: false,
	});

	useEffect(() => {
		if (data) {
			editor?.commands.setContent(data.content_json as JSONContent);
		}
	}, [data]);

	return (
		<div className="no-scrollbar relative box-border flex flex-grow flex-col items-center overflow-y-scroll">
			<nav className="sticky top-[-1px] z-30 -mr-2 w-full bg-background px-6 py-2 md:top-0 md:py-3">
				<NavBar editor={editor} />
			</nav>
			<div className="box-border flex w-full max-w-screen-lg grow flex-col px-3 md:px-20 md:pt-16 lg:flex-1">
				<h1 className="mb-4 text-2xl font-bold leading-8 outline-none md:text-3xl md:leading-10">{data?.title}</h1>
				<div
					// On larger screens, we need left padding to avoid some characters being cut off
					className="relative flex flex-row md:pl-[2px]">
					{isLoading ? (
						<div className="w-full pl-8">
							<DocumentLoadingPlaceholder />
						</div>
					) : (
						<EditorContent editor={editor} className="w-full" />
					)}
				</div>
				<div className="h-[75dvh]" />
			</div>
		</div>
	);
};
