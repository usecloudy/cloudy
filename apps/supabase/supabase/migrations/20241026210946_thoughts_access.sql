
drop policy "Can access only as workspace member" on "public"."thoughts";

alter table "public"."thoughts" add column "access_strategy" text not null default 'workspace'::text;

create policy "Thought access control"
on "public"."thoughts"
as permissive
for all
to public
using (((access_strategy = 'public'::text) OR ((access_strategy = 'workspace'::text) AND (EXISTS ( SELECT 1
   FROM workspace_users
  WHERE ((workspace_users.workspace_id = thoughts.workspace_id) AND (workspace_users.user_id = auth.uid()))))) OR ((access_strategy = 'private'::text) AND ((author_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM document_shares
  WHERE ((document_shares.document_id = thoughts.id) AND (document_shares.user_id = auth.uid()))))))));
