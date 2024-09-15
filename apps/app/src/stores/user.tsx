import * as amplitude from "@amplitude/analytics-browser";
import { PaymentsCustomersStatusGetResponse, UserRecord, handleSupabaseError } from "@cloudy/utils/common";
import * as Sentry from "@sentry/react";
import { Session, User } from "@supabase/supabase-js";
import { useMutation, useQuery } from "@tanstack/react-query";
import posthog from "posthog-js";
import { useEffect } from "react";
import { useMount } from "react-use";
import { create } from "zustand";

import { apiClient, setupAuthHeader } from "src/api/client";
import { supabase } from "src/clients/supabase";

import { getAllUserWorkspaces, useWorkspaceStore } from "./workspace";

export const createUserIfNotExists = async (user: User) => {
	return supabase.from("users").upsert({
		id: user.id,
	});
};

// const waitForStripeCustomer = () =>
// 	new Promise<void>(resolve => {
// 		let iterations = 0;
// 		const interval = setInterval(async () => {
// 			try {
// 				if (iterations >= 8) {
// 					clearInterval(interval);
// 					resolve();
// 					return;
// 				}
// 				const status = await apiClient
// 					.get<PaymentsCustomersStatusGetResponse>("/api/payments/customers/status")
// 					.then(res => res.data);
// 				if (status.customerStatus) {
// 					clearInterval(interval);
// 					resolve();
// 				}
// 				iterations++;
// 			} catch (error) {
// 				iterations++;
// 			}
// 		}, 1000);
// 	});

const useQueryUserRecord = () => {
	const user = useUserStore(s => s.user);
	return useQuery({
		queryKey: [user?.id, "userRecord"],
		queryFn: async () =>
			user ? handleSupabaseError(await supabase.from("users").select("*").eq("id", user.id).single()) : null,
		enabled: !!user,
		refetchInterval: data => (data ? false : 1000),
	});
};

const startTrialIfEligible = async () => {
	const status = await apiClient
		.get<PaymentsCustomersStatusGetResponse>("/api/payments/customers/status")
		.then(res => res.data);
	if (status.customerStatus && !status.customerStatus.isTrialing && status.customerStatus.isEligibleForTrial) {
		await apiClient.post("/api/payments/start-trial");
	}
};

export const useUserStore = create<{
	user: User | null;
	userRecord: UserRecord | null;
	isReady: boolean;
	isLoadingAuth: boolean;
	setUser: (user: User | null) => void;
	setUserRecord: (userRecord: UserRecord | null) => void;
	setIsReady: (isReady: boolean) => void;
	setIsLoadingAuth: (isLoadingAuth: boolean) => void;
}>(set => ({
	user: null,
	userRecord: null,
	isReady: false,
	isLoadingAuth: true,
	setUser: user => set({ user }),
	setUserRecord: userRecord => set({ userRecord }),
	setIsReady: isReady => set({ isReady }),
	setIsLoadingAuth: isLoadingAuth => set({ isLoadingAuth }),
}));

export const useUser = () => {
	const user = useUserStore(s => s.user);
	return user!;
};

export const useUserGuard = () => {
	return useUserStore();
};

export const useUserRecord = () => {
	const userRecord = useUserStore(s => s.userRecord);
	return userRecord!;
};

export const useUserOptions = () => {
	const userRecord = useUserRecord();

	const userMutation = useMutation({
		mutationFn: async (option: { key: string; value: string }) => {
			const options = handleSupabaseError(
				await supabase.from("users").select("options").eq("id", userRecord.id).single(),
			);
			handleSupabaseError(
				await supabase
					.from("users")
					.update({ options: { ...options, [option.key]: option.value } })
					.eq("id", userRecord.id),
			);
		},
	});

	return {
		get: (key: string, defaultValue: any = null) => {
			return (userRecord.options as Record<string, any> | null)?.[key] ?? defaultValue;
		},
		set: async (key: string, value: string) => {
			await userMutation.mutateAsync({ key, value });
		},
	};
};

export const useUserHandler = () => {
	const userStore = useUserStore();
	const workspaceStore = useWorkspaceStore();
	const userRecordQuery = useQueryUserRecord();

	const handleClearUser = () => {
		userStore.setUser(null);
		userStore.setUserRecord(null);
		userStore.setIsReady(false);
		userStore.setIsLoadingAuth(false);

		workspaceStore.setWorkspace(null);
		workspaceStore.setRole(null);

		amplitude.setUserId(undefined);
		posthog.identify(undefined);
	};

	const handleSetUser = async (session: Session) => {
		userStore.setUser(session.user);

		try {
			amplitude.setUserId(session.user.id);
			posthog.identify(session.user.id, { email: session.user.email });
			await setupAuthHeader();
			// await waitForStripeCustomer();
			// await startTrialIfEligible();
			// const workspaceAndRole = await getUserWorkspaceAndRole(session.user.id);
			// setWorkspace(workspaceAndRole.workspace);
			// setRole(workspaceAndRole.role);
		} catch (e) {
			Sentry.captureException(e);
			handleClearUser();
		}

		userStore.setIsLoadingAuth(false);
	};

	useEffect(() => {
		userStore.setUserRecord(userRecordQuery.data ?? null);
		if (userRecordQuery.data) {
			userStore.setIsReady(true);
		}
	}, [userRecordQuery.data]);

	useMount(async () => {
		userStore.setIsLoadingAuth(true);
		supabase.auth.getSession().then(({ data: { session } }) => {
			if (session?.user) {
				handleSetUser(session);
			} else {
				handleClearUser();
			}
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			if (event === "SIGNED_IN") {
				if (session?.user) {
					handleSetUser(session);
				}
			}
			if (event === "SIGNED_OUT") {
				handleClearUser();
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	});
};

export const useAllUserWorkspaces = () => {
	const user = useUser();
	return useQuery({
		queryKey: ["userWorkspaces"],
		queryFn: () => getAllUserWorkspaces(user.id),
	});
};
