alter table "public"."collections" add column "intent_embedding" vector;

alter table "public"."collections" add column "is_auto" boolean not null default false;

alter table "public"."thoughts" drop column "generated_intent";

alter table "public"."thoughts" add column "generated_intents" text[] not null default '{}'::text[];

alter table "public"."thoughts" add column "generated_type" text;

set check_function_bodies = off;

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

CREATE TRIGGER update_collection_summary AFTER INSERT OR DELETE OR UPDATE ON public.collection_thoughts FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://www.usecloudy.com/api/ai/collection-summarize/webhook', 'POST', '{"Content-type":"application/json","Authorization":"Bearer labu-labu-labubu"}', '{}', '5000');