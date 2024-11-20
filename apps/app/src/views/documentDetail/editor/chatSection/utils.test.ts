import { Editor } from "@tiptap/react";

import { ADDITION_MARKER, REMOVAL_MARKER, showDiffInEditor } from "./utils";

jest.mock("./utils", () => {
	const actual = jest.requireActual("./utils");
	return {
		...actual,
		setMark: jest.fn(),
	};
});

const mockEditor = {
	state: {
		doc: {
			resolve: jest.fn().mockReturnValue({
				parent: { type: { name: "paragraph" } },
			}),
		},
	},
	commands: {
		setContent: jest.fn().mockReturnValue(true),
	} as unknown as Editor["commands"],
};

jest.mock("@tiptap/react", () => ({
	Editor: jest.fn().mockImplementation(() => mockEditor),
}));

jest.mock("src/utils/tiptapSearchAndReplace", () => ({
	processExactSearches: jest.fn().mockImplementation(() => []),
}));

describe("showDiffInEditor", () => {
	let editor: Editor;

	beforeEach(() => {
		jest.clearAllMocks();
		editor = new Editor();
	});

	it("should set content with diff markers", () => {
		const originalMd = "Hello world";
		const newMd = "Hello new world";

		showDiffInEditor(originalMd, newMd, editor);

		expect(editor.commands.setContent).toHaveBeenCalledTimes(1);
		const content = (editor.commands.setContent as jest.Mock).mock.calls[0][0];
		expect(content).toContain(ADDITION_MARKER);
		expect(content).toContain(REMOVAL_MARKER);
		expect(content).toEqual(
			`\n\n${REMOVAL_MARKER}\n\n${originalMd}\n\n${REMOVAL_MARKER}\n\n\n\n${ADDITION_MARKER}\n\n${newMd}\n\n${ADDITION_MARKER}\n\n`,
		);
	});

	it("should set content with diff markers in codeblocks", () => {
		const originalMd = "```\nHello world\n```";
		const newMd = "```python\nHello new world\n```";

		showDiffInEditor(originalMd, newMd, editor);

		expect(editor.commands.setContent).toHaveBeenCalledTimes(1);
		const content = (editor.commands.setContent as jest.Mock).mock.calls[0][0];
		expect(content).toContain(ADDITION_MARKER);
		expect(content).toContain(REMOVAL_MARKER);
		expect(content).toEqual(
			`

${REMOVAL_MARKER}

\`\`\`
Hello world


${REMOVAL_MARKER}



${ADDITION_MARKER}

\`\`\`python
Hello new world


${ADDITION_MARKER}

\`\`\``,
		);
	});
	// TODO: More extensive tests
});
