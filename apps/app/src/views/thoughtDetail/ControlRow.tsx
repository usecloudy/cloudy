import { Hotkey } from "@cloudy/ui";
import { Editor } from "@tiptap/react";
import {
	ChevronsLeftIcon,
	CopyIcon,
	MoreHorizontalIcon,
	PenIcon,
	PenOffIcon,
	RedoIcon,
	RefreshCwIcon,
	TriangleAlertIcon,
	UndoIcon,
} from "lucide-react";
import { useContext } from "react";
import { toast } from "react-toastify";
import { useCopyToClipboard } from "react-use";

import { Button } from "src/components/Button";
import { Dropdown } from "src/components/Dropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "src/components/Tooltip";
import { makeHumanizedTime } from "src/utils/strings";

import { DeleteDialog } from "./DeleteDialog";
import { ExportDialog } from "./ExportDialog";
import { MoveWorkspaceDialog } from "./MoveWorkspaceDialog";
import { ShareDialog } from "./ShareDialog";
import { useThought, useToggleDisableTitleSuggestions } from "./hooks";
import { ThoughtContext } from "./thoughtContext";

export const ControlRow = ({ thoughtId, editor }: { thoughtId: string; editor?: Editor | null }) => {
	const { data: thought } = useThought(thoughtId);
	const { isConnected, isDocumentLoading, hideControlColumn, setHideControlColumn } = useContext(ThoughtContext);
	const [, copyToClipboard] = useCopyToClipboard();

	const toggleDisableTitleSuggestionsMutation = useToggleDisableTitleSuggestions();

	return (
		<div className="flex w-full flex-row items-center justify-between gap-2">
			<div className="flex items-center gap-3">
				<div className="text-xs text-tertiary">
					{thought && <span>Last edited {makeHumanizedTime(thought.updated_at)}</span>}
				</div>
			</div>
			<div className="flex items-center gap-1 text-secondary">
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
				<ShareDialog />
				<Dropdown
					trigger={
						<Button variant="ghost" size="icon-sm" disabled={!thoughtId}>
							<MoreHorizontalIcon className="size-5" />
						</Button>
					}>
					<div className="flex w-64 flex-col">
						<Button
							variant="ghost"
							size="sm"
							className="w-full justify-start"
							onClick={() => toggleDisableTitleSuggestionsMutation.mutate({ thoughtId })}>
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
						<ExportDialog thoughtId={thoughtId} title={thought?.title ?? undefined} />
						<DeleteDialog thoughtId={thoughtId} />
					</div>
				</Dropdown>
				{hideControlColumn && (
					<Button className="hidden lg:flex" variant="outline" size="sm" onClick={() => setHideControlColumn(false)}>
						<ChevronsLeftIcon className="size-5" />
						<span>Show panel</span>
					</Button>
				)}
			</div>
		</div>
	);
};
