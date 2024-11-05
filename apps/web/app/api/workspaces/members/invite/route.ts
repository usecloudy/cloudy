import { handleSupabaseError } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { getSupabase } from "app/api/utils/supabase";
import { waitForUserRecordToExist } from "app/api/utils/users";

const resend = new Resend(process.env.RESEND_API_KEY);

type Payload = {
	email: string;
	workspaceId: string;
};

export const POST = async (req: NextRequest) => {
	const supabase = await getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	// Extract data from request body
	const { email, workspaceId } = (await req.json()) as Payload;

	// Get the current user
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	// Get workspace details
	const workspace = handleSupabaseError(await supabase.from("workspaces").select("*").eq("id", workspaceId).single());

	// Generate invitation link (you may want to create a separate API for handling invitations)
	const supabaseAdmin = await getSupabase({ mode: "service", bypassAuth: true });
	const { data, error } = await supabaseAdmin.auth.admin.generateLink({
		type: "invite",
		email,
		options: {
			redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite-accept`,
		},
	});

	console.log("data", data, error);

	if (error) {
		throw error;
	}

	if (!data || !data.user) {
		return NextResponse.json({ error: "Failed to generate invitation link" }, { status: 500 });
	}

	const newUserId = data.user.id;
	let inviteLink = data.properties.action_link;

	await waitForUserRecordToExist(newUserId, supabaseAdmin);

	// mark the user as pending
	handleSupabaseError(
		await supabaseAdmin
			.from("users")
			.update({
				is_pending: true,
			})
			.eq("id", newUserId),
	);

	// create the invite
	const invite = handleSupabaseError(
		await supabaseAdmin
			.from("user_pending_invites")
			.insert({
				user_id: newUserId,
				workspace_id: workspaceId,
			})
			.select("id")
			.single(),
	);

	console.log("inviteLink", inviteLink);

	const url = new URL(inviteLink);
	const redirectTo = url.searchParams.get("redirect_to");
	if (redirectTo) {
		const redirectUrl = new URL(
			process.env.NODE_ENV === "development"
				? "http://localhost:3000/auth/invite-accept"
				: "https://app.usecloudy.com/auth/invite-accept",
		);
		redirectUrl.searchParams.append("inviteId", invite.id);
		url.searchParams.set("redirect_to", redirectUrl.toString());
	}
	inviteLink = url.toString();

	// Send invitation email using Resend
	try {
		await resend.emails.send({
			from: "Cloudy <noreply@usecloudy.com>",
			to: email,
			subject: `You've been invited to join ${workspace.name} on Cloudy`,
			html: `
                <p>You've been invited to join ${workspace.name} on Cloudy!</p>
                <p>${user.email} has invited you to join their workspace on Cloudy.</p>
                <p>Click the link below to accept the invitation:</p>
                <a href="${inviteLink}">Accept Invitation</a>
            `,
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to send invitation email:", error);
		return NextResponse.json({ error: "Failed to send invitation email" }, { status: 500 });
	}
};
