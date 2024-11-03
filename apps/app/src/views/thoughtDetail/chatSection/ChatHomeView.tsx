import { ChatRole, handleSupabaseError, makeHumanizedTime } from "@cloudy/utils/common";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRightIcon, ExternalLinkIcon, MoreHorizontalIcon, TrashIcon, XIcon } from "lucide-react";
import { useContext } from "react";
import { Link } from "react-router-dom";

import { thoughtQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { Dropdown, DropdownItem } from "src/components/Dropdown";
import { HelpTooltip } from "src/components/HelpTooltip";
import LoadingSpinner from "src/components/LoadingSpinner";

import { ThoughtContext } from "../thoughtContext";
import { ChatMessageUserHeader } from "./ChatMessageUserHeader";
import { UseThreadsForDocReturnType, useDeleteThread, useThreadsForDoc } from "./chat";

const useRecentChanges = () => {
	const { thoughtId } = useContext(ThoughtContext);

	return useQuery({
		queryKey: thoughtQueryKeys.recentChanges(thoughtId),
		queryFn: async () => {
			const result = handleSupabaseError(
				await supabase
					.from("document_updates")
					.select(
						"*, repo:repository_connections(provider, owner, name), files:document_update_links(document_repo_links(*)), suggestion_threads:chat_threads(*)",
					)
					.eq("document_id", thoughtId)
					.order("triggered_at", { ascending: false }),
			);

			return result.map(change => ({
				...change,
				files: change.files.flatMap(repoFile => (repoFile.document_repo_links ? [repoFile.document_repo_links] : [])),
			}));
		},
	});
};

const useDeleteDocumentUpdate = (documentUpdateId: string) => {
	return useMutation({
		mutationFn: async () =>
			handleSupabaseError(await supabase.from("document_updates").delete().eq("id", documentUpdateId)),
	});
};

type DocumentUpdate = NonNullable<ReturnType<typeof useRecentChanges>["data"]>[number];

export const ChatHomeView = () => {
	const { thoughtId, setThreadId } = useContext(ThoughtContext);

	const { data: recentChanges, isLoading: isLoadingRecentChanges } = useRecentChanges();
	const { data: threadsForDoc, isLoading: isLoadingThreads } = useThreadsForDoc(thoughtId);

	return (
		<div className="no-scrollbar flex h-full w-full flex-col gap-2 overflow-y-auto py-4">
			<div className="flex flex-row items-center gap-1">
				<h3 className="text-lg font-semibold">Recent Changes</h3>
				<HelpTooltip content="Cloudy will keep track of changes to files in your repositories that are linked to this document." />
			</div>
			{isLoadingRecentChanges ? (
				<LoadingSpinner size="sm" />
			) : !recentChanges || recentChanges?.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-y-2 py-2 text-sm text-tertiary">
					<p>No recent changes affecting this document.</p>
				</div>
			) : (
				recentChanges.map(change => <DocChangeItem key={change.id} change={change} setThreadId={setThreadId} />)
			)}
			<div className="flex flex-row items-center justify-between">
				<h3 className="text-lg font-semibold">Recent Threads</h3>
			</div>
			{isLoadingThreads ? (
				<LoadingSpinner size="md" />
			) : !threadsForDoc || threadsForDoc?.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-y-2 text-secondary">
					<p>No chat threads yet</p>
					<p>Start a new conversation below</p>
				</div>
			) : (
				threadsForDoc.map(thread => <ThreadButton key={thread.id} thread={thread} setThreadId={setThreadId} />)
			)}
		</div>
	);
};

const DocChangeItem = ({ change, setThreadId }: { change: DocumentUpdate; setThreadId: (id: string) => void }) => {
	const repo = change.repo;

	const linkUrl = repo ? `https://github.com/${repo.owner}/${repo.name}/commit/${change.commit_sha}` : "";

	const deleteDocumentUpdateMutation = useDeleteDocumentUpdate(change.id);

	return (
		<div className="flex w-full flex-col gap-1 rounded-lg border border-border p-4">
			<div className="flex w-full flex-row items-start justify-between">
				<div className="flex flex-col items-start">
					<div className="flex flex-row items-center gap-x-1">
						<Link to={linkUrl} target="_blank">
							<div className="flex flex-row items-baseline gap-x-1 text-secondary hover:text-accent hover:underline">
								<SiGithub className="size-3" />
								<div className="font-mono text-xs">
									{repo ? `${repo.owner}/${repo.name} ` : " "}
									{change.commit_sha.slice(0, 6)}
								</div>
								<ExternalLinkIcon className="size-3 translate-y-[0.06rem] stroke-2" />
							</div>
						</Link>
						<span className="text-sm text-tertiary">•</span>
						<div className="text-xs text-secondary">{makeHumanizedTime(change.triggered_at)}</div>
					</div>
					<div className="flex flex-row items-center gap-x-1">
						<span className="text-xs text-secondary">Changed files:</span>
						{change.files.map(file => (
							<div className="text-xs text-secondary">{file.path.split("/").pop()}</div>
						))}
					</div>
				</div>
				<div className="flex flex-row items-center gap-x-2">
					{change.generation_completed_at ? (
						<Button variant="outline" size="xs" onClick={() => deleteDocumentUpdateMutation.mutate()}>
							<XIcon className="size-3.5" />
							<span>Dismiss</span>
						</Button>
					) : (
						<LoadingSpinner size="xs" />
					)}
				</div>
			</div>
			{change.suggestion_threads && change.suggestion_threads.length > 0 ? (
				<Button
					className="self-start text-accent"
					variant="outline"
					size="xs"
					onClick={() => {
						setThreadId(change.suggestion_threads[0].id);
					}}>
					<span>See suggested changes</span>
					<ArrowRightIcon className="size-3.5" />
				</Button>
			) : change.generation_completed_at ? (
				<div className="text-xs text-tertiary">No changes are needed.</div>
			) : (
				<div className="text-xs text-tertiary">Generating suggested changes...</div>
			)}
		</div>
	);
};

const ThreadButton = ({
	thread,
	setThreadId,
}: {
	thread: UseThreadsForDocReturnType[number];
	setThreadId: (id: string) => void;
}) => {
	const deleteThreadMutation = useDeleteThread(thread.id);

	const firstMessage = thread.first_message[0];

	return (
		<button
			key={thread.id}
			onClick={e => {
				// Only set thread ID if not clicking dropdown item
				if (!(e.target as HTMLElement).closest(".dropdown-item")) {
					setThreadId(thread.id);
				}
			}}
			className="flex w-full flex-row items-start justify-between gap-x-2 rounded-lg border border-border p-4 text-left hover:bg-card">
			{firstMessage && (
				<div className="flex flex-1 flex-col pt-0.5">
					{firstMessage.role === ChatRole.User && firstMessage.user_id && (
						<ChatMessageUserHeader userId={firstMessage.user_id} />
					)}
					<div className="line-clamp-2 text-sm">{firstMessage.content || "Empty thread"}</div>
				</div>
			)}
			<div className="flex flex-row items-center justify-between gap-x-2">
				<div className="shrink-0 text-xs text-secondary">{makeHumanizedTime(thread.created_at)}</div>
				<Dropdown
					trigger={
						<Button variant="ghost" size="icon-xs" className="text-secondary">
							<MoreHorizontalIcon className="size-4" />
						</Button>
					}>
					<DropdownItem
						className="dropdown-item"
						onSelect={() => {
							deleteThreadMutation.mutate();
						}}>
						<TrashIcon className="size-4" />
						<span>Delete thread</span>
					</DropdownItem>
				</Dropdown>
			</div>
		</button>
	);
};
