import { describe, it, expect } from "vitest";
import { createSupabaseMock } from "../helpers/supabase-mock.js";
import {
  getStaffedTeamIds,
  getMemberTeamIds,
  sharesStaffedTeam,
  resolveStaffedTeam,
  isStaffOfTeam,
  isActiveTeamMember,
} from "../../netlify/functions/utils/team-scope.js";

// team-scope is the security-critical multi-team resolver. Its helpers accept an
// injectable client, so we drive them with a filtering in-memory mock — no module
// mocking needed.

// A coach of teams A+B, an athlete on B+C (national team), an outsider coach of C.
const COACH = "coach-ab";
const ATHLETE = "athlete-bc";
const OUTSIDER = "coach-c";
const TEAM_A = "team-a";
const TEAM_B = "team-b";
const TEAM_C = "team-c";

const members = (rows) => createSupabaseMock({ team_members: rows });

const ROSTER = [
  { user_id: COACH, team_id: TEAM_A, role: "coach", status: "active", updated_at: "2026-06-02" },
  { user_id: COACH, team_id: TEAM_B, role: "head_coach", status: "active", updated_at: "2026-06-09" },
  { user_id: ATHLETE, team_id: TEAM_B, role: "player", status: "active", updated_at: "2026-06-01" },
  { user_id: ATHLETE, team_id: TEAM_C, role: "player", status: "active", updated_at: "2026-06-05" },
  { user_id: OUTSIDER, team_id: TEAM_C, role: "coach", status: "active", updated_at: "2026-06-03" },
  // an inactive membership that must never count
  { user_id: COACH, team_id: "team-old", role: "coach", status: "inactive", updated_at: "2026-06-10" },
];

describe("getStaffedTeamIds", () => {
  it("returns only active staffed teams, most-recent first", async () => {
    const ids = await getStaffedTeamIds(COACH, { client: members(ROSTER) });
    expect(ids).toEqual([TEAM_B, TEAM_A]); // updated_at desc; inactive excluded
  });

  it("excludes teams where the user is only a player", async () => {
    const ids = await getStaffedTeamIds(ATHLETE, { client: members(ROSTER) });
    expect(ids).toEqual([]);
  });

  it("returns [] for a falsy user", async () => {
    expect(await getStaffedTeamIds(null, { client: members(ROSTER) })).toEqual([]);
  });
});

describe("getMemberTeamIds", () => {
  it("returns all active teams regardless of role", async () => {
    const ids = await getMemberTeamIds(ATHLETE, { client: members(ROSTER) });
    expect(new Set(ids)).toEqual(new Set([TEAM_B, TEAM_C]));
  });
});

describe("sharesStaffedTeam", () => {
  it("is true only for the team the coach actually staffs (B), never the national team (C)", async () => {
    const { shared, teamIds } = await sharesStaffedTeam(COACH, ATHLETE, {
      client: members(ROSTER),
    });
    expect(shared).toBe(true);
    expect(teamIds).toEqual([TEAM_B]); // NOT team-c
  });

  it("a coach of a team the athlete is NOT on does not share (Frogs coach vs national athlete)", async () => {
    // OUTSIDER staffs only C; athlete is on C too → they DO share C. Flip it:
    // a coach of A only, athlete on B+C → no shared team.
    const roster = [
      { user_id: "coach-a-only", team_id: TEAM_A, role: "coach", status: "active", updated_at: "2026-06-01" },
      { user_id: ATHLETE, team_id: TEAM_B, role: "player", status: "active", updated_at: "2026-06-01" },
      { user_id: ATHLETE, team_id: TEAM_C, role: "player", status: "active", updated_at: "2026-06-01" },
    ];
    const { shared } = await sharesStaffedTeam("coach-a-only", ATHLETE, {
      client: members(roster),
    });
    expect(shared).toBe(false);
  });

  it("returns not-shared when the staff user staffs nothing", async () => {
    const { shared } = await sharesStaffedTeam(ATHLETE, COACH, {
      client: members(ROSTER),
    });
    expect(shared).toBe(false);
  });
});

describe("resolveStaffedTeam", () => {
  it("defaults to the most-recent staffed team", async () => {
    expect(await resolveStaffedTeam(COACH, null, { client: members(ROSTER) })).toBe(TEAM_B);
  });

  it("honours an explicit team the user staffs", async () => {
    expect(await resolveStaffedTeam(COACH, TEAM_A, { client: members(ROSTER) })).toBe(TEAM_A);
  });

  it("rejects (null) a requested team the user does NOT staff", async () => {
    expect(await resolveStaffedTeam(COACH, TEAM_C, { client: members(ROSTER) })).toBeNull();
  });
});

describe("isStaffOfTeam / isActiveTeamMember", () => {
  it("isStaffOfTeam true for a staffed team, false otherwise", async () => {
    expect(await isStaffOfTeam(COACH, TEAM_A, { client: members(ROSTER) })).toBe(true);
    expect(await isStaffOfTeam(COACH, TEAM_C, { client: members(ROSTER) })).toBe(false);
    expect(await isStaffOfTeam(ATHLETE, TEAM_B, { client: members(ROSTER) })).toBe(false); // player, not staff
  });

  it("isActiveTeamMember true for any active membership", async () => {
    expect(await isActiveTeamMember(ATHLETE, TEAM_C, { client: members(ROSTER) })).toBe(true);
    expect(await isActiveTeamMember(ATHLETE, TEAM_A, { client: members(ROSTER) })).toBe(false);
  });
});
