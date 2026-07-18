import { describe, it, expect } from "vitest";
import { surfaceAdvisory } from "./surface-advisory";

describe("surfaceAdvisory", () => {
  const turfMultiGame = { surface: "turf" as const, gameCount: 4 };

  describe("stays silent unless all three conditions hold", () => {
    it("is silent when the surface is unknown (null) — no guessing", () => {
      expect(
        surfaceAdvisory({
          surface: null,
          injuryRegions: ["achilles"],
          gameCount: 4,
        }),
      ).toBeNull();
    });

    it("is silent on grass", () => {
      expect(
        surfaceAdvisory({
          surface: "grass",
          injuryRegions: ["achilles"],
          gameCount: 4,
        }),
      ).toBeNull();
    });

    it("is silent for a healthy athlete on turf — turf alone is NOT a warning", () => {
      expect(
        surfaceAdvisory({ ...turfMultiGame, injuryRegions: [] }),
      ).toBeNull();
    });

    it("is silent on a single-game turf day (no back-to-back stacking)", () => {
      expect(
        surfaceAdvisory({
          surface: "turf",
          injuryRegions: ["achilles"],
          gameCount: 1,
        }),
      ).toBeNull();
    });

    it("is silent when the flagged region is not surface-sensitive", () => {
      expect(
        surfaceAdvisory({
          ...turfMultiGame,
          injuryRegions: ["shoulder", "lower back"],
        }),
      ).toBeNull();
    });

    it("is silent for a non-finite game count", () => {
      expect(
        surfaceAdvisory({
          surface: "turf",
          injuryRegions: ["achilles"],
          gameCount: Number.NaN,
        }),
      ).toBeNull();
    });
  });

  describe("fires for a surface-sensitive restriction on a multi-game turf day", () => {
    it("fires for an Achilles restriction and names it", () => {
      const advisory = surfaceAdvisory({
        ...turfMultiGame,
        injuryRegions: ["achilles"],
      });
      expect(advisory).not.toBeNull();
      expect(advisory?.matchedRegions).toEqual(["achilles"]);
      expect(advisory?.note).toContain("achilles");
      expect(advisory?.note).toContain("4 games");
    });

    it.each([
      "achilles",
      "ankle",
      "foot",
      "heel",
      "plantar fascia",
      "calf",
      "shin",
      "knee",
      "patellar tendon",
    ])("fires for a %s restriction", (region) => {
      expect(
        surfaceAdvisory({ ...turfMultiGame, injuryRegions: [region] }),
      ).not.toBeNull();
    });

    it("matches free-text clinical regions case-insensitively", () => {
      const advisory = surfaceAdvisory({
        ...turfMultiGame,
        injuryRegions: ["Left Achilles tendinopathy"],
      });
      expect(advisory?.matchedRegions).toEqual(["Left Achilles tendinopathy"]);
    });

    it("keeps only the surface-sensitive regions when others are also flagged", () => {
      const advisory = surfaceAdvisory({
        ...turfMultiGame,
        injuryRegions: ["shoulder", "achilles", "lower back", "ankle"],
      });
      expect(advisory?.matchedRegions).toEqual(["achilles", "ankle"]);
      expect(advisory?.note).toContain("achilles and ankle");
      expect(advisory?.note).not.toContain("shoulder");
    });

    it("joins three regions readably", () => {
      const advisory = surfaceAdvisory({
        ...turfMultiGame,
        injuryRegions: ["achilles", "ankle", "knee"],
      });
      expect(advisory?.note).toContain("achilles, ankle and knee");
    });

    it("ignores blank/whitespace region entries", () => {
      const advisory = surfaceAdvisory({
        ...turfMultiGame,
        injuryRegions: ["", "   ", "achilles"],
      });
      expect(advisory?.matchedRegions).toEqual(["achilles"]);
    });

    it("fires from two games up", () => {
      expect(
        surfaceAdvisory({
          surface: "turf",
          injuryRegions: ["ankle"],
          gameCount: 2,
        }),
      ).not.toBeNull();
    });
  });

  describe("advisory framing stays inside the evidence", () => {
    const advisory = surfaceAdvisory({
      ...turfMultiGame,
      injuryRegions: ["achilles"],
    });

    it("tells the athlete to warm up and monitor, and gives a stop rule", () => {
      expect(advisory?.note).toMatch(/warm-up/i);
      expect(advisory?.note).toMatch(/between games/i);
      expect(advisory?.note).toMatch(/pain/i);
    });

    it("does not claim turf is broadly more dangerous", () => {
      const note = advisory?.note ?? "";
      expect(note).not.toMatch(/dangerous|higher injury rate|more injuries/i);
      // The honest claim is a modest, region-specific difference.
      expect(note).toMatch(/a little harder/i);
    });

    it("never tells the athlete not to play (that is not its call)", () => {
      expect(advisory?.note).not.toMatch(/don't play|do not play|sit out/i);
    });
  });
});
