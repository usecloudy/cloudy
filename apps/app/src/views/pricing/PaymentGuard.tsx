import { Pricing } from "@cloudy/ui";
import { PaymentsProductsGetResponse } from "@cloudy/utils/common";
import { useMutation, useQuery } from "@tanstack/react-query";
import { XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { apiClient } from "src/api/client";
import { queryClient } from "src/api/queryClient";
import { Button } from "src/components/Button";
import { Dialog, DialogContent } from "src/components/Dialog";
import LoadingSpinner from "src/components/LoadingSpinner";
import { useCustomerStatus } from "src/utils/useCustomerStatus";

const useProducts = () => {
	return useQuery({
		queryKey: ["payments", "products"],
		queryFn: () => apiClient.get<PaymentsProductsGetResponse>("/api/payments/products").then(res => res.data),
	});
};

const useStartTrial = () => {
	return useMutation({
		mutationFn: async (priceId: string) => {
			const res = await apiClient.get<{ success: boolean }>(`/api/payments/start-trial`, {
				params: {
					priceId,
				},
			});
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["payments", "customers", "status"] });
		},
	});
};

const useCheckout = () => {
	return useMutation({
		mutationFn: async (priceId: string) => {
			const res = await apiClient
				.get<{ url: string }>(`/api/payments/checkout`, {
					params: {
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

export const PaymentGuard = () => {
	const {
		data: customerStatus,
		isLoading: isCustomerStatusLoading,
		isFetched: isCustomerStatusFetched,
	} = useCustomerStatus();
	const { data, isLoading: isProductsLoading } = useProducts();
	const { mutate: checkout, isPending: isCheckoutLoading } = useCheckout();
	const { mutateAsync: startTrial, isPending: isStartTrialLoading } = useStartTrial();

	const [searchParams] = useSearchParams();
	const showSubscriptionModal = searchParams.get("showSubscriptionModal");

	const [isOpen, setIsOpen] = useState(false);

	const products = data?.products;
	const allowClose = showSubscriptionModal;

	const handleSubscribe = async (priceId: string) => {
		checkout(priceId, {
			onSuccess: url => {
				window.location.href = url;
			},
		});
	};

	const handleStartTrial = async (priceId: string) => {
		const { success } = await startTrial(priceId, {});
		if (success) {
			handleClose(true);
		}
	};

	useEffect(() => {
		if (showSubscriptionModal) {
			setIsOpen(true);
		} else if (!isCustomerStatusLoading && !customerStatus?.customerStatus?.isActive) {
			setIsOpen(true);
		} else {
			setIsOpen(false);
		}
	}, [isCustomerStatusLoading, customerStatus, showSubscriptionModal]);

	const handleClose = (force?: boolean) => {
		if (allowClose || force) {
			setIsOpen(false);
			searchParams.delete("showSubscriptionModal");
			window.history.replaceState({}, "", `${window.location.pathname}?${searchParams.toString()}`);
		}
	};

	const missingCustomerStatus = !isCustomerStatusLoading && !customerStatus?.customerStatus;
	const isLoading = isProductsLoading || isCustomerStatusLoading || !isCustomerStatusFetched;

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
					<div className="flex justify-end -mt-2 -mr-2">
						<Button onClick={() => handleClose()} size="icon-xs-overflow" variant="ghost">
							<XIcon className="w-4 h-4" />
						</Button>
					</div>
				)}
				{isLoading ? (
					<div>
						<LoadingSpinner />
					</div>
				) : missingCustomerStatus ? (
					<div>
						<h3 className="font-medium text-lg text-center">Something went wrong</h3>
						<p className="text-secondary text-sm text-center">
							Woah this isn't supposed to happen. Please contact us at{" "}
							<a href="mailto:founders@usecloudy.com" className="text-accent">
								founders@usecloudy.com
							</a>
							.
						</p>
						<p className="text-secondary text-sm text-center">
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
								<div className="flex flex-col gap-2 items-center">
									<img src="/logo.png" className="w-8" alt="Cloudy Logo" />
									<div className="flex flex-row items-center gap-2">
										<h3 className="font-medium text-lg">{product.name}</h3>
										{"tag" in product.metadata ? (
											<div className="text-xs text-accent font-medium bg-card rounded px-2 py-0.5">
												{product.metadata.tag}
											</div>
										) : null}
									</div>
									<Pricing price={product.defaultPrice} fullPrice={product.fullPrice} showDiscount={false} />
									<div className="text-sm text-secondary text-center">{product.description}</div>
								</div>
								{customerStatus?.customerStatus?.isEligibleForTrial ? (
									<div className="flex flex-col items-center gap-1 w-full">
										<Button
											className="self-stretch"
											onClick={() => handleStartTrial(product.defaultPrice.id)}
											disabled={isStartTrialLoading}>
											{isStartTrialLoading ? (
												<LoadingSpinner size="xs" variant="background" />
											) : (
												"Get started"
											)}
										</Button>
										<div className="text-xs text-secondary text-center">
											Start for 7 days free, no credit card required
										</div>
									</div>
								) : (
									<Button
										className="self-stretch"
										onClick={() => handleSubscribe(product.defaultPrice.id)}
										disabled={isCheckoutLoading}>
										{isCheckoutLoading ? (
											<LoadingSpinner size="xs" variant="background" />
										) : (
											"Subscribe now"
										)}
									</Button>
								)}
								<div className="flex flex-col items-start w-full bg-card rounded-md p-4">
									<div className="text-sm text-secondary font-medium">Features include:</div>
									<ul className="list-disc list-outside px-4">
										{product.marketingFeatures.map(feature => (
											<li key={feature.title} className="text-secondary text-xs my-1">
												{feature.title}
											</li>
										))}
									</ul>
								</div>
								<div className="text-xs text-secondary text-center">
									Something wrong? Contact us at{" "}
									<a href="mailto:founders@usecloudy.com" className="text-accent">
										founders@usecloudy.com
									</a>
								</div>
								<a
									className="text-accent text-xs text-center hover:underline cursor-pointer font-medium active:text-accent/80"
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
