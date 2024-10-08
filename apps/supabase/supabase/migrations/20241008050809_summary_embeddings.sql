create table "public"."thought_relations" (
    "created_at" timestamp with time zone not null default now(),
    "matched_by" uuid not null,
    "matches" uuid not null,
    "similarity_score" double precision not null
);


create table "public"."thought_summary_embeddings" (
    "thought_id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "embedding" vector not null
);

alter table "public"."thoughts" add column "generated_intent" text;

alter table "public"."thoughts" add column "generated_summary" text;

CREATE UNIQUE INDEX thought_summary_embeddings_pkey ON public.thought_summary_embeddings USING btree (thought_id);

CREATE UNIQUE INDEX thought_summary_matches_pkey ON public.thought_relations USING btree (matched_by, matches);

alter table "public"."thought_relations" add constraint "thought_summary_matches_pkey" PRIMARY KEY using index "thought_summary_matches_pkey";

alter table "public"."thought_summary_embeddings" add constraint "thought_summary_embeddings_pkey" PRIMARY KEY using index "thought_summary_embeddings_pkey";

alter table "public"."thought_relations" add constraint "thought_summary_matches_matched_by_fkey" FOREIGN KEY (matched_by) REFERENCES thoughts(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."thought_relations" validate constraint "thought_summary_matches_matched_by_fkey";

alter table "public"."thought_relations" add constraint "thought_summary_matches_matches_fkey" FOREIGN KEY (matches) REFERENCES thoughts(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."thought_relations" validate constraint "thought_summary_matches_matches_fkey";

alter table "public"."thought_summary_embeddings" add constraint "thought_summary_embeddings_thought_id_fkey" FOREIGN KEY (thought_id) REFERENCES thoughts(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."thought_summary_embeddings" validate constraint "thought_summary_embeddings_thought_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.embedding_thought_summary_search(query_embedding vector, match_threshold double precision, max_results integer, workspace_id uuid, ignore_thought_ids uuid[] DEFAULT NULL::uuid[])
 RETURNS TABLE(thought_id uuid, similarity_score double precision)
 LANGUAGE sql
AS $function$
  SELECT 
    t.id AS thought_id,
    1 - (tse.embedding <=> query_embedding) AS similarity_score
  FROM thought_summary_embeddings tse
  JOIN thoughts t ON tse.thought_id = t.id
  WHERE t.workspace_id = workspace_id
    AND (ignore_thought_ids IS NULL OR t.id != ALL(ignore_thought_ids))
  GROUP BY t.id, tse.embedding
  HAVING (1 - (tse.embedding <=> query_embedding)) > match_threshold
  ORDER BY similarity_score DESC
  LIMIT max_results
$function$
;

grant delete on table "public"."thought_relations" to "anon";

grant insert on table "public"."thought_relations" to "anon";

grant references on table "public"."thought_relations" to "anon";

grant select on table "public"."thought_relations" to "anon";

grant trigger on table "public"."thought_relations" to "anon";

grant truncate on table "public"."thought_relations" to "anon";

grant update on table "public"."thought_relations" to "anon";

grant delete on table "public"."thought_relations" to "authenticated";

grant insert on table "public"."thought_relations" to "authenticated";

grant references on table "public"."thought_relations" to "authenticated";

grant select on table "public"."thought_relations" to "authenticated";

grant trigger on table "public"."thought_relations" to "authenticated";

grant truncate on table "public"."thought_relations" to "authenticated";

grant update on table "public"."thought_relations" to "authenticated";

grant delete on table "public"."thought_relations" to "service_role";

grant insert on table "public"."thought_relations" to "service_role";

grant references on table "public"."thought_relations" to "service_role";

grant select on table "public"."thought_relations" to "service_role";

grant trigger on table "public"."thought_relations" to "service_role";

grant truncate on table "public"."thought_relations" to "service_role";

grant update on table "public"."thought_relations" to "service_role";

grant delete on table "public"."thought_summary_embeddings" to "anon";

grant insert on table "public"."thought_summary_embeddings" to "anon";

grant references on table "public"."thought_summary_embeddings" to "anon";

grant select on table "public"."thought_summary_embeddings" to "anon";

grant trigger on table "public"."thought_summary_embeddings" to "anon";

grant truncate on table "public"."thought_summary_embeddings" to "anon";

grant update on table "public"."thought_summary_embeddings" to "anon";

grant delete on table "public"."thought_summary_embeddings" to "authenticated";

grant insert on table "public"."thought_summary_embeddings" to "authenticated";

grant references on table "public"."thought_summary_embeddings" to "authenticated";

grant select on table "public"."thought_summary_embeddings" to "authenticated";

grant trigger on table "public"."thought_summary_embeddings" to "authenticated";

grant truncate on table "public"."thought_summary_embeddings" to "authenticated";

grant update on table "public"."thought_summary_embeddings" to "authenticated";

grant delete on table "public"."thought_summary_embeddings" to "service_role";

grant insert on table "public"."thought_summary_embeddings" to "service_role";

grant references on table "public"."thought_summary_embeddings" to "service_role";

grant select on table "public"."thought_summary_embeddings" to "service_role";

grant trigger on table "public"."thought_summary_embeddings" to "service_role";

grant truncate on table "public"."thought_summary_embeddings" to "service_role";

grant update on table "public"."thought_summary_embeddings" to "service_role";

