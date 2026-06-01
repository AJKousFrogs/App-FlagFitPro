DO $$
DECLARE
  rec RECORD;
  idx_name TEXT;
BEGIN
  FOR rec IN
    WITH fk_cols AS (
      SELECT
        n.nspname AS schema_name,
        t.relname AS table_name,
        c.conname,
        c.conrelid,
        c.conkey,
        array_agg(a.attname ORDER BY k.ord) AS col_names,
        string_agg(format('%I', a.attname), ', ' ORDER BY k.ord) AS col_list_sql
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      JOIN unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord) ON true
      JOIN pg_attribute a
        ON a.attrelid = c.conrelid
       AND a.attnum = k.attnum
      WHERE c.contype = 'f'
        AND n.nspname = 'public'
      GROUP BY n.nspname, t.relname, c.conname, c.conrelid, c.conkey
    )
    SELECT f.*
    FROM fk_cols f
    WHERE NOT EXISTS (
      SELECT 1
      FROM pg_index ix
      WHERE ix.indrelid = f.conrelid
        AND ix.indisvalid
        AND ix.indpred IS NULL
        AND array_length(ix.indkey::smallint[], 1) >= array_length(f.conkey, 1)
        AND (ix.indkey::smallint[])[1:array_length(f.conkey, 1)] = f.conkey
    )
  LOOP
    idx_name := format('idx_%s_%s_fk_cov', rec.table_name, array_to_string(rec.col_names, '_'));

    IF length(idx_name) > 63 THEN
      idx_name := format('idx_%s_%s_fk_cov', left(rec.table_name, 18), substr(md5(rec.conname), 1, 16));
    END IF;

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON %I.%I (%s)',
      idx_name,
      rec.schema_name,
      rec.table_name,
      rec.col_list_sql
    );
  END LOOP;
END
$$;
