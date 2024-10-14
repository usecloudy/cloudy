alter table "public"."collections" add column "parent_collection_id" uuid;

alter table "public"."collections" alter column "updated_at" set not null;

alter table "public"."collections" add constraint "collections_parent_collection_id_fkey" FOREIGN KEY (parent_collection_id) REFERENCES collections(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."collections" validate constraint "collections_parent_collection_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_collection_parents(collection_id uuid)
 RETURNS TABLE(id uuid, title text)
 LANGUAGE sql
 STABLE
AS $function$
   WITH RECURSIVE parent_collections AS (
     SELECT id, title, parent_collection_id
     FROM collections
     WHERE id = collection_id
     UNION ALL
     SELECT c.id, c.title, c.parent_collection_id
     FROM collections c
     INNER JOIN parent_collections pc ON c.id = pc.parent_collection_id
   )
   SELECT id, title
   FROM parent_collections;
   $function$
;