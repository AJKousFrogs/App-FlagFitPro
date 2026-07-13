import { describe, it, expect } from "vitest";
import { __test__ } from "../../netlify/functions/periodization-prescription.js";
import { normalizeSeverity } from "../../netlify/functions/utils/periodization-input-helpers.js";

const {
  resolveActiveRestrictions,
  resolveAgeYears,
  isTeamPractice,
  travelFieldsFromLeg,
  resolveTaperRuleset,
} = __test__;

// Minimal supabase stub for resolveTaperRuleset: from().select().eq() resolves
// to { data, error }. resolveTaperRuleset only ever calls this one chain.
const taperSupabase = (result) => ({
  from: () => ({
    select: () => ({
      eq: () => Promise.resolve(result),
    }),
  }),
});
const FULL_TAPER_ROWS = [
  {
    tournament_level: "local",
    volume_floor_pct: "0.70",
    intensity_retention: "0.90",
    taper_days: 3,
    version: "v1-2026-07-13",
    is_active: true,
  },
  {
    tournament_level: "regional",
    volume_floor_pct: "0.60",
    intensity_retention: "0.95",
    taper_days: 5,
    version: "v1-2026-07-13",
    is_active: true,
  },
  {
    tournament_level: "national",
    volume_floor_pct: "0.55",
    intensity_retention: "0.95",
    taper_days: 7,
    version: "v1-2026-07-13",
    is_active: true,
  },
  {
    tournament_level: "international",
    volume_floor_pct: "0.50",
    intensity_retention: "1.00",
    taper_days: 10,
    version: "v1-2026-07-13",
    is_active: true,
  },
  {
    tournament_level: "world",
    volume_floor_pct: "0.50",
    intensity_retention: "1.00",
    taper_days: 12,
    version: "v1-2026-07-13",
    is_active: true,
  },
];

describe("resolveTaperRuleset — live-source hydration into the engine schema", () => {
  it("materializes full active rows into a normalized live ruleset", async () => {
    const rs = await resolveTaperRuleset(taperSupabase({ data: FULL_TAPER_ROWS }));
    expect(rs.source).toBe("live");
    expect(rs.version).toBe("v1-2026-07-13");
    // string numerics from Postgres are coerced to numbers
    expect(rs.byLevel.national).toEqual({
      volumeFloorPct: 0.55,
      intensityRetention: 0.95,
      taperDays: 7,
    });
    expect(Object.keys(rs.byLevel).sort()).toEqual([
      "international",
      "local",
      "national",
      "regional",
      "world",
    ]);
  });

  it("returns null (→ engine embedded default) when a level is missing", async () => {
    const partial = FULL_TAPER_ROWS.filter((r) => r.tournament_level !== "world");
    expect(await resolveTaperRuleset(taperSupabase({ data: partial }))).toBeNull();
  });

  it("returns null on a malformed value (never feeds the engine a bad number)", async () => {
    const bad = FULL_TAPER_ROWS.map((r) =>
      r.tournament_level === "national" ? { ...r, volume_floor_pct: "2.0" } : r,
    );
    expect(await resolveTaperRuleset(taperSupabase({ data: bad }))).toBeNull();
  });

  it("returns null on a query error or empty table", async () => {
    expect(
      await resolveTaperRuleset(taperSupabase({ error: { message: "boom" } })),
    ).toBeNull();
    expect(await resolveTaperRuleset(taperSupabase({ data: [] }))).toBeNull();
  });
});

/**
 * periodization-prescription.js is the server-side input-assembly for the ported
 * prescription engine (netlify/functions/utils/periodization-engine.js) — the
 * counterpart to periodization.service.ts's private readAcwr/readBodyweight/
 * readAgeYears/isTeamPractice helpers and InjuryService.restrictions(). These tests
 * lock in that the server-side re-derivation matches the client's logic exactly,
 * since a silent divergence here is exactly the class of bug this migration exists
 * to eliminate.
 */
describe("periodization-prescription: input-assembly helpers", () => {
  describe("normalizeSeverity", () => {
    it("maps clinical grades to the minor/moderate/severe vocab", () => {
      expect(normalizeSeverity("Grade 1")).toBe("minor");
      expect(normalizeSeverity("Grade 2")).toBe("moderate");
      expect(normalizeSeverity("Grade 3")).toBe("severe");
    });
    it("passes the legacy vocab through unchanged", () => {
      expect(normalizeSeverity("severe")).toBe("severe");
    });
    it("defaults unknown grades to minor (never fabricates a worse signal)", () => {
      expect(normalizeSeverity(null)).toBe("minor");
      expect(normalizeSeverity("unknown")).toBe("minor");
    });
  });

  describe("resolveActiveRestrictions", () => {
    it("no injuries -> null (matches the engine's null-safe 'no restriction' input)", () => {
      expect(resolveActiveRestrictions([])).toBeNull();
    });

    it("a sprint-restricting injury sets restrictsSprint only", () => {
      const result = resolveActiveRestrictions([
        {
          injury_location: "hamstring",
          injury_grade: "Grade 2",
          activity_restrictions: ["sprint", "plyometric"],
        },
      ]);
      expect(result).toEqual({
        restrictsSprint: true,
        restrictsThrowing: false,
        regions: ["hamstring"],
        severity: "moderate",
      });
    });

    it("a throwing-restricting injury sets restrictsThrowing only", () => {
      const result = resolveActiveRestrictions([
        {
          injury_location: "shoulder",
          injury_grade: "minor",
          activity_restrictions: ["throwing"],
        },
      ]);
      expect(result.restrictsSprint).toBe(false);
      expect(result.restrictsThrowing).toBe(true);
      expect(result.regions).toEqual(["shoulder"]);
    });

    it("an injury with no restricting activity types is ignored (no false-positive gate)", () => {
      // e.g. a logged injury with restrictions that don't map to sprint/throwing
      expect(
        resolveActiveRestrictions([
          {
            injury_location: "wrist",
            injury_grade: "minor",
            activity_restrictions: ["grip_strength"],
          },
        ]),
      ).toBeNull();
    });

    it("takes the WORST severity across multiple flagged injuries (never under-restricts)", () => {
      const result = resolveActiveRestrictions([
        {
          injury_location: "ankle",
          injury_grade: "minor",
          activity_restrictions: ["sprint"],
        },
        {
          injury_location: "hamstring",
          injury_grade: "severe",
          activity_restrictions: ["sprint"],
        },
      ]);
      expect(result.severity).toBe("severe");
      expect(result.regions).toEqual(["ankle", "hamstring"]);
    });
  });

  describe("resolveAgeYears", () => {
    it("null dob -> null (engine falls back to the 48h base CNS window)", () => {
      expect(resolveAgeYears(null)).toBeNull();
    });

    it("computes whole years, accounting for whether the birthday has passed this year", () => {
      const now = new Date();
      const turningAgeToday = new Date(now);
      turningAgeToday.setFullYear(now.getFullYear() - 30);
      expect(resolveAgeYears(turningAgeToday.toISOString())).toBe(30);
    });

    it("implausible ages (outside 16-80) return null rather than a fabricated value", () => {
      const veryOld = new Date();
      veryOld.setFullYear(veryOld.getFullYear() - 95);
      expect(resolveAgeYears(veryOld.toISOString())).toBeNull();
    });
  });

  describe("isTeamPractice", () => {
    it("matches a recurring weekday declared in settings", () => {
      const wednesday = new Date("2026-07-15T12:00:00Z"); // a Wednesday
      expect(isTeamPractice(wednesday, [wednesday.getDay()], [])).toBe(true);
    });

    it("matches a one-off schedule-declared training date even off the recurring days", () => {
      const date = new Date("2026-07-15T12:00:00Z");
      const iso = date.toISOString().slice(0, 10);
      expect(isTeamPractice(date, [], [iso])).toBe(true);
    });

    it("neither recurring nor one-off -> false", () => {
      const date = new Date("2026-07-15T12:00:00Z");
      expect(isTeamPractice(date, [], [])).toBe(false);
    });
  });

  describe("travelFieldsFromLeg", () => {
    it("no leg -> both null (engine's own 'no travel' fallback)", () => {
      expect(travelFieldsFromLeg(null, new Date())).toEqual({
        acclimatizationDay: null,
        arrivalDayTravelHours: null,
      });
    });

    it("arrival TODAY: acclimatizationDay=0 and travel hours computed from the leg", () => {
      const now = new Date("2026-07-15T20:00:00Z");
      const leg = {
        depart_at: "2026-07-15T12:00:00Z",
        arrive_at: "2026-07-15T18:00:00Z",
      };
      expect(travelFieldsFromLeg(leg, now)).toEqual({
        acclimatizationDay: 0,
        arrivalDayTravelHours: 6,
      });
    });

    it("arrival several days ago: acclimatizationDay > 0, hours null (only computed ON arrival day)", () => {
      const now = new Date("2026-07-18T12:00:00Z");
      const leg = {
        depart_at: "2026-07-15T12:00:00Z",
        arrive_at: "2026-07-15T18:00:00Z",
      };
      const result = travelFieldsFromLeg(leg, now);
      expect(result.acclimatizationDay).toBe(2);
      expect(result.arrivalDayTravelHours).toBeNull();
    });
  });
});
