DO $$
DECLARE
  rec RECORD;
BEGIN
  -- Drop fk_cov indexes when a non-fk_cov, non-partial index on the same table
  -- has the same leading key columns (left-prefix coverage).
  FOR rec IN
    WITH idx AS (
      SELECT
        ix.indexrelid,
        ix.indrelid,
        n.nspname AS schema_name,
        t.relname AS table_name,
        i.relname AS index_name,
        ix.indisvalid,
        ix.indpred IS NOT NULL AS is_partial,
        string_to_array(ix.indkey::text, ' ')::smallint[] AS indkey_arr
      FROM pg_index ix
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_class t ON t.oid = ix.indrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      JOIN pg_am am ON am.oid = i.relam
      WHERE n.nspname='public'
        AND am.amname='btree'
        AND ix.indisvalid
    ), candidates AS (
      SELECT *
      FROM idx
      WHERE index_name LIKE '%_fk_cov%'
        AND index_name NOT LIKE '%_fk_cov2'
        AND NOT is_partial
    ), covered AS (
      SELECT DISTINCT c.schema_name, c.index_name
      FROM candidates c
      JOIN idx k
        ON k.indrelid = c.indrelid
       AND k.indexrelid <> c.indexrelid
       AND NOT k.is_partial
       AND k.index_name NOT LIKE '%_fk_cov%'
       AND array_length(k.indkey_arr,1) >= array_length(c.indkey_arr,1)
       AND k.indkey_arr[1:array_length(c.indkey_arr,1)] = c.indkey_arr
    )
    SELECT schema_name, index_name
    FROM covered
    ORDER BY index_name
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS %I.%I', rec.schema_name, rec.index_name);
  END LOOP;

  -- Normalize fk_cov2 names where the target fk_cov name is free.
  IF to_regclass('public.idx_coach_athlete_assignments_athlete_id_fk_cov') IS NULL
     AND to_regclass('public.idx_coach_athlete_assignments_athlete_id_fk_cov2') IS NOT NULL THEN
    EXECUTE 'ALTER INDEX public.idx_coach_athlete_assignments_athlete_id_fk_cov2 RENAME TO idx_coach_athlete_assignments_athlete_id_fk_cov';
  END IF;

  IF to_regclass('public.idx_parent_guardian_links_parent_id_fk_cov') IS NULL
     AND to_regclass('public.idx_parent_guardian_links_parent_id_fk_cov2') IS NOT NULL THEN
    EXECUTE 'ALTER INDEX public.idx_parent_guardian_links_parent_id_fk_cov2 RENAME TO idx_parent_guardian_links_parent_id_fk_cov';
  END IF;
END
$$;
