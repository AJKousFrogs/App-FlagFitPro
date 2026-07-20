import { describe, it, expect } from "vitest";
import {
  WAY_FACTOR,
  benchFactor,
  surfaceFactor,
  competitionLoadFactor,
  effectiveGameMinutes,
} from "./competition-load.util";

describe("competition-load.util", () => {
  describe("way factor", () => {
    it("both-ways is the 1.0 baseline; one-way is lighter", () => {
      expect(WAY_FACTOR.both_ways).toBe(1);
      expect(WAY_FACTOR.one_way).toBeCloseTo(2 / 3, 10);
    });
    it("both-ways carries ~1.5x the one-way load (owner-set ratio)", () => {
      expect(
        competitionLoadFactor("both_ways", 10, null) /
          competitionLoadFactor("one_way", 10, null),
      ).toBeCloseTo(1.5, 10);
    });
  });

  describe("bench factor", () => {
    it("a full rotation (>=7 available) is neutral", () => {
      expect(benchFactor(7)).toBe(1);
      expect(benchFactor(10)).toBe(1);
    });
    it("scales up +0.1 per player below 7", () => {
      expect(benchFactor(6)).toBeCloseTo(1.1, 10);
      expect(benchFactor(5)).toBeCloseTo(1.2, 10);
    });
    it("caps at +0.3 for a bare squad", () => {
      expect(benchFactor(4)).toBeCloseTo(1.3, 10);
      expect(benchFactor(1)).toBeCloseTo(1.3, 10);
    });
    it("unknown/invalid player count is neutral (never fabricated)", () => {
      expect(benchFactor(null)).toBe(1);
      expect(benchFactor(undefined)).toBe(1);
      expect(benchFactor(Number.NaN)).toBe(1);
    });
  });

  describe("surface factor", () => {
    it("turf adds 15%; grass/unknown are neutral", () => {
      expect(surfaceFactor("turf")).toBeCloseTo(1.15, 10);
      expect(surfaceFactor("grass")).toBe(1);
      expect(surfaceFactor(null)).toBe(1);
    });
  });

  describe("effectiveGameMinutes (the ACWR feed)", () => {
    it("both-ways, full squad, grass = raw game-clock minutes (no change vs prior behaviour)", () => {
      expect(effectiveGameMinutes(3, 40, "both_ways", 10, "grass")).toBe(120);
    });
    it("one-way lowers the load below raw minutes", () => {
      expect(effectiveGameMinutes(3, 40, "one_way", 10, "grass")).toBe(80);
    });
    it("short bench and turf stack multiplicatively", () => {
      // 120 * 1.0(both) * 1.2(bench@5) * 1.15(turf) = 165.6 -> 166
      expect(effectiveGameMinutes(3, 40, "both_ways", 5, "turf")).toBe(166);
    });
    it("is never negative and zero games -> zero", () => {
      expect(effectiveGameMinutes(0, 40, "both_ways", 5, "turf")).toBe(0);
      expect(effectiveGameMinutes(-2, 40, "both_ways", 10, null)).toBe(0);
    });
  });
});
