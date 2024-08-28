import { BubbleMenu, EditorProvider, FloatingMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useRef } from "react";
import { useDebouncedCallback } from "use-debounce";

const extensions = [StarterKit];

export interface EditableContentPayload {
	html: string;
	text: string;
}

export const EditableContent = ({
	content,
	onChangeText,
	onBlur,
	onSave,
	debounceDurationMs = 1000,
}: {
	content: string;
	onChangeText?: (contents: EditableContentPayload) => void;
	onBlur?: (contents: EditableContentPayload) => void;
	onSave?: (contents: EditableContentPayload) => void;
	debounceDurationMs?: number;
}) => {
	const latestHtml = useRef(content);
	const latestText = useRef(content);

	const updateKey = useRef(0);
	const savedKey = useRef(0);

	const handleSave = (saveKey: number) => {
		if (saveKey === updateKey.current && savedKey.current !== saveKey) {
			onSave?.({
				html: latestHtml.current,
				text: latestText.current,
			});
			savedKey.current = saveKey;
		}
	};

	const handleOnBlur = () => {
		handleSave(updateKey.current);
		onBlur?.({
			html: latestHtml.current,
			text: latestText.current,
		});
	};

	const debouncedSave = useDebouncedCallback(handleSave, debounceDurationMs);

	return (
		<EditorProvider
			extensions={extensions}
			content={content}
			editorProps={{
				attributes: {
					class: "outline-none",
				},
			}}
			onUpdate={({ editor }) => {
				const html = editor.getHTML();
				const text = editor.getText();

				updateKey.current += 1;
				latestHtml.current = html;
				latestText.current = text;

				debouncedSave(updateKey.current);

				onChangeText?.({
					html: latestHtml.current,
					text: latestText.current,
				});
			}}
			onBlur={handleOnBlur}>
			<BubbleMenu editor={null}>This is the bubble menu</BubbleMenu>
		</EditorProvider>
	);
};
