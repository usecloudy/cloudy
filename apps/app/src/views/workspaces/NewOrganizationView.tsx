import { OrganizationsNewPostResponse } from "@cloudy/utils/common";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { apiClient } from "src/api/client";
import { queryClient } from "src/api/queryClient";
import { Button } from "src/components/Button";
import { Input } from "src/components/Input";
import LoadingSpinner from "src/components/LoadingSpinner";
import { SimpleLayout } from "src/components/SimpleLayout";

type FormData = {
	name: string;
	slug: string;
};

const useCreateOrganization = () => {
	return useMutation({
		mutationFn: async (data: FormData) => {
			const workspace = await apiClient.post<OrganizationsNewPostResponse>("/api/workspaces/new", data);
			return workspace.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["userOrganizations"] });
		},
	});
};

export const NewOrganizationView = () => {
	const {
		register,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<FormData>();
	const { mutateAsync: createOrganization, isPending } = useCreateOrganization();
	const navigate = useNavigate();

	const onSubmit = async (data: FormData) => {
		const { wsSlug } = await createOrganization(data);

		navigate(`/workspaces/${wsSlug}`);
	};

	const watchSlug = watch("slug");
	const watchName = watch("name");

	return (
		<SimpleLayout className="flex flex-col items-center justify-center">
			<div className="flex flex-col gap-4 border border-border p-6 rounded-md w-full max-w-md">
				<h1 className="text-2xl font-bold font-display">Create new workspace</h1>
				<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
					<div className="flex flex-col gap-1">
						<label htmlFor="name">Workspace name</label>
						<Input
							{...register("name", { required: "Organization name is required" })}
							placeholder="Brain Fog Inc."
							error={!!errors.name}
						/>
						{errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
					</div>
					<div className="flex flex-col gap-1">
						<label htmlFor="slug">Workspace slug</label>
						<div className="flex items-center">
							<span className="text-secondary mr-2 text-sm">app.usecloudy.com/workspaces/</span>
							<Input
								{...register("slug", {
									required: "Slug is required",
									pattern: {
										value: /^[a-z0-9-]+$/,
										message: "Slug can only contain lowercase letters, numbers, and hyphens",
									},
								})}
								placeholder="brain-fog-inc"
								className="flex-grow"
								error={!!errors.slug}
							/>
						</div>
						{errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>}
					</div>
					<Button type="submit" disabled={isPending || !watchSlug || !watchName}>
						{isPending ? <LoadingSpinner size="xs" variant="background" /> : "Create Workspace"}
					</Button>
				</form>
			</div>
		</SimpleLayout>
	);
};
