/**
 * Seed-Data Integrity Tests (Unit F)
 *
 * Proves the consolidated competition/participation/achievement spine has no
 * dangling references after the v11 consolidation + user_id standardization:
 *   - competition_events FKs (competition, team, created_by) all resolve
 *   - event_participation <-> training_sessions linkage is consistent (FK + same user_id)
 *   - player_achievements reference real achievement_definitions and users
 *   - no orphaned team_members.user_id
 *
 * Mechanism: queries the locked-down `v_seed_integrity` view (migration
 * 20260601155842_audit_fixF_seed_integrity_view.sql) as service_role. Every row
 * must report violations = 0.
 *
 * Skipped unless SUPABASE_URL + a service-role key are present.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const canRunTests = SUPABASE_URL && SUPABASE_SERVICE_KEY;

describe.skipIf(!canRunTests)("Seed-Data Integrity", () => {
  let supabaseAdmin;
  let rows;

  beforeAll(async () => {
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabaseAdmin
      .from("v_seed_integrity")
      .select("check_name, violations");

    expect(error).toBeNull();
    rows = data || [];
  });

  it("returns the full set of integrity checks", () => {
    // The view defines 10 checks; guard against the view being silently emptied.
    expect(rows.length).toBeGreaterThanOrEqual(10);
  });

  it("has zero referential-integrity violations across the spine", () => {
    const failing = rows.filter((r) => Number(r.violations) > 0);
    expect(
      failing,
      `Integrity violations: ${JSON.stringify(failing, null, 2)}`,
    ).toEqual([]);
  });

  it("reports every check individually as zero", () => {
    for (const row of rows) {
      expect(
        Number(row.violations),
        `${row.check_name} should have 0 violations`,
      ).toBe(0);
    }
  });
});
