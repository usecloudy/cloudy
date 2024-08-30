import { CustomerStatus } from "@cloudy/utils/common";
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
