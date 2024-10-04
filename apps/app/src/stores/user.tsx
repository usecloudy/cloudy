import * as amplitude from "@amplitude/analytics-browser";
import { PaymentsCustomersStatusGetResponse, handleSupabaseError } from "@cloudy/utils/common";
import * as Sentry from "@sentry/react";
import { Session, User } from "@supabase/supabase-js";
import { useMutation, useQuery } from "@tanstack/react-query";
import posthog from "posthog-js";
import { useCallback, useEffect, useMemo } from "react";
import { useMount } from "react-use";
import { create } from "zustand";

import { apiClient, setupAuthHeader } from "src/api/client";
import { queryClient } from "src/api/queryClient";
import { userQueryKeys } from "src/api/queryKeys";
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
		queryKey: userQueryKeys.userRecord(user?.id),
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
	isReady: boolean;
	isLoadingAuth: boolean;
	setUser: (user: User | null) => void;
	setIsReady: (isReady: boolean) => void;
	setIsLoadingAuth: (isLoadingAuth: boolean) => void;
}>(set => ({
	user: null,
	isReady: false,
	isLoadingAuth: true,
	setUser: user => set({ user }),
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
	const { data: userRecord } = useQueryUserRecord();

	return userRecord!;
};

export const useUserOptions = () => {
	const userRecord = useUserRecord();

	const userMutation = useMutation({
		mutationFn: async (option: { key: string; value: string | null }) => {
			const { options } = handleSupabaseError(
				await supabase.from("users").select("options").eq("id", userRecord.id).single(),
			);
			handleSupabaseError(
				await supabase
					.from("users")
					.update({ options: { ...(options as Record<string, any>), [option.key]: option.value } })
					.eq("id", userRecord.id),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: userQueryKeys.userRecord(userRecord.id) });
		},
	});

	return useMemo(
		() => ({
			get: (key: string, defaultValue: any = null) => {
				return (userRecord.options as Record<string, any> | null)?.[key] ?? defaultValue;
			},
			set: async (key: string, value: string | null) => {
				await userMutation.mutateAsync({ key, value });
			},
		}),
		[userRecord, userMutation],
	);
};

// const useRefreshSession = () => {
// 	const handleAutoRefresh = useCallback(() => {
// 		if (document.visibilityState === "visible") {
// 			supabase.auth.startAutoRefresh();
// 		} else {
// 			supabase.auth.stopAutoRefresh();
// 		}
// 	}, []);

// 	useEffect(() => {
// 		// Initial call to set the correct state
// 		handleAutoRefresh();

// 		// Add event listener for visibility change
// 		document.addEventListener("visibilitychange", handleAutoRefresh);

// 		// Cleanup
// 		return () => {
// 			document.removeEventListener("visibilitychange", handleAutoRefresh);
// 			supabase.auth.stopAutoRefresh();
// 		};
// 	}, [handleAutoRefresh]);
// };

const useRefreshSessionHeader = () => {
	useEffect(() => {
		const interval = setInterval(() => {
			setupAuthHeader();
		}, 15000);

		return () => clearInterval(interval);
	}, []);
};

export const useUserHandler = () => {
	const userStore = useUserStore();
	const workspaceStore = useWorkspaceStore();
	const userRecordQuery = useQueryUserRecord();

	useRefreshSessionHeader();

	const handleClearUser = () => {
		userStore.setUser(null);
		userStore.setIsReady(false);
		userStore.setIsLoadingAuth(false);

		workspaceStore.setWorkspace(null);
		workspaceStore.setRole(null);

		queryClient.clear();

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
