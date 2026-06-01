-- Backend cleanup Phase 13: drop the dead chatbot_user_context (superseded by the
-- Merlin/chat AI: conversation_context / chat_messages / ai_messages). 0 rows, 0 code refs,
-- 0 FK dependents. Its only dependents: a generic updated_at trigger (drops with the table)
-- and the helper get_or_create_chatbot_context() (returns the table rowtype, 0 callers).
DROP FUNCTION IF EXISTS public.get_or_create_chatbot_context(uuid);
DROP TABLE IF EXISTS public.chatbot_user_context;
