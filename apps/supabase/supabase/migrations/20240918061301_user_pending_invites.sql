drop index if exists "public"."notes_test_pkey";

create table "public"."user_pending_invites" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "user_id" uuid not null,
    "workspace_id" uuid not null
);

alter table "public"."users" add column "is_pending" boolean;

CREATE UNIQUE INDEX user_pending_invites_pkey ON public.user_pending_invites USING btree (id);

CREATE UNIQUE INDEX notes_test_pkey ON public.note_contents USING btree (id);

alter table "public"."note_contents" add constraint "notes_test_pkey" PRIMARY KEY using index "notes_test_pkey";

alter table "public"."user_pending_invites" add constraint "user_pending_invites_pkey" PRIMARY KEY using index "user_pending_invites_pkey";

alter table "public"."user_pending_invites" add constraint "user_pending_invites_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."user_pending_invites" validate constraint "user_pending_invites_user_id_fkey";

alter table "public"."user_pending_invites" add constraint "user_pending_invites_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."user_pending_invites" validate constraint "user_pending_invites_workspace_id_fkey";

grant delete on table "public"."user_pending_invites" to "anon";

grant insert on table "public"."user_pending_invites" to "anon";

grant references on table "public"."user_pending_invites" to "anon";

grant select on table "public"."user_pending_invites" to "anon";

grant trigger on table "public"."user_pending_invites" to "anon";

grant truncate on table "public"."user_pending_invites" to "anon";

grant update on table "public"."user_pending_invites" to "anon";

grant delete on table "public"."user_pending_invites" to "authenticated";

grant insert on table "public"."user_pending_invites" to "authenticated";

grant references on table "public"."user_pending_invites" to "authenticated";

grant select on table "public"."user_pending_invites" to "authenticated";

grant trigger on table "public"."user_pending_invites" to "authenticated";

grant truncate on table "public"."user_pending_invites" to "authenticated";

grant update on table "public"."user_pending_invites" to "authenticated";

grant delete on table "public"."user_pending_invites" to "service_role";

grant insert on table "public"."user_pending_invites" to "service_role";

grant references on table "public"."user_pending_invites" to "service_role";

grant select on table "public"."user_pending_invites" to "service_role";

grant trigger on table "public"."user_pending_invites" to "service_role";

grant truncate on table "public"."user_pending_invites" to "service_role";

grant update on table "public"."user_pending_invites" to "service_role";

create policy "Workspace Invited"
on "public"."workspaces"
as permissive
for select
to public
using ((auth.uid() IN ( SELECT user_pending_invites.user_id
   FROM user_pending_invites
  WHERE (user_pending_invites.workspace_id = workspaces.id))));

CREATE TRIGGER "Handle workspace users biling" AFTER INSERT OR DELETE OR UPDATE ON public.workspace_users FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://www.usecloudy.com/api/payments/update/count', 'POST', '{"Content-type":"application/json","Authorization":"Bearer labu-labu-labubu"}', '{}', '2500');
