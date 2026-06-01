
-- Add unique constraint on entry_id for ON CONFLICT in trigger
CREATE UNIQUE INDEX IF NOT EXISTS idx_knowledge_search_index_entry_id 
ON knowledge_search_index(entry_id);
