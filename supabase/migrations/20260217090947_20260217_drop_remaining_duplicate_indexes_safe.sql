
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    WITH idx AS (
      SELECT
        i.indexrelid,
        i.indrelid,
        ns.nspname AS schema_name,
        tbl.relname AS table_name,
        cls.relname AS index_name,
        i.indisprimary,
        i.indisunique,
        i.indkey,
        i.indclass,
        i.indcollation,
        i.indoption,
        pg_get_expr(i.indpred, i.indrelid) AS indpred_expr,
        pg_get_expr(i.indexprs, i.indrelid) AS indexprs_expr,
        EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conindid = i.indexrelid) AS backs_constraint
      FROM pg_index i
      JOIN pg_class cls ON cls.oid = i.indexrelid
      JOIN pg_class tbl ON tbl.oid = i.indrelid
      JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
      WHERE ns.nspname = 'public'
    ), groups AS (
      SELECT
        indrelid,
        indkey,
        indclass,
        indcollation,
        indoption,
        coalesce(indpred_expr, '') AS indpred_expr,
        coalesce(indexprs_expr, '') AS indexprs_expr,
        count(*) AS cnt,
        min(indexrelid) AS min_idx
      FROM idx
      GROUP BY indrelid, indkey, indclass, indcollation, indoption, coalesce(indpred_expr, ''), coalesce(indexprs_expr, '')
      HAVING count(*) > 1
    ), ranked AS (
      SELECT
        i.schema_name,
        i.index_name,
        i.indexrelid,
        g.cnt,
        row_number() OVER (
          PARTITION BY i.indrelid, i.indkey, i.indclass, i.indcollation, i.indoption, coalesce(i.indpred_expr,''), coalesce(i.indexprs_expr,'')
          ORDER BY i.indisprimary DESC, i.backs_constraint DESC, i.indisunique DESC, i.index_name ASC
        ) AS rn
      FROM idx i
      JOIN groups g
        ON g.indrelid = i.indrelid
       AND g.indkey = i.indkey
       AND g.indclass = i.indclass
       AND g.indcollation = i.indcollation
       AND g.indoption = i.indoption
       AND g.indpred_expr = coalesce(i.indpred_expr,'')
       AND g.indexprs_expr = coalesce(i.indexprs_expr,'')
    )
    SELECT schema_name, index_name
    FROM ranked
    WHERE rn > 1
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS %I.%I;', r.schema_name, r.index_name);
  END LOOP;
END $$;
