import * as amplitude from "@amplitude/analytics-browser";
import { handleSupabaseError } from "@cloudy/utils/common";
import { Session, User } from "@supabase/supabase-js";
import { useMutation } from "@tanstack/react-query";
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

const createStripeCustomerIfNotExists = async () => {
	return apiClient.post("/api/payments/customers/create");
};

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
			const existingUser = useUserStore.getState().user;

			setUser(session.user);

			if ((!existingUser && session.user) || (existingUser && existingUser.id !== session.user.id)) {
				const doesUserExist = await supabase.from("users").select("*").eq("id", session.user.id);
				if (!doesUserExist.data?.at(0)) {
					await createUserIfNotExists(session.user);
				}

				amplitude.setUserId(session.user.id);
				posthog.identify(session.user.id, { email: session.user.email });
				await setupAuthHeader();

				const postgresUser = handleSupabaseError(
					await supabase.from("users").select("*").eq("id", session.user.id).single(),
				);
				if (!postgresUser.stripe_customer_id) {
					await createStripeCustomerIfNotExists();
				}

				setIsReady(true);
			}
		},
	});

	useMount(async () => {
		const handleClearUser = () => {
			setUser(null, false);
			setIsReady(false);
			amplitude.setUserId(undefined);
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
