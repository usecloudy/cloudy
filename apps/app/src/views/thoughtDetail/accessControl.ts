import { AccessStrategies, handleSupabaseError } from "@cloudy/utils/common";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { thoughtKeys, thoughtQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";
import { fixOneToOne } from "src/utils";

import { useThought } from "./hooks";

export interface DocumentAccessControlUser {
	id: string;
	name?: string | null;
	email?: string | null;
	isExternal?: boolean;
}

export interface DocumentAccessControl {
	accessStrategy: AccessStrategies;
	users: DocumentAccessControlUser[];
}

export const useAddDocumentUser = (docId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (email: string) => {
			const user = handleSupabaseError(await supabase.from("users").select("id").eq("email", email).single());

			if (!user) {
				throw new Error("User not found");
			}

			return handleSupabaseError(
				await supabase.from("document_shares").insert({
					document_id: docId,
					user_id: user.id,
				}),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: thoughtKeys.detail(docId) });
			queryClient.invalidateQueries({ queryKey: thoughtQueryKeys.sharedWith(docId) });
		},
	});
};

export const useRemoveDocumentUser = (docId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (userId: string) => {
			return handleSupabaseError(
				await supabase.from("document_shares").delete().match({ document_id: docId, user_id: userId }),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: thoughtKeys.detail(docId) });
			queryClient.invalidateQueries({ queryKey: thoughtQueryKeys.sharedWith(docId) });
		},
	});
};

export const useDocumentAccessControl = (docId: string): DocumentAccessControl => {
	const { data: doc } = useThought(docId);

	const { data: users } = useQuery({
		queryKey: thoughtQueryKeys.sharedWith(docId),
		queryFn: async () => {
			if (!doc) {
				return [];
			}

			// Get document shares with users and their workspace membership in a single query
			const documentShares = handleSupabaseError(
				await supabase
					.from("document_shares")
					.select(
						`
					user:users!user_id (
					  id, 
					  name, 
					  email,
					  workspace_users (
						id,
						workspace_id
					  )
					)
				  `,
					)
					.eq("document_id", docId),
			);

			// Get all users who have access to this workspace
			const workspaceUsers = new Set(
				documentShares?.flatMap(share => {
					const user = fixOneToOne(share.user);
					return user?.workspace_users?.filter(wu => wu.workspace_id === doc.workspace_id).map(wu => user.id);
				}),
			);

			// Map all users and mark them as external if not in workspace
			const usersWithAccess = documentShares?.map(share => ({
				...fixOneToOne(share.user)!,
				isExternal: !workspaceUsers.has(fixOneToOne(share.user)?.id),
			}));

			return usersWithAccess ?? [];
		},
	});

	const accessStrategy = doc?.access_strategy as AccessStrategies;

	return useMemo(
		() => ({
			accessStrategy,
			users: users ?? [],
		}),
		[accessStrategy, users],
	);
};
