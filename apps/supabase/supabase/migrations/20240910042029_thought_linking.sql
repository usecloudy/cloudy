create table "public"."thought_links" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "linked_from" uuid not null,
    "linked_to" uuid not null
);

alter table "public"."thought_links" enable row level security;

alter table "public"."thoughts" add column "content_plaintext" text;

CREATE UNIQUE INDEX thought_links_pkey ON public.thought_links USING btree (id);

alter table "public"."thought_links" add constraint "thought_links_pkey" PRIMARY KEY using index "thought_links_pkey";

alter table "public"."thought_links" add constraint "thought_links_linked_from_fkey" FOREIGN KEY (linked_from) REFERENCES thoughts(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."thought_links" validate constraint "thought_links_linked_from_fkey";

alter table "public"."thought_links" add constraint "thought_links_linked_to_fkey" FOREIGN KEY (linked_to) REFERENCES thoughts(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."thought_links" validate constraint "thought_links_linked_to_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.search_thoughts(search_query text, user_id uuid)
 RETURNS TABLE(thought_id uuid, thought_title text, thought_content_md text, thought_content_plaintext text, thought_updated_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT thoughts.id AS thought_id, thoughts.title AS thought_title, thoughts.content_md AS thought_content_md, thoughts.content_plaintext AS thought_content_plaintext, thoughts.updated_at AS thought_updated_at
  FROM thoughts
  WHERE to_tsvector(thoughts.title || ' ' || thoughts.content_md) @@ to_tsquery(search_query || ':*')
  AND author_id = user_id;
END;
$function$
;

grant delete on table "public"."thought_links" to "anon";

grant insert on table "public"."thought_links" to "anon";

grant references on table "public"."thought_links" to "anon";

grant select on table "public"."thought_links" to "anon";

grant trigger on table "public"."thought_links" to "anon";

grant truncate on table "public"."thought_links" to "anon";

grant update on table "public"."thought_links" to "anon";

grant delete on table "public"."thought_links" to "authenticated";

grant insert on table "public"."thought_links" to "authenticated";

grant references on table "public"."thought_links" to "authenticated";

grant select on table "public"."thought_links" to "authenticated";

grant trigger on table "public"."thought_links" to "authenticated";

grant truncate on table "public"."thought_links" to "authenticated";

grant update on table "public"."thought_links" to "authenticated";

grant delete on table "public"."thought_links" to "service_role";

grant insert on table "public"."thought_links" to "service_role";

grant references on table "public"."thought_links" to "service_role";

grant select on table "public"."thought_links" to "service_role";

grant trigger on table "public"."thought_links" to "service_role";

grant truncate on table "public"."thought_links" to "service_role";

grant update on table "public"."thought_links" to "service_role";

create policy "Enable ALL for authenticated users only"
on "public"."thought_links"
as permissive
for all
to authenticated
using (true);

CREATE TRIGGER "Handle note links" AFTER INSERT OR UPDATE ON public.thoughts FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://www.usecloudy.com/api/thoughts/link', 'POST', '{"Content-type":"application/json","Authorization":"Bearer labu-labu-labubu"}', '{}', '2000');
