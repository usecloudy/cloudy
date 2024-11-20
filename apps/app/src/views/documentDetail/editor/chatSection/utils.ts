import { Editor } from "@tiptap/react";
import { diffLines } from "diff";

import { processExactSearches } from "src/utils/tiptapSearchAndReplace";

export const ADDITION_MARKER = "-$$-";
export const REMOVAL_MARKER = "-##-";

const setMark = (
	markName: string,
	startPos: { from: number; to: number },
	endPos: { from: number; to: number },
	isCodeBlock: boolean,
	editor: Editor,
) => {
	let chain = editor.chain();

	chain.setTextSelection({ from: startPos.from, to: endPos.to }).setMark(markName);

	if (!isCodeBlock) {
		chain.setTextSelection(endPos).selectParentNode();
	} else {
		chain.setTextSelection({
			from: endPos.from - 2, // Offset for newlines
			to: endPos.to + 2,
		});
	}

	chain.deleteSelection();

	if (!isCodeBlock) {
		chain.setTextSelection(startPos).selectParentNode();
	} else {
		chain.setTextSelection({
			from: startPos.from - 2, // Offset for newlines
			to: startPos.to + 2,
		});
	}

	chain.deleteSelection();
	chain.run();
};

const convertMarkersToTiptapMarks = (marker: string, markName: string, editor: Editor) => {
	let results = processExactSearches(editor.state.doc, `${marker}`);

	let maxIterations = 20;
	let i = 0;

	while (results.length > 0 && i < maxIterations) {
		const startPos = results[0];
		const endPos = results[1];

		if (startPos && endPos) {
			const resolvedPos = editor.state.doc.resolve(startPos.from);

			const isCodeBlock = resolvedPos.parent.type.name === "codeBlock";

			setMark(markName, startPos, endPos, isCodeBlock, editor);
		}

		i++;

		// Get fresh positions after the edits
		results = processExactSearches(editor.state.doc, marker);
	}
};

export const showDiffInEditor = (originalMd: string, newMd: string, editor: Editor) => {
	// Ideally we'd do words here, but it'll be very expensive.
	const diff = diffLines(originalMd, newMd, {});

	let diffMd = "";

	// Wrap the parts in special markers
	diff.forEach(part => {
		if (part.added) {
			diffMd += `\n\n${ADDITION_MARKER}\n\n`;
			diffMd += part.value;
			diffMd += `\n\n${ADDITION_MARKER}\n\n`;
		} else if (part.removed) {
			diffMd += `\n\n${REMOVAL_MARKER}\n\n`;
			diffMd += part.value;
			diffMd += `\n\n${REMOVAL_MARKER}\n\n`;
		} else {
			diffMd += part.value;
		}
	});

	editor.commands.setContent(diffMd);

	convertMarkersToTiptapMarks(ADDITION_MARKER, "additionHighlight", editor);
	convertMarkersToTiptapMarks(REMOVAL_MARKER, "removalHighlight", editor);
};
