import { RepoFilesGetResponse, RepoReference } from "@cloudy/utils/common";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon, SearchIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { apiClient } from "src/api/client";
import { Button } from "src/components/Button";
import { Dropdown } from "src/components/Dropdown";
import { Input } from "src/components/Input";
import { Tooltip, TooltipContent, TooltipTrigger } from "src/components/Tooltip";

import { useProject } from "../projects/ProjectContext";

const useRepoFiles = () => {
	const project = useProject();
	const { data: allRepoPaths } = useQuery({
		queryKey: [project?.id, "repoFileAutocomplete"],
		queryFn: async () => {
			if (!project) {
				throw new Error("Project not loaded");
			}

			const results = await apiClient.get<RepoFilesGetResponse>(`/api/integrations/github/repo-files`, {
				params: {
					projectId: project!.id,
				},
			});

			return results.data.paths.map(file => ({
				...file,
				fileName: file.path.split("/").pop(),
			}));
		},
		enabled: !!project,
	});

	return allRepoPaths;
};

export const FileReferenceRow = ({
	fileReferences,
	setFileReferences,
}: {
	fileReferences: RepoReference[];
	setFileReferences: (files: RepoReference[]) => void;
}) => {
	const [query, setQuery] = useState("");

	const repoFiles = useRepoFiles();

	const filteredFiles = useMemo(() => {
		if (query) {
			return repoFiles?.filter(file => file.path.toLowerCase().includes(query.toLowerCase())) ?? [];
		}

		return repoFiles?.slice(0, 16) ?? [];
	}, [repoFiles, query]);

	return (
		<div className="flex flex-row flex-wrap items-center gap-1 pt-1">
			<Dropdown
				className="w-[32rem]"
				trigger={
					<Button size={fileReferences.length === 0 ? "xs" : "icon-xs"} variant="outline">
						<PlusIcon className="size-4" />
						{fileReferences.length === 0 && <span>Add files</span>}
					</Button>
				}>
				<div>
					<Input
						placeholder="Search files"
						prefix={<SearchIcon className="mr-2 size-4" />}
						value={query}
						onChange={e => setQuery(e.target.value)}
					/>
				</div>
				<div className="max-h-[40dvh] overflow-y-auto py-2">
					{filteredFiles.map(file => (
						<div
							key={file.path}
							className="flex cursor-pointer flex-row items-center gap-1 rounded px-2 py-1 text-sm hover:bg-card"
							onClick={() => setFileReferences([...fileReferences, file])}>
							<span className="shrink-0">{file.fileName}</span>
							<span className="flex-1 truncate text-xs text-tertiary">{file.path}</span>
						</div>
					))}
				</div>
			</Dropdown>
			{fileReferences.length > 0 && (
				<>
					{fileReferences.map(file => (
						<Tooltip key={file.path} durationPreset="instant">
							<TooltipTrigger>
								<div className="flex h-6 flex-row items-center gap-0.5 rounded border border-border px-1.5 text-xs hover:bg-card">
									<span className="truncate">{file.path.split("/").pop()}</span>
									<Button
										size="icon-xs-overflow"
										variant="ghost"
										className="hover:bg-transparent hover:text-accent"
										onClick={() => setFileReferences(fileReferences.filter(f => f.path !== file.path))}>
										<XIcon className="size-3" />
									</Button>
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<span className="text-xs text-secondary">{file.path}</span>
							</TooltipContent>
						</Tooltip>
					))}
				</>
			)}
		</div>
	);
};
