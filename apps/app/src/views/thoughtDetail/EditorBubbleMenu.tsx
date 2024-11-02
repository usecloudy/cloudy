import { Hotkey } from "@cloudy/ui";
import { BubbleMenu } from "@tiptap/react";
import {
	BoldIcon,
	CodeIcon,
	ItalicIcon,
	Link2OffIcon,
	ListIcon,
	ListOrderedIcon,
	SparklesIcon,
	StrikethroughIcon,
	TextQuoteIcon,
	UnderlineIcon,
} from "lucide-react";
import { useContext, useRef } from "react";

import { Button } from "src/components/Button";
import { useBreakpoint } from "src/utils/tailwind";

import { AiSelectionMenu } from "./AiSelectionMenu";
import { ThoughtContext } from "./thoughtContext";

export const EditorBubbleMenu = () => {
	const { editor, isShowingAiSelectionMenu, hideAiSelectionMenu, showAiSelectionMenu } = useContext(ThoughtContext);

	const isMdBreakpoint = useBreakpoint("md");

	const bubbleMenuRef = useRef<HTMLDivElement>(null);

	if (!editor) return null;

	return (
		<div>
			<BubbleMenu editor={editor} tippyOptions={{ duration: 100, maxWidth: "1024px" }}>
				<div
					ref={bubbleMenuRef}
					className="flex max-w-[100vw] flex-row flex-wrap items-center gap-0.5 rounded-md border border-border bg-background px-2 py-2">
					<div className="pr-2">
						<Button variant="secondary" size="sm" className="text-accent" onClick={showAiSelectionMenu}>
							{isMdBreakpoint && <Hotkey keys={["Command", "K"]} />}
							<span>Ask Cloudy</span>
							<SparklesIcon className="h-3.5 w-3.5" />
						</Button>
					</div>
					<Button
						onClick={() => editor.chain().focus().toggleBold().run()}
						className={editor.isActive("bold") ? "bg-accent/20 text-accent" : ""}
						variant="ghost"
						size="icon-sm">
						<BoldIcon className="h-4 w-4" />
					</Button>
					<Button
						onClick={() => editor.chain().focus().toggleItalic().run()}
						variant="ghost"
						size="icon-sm"
						className={editor.isActive("italic") ? "bg-accent/20 text-accent" : ""}>
						<ItalicIcon className="h-4 w-4" />
					</Button>
					<Button
						onClick={() => editor.chain().focus().toggleUnderline().run()}
						variant="ghost"
						size="icon-sm"
						className={editor.isActive("underline") ? "bg-accent/20 text-accent" : ""}>
						<UnderlineIcon className="h-4 w-4" />
					</Button>
					<Button
						onClick={() => editor.chain().focus().toggleStrike().run()}
						variant="ghost"
						size="icon-sm"
						className={editor.isActive("strike") ? "bg-accent/20 text-accent" : ""}>
						<StrikethroughIcon className="h-4 w-4" />
					</Button>
					<Button
						onClick={() => editor.chain().focus().toggleCode().run()}
						variant="ghost"
						size="icon-sm"
						className={editor.isActive("code") ? "bg-accent/20 text-accent" : ""}>
						<CodeIcon className="h-4 w-4" />
					</Button>
					<Button
						onClick={() => editor.chain().focus().toggleBulletList().run()}
						variant="ghost"
						size="icon-sm"
						className={editor.isActive("bulletList") ? "bg-accent/20 text-accent" : ""}>
						<ListIcon className="h-4 w-4" />
					</Button>
					<Button
						onClick={() => editor.chain().focus().toggleOrderedList().run()}
						variant="ghost"
						size="icon-sm"
						className={editor.isActive("orderedList") ? "bg-accent/20 text-accent" : ""}>
						<ListOrderedIcon className="h-4 w-4" />
					</Button>
					<Button
						onClick={() => editor.chain().focus().toggleBlockquote().run()}
						variant="ghost"
						size="icon-sm"
						className={editor.isActive("blockquote") ? "bg-accent/20 text-accent" : ""}>
						<TextQuoteIcon className="h-4 w-4" />
					</Button>
					{editor.isActive("link") && (
						<Button onClick={() => editor.chain().focus().unsetLink().run()} variant="ghost" size="icon-sm">
							<Link2OffIcon className="h-4 w-4" />
						</Button>
					)}
				</div>
			</BubbleMenu>
			{isShowingAiSelectionMenu && <AiSelectionMenu onCancel={hideAiSelectionMenu} onClose={hideAiSelectionMenu} />}
		</div>
	);
};
