import * as amplitude from "@amplitude/analytics-browser";
import { Session, User } from "@supabase/supabase-js";
import { useMount } from "react-use";
import { create } from "zustand";

import { setupAuthHeader } from "src/api/client";
import { supabase } from "src/clients/supabase";

export const createUserIfNotExists = async (user: User) => {
	return supabase.from("users").upsert({
		id: user.id,
	});
};

export const useUserStore = create<{
	user: User | null;
	isLoading: boolean;
	setUser: (user: User | null) => void;
}>(set => ({
	user: null,
	isLoading: true,
	setUser: user => set({ user, isLoading: false }),
}));

export const useUser = () => {
	const { user } = useUserStore();
	return user!;
};

export const useUserGuard = () => {
	const { user, isLoading } = useUserStore();
	return { user, isLoading };
};

export const useUserHandler = () => {
	const { user, setUser } = useUserStore();

	useMount(async () => {
		const handleSetUser = async (session: Session) => {
			setUser(session.user);

			const doesUserExist = await supabase.from("users").select("*").eq("id", session.user.id);
			if (!doesUserExist.data?.at(0)) {
				createUserIfNotExists(session.user);
			}

			amplitude.setUserId(session.user.id);
			setupAuthHeader();
		};

		const handleClearUser = () => {
			setUser(null);
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
