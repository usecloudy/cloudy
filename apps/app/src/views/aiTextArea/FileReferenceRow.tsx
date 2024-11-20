import { RepoReference } from "@cloudy/utils/common";
import { PlusIcon, SearchIcon } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "src/components/Button";
import { Dropdown } from "src/components/Dropdown";
import { Input } from "src/components/Input";

import { useConnectFileToDocument, useDisconnectFileFromDocument } from "../documentDetail/editor/linking";
import { AiTextAreaContext, useAiTextAreaContext } from "./AiTextAreaContext";
import { FileReferencePill } from "./FileReferencePill";
import { FileSearch, FileSearchRef } from "./FileSearch";
import { FILE_REFERENCE_LIMIT } from "./constants";

interface FileReferenceRowProps {
	disableAdd?: boolean;
	addButtonText?: string;
	showConnectTooltip?: boolean;
	showUnlinkIconInsteadOfX?: boolean;
}

interface FileReferenceRowStandaloneProps extends FileReferenceRowProps {
	fileReferences: RepoReference[];
	setFileReferences: (fileReferences: RepoReference[]) => void;
}

export const FileReferenceRowStandalone = ({
	disableAdd,
	addButtonText,
	fileReferences,
	setFileReferences,
	showConnectTooltip,
	showUnlinkIconInsteadOfX,
}: FileReferenceRowStandaloneProps) => {
	return (
		<AiTextAreaContext.Provider value={{ fileReferences, setFileReferences, existingLinkedFiles: [] }}>
			<FileReferenceRow
				disableAdd={disableAdd}
				addButtonText={addButtonText}
				showConnectTooltip={showConnectTooltip}
				showUnlinkIconInsteadOfX={showUnlinkIconInsteadOfX}
			/>
		</AiTextAreaContext.Provider>
	);
};

export const FileReferenceRow = ({
	disableAdd,
	addButtonText = "Link files",
	showConnectTooltip = false,
	showUnlinkIconInsteadOfX,
}: FileReferenceRowProps) => {
	const { fileReferences, setFileReferences, existingLinkedFiles } = useAiTextAreaContext();
	const connectFileToDocumentMutation = useConnectFileToDocument();
	const disconnectFileFromDocumentMutation = useDisconnectFileFromDocument();

	const isAtFileLimit = fileReferences.length >= FILE_REFERENCE_LIMIT;

	const handleConnectFile = (file: RepoReference) => {
		connectFileToDocumentMutation.mutate(file);

		setFileReferences(fileReferences.filter(f => f.path !== file.path));
	};

	const handleDisconnectFile = (file: { path: string }) => {
		disconnectFileFromDocumentMutation.mutate(file);
	};

	const totalItemCount = existingLinkedFiles.length + fileReferences.length;

	return (
		<div className="flex flex-row flex-wrap items-center gap-1 pt-1">
			{!disableAdd && (
				<Dropdown
					align="start"
					className="w-[32rem] p-0"
					trigger={
						<Button size={fileReferences.length === 0 ? "xs" : "icon-xs"} variant="outline">
							<PlusIcon className="size-4" />
							{totalItemCount === 0 && <span>{addButtonText}</span>}
						</Button>
					}>
					<FileReferenceDropdownContent />
				</Dropdown>
			)}
			{existingLinkedFiles?.map(file => (
				<FileReferencePill
					key={file.path}
					path={file.path}
					repoFullName={file.repoFullName}
					fileUrl={file.fileUrl}
					isExisting
					showConnectTooltip={showConnectTooltip}
					showUnlinkIconInsteadOfX={showUnlinkIconInsteadOfX}
					onDisconnect={() => handleDisconnectFile({ path: file.path })}
				/>
			))}
			{fileReferences?.map(file => (
				<FileReferencePill
					key={file.path}
					path={file.path}
					repoFullName={file.repoFullName}
					fileUrl={file.fileUrl}
					onRemove={() => setFileReferences(fileReferences.filter(f => f.path !== file.path))}
					showConnectTooltip={showConnectTooltip}
					showUnlinkIconInsteadOfX={showUnlinkIconInsteadOfX}
					onConnect={() => handleConnectFile(file)}
				/>
			))}

			{isAtFileLimit && <span className="text-xs text-red-600">Maximum of 8 files reached</span>}
		</div>
	);
};

const FileReferenceDropdownContent = () => {
	const [query, setQuery] = useState("");

	const fileSearchRef = useRef<FileSearchRef>(null);

	return (
		<div className="w-[32rem]">
			<div className="border-b border-border bg-card/50 px-1 py-1">
				<Input
					placeholder="Search files"
					className="border-none bg-transparent"
					prefix={<SearchIcon className="mr-2 size-4" />}
					value={query}
					onChange={e => setQuery(e.target.value)}
					onKeyDown={e => {
						fileSearchRef.current?.onKeyDown({ event: e, hide: () => {} });
					}}
					autoFocus
				/>
			</div>
			<FileSearch ref={fileSearchRef} query={query} />
		</div>
	);
};
