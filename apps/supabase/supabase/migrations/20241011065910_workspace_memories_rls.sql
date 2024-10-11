alter table "public"."workspace_memories" enable row level security;

create policy "Workspace members only"
on "public"."workspace_memories"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM workspace_users
  WHERE ((workspace_users.workspace_id = workspace_memories.workspace_id) AND (workspace_users.user_id = auth.uid())))));