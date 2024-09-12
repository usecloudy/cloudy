set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.search_thoughts(search_query text, user_id uuid)
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
  AND author_id = user_id
  ORDER BY thoughts.updated_at DESC;
END;
$function$
;