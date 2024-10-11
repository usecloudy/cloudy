import { ScrapeSiteGetResponse } from "@cloudy/utils/common";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeftIcon, SparklesIcon } from "lucide-react";
import { useState } from "react";
import { useCallback } from "react";
import { UseFormRegister, useForm } from "react-hook-form";
import Markdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

import { apiClient } from "src/api/client";
import { Button } from "src/components/Button";
import { Input } from "src/components/Input";
import LoadingSpinner from "src/components/LoadingSpinner";
import { MainLayout } from "src/components/MainLayout";

import { NameAndSlugFields } from "./Fields";
import { useCreateWorkspace, useUserWorkspaces } from "./hooks";

type FormData = {
	websiteUrl: string;
	name: string;
	slug: string;
	missionBlurb: string | null;
	collectionNames: string[];
};

const useScrapeSite = () => {
	return useMutation({
		mutationFn: async (data: { websiteUrl: string }) => {
			const response = await apiClient.get<ScrapeSiteGetResponse>("/api/ai/scrape-site", {
				params: {
					url: `https://${data.websiteUrl}`,
				},
			});
			return response.data;
		},
	});
};

export const WorkspaceWebsiteOnboardingView = () => {
	const [isScraping, setIsScraping] = useState(false);
	const [status, setStatus] = useState<"initial" | "ready">("initial");
	const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
	const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);

	const { data: userWorkspaces } = useUserWorkspaces();
	const userHasWorkspaces = !!userWorkspaces?.length;

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
	} = useForm<FormData>();

	const createWorkspaceMutation = useCreateWorkspace();
	const scrapeSiteMutation = useScrapeSite();
	const navigate = useNavigate();

	const handlePaste = useCallback(
		(e: React.ClipboardEvent<HTMLInputElement>) => {
			e.preventDefault();
			const pastedText = e.clipboardData.getData("text");
			const urlWithoutProtocol = pastedText.replace(/^(https?:\/\/)/, "");
			setValue("websiteUrl", urlWithoutProtocol);
		},
		[setValue],
	);

	const onSubmit = async (data: FormData) => {
		if (status === "initial") {
			setIsScraping(true);
			try {
				const { name, welcomeMessage, missionBlurb, collectionNames } = await scrapeSiteMutation.mutateAsync({
					websiteUrl: data.websiteUrl,
				});
				setValue("name", name!);
				setValue("slug", name!.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
				setValue("missionBlurb", missionBlurb);
				setValue("collectionNames", collectionNames);
				setWelcomeMessage(welcomeMessage);
				setStatus("ready");
			} catch (error) {
				console.error("Error creating workspace:", error);
				// Handle error (e.g., show error message to user)
			} finally {
				setIsScraping(false);
			}
		} else {
			await createWorkspaceMutation.mutateAsync({
				name: data.name,
				slug: data.slug,
				missionBlurb: data.missionBlurb,
			});
			const urlParams = new URLSearchParams();
			urlParams.set("initialCollections", JSON.stringify(data.collectionNames));
			navigate(`/onboarding/workspaces/${data.slug}/initial-collections?${urlParams.toString()}`);
		}
	};

	const handleSkip = () => {
		navigate("/onboarding/workspaces/new");
	};

	const handleSlugChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		// Add your slug availability check logic here
		setIsSlugAvailable(true); // Placeholder
	};

	const handleBack = () => {
		setStatus("initial");
		setValue("websiteUrl", "");
		setValue("name", "");
		setValue("slug", "");
		setValue("missionBlurb", null);
		setValue("collectionNames", []);
		setIsSlugAvailable(null);
	};

	const isLoading = isScraping || createWorkspaceMutation.isPending;

	return (
		<MainLayout className="flex h-screen flex-col items-center justify-center">
			<div className="flex w-full max-w-md flex-col gap-4 rounded-md border border-border p-6">
				<h1 className="font-display text-2xl font-bold">Create a workspace with your website</h1>
				{status === "initial" ? (
					<p className="text-sm text-secondary">
						Provide your website to pre-populate your workspace. Cloudy will visit your website to build an
						understanding of what your company does.
					</p>
				) : (
					<>
						{welcomeMessage ? (
							<p className="text-sm text-secondary">
								<Markdown>
									{welcomeMessage +
										" We've built an understanding of your company's mission, industry, and more."}
								</Markdown>
							</p>
						) : null}
						<p className="text-sm text-secondary">
							{welcomeMessage ? "" : "Great! "}First, we've pre-populated some information based on your website.
							Please review and adjust if needed.
						</p>
					</>
				)}
				<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
					{status === "initial" ? (
						<div className="flex flex-col gap-1">
							<label htmlFor="websiteUrl" className="font-medium">
								Website URL
							</label>
							<Input
								{...register("websiteUrl", {
									pattern: {
										value: /^([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
										message: "Please enter a valid URL",
									},
								})}
								prefix="https://"
								placeholder="example.com"
								error={!!errors.websiteUrl}
								onPaste={handlePaste}
							/>
							{errors.websiteUrl && <p className="mt-1 text-sm text-red-500">{errors.websiteUrl.message}</p>}
						</div>
					) : (
						<NameAndSlugFields
							register={register as unknown as UseFormRegister<{ name: string; slug: string }>}
							errors={errors}
							isSlugAvailable={isSlugAvailable}
							handleSlugChange={handleSlugChange}
						/>
					)}
					<Button type="submit" disabled={isLoading}>
						<SparklesIcon className="size-4" />
						<span>
							{isLoading ? (
								<LoadingSpinner size="xs" variant="background" />
							) : status === "initial" ? (
								"Read from website"
							) : (
								"Create Workspace"
							)}
						</span>
					</Button>
					{status === "ready" && (
						<Button type="button" variant="secondary" onClick={handleBack}>
							Back
						</Button>
					)}
				</form>
				{status === "initial" && (
					<>
						<Button variant="secondary" onClick={handleSkip} type="button">
							Create manually
						</Button>
						{userHasWorkspaces && (
							<Link to="/">
								<Button variant="ghost" className="w-full text-secondary">
									<ArrowLeftIcon className="size-4" />
									<span>Cancel workspace creation</span>
								</Button>
							</Link>
						)}
					</>
				)}
			</div>
		</MainLayout>
	);
};
