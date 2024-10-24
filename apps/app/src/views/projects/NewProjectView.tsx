import { VALID_WORKSPACE_SLUG_CHARS, checkIfSlugIsAvailable, createNonConflictingSlug } from "@cloudy/utils/common";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeftIcon, GitBranchIcon } from "lucide-react";
import posthog from "posthog-js";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { useMount } from "react-use";

import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { Input } from "src/components/Input";
import LoadingSpinner from "src/components/LoadingSpinner";
import { MainLayout } from "src/components/MainLayout";
import { useUserRecord } from "src/stores/user";
import { useWorkspace } from "src/stores/workspace";

import { NameAndSlugFields } from "../workspaces/Fields";
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

export const NewProjectView = () => {
	const workspace = useWorkspace();
	const userRecord = useUserRecord();
	const [searchParams] = useSearchParams();
	const { data: userProjects } = useUserProjects();

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

	const onSubmit = async (data: FormData) => {
		const { projectSlug } = await createProjectMutation.mutateAsync(data);

		posthog.capture("project_created", {
			project_id: projectSlug,
			user_id: userRecord.id,
			is_setup: !userHasProjects,
			has_github_repo: !!data.githubRepo,
		});

		navigate(`/projects/${projectSlug}`);
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

	return (
		<MainLayout className="flex h-screen flex-col items-center justify-center">
			<div className="flex w-full max-w-md flex-col gap-4 rounded-md border border-border p-6">
				<h1 className="font-display text-2xl font-bold">Create a project</h1>
				<p className="text-sm text-secondary">
					A project is where you'll manage your code, tasks, and documentation. You can optionally connect it to a
					GitHub repository.
				</p>
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
						<label htmlFor="githubRepo" className="font-medium">
							GitHub Repository (optional)
						</label>
						<input
							id="githubRepo"
							{...register("githubRepo")}
							placeholder="username/repo"
							className="rounded-md border border-border bg-background px-3 py-2 text-sm"
						/>
					</div>
					<Button
						type="submit"
						disabled={createProjectMutation.isPending || !watchSlug || !watchName || !isSlugAvailable}>
						{createProjectMutation.isPending ? <LoadingSpinner size="xs" variant="background" /> : "Create Project"}
					</Button>
				</form>
				<Link to="/projects">
					<Button variant="ghost" className="w-full text-secondary">
						<ArrowLeftIcon className="size-4" />
						<span>Cancel project creation</span>
					</Button>
				</Link>
			</div>
		</MainLayout>
	);
};
