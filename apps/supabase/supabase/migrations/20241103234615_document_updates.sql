create table "public"."document_update_links" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "repo_link_id" uuid not null,
    "document_update_id" uuid not null
);


create table "public"."document_updates" (
    "id" uuid not null default gen_random_uuid(),
    "triggered_at" timestamp with time zone not null default now(),
    "document_id" uuid not null,
    "commit_sha" text not null,
    "repo_connection_id" uuid not null,
    "generation_completed_at" timestamp with time zone
);


alter table "public"."chat_threads" add column "document_update_id" uuid;

alter table "public"."chat_threads" add column "type" text not null default 'default'::text;

CREATE UNIQUE INDEX document_update_links_pkey ON public.document_update_links USING btree (id);

CREATE UNIQUE INDEX document_updates_pkey ON public.document_updates USING btree (id);

alter table "public"."document_update_links" add constraint "document_update_links_pkey" PRIMARY KEY using index "document_update_links_pkey";

alter table "public"."document_updates" add constraint "document_updates_pkey" PRIMARY KEY using index "document_updates_pkey";

alter table "public"."chat_threads" add constraint "chat_threads_document_update_id_fkey" FOREIGN KEY (document_update_id) REFERENCES document_updates(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."chat_threads" validate constraint "chat_threads_document_update_id_fkey";

alter table "public"."document_update_links" add constraint "document_update_links_document_update_id_fkey" FOREIGN KEY (document_update_id) REFERENCES document_updates(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."document_update_links" validate constraint "document_update_links_document_update_id_fkey";

alter table "public"."document_update_links" add constraint "document_update_links_repo_link_id_fkey" FOREIGN KEY (repo_link_id) REFERENCES document_repo_links(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."document_update_links" validate constraint "document_update_links_repo_link_id_fkey";

alter table "public"."document_updates" add constraint "document_updates_document_id_fkey" FOREIGN KEY (document_id) REFERENCES thoughts(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."document_updates" validate constraint "document_updates_document_id_fkey";

alter table "public"."document_updates" add constraint "document_updates_repo_connection_id_fkey" FOREIGN KEY (repo_connection_id) REFERENCES repository_connections(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."document_updates" validate constraint "document_updates_repo_connection_id_fkey";