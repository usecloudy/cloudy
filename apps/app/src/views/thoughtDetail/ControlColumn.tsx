import { ChevronsRightIcon } from "lucide-react";
import { useContext } from "react";

import { Button } from "src/components/Button";

import { AiFeed } from "./AiFeed";
import { RelatedNotes } from "./RelatedNotes";
import { ThoughtContext } from "./thoughtContext";

export const ControlColumn = ({ thoughtId }: { thoughtId?: string }) => {
	const { hideControlColumn, setHideControlColumn } = useContext(ThoughtContext);

	return (
		!hideControlColumn && (
			<div className="sticky top-0 border-l border-border h-screen box-border overflow-y-scroll flex w-full lg:w-[20rem] xl:w-[26rem] no-scrollbar px-1 pt-1 md:pt-0 md:px-4">
				<div className="w-full md:pt-2 md:pl-1 lg:px-1">
					<div className="flex flex-col md:flex-row lg:flex-col gap-4 w-full">
						<div>
							<Button variant="ghost" size="icon-sm" onClick={() => setHideControlColumn(true)}>
								<ChevronsRightIcon className="size-5" />
							</Button>
						</div>
						<AiFeed thoughtId={thoughtId} />
						<div className="flex flex-col md:w-1/2 lg:w-full gap-4 w-full">
							<RelatedNotes thoughtId={thoughtId} />
						</div>
					</div>
					<div className="h-8" />
				</div>
			</div>
		)
	);
};
