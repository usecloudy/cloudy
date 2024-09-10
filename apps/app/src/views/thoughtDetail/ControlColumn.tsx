import { AiFeed } from "./AiFeed";
import { RelatedNotes } from "./RelatedNotes";

export const ControlColumn = ({ thoughtId }: { thoughtId?: string }) => {
	return (
		<div className="relative h-full box-border overflow-y-auto flex w-full lg:w-[26rem] no-scrollbar px-1 pt-1 md:pt-0 px-4 md:px-0">
			<div className="w-full md:pt-4 lg:pt-8 md:pl-1 lg:px-1">
				<div className="flex flex-col md:flex-row lg:flex-col gap-4 w-full">
					<AiFeed thoughtId={thoughtId} />
					<div className="flex flex-col md:w-1/2 lg:w-full gap-4 w-full">
						<RelatedNotes thoughtId={thoughtId} />
					</div>
				</div>
				<div className="h-8" />
			</div>
		</div>
	);
};
