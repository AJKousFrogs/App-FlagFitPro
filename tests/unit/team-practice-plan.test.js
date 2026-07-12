import { describe, it, expect } from "vitest";
import {
  buildPracticePlan,
  resolvePlanKey,
  ROLE,
} from "../../netlify/functions/utils/team-practice-plan.js";

/**
 * Team-practice periodization (docs/ground-truth/team-practice-periodization.md).
 * The plan is a REALIZATION of the intent engine's `framing`. These lock the one
 * property the file exists to guarantee: full-speed 5v5 appears only — capped and
 * purposeful — as competition nears, and never on a recovery day.
 */

const ratio = (plan) => plan.scrimmageMinutes / plan.totalMinutes; // scrimmage share of the practice

describe("resolvePlanKey: framing + taper proximity → plan shape", () => {
  it("own framing → build practice", () => {
    expect(resolvePlanKey("own", "accumulation", null)).toBe("own");
  });
  it("sharp framing, far out → sharpening", () => {
    expect(resolvePlanKey("sharp", "taper", 5)).toBe("sharp");
  });
  it("sharp framing inside the final 48h → walkthrough", () => {
    expect(resolvePlanKey("sharp", "taper", 2)).toBe("walkthrough");
    expect(resolvePlanKey("sharp", "taper", 1)).toBe("walkthrough");
  });
  it("recovery framing → recovery", () => {
    expect(resolvePlanKey("recovery", "recovery", null)).toBe("recovery");
  });
});

describe("build phase (own): drills dominate, scrimmage is the smallest slice", () => {
  const plan = buildPracticePlan({ framing: "own", minutes: 90 });

  it("drill minutes exceed scrimmage minutes", () => {
    expect(plan.drillMinutes).toBeGreaterThan(plan.scrimmageMinutes);
  });

  it("the team/5v5 block is smaller than each isolated position block", () => {
    const team = plan.blocks.find((b) => b.role === ROLE.TEAM);
    const indy = plan.blocks.filter((b) => b.role === ROLE.INDY);
    expect(indy.length).toBeGreaterThan(0);
    for (const block of indy) {
      expect(team.minutes).toBeLessThan(block.minutes);
    }
  });

  it("whole-team position blocks are not restricted to a position group", () => {
    const wr = plan.blocks.find((b) => b.key === "wr_block");
    expect(wr.positions).toBeNull();
  });

  it("specialty blocks carry their position group", () => {
    const qb = plan.blocks.find((b) => b.key === "qb_center_post");
    expect(qb.positions).toEqual(["quarterback", "center"]);
  });
});

describe("scrimmage grows as competition nears", () => {
  it("sharp practice has a larger scrimmage share than a build practice", () => {
    const own = buildPracticePlan({ framing: "own", minutes: 90 });
    const sharp = buildPracticePlan({
      framing: "sharp",
      phase: "taper",
      daysOut: 5,
      minutes: 60,
    });
    expect(ratio(sharp)).toBeGreaterThan(ratio(own));
  });
});

describe("final 48h walkthrough: no max-CNS, no isolated drilling", () => {
  const plan = buildPracticePlan({
    framing: "sharp",
    phase: "taper",
    daysOut: 1,
    minutes: 45,
  });

  it("carries zero high-CNS minutes", () => {
    expect(plan.highCnsMinutes).toBe(0);
  });
  it("has no isolated WR/DB drilling blocks", () => {
    expect(plan.blocks.some((b) => b.key === "wr_block")).toBe(false);
    expect(plan.blocks.some((b) => b.key === "db_block")).toBe(false);
  });
});

describe("recovery practice: no scrimmage, no max sprint", () => {
  const plan = buildPracticePlan({ framing: "recovery", minutes: 30 });
  it("has zero scrimmage minutes", () => {
    expect(plan.scrimmageMinutes).toBe(0);
  });
  it("carries zero high-CNS minutes", () => {
    expect(plan.highCnsMinutes).toBe(0);
  });
});

describe("minute distribution is exact and positive", () => {
  for (const minutes of [90, 60, 45, 30, 73, 120]) {
    it(`blocks sum to the requested ${minutes} min`, () => {
      const plan = buildPracticePlan({ framing: "own", minutes });
      expect(plan.totalMinutes).toBe(minutes);
      for (const block of plan.blocks) expect(block.minutes).toBeGreaterThan(0);
    });
  }
});

describe("season flavour of the warm-up", () => {
  it("off-season warm-up pulls in competitive conditioning games", () => {
    const plan = buildPracticePlan({
      framing: "own",
      seasonPhase: "accumulation",
    });
    const warmup = plan.blocks.find((b) => b.key === "team_warmup");
    expect(warmup.subcategories).toContain("conditioning_game");
  });
  it("in-season warm-up stays crisp (activation only)", () => {
    const plan = buildPracticePlan({
      framing: "sharp",
      phase: "taper",
      daysOut: 5,
      seasonPhase: "competition",
    });
    const warmup = plan.blocks.find((b) => b.key === "team_warmup");
    expect(warmup.subcategories).not.toContain("conditioning_game");
  });
});
