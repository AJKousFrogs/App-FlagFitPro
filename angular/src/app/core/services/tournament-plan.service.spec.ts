/**
 * Tournament Mode gap-classification engine — regression tests.
 *
 * Anchored on the real Capital Bowl day-1 schedule that motivated V2.0:
 * games at 11:00 / 12:30 / 15:30 / 17:00. `buildTournamentDayPlan` is pure —
 * same inputs always yield the same plan.
 */

import { describe, it, expect } from "vitest";
import {
  classifyGap,
  computeGaps,
  buildTournamentDayPlan,
} from "./tournament-plan.service";
import { EventGame } from "../models/tournament-plan.models";

function game(overrides: Partial<EventGame> = {}): EventGame {
  return {
    id: "g-1",
    competitionEventId: "ev-1",
    teamId: "t-1",
    gameNumber: 1,
    gameDate: "2026-07-04",
    kickoffTime: "11:00:00",
    expectedDurationMinutes: 40,
    opponent: null,
    field: null,
    bracketStage: null,
    isProvisional: false,
    status: "scheduled",
    result: null,
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
    ...overrides,
  };
}

const CAPITAL_BOWL_DAY1: EventGame[] = [
  game({ id: "g1", gameNumber: 1, kickoffTime: "11:00:00" }),
  game({ id: "g2", gameNumber: 2, kickoffTime: "12:30:00" }),
  game({ id: "g3", gameNumber: 3, kickoffTime: "15:30:00" }),
  game({ id: "g4", gameNumber: 4, kickoffTime: "17:00:00" }),
];

describe("classifyGap", () => {
  it("classifies < 30 min as turnaround", () => {
    expect(classifyGap(15)).toBe("turnaround");
    expect(classifyGap(29)).toBe("turnaround");
  });
  it("classifies 30–75 min as short", () => {
    expect(classifyGap(30)).toBe("short");
    expect(classifyGap(50)).toBe("short");
    expect(classifyGap(74)).toBe("short");
  });
  it("classifies 75–150 min as medium", () => {
    expect(classifyGap(75)).toBe("medium");
    expect(classifyGap(140)).toBe("medium");
  });
  it("classifies > 150 min as long", () => {
    expect(classifyGap(151)).toBe("long");
    expect(classifyGap(300)).toBe("long");
  });
});

describe("computeGaps — Capital Bowl day 1 (11:00/12:30/15:30/17:00, 40min games)", () => {
  const gaps = computeGaps(CAPITAL_BOWL_DAY1);

  it("produces 3 gaps for 4 games", () => {
    expect(gaps).toHaveLength(3);
  });

  it("gap after game 1 (ends 11:40 → kickoff 12:30 = 50min) is short", () => {
    expect(gaps[0].gapMinutes).toBe(50);
    expect(gaps[0].gapClass).toBe("short");
  });

  it("gap after game 2 (ends 13:10 → kickoff 15:30 = 140min) is medium", () => {
    expect(gaps[1].gapMinutes).toBe(140);
    expect(gaps[1].gapClass).toBe("medium");
  });

  it("gap after game 3 (ends 16:10 → kickoff 17:00 = 50min) is short", () => {
    expect(gaps[2].gapMinutes).toBe(50);
    expect(gaps[2].gapClass).toBe("short");
  });

  it("ignores cancelled games when computing gaps", () => {
    const withCancelled = [
      ...CAPITAL_BOWL_DAY1,
      game({ id: "g5", gameNumber: 5, kickoffTime: "18:00:00", status: "cancelled" }),
    ];
    expect(computeGaps(withCancelled)).toHaveLength(3);
  });

  it("sorts by kickoff time regardless of input order", () => {
    const shuffled = [CAPITAL_BOWL_DAY1[2], CAPITAL_BOWL_DAY1[0], CAPITAL_BOWL_DAY1[3], CAPITAL_BOWL_DAY1[1]];
    const g = computeGaps(shuffled);
    expect(g.map((x) => x.beforeGame.gameNumber)).toEqual([2, 3, 4]);
  });
});

describe("buildTournamentDayPlan — Capital Bowl day 1", () => {
  const plan = buildTournamentDayPlan(CAPITAL_BOWL_DAY1, 80, 22);

  it("includes one game block per kickoff, in order", () => {
    const gameBlocks = plan.blocks.filter((b) => b.kind === "game");
    expect(gameBlocks).toHaveLength(4);
    expect(gameBlocks.map((b) => b.time)).toEqual(["11:00", "12:30", "15:30", "17:00"]);
  });

  it("gives a full warm-up before game 1", () => {
    const firstWarmup = plan.blocks.find((b) => b.kind === "warmup");
    expect(firstWarmup?.label).toBe("Full warm-up");
    expect(firstWarmup?.gameNumber).toBe(1);
    expect(firstWarmup?.time).toBe("10:20"); // 40min lead before 11:00
  });

  it("gives a re-prime (short-gap) warm-up before game 2, not a full warm-up", () => {
    const warmups = plan.blocks.filter((b) => b.kind === "warmup");
    const beforeGame2 = warmups.find((b) => b.gameNumber === 2);
    expect(beforeGame2?.label).toBe("Re-prime warm-up");
  });

  it("gives a re-warm-up (medium-gap protocol) before game 3 (the 140min gap)", () => {
    // 140 min falls in the medium band (75–150) — not quite long enough for the
    // near-full protocol, but well past a short re-prime.
    const warmups = plan.blocks.filter((b) => b.kind === "warmup");
    const beforeGame3 = warmups.find((b) => b.gameNumber === 3);
    expect(beforeGame3?.label).toBe("Re-warm-up");
    expect(beforeGame3?.minutesDuration).toBe(11);
  });

  it("gives a re-prime warm-up before game 4 (the second 50min gap)", () => {
    const warmups = plan.blocks.filter((b) => b.kind === "warmup");
    const beforeGame4 = warmups.find((b) => b.gameNumber === 4);
    expect(beforeGame4?.label).toBe("Re-prime warm-up");
  });

  it("surfaces the late-game hamstring warning on the last game and its lead-in warm-up", () => {
    const gameBlocks = plan.blocks.filter((b) => b.kind === "game");
    const lastGameBlock = gameBlocks[gameBlocks.length - 1];
    expect(lastGameBlock.warning).toMatch(/hamstring/i);
    const warmups = plan.blocks.filter((b) => b.kind === "warmup");
    const beforeGame4 = warmups.find((b) => b.gameNumber === 4);
    expect(beforeGame4?.warning).toMatch(/hamstring/i);
  });

  it("scales fueling grams to bodyweight (short-gap fuel after game 1)", () => {
    const fuelBlocks = plan.blocks.filter((b) => b.kind === "fuel");
    expect(fuelBlocks[0].detail).toMatch(/32g fast carbs/); // 0.4 * 80kg
  });

  it("adds a heat modifier note when the day is hot (apparent ≥ 28°C)", () => {
    const hotPlan = buildTournamentDayPlan(CAPITAL_BOWL_DAY1, 80, 30);
    expect(hotPlan.heatAdjusted).toBe(true);
    const fuelBlocks = hotPlan.blocks.filter((b) => b.kind === "fuel");
    expect(fuelBlocks.some((b) => /extra fluid/.test(b.detail))).toBe(true);
  });

  it("does not add the heat modifier on a mild day", () => {
    expect(plan.heatAdjusted).toBe(false);
  });

  it("ends with a recovery block after the last game", () => {
    const last = plan.blocks[plan.blocks.length - 1];
    expect(last.kind).toBe("recovery");
    expect(last.time).toBe("17:55"); // 17:00 + 40min game + 15min
  });

  it("returns an empty plan (no blocks) when there are no games", () => {
    const empty = buildTournamentDayPlan([], 80, null);
    expect(empty.blocks).toHaveLength(0);
    expect(empty.gaps).toHaveLength(0);
  });

  it("a single-game day still gets a full pre-game warm-up and post-game recovery, no gap blocks", () => {
    const single = buildTournamentDayPlan([CAPITAL_BOWL_DAY1[0]], 80, null);
    expect(single.blocks.filter((b) => b.kind === "warmup")).toHaveLength(1);
    expect(single.blocks.filter((b) => b.kind === "fuel")).toHaveLength(0);
    expect(single.blocks.filter((b) => b.kind === "recovery")).toHaveLength(1);
  });

  it("marks a provisional (bracket-dependent) game's detail accordingly", () => {
    const withProvisional = [
      ...CAPITAL_BOWL_DAY1.slice(0, 2),
      game({ id: "g3", gameNumber: 3, kickoffTime: "15:30:00", isProvisional: true }),
    ];
    const p = buildTournamentDayPlan(withProvisional, 80, null);
    const g3 = p.blocks.find((b) => b.kind === "game" && b.gameNumber === 3);
    expect(g3?.detail).toMatch(/provisional/i);
  });
});
