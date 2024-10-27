drop policy "Can access only as workspace member" on "public"."thoughts";

revoke delete on table "public"."topic_message_matches" from "anon";

revoke insert on table "public"."topic_message_matches" from "anon";

revoke references on table "public"."topic_message_matches" from "anon";

revoke select on table "public"."topic_message_matches" from "anon";

revoke trigger on table "public"."topic_message_matches" from "anon";

revoke truncate on table "public"."topic_message_matches" from "anon";

revoke update on table "public"."topic_message_matches" from "anon";

revoke delete on table "public"."topic_message_matches" from "authenticated";

revoke insert on table "public"."topic_message_matches" from "authenticated";

revoke references on table "public"."topic_message_matches" from "authenticated";

revoke select on table "public"."topic_message_matches" from "authenticated";

revoke trigger on table "public"."topic_message_matches" from "authenticated";

revoke truncate on table "public"."topic_message_matches" from "authenticated";

revoke update on table "public"."topic_message_matches" from "authenticated";

revoke delete on table "public"."topic_message_matches" from "service_role";

revoke insert on table "public"."topic_message_matches" from "service_role";

revoke references on table "public"."topic_message_matches" from "service_role";

revoke select on table "public"."topic_message_matches" from "service_role";

revoke trigger on table "public"."topic_message_matches" from "service_role";

revoke truncate on table "public"."topic_message_matches" from "service_role";

revoke update on table "public"."topic_message_matches" from "service_role";

revoke delete on table "public"."topic_thought_chunk_matches" from "anon";

revoke insert on table "public"."topic_thought_chunk_matches" from "anon";

revoke references on table "public"."topic_thought_chunk_matches" from "anon";

revoke select on table "public"."topic_thought_chunk_matches" from "anon";

revoke trigger on table "public"."topic_thought_chunk_matches" from "anon";

revoke truncate on table "public"."topic_thought_chunk_matches" from "anon";

revoke update on table "public"."topic_thought_chunk_matches" from "anon";

revoke delete on table "public"."topic_thought_chunk_matches" from "authenticated";

revoke insert on table "public"."topic_thought_chunk_matches" from "authenticated";

revoke references on table "public"."topic_thought_chunk_matches" from "authenticated";

revoke select on table "public"."topic_thought_chunk_matches" from "authenticated";

revoke trigger on table "public"."topic_thought_chunk_matches" from "authenticated";

revoke truncate on table "public"."topic_thought_chunk_matches" from "authenticated";

revoke update on table "public"."topic_thought_chunk_matches" from "authenticated";

revoke delete on table "public"."topic_thought_chunk_matches" from "service_role";

revoke insert on table "public"."topic_thought_chunk_matches" from "service_role";

revoke references on table "public"."topic_thought_chunk_matches" from "service_role";

revoke select on table "public"."topic_thought_chunk_matches" from "service_role";

revoke trigger on table "public"."topic_thought_chunk_matches" from "service_role";

revoke truncate on table "public"."topic_thought_chunk_matches" from "service_role";

revoke update on table "public"."topic_thought_chunk_matches" from "service_role";

revoke delete on table "public"."topics" from "anon";

revoke insert on table "public"."topics" from "anon";

revoke references on table "public"."topics" from "anon";

revoke select on table "public"."topics" from "anon";

revoke trigger on table "public"."topics" from "anon";

revoke truncate on table "public"."topics" from "anon";

revoke update on table "public"."topics" from "anon";

revoke delete on table "public"."topics" from "authenticated";

revoke insert on table "public"."topics" from "authenticated";

revoke references on table "public"."topics" from "authenticated";

revoke select on table "public"."topics" from "authenticated";

revoke trigger on table "public"."topics" from "authenticated";

revoke truncate on table "public"."topics" from "authenticated";

revoke update on table "public"."topics" from "authenticated";

revoke delete on table "public"."topics" from "service_role";

revoke insert on table "public"."topics" from "service_role";

revoke references on table "public"."topics" from "service_role";

revoke select on table "public"."topics" from "service_role";

revoke trigger on table "public"."topics" from "service_role";

revoke truncate on table "public"."topics" from "service_role";

revoke update on table "public"."topics" from "service_role";

alter table "public"."thought_chunk_multi_embeddings" drop constraint "thought_chunk_multi_embeddings_chunk_id_fkey";

alter table "public"."topic_thought_chunk_matches" drop constraint "topic_thought_chunk_matches_chunk_id_fkey";

alter table "public"."topic_thought_chunk_matches" drop constraint "topic_thought_chunk_matches_topic_id_fkey";

alter table "public"."topics" drop constraint "topics_organization_fkey";

alter table "public"."topics" drop constraint "topics_workspace_id_fkey";

alter table "public"."thought_chunk_multi_embeddings" drop constraint "thought_chunk_multi_embeddings_pkey";

alter table "public"."topic_message_matches" drop constraint "topic_message_matches_pkey";

alter table "public"."topic_thought_chunk_matches" drop constraint "topic_thought_chunk_matches_pkey";

alter table "public"."topics" drop constraint "topics_pkey";

drop index if exists "public"."thought_chunk_multi_embeddings_pkey";

drop index if exists "public"."topic_message_matches_pkey";

drop index if exists "public"."topic_thought_chunk_matches_pkey";

drop index if exists "public"."topics_pkey";

drop table "public"."thought_chunk_multi_embeddings";

drop table "public"."topic_message_matches";

drop table "public"."topic_thought_chunk_matches";

drop table "public"."topics";

create table "public"."document_repo_links" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "doc_id" uuid not null,
    "path" text not null,
    "repo_connection_id" uuid not null,
    "type" text not null
);


create table "public"."document_shares" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "user_id" uuid not null,
    "document_id" uuid not null
);


create table "public"."folders" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text,
    "parent_id" uuid,
    "project_id" uuid,
    "is_root" boolean not null default false,
    "index" integer,
    "workspace_id" uuid not null
);


create table "public"."projects" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "workspace_id" uuid not null,
    "name" text not null,
    "slug" text not null,
    "connections" jsonb not null default '{}'::jsonb
);


create table "public"."repository_connections" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "project_id" uuid not null,
    "external_id" text not null,
    "owner" text not null,
    "name" text not null,
    "provider" text not null,
    "installation_id" text not null
);


create table "public"."thought_chunk_matches" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "similarity" real not null,
    "matched_by" uuid not null,
    "matches" uuid not null,
    "thought_id" uuid not null,
    "matches_thought_id" uuid not null
);


create table "public"."workspace_github_connections" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "workspace_id" uuid not null,
    "installation_id" text not null
);


alter table "public"."thoughts" add column "access_strategy" text not null default 'workspace'::text;

alter table "public"."thoughts" add column "folder_id" uuid;

alter table "public"."thoughts" add column "generated_at" timestamp with time zone;

alter table "public"."thoughts" add column "generated_summary_content_md" text;

alter table "public"."thoughts" add column "generation_prompt" text;

alter table "public"."thoughts" add column "index" integer;

alter table "public"."thoughts" add column "project_id" uuid;

alter table "public"."workspaces" add column "folders_migrated_at" timestamp with time zone;

alter table "public"."workspaces" disable row level security;

CREATE UNIQUE INDEX document_file_links_pkey ON public.document_repo_links USING btree (id);

CREATE UNIQUE INDEX document_shares_pkey ON public.document_shares USING btree (id);

CREATE UNIQUE INDEX document_shares_user_id ON public.document_shares USING btree (document_id, user_id);

CREATE UNIQUE INDEX folders_pkey ON public.folders USING btree (id);

CREATE UNIQUE INDEX projects_pkey ON public.projects USING btree (id);

CREATE UNIQUE INDEX repository_connections_pkey ON public.repository_connections USING btree (id);

CREATE UNIQUE INDEX thought_chunk_matches_pkey ON public.thought_chunk_matches USING btree (id);

CREATE UNIQUE INDEX unique_root_folder_per_project ON public.folders USING btree (project_id) WHERE (parent_id IS NULL);

CREATE UNIQUE INDEX workspace_github_connections_pkey ON public.workspace_github_connections USING btree (id);

alter table "public"."document_repo_links" add constraint "document_file_links_pkey" PRIMARY KEY using index "document_file_links_pkey";

alter table "public"."document_shares" add constraint "document_shares_pkey" PRIMARY KEY using index "document_shares_pkey";

alter table "public"."folders" add constraint "folders_pkey" PRIMARY KEY using index "folders_pkey";

alter table "public"."projects" add constraint "projects_pkey" PRIMARY KEY using index "projects_pkey";

alter table "public"."repository_connections" add constraint "repository_connections_pkey" PRIMARY KEY using index "repository_connections_pkey";

alter table "public"."thought_chunk_matches" add constraint "thought_chunk_matches_pkey" PRIMARY KEY using index "thought_chunk_matches_pkey";

alter table "public"."workspace_github_connections" add constraint "workspace_github_connections_pkey" PRIMARY KEY using index "workspace_github_connections_pkey";

alter table "public"."document_repo_links" add constraint "document_file_links_doc_id_fkey" FOREIGN KEY (doc_id) REFERENCES thoughts(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."document_repo_links" validate constraint "document_file_links_doc_id_fkey";

alter table "public"."document_repo_links" add constraint "document_file_links_repo_connection_id_fkey" FOREIGN KEY (repo_connection_id) REFERENCES repository_connections(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."document_repo_links" validate constraint "document_file_links_repo_connection_id_fkey";

alter table "public"."document_shares" add constraint "document_shares_document_id_fkey" FOREIGN KEY (document_id) REFERENCES thoughts(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."document_shares" validate constraint "document_shares_document_id_fkey";

alter table "public"."document_shares" add constraint "document_shares_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."document_shares" validate constraint "document_shares_user_id_fkey";

alter table "public"."folders" add constraint "folders_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES folders(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."folders" validate constraint "folders_parent_id_fkey";

alter table "public"."folders" add constraint "folders_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."folders" validate constraint "folders_project_id_fkey";

alter table "public"."folders" add constraint "folders_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."folders" validate constraint "folders_workspace_id_fkey";

alter table "public"."projects" add constraint "projects_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."projects" validate constraint "projects_workspace_id_fkey";

alter table "public"."repository_connections" add constraint "repository_connections_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."repository_connections" validate constraint "repository_connections_project_id_fkey";

alter table "public"."thought_chunk_matches" add constraint "thought_chunk_matches_matched_by_fkey" FOREIGN KEY (matched_by) REFERENCES thought_chunks(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."thought_chunk_matches" validate constraint "thought_chunk_matches_matched_by_fkey";

alter table "public"."thought_chunk_matches" add constraint "thought_chunk_matches_matches_fkey" FOREIGN KEY (matches) REFERENCES thought_chunks(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."thought_chunk_matches" validate constraint "thought_chunk_matches_matches_fkey";

alter table "public"."thought_chunk_matches" add constraint "thought_chunk_matches_matches_thought_id_fkey" FOREIGN KEY (matches_thought_id) REFERENCES thoughts(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."thought_chunk_matches" validate constraint "thought_chunk_matches_matches_thought_id_fkey";

alter table "public"."thought_chunk_matches" add constraint "thought_chunk_matches_thought_id_fkey" FOREIGN KEY (thought_id) REFERENCES thoughts(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."thought_chunk_matches" validate constraint "thought_chunk_matches_thought_id_fkey";

alter table "public"."thoughts" add constraint "thoughts_folder_id_fkey" FOREIGN KEY (folder_id) REFERENCES folders(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."thoughts" validate constraint "thoughts_folder_id_fkey";

alter table "public"."thoughts" add constraint "thoughts_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."thoughts" validate constraint "thoughts_project_id_fkey";

alter table "public"."workspace_github_connections" add constraint "workspace_github_connections_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."workspace_github_connections" validate constraint "workspace_github_connections_workspace_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_folder_children_count(p_folder_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  total_count integer;
begin
  select 
    (
      (select count(*) from folders where parent_id = p_folder_id) +
      (select count(*) from thoughts where folder_id = p_folder_id)
    ) into total_count;
  
  return total_count;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.search_docs(search_query text, p_workspace_id uuid)
 RETURNS TABLE(doc_id uuid, doc_title text, doc_content_md text, doc_content_plaintext text, doc_updated_at timestamp with time zone, doc_project_id uuid, project_name text, project_slug text)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT  
    thoughts.id AS doc_id, 
    thoughts.title AS doc_title, 
    thoughts.content_md AS doc_content_md, 
    thoughts.content_plaintext AS doc_content_plaintext, 
    thoughts.updated_at AS doc_updated_at,
    thoughts.project_id AS doc_project_id,
    projects.name as project_name,
    projects.slug as project_slug
  FROM thoughts
  LEFT JOIN projects ON thoughts.project_id = projects.id
  WHERE to_tsvector(COALESCE(thoughts.title, '') || ' ' || COALESCE(thoughts.content_md, '')) @@ to_tsquery(search_query || ':*')
  AND thoughts.workspace_id = p_workspace_id
  ORDER BY thoughts.updated_at DESC;
END;
$function$
;

grant delete on table "public"."document_repo_links" to "anon";

grant insert on table "public"."document_repo_links" to "anon";

grant references on table "public"."document_repo_links" to "anon";

grant select on table "public"."document_repo_links" to "anon";

grant trigger on table "public"."document_repo_links" to "anon";

grant truncate on table "public"."document_repo_links" to "anon";

grant update on table "public"."document_repo_links" to "anon";

grant delete on table "public"."document_repo_links" to "authenticated";

grant insert on table "public"."document_repo_links" to "authenticated";

grant references on table "public"."document_repo_links" to "authenticated";

grant select on table "public"."document_repo_links" to "authenticated";

grant trigger on table "public"."document_repo_links" to "authenticated";

grant truncate on table "public"."document_repo_links" to "authenticated";

grant update on table "public"."document_repo_links" to "authenticated";

grant delete on table "public"."document_repo_links" to "service_role";

grant insert on table "public"."document_repo_links" to "service_role";

grant references on table "public"."document_repo_links" to "service_role";

grant select on table "public"."document_repo_links" to "service_role";

grant trigger on table "public"."document_repo_links" to "service_role";

grant truncate on table "public"."document_repo_links" to "service_role";

grant update on table "public"."document_repo_links" to "service_role";

grant delete on table "public"."document_shares" to "anon";

grant insert on table "public"."document_shares" to "anon";

grant references on table "public"."document_shares" to "anon";

grant select on table "public"."document_shares" to "anon";

grant trigger on table "public"."document_shares" to "anon";

grant truncate on table "public"."document_shares" to "anon";

grant update on table "public"."document_shares" to "anon";

grant delete on table "public"."document_shares" to "authenticated";

grant insert on table "public"."document_shares" to "authenticated";

grant references on table "public"."document_shares" to "authenticated";

grant select on table "public"."document_shares" to "authenticated";

grant trigger on table "public"."document_shares" to "authenticated";

grant truncate on table "public"."document_shares" to "authenticated";

grant update on table "public"."document_shares" to "authenticated";

grant delete on table "public"."document_shares" to "service_role";

grant insert on table "public"."document_shares" to "service_role";

grant references on table "public"."document_shares" to "service_role";

grant select on table "public"."document_shares" to "service_role";

grant trigger on table "public"."document_shares" to "service_role";

grant truncate on table "public"."document_shares" to "service_role";

grant update on table "public"."document_shares" to "service_role";

grant delete on table "public"."folders" to "anon";

grant insert on table "public"."folders" to "anon";

grant references on table "public"."folders" to "anon";

grant select on table "public"."folders" to "anon";

grant trigger on table "public"."folders" to "anon";

grant truncate on table "public"."folders" to "anon";

grant update on table "public"."folders" to "anon";

grant delete on table "public"."folders" to "authenticated";

grant insert on table "public"."folders" to "authenticated";

grant references on table "public"."folders" to "authenticated";

grant select on table "public"."folders" to "authenticated";

grant trigger on table "public"."folders" to "authenticated";

grant truncate on table "public"."folders" to "authenticated";

grant update on table "public"."folders" to "authenticated";

grant delete on table "public"."folders" to "service_role";

grant insert on table "public"."folders" to "service_role";

grant references on table "public"."folders" to "service_role";

grant select on table "public"."folders" to "service_role";

grant trigger on table "public"."folders" to "service_role";

grant truncate on table "public"."folders" to "service_role";

grant update on table "public"."folders" to "service_role";

grant delete on table "public"."projects" to "anon";

grant insert on table "public"."projects" to "anon";

grant references on table "public"."projects" to "anon";

grant select on table "public"."projects" to "anon";

grant trigger on table "public"."projects" to "anon";

grant truncate on table "public"."projects" to "anon";

grant update on table "public"."projects" to "anon";

grant delete on table "public"."projects" to "authenticated";

grant insert on table "public"."projects" to "authenticated";

grant references on table "public"."projects" to "authenticated";

grant select on table "public"."projects" to "authenticated";

grant trigger on table "public"."projects" to "authenticated";

grant truncate on table "public"."projects" to "authenticated";

grant update on table "public"."projects" to "authenticated";

grant delete on table "public"."projects" to "service_role";

grant insert on table "public"."projects" to "service_role";

grant references on table "public"."projects" to "service_role";

grant select on table "public"."projects" to "service_role";

grant trigger on table "public"."projects" to "service_role";

grant truncate on table "public"."projects" to "service_role";

grant update on table "public"."projects" to "service_role";

grant delete on table "public"."repository_connections" to "anon";

grant insert on table "public"."repository_connections" to "anon";

grant references on table "public"."repository_connections" to "anon";

grant select on table "public"."repository_connections" to "anon";

grant trigger on table "public"."repository_connections" to "anon";

grant truncate on table "public"."repository_connections" to "anon";

grant update on table "public"."repository_connections" to "anon";

grant delete on table "public"."repository_connections" to "authenticated";

grant insert on table "public"."repository_connections" to "authenticated";

grant references on table "public"."repository_connections" to "authenticated";

grant select on table "public"."repository_connections" to "authenticated";

grant trigger on table "public"."repository_connections" to "authenticated";

grant truncate on table "public"."repository_connections" to "authenticated";

grant update on table "public"."repository_connections" to "authenticated";

grant delete on table "public"."repository_connections" to "service_role";

grant insert on table "public"."repository_connections" to "service_role";

grant references on table "public"."repository_connections" to "service_role";

grant select on table "public"."repository_connections" to "service_role";

grant trigger on table "public"."repository_connections" to "service_role";

grant truncate on table "public"."repository_connections" to "service_role";

grant update on table "public"."repository_connections" to "service_role";

grant delete on table "public"."thought_chunk_matches" to "anon";

grant insert on table "public"."thought_chunk_matches" to "anon";

grant references on table "public"."thought_chunk_matches" to "anon";

grant select on table "public"."thought_chunk_matches" to "anon";

grant trigger on table "public"."thought_chunk_matches" to "anon";

grant truncate on table "public"."thought_chunk_matches" to "anon";

grant update on table "public"."thought_chunk_matches" to "anon";

grant delete on table "public"."thought_chunk_matches" to "authenticated";

grant insert on table "public"."thought_chunk_matches" to "authenticated";

grant references on table "public"."thought_chunk_matches" to "authenticated";

grant select on table "public"."thought_chunk_matches" to "authenticated";

grant trigger on table "public"."thought_chunk_matches" to "authenticated";

grant truncate on table "public"."thought_chunk_matches" to "authenticated";

grant update on table "public"."thought_chunk_matches" to "authenticated";

grant delete on table "public"."thought_chunk_matches" to "service_role";

grant insert on table "public"."thought_chunk_matches" to "service_role";

grant references on table "public"."thought_chunk_matches" to "service_role";

grant select on table "public"."thought_chunk_matches" to "service_role";

grant trigger on table "public"."thought_chunk_matches" to "service_role";

grant truncate on table "public"."thought_chunk_matches" to "service_role";

grant update on table "public"."thought_chunk_matches" to "service_role";

grant delete on table "public"."workspace_github_connections" to "anon";

grant insert on table "public"."workspace_github_connections" to "anon";

grant references on table "public"."workspace_github_connections" to "anon";

grant select on table "public"."workspace_github_connections" to "anon";

grant trigger on table "public"."workspace_github_connections" to "anon";

grant truncate on table "public"."workspace_github_connections" to "anon";

grant update on table "public"."workspace_github_connections" to "anon";

grant delete on table "public"."workspace_github_connections" to "authenticated";

grant insert on table "public"."workspace_github_connections" to "authenticated";

grant references on table "public"."workspace_github_connections" to "authenticated";

grant select on table "public"."workspace_github_connections" to "authenticated";

grant trigger on table "public"."workspace_github_connections" to "authenticated";

grant truncate on table "public"."workspace_github_connections" to "authenticated";

grant update on table "public"."workspace_github_connections" to "authenticated";

grant delete on table "public"."workspace_github_connections" to "service_role";

grant insert on table "public"."workspace_github_connections" to "service_role";

grant references on table "public"."workspace_github_connections" to "service_role";

grant select on table "public"."workspace_github_connections" to "service_role";

grant trigger on table "public"."workspace_github_connections" to "service_role";

grant truncate on table "public"."workspace_github_connections" to "service_role";

grant update on table "public"."workspace_github_connections" to "service_role";

create policy "Thought access control"
on "public"."thoughts"
as permissive
for all
to public
using (((access_strategy = 'public'::text) OR ((access_strategy = 'workspace'::text) AND (EXISTS ( SELECT 1
   FROM workspace_users
  WHERE ((workspace_users.workspace_id = thoughts.workspace_id) AND (workspace_users.user_id = auth.uid()))))) OR ((access_strategy = 'private'::text) AND ((author_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM document_shares
  WHERE ((document_shares.document_id = thoughts.id) AND (document_shares.user_id = auth.uid()))))))));
