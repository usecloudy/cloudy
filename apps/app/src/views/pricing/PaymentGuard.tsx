import { Pricing, Tag } from "@cloudy/ui";
import { PaymentsProductsGetResponse } from "@cloudy/utils/common";
import { useMutation, useQuery } from "@tanstack/react-query";
import { XIcon } from "lucide-react";
import posthog from "posthog-js";
import { useEffect } from "react";

import { apiClient } from "src/api/client";
import { queryClient } from "src/api/queryClient";
import { Button } from "src/components/Button";
import { Dialog, DialogContent } from "src/components/Dialog";
import LoadingSpinner from "src/components/LoadingSpinner";
import { useWorkspaceSlug, useWorkspaceStore } from "src/stores/workspace";
import { useCustomerStatus } from "src/utils/useCustomerStatus";

import { useSubscriptionModalStore } from "./subscriptionModalStore";

const useProducts = () => {
	return useQuery({
		queryKey: ["payments", "products"],
		queryFn: () => apiClient.get<PaymentsProductsGetResponse>("/api/payments/products").then(res => res.data),
	});
};

const useCheckout = () => {
	const wsSlug = useWorkspaceSlug();
	return useMutation({
		mutationFn: async (priceId: string) => {
			const res = await apiClient
				.get<{ url: string }>(`/api/payments/checkout`, {
					params: {
						wsSlug,
						priceId,
						successUrl: window.location.origin + window.location.pathname,
						cancelUrl: window.location.origin + window.location.pathname,
					},
				})
				.then(res => res.data);
			return res.url;
		},
	});
};

const usePaymentGuard = () => {
	const { data: customerStatus, isLoading, isFetched } = useCustomerStatus();
	const { setIsOpen } = useSubscriptionModalStore();

	// useEffect(() => {
	// 	if (!isLoading && isFetched) {
	// 		if (customerStatus?.customerStatus && !customerStatus.customerStatus.isActive) {
	// 			posthog.capture("force_show_subscription_modal");
	// 			setIsOpen(true, false);
	// 		}
	// 	}
	// }, [isLoading, isFetched, customerStatus]);
};

export const SubscriptionModal = () => {
	const {
		data: customerStatus,
		isLoading: isCustomerStatusLoading,
		isFetched: isCustomerStatusFetched,
	} = useCustomerStatus();
	const { data, isLoading: isProductsLoading } = useProducts();
	const { mutate: checkout, isPending: isCheckoutLoading } = useCheckout();
	usePaymentGuard();

	const { isOpen, allowClose, setIsOpen } = useSubscriptionModalStore();

	const missingCustomerStatus = !isCustomerStatusLoading && !customerStatus?.customerStatus;
	const isLoading = isProductsLoading || isCustomerStatusLoading || !isCustomerStatusFetched;

	const products = data?.products;

	const handleSubscribe = async (priceId: string) => {
		posthog.capture("subscribe");
		checkout(priceId, {
			onSuccess: url => {
				window.location.href = url;
			},
		});
	};

	const handleClose = (force?: boolean) => {
		if (allowClose || force) {
			posthog.capture("hide_subscription_modal");
			setIsOpen(false, false);
		}
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={open => {
				if (!open) {
					handleClose();
				}
			}}>
			<DialogContent>
				{allowClose && (
					<div className="-mr-2 -mt-2 flex justify-end">
						<Button onClick={() => handleClose()} size="icon-xs-overflow" variant="ghost">
							<XIcon className="h-4 w-4" />
						</Button>
					</div>
				)}
				{isLoading ? (
					<div>
						<LoadingSpinner />
					</div>
				) : missingCustomerStatus ? (
					<div>
						<h3 className="text-center text-lg font-medium">Something went wrong</h3>
						<p className="text-center text-sm text-secondary">
							Woah this isn't supposed to happen. Please contact us at{" "}
							<a href="mailto:founders@usecloudy.com" className="text-accent">
								founders@usecloudy.com
							</a>
							.
						</p>
						<p className="text-center text-sm text-secondary">
							For a faster response, shoot Jenn a dm on X:{" "}
							<a href="https://x.com/jennmueng" className="text-accent">
								@jennmueng
							</a>
						</p>
					</div>
				) : (
					<div>
						{products?.map(product => (
							<div key={product.id} className="flex flex-col items-center gap-4">
								<div className="flex flex-col items-center gap-2">
									<img src="/logo.png" className="w-8" alt="Cloudy Logo" />
									<div className="flex flex-row items-center gap-2">
										<h3 className="text-lg font-medium">{product.name}</h3>
										{"tag" in product.metadata ? <Tag>{product.metadata.tag}</Tag> : null}
									</div>
									<div className="-mb-2 text-center text-sm text-secondary">Monthly</div>
									<Pricing price={product.defaultPrice} fullPrice={product.fullPrice} showDiscount={false} />
									<div className="text-center text-sm text-secondary">{product.description}</div>
								</div>
								<Button
									className="self-stretch"
									onClick={() => handleSubscribe(product.defaultPrice.id)}
									disabled={isCheckoutLoading}>
									{isCheckoutLoading ? <LoadingSpinner size="xs" variant="background" /> : "Subscribe now"}
								</Button>
								<div className="flex w-full flex-col items-start rounded-md bg-card p-4">
									<div className="text-sm font-medium text-secondary">Features include:</div>
									<ul className="list-outside list-disc px-4">
										{product.marketingFeatures.map(feature => (
											<li key={feature.title} className="my-1 text-xs text-secondary">
												{feature.title}
											</li>
										))}
									</ul>
								</div>
								<div className="text-center text-xs text-secondary">
									Something wrong? Contact us at{" "}
									<a href="mailto:founders@usecloudy.com" className="text-accent">
										founders@usecloudy.com
									</a>
								</div>
								<a
									className="cursor-pointer text-center text-xs font-medium text-accent hover:underline active:text-accent/80"
									href="/signout">
									Sign out
								</a>
							</div>
						))}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};
