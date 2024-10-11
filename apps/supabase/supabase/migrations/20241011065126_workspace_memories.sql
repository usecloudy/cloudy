create table "public"."workspace_memories" (
    "workspace_id" uuid not null,
    "mission_blurb" text
);

alter table "public"."thoughts" alter column "workspace_id" set not null;

CREATE UNIQUE INDEX workspace_memories_pkey ON public.workspace_memories USING btree (workspace_id);

alter table "public"."workspace_memories" add constraint "workspace_memories_pkey" PRIMARY KEY using index "workspace_memories_pkey";

alter table "public"."workspace_memories" add constraint "workspace_memories_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."workspace_memories" validate constraint "workspace_memories_workspace_id_fkey";

grant delete on table "public"."workspace_memories" to "anon";

grant insert on table "public"."workspace_memories" to "anon";

grant references on table "public"."workspace_memories" to "anon";

grant select on table "public"."workspace_memories" to "anon";

grant trigger on table "public"."workspace_memories" to "anon";

grant truncate on table "public"."workspace_memories" to "anon";

grant update on table "public"."workspace_memories" to "anon";

grant delete on table "public"."workspace_memories" to "authenticated";

grant insert on table "public"."workspace_memories" to "authenticated";

grant references on table "public"."workspace_memories" to "authenticated";

grant select on table "public"."workspace_memories" to "authenticated";

grant trigger on table "public"."workspace_memories" to "authenticated";

grant truncate on table "public"."workspace_memories" to "authenticated";

grant update on table "public"."workspace_memories" to "authenticated";

grant delete on table "public"."workspace_memories" to "service_role";

grant insert on table "public"."workspace_memories" to "service_role";

grant references on table "public"."workspace_memories" to "service_role";

grant select on table "public"."workspace_memories" to "service_role";

grant trigger on table "public"."workspace_memories" to "service_role";

grant truncate on table "public"."workspace_memories" to "service_role";

grant update on table "public"."workspace_memories" to "service_role";