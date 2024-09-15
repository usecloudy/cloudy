drop function if exists "public"."match_thought_chunks"(query_embedding vector, match_threshold double precision, match_count integer, exclude_thought_id uuid, input_author_id uuid);

drop function if exists "public"."search_thoughts"(search_query text, user_id uuid);


create table "public"."workspace_users" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "workspace_id" uuid not null,
    "user_id" uuid not null,
    "role" text not null
);


create table "public"."workspaces" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "stripe_customer_id" text,
    "slug" text not null default ''::text
);

alter table "public"."collections" add column "workspace_id" uuid;

alter table "public"."thoughts" add column "workspace_id" uuid;

alter table "public"."users" add column "email" text;

CREATE UNIQUE INDEX organization_users_pkey ON public.workspace_users USING btree (id);

CREATE UNIQUE INDEX organizations_pkey ON public.workspaces USING btree (id);

CREATE UNIQUE INDEX organizations_slug_key ON public.workspaces USING btree (slug);

alter table "public"."workspace_users" add constraint "organization_users_pkey" PRIMARY KEY using index "organization_users_pkey";

alter table "public"."workspaces" add constraint "organizations_pkey" PRIMARY KEY using index "organizations_pkey";

alter table "public"."collections" add constraint "collections_organization_id_fkey" FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."collections" validate constraint "collections_organization_id_fkey";

alter table "public"."thoughts" add constraint "thoughts_organization_id_fkey" FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."thoughts" validate constraint "thoughts_organization_id_fkey";

alter table "public"."workspace_users" add constraint "organization_users_organization_id_fkey" FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."workspace_users" validate constraint "organization_users_organization_id_fkey";

alter table "public"."workspace_users" add constraint "organization_users_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."workspace_users" validate constraint "organization_users_user_id_fkey";

alter table "public"."workspaces" add constraint "organizations_slug_key" UNIQUE using index "organizations_slug_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.match_thought_chunks(query_embedding vector, match_threshold double precision, match_count integer, exclude_thought_id uuid, input_workspace_id uuid)
 RETURNS TABLE(id uuid, thought_id uuid, similarity double precision)
 LANGUAGE sql
AS $function$select 
    te.id,
    te.thought_id,
    -(te.embedding <#> query_embedding) as similarity
  from thought_embeddings te
  join thoughts t on te.thought_id = t.id
  where te.embedding <#> query_embedding < -match_threshold
    and t.workspace_id = input_workspace_id
    and te.thought_id != exclude_thought_id
  order by te.embedding <#> query_embedding asc
  limit least(match_count, 200);$function$
;

CREATE OR REPLACE FUNCTION public.search_thoughts(search_query text, p_workspace_id uuid)
 RETURNS TABLE(thought_id uuid, thought_title text, thought_content_md text, thought_content_plaintext text, thought_updated_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    thoughts.id AS thought_id, 
    thoughts.title AS thought_title, 
    thoughts.content_md AS thought_content_md, 
    thoughts.content_plaintext AS thought_content_plaintext, 
    thoughts.updated_at AS thought_updated_at
  FROM thoughts
  WHERE to_tsvector(COALESCE(thoughts.title, '') || ' ' || COALESCE(thoughts.content_md, '')) @@ to_tsquery(search_query || ':*')
  AND thoughts.workspace_id = p_workspace_id
  ORDER BY thoughts.updated_at DESC;
END;
$function$
;

grant delete on table "public"."workspace_users" to "anon";

grant insert on table "public"."workspace_users" to "anon";

grant references on table "public"."workspace_users" to "anon";

grant select on table "public"."workspace_users" to "anon";

grant trigger on table "public"."workspace_users" to "anon";

grant truncate on table "public"."workspace_users" to "anon";

grant update on table "public"."workspace_users" to "anon";

grant delete on table "public"."workspace_users" to "authenticated";

grant insert on table "public"."workspace_users" to "authenticated";

grant references on table "public"."workspace_users" to "authenticated";

grant select on table "public"."workspace_users" to "authenticated";

grant trigger on table "public"."workspace_users" to "authenticated";

grant truncate on table "public"."workspace_users" to "authenticated";

grant update on table "public"."workspace_users" to "authenticated";

grant delete on table "public"."workspace_users" to "service_role";

grant insert on table "public"."workspace_users" to "service_role";

grant references on table "public"."workspace_users" to "service_role";

grant select on table "public"."workspace_users" to "service_role";

grant trigger on table "public"."workspace_users" to "service_role";

grant truncate on table "public"."workspace_users" to "service_role";

grant update on table "public"."workspace_users" to "service_role";

grant delete on table "public"."workspaces" to "anon";

grant insert on table "public"."workspaces" to "anon";

grant references on table "public"."workspaces" to "anon";

grant select on table "public"."workspaces" to "anon";

grant trigger on table "public"."workspaces" to "anon";

grant truncate on table "public"."workspaces" to "anon";

grant update on table "public"."workspaces" to "anon";

grant delete on table "public"."workspaces" to "authenticated";

grant insert on table "public"."workspaces" to "authenticated";

grant references on table "public"."workspaces" to "authenticated";

grant select on table "public"."workspaces" to "authenticated";

grant trigger on table "public"."workspaces" to "authenticated";

grant truncate on table "public"."workspaces" to "authenticated";

grant update on table "public"."workspaces" to "authenticated";

grant delete on table "public"."workspaces" to "service_role";

grant insert on table "public"."workspaces" to "service_role";

grant references on table "public"."workspaces" to "service_role";

grant select on table "public"."workspaces" to "service_role";

grant trigger on table "public"."workspaces" to "service_role";

grant truncate on table "public"."workspaces" to "service_role";

grant update on table "public"."workspaces" to "service_role";
