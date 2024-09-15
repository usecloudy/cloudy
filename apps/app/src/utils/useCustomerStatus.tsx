import { PaymentsCustomersStatusGetResponse } from "@cloudy/utils/common";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "src/api/client";
import { useOrganizationStore } from "src/stores/organization";

export const useCustomerStatus = () => {
	const { organization } = useOrganizationStore();

	return useQuery({
		queryKey: [organization?.slug, "payments", "customers", "status"],
		queryFn: () =>
			apiClient
				.get<PaymentsCustomersStatusGetResponse>("/api/payments/customers/status", {
					params: { orgSlug: organization!.slug },
				})
				.then(res => res.data),
		enabled: Boolean(organization),
		retry: 3,
	});
};
