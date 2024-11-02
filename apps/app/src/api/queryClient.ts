import { QueryClient, QueryFunctionContext } from "@tanstack/react-query";

import { apiClient } from "./client";

const defaultQueryFn = async ({ queryKey }: QueryFunctionContext) => {
	const { data } = await apiClient.get(`${queryKey[0]}`);
	return data;
};

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			queryFn: defaultQueryFn,
		},
		mutations: {
			throwOnError: true,
		},
	},
});
