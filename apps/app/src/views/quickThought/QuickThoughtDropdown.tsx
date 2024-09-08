import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { LightbulbIcon, SendHorizonalIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "src/components/Button";
import { Dialog, DialogContent, DialogTrigger } from "src/components/Dialog";
import { Dropdown } from "src/components/Dropdown";
import { useSave } from "src/utils/useSave";

import { CollectionCarousel } from "../thoughtDetail/CollectionCarousel";
import { ThoughtEditPayload, useEditThought, useThought } from "../thoughtDetail/hooks";
import { tiptapExtensions } from "../thoughtDetail/tiptap";

export const QuickThoughtDropdown = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [thoughtId, setThoughtId] = useState<string | null>(null);
	const { mutateAsync: editThought } = useEditThought(thoughtId ?? undefined);
	const { data: thought } = useThought(thoughtId ?? undefined);

	const { onChange } = useSave(
		async (payload: ThoughtEditPayload) => {
			const newThought = await editThought(payload);
			if (newThought) {
				setThoughtId(newThought.id);
			}
		},
		{ debounceDurationMs: thoughtId ? 500 : 0 },
	);

	const editor = useEditor({
		extensions: tiptapExtensions,
		content: "",
		onUpdate: payload => {
			onChange({
				content: payload.editor.getHTML(),
				contentMd: payload.editor.storage.markdown.getMarkdown(),
				ts: new Date(),
			});
		},
	});

	const handleSubmit = async () => {};

	return (
		<Dialog
			onOpenChange={open => {
				if (!open) {
					setThoughtId(null);
					editor?.commands.setContent("");
				}
			}}>
			<DialogTrigger>
				<Button variant="ghost">
					<LightbulbIcon className="size-5" />
					<span>Quick note</span>
				</Button>
			</DialogTrigger>
			<DialogContent size="lg">
				<div className="w-full gap-2 flex flex-col">
					<h3 className="font-semibold">Capture a quick note</h3>
					<EditorContent
						editor={editor}
						className="min-h-36 bg-white/10 border-border border rounded w-full text-sm outline-none no-scrollbar p-2"
					/>
					<CollectionCarousel thoughtId={thoughtId ?? undefined} collections={thought?.collections ?? []} />
				</div>
			</DialogContent>
		</Dialog>
	);
};
