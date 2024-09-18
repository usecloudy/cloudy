import { handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";

import { getCustomerSubscriptionStatus, stripe } from "app/api/utils/stripe";
import { getSupabase } from "app/api/utils/supabase";
import { getWorkspaceUserCount } from "app/api/utils/workspaces";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type Record = Database["public"]["Tables"]["workspace_users"]["Row"];

type InsertPayload = {
	type: "INSERT";
	table: string;
	schema: string;
	record: Record;
	old_record: null;
};
type UpdatePayload = {
	type: "UPDATE";
	table: string;
	schema: string;
	record: Record;
	old_record: Record;
};
type DeletePayload = {
	type: "DELETE";
	table: string;
	schema: string;
	record: null;
	old_record: Record;
};

type Payload = InsertPayload | UpdatePayload | DeletePayload;

export const POST = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "service" });

	const payload = (await req.json()) as Payload;

	const workspaceId = payload.record?.workspace_id ?? payload.old_record?.workspace_id;

	if (!workspaceId) {
		return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
	}

	const workspace = handleSupabaseError(
		await supabase.from("workspaces").select("id, stripe_customer_id").eq("id", workspaceId).single(),
	);

	if (!workspace.stripe_customer_id) {
		return NextResponse.json({ error: "Workspace does not have a Stripe customer ID" }, { status: 400 });
	}

	const customerStatus = await getCustomerSubscriptionStatus(workspace.stripe_customer_id);

	if (!customerStatus.isActive) {
		return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
	}

	const userCount = await getWorkspaceUserCount(workspace.id, supabase);

	const subscriptions = await stripe.subscriptions.list({
		customer: workspace.stripe_customer_id,
		status: "active",
	});

	if (subscriptions.data.length === 0) {
		return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
	}

	const subscription = subscriptions.data[0]!;

	try {
		const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
			items: [
				{
					id: subscription.items.data[0]!.id,
					quantity: userCount,
				},
			],
		});

		await supabase.channel(`workspace_${workspace.id}_customer_status`).send({
			type: "broadcast",
			event: "customer_status_updated",
			payload: {},
		});

		return NextResponse.json({
			success: true,
			updatedQuantity: userCount,
			subscriptionId: updatedSubscription.id,
		});
	} catch (error) {
		console.error("Error updating subscription:", error);
		return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
	}
};
