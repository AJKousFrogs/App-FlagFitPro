-- =============================================================================
-- Migration: 121_game_events_rls_policies.sql
-- Purpose: Add Row Level Security policies to game_events and
--          game_participations tables, which previously had no policies
--          despite RLS being enabled.
--
-- Access model:
--   game_events        - authors (recorder) can manage own plays;
--                        teammates on the same game's team can view.
--   game_participations - athletes manage own presence records;
--                         coaches/admins can manage their team's records.
-- =============================================================================

-- ============================================================================
-- GAME EVENTS
-- ============================================================================

-- Enable RLS (idempotent)
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members can view game events" ON game_events;
DROP POLICY IF EXISTS "Authorized users can insert game events" ON game_events;
DROP POLICY IF EXISTS "Recorders can update own game events" ON game_events;
DROP POLICY IF EXISTS "Coaches and recorders can delete game events" ON game_events;

-- Any member of the team that owns the game may view its plays
CREATE POLICY "Team members can view game events"
ON game_events FOR SELECT
USING (
  game_id IN (
    SELECT g.game_id FROM games g
    WHERE g.team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.user_id()
    )
  )
);

-- Coaches, admins, and players on the team may insert plays
CREATE POLICY "Authorized users can insert game events"
ON game_events FOR INSERT
WITH CHECK (
  game_id IN (
    SELECT g.game_id FROM games g
    WHERE g.team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.user_id()
    )
  )
);

-- Only the original recorder may update their play
CREATE POLICY "Recorders can update own game events"
ON game_events FOR UPDATE
USING (primary_player_id = auth.user_id_text())
WITH CHECK (primary_player_id = auth.user_id_text());

-- Coaches/admins can delete any play; recorders can delete their own
CREATE POLICY "Coaches and recorders can delete game events"
ON game_events FOR DELETE
USING (
  primary_player_id = auth.user_id_text()
  OR EXISTS (
    SELECT 1 FROM team_members tm
    INNER JOIN games g ON g.team_id = tm.team_id
    WHERE g.game_id = game_events.game_id
      AND tm.user_id = auth.user_id()
      AND tm.role IN ('coach', 'admin')
  )
);

-- ============================================================================
-- GAME PARTICIPATIONS
-- ============================================================================

ALTER TABLE game_participations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Players can view own participation" ON game_participations;
DROP POLICY IF EXISTS "Team members can view team participations" ON game_participations;
DROP POLICY IF EXISTS "Players can manage own participation" ON game_participations;
DROP POLICY IF EXISTS "Coaches can manage team participations" ON game_participations;

-- Athletes can always see their own participation record
CREATE POLICY "Players can view own participation"
ON game_participations FOR SELECT
USING (player_id = auth.user_id_text());

-- Coaches and teammates can view the game's full participation roster
CREATE POLICY "Team members can view team participations"
ON game_participations FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.user_id()
  )
);

-- Athletes manage their own presence record (INSERT + UPDATE + DELETE)
CREATE POLICY "Players can manage own participation"
ON game_participations FOR ALL
USING (player_id = auth.user_id_text())
WITH CHECK (player_id = auth.user_id_text());

-- Coaches and admins may manage any player's participation on their team
CREATE POLICY "Coaches can manage team participations"
ON game_participations FOR ALL
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id()
      AND role IN ('coach', 'admin')
  )
)
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id()
      AND role IN ('coach', 'admin')
  )
);
