import { ExtendedRegExpMatchArray, JSONContent, PasteRule, PasteRuleFinder, callOrReturn } from "@tiptap/core";
import { NodeType } from "@tiptap/pm/model";

import { processExactSearches, } from "./tiptapSearchAndReplace";

export const backtickInputRegex = /```([a-z]+)?\s*([\s\S]*?)```/;

/**
 * Build an paste rule that adds a node when the
 * matched text is pasted into it.
 * @see https://tiptap.dev/docs/editor/extensions/custom-extensions/extend-existing#paste-rules
 */
export function createCodeBlockPasteRule(config: {
	find: PasteRuleFinder;
	type: NodeType;
	getAttributes?:
		| Record<string, any>
		| ((match: ExtendedRegExpMatchArray, event: ClipboardEvent) => Record<string, any>)
		| false
		| null;
	getContent?: JSONContent[] | ((attrs: Record<string, any>) => JSONContent[]) | false | null;
}) {
	return new PasteRule({
		find: config.find,
		handler({ match, chain, range, pasteEvent, state }) {
			const rawText = pasteEvent?.clipboardData?.getData("text/plain");
			const matches = Array.from(rawText?.matchAll(new RegExp(backtickInputRegex, "g")) || []);

			if (!matches.length) {
				return null;
			}

			const matchOnTheOriginal = match.input!.match(backtickInputRegex);
			if (!matchOnTheOriginal?.[0]) {
				return null;
			}

			const result = processExactSearches(state.doc, matchOnTheOriginal[0]);
			if (!result[0]) {
				return null;
			}

			// Process each code block match
			let currentPos = result[0].from;
			for (const rawMatch of matches) {
				const attrs = {
					language: rawMatch[1],
				};

				const node = { type: config.type.name, attrs } as JSONContent;

				if (rawMatch[2]) {
					node.content = [
						{
							type: "text",
							text: rawMatch[2],
						},
					];
				}

				chain()
					.deleteRange({ from: currentPos, to: currentPos + rawMatch[0].length })
					.insertContentAt(currentPos, node);

				currentPos += rawMatch[0].length;
			}
		},
	});
}
