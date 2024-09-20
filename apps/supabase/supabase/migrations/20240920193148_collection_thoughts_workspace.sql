-- Add the new column
ALTER TABLE collection_thoughts
ADD COLUMN workspace_id UUID;

-- Update the new column with values from the thoughts table
UPDATE collection_thoughts ct
SET workspace_id = t.workspace_id
FROM thoughts t
WHERE ct.thought_id = t.id;

-- Set the new column as NOT NULL
ALTER TABLE collection_thoughts
ALTER COLUMN workspace_id SET NOT NULL;

-- Add a foreign key constraint with CASCADE on UPDATE and DELETE
ALTER TABLE collection_thoughts
ADD CONSTRAINT fk_collection_thoughts_workspace
FOREIGN KEY (workspace_id)
REFERENCES workspaces(id)
ON UPDATE CASCADE
ON DELETE CASCADE;

-- Create an index on the new column
CREATE INDEX idx_collection_thoughts_workspace_id ON collection_thoughts(workspace_id);