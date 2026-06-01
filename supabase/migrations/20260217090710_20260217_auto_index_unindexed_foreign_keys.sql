
DO $$
DECLARE
  r RECORD;
  idx_name TEXT;
BEGIN
  FOR r IN
    SELECT
      n.nspname AS schema_name,
      t.relname AS table_name,
      c.conname AS constraint_name,
      string_agg(quote_ident(a.attname), ', ' ORDER BY u.ord) AS cols_quoted
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN unnest(c.conkey) WITH ORDINALITY AS u(attnum, ord) ON TRUE
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = u.attnum
    WHERE c.contype = 'f'
      AND n.nspname = 'public'
      AND NOT EXISTS (
        SELECT 1
        FROM pg_index i
        WHERE i.indrelid = c.conrelid
          AND (i.indkey::smallint[])[1:array_length(c.conkey, 1)] = c.conkey
      )
    GROUP BY n.nspname, t.relname, c.conname
  LOOP
    idx_name := format('idx_%s_%s_fk_auto', r.table_name, replace(r.constraint_name, '_fkey', ''));
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON %I.%I (%s);',
      idx_name,
      r.schema_name,
      r.table_name,
      r.cols_quoted
    );
  END LOOP;
END $$;
