import { checkIfSlugIsAvailable, createNonConflictingSlug } from "@cloudy/utils/common";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
import posthog from "posthog-js";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useMount } from "react-use";

import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import LoadingSpinner from "src/components/LoadingSpinner";
import { MainLayout } from "src/components/MainLayout";
import { useUserRecord } from "src/stores/user";
import { makeWorkspaceHomeUrl } from "src/utils/workspaces";

import { NameAndSlugFields } from "./Fields";
import { useCreateWorkspace, useUserWorkspaces } from "./hooks";

type FormData = {
	name: string;
	slug: string;
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
	const { data: userWorkspaces } = useUserWorkspaces();

	// const nameFromParams = searchParams.get("name");
	const shouldSetDefaults = !userWorkspaces;

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

	const userHasWorkspaces = userWorkspaces && userWorkspaces.length > 0;

	useMount(async () => {
		if (shouldSetDefaults) {
			const defaultName = userRecord.name;
			if (defaultName) {
				const defaultSlug = await slugMutation.mutateAsync(defaultName);
				setValue("slug", defaultSlug);
				setIsSlugAvailable(true);
			}
		}
	});

	const onSubmit = async (data: FormData) => {
		const { wsSlug } = await createWorkspaceMutation.mutateAsync(data);

		posthog.capture("workspace_created", {
			workspace_id: wsSlug,
			user_id: userRecord.id,
			is_setup: !userHasWorkspaces,
		});

		navigate(makeWorkspaceHomeUrl(wsSlug));
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

	// const handleCreateWithWebsite = () => {
	// 	navigate("/onboarding/workspaces/new/website-onboarding");
	// };

	return (
		<MainLayout className="flex h-screen flex-col items-center justify-center">
			<div className="flex w-full max-w-md flex-col gap-4 rounded-md border border-border p-6">
				<h1 className="font-display text-2xl font-bold">Create a workspace</h1>
				<p className="text-sm text-secondary">
					A workspace can be a space for your team to collaborate or it can just be for you. Don't worry, you can
					change the name or slug anytime.
				</p>
				<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
					<NameAndSlugFields
						register={register}
						errors={errors}
						isSlugAvailable={isSlugAvailable}
						handleSlugChange={handleSlugChange}
					/>
					<Button
						type="submit"
						disabled={createWorkspaceMutation.isPending || !watchSlug || !watchName || !isSlugAvailable}>
						{createWorkspaceMutation.isPending ? (
							<LoadingSpinner size="xs" variant="background" />
						) : (
							"Create Workspace"
						)}
					</Button>
					{/* <Button variant="secondary" onClick={handleCreateWithWebsite} className="text-accent">
						<SparklesIcon className="size-4" />
						<span>Create with website</span>
					</Button> */}
				</form>
				{userHasWorkspaces && (
					<Link to="/">
						<Button variant="ghost" className="w-full text-secondary">
							<ArrowLeftIcon className="size-4" />
							<span>Cancel workspace creation</span>
						</Button>
					</Link>
				)}
			</div>
		</MainLayout>
	);
};
