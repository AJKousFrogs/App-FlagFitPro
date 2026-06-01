
-- 1) Remove redundant auto-generated FK indexes when an equivalent non-auto index already exists.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      ns.nspname AS schema_name,
      ai.relname AS auto_index_name
    FROM pg_index aix
    JOIN pg_class ai ON ai.oid = aix.indexrelid
    JOIN pg_class t ON t.oid = aix.indrelid
    JOIN pg_namespace ns ON ns.oid = t.relnamespace
    WHERE ns.nspname = 'public'
      AND ai.relname LIKE 'idx_%_fk_auto'
      AND EXISTS (
        SELECT 1
        FROM pg_index oix
        JOIN pg_class oi ON oi.oid = oix.indexrelid
        WHERE oix.indrelid = aix.indrelid
          AND oix.indexrelid <> aix.indexrelid
          AND oi.relname NOT LIKE 'idx_%_fk_auto'
          AND oix.indkey = aix.indkey
          AND oix.indclass = aix.indclass
          AND oix.indcollation = aix.indcollation
          AND oix.indoption = aix.indoption
          AND oix.indpred IS NOT DISTINCT FROM aix.indpred
      )
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS %I.%I;', r.schema_name, r.auto_index_name);
  END LOOP;
END $$;

-- 2) Explicitly ensure the one remaining FK index exists.
CREATE INDEX IF NOT EXISTS idx_parent_guardian_links_parent_id
ON public.parent_guardian_links(parent_id);

-- 3) Optimize physical_measurements RLS policies using (select auth.uid())
DROP POLICY IF EXISTS "Users can insert their own measurements" ON public.physical_measurements;
CREATE POLICY "Users can insert their own measurements"
ON public.physical_measurements
FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own measurements" ON public.physical_measurements;
CREATE POLICY "Users can view their own measurements"
ON public.physical_measurements
FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own measurements" ON public.physical_measurements;
CREATE POLICY "Users can update their own measurements"
ON public.physical_measurements
FOR UPDATE TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own measurements" ON public.physical_measurements;
CREATE POLICY "Users can delete their own measurements"
ON public.physical_measurements
FOR DELETE TO authenticated
USING ((select auth.uid()) = user_id);
