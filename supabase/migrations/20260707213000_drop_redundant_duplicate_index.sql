-- Audit: drop one exact-duplicate index.
-- weather_substitution_rules_original_modality_condition_idx is an EXACT duplicate
-- (same columns, same order, non-partial) of the UNIQUE constraint index
-- weather_substitution_rules_original_modality_condition_key — pure redundancy
-- (extra write cost + storage). The unique key serves every query the plain index did.
--
-- Reversal: CREATE INDEX weather_substitution_rules_original_modality_condition_idx
--             ON public.weather_substitution_rules (original_modality, condition);

DROP INDEX IF EXISTS public.weather_substitution_rules_original_modality_condition_idx;
