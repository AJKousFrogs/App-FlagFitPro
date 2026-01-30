-- Drop unused/orphaned database functions that reference non-existent tables or columns
-- These functions are not used in the current application codebase

-- Drop chatbot context function (references schema that may not match current state)
DROP FUNCTION IF EXISTS public.get_or_create_chatbot_context(uuid);
DROP FUNCTION IF EXISTS public.get_or_create_chatbot_context;

-- Drop organization member function (references non-existent user_organizations table)
DROP FUNCTION IF EXISTS public.user_is_org_member_with_min_role(uuid, text);
DROP FUNCTION IF EXISTS public.user_is_org_member_with_min_role;

-- Note: The index_advisor extension warning is a built-in Postgres extension issue
-- and doesn't affect application functionality. It can be addressed by updating
-- the extension or adjusting the function implementation if needed.
