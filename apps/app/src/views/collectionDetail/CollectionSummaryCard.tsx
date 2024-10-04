import { CollectionSummary, makeHumanizedTime } from "@cloudy/utils/common";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDownIcon, ChevronUpIcon, LightbulbIcon, RefreshCwIcon } from "lucide-react";
import React, { useState } from "react";

import { apiClient } from "src/api/client";
import { collectionQueryKeys } from "src/api/queryKeys";
import { Button } from "src/components/Button";
import { cn } from "src/utils";

interface CollectionSummaryCardProps {
	summary: CollectionSummary | null;
	collectionId: string;
	canGenerateSummary: boolean;
	summaryUpdatedAt: string | null;
}

const useRefreshSummary = (collectionId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			const { data } = await apiClient.post<CollectionSummary>("/api/ai/collection-summarize", { collectionId });
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionQueryKeys.collectionDetail(collectionId) });
		},
	});
};

export const CollectionSummaryCard: React.FC<CollectionSummaryCardProps> = ({
	summary,
	summaryUpdatedAt,
	collectionId,
	canGenerateSummary,
}) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const { mutate: refreshSummary, isPending } = useRefreshSummary(collectionId);

	const handleRefresh = () => {
		refreshSummary();
	};

	if (!canGenerateSummary) {
		return null;
	}

	if (!summary) {
		return (
			<div className="flex max-w-screen-md flex-row items-center gap-2 rounded bg-card p-2 text-sm">
				<p className="flex-1 pl-3 text-secondary">No summary yet</p>
				<Button variant="outline" size="sm" className="self-start" onClick={handleRefresh} disabled={isPending}>
					<LightbulbIcon className="size-4" />
					{isPending ? "Generating..." : "Generate summary"}
				</Button>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"flex max-w-screen-md flex-col gap-1 rounded bg-card px-4 py-3 text-sm",
				isPending && "animate-pulse",
			)}>
			<div className="flex items-start justify-between">
				<div className="flex flex-1 flex-col">
					<h3 className="font-medium text-secondary">Latest Update</h3>
					<p>{summary.latestUpdate}</p>
				</div>
				<Button variant="ghost" size="icon-sm" onClick={handleRefresh} disabled={isPending}>
					<RefreshCwIcon className={cn("h-4 w-4", isPending && "animate-spin")} />
				</Button>
			</div>
			<div
				className={cn(
					"overflow-hidden transition-all duration-300 ease-in-out",
					isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0",
				)}>
				<div className="mt-2">
					<h3 className="font-medium text-secondary">Key Takeaways</h3>
					<ul className="list-disc pl-4">
						{summary.keyTakeaways.map((takeaway, index) => (
							<li key={index}>{takeaway}</li>
						))}
					</ul>
				</div>
			</div>
			<div className="flex items-center justify-between">
				<Button
					variant="ghost"
					size="sm"
					className="self-start text-secondary"
					onClick={() => setIsExpanded(!isExpanded)}>
					{isExpanded ? (
						<>
							<ChevronUpIcon className="size-4" />
							Show less
						</>
					) : (
						<>
							<ChevronDownIcon className="size-4" />
							Show key takeaways
						</>
					)}
				</Button>
				{summaryUpdatedAt && (
					<span className="text-xs text-secondary">Last updated {makeHumanizedTime(summaryUpdatedAt)}</span>
				)}
			</div>
		</div>
	);
};
