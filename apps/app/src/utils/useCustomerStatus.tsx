import { PaymentsCustomersStatusGetResponse } from "@cloudy/utils/common";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "src/api/client";
import { paymentsQueryKeys } from "src/api/queryKeys";
import { useWorkspaceStore } from "src/stores/workspace";

export const useCustomerStatus = () => {
	const { workspace } = useWorkspaceStore();

	return useQuery({
		queryKey: paymentsQueryKeys.customerStatus(workspace?.slug),
		queryFn: () => {
			return apiClient
				.get<PaymentsCustomersStatusGetResponse>("/api/payments/customers/status", {
					params: { wsSlug: workspace!.slug },
				})
				.then(res => {
					return res.data;
				});
		},
		enabled: Boolean(workspace),
		retry: 3,
		refetchInterval: 1000 * 60,
	});
};
