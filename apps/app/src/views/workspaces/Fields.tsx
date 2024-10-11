import { VALID_WORKSPACE_SLUG_CHARS } from "@cloudy/utils/common";
import { FieldErrors, UseFormRegister } from "react-hook-form";

import { Input } from "src/components/Input";

export const NameAndSlugFields = ({
	register,
	errors,
	isSlugAvailable,
	handleSlugChange,
}: {
	register: UseFormRegister<{ name: string; slug: string }>;
	errors: FieldErrors<{ name: string; slug: string }>;
	isSlugAvailable?: boolean | null;
	handleSlugChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
	return (
		<>
			<div className="flex flex-col gap-1">
				<label htmlFor="name" className="font-medium">
					Workspace Name
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
					Workspace Slug
				</label>
				<div className="flex items-center">
					<Input
						prefix="app.usecloudy.com/workspaces/"
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
		</>
	);
};
