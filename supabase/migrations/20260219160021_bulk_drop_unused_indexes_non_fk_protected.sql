DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    WITH candidate AS (
      SELECT
        n.nspname AS schema_name,
        t.relname AS table_name,
        i.relname AS index_name,
        ix.indrelid,
        ix.indkey::smallint[] AS indkey_arr,
        COALESCE(s.idx_scan, 0) AS idx_scan
      FROM pg_class i
      JOIN pg_index ix ON ix.indexrelid = i.oid
      JOIN pg_class t ON t.oid = ix.indrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      LEFT JOIN pg_stat_user_indexes s ON s.indexrelid = i.oid
      WHERE n.nspname = 'public'
        AND i.relname LIKE 'idx_%'
        AND NOT ix.indisprimary
        AND NOT ix.indisunique
        AND COALESCE(s.idx_scan, 0) = 0
    ), fk_protected AS (
      SELECT DISTINCT c.schema_name, c.index_name
      FROM candidate c
      JOIN pg_constraint fk
        ON fk.conrelid = c.indrelid
       AND fk.contype = 'f'
      WHERE array_length(c.indkey_arr, 1) >= array_length(fk.conkey, 1)
        AND c.indkey_arr[1:array_length(fk.conkey, 1)] = fk.conkey
    )
    SELECT c.schema_name, c.index_name
    FROM candidate c
    LEFT JOIN fk_protected fkp
      ON fkp.schema_name = c.schema_name
     AND fkp.index_name = c.index_name
    WHERE fkp.index_name IS NULL
      AND c.index_name NOT IN (
        'idx_team_sharing_settings_team_id',
        'idx_team_sharing_settings_user_team'
      )
    ORDER BY c.table_name, c.index_name
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS %I.%I', rec.schema_name, rec.index_name);
  END LOOP;
END
$$;
