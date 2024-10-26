import { ChevronsDownIcon, ChevronsRightIcon } from "lucide-react";
import { useContext } from "react";

import { Button } from "src/components/Button";
import { cn } from "src/utils";

import { AiFeed } from "./AiFeed";
import { RelatedNotes } from "./RelatedNotes";
import { ThoughtContext } from "./thoughtContext";

export const ControlColumn = ({ thoughtId }: { thoughtId?: string }) => {
	const { hideControlColumn, setHideControlColumn } = useContext(ThoughtContext);

	return (
		<div
			className={cn(
				"no-scrollbar relative box-border flex w-full shrink-0 overflow-y-scroll border-t border-border transition-all ease-in-out md:pt-0 lg:sticky lg:top-0 lg:h-screen lg:border-l",
				hideControlColumn
					? "h-0 max-h-0 min-h-0 w-0 opacity-0"
					: "h-auto max-h-screen min-h-[40vh] opacity-100 lg:w-[24rem] xl:w-[28rem]",
			)}>
			<div className="absolute top-0 flex w-screen flex-col gap-4 px-4 pt-4 lg:w-[24rem] xl:w-[28rem]">
				<div className="hidden justify-center md:justify-end lg:flex lg:justify-start">
					<Button variant="outline" className="text-secondary" size="sm" onClick={() => setHideControlColumn(true)}>
						<ChevronsRightIcon className="hidden size-5 lg:block" />
						<ChevronsDownIcon className="block size-5 lg:hidden" />
						<span>Hide panel</span>
					</Button>
				</div>
				<div className="flex w-full flex-col gap-4 md:flex-row lg:flex-col">
					<div className="flex w-full flex-col gap-4 md:w-1/2 lg:w-full">
						<RelatedNotes thoughtId={thoughtId} />
					</div>
				</div>
				<div className="h-8 shrink-0" />
			</div>
		</div>
	);
};
