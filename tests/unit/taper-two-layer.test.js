import { describe, it, expect } from "vitest";
import {
  resolveTaperTargets,
  taperLevelFor,
  EMBEDDED_TAPER_RULES,
} from "../../angular/src/app/core/services/periodization-engine.ts";

/**
 * Phase 4b — the two-layer taper model. The engine runs the taper on a
 * MATERIALIZED ruleset (embedded default, or a live/override ruleset hydrated by
 * the server into the same shape) — never on raw DB rows. These lock:
 *  - the level map (7-value CompetitionLevel → 5 curated tournament levels),
 *  - the embedded snapshot's exact values (drift guard for the constant),
 *  - the resolver: sprint velocity always kept, intensity ≥ retention, volume
 *    cut by the level's floor with a deeper final-third, reps floored at 2.
 * The live table (taper_rules) is the curated source; EMBEDDED_TAPER_RULES
 * mirrors it and the seeded `version` keeps them in lock-step.
 */

describe("taperLevelFor — 7-value CompetitionLevel → curated 5-level vocab", () => {
  const cases = {
    club: "local",
    regional: "regional",
    national: "national",
    international: "international",
    continental: "international",
    world: "world",
    olympic: "world",
  };
  for (const [level, expected] of Object.entries(cases)) {
    it(`${level} → ${expected}`, () => {
      expect(taperLevelFor(level)).toBe(expected);
    });
  }
  it("null / undefined / unknown → national (safe middle default)", () => {
    expect(taperLevelFor(null)).toBe("national");
    expect(taperLevelFor(undefined)).toBe("national");
    expect(taperLevelFor("made-up")).toBe("national");
  });
});

describe("EMBEDDED_TAPER_RULES — mirrors the curated taper_rules table", () => {
  it("carries a version + embedded provenance", () => {
    expect(EMBEDDED_TAPER_RULES.version).toBe("v1-2026-07-13");
    expect(EMBEDDED_TAPER_RULES.source).toBe("embedded");
  });
  it("matches the curated values row-for-row (locks the constant against drift)", () => {
    expect(EMBEDDED_TAPER_RULES.byLevel).toEqual({
      local: { volumeFloorPct: 0.7, intensityRetention: 0.9, taperDays: 3 },
      regional: { volumeFloorPct: 0.6, intensityRetention: 0.95, taperDays: 5 },
      national: { volumeFloorPct: 0.55, intensityRetention: 0.95, taperDays: 7 },
      international: {
        volumeFloorPct: 0.5,
        intensityRetention: 1.0,
        taperDays: 10,
      },
      world: { volumeFloorPct: 0.5, intensityRetention: 1.0, taperDays: 12 },
    });
  });
});

describe("resolveTaperTargets — velocity held, volume graduated by level", () => {
  const front = (lvl) => resolveTaperTargets(EMBEDDED_TAPER_RULES, lvl, false);
  const final = (lvl) => resolveTaperTargets(EMBEDDED_TAPER_RULES, lvl, true);

  it("always a sprint — velocity/CNS work is never removed", () => {
    for (const lvl of ["club", "national", "world"]) {
      expect(front(lvl).intent).toBe("sprint");
      expect(final(lvl).intent).toBe("sprint");
      expect(front(lvl).sprintReps).toBeGreaterThan(0);
    }
  });

  it("intensity = round(baseline 8 × retention): local 7, national/world 8", () => {
    expect(front("club").rpe).toBe(7); // 8 × 0.90 → 7
    expect(front("national").rpe).toBe(8); // 8 × 0.95 → 8
    expect(front("world").rpe).toBe(8); // 8 × 1.00 → 8
  });

  it("front-of-taper volume = baseline × floor (60min/10reps)", () => {
    expect(front("club")).toMatchObject({ minutes: 42, sprintReps: 7 }); // ×0.70
    expect(front("national")).toMatchObject({ minutes: 33, sprintReps: 6 }); // ×0.55
    expect(front("world")).toMatchObject({ minutes: 30, sprintReps: 5 }); // ×0.50
  });

  it("final third cuts volume deeper (×0.66) at the SAME intensity", () => {
    const nf = final("national");
    expect(nf.rpe).toBe(front("national").rpe); // intensity unchanged
    expect(nf.minutes).toBe(22); // 60 × 0.55 × 0.66
    expect(nf.sprintReps).toBe(4); // 10 × 0.55 × 0.66 → 3.63 → 4
    expect(nf.minutes).toBeLessThan(front("national").minutes);
  });

  it("graduates: bigger event → deeper volume cut (world < national < local)", () => {
    expect(front("world").minutes).toBeLessThan(front("national").minutes);
    expect(front("national").minutes).toBeLessThan(front("club").minutes);
  });

  it("reps never drop below 2, even with an extreme floor", () => {
    const tiny = {
      version: "test",
      source: "override",
      byLevel: {
        ...EMBEDDED_TAPER_RULES.byLevel,
        national: { volumeFloorPct: 0.05, intensityRetention: 1, taperDays: 7 },
      },
    };
    expect(resolveTaperTargets(tiny, "national", true).sprintReps).toBe(2);
  });

  it("consumes a hydrated override ruleset (the two-layer input path)", () => {
    const override = {
      version: "coach-v2",
      source: "override",
      byLevel: {
        ...EMBEDDED_TAPER_RULES.byLevel,
        national: {
          volumeFloorPct: 0.8,
          intensityRetention: 1,
          taperDays: 4,
        },
      },
    };
    // override retains MORE volume (0.80) than the embedded national (0.55)
    expect(resolveTaperTargets(override, "national", false).minutes).toBe(48);
  });
});
