drop policy "Enable all for authenticated users only" on "public"."thought_chats";

drop policy "Enable all for authenticated users only" on "public"."thought_embedding_matches";

drop policy "Enable All for authenticated users only" on "public"."thought_embeddings";

drop policy "Workspace members" on "public"."workspaces";

drop policy "Thought access control" on "public"."thoughts";

revoke delete on table "public"."thought_chat_threads" from "anon";

revoke insert on table "public"."thought_chat_threads" from "anon";

revoke references on table "public"."thought_chat_threads" from "anon";

revoke select on table "public"."thought_chat_threads" from "anon";

revoke trigger on table "public"."thought_chat_threads" from "anon";

revoke truncate on table "public"."thought_chat_threads" from "anon";

revoke update on table "public"."thought_chat_threads" from "anon";

revoke delete on table "public"."thought_chat_threads" from "authenticated";

revoke insert on table "public"."thought_chat_threads" from "authenticated";

revoke references on table "public"."thought_chat_threads" from "authenticated";

revoke select on table "public"."thought_chat_threads" from "authenticated";

revoke trigger on table "public"."thought_chat_threads" from "authenticated";

revoke truncate on table "public"."thought_chat_threads" from "authenticated";

revoke update on table "public"."thought_chat_threads" from "authenticated";

revoke delete on table "public"."thought_chat_threads" from "service_role";

revoke insert on table "public"."thought_chat_threads" from "service_role";

revoke references on table "public"."thought_chat_threads" from "service_role";

revoke select on table "public"."thought_chat_threads" from "service_role";

revoke trigger on table "public"."thought_chat_threads" from "service_role";

revoke truncate on table "public"."thought_chat_threads" from "service_role";

revoke update on table "public"."thought_chat_threads" from "service_role";

revoke delete on table "public"."thought_chats" from "anon";

revoke insert on table "public"."thought_chats" from "anon";

revoke references on table "public"."thought_chats" from "anon";

revoke select on table "public"."thought_chats" from "anon";

revoke trigger on table "public"."thought_chats" from "anon";

revoke truncate on table "public"."thought_chats" from "anon";

revoke update on table "public"."thought_chats" from "anon";

revoke delete on table "public"."thought_chats" from "authenticated";

revoke insert on table "public"."thought_chats" from "authenticated";

revoke references on table "public"."thought_chats" from "authenticated";

revoke select on table "public"."thought_chats" from "authenticated";

revoke trigger on table "public"."thought_chats" from "authenticated";

revoke truncate on table "public"."thought_chats" from "authenticated";

revoke update on table "public"."thought_chats" from "authenticated";

revoke delete on table "public"."thought_chats" from "service_role";

revoke insert on table "public"."thought_chats" from "service_role";

revoke references on table "public"."thought_chats" from "service_role";

revoke select on table "public"."thought_chats" from "service_role";

revoke trigger on table "public"."thought_chats" from "service_role";

revoke truncate on table "public"."thought_chats" from "service_role";

revoke update on table "public"."thought_chats" from "service_role";

revoke delete on table "public"."thought_chunk_matches" from "anon";

revoke insert on table "public"."thought_chunk_matches" from "anon";

revoke references on table "public"."thought_chunk_matches" from "anon";

revoke select on table "public"."thought_chunk_matches" from "anon";

revoke trigger on table "public"."thought_chunk_matches" from "anon";

revoke truncate on table "public"."thought_chunk_matches" from "anon";

revoke update on table "public"."thought_chunk_matches" from "anon";

revoke delete on table "public"."thought_chunk_matches" from "authenticated";

revoke insert on table "public"."thought_chunk_matches" from "authenticated";

revoke references on table "public"."thought_chunk_matches" from "authenticated";

revoke select on table "public"."thought_chunk_matches" from "authenticated";

revoke trigger on table "public"."thought_chunk_matches" from "authenticated";

revoke truncate on table "public"."thought_chunk_matches" from "authenticated";

revoke update on table "public"."thought_chunk_matches" from "authenticated";

revoke delete on table "public"."thought_chunk_matches" from "service_role";

revoke insert on table "public"."thought_chunk_matches" from "service_role";

revoke references on table "public"."thought_chunk_matches" from "service_role";

revoke select on table "public"."thought_chunk_matches" from "service_role";

revoke trigger on table "public"."thought_chunk_matches" from "service_role";

revoke truncate on table "public"."thought_chunk_matches" from "service_role";

revoke update on table "public"."thought_chunk_matches" from "service_role";

revoke delete on table "public"."thought_chunks" from "anon";

revoke insert on table "public"."thought_chunks" from "anon";

revoke references on table "public"."thought_chunks" from "anon";

revoke select on table "public"."thought_chunks" from "anon";

revoke trigger on table "public"."thought_chunks" from "anon";

revoke truncate on table "public"."thought_chunks" from "anon";

revoke update on table "public"."thought_chunks" from "anon";

revoke delete on table "public"."thought_chunks" from "authenticated";

revoke insert on table "public"."thought_chunks" from "authenticated";

revoke references on table "public"."thought_chunks" from "authenticated";

revoke select on table "public"."thought_chunks" from "authenticated";

revoke trigger on table "public"."thought_chunks" from "authenticated";

revoke truncate on table "public"."thought_chunks" from "authenticated";

revoke update on table "public"."thought_chunks" from "authenticated";

revoke delete on table "public"."thought_chunks" from "service_role";

revoke insert on table "public"."thought_chunks" from "service_role";

revoke references on table "public"."thought_chunks" from "service_role";

revoke select on table "public"."thought_chunks" from "service_role";

revoke trigger on table "public"."thought_chunks" from "service_role";

revoke truncate on table "public"."thought_chunks" from "service_role";

revoke update on table "public"."thought_chunks" from "service_role";

revoke delete on table "public"."thought_embedding_matches" from "anon";

revoke insert on table "public"."thought_embedding_matches" from "anon";

revoke references on table "public"."thought_embedding_matches" from "anon";

revoke select on table "public"."thought_embedding_matches" from "anon";

revoke trigger on table "public"."thought_embedding_matches" from "anon";

revoke truncate on table "public"."thought_embedding_matches" from "anon";

revoke update on table "public"."thought_embedding_matches" from "anon";

revoke delete on table "public"."thought_embedding_matches" from "authenticated";

revoke insert on table "public"."thought_embedding_matches" from "authenticated";

revoke references on table "public"."thought_embedding_matches" from "authenticated";

revoke select on table "public"."thought_embedding_matches" from "authenticated";

revoke trigger on table "public"."thought_embedding_matches" from "authenticated";

revoke truncate on table "public"."thought_embedding_matches" from "authenticated";

revoke update on table "public"."thought_embedding_matches" from "authenticated";

revoke delete on table "public"."thought_embedding_matches" from "service_role";

revoke insert on table "public"."thought_embedding_matches" from "service_role";

revoke references on table "public"."thought_embedding_matches" from "service_role";

revoke select on table "public"."thought_embedding_matches" from "service_role";

revoke trigger on table "public"."thought_embedding_matches" from "service_role";

revoke truncate on table "public"."thought_embedding_matches" from "service_role";

revoke update on table "public"."thought_embedding_matches" from "service_role";

revoke delete on table "public"."thought_embeddings" from "anon";

revoke insert on table "public"."thought_embeddings" from "anon";

revoke references on table "public"."thought_embeddings" from "anon";

revoke select on table "public"."thought_embeddings" from "anon";

revoke trigger on table "public"."thought_embeddings" from "anon";

revoke truncate on table "public"."thought_embeddings" from "anon";

revoke update on table "public"."thought_embeddings" from "anon";

revoke delete on table "public"."thought_embeddings" from "authenticated";

revoke insert on table "public"."thought_embeddings" from "authenticated";

revoke references on table "public"."thought_embeddings" from "authenticated";

revoke select on table "public"."thought_embeddings" from "authenticated";

revoke trigger on table "public"."thought_embeddings" from "authenticated";

revoke truncate on table "public"."thought_embeddings" from "authenticated";

revoke update on table "public"."thought_embeddings" from "authenticated";

revoke delete on table "public"."thought_embeddings" from "service_role";

revoke insert on table "public"."thought_embeddings" from "service_role";

revoke references on table "public"."thought_embeddings" from "service_role";

revoke select on table "public"."thought_embeddings" from "service_role";

revoke trigger on table "public"."thought_embeddings" from "service_role";

revoke truncate on table "public"."thought_embeddings" from "service_role";

revoke update on table "public"."thought_embeddings" from "service_role";

revoke delete on table "public"."thought_relations" from "anon";

revoke insert on table "public"."thought_relations" from "anon";

revoke references on table "public"."thought_relations" from "anon";

revoke select on table "public"."thought_relations" from "anon";

revoke trigger on table "public"."thought_relations" from "anon";

revoke truncate on table "public"."thought_relations" from "anon";

revoke update on table "public"."thought_relations" from "anon";

revoke delete on table "public"."thought_relations" from "authenticated";

revoke insert on table "public"."thought_relations" from "authenticated";

revoke references on table "public"."thought_relations" from "authenticated";

revoke select on table "public"."thought_relations" from "authenticated";

revoke trigger on table "public"."thought_relations" from "authenticated";

revoke truncate on table "public"."thought_relations" from "authenticated";

revoke update on table "public"."thought_relations" from "authenticated";

revoke delete on table "public"."thought_relations" from "service_role";

revoke insert on table "public"."thought_relations" from "service_role";

revoke references on table "public"."thought_relations" from "service_role";

revoke select on table "public"."thought_relations" from "service_role";

revoke trigger on table "public"."thought_relations" from "service_role";

revoke truncate on table "public"."thought_relations" from "service_role";

revoke update on table "public"."thought_relations" from "service_role";

revoke delete on table "public"."thought_summary_embeddings" from "anon";

revoke insert on table "public"."thought_summary_embeddings" from "anon";

revoke references on table "public"."thought_summary_embeddings" from "anon";

revoke select on table "public"."thought_summary_embeddings" from "anon";

revoke trigger on table "public"."thought_summary_embeddings" from "anon";

revoke truncate on table "public"."thought_summary_embeddings" from "anon";

revoke update on table "public"."thought_summary_embeddings" from "anon";

revoke delete on table "public"."thought_summary_embeddings" from "authenticated";

revoke insert on table "public"."thought_summary_embeddings" from "authenticated";

revoke references on table "public"."thought_summary_embeddings" from "authenticated";

revoke select on table "public"."thought_summary_embeddings" from "authenticated";

revoke trigger on table "public"."thought_summary_embeddings" from "authenticated";

revoke truncate on table "public"."thought_summary_embeddings" from "authenticated";

revoke update on table "public"."thought_summary_embeddings" from "authenticated";

revoke delete on table "public"."thought_summary_embeddings" from "service_role";

revoke insert on table "public"."thought_summary_embeddings" from "service_role";

revoke references on table "public"."thought_summary_embeddings" from "service_role";

revoke select on table "public"."thought_summary_embeddings" from "service_role";

revoke trigger on table "public"."thought_summary_embeddings" from "service_role";

revoke truncate on table "public"."thought_summary_embeddings" from "service_role";

revoke update on table "public"."thought_summary_embeddings" from "service_role";

alter table "public"."thought_chat_threads" drop constraint "thought_chat_threads_comment_id_fkey";

alter table "public"."thought_chats" drop constraint "thought_chats_thought_id_fkey";

alter table "public"."thought_chunk_matches" drop constraint "thought_chunk_matches_matched_by_fkey";

alter table "public"."thought_chunk_matches" drop constraint "thought_chunk_matches_matches_fkey";

alter table "public"."thought_chunk_matches" drop constraint "thought_chunk_matches_matches_thought_id_fkey";

alter table "public"."thought_chunk_matches" drop constraint "thought_chunk_matches_thought_id_fkey";

alter table "public"."thought_chunks" drop constraint "thought_chunks_thought_id_fkey";

alter table "public"."thought_embedding_matches" drop constraint "thought_embedding_matches_matched_by_fkey";

alter table "public"."thought_embedding_matches" drop constraint "thought_embedding_matches_matches_fkey";

alter table "public"."thought_embedding_matches" drop constraint "thought_embedding_matches_matches_thought_id_fkey";

alter table "public"."thought_embedding_matches" drop constraint "thought_embedding_matches_thought_id_fkey";

alter table "public"."thought_embeddings" drop constraint "thought_embeddings_thought_id_fkey";

alter table "public"."thought_relations" drop constraint "thought_summary_matches_matched_by_fkey";

alter table "public"."thought_relations" drop constraint "thought_summary_matches_matches_fkey";

alter table "public"."thought_summary_embeddings" drop constraint "thought_summary_embeddings_thought_id_fkey";

drop function if exists "public"."embedding_collection_intent_search"(query_embedding vector, match_threshold double precision, max_results integer, p_workspace_id uuid);

drop function if exists "public"."embedding_thought_summary_search"(query_embedding vector, match_threshold double precision, max_results integer, p_workspace_id uuid, ignore_thought_ids uuid[]);

drop function if exists "public"."match_thought_chats"(query_embedding vector, match_threshold double precision, match_count integer, thought_id uuid);

drop function if exists "public"."match_thought_chunks"(query_embedding vector, match_threshold double precision, match_count integer, exclude_thought_id uuid, input_workspace_id uuid);

drop function if exists "public"."match_thoughts"(query_embedding vector, match_threshold double precision, match_count integer, author_id uuid);

drop function if exists "public"."match_thoughts"(query_embedding vector, match_threshold double precision, match_count integer, author_id uuid, collection_id uuid);

drop function if exists "public"."multi_embedding_thought_chunk_search"(query_embeddings vector[], match_threshold double precision, max_results integer, workspace_id uuid);

drop function if exists "public"."update_thought_embedding_matches"(p_thought_id uuid, p_match_pairs jsonb);

alter table "public"."thought_chat_threads" drop constraint "thought_chat_threads_pkey";

alter table "public"."thought_chats" drop constraint "thought_chats_pkey";

alter table "public"."thought_chunk_matches" drop constraint "thought_chunk_matches_pkey";

alter table "public"."thought_chunks" drop constraint "thought_chunks_pkey";

alter table "public"."thought_embedding_matches" drop constraint "thought_embedding_matches_pkey";

alter table "public"."thought_embeddings" drop constraint "thought_embeddings_pkey";

alter table "public"."thought_relations" drop constraint "thought_summary_matches_pkey";

alter table "public"."thought_summary_embeddings" drop constraint "thought_summary_embeddings_pkey";

drop index if exists "public"."thought_chat_threads_pkey";

drop index if exists "public"."thought_chats_pkey";

drop index if exists "public"."thought_chunk_matches_pkey";

drop index if exists "public"."thought_chunks_pkey";

drop index if exists "public"."thought_embedding_matches_pkey";

drop index if exists "public"."thought_embedding_matches_unique_pair";

drop index if exists "public"."thought_embeddings_index";

drop index if exists "public"."thought_embeddings_pkey";

drop index if exists "public"."thought_summary_embeddings_pkey";

drop index if exists "public"."thought_summary_matches_pkey";

drop table "public"."thought_chat_threads";

drop table "public"."thought_chats";

drop table "public"."thought_chunk_matches";

drop table "public"."thought_chunks";

drop table "public"."thought_embedding_matches";

drop table "public"."thought_embeddings";

drop table "public"."thought_relations";

drop table "public"."thought_summary_embeddings";

alter table "public"."chat_messages" add column "file_references" jsonb;

alter table "public"."document_shares" enable row level security;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_thought_access(thought_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM document_shares
    WHERE document_shares.document_id = thought_id 
    AND document_shares.user_id = user_id
  );
$function$
;

create policy "Workspace Members Only"
on "public"."document_shares"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM (workspace_users
     JOIN thoughts ON ((thoughts.workspace_id = workspace_users.workspace_id)))
  WHERE ((thoughts.id = document_shares.document_id) AND (workspace_users.user_id = auth.uid())))));


create policy "Thought access control"
on "public"."thoughts"
as permissive
for all
to public
using (((access_strategy = 'public'::text) OR ((access_strategy = 'workspace'::text) AND (EXISTS ( SELECT 1
   FROM workspace_users
  WHERE ((workspace_users.workspace_id = thoughts.workspace_id) AND (workspace_users.user_id = auth.uid()))))) OR ((access_strategy = 'private'::text) AND ((author_id = auth.uid()) OR check_thought_access(id, auth.uid())))));