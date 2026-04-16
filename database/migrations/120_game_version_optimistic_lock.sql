-- =============================================================================
-- Migration: 120_game_version_optimistic_lock.sql
-- Purpose: Add optimistic-locking version counter to games so concurrent
--          editors (multiple coaches/players recording plays simultaneously)
--          are detected and rejected rather than silently overwriting each other.
--
-- Strategy: Each POST to /api/game-events must supply the client's last-known
--           `version`. The server atomically increments `games.version` WHERE
--           version = expected. Zero rows updated → 409 Conflict; the client
--           must reload the game and retry.
-- =============================================================================

-- Add version column to existing games table
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 0;

-- Backfill: every existing game starts at version 0 (already the default, but
-- set explicitly for clarity if any rows predated the column).
UPDATE games SET version = 0 WHERE version IS NULL;

-- Index for the WHERE game_id = ? AND version = ? lookup in the version-check
-- UPDATE. The game_id index likely already exists (it's UNIQUE / PK candidate),
-- so this is additive.
CREATE INDEX IF NOT EXISTS idx_games_game_id_version
  ON games (game_id, version);

-- Comment for future developers
COMMENT ON COLUMN games.version IS
  'Monotonically increasing counter incremented on each play insertion via the '
  'game-events Netlify function. Used for optimistic-locking: clients must '
  'supply expectedVersion matching this value or receive HTTP 409 Conflict.';
