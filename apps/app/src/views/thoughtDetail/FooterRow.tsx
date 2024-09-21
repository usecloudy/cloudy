import { ChevronsDownIcon, ChevronsLeftIcon, ChevronsUpIcon } from "lucide-react";
import { useContext } from "react";

import { Button } from "src/components/Button";

import { ThoughtContext } from "./thoughtContext";

export const FooterRow = () => {
	const { hideControlColumn, setHideControlColumn } = useContext(ThoughtContext);

	return (
		<div className="sticky bottom-0 z-10 flex w-full items-center justify-center p-4 md:justify-end lg:hidden">
			{hideControlColumn ? (
				<Button
					className="bg-background text-secondary"
					variant="outline"
					size="sm"
					onClick={() => setHideControlColumn(false)}>
					<ChevronsUpIcon className="size-5" />
					<span>Show panel</span>
				</Button>
			) : (
				<Button
					className="bg-background text-secondary"
					variant="outline"
					size="sm"
					onClick={() => setHideControlColumn(true)}>
					<ChevronsDownIcon className="size-5" />
					<span>Hide panel</span>
				</Button>
			)}
		</div>
	);
};
