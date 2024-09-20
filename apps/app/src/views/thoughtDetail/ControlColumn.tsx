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
			<div className="no-scrollbar sticky top-0 box-border flex h-screen w-full overflow-y-scroll border-l border-border px-1 pt-1 md:px-4 md:pt-0 lg:w-[20rem] xl:w-[26rem]">
				<div className="w-full md:pl-1 md:pt-2 lg:px-1">
					<div className="flex w-full flex-col gap-4 md:flex-row lg:flex-col">
						<div>
							<Button variant="ghost" size="icon-sm" onClick={() => setHideControlColumn(true)}>
								<ChevronsRightIcon className="size-5" />
							</Button>
						</div>
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
