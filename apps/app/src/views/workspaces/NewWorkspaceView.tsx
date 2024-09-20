import {
	VALID_WORKSPACE_SLUG_CHARS,
	WorkspacesNewPostResponse,
	checkIfSlugIsAvailable,
	createNonConflictingSlug,
} from "@cloudy/utils/common";
import { useMutation } from "@tanstack/react-query";
import posthog from "posthog-js";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMount } from "react-use";

import { apiClient } from "src/api/client";
import { queryClient } from "src/api/queryClient";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { Input } from "src/components/Input";
import LoadingSpinner from "src/components/LoadingSpinner";
import { SimpleLayout } from "src/components/SimpleLayout";
import { useUserRecord } from "src/stores/user";

type FormData = {
	name: string;
	slug: string;
};

const useCreateWorkspace = () => {
	return useMutation({
		mutationFn: async (data: FormData) => {
			const workspace = await apiClient.post<WorkspacesNewPostResponse>("/api/workspaces/new", data);
			return workspace.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["userWorkspaces"] });
		},
	});
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

export const NewWorkspaceView = () => {
	const userRecord = useUserRecord();

	const [searchParams] = useSearchParams();

	const shouldSetDefaults = searchParams.get("setup") === "true";

	const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm<FormData>({
		defaultValues: {
			name: shouldSetDefaults ? (userRecord.name ? `${userRecord.name}'s Space` : "") : "",
		},
	});

	const createWorkspaceMutation = useCreateWorkspace();
	const slugMutation = useCreateNonConflictingSlug();
	const checkSlugAvailabilityMutation = useCheckSlugAvailability();

	const navigate = useNavigate();

	useMount(async () => {
		if (shouldSetDefaults && userRecord.name) {
			const defaultSlug = await slugMutation.mutateAsync(userRecord.name);
			setValue("slug", defaultSlug);
			setIsSlugAvailable(true);
		}
	});

	const onSubmit = async (data: FormData) => {
		const { wsSlug } = await createWorkspaceMutation.mutateAsync(data);

		posthog.capture("workspace_created", {
			workspace_id: wsSlug,
			user_id: userRecord.id,
			is_setup: shouldSetDefaults,
		});

		navigate(`/workspaces/${wsSlug}`);
	};

	const watchSlug = watch("slug");
	const watchName = watch("name");

	const handleSlugChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const newSlug = e.target.value
			.toLowerCase()
			.replace(/\s/g, "-") // Replace spaces with hyphens
			.replace(/[^a-z0-9-]/g, ""); // Remove any other invalid characters
		setValue("slug", newSlug);
		if (newSlug) {
			const available = await checkSlugAvailabilityMutation.mutateAsync(newSlug);
			setIsSlugAvailable(available);
		} else {
			setIsSlugAvailable(null);
		}
	};

	return (
		<SimpleLayout className="flex flex-col items-center justify-center">
			<div className="flex w-full max-w-md flex-col gap-4 rounded-md border border-border p-6">
				<h1 className="text-2xl font-bold tracking-tight">Create a workspace</h1>
				<p className="text-sm text-secondary">
					A workspace can be a space for your team to collaborate or it can just be for you. Don't worry, you can
					change the name or slug anytime.
				</p>
				<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
					<div className="flex flex-col gap-1">
						<label htmlFor="name" className="font-medium">
							Name
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
							Slug
						</label>
						<div className="flex items-center">
							<span className="mr-2 text-sm text-secondary">app.usecloudy.com/workspaces/</span>
							<Input
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
					<Button
						type="submit"
						disabled={createWorkspaceMutation.isPending || !watchSlug || !watchName || !isSlugAvailable}>
						{createWorkspaceMutation.isPending ? (
							<LoadingSpinner size="xs" variant="background" />
						) : (
							"Create Workspace"
						)}
					</Button>
				</form>
			</div>
		</SimpleLayout>
	);
};
