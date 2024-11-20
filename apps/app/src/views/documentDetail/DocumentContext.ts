import { createContext, useContext } from "react";

export interface DocumentContextType {
	documentId: string;
	isEditMode: boolean;
	setIsEditMode: (isEditMode: boolean) => void;
}

export const DocumentContext = createContext<DocumentContextType>({
	documentId: "",
	isEditMode: false,
	setIsEditMode: () => {},
});

export const useDocumentContext = () => {
	return useContext(DocumentContext);
};
