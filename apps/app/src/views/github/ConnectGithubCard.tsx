import { SiGithub } from "@icons-pack/react-simple-icons";
import { ArrowRightIcon } from "lucide-react";

export const ConnectGithubCard = () => {
	return (
		<a
			href={`https://github.com/apps/usecloudyai/installations/new`}
			className="text-medium flex h-14 w-full flex-row items-center justify-between gap-4 rounded-md border border-border px-4 text-sm hover:bg-card">
			<div className="flex flex-row items-center gap-4">
				<SiGithub className="size-6 text-secondary" />
				<span>Install the Cloudy Github App</span>
			</div>
			<ArrowRightIcon className="size-4 text-secondary" />
		</a>
	);
};
