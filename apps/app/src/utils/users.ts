import { handleSupabaseError } from "@cloudy/utils/common";
import { useQuery } from "@tanstack/react-query";

import { userQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";

export const useUserProfile = (userId: string) => {
	return useQuery({
		queryKey: userQueryKeys.userProfile(userId),
		queryFn: async () => {
			return handleSupabaseError(await supabase.from("users").select("name, email").eq("id", userId).single());
		},
	});
};
