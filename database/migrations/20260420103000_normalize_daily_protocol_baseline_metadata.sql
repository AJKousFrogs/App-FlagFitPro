-- Normalize legacy Today protocol metadata so athletes with missing coach plans
-- still receive baseline training instead of a blocked Today screen.

WITH legacy_protocols AS (
  SELECT
    id,
    confidence_metadata #>> '{sessionResolution,status}' AS original_status
  FROM public.daily_protocols
  WHERE confidence_metadata #>> '{sessionResolution,status}' IN (
    'no_program',
    'no_week',
    'no_template'
  )
)
UPDATE public.daily_protocols AS dp
SET confidence_metadata = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(dp.confidence_metadata, '{}'::jsonb),
        '{sessionResolution,status}',
        '"baseline_program"'::jsonb,
        true
      ),
      '{sessionResolution,success}',
      'true'::jsonb,
      true
    ),
    '{sessionResolution,baselineProgram}',
    'true'::jsonb,
    true
  ),
  '{sessionResolution,originalStatus}',
  to_jsonb(legacy_protocols.original_status),
  true
)
FROM legacy_protocols
WHERE dp.id = legacy_protocols.id;
