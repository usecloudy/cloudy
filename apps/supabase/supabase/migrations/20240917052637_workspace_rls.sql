alter table "public"."workspaces" enable row level security;

CREATE UNIQUE INDEX notes_test_pkey ON public.note_contents USING btree (id);

create policy "Can access only as workspace member"
on "public"."thoughts"
as permissive
for all
to public
using ((auth.uid() IN ( SELECT workspace_users.user_id
   FROM workspace_users
  WHERE (workspace_users.workspace_id = thoughts.workspace_id))));


create policy "Workspace members"
on "public"."workspaces"
as permissive
for all
to public
using ((auth.uid() IN ( SELECT workspace_users.user_id
   FROM workspace_users
  WHERE (workspace_users.workspace_id = workspaces.id))));
