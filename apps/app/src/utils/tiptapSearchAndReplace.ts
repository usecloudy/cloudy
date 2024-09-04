// MIT License
// Copyright (c) 2023 - 2024 Jeet Mandaliya (Github Username: sereneinserenade)
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
import { Range } from "@tiptap/core";
import { Node as PMNode } from "@tiptap/pm/model";

interface TextNodesWithPosition {
	text: string;
	pos: number;
}

type RangeWithPos = Range & {
	pos: number;
};

export function processSearches(doc: PMNode, searchTerm: RegExp) {
	const results: RangeWithPos[] = [];

	let textNodesWithPosition: TextNodesWithPosition[] = [];
	let index = 0;

	if (!searchTerm) {
		return [];
	}

	doc?.descendants((node, pos) => {
		if (node.isText) {
			if (textNodesWithPosition[index]) {
				textNodesWithPosition[index] = {
					text: textNodesWithPosition[index].text + node.text,
					pos: textNodesWithPosition[index].pos,
				};
			} else {
				textNodesWithPosition[index] = {
					text: `${node.text}`,
					pos,
				};
			}
		} else {
			index += 1;
		}
	});

	textNodesWithPosition = textNodesWithPosition.filter(Boolean);

	for (const element of textNodesWithPosition) {
		const { text, pos } = element;
		const matches = Array.from(text.matchAll(searchTerm)).filter(([matchText]) => matchText.trim());

		for (const m of matches) {
			if (m[0] === "") break;

			if (m.index !== undefined) {
				results.push({
					pos,
					from: pos + m.index,
					to: pos + m.index + m[0].length,
				});
			}
		}
	}

	return results;
}
