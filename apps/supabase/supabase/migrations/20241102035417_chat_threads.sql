drop trigger if exists "update_collection_summary" on "public"."collection_thoughts";

create table "public"."chat_messages" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "thread_id" uuid not null,
    "role" text not null default 'user'::text,
    "content" text not null,
    "user_id" uuid,
    "applied_suggestion_hashes" text[] not null default '{}'::text[],
    "completed_at" timestamp with time zone,
    "selection_text" text
);


create table "public"."chat_threads" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "document_id" uuid,
    "parent_id" uuid,
    "is_default" boolean not null default false,
    "workspace_id" uuid not null
);


alter table "public"."thought_chats" add column "file_references" jsonb;

CREATE UNIQUE INDEX chat_messages_pkey ON public.chat_messages USING btree (id);

CREATE UNIQUE INDEX chat_threads_pkey ON public.chat_threads USING btree (id);

alter table "public"."chat_messages" add constraint "chat_messages_pkey" PRIMARY KEY using index "chat_messages_pkey";

alter table "public"."chat_threads" add constraint "chat_threads_pkey" PRIMARY KEY using index "chat_threads_pkey";

alter table "public"."chat_messages" add constraint "chat_messages_thread_id_fkey" FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."chat_messages" validate constraint "chat_messages_thread_id_fkey";

alter table "public"."chat_messages" add constraint "chat_messages_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."chat_messages" validate constraint "chat_messages_user_id_fkey";

alter table "public"."chat_threads" add constraint "chat_threads_document_id_fkey" FOREIGN KEY (document_id) REFERENCES thoughts(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."chat_threads" validate constraint "chat_threads_document_id_fkey";

alter table "public"."chat_threads" add constraint "chat_threads_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES chat_threads(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."chat_threads" validate constraint "chat_threads_parent_id_fkey";

alter table "public"."chat_threads" add constraint "chat_threads_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."chat_threads" validate constraint "chat_threads_workspace_id_fkey";

grant delete on table "public"."chat_messages" to "anon";

grant insert on table "public"."chat_messages" to "anon";

grant references on table "public"."chat_messages" to "anon";

grant select on table "public"."chat_messages" to "anon";

grant trigger on table "public"."chat_messages" to "anon";

grant truncate on table "public"."chat_messages" to "anon";

grant update on table "public"."chat_messages" to "anon";

grant delete on table "public"."chat_messages" to "authenticated";

grant insert on table "public"."chat_messages" to "authenticated";

grant references on table "public"."chat_messages" to "authenticated";

grant select on table "public"."chat_messages" to "authenticated";

grant trigger on table "public"."chat_messages" to "authenticated";

grant truncate on table "public"."chat_messages" to "authenticated";

grant update on table "public"."chat_messages" to "authenticated";

grant delete on table "public"."chat_messages" to "service_role";

grant insert on table "public"."chat_messages" to "service_role";

grant references on table "public"."chat_messages" to "service_role";

grant select on table "public"."chat_messages" to "service_role";

grant trigger on table "public"."chat_messages" to "service_role";

grant truncate on table "public"."chat_messages" to "service_role";

grant update on table "public"."chat_messages" to "service_role";

grant delete on table "public"."chat_threads" to "anon";

grant insert on table "public"."chat_threads" to "anon";

grant references on table "public"."chat_threads" to "anon";

grant select on table "public"."chat_threads" to "anon";

grant trigger on table "public"."chat_threads" to "anon";

grant truncate on table "public"."chat_threads" to "anon";

grant update on table "public"."chat_threads" to "anon";

grant delete on table "public"."chat_threads" to "authenticated";

grant insert on table "public"."chat_threads" to "authenticated";

grant references on table "public"."chat_threads" to "authenticated";

grant select on table "public"."chat_threads" to "authenticated";

grant trigger on table "public"."chat_threads" to "authenticated";

grant truncate on table "public"."chat_threads" to "authenticated";

grant update on table "public"."chat_threads" to "authenticated";

grant delete on table "public"."chat_threads" to "service_role";

grant insert on table "public"."chat_threads" to "service_role";

grant references on table "public"."chat_threads" to "service_role";

grant select on table "public"."chat_threads" to "service_role";

grant trigger on table "public"."chat_threads" to "service_role";

grant truncate on table "public"."chat_threads" to "service_role";

grant update on table "public"."chat_threads" to "service_role";