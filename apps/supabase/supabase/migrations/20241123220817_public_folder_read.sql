drop policy "Workspace members only" on "public"."folders";

alter table "public"."folders" add column "access_strategy" text default 'workspace'::text;

create policy "Allow all for workspace members"
on "public"."folders"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM workspace_users wm
  WHERE ((wm.workspace_id = folders.workspace_id) AND (wm.user_id = auth.uid())))));

create policy "Allow reading folders with public content"
on "public"."folders"
as permissive
for select
to public
using ((access_strategy = 'public'::text));

create policy "Enable read access for all users"
on "public"."projects"
as permissive
for select
to public
using (true);

CREATE TRIGGER folders_webhook AFTER INSERT OR DELETE OR UPDATE ON public.folders FOR EACH ROW EXECUTE FUNCTION webhook('http://host.docker.internal:3001/api/folders/webhook');

CREATE TRIGGER documents_webhook AFTER INSERT OR DELETE OR UPDATE ON public.thoughts FOR EACH ROW EXECUTE FUNCTION webhook('http://host.docker.internal:3001/api/documents/webhook');