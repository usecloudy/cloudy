import { GithubVerifyInstallationResponse, WorkspaceRecord } from "@cloudy/utils/common";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { apiClient } from "src/api/client";
import { Button } from "src/components/Button";
import LoadingSpinner from "src/components/LoadingSpinner";
import { MainLayout } from "src/components/MainLayout";
import { useUser } from "src/stores/user";
import { getAllUserWorkspaces } from "src/stores/workspace";

export const ConnectGithubToWorkspaceView = () => {
	const user = useUser();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { data: allUserWorkspaces } = useQuery({
		queryKey: ["all-user-workspaces"],
		queryFn: async () => await getAllUserWorkspaces(user.id),
	});
	const code = searchParams.get("code");
	const installationId = searchParams.get("installation_id");

	const {
		data: verificationData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["github-verification", code, installationId],
		queryFn: async () => {
			const response = await apiClient.get<GithubVerifyInstallationResponse>(
				"/api/integrations/github/verify-installation",
				{
					params: {
						code,
						installationId,
					},
				},
			);
			return response.data;
		},
		retry: false,
		refetchOnWindowFocus: false,
		enabled: !!(code && installationId),
	});

	const connectWorkspaceMutation = useMutation({
		mutationFn: async (workspaceId: string) => {
			if (!verificationData || !installationId) return;

			await apiClient.post("/api/integrations/github/connect-workspace", {
				workspaceId,
				installationId,
				accessToken: verificationData.accessToken,
			});
		},
	});

	const handleWorkspaceSelect = async (workspace: WorkspaceRecord) => {
		await connectWorkspaceMutation.mutateAsync(workspace.id);
		navigate(`/workspaces/${workspace.slug}`);
	};

	if (isError) {
		return (
			<MainLayout className="flex h-screen flex-col items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<p className="text-secondary">
						Failed to verify the GitHub app installation, try uninstalling and reinstalling the GitHub app.
					</p>
				</div>
			</MainLayout>
		);
	}

	if (isLoading || !verificationData) {
		return (
			<MainLayout className="flex h-screen flex-col items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<LoadingSpinner size="lg" />
					<p className="text-secondary">Verifying GitHub installation...</p>
				</div>
			</MainLayout>
		);
	}

	if (connectWorkspaceMutation.isPending) {
		return (
			<MainLayout className="flex h-screen flex-col items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<LoadingSpinner size="lg" />
					<p className="text-secondary">Connecting GitHub to workspace...</p>
				</div>
			</MainLayout>
		);
	}

	return (
		<MainLayout className="flex h-screen flex-col items-center justify-center">
			<div className="flex w-full max-w-md flex-col gap-4 rounded-md border border-border p-6">
				<h1 className="font-display text-2xl font-bold">Connect GitHub to Workspace</h1>
				<p className="text-sm text-secondary">
					Select which workspace you'd like to connect the GitHub installation for{" "}
					<span className="font-medium">{verificationData.account.login}</span> to:
				</p>
				<div className="flex flex-col gap-2">
					{allUserWorkspaces?.map(workspace => (
						<Button
							key={workspace.id}
							variant="outline"
							className="justify-start"
							onClick={() => handleWorkspaceSelect(workspace)}>
							{workspace.name}
						</Button>
					))}
				</div>
			</div>
		</MainLayout>
	);
};
