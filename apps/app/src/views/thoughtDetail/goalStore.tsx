import { create } from "zustand";

import { supabase } from "src/clients/supabase";

interface GoalStore {
	goal: string;
	isLoading: boolean;
	error: string | null;
	saveGoalKey: number;
	setGoal: (goal: string, saveGoal?: boolean) => void;
	fetchGoalSuggestion: (thoughtId: string) => Promise<void>;
}

export const useGoalStore = create<GoalStore>((set, get) => ({
	goal: "",
	isLoading: false,
	error: null,
	saveGoalKey: 0,
	setGoal: (goal: string, saveGoal?: boolean) =>
		set({
			goal,
			saveGoalKey: saveGoal ? get().saveGoalKey + 1 : get().saveGoalKey,
		}),
	fetchGoalSuggestion: async (thoughtId: string) => {
		set({ isLoading: true, error: null });
		try {
			const response = await fetch(`/api/ai/suggest-goal`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
				},
				body: JSON.stringify({ thoughtId }),
			});
			const data = await response.json();
			if (data.success) {
				set({ goal: data.goal, isLoading: false });
			} else {
				throw new Error(data.reason || "Failed to get goal suggestion");
			}
		} catch (error) {
			set({ error: error instanceof Error ? error.message : "An unknown error occurred", isLoading: false });
		}
	},
}));
