set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_folder_ancestors(folder_id uuid)
 RETURNS TABLE(id uuid, name text, parent_id uuid, depth integer, access_strategy text)
 LANGUAGE sql
 STABLE
AS $function$
WITH RECURSIVE ancestors AS (
    -- Base case: start with the given folder
    SELECT 
        f.id,
        f.name,
        f.parent_id,
        0 as depth,
        f.access_strategy
    FROM folders f
    WHERE f.id = folder_id

    UNION ALL

    -- Recursive case: get parent folders
    SELECT 
        f.id,
        f.name,
        f.parent_id,
        a.depth + 1,
        f.access_strategy
    FROM folders f
    INNER JOIN ancestors a ON f.id = a.parent_id
)
SELECT * FROM ancestors ORDER BY depth DESC;
$function$
;