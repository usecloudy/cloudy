import { ChevronsLeftIcon, ChevronsUpIcon } from "lucide-react";
import { useContext } from "react";

import { Button } from "src/components/Button";

import { ThoughtContext } from "./thoughtContext";

export const FooterRow = () => {
	const { hideControlColumn, setHideControlColumn } = useContext(ThoughtContext);

	return (
		<div className="sticky bottom-0 flex w-full items-center justify-end p-4 lg:hidden">
			{hideControlColumn && (
				<Button className="text-secondary" variant="outline" size="sm" onClick={() => setHideControlColumn(false)}>
					<ChevronsUpIcon className="size-5" />
					<span>Show panel</span>
				</Button>
			)}
		</div>
	);
};
