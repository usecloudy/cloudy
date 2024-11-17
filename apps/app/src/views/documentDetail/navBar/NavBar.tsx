import { Hotkey } from "@cloudy/ui";
import { Editor } from "@tiptap/react";
import {
	CopyIcon,
	FileCheckIcon,
	FolderCodeIcon,
	MoreHorizontalIcon,
	PenIcon,
	PenOffIcon,
	RedoIcon,
	RefreshCwIcon,
	TriangleAlertIcon,
	UndoIcon,
	XIcon,
} from "lucide-react";
import { useContext } from "react";
import { toast } from "react-toastify";
import { useCopyToClipboard } from "react-use";

import { Button } from "src/components/Button";
import { Dropdown } from "src/components/Dropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "src/components/Tooltip";
import { makeHumanizedTime } from "src/utils/strings";
import { usePublishDocumentVersion, useThought, useToggleDisableTitleSuggestions } from "src/views/thoughtDetail/hooks";
import { ThoughtContext } from "src/views/thoughtDetail/thoughtContext";

import { useUserProfile } from "../../../utils/users";
import { useDocumentContext } from "../DocumentContext";
import { useLatestPublishedDocumentVersion } from "../hooks";
import { DeleteDialog } from "./DeleteDialog";
import { ExportDialog } from "./ExportDialog";
import { LinkedFilesDropdown } from "./LinkedFilesDropdown";
import { MoveWorkspaceDialog } from "./MoveWorkspaceDialog";
import { ShareDialog } from "./ShareDialog";

const PublishedDocumentName = ({ userId }: { userId: string }) => {
	const { data: publishedBy } = useUserProfile(userId);
	return <span>{publishedBy?.name ?? publishedBy?.email ?? "Unknown User"}</span>;
};

const DocumentPublishedTimestamp = () => {
	const { documentId, isEditMode } = useDocumentContext();
	const { data: latestPublishedDocumentVersion } = useLatestPublishedDocumentVersion();
	const { data: document } = useThought(documentId);

	return (
		<div className="flex items-center gap-3">
			{isEditMode ? (
				<div className="text-xs text-tertiary">
					{document && <span>Last edited {makeHumanizedTime(document.updated_at)}</span>}
				</div>
			) : (
				<div className="text-xs text-tertiary">
					{latestPublishedDocumentVersion && latestPublishedDocumentVersion.published_by && (
						<span>
							Published {makeHumanizedTime(latestPublishedDocumentVersion.created_at)} by{" "}
							<PublishedDocumentName userId={latestPublishedDocumentVersion.published_by.id} />
						</span>
					)}
				</div>
			)}
		</div>
	);
};

export const NavBar = ({ editor }: { editor?: Editor | null }) => {
	const { documentId, isEditMode, setIsEditMode } = useDocumentContext();
	const { data: thought } = useThought(documentId);

	const { isConnected, isDocumentLoading } = useContext(ThoughtContext);

	const [, copyToClipboard] = useCopyToClipboard();

	const toggleDisableTitleSuggestionsMutation = useToggleDisableTitleSuggestions();
	const publishDocumentVersionMutation = usePublishDocumentVersion();

	return (
		<div className="flex w-full flex-row items-center justify-between gap-2">
			<DocumentPublishedTimestamp />
			<div className="flex items-center gap-1 text-secondary">
				{isEditMode ? (
					<>
						{!isConnected && !isDocumentLoading && (
							<Tooltip durationPreset="instant">
								<TooltipTrigger>
									<Button
										variant="outline"
										size="sm"
										className="text-red-600"
										onClick={() => {
											window.location.reload();
										}}>
										<div className="flex flex-row items-center gap-1 group-hover:hidden">
											<TriangleAlertIcon className="size-4" />
											<span>Disconnected</span>
										</div>
										<div className="hidden flex-row items-center gap-1 group-hover:flex">
											<RefreshCwIcon className="size-4" />
											<span>Refresh page</span>
										</div>
									</Button>
								</TooltipTrigger>
								<TooltipContent>Editing disabled. Refresh the page to reconnect.</TooltipContent>
							</Tooltip>
						)}
						<Tooltip durationPreset="short">
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={() => editor?.commands.undo()}
									disabled={!editor?.can().undo()}>
									<UndoIcon className="size-5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<div className="flex items-center gap-2">
									<Hotkey keys={["cmd", "Z"]} />
									<span>Undo</span>
								</div>
							</TooltipContent>
						</Tooltip>
						<Tooltip durationPreset="short">
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={() => editor?.commands.redo()}
									disabled={!editor?.can().redo()}>
									<RedoIcon className="size-5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<div className="flex items-center gap-2">
									<Hotkey keys={["cmd", "shift", "Z"]} />
									<span>Redo</span>
								</div>
							</TooltipContent>
						</Tooltip>
						<Button variant="outline" size="sm" onClick={() => setIsEditMode(false)}>
							<XIcon className="size-4" />
							Leave edit mode
						</Button>
						<Button
							size="sm"
							onClick={() => {
								publishDocumentVersionMutation.mutate();
								setIsEditMode(false);
							}}>
							<FileCheckIcon className="size-4" />
							Publish
						</Button>
					</>
				) : (
					<>
						<Button variant="outline" size="sm" onClick={() => setIsEditMode(true)}>
							<PenIcon className="size-4" />
							Edit
						</Button>
					</>
				)}

				<ShareDialog />
				<Dropdown
					trigger={
						<Button variant="ghost" size="icon-sm" disabled={!documentId}>
							<MoreHorizontalIcon className="size-5" />
						</Button>
					}>
					<div className="flex w-64 flex-col">
						<Button
							variant="ghost"
							size="sm"
							className="w-full justify-start"
							onClick={() => toggleDisableTitleSuggestionsMutation.mutate({ thoughtId: documentId })}>
							{thought?.disable_title_suggestions ? (
								<>
									<PenIcon className="size-4" />
									<span>Enable title suggestions</span>
								</>
							) : (
								<>
									<PenOffIcon className="size-4" />
									<span>Disable title suggestions</span>
								</>
							)}
						</Button>
						<LinkedFilesDropdown
							trigger={
								<Button variant="ghost" size="sm" className="w-full justify-start">
									<FolderCodeIcon className="size-4" />
									<span>Linked Code Files</span>
								</Button>
							}
						/>
						<MoveWorkspaceDialog />
						<Button
							variant="ghost"
							size="sm"
							className="w-full justify-start"
							onClick={() => {
								if (thought?.content_md) {
									copyToClipboard(thought?.content_md ?? "");
									toast.success("Copied to clipboard");
								} else {
									toast.error("No content to copy");
								}
							}}>
							<CopyIcon className="size-4" />
							<span>Copy as Markdown</span>
						</Button>
						<ExportDialog thoughtId={documentId} title={thought?.title ?? undefined} />
						<DeleteDialog thoughtId={documentId} />
					</div>
				</Dropdown>
			</div>
		</div>
	);
};
