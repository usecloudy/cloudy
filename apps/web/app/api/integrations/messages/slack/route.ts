import { handleSupabaseError } from "@cloudy/utils/common";
import { WebClient } from "@slack/web-api";
import { NextRequest, NextResponse } from "next/server";

import { getSupabase } from "app/api/utils/supabase";

import { createEmbeddings } from "../embeddings";

const INTEGRATION_ID = "0361fb35-a348-4fb1-a7e4-7f9c0fc73e87";

export const POST = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "service" });

	try {
		// Initialize the Slack Web API client
		const slackToken = process.env.SLACK_BOT_TOKEN;
		if (!slackToken) {
			throw new Error("SLACK_BOT_TOKEN is not set");
		}
		const slack = new WebClient(slackToken);

		// Get list of public channels
		const channelsResponse = await slack.conversations.list({
			exclude_archived: true,
			types: "public_channel",
		});

		if (!channelsResponse.channels) {
			throw new Error("No channels found");
		}

		// Join all public channels that the bot hasn't joined yet
		const joinChannelPromises = channelsResponse.channels.map(async channel => {
			if (channel.id && !channel.is_member) {
				try {
					await slack.conversations.join({ channel: channel.id });
					console.log(`Joined channel: ${channel.name}`);
				} catch (error) {
					console.error(`Failed to join channel ${channel.name}:`, error);
				}
			}
		});

		await Promise.all(joinChannelPromises);

		const integration = handleSupabaseError(
			await supabase.from("integration_setups").select("*").eq("id", INTEGRATION_ID).single(),
		);

		const lastPullTimestamp = integration.last_synced_at ? new Date(integration.last_synced_at) : null;
		const pullTimestamp = new Date();

		// Fetch messages from each public channel
		const allMessages = await Promise.all(
			channelsResponse.channels.map(async channel => {
				if (channel.id) {
					const messagesResponse = await slack.conversations.history({
						channel: channel.id,
						limit: 100, // Adjust as needed
						oldest: lastPullTimestamp ? `${lastPullTimestamp.valueOf() / 1000}` : undefined,
					});

					const threadMessages = (
						await Promise.all(
							messagesResponse.messages?.map(async message => {
								if (message.thread_ts) {
									const replies = await slack.conversations.replies({
										channel: channel.id!,
										ts: message.thread_ts,
									});
									return replies.messages ?? [];
								}
								return [];
							}) ?? [],
						)
					).flat();

					return [
						{
							channelName: channel.name,
							channelId: channel.id,
							messages: (messagesResponse.messages ?? []).concat(threadMessages),
						},
					];
				}

				return [];
			}),
		).then(results => results.flat());

		console.log("allMessages", allMessages);

		const messagesToStore = allMessages.flatMap(channel =>
			(
				channel.messages?.filter(
					message => message.type === "message" && !message.subtype && message.client_msg_id && message.ts,
				) ?? []
			).map(m => ({ ...m, channel_id: channel.channelId })),
		);

		const messageLinks = await Promise.all(
			messagesToStore.map(async message => {
				const link = await slack.chat.getPermalink({
					channel: message.channel_id,
					message_ts: message.ts!,
				});

				return link.permalink;
			}),
		);

		const embeddings = await createEmbeddings(messagesToStore.map(message => message.text!));

		console.log("messagesToStore", messagesToStore);

		const messageIds = handleSupabaseError(
			await supabase
				.from("integration_messages")
				.insert(
					messagesToStore.map((message, i) => ({
						external_id: message.client_msg_id!,
						content: message.text,
						workspace: "745671ff-df59-42a1-9902-b1bc2674abd9",
						sent_at: new Date(parseInt(message.ts!.split(".")[0]!, 10) * 1000).toISOString(),
						link_url: messageLinks[i],
					})),
				)
				.select("id"),
		);

		console.log("messageIds", messageIds);

		handleSupabaseError(
			await supabase.from("integration_message_embeddings").insert(
				messageIds.flatMap(
					({ id: messageId }, i) =>
						embeddings[i]?.map((embedding, embeddingIndex) => ({
							message_id: messageId,
							embedding: JSON.stringify(embedding),
							embedding_ver: "1",
							index: embeddingIndex,
						})) ?? [],
				),
			),
		);

		handleSupabaseError(
			await supabase
				.from("integration_setups")
				.update({ last_synced_at: pullTimestamp.toISOString() })
				.eq("id", INTEGRATION_ID),
		);

		return NextResponse.json({ success: true, count: messagesToStore.length });
	} catch (error) {
		console.error("Error fetching Slack messages:", error);
		return NextResponse.json({ error: "Failed to fetch Slack messages" }, { status: 500 });
	}
};
