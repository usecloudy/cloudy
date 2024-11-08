import { SuggestionProps } from "@tiptap/suggestion";
import { forwardRef, useImperativeHandle, useRef } from "react";

import { FileSearch, FileSearchRef } from "./FileSearch";

export const AiTextAreaMentionHandler = forwardRef(({ query, command }: SuggestionProps, ref: React.Ref<any>) => {
	const fileSearchRef = useRef<FileSearchRef>(null);

	useImperativeHandle(ref, () => ({
		onKeyDown: ({ event, hide }: { event: React.KeyboardEvent<HTMLDivElement>; hide: () => void }) => {
			if (event.key === "Escape") {
				hide();
				return true;
			}
			return fileSearchRef.current?.onKeyDown({ event, hide });
		},
	}));

	return (
		<div className="pointer-events-auto w-full rounded-md border border-border bg-background shadow-md md:w-[28rem]">
			<FileSearch
				ref={fileSearchRef}
				query={query}
				onSelect={file => {
					command({
						id: file.path,
						label: file.fileName,
						url: file.fileUrl,
					});
				}}
				shouldMention
			/>
		</div>
	);
});
