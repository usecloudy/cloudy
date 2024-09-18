import { Tag } from "@cloudy/ui";
import { formatCurrency, handleSupabaseError } from "@cloudy/utils/common";
import { WorkspaceRole } from "@cloudy/utils/common";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CircleFadingArrowUpIcon, CreditCardIcon, UserPlus2Icon, UserRoundMinusIcon, XIcon } from "lucide-react";
import posthog from "posthog-js";
import { useEffect } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import { apiClient } from "src/api/client";
import { queryClient } from "src/api/queryClient";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { Input } from "src/components/Input";
import LoadingSpinner from "src/components/LoadingSpinner";
import { SelectDropdown, SelectOption } from "src/components/SelectDropdown";
import { SimpleLayout } from "src/components/SimpleLayout";
import { useUser } from "src/stores/user";
import { useWorkspace, useWorkspaceRole, useWorkspaceSlug } from "src/stores/workspace";
import { pluralize } from "src/utils/strings";
import { useCustomerStatus } from "src/utils/useCustomerStatus";

import { useSubscriptionModalStore } from "../pricing/subscriptionModalStore";

interface FormData {
	name: string;
	slug: string;
}

const useUpdateWorkspace = () => {
	const workspace = useWorkspace();
	return useMutation({
		mutationFn: async (data: FormData) => {
			const newOrg = await supabase.from("workspaces").update(data).eq("id", workspace.id).select().single();
			return newOrg;
		},
	});
};

const useBillingPortal = () => {
	const wsSlug = useWorkspaceSlug();

	return useQuery({
		queryKey: [wsSlug, "billingPortal"],
		queryFn: async () => {
			const res = await apiClient.get<{ url: string }>(`/api/payments/billing`, {
				params: {
					wsSlug,
					returnUrl: window.location.href,
				},
			});
			return res.data;
		},
	});
};

const useWorkspaceMembers = () => {
	const workspace = useWorkspace();

	return useQuery({
		queryKey: [workspace.slug, "members"],
		queryFn: async () => {
			const users = handleSupabaseError(
				await supabase
					.from("workspace_users")
					.select("user:users(id, name, email), role")
					.eq("workspace_id", workspace.id)
					.order("created_at", { ascending: true }),
			);
			return users.filter(user => user.user !== null) as {
				user: NonNullable<(typeof users)[number]["user"]>;
				role: string;
			}[];
		},
	});
};

const usePendingInvites = () => {
	const workspace = useWorkspace();

	return useQuery({
		queryKey: [workspace.slug, "pendingInvites"],
		queryFn: async () => {
			const invites = handleSupabaseError(
				await supabase.from("user_pending_invites").select("*, user:users(email)").eq("workspace_id", workspace.id),
			);
			return invites;
		},
	});
};

const useRemoveMember = () => {
	const workspace = useWorkspace();
	return useMutation({
		mutationFn: async (userId: string) => {
			await supabase.from("workspace_users").delete().eq("workspace_id", workspace.id).eq("user_id", userId);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [workspace.slug, "members"] });
		},
	});
};

const useAddMember = () => {
	const workspace = useWorkspace();

	return useMutation({
		mutationFn: async (email: string) => {
			const user = handleSupabaseError(
				await supabase.from("users").select("id,is_pending").eq("email", email).maybeSingle(),
			);
			if (user && !user.is_pending) {
				await supabase.from("workspace_users").insert({
					workspace_id: workspace.id,
					user_id: user.id,
					role: WorkspaceRole.MEMBER,
				});

				posthog.capture("workspace_member_added", {
					workspace_id: workspace.id,
					user_id: user.id,
				});

				return { added: true };
			} else {
				await apiClient.post("/api/workspaces/members/invite", {
					email,
					workspaceId: workspace.id,
				});

				posthog.capture("workspace_member_invited", {
					workspace_id: workspace.id,
					email,
				});

				return { added: false, invited: true };
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [workspace.slug, "members"] });
			queryClient.invalidateQueries({ queryKey: [workspace.slug, "pendingInvites"] });
		},
	});
};

const useUpdateMemberRole = () => {
	const workspace = useWorkspace();
	return useMutation({
		mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
			await supabase.from("workspace_users").update({ role }).eq("workspace_id", workspace.id).eq("user_id", userId);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [workspace.slug, "members"] });
		},
	});
};

const useDeletePendingInvite = () => {
	const workspace = useWorkspace();
	return useMutation({
		mutationFn: async (inviteId: string) => {
			await supabase.from("user_pending_invites").delete().eq("id", inviteId).eq("workspace_id", workspace.id);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [workspace.slug, "pendingInvites"] });
		},
	});
};

export const WorkspaceSettingsView = () => {
	const workspace = useWorkspace();
	const currentUser = useUser();
	const role = useWorkspaceRole();

	const { data: customerStatus } = useCustomerStatus();
	const { data: billingPortalUrl } = useBillingPortal();
	const { data: members } = useWorkspaceMembers();
	const { data: pendingInvites } = usePendingInvites();
	const { mutate: deletePendingInvite } = useDeletePendingInvite();

	const { mutate: removeMember } = useRemoveMember();
	const { mutate: addMember, isPending: isAddingMember } = useAddMember();
	const { mutate: updateMemberRole } = useUpdateMemberRole();

	const [newMemberEmail, setNewMemberEmail] = useState("");

	const {
		register,
		handleSubmit,
		watch,
		reset,
		formState: { errors },
	} = useForm<FormData>({
		defaultValues: {
			name: workspace.name,
			slug: workspace.slug,
		},
	});

	const { setIsOpen: setShowSubscriptionModal } = useSubscriptionModalStore();

	const handleOpenSubscriptionModal = () => {
		setShowSubscriptionModal(true, true);
	};

	const { mutateAsync: updateWorkspace, isPending } = useUpdateWorkspace();

	const onSubmit = async (data: FormData) => {
		await updateWorkspace(data);
	};

	useEffect(() => {
		reset({
			name: workspace.name,
			slug: workspace.slug,
		});
	}, [workspace]);

	const watchSlug = watch("slug");
	const watchName = watch("name");

	const handleAddMember = () => {
		if (newMemberEmail) {
			addMember(newMemberEmail, {
				onSuccess: result => {
					if (result.added) {
						// Show success message
						alert("Member added successfully");
					} else if (result.invited) {
						// Show invitation sent message
						alert("Invitation email sent");
					}
					setNewMemberEmail("");
				},
			});
		}
	};

	const roleOptions: SelectOption[] = [
		{ value: WorkspaceRole.OWNER, label: "Owner" },
		{ value: WorkspaceRole.MEMBER, label: "Member" },
	];

	const handleRoleChange = (userId: string, newRole: string) => {
		updateMemberRole({ userId, role: newRole });
	};

	const isOwner = role === WorkspaceRole.OWNER;

	return (
		<SimpleLayout className="flex flex-col items-center justify-center">
			<div className="flex flex-col gap-4 border border-border p-6 rounded-md w-full max-w-md">
				<h1 className="text-2xl font-bold font-display">Workspace settings</h1>
				<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
					<div className="flex flex-col gap-1">
						<label htmlFor="name">Workspace name</label>
						<Input
							{...register("name", { required: "Workspace name is required" })}
							placeholder="Brain Fog Inc."
							error={!!errors.name}
							disabled={!isOwner}
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
								disabled={!isOwner}
							/>
						</div>
						{errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>}
					</div>
					{isOwner && (
						<Button type="submit" disabled={isPending || !watchSlug || !watchName}>
							{isPending ? <LoadingSpinner size="xs" variant="background" /> : "Save Changes"}
						</Button>
					)}
				</form>
				<div className="flex flex-col gap-2">
					<h2 className="text-lg font-bold font-display">Members</h2>
					<div className="flex flex-col gap-4">
						{members?.map(member => {
							const isCurrentUser = member.user.id === currentUser.id;
							return (
								<div key={member.user.id} className="flex flex-row gap-2 items-center justify-between">
									<div className="flex flex-col">
										<span className="text-sm">{member.user.name || "-"}</span>
										<span className="text-secondary text-sm">{member.user.email}</span>
									</div>

									<div className="flex flex-row gap-2 items-center">
										<SelectDropdown
											options={roleOptions}
											value={member.role}
											onChange={newRole => handleRoleChange(member.user.id, newRole)}
											size="sm"
											disabled={!isOwner}
										/>
										{!isCurrentUser && (
											<Button
												variant="outline"
												size="icon-sm"
												onClick={() => removeMember(member.user.id)}
												disabled={!isOwner}>
												<UserRoundMinusIcon className="size-4" />
											</Button>
										)}
									</div>
								</div>
							);
						})}
						{pendingInvites?.map(invite => (
							<div key={invite.id} className="flex flex-row gap-2 items-center justify-between">
								<div className="flex flex-col gap-1 text-sm text-secondary">
									<span>{invite.user!.email}</span>
								</div>
								<div className="flex flex-row gap-2 items-center">
									<span className="text-xs text-secondary font-medium">Pending</span>
									{isOwner && (
										<Button variant="outline" size="icon-sm" onClick={() => deletePendingInvite(invite.id)}>
											<XIcon className="size-4" />
										</Button>
									)}
								</div>
							</div>
						))}
					</div>
					{isOwner && (
						<div className="flex flex-col gap-2">
							<span className="text-sm font-medium">Add a Member</span>
							<div className="flex flex-row gap-2 items-center">
								<Input
									placeholder="anyone@email.com"
									value={newMemberEmail}
									onChange={e => setNewMemberEmail(e.target.value)}
									className="flex-grow"
								/>
								<Button
									variant="outline"
									onClick={handleAddMember}
									disabled={isAddingMember || !newMemberEmail}>
									<UserPlus2Icon className="size-4" />
									<span>{isAddingMember ? <LoadingSpinner size="xs" variant="primary" /> : "Add"}</span>
								</Button>
							</div>
						</div>
					)}
				</div>
				<div className="flex flex-col gap-2">
					<div className="flex flex-row gap-1 items-center">
						<h2 className="text-lg font-bold font-display">Subscription Plan</h2>
						<Tag>
							{customerStatus?.customerStatus?.isActive ? (
								customerStatus.customerStatus.isTrialing ? (
									<span className="text-secondary">Trial</span>
								) : (
									<span className="text-green-600">Active</span>
								)
							) : (
								<span className="text-red-600">Inactive</span>
							)}
						</Tag>
					</div>
					<div>
						{pluralize(customerStatus?.customerStatus?.unitCount ?? 0, "user")} @{" "}
						{formatCurrency(customerStatus?.customerStatus?.unitPrice ?? 0)}/seat ={" "}
						{formatCurrency(customerStatus?.customerStatus?.totalPrice ?? 0)}
						{" monthly charges"}
					</div>
					{isOwner ? (
						customerStatus?.customerStatus?.isActive && !customerStatus.customerStatus.isTrialing ? (
							<Link to={billingPortalUrl?.url ?? ""}>
								<Button variant="outline">
									<CreditCardIcon className="size-4" />
									<span>Manage Subscription</span>
								</Button>
							</Link>
						) : (
							<Button variant="outline" onClick={handleOpenSubscriptionModal} className="self-start text-accent">
								<CircleFadingArrowUpIcon className="size-4" />
								<span>Subscribe</span>
							</Button>
						)
					) : null}
				</div>
			</div>
		</SimpleLayout>
	);
};
