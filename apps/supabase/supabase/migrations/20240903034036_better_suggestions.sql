drop function if exists "public"."match_thought_chunks"(query_embedding vector, match_threshold double precision, match_count integer, exclude_thought_id uuid, input_author_id uuid);

alter table "public"."thought_embedding_matches" add column "matches_thought_id" uuid;

alter table "public"."thought_embedding_matches" add column "similarity" real not null default '0.5'::real;

alter table "public"."thoughts" add column "collection_suggestions" jsonb;

alter table "public"."thoughts" add column "ignored_collection_suggestions" jsonb;

alter table "public"."thought_embedding_matches" add constraint "thought_embedding_matches_matches_thought_id_fkey" FOREIGN KEY (matches_thought_id) REFERENCES thoughts(id) ON DELETE CASCADE not valid;

alter table "public"."thought_embedding_matches" validate constraint "thought_embedding_matches_matches_thought_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_thought_embedding_matches(p_thought_id uuid, p_match_pairs jsonb)
 RETURNS SETOF thought_embedding_matches
 LANGUAGE plpgsql
AS $function$BEGIN
  -- Delete existing matches for the thought
  DELETE FROM thought_embedding_matches WHERE thought_id = p_thought_id;
  
  -- Insert new match pairs
  RETURN QUERY
  INSERT INTO thought_embedding_matches (thought_id, matched_by, matches, matches_thought_id, similarity)
  SELECT 
    (pair->>'thought_id')::UUID,
    (pair->>'matched_by')::UUID,
    (pair->>'matches')::UUID,
    (pair->>'matches_thought_id')::UUID,
    (pair->>'similarity')::float
  FROM jsonb_array_elements(p_match_pairs) AS pair
  RETURNING *;
END;$function$
;

CREATE OR REPLACE FUNCTION public.match_thought_chunks(query_embedding vector, match_threshold double precision, match_count integer, exclude_thought_id uuid, input_author_id uuid)
 RETURNS TABLE(id uuid, thought_id uuid, similarity double precision)
 LANGUAGE sql
AS $function$select 
    te.id,
    te.thought_id,
    -(te.embedding <#> query_embedding) as similarity
  from thought_embeddings te
  join thoughts t on te.thought_id = t.id
  where te.embedding <#> query_embedding < -match_threshold
    and t.author_id = input_author_id
    and te.thought_id != exclude_thought_id
  order by te.embedding <#> query_embedding asc
  limit least(match_count, 200);$function$
;

UPDATE thought_embedding_matches tem
SET matches_thought_id = te.thought_id
FROM thought_embeddings te
WHERE tem.matches = te.id
  AND tem.matches_thought_id IS NULL;

CREATE TRIGGER "Handle thought AI triggers" AFTER INSERT OR DELETE OR UPDATE ON public.thoughts FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://usecloudy.com/api/ai/update-thought', 'POST', '{"Content-type":"application/json","Authorization":"Bearer labu-labu-labubu"}', '{}', '5000');


