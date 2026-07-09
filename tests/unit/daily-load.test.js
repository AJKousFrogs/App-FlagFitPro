import { describe, it, expect } from "vitest";
import { __test__ } from "../../netlify/functions/daily-load.js";

const { aggregateDailyLoad } = __test__;

// The endpoint must sum the CANONICAL session load (computeSessionLoad) by day —
// never re-derive the AU formula. These lock that contract.
describe("aggregateDailyLoad — canonical AU summed by calendar day", () => {
  it("sums multiple sessions on the same day (rpe × duration)", () => {
    const out = aggregateDailyLoad([
      { session_date: "2026-07-01", rpe: 6, duration_minutes: 60 }, // 360
      { session_date: "2026-07-01", rpe: 4, duration_minutes: 30 }, // 120
    ]);
    expect(out).toEqual([{ date: "2026-07-01", load: 480 }]);
  });

  it("prefers a real stored workload over rpe × duration", () => {
    const out = aggregateDailyLoad([
      {
        session_date: "2026-07-02",
        workload: 500,
        rpe: 6,
        duration_minutes: 60,
      },
    ]);
    expect(out).toEqual([{ date: "2026-07-02", load: 500 }]);
  });

  it("skips zero/loadless and date-less sessions, and sorts by date", () => {
    const out = aggregateDailyLoad([
      { session_date: "2026-07-05", rpe: 5, duration_minutes: 40 }, // 200
      { session_date: "2026-07-03", rpe: 0, duration_minutes: 60 }, // 0 → skip
      { session_date: "2026-07-04", rpe: 7, duration_minutes: 20 }, // 140
      { session_date: null, rpe: 5, duration_minutes: 60 }, // no date → skip
    ]);
    expect(out).toEqual([
      { date: "2026-07-04", load: 140 },
      { date: "2026-07-05", load: 200 },
    ]);
  });

  it("returns [] for empty/undefined input", () => {
    expect(aggregateDailyLoad([])).toEqual([]);
    expect(aggregateDailyLoad(undefined)).toEqual([]);
  });
});
