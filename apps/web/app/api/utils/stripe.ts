import { CustomerStatus, handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { differenceInDays, sub } from "date-fns";
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const getCustomerSubscriptionStatus = async (stripeCustomerId: string) => {
	const subscriptions = await stripe.subscriptions.list({
		customer: stripeCustomerId,
		status: "all",
	});

	const activeSubscription = subscriptions.data.find(subscription => subscription.status === "active");
	const trialSubscription = subscriptions.data.find(subscription => subscription.status === "trialing");

	const isActive = Boolean(activeSubscription || trialSubscription);
	const isTrialing = Boolean(!activeSubscription && trialSubscription);

	// Eligible either if the user has never subscribed or if the user has canceled their subscription more than 30 days ago
	const isEligibleForTrial =
		subscriptions.data.length === 0 ||
		subscriptions.data.every(
			subscription => subscription.ended_at && new Date(subscription.ended_at * 1000) <= sub(new Date(), { days: 30 }),
		);

	const remainingDaysInTrial =
		trialSubscription && trialSubscription.trial_end
			? differenceInDays(trialSubscription.trial_end * 1000, new Date()) + 1
			: null;

	return {
		stripeCustomerId,
		isActive,
		isTrialing,
		isEligibleForTrial,
		remainingDaysInTrial,
	} satisfies CustomerStatus;
};

export const startTrialOnCustomer = async (customer: Stripe.Customer) => {
	console.log("Starting trial on customer", customer.id);
	const products = await stripe.products.list();

	const activeProducts = products.data.flatMap(product => {
		if (product.active && product.type === "service") {
			return [product];
		}
		return [];
	});

	const firstProduct = activeProducts.at(0);

	if (!firstProduct) {
		throw new Error("No active products found");
	}

	if (!firstProduct.default_price) {
		throw new Error("No default price found for product");
	}

	await stripe.subscriptions.create({
		customer: customer.id,
		items: [
			{
				price: firstProduct.default_price as string,
				quantity: 1,
			},
		],
		trial_period_days: 7,
		trial_settings: {
			end_behavior: {
				missing_payment_method: "cancel",
			},
		},
	});

	console.log("Started trial on customer", customer.id);
};

export const getWorkspaceStripeCustomerId = async (
	{ wsId, wsSlug }: { wsId?: string; wsSlug?: string },
	supabase: SupabaseClient<Database>,
) => {
	if (!wsId && !wsSlug) {
		throw new Error("Either wsId or wsSlug must be provided");
	}

	const { stripeCustomerId } = wsId
		? handleSupabaseError(
				await supabase.from("workspaces").select("stripeCustomerId:stripe_customer_id").eq("id", wsId).single(),
			)
		: handleSupabaseError(
				await supabase.from("workspaces").select("stripeCustomerId:stripe_customer_id").eq("slug", wsSlug!).single(),
			);

	if (!stripeCustomerId) {
		return null;
	}

	return stripeCustomerId;
};
