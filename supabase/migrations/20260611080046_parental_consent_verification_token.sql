-- S10: the parental-consent verification flow (guardian email link) needs a token
-- to validate the click, but the live parental_consent table had no place for it.
-- Add the necessary verification infrastructure (additive, non-destructive). The
-- per-feature consent booleans stay in the existing consent_scope jsonb; only the
-- security-token fields are real columns. APPLIED live via Supabase MCP 2026-06-11
-- (version 20260611080046).
ALTER TABLE public.parental_consent
  ADD COLUMN IF NOT EXISTS verification_token text,
  ADD COLUMN IF NOT EXISTS verification_sent_at timestamptz;

-- Partial unique index: a live (non-null) token must be unique and is the lookup key.
CREATE UNIQUE INDEX IF NOT EXISTS parental_consent_verification_token_key
  ON public.parental_consent (verification_token)
  WHERE verification_token IS NOT NULL;
