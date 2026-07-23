-- Extends the existing device_pairings table with OAuth token storage
-- (finally giving it a writer, per docs/gps_wearable_csv_import_proposal.md
-- §2) rather than a new table -- the pairing concept it already models is
-- exactly right, it's just never written to for wearable OAuth today.
--
-- Tokens are stored ENCRYPTED at the application layer (utils/token-crypto.js,
-- AES-256-GCM, key from WEARABLE_TOKEN_ENCRYPTION_KEY) before ever reaching
-- this column -- never raw. This is additive; existing rows are unaffected
-- (columns are nullable, no default needed for the GPS-vest pairings that
-- don't use OAuth at all).
--
-- Reversal:
--   ALTER TABLE public.device_pairings
--     DROP COLUMN IF EXISTS access_token_encrypted,
--     DROP COLUMN IF EXISTS refresh_token_encrypted,
--     DROP COLUMN IF EXISTS token_expires_at,
--     DROP COLUMN IF EXISTS scopes;

ALTER TABLE public.device_pairings
  ADD COLUMN IF NOT EXISTS access_token_encrypted text,
  ADD COLUMN IF NOT EXISTS refresh_token_encrypted text,
  ADD COLUMN IF NOT EXISTS token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS scopes text[];

COMMENT ON COLUMN public.device_pairings.access_token_encrypted IS
  'AES-256-GCM ciphertext (utils/token-crypto.js), never plaintext. NULL for non-OAuth pairings (e.g. GPS-vest CSV import pairings).';
COMMENT ON COLUMN public.device_pairings.refresh_token_encrypted IS
  'AES-256-GCM ciphertext (utils/token-crypto.js), never plaintext.';
COMMENT ON COLUMN public.device_pairings.token_expires_at IS
  'Access token expiry, for the (not-yet-built) token-refresh job to act on before it lapses.';
