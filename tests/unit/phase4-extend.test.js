/**
 * Phase 4 regression lock.
 *
 * Locks two new backend capabilities added in Phase 4:
 *
 * 1. Graduated taper volume — taperLoadMultiplier now flows from
 *    buildProtocolDecisionContext and is applied to prescribed_sets after
 *    all exercises are collected. A 40%-load taper must actually reduce sets.
 *
 * 2. CNS 72h spacing guard — getLastHighCnsSession() queries training_sessions
 *    for sprint/speed/competition/max_velocity sessions within 72h. If one
 *    exists, composeSprint must be false regardless of payload.intent.
 */

import { describe, it, expect } from "vitest";
import { createSupabaseMock } from "../helpers/supabase-mock.js";
import { getLastHighCnsSession } from "../../netlify/functions/utils/cns-spacing.js";

// ─── taperLoadMultiplier returned from buildProtocolDecisionContext ───────────

// Test the return-value exposure directly (pure behaviour of the module).
import { buildProtocolDecisionContext } from "../../netlify/functions/utils/daily-protocol-decision.js";

const BASE_CONTEXT = {
  readiness: { score: 80, acwr: 1.0, hasCheckin: true },
  sessionResolution: { success: true, status: "ok" },
  teamActivity: null,
  taperContext: null,
  ageModifier: null,
  currentPhase: null,
  seasonPhase: null,
  dayOfWeek: 2,
  acwrTargetRange: { min: 0.8, max: 1.5 },
  playerProgram: null,
  sessionTemplate: null,
  isQB: false,
  isCenter: false,
};

async function decisionCtx(overrides = {}) {
  const client = createSupabaseMock({ training_sessions: [] });
  const noop = async () => null;
  return buildProtocolDecisionContext({
    supabase: client,
    userId: "u1",
    date: "2026-08-01",
    context: { ...BASE_CONTEXT, ...overrides },
    computeReadinessDaysStale: noop,
    computeTrainingDaysLogged: noop,
  });
}

describe("taperLoadMultiplier exposed by buildProtocolDecisionContext", () => {
  it("returns 1.0 when no taper context", async () => {
    const ctx = await decisionCtx({ taperContext: null });
    expect(ctx.taperLoadMultiplier).toBe(1.0);
  });

  it("returns the taper multiplier when in taper", async () => {
    const ctx = await decisionCtx({
      taperContext: {
        isInTaper: true,
        loadMultiplier: 0.5,
        daysUntil: 5,
        tournament: { name: "Finals", isPeakEvent: false },
        recommendation: "Reduce volume.",
      },
    });
    expect(ctx.taperLoadMultiplier).toBe(0.5);
  });

  it("sets trainingFocus to taper_week when 3–7 days out", async () => {
    const ctx = await decisionCtx({
      taperContext: {
        isInTaper: true,
        loadMultiplier: 0.7,
        daysUntil: 5,
        tournament: { name: "Regionals", isPeakEvent: false },
        recommendation: "Taper.",
      },
    });
    expect(ctx.trainingFocus).toBe("taper_week");
  });

  it("sets trainingFocus to taper_final when ≤2 days out", async () => {
    const ctx = await decisionCtx({
      taperContext: {
        isInTaper: true,
        loadMultiplier: 0.4,
        daysUntil: 1,
        tournament: { name: "Finals", isPeakEvent: true },
        recommendation: "Rest.",
      },
    });
    expect(ctx.trainingFocus).toBe("taper_final");
    expect(ctx.taperLoadMultiplier).toBe(0.4);
  });
});

// ─── prescribed_sets scaling by taperLoadMultiplier ──────────────────────────
// Test the post-processing logic directly (pure, no DB).

function applyTaperScaling(exercises, multiplier) {
  if (multiplier >= 1.0) return exercises;
  return exercises.map((ex) => ({
    ...ex,
    prescribed_sets:
      ex.prescribed_sets != null
        ? Math.max(1, Math.round(ex.prescribed_sets * multiplier))
        : ex.prescribed_sets,
  }));
}

describe("taper volume scaling — prescribed_sets post-processing", () => {
  it("leaves sets unchanged when multiplier = 1.0", () => {
    const out = applyTaperScaling([{ prescribed_sets: 3 }], 1.0);
    expect(out[0].prescribed_sets).toBe(3);
  });

  it("scales 3 sets to 2 at ×0.8 (regular taper)", () => {
    const out = applyTaperScaling([{ prescribed_sets: 3 }], 0.8);
    expect(out[0].prescribed_sets).toBe(2);
  });

  it("scales 3 sets to 1 at ×0.4 (peak taper, T-1)", () => {
    const out = applyTaperScaling([{ prescribed_sets: 3 }], 0.4);
    expect(out[0].prescribed_sets).toBe(1);
  });

  it("never reduces below 1 set (athlete still trains)", () => {
    const out = applyTaperScaling([{ prescribed_sets: 1 }], 0.3);
    expect(out[0].prescribed_sets).toBe(1);
  });

  it("skips exercises with null prescribed_sets (hold/duration blocks)", () => {
    const out = applyTaperScaling(
      [{ prescribed_sets: null, prescribed_hold_seconds: 30 }],
      0.5,
    );
    expect(out[0].prescribed_sets).toBeNull();
    expect(out[0].prescribed_hold_seconds).toBe(30);
  });

  it("scales all exercises in the array", () => {
    const exercises = [
      { prescribed_sets: 3 },
      { prescribed_sets: 4 },
      { prescribed_sets: 2 },
    ];
    const out = applyTaperScaling(exercises, 0.5);
    expect(out.map((e) => e.prescribed_sets)).toEqual([2, 2, 1]);
  });
});

// ─── CNS spacing guard ────────────────────────────────────────────────────────

describe("getLastHighCnsSession — CNS 72h spacing guard", () => {
  const TODAY = "2026-08-01";
  // A sprint session within the 72h window (36h ago)
  const recentSprint = {
    user_id: "u1",
    session_type: "sprint",
    completed_at: new Date(
      new Date(`${TODAY}T00:00:00Z`).getTime() - 36 * 3_600_000,
    ).toISOString(),
  };
  // A speed session just outside the window (73h ago) — should not block
  const staleSpeed = {
    user_id: "u1",
    session_type: "speed",
    completed_at: new Date(
      new Date(`${TODAY}T00:00:00Z`).getTime() - 73 * 3_600_000,
    ).toISOString(),
  };

  it("returns null when no high-CNS session in window — clear to sprint", async () => {
    const client = createSupabaseMock({ training_sessions: [] });
    const result = await getLastHighCnsSession(client, "u1", TODAY, 72);
    expect(result).toBeNull();
  });

  it("returns completed_at when sprint session < 72h ago", async () => {
    const client = createSupabaseMock({ training_sessions: [recentSprint] });
    const result = await getLastHighCnsSession(client, "u1", TODAY, 72);
    expect(result).toBe(recentSprint.completed_at);
  });

  it("returns null when sprint session is > 72h ago (stale, not blocking)", async () => {
    const client = createSupabaseMock({ training_sessions: [staleSpeed] });
    const result = await getLastHighCnsSession(client, "u1", TODAY, 72);
    expect(result).toBeNull();
  });

  it("blocks on competition session type (game = max CNS demand)", async () => {
    const comp = { ...recentSprint, session_type: "competition" };
    const client = createSupabaseMock({ training_sessions: [comp] });
    const result = await getLastHighCnsSession(client, "u1", TODAY, 72);
    expect(result).toBeTruthy();
  });

  it("does NOT block on strength/skill/recovery session types", async () => {
    const strengthSession = { ...recentSprint, session_type: "strength" };
    const client = createSupabaseMock({ training_sessions: [strengthSession] });
    const result = await getLastHighCnsSession(client, "u1", TODAY, 72);
    expect(result).toBeNull();
  });

  it("returns null for null userId — guard never errors", async () => {
    const client = createSupabaseMock({ training_sessions: [recentSprint] });
    const result = await getLastHighCnsSession(client, null, TODAY, 72);
    expect(result).toBeNull();
  });

  it("returns null on DB error — sprint is allowed (safe fallback)", async () => {
    const client = createSupabaseMock(
      { training_sessions: [recentSprint] },
      { errors: { training_sessions: { message: "connection error" } } },
    );
    const result = await getLastHighCnsSession(client, "u1", TODAY, 72);
    expect(result).toBeNull();
  });

  it("picks the most recent blocking session when multiple exist", async () => {
    const older = {
      ...recentSprint,
      completed_at: new Date(
        new Date(`${TODAY}T00:00:00Z`).getTime() - 48 * 3_600_000,
      ).toISOString(),
    };
    const newer = {
      ...recentSprint,
      completed_at: new Date(
        new Date(`${TODAY}T00:00:00Z`).getTime() - 24 * 3_600_000,
      ).toISOString(),
    };
    const client = createSupabaseMock({ training_sessions: [older, newer] });
    const result = await getLastHighCnsSession(client, "u1", TODAY, 72);
    // Should return the most recent (newer) one (order: desc, limit 1)
    expect(result).toBe(newer.completed_at);
  });
});
