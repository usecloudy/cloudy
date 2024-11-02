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

export const fuzzyMatch = (text: string, pattern: string, threshold: number = 0.9) => {
	if (pattern.length <= 6) {
		// For very short search terms, use exact matching
		return text.toLowerCase().includes(pattern.toLowerCase());
	}

	const words = pattern.toLowerCase().split(/\s+/);
	const textLower = text.toLowerCase();
	let matchCount = 0;
	let lastIndex = -1;

	for (const word of words) {
		const index = textLower.indexOf(word, lastIndex + 1);
		if (index > -1) {
			matchCount++;
			lastIndex = index;
		}
	}

	const matchRatio = matchCount / words.length;
	return matchRatio >= threshold;
};

export const processSearches = (doc: PMNode, searchTerm: string, threshold: number = 0.9) => {
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
		const chunkSize = Math.max(searchTerm.length, 100); // Adjust chunk size based on search term length

		if (searchTerm.length <= 6) {
			// For very short search terms, search the entire text without chunking
			const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			const matches = Array.from(text.matchAll(new RegExp(escapedSearchTerm, "gi")));
			for (const match of matches) {
				results.push({
					pos,
					from: pos + match.index!,
					to: pos + match.index! + searchTerm.length,
				});
			}
		} else {
			// For longer search terms, use the chunking approach
			for (let i = 0; i < text.length; i += Math.floor(chunkSize / 2)) {
				const chunk = text.slice(i, i + chunkSize);
				if (fuzzyMatch(chunk, searchTerm, threshold)) {
					results.push({
						pos,
						from: pos + i,
						to: pos + i + chunk.length,
					});
				}
			}
		}
	}

	return results;
};

export const processExactSearches = (doc: PMNode, searchTerm: string) => {
	const results: { pos: number; from: number; to: number }[] = [];
	let textNodesWithPosition: { text: string; pos: number }[] = [];

	let index = 0;

	doc.descendants((node, pos) => {
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
		const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const matches = Array.from(text.matchAll(new RegExp(escapedSearchTerm, "g")));

		for (const match of matches) {
			results.push({
				pos,
				from: pos + match.index!,
				to: pos + match.index! + searchTerm.length,
			});
		}
	}

	return results;
};
