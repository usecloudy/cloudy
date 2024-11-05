alter table "public"."document_repo_links" drop constraint "document_file_links_doc_id_fkey";

alter table "public"."chat_messages" enable row level security;

alter table "public"."chat_threads" enable row level security;

alter table "public"."document_repo_links" add column "document_id" uuid;

update "public"."document_repo_links" 
set "document_id" = "doc_id";

alter table "public"."document_repo_links" alter column "document_id" set not null;

alter table "public"."document_repo_links" drop column "doc_id";

alter table "public"."document_repo_links" enable row level security;

alter table "public"."document_updates" enable row level security;

alter table "public"."folders" enable row level security;

alter table "public"."projects" enable row level security;

alter table "public"."repository_connections" enable row level security;

alter table "public"."workspace_github_connections" enable row level security;

alter table "public"."document_repo_links" add constraint "document_file_links_doc_id_fkey" FOREIGN KEY (document_id) REFERENCES thoughts(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."document_repo_links" validate constraint "document_file_links_doc_id_fkey";

create policy "Workspace members only"
on "public"."chat_messages"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM (workspace_users
     JOIN chat_threads ON ((chat_threads.workspace_id = workspace_users.workspace_id)))
  WHERE ((chat_threads.id = chat_messages.thread_id) AND (workspace_users.user_id = auth.uid())))));


create policy "Workspace members only"
on "public"."chat_threads"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM workspace_users
  WHERE ((workspace_users.workspace_id = chat_threads.workspace_id) AND (workspace_users.user_id = auth.uid())))));


create policy "Workspace Members Only"
on "public"."document_repo_links"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM (workspace_users
     JOIN thoughts ON ((thoughts.workspace_id = workspace_users.workspace_id)))
  WHERE ((thoughts.id = document_repo_links.document_id) AND (workspace_users.user_id = auth.uid())))));


create policy "Workspace members only"
on "public"."document_updates"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM (workspace_users
     JOIN thoughts ON ((thoughts.workspace_id = workspace_users.workspace_id)))
  WHERE ((thoughts.id = document_updates.document_id) AND (workspace_users.user_id = auth.uid())))));


create policy "Workspace members only"
on "public"."folders"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM workspace_users
  WHERE ((workspace_users.workspace_id = folders.workspace_id) AND (workspace_users.user_id = auth.uid())))));


create policy "Workspace Members only"
on "public"."projects"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM workspace_users
  WHERE ((workspace_users.workspace_id = projects.workspace_id) AND (workspace_users.user_id = auth.uid())))));


create policy "Workspace members only"
on "public"."repository_connections"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM (workspace_users
     JOIN projects ON ((projects.workspace_id = workspace_users.workspace_id)))
  WHERE ((projects.id = repository_connections.project_id) AND (workspace_users.user_id = auth.uid())))));


create policy "Workspace members only"
on "public"."workspace_github_connections"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM workspace_users
  WHERE ((workspace_users.workspace_id = workspace_github_connections.workspace_id) AND (workspace_users.user_id = auth.uid())))));