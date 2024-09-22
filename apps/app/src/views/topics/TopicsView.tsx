import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightIcon, EllipsisIcon, RefreshCwIcon, TrashIcon } from "lucide-react";

import { apiClient } from "src/api/client";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { Dropdown, DropdownItem } from "src/components/Dropdown";
import LoadingSpinner from "src/components/LoadingSpinner";
import { MainLayout } from "src/components/MainLayout";
import { SimpleLayout } from "src/components/SimpleLayout";
import { useUser } from "src/stores/user";
import { makeHumanizedTime } from "src/utils/strings";

import { NewTopicSearch } from "./NewTopicSearch";

interface Topic {
	id: string;
	query: string;
	created_at: string;
}

interface TopicMessage {
	id: string;
	topic_id: string;
	message_id: string;
	message: {
		content: string;
		sent_at: string;
	};
}

const useTopics = () => {
	const user = useUser();

	return useQuery({
		queryKey: ["topics"],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("topics")
				.select("*")
				.eq("workspace", "745671ff-df59-42a1-9902-b1bc2674abd9")
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data as Topic[];
		},
	});
};

const useTopicMessages = (topicId: string) => {
	return useQuery({
		queryKey: ["topic_messages", topicId],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("topic_message_matches")
				.select("*, message:integration_messages(sent_at,content,link_url,id)")
				.order("message(sent_at)", { ascending: false })
				.eq("topic_id", topicId);

			if (error) throw error;
			return data;
		},
	});
};

const useComputeTopic = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (topicId: string) => {
			await apiClient.post("/api/topics/compute", { topicId });
		},
		onSuccess: (_, topicId) => {
			queryClient.invalidateQueries({ queryKey: ["topic_messages", topicId] });
		},
	});
};

const useDeleteTopic = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (topicId: string) => {
			const { data, error } = await supabase.from("topics").delete().eq("id", topicId);

			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["topics"] });
		},
	});
};

export const TopicsView = () => {
	const { data: topics, isLoading: isTopicsLoading } = useTopics();

	if (isTopicsLoading) {
		return (
			<SimpleLayout>
				<LoadingSpinner />
			</SimpleLayout>
		);
	}

	return (
		<MainLayout>
			<div className="space-y-8 pt-8">
				<h1 className="text-2xl font-bold">Topics</h1>
				<NewTopicSearch />
				{topics?.map(topic => <TopicCard key={topic.id} topic={topic} />)}
			</div>
		</MainLayout>
	);
};

const TopicCard = ({ topic }: { topic: Topic }) => {
	const { data: topicMessages, isLoading: isMessagesLoading } = useTopicMessages(topic.id);
	const computeTopic = useComputeTopic();
	const deleteTopic = useDeleteTopic();

	const handleRefresh = () => {
		computeTopic.mutate(topic.id);
	};

	const handleDelete = () => {
		deleteTopic.mutate(topic.id);
	};

	return (
		<div className="space-y-4 rounded-lg bg-card p-4">
			<div className="flex items-center justify-between">
				<div className="flex flex-col">
					<div className="text-xs text-secondary">Topic</div>
					<h2 className="text-xl font-semibold">{topic.query}</h2>
				</div>
				<div className="flex gap-2">
					<Button variant="ghost" size="icon-sm" onClick={handleRefresh} disabled={computeTopic.isPending}>
						<RefreshCwIcon className={`size-4 ${computeTopic.isPending ? "animate-spin" : ""}`} />
					</Button>
					<Dropdown
						trigger={
							<Button variant="ghost" size="icon-sm">
								<EllipsisIcon className="size-4" />
							</Button>
						}>
						<DropdownItem onSelect={handleDelete}>
							<TrashIcon className="size-4" />
							<span>Delete Topic</span>
						</DropdownItem>
					</Dropdown>
				</div>
			</div>
			{isMessagesLoading ? (
				<LoadingSpinner />
			) : (
				<div className="space-y-2">
					{topicMessages?.map(topicMessage => (
						<div key={topicMessage.id} className="flex flex-row rounded bg-background p-2">
							<div className="flex flex-1 flex-col">
								<span className="text-xs text-secondary">
									{makeHumanizedTime(topicMessage.message!.sent_at)}
								</span>
								<span>{topicMessage.message!.content}</span>
							</div>
							{topicMessage.message?.link_url && (
								<a href={topicMessage.message.link_url}>
									<Button variant="ghost" size="icon">
										<ArrowRightIcon className="size-5" />
									</Button>
								</a>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
};
