
drop policy "Enable all for authenticated users only" on "public"."thoughts";

alter table "public"."note_contents" enable row level security;

alter table "public"."thought_chat_threads" add column "applied_suggestion_hashes" text[] not null default '{}'::text[];

alter table "public"."thought_chat_threads" add column "status" text not null default 'done'::text;

create policy "Workspace members only"
on "public"."note_contents"
as permissive
for all
to public
using ((( SELECT auth.uid() AS uid) IN ( SELECT workspace_users.user_id
   FROM (workspace_users
     JOIN thoughts ON ((thoughts.workspace_id = workspace_users.workspace_id)))
  WHERE ((thoughts.id = note_contents.id) AND (workspace_users.user_id = auth.uid())))));