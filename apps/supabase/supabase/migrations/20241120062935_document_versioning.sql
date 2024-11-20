
create table "public"."document_versions" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "document_id" uuid not null,
    "content_json" jsonb not null,
    "content_html" text not null,
    "content_md" text not null,
    "published_by" uuid not null,
    "title" text not null default ''
);


alter table "public"."document_versions" enable row level security;

alter table "public"."thoughts" add column "latest_version_id" uuid;

CREATE UNIQUE INDEX document_version_pkey ON public.document_versions USING btree (id);

alter table "public"."document_versions" add constraint "document_version_pkey" PRIMARY KEY using index "document_version_pkey";

alter table "public"."document_versions" add constraint "document_version_document_id_fkey" FOREIGN KEY (document_id) REFERENCES thoughts(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."document_versions" validate constraint "document_version_document_id_fkey";

alter table "public"."document_versions" add constraint "document_version_published_by_fkey" FOREIGN KEY (published_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."document_versions" validate constraint "document_version_published_by_fkey";

alter table "public"."thoughts" add constraint "thoughts_latest_version_id_fkey" FOREIGN KEY (latest_version_id) REFERENCES document_versions(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."thoughts" validate constraint "thoughts_latest_version_id_fkey";

grant delete on table "public"."document_versions" to "anon";

grant insert on table "public"."document_versions" to "anon";

grant references on table "public"."document_versions" to "anon";

grant select on table "public"."document_versions" to "anon";

grant trigger on table "public"."document_versions" to "anon";

grant truncate on table "public"."document_versions" to "anon";

grant update on table "public"."document_versions" to "anon";

grant delete on table "public"."document_versions" to "authenticated";

grant insert on table "public"."document_versions" to "authenticated";

grant references on table "public"."document_versions" to "authenticated";

grant select on table "public"."document_versions" to "authenticated";

grant trigger on table "public"."document_versions" to "authenticated";

grant truncate on table "public"."document_versions" to "authenticated";

grant update on table "public"."document_versions" to "authenticated";

grant delete on table "public"."document_versions" to "service_role";

grant insert on table "public"."document_versions" to "service_role";

grant references on table "public"."document_versions" to "service_role";

grant select on table "public"."document_versions" to "service_role";

grant trigger on table "public"."document_versions" to "service_role";

grant truncate on table "public"."document_versions" to "service_role";

grant update on table "public"."document_versions" to "service_role";

create policy "Access control"
on "public"."document_versions"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM thoughts
  WHERE ((thoughts.id = document_versions.document_id) AND ((thoughts.access_strategy = 'public'::text) OR ((thoughts.access_strategy = 'workspace'::text) AND (EXISTS ( SELECT 1
           FROM workspace_users
          WHERE ((workspace_users.workspace_id = thoughts.workspace_id) AND (workspace_users.user_id = auth.uid()))))) OR ((thoughts.access_strategy = 'private'::text) AND ((thoughts.author_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM document_shares
          WHERE ((document_shares.document_id = thoughts.id) AND (document_shares.user_id = auth.uid())))))))))));