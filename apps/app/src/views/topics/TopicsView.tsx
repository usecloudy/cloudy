import { TopicsRefreshPostRequestBody } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ArrowRightIcon,
	ArrowUpIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	EllipsisIcon,
	RefreshCwIcon,
	TrashIcon,
} from "lucide-react";
import { useFeatureFlagEnabled } from "posthog-js/react";
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { apiClient } from "src/api/client";
import { topicQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { Dropdown, DropdownItem } from "src/components/Dropdown";
import LoadingSpinner from "src/components/LoadingSpinner";
import { MainLayout } from "src/components/MainLayout";
import { SimpleLayout } from "src/components/SimpleLayout";
import { useWorkspace } from "src/stores/workspace";
import { cn } from "src/utils";
import { makeHumanizedTime } from "src/utils/strings";
import { makeThoughtUrl } from "src/utils/thought";

import { NewTopicSearch } from "./NewTopicSearch";

type TopicRecord = Database["public"]["Tables"]["topics"]["Row"];

const useTopics = () => {
	const workspace = useWorkspace();

	return useQuery({
		queryKey: topicQueryKeys.topics(),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("topics")
				.select("*")
				.eq("workspace_id", workspace.id)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data as TopicRecord[];
		},
	});
};

const useTopicMatches = (topicId: string) => {
	return useQuery({
		queryKey: topicQueryKeys.topicMatches(topicId),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("topic_thought_chunk_matches")
				.select("*, thought_chunk:thought_chunks(id,content,thought:thoughts(id,title,created_at))")
				.eq("topic_id", topicId);

			if (error) throw error;

			data.sort((a, b) => b.thought_chunk!.thought!.created_at.localeCompare(a.thought_chunk!.thought!.created_at));

			return data;
		},
	});
};

const useRefreshTopic = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (topicId: string) => {
			await apiClient.post("/api/topics/refresh", { topicId } satisfies TopicsRefreshPostRequestBody);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: topicQueryKeys.topics() });
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
			queryClient.invalidateQueries({ queryKey: topicQueryKeys.topics() });
		},
	});
};

const useDevIndexWorkspace = () => {
	const workspace = useWorkspace();
	return useMutation({
		mutationFn: async () => {
			await apiClient.post(
				"/api/thoughts/dev-index",
				{ workspaceId: workspace.id },
				{
					timeout: 90000,
				},
			);
		},
	});
};

export const TopicsView = () => {
	const isTopicsEnabled = useFeatureFlagEnabled("topics");

	const { data: topics, isLoading: isTopicsLoading } = useTopics();
	const devIndexWorkspace = useDevIndexWorkspace();

	if (isTopicsEnabled === false) {
		return <Navigate to="/404" />;
	}

	if (isTopicsLoading) {
		return (
			<SimpleLayout>
				<LoadingSpinner />
			</SimpleLayout>
		);
	}

	return (
		<MainLayout className="no-scrollbar overflow-y-scroll">
			<div className="space-y-8 pt-8">
				<h1 className="text-2xl font-bold">Topics</h1>
				<div className="flex w-full flex-row flex-wrap gap-4 md:flex-nowrap">
					<NewTopicSearch />
					<Button variant="outline" onClick={() => devIndexWorkspace.mutate()} disabled={devIndexWorkspace.isPending}>
						<span>DEV: Index workspace notes</span>
						{devIndexWorkspace.isPending ? <LoadingSpinner size="xs" /> : null}
					</Button>
				</div>
				{devIndexWorkspace.error ? <div className="text-red-600">{devIndexWorkspace.error.message}</div> : null}
				<div className="grid auto-rows-auto grid-cols-1 gap-4 md:grid-cols-2">
					{topics?.map((topic, index) => <TopicCard key={topic.id} topic={topic} />)}
				</div>
			</div>
		</MainLayout>
	);
};

const TopicCard = ({ topic }: { topic: TopicRecord }) => {
	const { data: topicMatches, isLoading: isMatchesLoading } = useTopicMatches(topic.id);
	const refreshTopicMutation = useRefreshTopic();
	const deleteTopic = useDeleteTopic();

	const handleRefresh = () => {
		refreshTopicMutation.mutate(topic.id);
	};

	const handleDelete = () => {
		deleteTopic.mutate(topic.id);
	};

	return (
		<div
			className={cn(
				"col-span-1 flex h-auto max-h-[800px] flex-col rounded-lg bg-card p-4 md:h-[600px]",
				refreshTopicMutation.isPending ? "pointer-events-none animate-pulse" : "",
			)}>
			<div className="flex items-center justify-between gap-4">
				<div className="flex flex-col">
					<div className="text-xs text-secondary">Topic</div>
					<h2 className="text-lg font-semibold md:text-xl">{topic.query}</h2>
				</div>
				<div className="flex gap-2">
					<Button variant="ghost" size="icon-sm" onClick={handleRefresh} disabled={refreshTopicMutation.isPending}>
						<RefreshCwIcon className={`size-4 ${refreshTopicMutation.isPending ? "animate-spin" : ""}`} />
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
			<div className="mt-4 flex flex-col gap-2">
				<div>
					<div className="text-sm text-secondary">Summary</div>
					<div className="text-sm">{topic.summary}</div>
				</div>
				<div>
					<div className="text-sm text-secondary">Latest Update</div>
					<div className="text-sm">{topic.latest_update}</div>
				</div>
			</div>
			{isMatchesLoading ? (
				<div className="mt-4 flex flex-1 items-center justify-center">
					<LoadingSpinner />
				</div>
			) : (
				<div className="no-scrollbar mt-4 flex-1 overflow-y-auto">
					<div className="flex flex-col items-start space-y-2">
						{topicMatches?.map((topicMatch, index) => (
							<TopicMatchCard
								key={topicMatch.id}
								topicMatch={topicMatch}
								isLast={index === topicMatches.length - 1}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

const TopicMatchCard = ({ topicMatch, isLast }: { topicMatch: any; isLast: boolean }) => {
	const workspace = useWorkspace();

	const [isExpanded, setIsExpanded] = useState(false);
	const content = topicMatch.thought_chunk!.content.trim();
	const truncatedContent = content.length > 100 ? content.slice(0, 100) + "..." : content;
	const shouldShowExpandButton = content.length > 100 || content.includes("\n");

	return (
		<>
			<div className="flex w-full flex-row items-start rounded bg-background p-2">
				<div className="flex flex-1 flex-col items-start">
					<span className="text-xs text-secondary">
						{makeHumanizedTime(topicMatch.thought_chunk!.thought!.created_at)}
					</span>

					<span className={cn("flex-1 text-sm", isExpanded ? "whitespace-pre-wrap text-wrap" : "")}>
						{isExpanded ? content : truncatedContent}
					</span>
				</div>
				<div className="ml-2 flex items-center gap-1">
					{shouldShowExpandButton && (
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={() => setIsExpanded(!isExpanded)}
							className="ml-2 flex-shrink-0">
							{isExpanded ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />}
						</Button>
					)}
					<Link to={makeThoughtUrl(workspace.slug, topicMatch.thought_chunk!.thought!.id)}>
						<Button variant="outline" size="icon-sm">
							<ArrowRightIcon className="size-4" />
						</Button>
					</Link>
				</div>
			</div>
			{!isLast && (
				<div className="ml-2 flex justify-center">
					<ArrowUpIcon className="size-4 text-tertiary" />
				</div>
			)}
		</>
	);
};
