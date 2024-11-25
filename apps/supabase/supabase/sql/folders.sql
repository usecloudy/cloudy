CREATE OR REPLACE FUNCTION get_folder_ancestors(folder_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    parent_id UUID,
    depth INT
) AS $$
WITH RECURSIVE ancestors AS (
    -- Base case: start with the given folder
    SELECT 
        f.id,
        f.name,
        f.parent_id,
        0 as depth
    FROM folders f
    WHERE f.id = folder_id

    UNION ALL

    -- Recursive case: get parent folders
    SELECT 
        f.id,
        f.name,
        f.parent_id,
        a.depth + 1
    FROM folders f
    INNER JOIN ancestors a ON f.id = a.parent_id
)
SELECT * FROM ancestors ORDER BY depth DESC;
$$ LANGUAGE sql STABLE;
