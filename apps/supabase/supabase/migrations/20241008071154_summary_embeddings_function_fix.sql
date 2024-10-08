
drop function if exists "public"."embedding_thought_summary_search"(query_embedding vector, match_threshold double precision, max_results integer, workspace_id uuid, ignore_thought_ids uuid[]);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.embedding_thought_summary_search(query_embedding vector, match_threshold double precision, max_results integer, p_workspace_id uuid, ignore_thought_ids uuid[] DEFAULT NULL::uuid[])
 RETURNS TABLE(thought_id uuid, similarity_score double precision)
 LANGUAGE sql
AS $function$
  SELECT 
    t.id AS thought_id,
    1 - (tse.embedding <=> query_embedding) AS similarity_score
  FROM thought_summary_embeddings tse
  JOIN thoughts t ON tse.thought_id = t.id
  WHERE t.workspace_id = p_workspace_id -- Use the renamed parameter
    AND (ignore_thought_ids IS NULL OR t.id != ALL(ignore_thought_ids))
  GROUP BY t.id, tse.embedding
  HAVING (1 - (tse.embedding <=> query_embedding)) > match_threshold
  ORDER BY similarity_score DESC
  LIMIT max_results;
$function$
;