import { describe, it, expect } from "vitest";
import {
  estimateGameLoads,
  travelReadinessPenalty,
} from "../../netlify/functions/calc-readiness.js";

// Per-game load injection makes a tournament show up in ACWR instead of reading
// falsely safe. Pure estimator — these lock the distribution + window logic.
const PER = 350; // matches ESTIMATED_GAME_LOAD_AU

describe("estimateGameLoads — past games contribute to the ACWR load map", () => {
  it("a single-day 3-game round adds 3× the per-game load on that day", () => {
    const m = estimateGameLoads(
      [{ starts_at: "2026-05-10T09:00:00Z", ends_at: null, expected_game_count: 3 }],
      "2026-05-01",
      "2026-05-28",
    );
    expect(m.get("2026-05-10")).toBeCloseTo(3 * PER, 0);
  });

  it("spreads a multi-day tournament's total game load across its days", () => {
    const m = estimateGameLoads(
      [{ starts_at: "2026-05-10T09:00:00Z", ends_at: "2026-05-11T18:00:00Z", expected_game_count: 8 }],
      "2026-05-01",
      "2026-05-28",
    );
    // 8 games × 350 over 2 days = 1400/day
    expect(m.get("2026-05-10")).toBeCloseTo(1400, 0);
    expect(m.get("2026-05-11")).toBeCloseTo(1400, 0);
  });

  it("ignores non-game events (no / zero expected_game_count)", () => {
    const m = estimateGameLoads(
      [
        { starts_at: "2026-05-10T09:00:00Z", expected_game_count: 0 },
        { starts_at: "2026-05-11T09:00:00Z", expected_game_count: null },
      ],
      "2026-05-01",
      "2026-05-28",
    );
    expect(m.size).toBe(0);
  });

  it("clips event days to the load window", () => {
    const m = estimateGameLoads(
      [{ starts_at: "2026-04-28T09:00:00Z", ends_at: "2026-05-02T18:00:00Z", expected_game_count: 5 }],
      "2026-05-01", // window starts mid-event
      "2026-05-28",
    );
    expect(m.has("2026-04-28")).toBe(false); // before window — excluded
    expect(m.has("2026-05-01")).toBe(true);
    expect(m.has("2026-05-02")).toBe(true);
  });
});

describe("travelReadinessPenalty — bounded, subtract-only", () => {
  it("scales with hours and is bounded", () => {
    expect(travelReadinessPenalty(0)).toBe(0);
    expect(travelReadinessPenalty(null)).toBe(0);
    expect(travelReadinessPenalty(-3)).toBe(0);
    expect(travelReadinessPenalty(2)).toBe(2);
    expect(travelReadinessPenalty(4)).toBe(4);
    expect(travelReadinessPenalty(8)).toBe(8);
    expect(travelReadinessPenalty(100)).toBe(8); // capped
  });
});
