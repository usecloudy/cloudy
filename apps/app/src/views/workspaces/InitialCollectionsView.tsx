import { handleSupabaseError } from "@cloudy/utils/common";
import { useMutation } from "@tanstack/react-query";
import { PlusIcon, XIcon } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";

import { queryClient } from "src/api/queryClient";
import { collectionQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { Input } from "src/components/Input";
import { MainLayout } from "src/components/MainLayout";
import { useWorkspace } from "src/stores/workspace";

type FormData = {
	collections: { name: string }[];
};

const defaultCollections = ["Ideation", "Tech Specs", "Interviews"];

const useCreateCollections = () => {
	const workspace = useWorkspace();
	return useMutation({
		mutationFn: async (data: FormData) => {
			handleSupabaseError(
				await supabase.from("collections").insert(
					data.collections.map(collection => ({
						title: collection.name,
						workspace_id: workspace.id,
					})),
				),
			);
			handleSupabaseError(await supabase.from("workspaces").update({ onboarding_status: "done" }).eq("id", workspace.id));
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionQueryKeys.workspaceCollections(workspace.id) });
		},
	});
};

const useSkipOnboarding = () => {
	const workspace = useWorkspace();
	return useMutation({
		mutationFn: async () => {
			handleSupabaseError(await supabase.from("workspaces").update({ onboarding_status: "done" }).eq("id", workspace.id));
		},
	});
};

export const InitialCollectionsView = () => {
	const [searchParams] = useSearchParams();
	const initialCollections = searchParams.get("initialCollections")
		? JSON.parse(searchParams.get("initialCollections")!)
		: defaultCollections;

	const navigate = useNavigate();
	const workspace = useWorkspace();

	const { control, handleSubmit, register } = useForm<FormData>({
		defaultValues: {
			collections: initialCollections.map((name: string) => ({ name })),
		},
	});

	const { fields, append, remove } = useFieldArray({
		control,
		name: "collections",
	});

	const createCollectionsMutation = useCreateCollections();
	const skipOnboardingMutation = useSkipOnboarding();

	const onSubmit = async (data: FormData) => {
		await createCollectionsMutation.mutateAsync(data);
		navigate(`/workspaces/${workspace.slug}`);
	};

	const handleSkip = async () => {
		await skipOnboardingMutation.mutateAsync();
		navigate(`/workspaces/${workspace.slug}`);
	};

	return (
		<MainLayout className="flex h-screen flex-col items-center justify-center">
			<div className="flex w-full max-w-md flex-col gap-4 rounded-md border border-border p-6">
				<h1 className="font-display text-2xl font-bold">Create initial collections</h1>
				<p className="text-sm text-secondary">
					Start with some common collections for your notes or create your own. You can always add or remove
					collections later.
				</p>
				<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
					<div className="mb-4 flex flex-col gap-2">
						{fields.map((field, index) => (
							<div key={field.id} className="flex items-center gap-2">
								<Input
									{...register(`collections.${index}.name` as const, { required: true })}
									placeholder="Collection name"
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									onClick={() => remove(index)}
									className="text-secondary">
									<XIcon className="size-4" />
								</Button>
							</div>
						))}
						<Button
							type="button"
							variant="secondary"
							onClick={() => append({ name: "" })}
							className="flex items-center justify-start">
							<PlusIcon className="size-4" />
							Add Collection
						</Button>
					</div>
					<Button type="submit" disabled={createCollectionsMutation.isPending}>
						{createCollectionsMutation.isPending ? "Creating..." : "Create Collections"}
					</Button>
					<Button type="button" variant="secondary" onClick={handleSkip} disabled={skipOnboardingMutation.isPending}>
						{skipOnboardingMutation.isPending ? "Skipping..." : "Skip for now"}
					</Button>
				</form>
			</div>
		</MainLayout>
	);
};
