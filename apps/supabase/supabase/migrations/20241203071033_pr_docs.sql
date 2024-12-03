create table "public"."document_pr_drafts" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "document_id" uuid not null,
    "pr_metadata_id" uuid not null,
    "path" text,
    "status" text not null default 'draft'::text
);


alter table "public"."document_pr_drafts" enable row level security;

create table "public"."pull_request_metadata" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "pr_number" integer not null,
    "pr_status" text not null default 'open'::text,
    "repository_connection_id" uuid not null,
    "project_id" uuid not null,
    "docs_status" text not null default 'draft'::text
);


alter table "public"."pull_request_metadata" enable row level security;

alter table "public"."document_versions" alter column "content_html" drop not null;

alter table "public"."document_versions" alter column "content_json" drop not null;

alter table "public"."document_versions" alter column "published_by" drop not null;

alter table "public"."thoughts" alter column "author_id" drop not null;

CREATE UNIQUE INDEX pr_draft_documents_pkey ON public.document_pr_drafts USING btree (id);

CREATE UNIQUE INDEX pull_request_metadata_pkey ON public.pull_request_metadata USING btree (id);

alter table "public"."document_pr_drafts" add constraint "pr_draft_documents_pkey" PRIMARY KEY using index "pr_draft_documents_pkey";

alter table "public"."pull_request_metadata" add constraint "pull_request_metadata_pkey" PRIMARY KEY using index "pull_request_metadata_pkey";

alter table "public"."document_pr_drafts" add constraint "pr_draft_documents_document_id_fkey" FOREIGN KEY (document_id) REFERENCES thoughts(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."document_pr_drafts" validate constraint "pr_draft_documents_document_id_fkey";

alter table "public"."document_pr_drafts" add constraint "pr_draft_documents_pr_metadata_id_fkey" FOREIGN KEY (pr_metadata_id) REFERENCES pull_request_metadata(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."document_pr_drafts" validate constraint "pr_draft_documents_pr_metadata_id_fkey";

alter table "public"."pull_request_metadata" add constraint "pull_request_metadata_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."pull_request_metadata" validate constraint "pull_request_metadata_project_id_fkey";

alter table "public"."pull_request_metadata" add constraint "pull_request_metadata_repo_connection_id_fkey" FOREIGN KEY (repository_connection_id) REFERENCES repository_connections(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."pull_request_metadata" validate constraint "pull_request_metadata_repo_connection_id_fkey";

grant delete on table "public"."document_pr_drafts" to "anon";

grant insert on table "public"."document_pr_drafts" to "anon";

grant references on table "public"."document_pr_drafts" to "anon";

grant select on table "public"."document_pr_drafts" to "anon";

grant trigger on table "public"."document_pr_drafts" to "anon";

grant truncate on table "public"."document_pr_drafts" to "anon";

grant update on table "public"."document_pr_drafts" to "anon";

grant delete on table "public"."document_pr_drafts" to "authenticated";

grant insert on table "public"."document_pr_drafts" to "authenticated";

grant references on table "public"."document_pr_drafts" to "authenticated";

grant select on table "public"."document_pr_drafts" to "authenticated";

grant trigger on table "public"."document_pr_drafts" to "authenticated";

grant truncate on table "public"."document_pr_drafts" to "authenticated";

grant update on table "public"."document_pr_drafts" to "authenticated";

grant delete on table "public"."document_pr_drafts" to "service_role";

grant insert on table "public"."document_pr_drafts" to "service_role";

grant references on table "public"."document_pr_drafts" to "service_role";

grant select on table "public"."document_pr_drafts" to "service_role";

grant trigger on table "public"."document_pr_drafts" to "service_role";

grant truncate on table "public"."document_pr_drafts" to "service_role";

grant update on table "public"."document_pr_drafts" to "service_role";

grant delete on table "public"."pull_request_metadata" to "anon";

grant insert on table "public"."pull_request_metadata" to "anon";

grant references on table "public"."pull_request_metadata" to "anon";

grant select on table "public"."pull_request_metadata" to "anon";

grant trigger on table "public"."pull_request_metadata" to "anon";

grant truncate on table "public"."pull_request_metadata" to "anon";

grant update on table "public"."pull_request_metadata" to "anon";

grant delete on table "public"."pull_request_metadata" to "authenticated";

grant insert on table "public"."pull_request_metadata" to "authenticated";

grant references on table "public"."pull_request_metadata" to "authenticated";

grant select on table "public"."pull_request_metadata" to "authenticated";

grant trigger on table "public"."pull_request_metadata" to "authenticated";

grant truncate on table "public"."pull_request_metadata" to "authenticated";

grant update on table "public"."pull_request_metadata" to "authenticated";

grant delete on table "public"."pull_request_metadata" to "service_role";

grant insert on table "public"."pull_request_metadata" to "service_role";

grant references on table "public"."pull_request_metadata" to "service_role";

grant select on table "public"."pull_request_metadata" to "service_role";

grant trigger on table "public"."pull_request_metadata" to "service_role";

grant truncate on table "public"."pull_request_metadata" to "service_role";

grant update on table "public"."pull_request_metadata" to "service_role";

create policy "Workspace members only"
on "public"."document_pr_drafts"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM (workspace_users
     JOIN thoughts ON ((thoughts.workspace_id = workspace_users.workspace_id)))
  WHERE ((thoughts.id = document_pr_drafts.document_id) AND (workspace_users.user_id = auth.uid())))));


create policy "Workspace members only"
on "public"."pull_request_metadata"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM (workspace_users
     JOIN projects ON ((projects.workspace_id = workspace_users.workspace_id)))
  WHERE ((projects.id = pull_request_metadata.project_id) AND (workspace_users.user_id = auth.uid())))));



