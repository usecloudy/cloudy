CREATE OR REPLACE FUNCTION public.search_docs(search_query text, p_workspace_id uuid)
 RETURNS TABLE(doc_id uuid, doc_title text, doc_content_md text, doc_content_plaintext text, doc_updated_at timestamp with time zone, doc_project_id uuid, project_name text, project_slug text)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT  
    thoughts.id AS doc_id, 
    thoughts.title AS doc_title, 
    thoughts.content_md AS doc_content_md, 
    thoughts.content_plaintext AS doc_content_plaintext, 
    thoughts.updated_at AS doc_updated_at,
    thoughts.project_id AS doc_project_id,
    projects.name as project_name,
    projects.slug as project_slug
  FROM thoughts
  LEFT JOIN projects ON thoughts.project_id = projects.id
  WHERE to_tsvector(COALESCE(thoughts.title, '') || ' ' || COALESCE(thoughts.content_md, '')) @@ to_tsquery(search_query || ':*')
  AND thoughts.workspace_id = p_workspace_id
  ORDER BY thoughts.updated_at DESC;
END;
$function$
;