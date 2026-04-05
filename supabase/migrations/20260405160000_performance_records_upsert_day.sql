-- One performance log per user per UTC calendar day; enables PostgREST upsert on (user_id, performance_day).

ALTER TABLE public.performance_records
  ADD COLUMN IF NOT EXISTS performance_day date;

UPDATE public.performance_records
SET performance_day = (recorded_at AT TIME ZONE 'UTC')::date
WHERE performance_day IS NULL;

-- Keep the newest row per (user_id, day); drop older duplicates from historical data.
DELETE FROM public.performance_records pr
WHERE pr.ctid IN (
  SELECT ctid
  FROM (
    SELECT ctid,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, performance_day
             ORDER BY recorded_at DESC NULLS LAST, created_at DESC NULLS LAST
           ) AS rn
    FROM public.performance_records
    WHERE performance_day IS NOT NULL
  ) ranked
  WHERE ranked.rn > 1
);

ALTER TABLE public.performance_records
  ALTER COLUMN performance_day SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS performance_records_user_performance_day_uidx
  ON public.performance_records (user_id, performance_day);

COMMENT ON COLUMN public.performance_records.performance_day IS 'UTC calendar date for upsert idempotency (one snapshot per user per day).';

CREATE OR REPLACE FUNCTION public.performance_records_set_performance_day()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.performance_day IS NULL AND NEW.recorded_at IS NOT NULL THEN
    NEW.performance_day := (NEW.recorded_at AT TIME ZONE 'UTC')::date;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS performance_records_set_performance_day ON public.performance_records;
CREATE TRIGGER performance_records_set_performance_day
  BEFORE INSERT OR UPDATE OF recorded_at ON public.performance_records
  FOR EACH ROW
  EXECUTE FUNCTION public.performance_records_set_performance_day();
