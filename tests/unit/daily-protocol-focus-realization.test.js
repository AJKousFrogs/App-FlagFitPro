import { describe, it, expect } from "vitest";
import {
  gymBlockPlanFor,
  GYM_BLOCK_PLANS,
  templateMatchesFocus,
} from "../../netlify/functions/utils/daily-protocol-compose.js";
import { findWarmupMatch } from "../../netlify/functions/utils/daily-protocol-blocks.js";
import { transformProtocolResponse } from "../../netlify/functions/utils/daily-protocol-response.js";

// ─────────────────────────────────────────────────────────────────────────────
// 2026-07-14 production bug report (screenshots): a "Strength session" hero
// rendered agility mains + field conditioning + WR stations; the 16-item gym
// warm-up was decimated to 3 sprint-prep leftovers; 17 working strength sets
// displayed as "~10 min". These tests lock the fixes.
// ─────────────────────────────────────────────────────────────────────────────

describe("gymBlockPlanFor — the intent owns the gym-day block shape", () => {
  it("a strength day is strength-led: NO conditioning, NO skill stations, NO plyo block", () => {
    const plan = gymBlockPlanFor("strength");
    expect(plan.strength).toBe(true);
    expect(plan.generalStrengthCount).toBeGreaterThanOrEqual(3);
    expect(plan.conditioning).toBe(false);
    expect(plan.skills).toBe(false);
    expect(plan.plyometrics).toBe(false);
  });

  it("every gym day keeps the DOP / injury-prevention isometrics block", () => {
    for (const focus of Object.keys(GYM_BLOCK_PLANS)) {
      expect(gymBlockPlanFor(focus).isometrics).toBe(true);
    }
  });

  it("a mixed day (focus 'conditioning') = strength + conditioning, per the coaching model", () => {
    const plan = gymBlockPlanFor("conditioning");
    expect(plan.strength).toBe(true);
    expect(plan.conditioning).toBe(true);
    expect(plan.plyometrics).toBe(true);
    expect(plan.skills).toBe(false);
    // Reduced strength complement vs a pure strength day
    expect(plan.generalStrengthCount).toBeLessThan(
      gymBlockPlanFor("strength").generalStrengthCount,
    );
  });

  it("a technical day (focus 'skill') is skills-led: no strength/conditioning blocks", () => {
    const plan = gymBlockPlanFor("skill");
    expect(plan.skills).toBe(true);
    expect(plan.skillsCount).toBeGreaterThanOrEqual(4);
    expect(plan.strength).toBe(false);
    expect(plan.conditioning).toBe(false);
  });

  it("unknown focus falls back to the strength shape (mapIntentToSession default)", () => {
    expect(gymBlockPlanFor("whatever")).toEqual(GYM_BLOCK_PLANS.strength);
    expect(gymBlockPlanFor(null)).toEqual(GYM_BLOCK_PLANS.strength);
  });
});

describe("templateMatchesFocus — a DOW template can't hijack a mismatched day", () => {
  it("the reported bug: an agility template must NOT run on a strength day", () => {
    expect(templateMatchesFocus("agility", "strength", false)).toBe(false);
  });
  it("a strength/power template runs on a strength day", () => {
    expect(templateMatchesFocus("strength", "strength", false)).toBe(true);
    expect(templateMatchesFocus("power", "strength", false)).toBe(true);
  });
  it("a speed template runs only on a sprint day", () => {
    expect(templateMatchesFocus("speed", "strength", true)).toBe(true);
    expect(templateMatchesFocus("speed", "strength", false)).toBe(false);
  });
  it("skill/agility templates belong to technical days", () => {
    expect(templateMatchesFocus("agility", "skill", false)).toBe(true);
    expect(templateMatchesFocus("route_running", "skill", false)).toBe(true);
  });
  it("a template without a session_type can't prove relevance → no match", () => {
    expect(templateMatchesFocus(null, "strength", false)).toBe(false);
    expect(templateMatchesFocus("", "skill", false)).toBe(false);
  });
});

describe("findWarmupMatch — whole-word, most-specific match", () => {
  const rows = [
    {
      id: "1",
      name: "Low Pogo + Ankling Prep Ladder",
      slug: "low-pogo-ankling-prep-ladder",
    },
    { id: "2", name: "Pogo Hops (Warm-Up, Low)", slug: "pogo-hops-warmup-low" },
    {
      id: "3",
      name: "Walking Spiderman with Rotation",
      slug: "walking-spiderman-with-rotation",
    },
    {
      id: "4",
      name: "Toy Soldier / Straight-Leg March",
      slug: "toy-soldier-straight-leg-march",
    },
  ];

  it("prefers the most specific (shortest) matching row: Pogo Hops over the prep ladder", () => {
    expect(findWarmupMatch(rows, ["pogo", "ankle hop"]).id).toBe("2");
  });

  it("multi-word keywords require every word: 'toy soldier' matches only the toy-soldier row", () => {
    expect(findWarmupMatch(rows, ["toy soldier"]).id).toBe("4");
  });

  it("no match → null (the item persists under its own name instead of being renamed)", () => {
    expect(findWarmupMatch(rows, ["jump rope"])).toBeNull();
    expect(findWarmupMatch([], ["pogo"])).toBeNull();
  });
});

describe("block duration estimate — includes rest, honest at last", () => {
  const protocol = { id: "p1" };

  const pe = (blockType, overrides = {}) => ({
    id: `${blockType}-${Math.random()}`,
    block_type: blockType,
    sequence_order: 1,
    status: "pending",
    exercise_name: "X",
    exercises: null,
    ...overrides,
  });

  const BLOCK_KEYS = {
    warm_up: "warmUp",
    isometrics: "isometrics",
    strength: "strength",
    conditioning: "conditioning",
  };
  const blockFor = (result, type) => result[BLOCK_KEYS[type]];

  it("17 working strength sets are NOT '~10 min' anymore", () => {
    // The reported day: Nordic 2×8, 2× hip 3×10, push-up/row/bird-dog 3×8,
    // rest 60-90s — the old estimator said 10 min.
    const exercises = [
      pe("strength", {
        prescribed_sets: 2,
        prescribed_reps: 8,
        rest_seconds: 90,
      }),
      pe("strength", {
        prescribed_sets: 3,
        prescribed_reps: 10,
        rest_seconds: 60,
      }),
      pe("strength", {
        prescribed_sets: 3,
        prescribed_reps: 10,
        rest_seconds: 60,
      }),
      pe("strength", {
        prescribed_sets: 3,
        prescribed_reps: 8,
        rest_seconds: 90,
      }),
      pe("strength", {
        prescribed_sets: 3,
        prescribed_reps: 8,
        rest_seconds: 90,
      }),
      pe("strength", {
        prescribed_sets: 3,
        prescribed_reps: 8,
        rest_seconds: 90,
      }),
    ];
    const result = transformProtocolResponse(
      protocol,
      exercises,
      null,
      null,
      null,
      {
        blockTypes: {},
      },
    );
    const minutes = blockFor(result, "strength").estimatedDurationMinutes;
    expect(minutes).toBeGreaterThanOrEqual(25);
    expect(minutes).toBeLessThanOrEqual(45);
  });

  it("5 isometric exercises with 6s holds estimate ~10-15 min, not 2", () => {
    const exercises = Array.from({ length: 5 }, () =>
      pe("isometrics", {
        prescribed_sets: 3,
        prescribed_hold_seconds: 6,
        rest_seconds: 45,
      }),
    );
    const result = transformProtocolResponse(
      protocol,
      exercises,
      null,
      null,
      null,
      {
        blockTypes: {},
      },
    );
    const minutes = blockFor(result, "isometrics").estimatedDurationMinutes;
    expect(minutes).toBeGreaterThanOrEqual(10);
  });

  it("missing rest_seconds falls back to a per-block default, never zero", () => {
    const exercises = [
      pe("strength", {
        prescribed_sets: 3,
        prescribed_reps: 8,
        rest_seconds: null,
      }),
    ];
    const result = transformProtocolResponse(
      protocol,
      exercises,
      null,
      null,
      null,
      {
        blockTypes: {},
      },
    );
    // 3 × (32s work + 90s default rest) ≈ 6 min — the old math said 2 min.
    expect(
      blockFor(result, "strength").estimatedDurationMinutes,
    ).toBeGreaterThanOrEqual(5);
  });

  it("warm-up stays continuous: item durations sum as totals, no rest inflation", () => {
    // The 25-min template: durations are item TOTALS (sets already baked in).
    const exercises = [
      pe("warm_up", { prescribed_sets: 1, prescribed_duration_seconds: 180 }),
      pe("warm_up", {
        prescribed_sets: 2,
        prescribed_reps: 8,
        prescribed_duration_seconds: 90,
      }),
      pe("warm_up", {
        prescribed_sets: 2,
        prescribed_reps: 20,
        prescribed_duration_seconds: 60,
      }),
    ];
    const result = transformProtocolResponse(
      protocol,
      exercises,
      null,
      null,
      null,
      {
        blockTypes: {},
      },
    );
    // 180 + 90 + 60 = 330s ≈ 6 min (NOT sets-multiplied, NOT rest-padded)
    expect(blockFor(result, "warm_up").estimatedDurationMinutes).toBe(6);
  });

  it("unmatched warm-up items (null exercise_id) keep their intended name", () => {
    const exercises = [
      pe("warm_up", {
        exercise_id: null,
        exercise_name: "Jump Rope",
        prescribed_duration_seconds: 180,
      }),
    ];
    const result = transformProtocolResponse(
      protocol,
      exercises,
      null,
      null,
      null,
      {
        blockTypes: {},
      },
    );
    const item = blockFor(result, "warm_up").exercises[0];
    expect(item.exercise.name).toBe("Jump Rope");
  });
});
