import { PaymentsCustomersStatusGetResponse } from "@cloudy/utils/common";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "src/api/client";
import { useUserGuard } from "src/stores/user";

export const useCustomerStatus = () => {
	const { user } = useUserGuard();

	return useQuery({
		queryKey: ["payments", "customers", "status"],
		queryFn: () =>
			apiClient.get<PaymentsCustomersStatusGetResponse>("/api/payments/customers/status").then(res => res.data),
		enabled: Boolean(user),
	});
};
