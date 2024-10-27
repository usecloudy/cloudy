import {
	GithubRepository,
	RepositoryConnection,
	RepositoryProvider,
	VALID_WORKSPACE_SLUG_CHARS,
	checkIfSlugIsAvailable,
	createNonConflictingSlug,
} from "@cloudy/utils/common";
import { GithubAllWorkspaceReposGetResponse } from "@cloudy/utils/common";
import { useMutation } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
import posthog from "posthog-js";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { useMount } from "react-use";

import { apiClient } from "src/api/client";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { Input } from "src/components/Input";
import LoadingSpinner from "src/components/LoadingSpinner";
import { MainLayout } from "src/components/MainLayout";
import { SelectDropdown } from "src/components/SelectDropdown";
import { useUserRecord } from "src/stores/user";
import { useWorkspace, useWorkspaceGithubInstallations } from "src/stores/workspace";
import { makeProjectHomeUrl } from "src/utils/projects";

import { ConnectGithubCard } from "../github/ConnectGithubCard";
import { useCreateProject, useUserProjects } from "./hooks";

type FormData = {
	name: string;
	slug: string;
	githubRepo?: string;
};

const useCreateNonConflictingSlug = () => {
	return useMutation({
		mutationFn: async (name: string) => {
			const slug = await createNonConflictingSlug(name, supabase);
			return slug;
		},
	});
};

const useCheckSlugAvailability = () => {
	return useMutation({
		mutationFn: async (slug: string) => {
			return await checkIfSlugIsAvailable(slug, supabase);
		},
	});
};

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

export const NewProjectView = () => {
	const workspace = useWorkspace();
	const userRecord = useUserRecord();
	const [searchParams] = useSearchParams();

	const { data: userProjects } = useUserProjects();
	const { data: installations } = useWorkspaceGithubInstallations();

	const nameFromParams = searchParams.get("name");

	const shouldSetDefaults = !!nameFromParams;

	const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm<FormData>({
		defaultValues: {
			name: shouldSetDefaults ? nameFromParams || (userRecord.name ? `${userRecord.name}'s Project` : "") : "",
		},
	});

	const createProjectMutation = useCreateProject();
	const slugMutation = useCreateNonConflictingSlug();
	const checkSlugAvailabilityMutation = useCheckSlugAvailability();

	const navigate = useNavigate();

	const userHasProjects = userProjects && userProjects.length > 0;

	useMount(async () => {
		if (shouldSetDefaults) {
			const defaultName = nameFromParams || userRecord.name;
			if (defaultName) {
				const defaultSlug = await slugMutation.mutateAsync(defaultName);
				setValue("slug", defaultSlug);
				setIsSlugAvailable(true);
			}
		}
	});

	const { data: reposData } = useWorkspaceRepos(workspace?.id);

	const onSubmit = async (data: FormData) => {
		const repo = reposData?.repositories.find(repo => repo.fullName === data.githubRepo);
		let repositoryConnection: RepositoryConnection | undefined;
		if (repo) {
			repositoryConnection = {
				provider: RepositoryProvider.GITHUB,
				external_id: String(repo.id),
				name: repo.name,
				owner: repo.fullName.split("/")[0],
				installation_id: String(repo.installationId),
			} satisfies RepositoryConnection;
		}

		const { projectSlug } = await createProjectMutation.mutateAsync({
			...data,
			repositoryConnection,
		});

		posthog.capture("project_created", {
			project_id: projectSlug,
			user_id: userRecord.id,
			is_setup: !userHasProjects,
			has_github_repo: !!data.githubRepo,
		});

		navigate(makeProjectHomeUrl(workspace.slug, projectSlug));
	};

	const watchSlug = watch("slug");
	const watchName = watch("name");

	const handleSlugChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const newSlug = e.target.value
			.toLowerCase()
			.replace(/\s/g, "-")
			.replace(/[^a-z0-9-]/g, "");
		setValue("slug", newSlug);
		if (newSlug) {
			const available = await checkSlugAvailabilityMutation.mutateAsync(newSlug);
			setIsSlugAvailable(available);
		} else {
			setIsSlugAvailable(null);
		}
	};

	const [selectedOwner, setSelectedOwner] = useState<string>("");

	// Group repositories by owner
	const reposByOwner = useMemo(() => {
		if (!reposData?.repositories) return [];

		const ownerMap = new Map<string, GithubRepository[]>();

		reposData.repositories.forEach(repo => {
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
	}, [reposData?.repositories]);

	// Create options for owner dropdown
	const ownerOptions = reposByOwner.map(owner => ({
		value: owner.login,
		label: owner.login,
		disabled: false,
	}));

	// Create options for repository dropdown
	const repoOptions = useMemo(() => {
		const owner = reposByOwner.find(o => o.login === selectedOwner);
		if (!owner) return [];

		return owner.repositories.map(repo => ({
			value: repo.fullName,
			label: repo.name,
			disabled: false,
		}));
	}, [reposByOwner, selectedOwner]);

	// Handle owner selection
	const handleOwnerChange = (value: string) => {
		setSelectedOwner(value);
		setValue("githubRepo", ""); // Clear repo selection when owner changes
	};

	return (
		<MainLayout className="flex h-screen flex-col items-center justify-center">
			<div className="flex w-full max-w-md flex-col gap-4 rounded-md border border-border p-6">
				<h1 className="font-display text-2xl font-bold">Create a project</h1>
				<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
					<div className="flex flex-col gap-1">
						<label htmlFor="name" className="font-medium">
							Project Name
						</label>
						<Input
							{...register("name", { required: "Workspace name is required" })}
							placeholder="Brain Fog Inc."
							error={!!errors.name}
						/>
						{errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
					</div>
					<div className="flex flex-col gap-1">
						<label htmlFor="slug" className="font-medium">
							Project Slug
						</label>
						<div className="flex items-center">
							<Input
								prefix={`/workspaces/${workspace.slug}/projects/`}
								{...register("slug", {
									required: "Slug is required",
									pattern: {
										value: VALID_WORKSPACE_SLUG_CHARS,
										message: "Slug can only contain lowercase letters, numbers, and hyphens",
									},
									validate: value => isSlugAvailable === true || "This slug is already taken",
								})}
								placeholder="brain-fog-inc"
								className="flex-grow"
								error={!!errors.slug}
								onChange={handleSlugChange}
							/>
						</div>
						{errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug.message}</p>}
						{isSlugAvailable === true && <p className="mt-1 text-xs text-green-600">This slug is available</p>}
						{isSlugAvailable === false && <p className="mt-1 text-xs text-red-600">This slug is already taken</p>}
					</div>
					<div className="flex flex-col gap-2">
						<div className="flex flex-col gap-1">
							<label htmlFor="githubRepo" className="font-medium">
								Connect GitHub Repository (optional)
							</label>
							<span className="text-xs text-secondary">
								Connect a GitHub repository to your project to create & link documents with code. Soon, we will
								keep your documents up to date with the latest code.
							</span>
						</div>
						<ConnectGithubCard />
						{installations && installations.length > 0 && (
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
									value={watch("githubRepo") || ""}
									onChange={value => setValue("githubRepo", value)}
									placeholder="Select repository"
									className="w-full"
									disabled={!selectedOwner}
								/>
							</div>
						)}
					</div>
					<Button
						type="submit"
						disabled={createProjectMutation.isPending || !watchSlug || !watchName || !isSlugAvailable}>
						{createProjectMutation.isPending ? <LoadingSpinner size="xs" variant="background" /> : "Create Project"}
					</Button>
				</form>
			</div>
		</MainLayout>
	);
};
