import { Tag } from "@cloudy/ui";
import { handleSupabaseError } from "@cloudy/utils/common";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CircleFadingArrowUpIcon, CreditCardIcon, UserPlus2Icon, UserRoundMinusIcon } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { apiClient } from "src/api/client";
import { queryClient } from "src/api/queryClient";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { Input } from "src/components/Input";
import LoadingSpinner from "src/components/LoadingSpinner";
import { SimpleLayout } from "src/components/SimpleLayout";
import { useOrganization, useOrganizationSlug, useOrganizationStore } from "src/stores/organization";
import { useUser } from "src/stores/user";
import { pluralize } from "src/utils/strings";
import { useCustomerStatus } from "src/utils/useCustomerStatus";

import { useSubscriptionModalStore } from "../pricing/subscriptionModalStore";
import { AddMembersModal } from "./AddMembersModal";

interface FormData {
	name: string;
	slug: string;
}

const useUpdateOrganization = () => {
	const org = useOrganization();
	return useMutation({
		mutationFn: async (data: FormData) => {
			const newOrg = await supabase.from("organizations").update(data).eq("id", org.id).select().single();
			return newOrg;
		},
	});
};

const useBillingPortal = () => {
	const orgSlug = useOrganizationSlug();

	return useQuery({
		queryKey: [orgSlug, "billingPortal"],
		queryFn: async () => {
			const res = await apiClient.get<{ url: string }>(`/api/payments/billing`, {
				params: {
					orgSlug,
					returnUrl: window.location.href,
				},
			});
			return res.data;
		},
	});
};

const useOrganizationMembers = () => {
	const org = useOrganization();

	return useQuery({
		queryKey: [org.slug, "members"],
		queryFn: async () => {
			const users = handleSupabaseError(
				await supabase
					.from("organization_users")
					.select("user:users(id, name, email), role")
					.eq("organization_id", org.id),
			);
			return users.filter(user => user.user !== null) as {
				user: NonNullable<(typeof users)[number]["user"]>;
				role: string;
			}[];
		},
	});
};

const useRemoveMember = () => {
	const org = useOrganization();
	return useMutation({
		mutationFn: async (userId: string) => {
			await supabase.from("organization_users").delete().eq("organization_id", org.id).eq("user_id", userId);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [org.slug, "members"] });
		},
	});
};

export const OrganizationSettingsView = () => {
	const org = useOrganization();
	const currentUser = useUser();

	const { data: customerStatus } = useCustomerStatus();
	const { data: billingPortalUrl } = useBillingPortal();
	const { data: members } = useOrganizationMembers();
	const { mutate: removeMember } = useRemoveMember();

	const {
		register,
		handleSubmit,
		watch,
		reset,
		formState: { errors },
	} = useForm<FormData>({
		defaultValues: {
			name: org.name,
			slug: org.slug,
		},
	});

	const { setIsOpen: setShowSubscriptionModal } = useSubscriptionModalStore();

	const handleOpenSubscriptionModal = () => {
		setShowSubscriptionModal(true, true);
	};

	const { mutateAsync: updateOrganization, isPending } = useUpdateOrganization();

	const onSubmit = async (data: FormData) => {
		await updateOrganization(data);
	};

	useEffect(() => {
		reset({
			name: org.name,
			slug: org.slug,
		});
	}, [org]);

	const watchSlug = watch("slug");
	const watchName = watch("name");

	return (
		<SimpleLayout className="flex flex-col items-center justify-center">
			<div className="flex flex-col gap-4 border border-border p-6 rounded-md w-full max-w-md">
				<h1 className="text-2xl font-bold font-display">Organization settings</h1>
				<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
					<div className="flex flex-col gap-1">
						<label htmlFor="name">Organization name</label>
						<Input
							{...register("name", { required: "Organization name is required" })}
							placeholder="Brain Fog Inc."
							error={!!errors.name}
						/>
						{errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
					</div>
					<div className="flex flex-col gap-1">
						<label htmlFor="slug">Organization slug</label>
						<div className="flex items-center">
							<span className="text-secondary mr-2 text-sm">app.usecloudy.com/organizations/</span>
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
						{isPending ? <LoadingSpinner size="xs" variant="background" /> : "Save Changes"}
					</Button>
				</form>
				<div className="flex flex-col gap-2">
					<h2 className="text-lg font-bold font-display">Members</h2>
					<div className="flex flex-col gap-2">
						{members?.map(member => (
							<div key={member.user.id} className="flex flex-row gap-2 items-center justify-between">
								<div className="flex flex-col gap-1">
									<span>{member.user.name}</span>
									<span className="text-secondary text-sm">{member.user.email}</span>
								</div>
								<div className="flex flex-row gap-2 items-center">
									<span className="text-sm">{member.role}</span>
									{member.user.id !== currentUser.id && (
										<Button
											variant="outline"
											size="icon-sm"
											onClick={() => removeMember(member.user.id)}
											disabled>
											<UserRoundMinusIcon className="size-4" />
										</Button>
									)}
								</div>
							</div>
						))}
					</div>
					<div className="flex flex-col gap-1">
						<AddMembersModal />
						<span className="text-secondary text-xs">*Multi-user support is coming soon!</span>
					</div>
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
					<div>{pluralize(customerStatus?.userCount ?? 0, "user")}</div>
					{customerStatus?.customerStatus?.isActive && !customerStatus.customerStatus.isTrialing ? (
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
					)}
				</div>
			</div>
		</SimpleLayout>
	);
};
