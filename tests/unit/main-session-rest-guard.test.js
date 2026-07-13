import { describe, it, expect } from "vitest";
import { generateMainSessionFallback } from "../../netlify/functions/utils/daily-protocol-main-session.js";

/**
 * 2026-07-13 — a "Rest day" protocol was generated WITH a sprint Main Session
 * (10-Yard Burst + Resisted Sprint + Hill Sprint under a "Rest + daily mobility"
 * hero) because a stray `isSprintSession=true` reached the sprint branch, which was
 * not gated by isLowLoadFocus. The day type is now the single authority: a low-load
 * focus returns NO main session at the top, before any branch — locked here.
 */

// A supabase that explodes if touched — proves the guard returns before any query.
const throwingSupabase = {
  from() {
    throw new Error("supabase must not be queried on a low-load day");
  },
};

const LOW_LOAD = ["rest", "recovery", "mobility", "travel", "competition"];

describe("main session — low-load days never get a training main session", () => {
  for (const focus of LOW_LOAD) {
    it(`${focus}: no main session even when isSprintSession is (wrongly) true`, async () => {
      const protocolExercises = [];
      const res = await generateMainSessionFallback({
        supabase: throwingSupabase,
        protocolExercises,
        context: {},
        trainingFocus: focus,
        hasGymAccess: true,
        hasFieldAccess: true,
        isSprintSession: true, // the stray flag that caused the bug
        isGymTrainingDay: true,
        periodizationPhase: "mid_season_reload",
        acwrForLogic: 1.0,
      });
      expect(res.mainSessionGenerated).toBe(false);
      expect(res.sessionCategory).toBe("recovery");
      expect(protocolExercises).toHaveLength(0); // no sprint block bolted on
    });
  }
});
