import { handleSupabaseError } from "@cloudy/utils/common";
import { VALID_WORKSPACE_SLUG_CHARS } from "@cloudy/utils/common";
import { GithubAllWorkspaceReposGetResponse } from "@cloudy/utils/common";
import { GithubRepository } from "@cloudy/utils/common";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import { apiClient } from "src/api/client";
import { queryClient } from "src/api/queryClient";
import { projectQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { Input } from "src/components/Input";
import LoadingSpinner from "src/components/LoadingSpinner";
import { MainLayout } from "src/components/MainLayout";
import { SelectDropdown } from "src/components/SelectDropdown";
import { useWorkspace } from "src/stores/workspace";
import { useEditProject, useProjectRepos } from "src/utils/projects";

import { ConnectGithubCard } from "../github/ConnectGithubCard";
import { useProject } from "./ProjectContext";

interface FormData {
	name: string;
	slug: string;
	githubRepo?: string;
}

const useWorkspaceRepos = (workspaceId?: string) => {
	return useQuery({
		queryKey: ["workspace-repos", workspaceId],
		queryFn: async () => {
			if (!workspaceId) return { repositories: [] };
			const response = await apiClient.get<GithubAllWorkspaceReposGetResponse>(
				"/api/integrations/github/all-workspace-repos",
				{
					params: { workspaceId },
				},
			);
			return response.data;
		},
		enabled: !!workspaceId,
	});
};

export const ProjectSettingsView = () => {
	const project = useProject();
	const workspace = useWorkspace();
	const [isSlugAvailable, setIsSlugAvailable] = useState<boolean>(true);

	if (!project) throw new Error("Project not found");

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm<FormData>({
		defaultValues: {
			name: project.name,
			slug: project.slug,
		},
	});

	const editProjectMutation = useEditProject();
	const { data: projectRepos } = useProjectRepos(project.id);

	const unlinkRepositoryMutation = useMutation({
		mutationFn: async ({ projectId, repoId }: { projectId: string; repoId: string }) => {
			handleSupabaseError(
				await supabase.from("repository_connections").delete().eq("project_id", projectId).eq("id", repoId),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: projectQueryKeys.repos(project.id) });
		},
	});

	const onSubmit = async (data: FormData) => {
		await editProjectMutation.mutateAsync({
			projectId: project.id,
			name: data.name,
			slug: data.slug,
		});
	};

	const watchSlug = watch("slug");
	const watchName = watch("name");

	const hasChanges = watchName !== project.name || watchSlug !== project.slug;

	const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newSlug = e.target.value
			.toLowerCase()
			.replace(/\s/g, "-")
			.replace(/[^a-z0-9-]/g, "");
		setValue("slug", newSlug);
	};

	const [selectedOwner, setSelectedOwner] = useState<string>("");
	const { data: workspaceRepos } = useWorkspaceRepos(workspace.id);

	const reposByOwner = useMemo(() => {
		if (!workspaceRepos?.repositories) return [];

		const ownerMap = new Map<string, GithubRepository[]>();

		workspaceRepos.repositories.forEach(repo => {
			const owner = repo.fullName.split("/")[0];
			if (!ownerMap.has(owner)) {
				ownerMap.set(owner, []);
			}
			ownerMap.get(owner)!.push(repo);
		});

		return Array.from(ownerMap.entries()).map(([login, repositories]) => ({
			login,
			repositories,
		}));
	}, [workspaceRepos?.repositories]);

	const ownerOptions = reposByOwner.map(owner => ({
		value: owner.login,
		label: owner.login,
		disabled: false,
	}));

	const repoOptions = useMemo(() => {
		const owner = reposByOwner.find(o => o.login === selectedOwner);
		if (!owner) return [];

		return owner.repositories.map(repo => ({
			value: repo.fullName,
			label: repo.name,
			disabled: false,
		}));
	}, [reposByOwner, selectedOwner]);

	const handleOwnerChange = (value: string) => {
		setSelectedOwner(value);
	};

	const connectRepositoryMutation = useMutation({
		mutationFn: async (repoFullName: string) => {
			const repo = workspaceRepos?.repositories.find(r => r.fullName === repoFullName);
			if (!repo) throw new Error("Repository not found");

			return handleSupabaseError(
				await supabase.from("repository_connections").insert({
					project_id: project.id,
					provider: "github",
					external_id: String(repo.id),
					name: repo.name,
					owner: repo.fullName.split("/")[0],
					installation_id: String(repo.installationId),
					default_branch: repo.defaultBranch,
				}),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: projectQueryKeys.repos(project.id) });
		},
	});

	return (
		<MainLayout className="flex h-screen flex-col items-center overflow-y-scroll">
			<div className="flex w-full max-w-screen-sm flex-col gap-4 p-6 pt-12">
				<h1 className="font-display text-2xl font-bold">Project settings</h1>

				<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
					<div className="flex flex-col gap-1">
						<label htmlFor="name">Project name</label>
						<Input
							{...register("name", { required: "Project name is required" })}
							placeholder="My Project"
							error={!!errors.name}
						/>
						{errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
					</div>

					<div className="flex flex-col gap-1">
						<label htmlFor="slug">Project slug</label>
						<div className="flex items-center">
							<span className="mr-2 text-sm text-secondary">/workspaces/{workspace.slug}/projects/</span>
							<Input
								{...register("slug", {
									required: "Slug is required",
									pattern: {
										value: VALID_WORKSPACE_SLUG_CHARS,
										message: "Slug can only contain lowercase letters, numbers, and hyphens",
									},
								})}
								placeholder="my-project"
								className="flex-grow"
								error={!!errors.slug}
								onChange={handleSlugChange}
							/>
						</div>
						{errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug.message}</p>}
					</div>

					<Button
						className="self-end"
						type="submit"
						disabled={editProjectMutation.isPending || !watchSlug || !watchName || !isSlugAvailable || !hasChanges}>
						{editProjectMutation.isPending ? <LoadingSpinner size="xs" variant="background" /> : "Save Changes"}
					</Button>
				</form>
				<div className="flex flex-col gap-2">
					<label className="font-medium">Linked Repositories</label>
					{projectRepos?.map(repo => (
						<div
							key={repo.id}
							className="flex items-center justify-between rounded-md border border-border bg-background p-2 pl-4">
							<div className="flex items-center gap-2">
								<SiGithub className="size-4" />
								<span>
									{repo.owner}/{repo.name}
								</span>
							</div>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={() => {
									if (window.confirm("Are you sure you want to unlink this repository?")) {
										unlinkRepositoryMutation.mutate({
											projectId: project.id,
											repoId: repo.id,
										});
									}
								}}
								disabled={unlinkRepositoryMutation.isPending}>
								{unlinkRepositoryMutation.isPending ? (
									<LoadingSpinner size="xs" />
								) : (
									<XIcon className="text-destructive size-4" />
								)}
							</Button>
						</div>
					))}
					{projectRepos?.length === 0 && (
						<div className="flex flex-col gap-4 rounded-lg border border-border p-4">
							<p className="text-sm text-secondary">No repositories linked to this project</p>

							<div className="flex flex-col gap-2">
								<ConnectGithubCard />

								<div className="flex flex-col gap-2">
									<SelectDropdown
										options={ownerOptions}
										value={selectedOwner}
										onChange={handleOwnerChange}
										placeholder="Select organization/owner"
										className="w-full"
									/>
									<SelectDropdown
										options={repoOptions}
										value=""
										onChange={value => {
											connectRepositoryMutation.mutate(value);
										}}
										placeholder="Select repository"
										className="w-full"
										disabled={!selectedOwner || connectRepositoryMutation.isPending}
									/>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</MainLayout>
	);
};
