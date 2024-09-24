create table "public"."thought_attachments" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "thought_id" uuid not null default gen_random_uuid(),
    "path" text not null,
    "url" text not null
);

CREATE UNIQUE INDEX thought_attachments_pkey ON public.thought_attachments USING btree (id);

alter table "public"."thought_attachments" add constraint "thought_attachments_pkey" PRIMARY KEY using index "thought_attachments_pkey";

alter table "public"."thought_attachments" add constraint "thought_attachments_thought_id_fkey" FOREIGN KEY (thought_id) REFERENCES thoughts(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."thought_attachments" validate constraint "thought_attachments_thought_id_fkey";

grant delete on table "public"."thought_attachments" to "anon";

grant insert on table "public"."thought_attachments" to "anon";

grant references on table "public"."thought_attachments" to "anon";

grant select on table "public"."thought_attachments" to "anon";

grant trigger on table "public"."thought_attachments" to "anon";

grant truncate on table "public"."thought_attachments" to "anon";

grant update on table "public"."thought_attachments" to "anon";

grant delete on table "public"."thought_attachments" to "authenticated";

grant insert on table "public"."thought_attachments" to "authenticated";

grant references on table "public"."thought_attachments" to "authenticated";

grant select on table "public"."thought_attachments" to "authenticated";

grant trigger on table "public"."thought_attachments" to "authenticated";

grant truncate on table "public"."thought_attachments" to "authenticated";

grant update on table "public"."thought_attachments" to "authenticated";

grant delete on table "public"."thought_attachments" to "service_role";

grant insert on table "public"."thought_attachments" to "service_role";

grant references on table "public"."thought_attachments" to "service_role";

grant select on table "public"."thought_attachments" to "service_role";

grant trigger on table "public"."thought_attachments" to "service_role";

grant truncate on table "public"."thought_attachments" to "service_role";

grant update on table "public"."thought_attachments" to "service_role";
