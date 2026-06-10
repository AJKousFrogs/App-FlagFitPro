import { describe, it, expect } from "vitest";
import {
  estimateGameLoads,
  travelReadinessPenalty,
} from "../../netlify/functions/calc-readiness.js";

// Per-game load injection makes a tournament show up in ACWR instead of reading
// falsely safe. Per-game AU scales with FORMAT/level (mirror of GAME_FORMATS):
//   domestic_2x12_stop 300 · running_2x15 350 · ifaf_2x20 450 · unknown→450.
const IFAF = 450; // unknown level defaults to the heaviest (conservative)
const DOMESTIC = 300;

describe("estimateGameLoads — format/level-aware, past games into the ACWR map", () => {
  it("unknown-format single-day 3-game round defaults to the heaviest per-game AU", () => {
    const m = estimateGameLoads(
      [{ starts_at: "2026-05-10T09:00:00Z", ends_at: null, expected_game_count: 3 }],
      "2026-05-01",
      "2026-05-28",
    );
    expect(m.get("2026-05-10")).toBeCloseTo(3 * IFAF, 0);
  });

  it("scales DOWN for a national (domestic) competition level", () => {
    const m = estimateGameLoads(
      [{ starts_at: "2026-05-10T09:00:00Z", expected_game_count: 4, competition_level: "national" }],
      "2026-05-01",
      "2026-05-28",
    );
    expect(m.get("2026-05-10")).toBeCloseTo(4 * DOMESTIC, 0);
  });

  it("an explicit game_format wins over level", () => {
    const m = estimateGameLoads(
      [{ starts_at: "2026-05-10T09:00:00Z", expected_game_count: 2, game_format: "running_2x15", competition_level: "national" }],
      "2026-05-01",
      "2026-05-28",
    );
    expect(m.get("2026-05-10")).toBeCloseTo(2 * 350, 0);
  });

  it("spreads an international multi-day tournament's total load across its days", () => {
    const m = estimateGameLoads(
      [{ starts_at: "2026-05-10T09:00:00Z", ends_at: "2026-05-11T18:00:00Z", expected_game_count: 8, competition_level: "international" }],
      "2026-05-01",
      "2026-05-28",
    );
    // 8 games × 450 (IFAF) over 2 days = 1800/day
    expect(m.get("2026-05-10")).toBeCloseTo(1800, 0);
    expect(m.get("2026-05-11")).toBeCloseTo(1800, 0);
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
