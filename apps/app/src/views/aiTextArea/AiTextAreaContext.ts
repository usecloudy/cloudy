import { RepoReference } from "@cloudy/utils/common";
import { createContext, useContext } from "react";

export interface RepoReferenceWithMention extends RepoReference {
	mentioned?: boolean;
}

export const AiTextAreaContext = createContext<{
	existingLinkedFiles: { path: string; repoFullName: string; fileUrl: string }[];
	fileReferences: RepoReferenceWithMention[];
	setFileReferences: (files: RepoReferenceWithMention[]) => void;
}>({
	existingLinkedFiles: [],
	fileReferences: [],
	setFileReferences: () => {},
});

export const useAiTextAreaContext = () => {
	return useContext(AiTextAreaContext);
};
