-- Supabase Debugging Helper Functions
-- Run these to enable better debugging capabilities

-- Function to check if a table has an index on user_id
CREATE OR REPLACE FUNCTION check_user_id_index(table_name text)
RETURNS TABLE (
  indexname text,
  indexdef text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.indexname::text,
    i.indexdef::text
  FROM pg_indexes i
  WHERE i.schemaname = 'public'
    AND i.tablename = table_name
    AND i.indexdef ILIKE '%user_id%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all columns for a table
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable text,
  column_default text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text,
    c.column_default::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = table_name
  ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all indexes for a table
CREATE OR REPLACE FUNCTION get_table_indexes(table_name text)
RETURNS TABLE (
  indexname text,
  indexdef text,
  columns text[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.indexname::text,
    i.indexdef::text,
    ARRAY(
      SELECT a.attname::text
      FROM pg_index ix
      JOIN pg_class c ON c.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(ix.indkey)
      WHERE c.relname = i.indexname
    ) as columns
  FROM pg_indexes i
  WHERE i.schemaname = 'public'
    AND i.tablename = table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check RLS policies for a table
CREATE OR REPLACE FUNCTION get_table_policies(table_name text)
RETURNS TABLE (
  policyname text,
  cmd text,
  roles text[],
  qual text,
  with_check text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.policyname::text,
    p.cmd::text,
    p.roles::text[],
    p.qual::text,
    p.with_check::text
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename = table_name
  ORDER BY p.cmd, p.policyname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add missing index on injuries.user_id if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'injuries' 
    AND indexdef LIKE '%user_id%'
  ) THEN
    CREATE INDEX idx_injuries_user_id ON injuries(user_id);
    RAISE NOTICE 'Created index idx_injuries_user_id';
  END IF;
END $$;

-- Add missing index on user_profiles.id if not exists (should already exist as primary key)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles' 
    AND indexdef LIKE '%\(id\)%'
  ) THEN
    RAISE NOTICE 'user_profiles.id index missing - this should not happen!';
  END IF;
END $$;

-- Add updated_at trigger for optimistic concurrency
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to injuries table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_injuries_updated_at'
  ) THEN
    CREATE TRIGGER update_injuries_updated_at
      BEFORE UPDATE ON injuries
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    RAISE NOTICE 'Created trigger update_injuries_updated_at';
  END IF;
END $$;

-- Add trigger to user_profiles table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_user_profiles_updated_at
      BEFORE UPDATE ON user_profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    RAISE NOTICE 'Created trigger update_user_profiles_updated_at';
  END IF;
END $$;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION check_user_id_index(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_columns(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_indexes(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_policies(text) TO authenticated;

-- Enable query logging (requires superuser, run this in Supabase dashboard SQL editor)
-- ALTER DATABASE postgres SET log_statement = 'all';
-- ALTER DATABASE postgres SET log_duration = 'on';

COMMENT ON FUNCTION check_user_id_index IS 'Helper function to check if a table has an index on user_id column';
COMMENT ON FUNCTION get_table_columns IS 'Helper function to get all columns for a table';
COMMENT ON FUNCTION get_table_indexes IS 'Helper function to get all indexes for a table';
COMMENT ON FUNCTION get_table_policies IS 'Helper function to get RLS policies for a table';
