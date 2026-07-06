/**
 * Per-Role Access Matrix (Unit F)
 *
 * Proves the server-side authorization layer makes the right access decision
 * for every (viewer-role x relationship) cell. These SECURITY DEFINER functions
 * take the viewer/subject identity as ARGUMENTS, so they are tested directly as
 * service_role without needing to mint per-user JWTs — and they are exactly what
 * the RLS policies and Netlify consent guards call to gate athlete data.
 *
 * Roles covered: anon (null viewer), player (self / other), coach (same-team /
 * cross-team), with consent gated separately for performance vs health.
 *
 * Fixtures are self-contained: real auth.users are created (FKs require them),
 * two teams + memberships + consent rows are seeded, then torn down. Skipped
 * unless SUPABASE_URL + a service-role key are present.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const canRunTests = SUPABASE_URL && SUPABASE_SERVICE_KEY;

// Fixed team UUIDs so a crashed run's rows can be pre-cleaned deterministically.
const TEAM_A = "aaaaaaaa-0000-4000-8000-0000000000a1";
const TEAM_B = "bbbbbbbb-0000-4000-8000-0000000000b1";

const EMAILS = {
  coach: "rls-matrix-coach@flagfit.test",
  player1: "rls-matrix-p1@flagfit.test",
  player2: "rls-matrix-p2@flagfit.test",
};

describe.skipIf(!canRunTests)("Per-Role Access Matrix", () => {
  let admin;
  let coachId;
  let player1Id; // on TEAM_A with coach
  let player2Id; // on TEAM_B (different team)

  const rpc = async (fn, params) => {
    const { data, error } = await admin.rpc(fn, params);
    expect(error, `${fn}(${JSON.stringify(params)}) errored`).toBeNull();
    return data;
  };

  const grantConsent = (performance, health) =>
    admin.from("team_sharing_settings").upsert(
      {
        user_id: player1Id,
        team_id: TEAM_A,
        performance_sharing_enabled: performance,
        health_sharing_enabled: health,
      },
      { onConflict: "user_id,team_id" },
    );

  beforeAll(async () => {
    admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });

    coachId = await createOrGetUser(admin, EMAILS.coach);
    player1Id = await createOrGetUser(admin, EMAILS.player1);
    player2Id = await createOrGetUser(admin, EMAILS.player2);

    await cleanup(admin, { coachId, player1Id, player2Id });

    // Teams (coach_id is NOT NULL and FKs auth.users).
    await admin.from("teams").insert([
      { id: TEAM_A, name: "RLS Matrix Team A", coach_id: coachId },
      { id: TEAM_B, name: "RLS Matrix Team B", coach_id: player2Id },
    ]);

    // Memberships: coach + player1 on A, player2 on B.
    await admin.from("team_members").insert([
      { team_id: TEAM_A, user_id: coachId, role: "coach", status: "active" },
      { team_id: TEAM_A, user_id: player1Id, role: "player", status: "active" },
      { team_id: TEAM_B, user_id: player2Id, role: "player", status: "active" },
    ]);

    // Default consent state for player1 on A: performance shared, health private.
    await grantConsent(true, false);
  });

  afterAll(async () => {
    if (admin) {
      await cleanup(admin, { coachId, player1Id, player2Id });
      // Best-effort: remove the created auth users so reruns don't accumulate.
      for (const id of [coachId, player1Id, player2Id].filter(Boolean)) {
        await admin.auth.admin.deleteUser(id).catch(() => {});
      }
    }
  });

  describe("Membership & staff predicates (ff_*)", () => {
    it("active player is a team member of their own team", async () => {
      expect(
        await rpc("ff_is_active_team_member", {
          p_team_id: TEAM_A,
          p_user_id: player1Id,
        }),
      ).toBe(true);
    });

    it("a player from another team is NOT a member", async () => {
      expect(
        await rpc("ff_is_active_team_member", {
          p_team_id: TEAM_A,
          p_user_id: player2Id,
        }),
      ).toBe(false);
    });

    it("the coach is an active member of their team", async () => {
      expect(
        await rpc("ff_is_active_team_member", {
          p_team_id: TEAM_A,
          p_user_id: coachId,
        }),
      ).toBe(true);
    });

    it("the coach is recognized as team staff", async () => {
      expect(
        await rpc("ff_is_team_staff", {
          p_team_id: TEAM_A,
          p_user_id: coachId,
        }),
      ).toBe(true);
    });

    it("a player is NOT team staff", async () => {
      expect(
        await rpc("ff_is_team_staff", {
          p_team_id: TEAM_A,
          p_user_id: player1Id,
        }),
      ).toBe(false);
    });

    it("coach and same-team player share an active team", async () => {
      expect(
        await rpc("ff_share_active_team", {
          p_actor_user_id: coachId,
          p_subject_user_id: player1Id,
        }),
      ).toBe(true);
    });

    it("coach and a cross-team player do NOT share a team", async () => {
      expect(
        await rpc("ff_share_active_team", {
          p_actor_user_id: coachId,
          p_subject_user_id: player2Id,
        }),
      ).toBe(false);
    });
  });

  describe("Performance visibility (can_view_player_performance)", () => {
    it("anon (null viewer) cannot view performance", async () => {
      expect(
        await rpc("can_view_player_performance", {
          p_viewer_id: null,
          p_player_id: player1Id,
        }),
      ).toBe(false);
    });

    it("a player can always view their own performance", async () => {
      expect(
        await rpc("can_view_player_performance", {
          p_viewer_id: player1Id,
          p_player_id: player1Id,
        }),
      ).toBe(true);
    });

    it("same-team coach CAN view performance when sharing is enabled", async () => {
      await grantConsent(true, false);
      expect(
        await rpc("can_view_player_performance", {
          p_viewer_id: coachId,
          p_player_id: player1Id,
        }),
      ).toBe(true);
    });

    it("same-team coach CANNOT view performance when sharing is disabled", async () => {
      await grantConsent(false, false);
      expect(
        await rpc("can_view_player_performance", {
          p_viewer_id: coachId,
          p_player_id: player1Id,
        }),
      ).toBe(false);
      await grantConsent(true, false); // restore default
    });

    it("a cross-team coach cannot view performance even with consent", async () => {
      expect(
        await rpc("can_view_player_performance", {
          p_viewer_id: coachId,
          p_player_id: player2Id,
        }),
      ).toBe(false);
    });

    it("a non-staff player cannot view another player's performance", async () => {
      expect(
        await rpc("can_view_player_performance", {
          p_viewer_id: player2Id,
          p_player_id: player1Id,
        }),
      ).toBe(false);
    });
  });

  describe("Health visibility (can_view_player_health) — gated separately", () => {
    it("a player can always view their own health", async () => {
      expect(
        await rpc("can_view_player_health", {
          p_viewer_id: player1Id,
          p_player_id: player1Id,
        }),
      ).toBe(true);
    });

    it("anon cannot view health", async () => {
      expect(
        await rpc("can_view_player_health", {
          p_viewer_id: null,
          p_player_id: player1Id,
        }),
      ).toBe(false);
    });

    it("same-team coach CANNOT view health while only performance is shared", async () => {
      await grantConsent(true, false);
      expect(
        await rpc("can_view_player_health", {
          p_viewer_id: coachId,
          p_player_id: player1Id,
        }),
      ).toBe(false);
    });

    it("same-team coach CAN view health once health sharing is enabled", async () => {
      await grantConsent(true, true);
      expect(
        await rpc("can_view_player_health", {
          p_viewer_id: coachId,
          p_player_id: player1Id,
        }),
      ).toBe(true);
      await grantConsent(true, false); // restore default
    });
  });
});

// ============================================================================
// HELPERS
// ============================================================================

async function createOrGetUser(admin, email) {
  // Reuse an existing fixture user (idempotent across reruns) or create one.
  // FK constraints require real auth.users rows for memberships/consent.
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) break;
    const found = (data?.users || []).find((u) => u.email === email);
    if (found) return found.id;
    if (!data?.users?.length || data.users.length < 200) break;
    page += 1;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password: `Rls-Matrix-${Math.abs(hashString(email))}!`,
  });
  if (error) throw error;
  return data.user.id;
}

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

async function cleanup(admin, { coachId, player1Id, player2Id }) {
  const userIds = [coachId, player1Id, player2Id].filter(Boolean);
  const teamIds = [TEAM_A, TEAM_B];

  // Reverse dependency order: consent + memberships -> teams -> per-user settings.
  await admin.from("team_sharing_settings").delete().in("team_id", teamIds);
  await admin.from("team_members").delete().in("team_id", teamIds);
  await admin.from("teams").delete().in("id", teamIds);
  if (userIds.length) {
    await admin.from("team_sharing_settings").delete().in("user_id", userIds);
    await admin.from("privacy_settings").delete().in("user_id", userIds);
  }
}
