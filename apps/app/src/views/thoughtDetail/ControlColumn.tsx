import { ChevronsDownIcon, ChevronsRightIcon } from "lucide-react";
import { useContext } from "react";

import { Button } from "src/components/Button";

import { AiFeed } from "./AiFeed";
import { RelatedNotes } from "./RelatedNotes";
import { ThoughtContext } from "./thoughtContext";

export const ControlColumn = ({ thoughtId }: { thoughtId?: string }) => {
	const { hideControlColumn, setHideControlColumn } = useContext(ThoughtContext);

	return (
		!hideControlColumn && (
			<div className="no-scrollbar sticky top-0 box-border flex w-full overflow-y-scroll border-border px-1 pt-1 md:h-1/3 md:border-t md:px-4 md:pt-0 lg:h-screen lg:w-[24rem] lg:border-l xl:w-[28rem]">
				<div className="flex w-full flex-col gap-4 md:pl-1 md:pt-3 lg:px-1">
					<div className="flex justify-end lg:justify-start">
						<Button
							variant="outline"
							className="text-secondary"
							size="sm"
							onClick={() => setHideControlColumn(true)}>
							<ChevronsRightIcon className="hidden size-5 lg:block" />
							<ChevronsDownIcon className="block size-5 lg:hidden" />
							<span>Hide panel</span>
						</Button>
					</div>
					<div className="flex w-full flex-col gap-4 md:flex-row lg:flex-col">
						<AiFeed thoughtId={thoughtId} />
						<div className="flex w-full flex-col gap-4 md:w-1/2 lg:w-full">
							<RelatedNotes thoughtId={thoughtId} />
						</div>
					</div>
					<div className="h-8" />
				</div>
			</div>
		)
	);
};
