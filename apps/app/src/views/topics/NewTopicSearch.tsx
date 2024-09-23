import { TopicsNewPostRequestBody } from "@cloudy/utils/common";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { apiClient } from "src/api/client";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { Input } from "src/components/Input";
import { useWorkspace } from "src/stores/workspace";

const useCreateTopic = () => {
	const queryClient = useQueryClient();
	const workspace = useWorkspace();

	return useMutation({
		mutationFn: async (query: string) => {
			await apiClient.post("/api/topics/new", { query, workspaceId: workspace.id } satisfies TopicsNewPostRequestBody);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["topics"] });
		},
	});
};

export const NewTopicSearch = () => {
	const [query, setQuery] = useState("");
	const createTopic = useCreateTopic();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (query.trim()) {
			createTopic.mutate(query.trim());
			setQuery("");
		}
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-1 gap-2">
			<Input
				value={query}
				onChange={e => setQuery(e.target.value)}
				placeholder="Search or create a new topic..."
				className="flex-grow"
			/>
			<Button type="submit" disabled={createTopic.isPending}>
				<PlusIcon className="size-4" />
				{createTopic.isPending ? "Creating..." : "Create Topic"}
			</Button>
		</form>
	);
};
