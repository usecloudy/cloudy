import { FileHandlerClientPayload, handleSupabaseError } from "@cloudy/utils/common";
import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { getSupabase } from "app/api/utils/supabase";

export async function POST(request: Request): Promise<NextResponse> {
	const body = (await request.json()) as HandleUploadBody;

	try {
		const jsonResponse = await handleUpload({
			body,
			request,
			onBeforeGenerateToken: async (pathname, clientPayload) => {
				// Generate a client token for the browser to upload the file
				// ⚠️ Authenticate and authorize users before generating the token.
				// Otherwise, you're allowing anonymous uploads.
				const parsedClientPayload = clientPayload ? (JSON.parse(clientPayload) as FileHandlerClientPayload) : null;

				if (!parsedClientPayload) {
					throw new Error("Unauthorized");
				}
				const authHeader = parsedClientPayload.Authorization;

				if (!authHeader) {
					throw new Error("Unauthorized");
				}

				// This checks and ensures the user is authenticated and authorized to upload a file
				await getSupabase({ authHeader, mode: "client" });

				return {
					allowedContentTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
					tokenPayload: JSON.stringify(parsedClientPayload),
				};
			},
			onUploadCompleted: async ({ blob, tokenPayload }) => {
				// Get notified of client upload completion
				// ⚠️ This will not work on `localhost` websites,
				// Use ngrok or similar to get the full upload flow
				const parsedClientPayload = tokenPayload ? (JSON.parse(tokenPayload) as FileHandlerClientPayload) : null;

				if (!parsedClientPayload) {
					throw new Error("Unauthorized");
				}

				const supabase = await getSupabase({ authHeader: parsedClientPayload.Authorization, mode: "client" });

				handleSupabaseError(
					await supabase.from("thought_attachments").insert({
						thought_id: parsedClientPayload.thoughtId,
						url: blob.url,
						path: blob.pathname,
					}),
				);
			},
		});

		return NextResponse.json(jsonResponse);
	} catch (error) {
		return NextResponse.json(
			{ error: (error as Error).message },
			{ status: 400 }, // The webhook will retry 5 times waiting for a 200
		);
	}
}
