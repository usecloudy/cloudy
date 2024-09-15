import { PaymentsCustomersStatusGetResponse } from "@cloudy/utils/common";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "src/api/client";
import { useWorkspaceStore } from "src/stores/workspace";

export const useCustomerStatus = () => {
	const { workspace } = useWorkspaceStore();

	return useQuery({
		queryKey: [workspace?.slug, "payments", "customers", "status"],
		queryFn: () =>
			apiClient
				.get<PaymentsCustomersStatusGetResponse>("/api/payments/customers/status", {
					params: { wsSlug: workspace!.slug },
				})
				.then(res => res.data),
		enabled: Boolean(workspace),
		retry: 3,
	});
};
