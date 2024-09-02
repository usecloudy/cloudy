import * as amplitude from "@amplitude/analytics-browser";
import { PaymentsCustomersStatusGetResponse, handleSupabaseError } from "@cloudy/utils/common";
import { Session, User } from "@supabase/supabase-js";
import { useMutation, useQuery } from "@tanstack/react-query";
import posthog from "posthog-js";
import { useMount } from "react-use";
import { create } from "zustand";

import { apiClient, setupAuthHeader } from "src/api/client";
import { supabase } from "src/clients/supabase";

export const createUserIfNotExists = async (user: User) => {
	return supabase.from("users").upsert({
		id: user.id,
	});
};

const waitForStripeCustomer = () =>
	new Promise<void>(resolve => {
		const interval = setInterval(async () => {
			try {
				const status = await apiClient
					.get<PaymentsCustomersStatusGetResponse>("/api/payments/customers/status")
					.then(res => res.data);
				if (status.customerStatus) {
					clearInterval(interval);
					resolve();
				}
			} catch (error) {}
		}, 1000);
	});

export const useUserStore = create<{
	user: User | null;
	isLoading: boolean;
	isReady: boolean;
	setUser: (user: User | null, isLoading?: boolean) => void;
	setIsReady: (isReady: boolean) => void;
}>(set => ({
	user: null,
	isLoading: true,
	isReady: false,
	setUser: (user, isLoading = false) => set({ user, isLoading }),
	setIsReady: isReady => set({ isReady }),
}));

export const useUser = () => {
	const { user } = useUserStore();
	return user!;
};

export const useUserGuard = () => {
	return useUserStore();
};

export const useUserHandler = () => {
	const { user, setUser, setIsReady } = useUserStore();
	const { mutate: handleSetUser } = useMutation({
		mutationKey: ["handleSetUser"],
		mutationFn: async (session: Session) => {
			setUser(session.user);

			amplitude.setUserId(session.user.id);
			posthog.identify(session.user.id, { email: session.user.email });
			await setupAuthHeader();
			await waitForStripeCustomer();
			setIsReady(true);
		},
	});

	useMount(async () => {
		const handleClearUser = () => {
			setUser(null, false);
			setIsReady(false);
			amplitude.setUserId(undefined);
			posthog.identify(undefined);
		};

		supabase.auth.getSession().then(({ data: { session } }) => {
			if (session?.user) {
				handleSetUser(session);
			} else {
				handleClearUser();
			}
		});

		supabase.auth.onAuthStateChange((event, session) => {
			if (event === "SIGNED_IN") {
				if (session?.user) {
					handleSetUser(session);
				}
			}
			if (event === "SIGNED_OUT") {
				handleClearUser();
			}
		});
	});

	return { user };
};
