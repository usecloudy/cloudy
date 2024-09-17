create table "public"."note_contents" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "title" text,
    "content" text
);

alter table "public"."note_contents" add constraint "note_contents_id_fkey" FOREIGN KEY (id) REFERENCES thoughts(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."note_contents" validate constraint "note_contents_id_fkey";

grant delete on table "public"."note_contents" to "anon";

grant insert on table "public"."note_contents" to "anon";

grant references on table "public"."note_contents" to "anon";

grant select on table "public"."note_contents" to "anon";

grant trigger on table "public"."note_contents" to "anon";

grant truncate on table "public"."note_contents" to "anon";

grant update on table "public"."note_contents" to "anon";

grant delete on table "public"."note_contents" to "authenticated";

grant insert on table "public"."note_contents" to "authenticated";

grant references on table "public"."note_contents" to "authenticated";

grant select on table "public"."note_contents" to "authenticated";

grant trigger on table "public"."note_contents" to "authenticated";

grant truncate on table "public"."note_contents" to "authenticated";

grant update on table "public"."note_contents" to "authenticated";

grant delete on table "public"."note_contents" to "service_role";

grant insert on table "public"."note_contents" to "service_role";

grant references on table "public"."note_contents" to "service_role";

grant select on table "public"."note_contents" to "service_role";

grant trigger on table "public"."note_contents" to "service_role";

grant truncate on table "public"."note_contents" to "service_role";

grant update on table "public"."note_contents" to "service_role";