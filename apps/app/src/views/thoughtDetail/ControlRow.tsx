import { Hotkey } from "@cloudy/ui";
import { Editor } from "@tiptap/react";
import { ChevronsLeftIcon, GoalIcon, MoreHorizontalIcon, RedoIcon, UndoIcon } from "lucide-react";
import { useContext } from "react";
import { useLocalStorage } from "react-use";

import { Button } from "src/components/Button";
import { Dropdown } from "src/components/Dropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "src/components/Tooltip";
import { makeHumanizedTime } from "src/utils/strings";

import { DeleteDialog } from "./DeleteDialog";
import { ExportDialog } from "./ExportDialog";
import { GoalDropdown } from "./GoalDropdown";
import { useThought } from "./hooks";
import { ThoughtContext } from "./thoughtContext";

export const ControlRow = ({ thoughtId, editor }: { thoughtId?: string; editor?: Editor | null }) => {
	const { data: thought } = useThought(thoughtId);
	const { hideControlColumn, setHideControlColumn } = useContext(ThoughtContext);

	return (
		<div className="flex flex-row items-center justify-between">
			<div className="text-xs text-tertiary">
				{thought && <span>Last edited {makeHumanizedTime(thought.updated_at)}</span>}
			</div>
			<div className="flex items-center gap-1 text-secondary">
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
				<Dropdown
					trigger={
						<div>
							<Tooltip durationPreset="short">
								<TooltipTrigger asChild>
									<span>
										<Button variant="ghost" size="icon-sm">
											<GoalIcon className="size-5" />
										</Button>
									</span>
								</TooltipTrigger>
								<TooltipContent>
									<span>Set a goal</span>
								</TooltipContent>
							</Tooltip>
						</div>
					}>
					{({ open, close }) => (open ? <GoalDropdown thoughtId={thoughtId} onClose={close} /> : null)}
				</Dropdown>
				<Dropdown
					trigger={
						<Button variant="ghost" size="icon-sm" disabled={!thoughtId}>
							<MoreHorizontalIcon className="size-5" />
						</Button>
					}>
					<div className="flex w-36 flex-col">
						{thoughtId && <ExportDialog thoughtId={thoughtId} />}
						{thoughtId && <DeleteDialog thoughtId={thoughtId} />}
					</div>
				</Dropdown>
				{hideControlColumn && (
					<Button variant="ghost" size="icon-sm" onClick={() => setHideControlColumn(false)}>
						<ChevronsLeftIcon className="size-5" />
					</Button>
				)}
			</div>
		</div>
	);
};
