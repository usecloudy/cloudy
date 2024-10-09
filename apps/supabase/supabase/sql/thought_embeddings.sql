CREATE OR REPLACE FUNCTION public.insert_thought_chunk_matches(
  p_thought_id UUID,
  p_match_pairs JSONB
) RETURNS SETOF thought_chunk_matches AS $$
BEGIN
  -- Delete existing matches for the thought
  DELETE FROM thought_chunk_matches WHERE thought_id = p_thought_id;
  
  -- Insert new match pairs
  RETURN QUERY
  INSERT INTO thought_chunk_matches (thought_id, matches_thought_id, matched_by, matches, similarity)
  SELECT 
    (pair->>'thought_id')::UUID,
    (pair->>'matches_thought_id')::UUID,
    (pair->>'matched_by')::UUID,
    (pair->>'matches')::UUID,
    (pair->>'similarity')::float
  FROM jsonb_array_elements(p_match_pairs) AS pair
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.multi_embedding_thought_chunk_search(
  query_embeddings vector[],
  match_threshold double precision,
  max_results integer,
  workspace_id uuid,
  ignore_thought_ids uuid[] DEFAULT NULL
)
 RETURNS TABLE(chunk_id uuid, thought_id uuid, similarity_score double precision)
 LANGUAGE sql
AS $function$
  WITH query_vectors AS (
    SELECT unnest(query_embeddings) AS query_vector
  )
  SELECT 
    tcme.chunk_id,
    tc.thought_id,
    1 - MIN(tcme.embedding <=> qv.query_vector) AS similarity_score
  FROM thought_chunk_multi_embeddings tcme
  JOIN thought_chunks tc ON tcme.chunk_id = tc.id
  JOIN thoughts t ON tc.thought_id = t.id
  CROSS JOIN query_vectors qv
  WHERE t.workspace_id = workspace_id
    AND (ignore_thought_ids IS NULL OR t.id != ALL(ignore_thought_ids))
  GROUP BY tcme.chunk_id, tc.thought_id
  HAVING 1 - MIN(tcme.embedding <=> qv.query_vector) > match_threshold
  ORDER BY similarity_score DESC
  LIMIT max_results
$function$;

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


CREATE OR REPLACE FUNCTION public.multi_embedding_thought_summary_search(
  query_embeddings vector[],
  max_results integer,
  workspace_id uuid,
  ignore_thought_ids uuid[] DEFAULT NULL
)
 RETURNS TABLE(thought_id uuid, similarity_score double precision)
 LANGUAGE sql
AS $function$
  WITH query_vectors AS (
    SELECT unnest(query_embeddings) AS query_vector
  )
  SELECT 
    tsme.thought_id AS thought_id,
    SUM(GREATEST(1 - (tsme.embedding <=> qv.query_vector), 0)) AS similarity_score
  FROM thought_summary_multi_embeddings tsme
  JOIN thoughts t ON tsme.thought_id = t.id
  CROSS JOIN query_vectors qv
  WHERE t.workspace_id = workspace_id
    AND (ignore_thought_ids IS NULL OR t.id != ALL(ignore_thought_ids))
  GROUP BY tsme.thought_id
  ORDER BY similarity_score DESC
  LIMIT max_results
$function$;

CREATE OR REPLACE FUNCTION public.embedding_collection_intent_search(query_embedding vector, match_threshold double precision, max_results integer, p_workspace_id uuid)
 RETURNS TABLE(collection_id uuid, similarity_score double precision)
 LANGUAGE sql
AS $function$
  SELECT 
    c.id AS collection_id,
    1 - (c.intent_embedding <=> query_embedding) AS similarity_score
  FROM collections c
  WHERE c.workspace_id = p_workspace_id -- Use the renamed parameter
  GROUP BY c.id, c.intent_embedding
  HAVING (1 - (c.intent_embedding <=> query_embedding)) > match_threshold
  ORDER BY similarity_score DESC
  LIMIT max_results;
$function$
;