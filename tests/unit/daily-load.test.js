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

// 2026-07-25: past-game estimated load (docs/SOURCE_OF_TRUTH.md §4a/§4b) —
// folded in exactly like calc-readiness.js: MAX(logged session, game estimate)
// per day, never lowering a day's load.
describe("aggregateDailyLoad — past-game load folded in (MAX, safe direction)", () => {
  it("adds a game-day estimate on a day with no logged session", () => {
    const out = aggregateDailyLoad(
      [{ session_date: "2026-07-01", rpe: 6, duration_minutes: 60 }], // 360
      new Map([["2026-07-10", 450]]),
    );
    expect(out).toEqual([
      { date: "2026-07-01", load: 360 },
      { date: "2026-07-10", load: 450 },
    ]);
  });

  it("keeps the higher logged session load over a lower game estimate", () => {
    const out = aggregateDailyLoad(
      [{ session_date: "2026-07-10", rpe: 9, duration_minutes: 90 }], // 810
      new Map([["2026-07-10", 450]]),
    );
    expect(out).toEqual([{ date: "2026-07-10", load: 810 }]);
  });

  it("uses the game estimate when it exceeds a lightly-logged session", () => {
    const out = aggregateDailyLoad(
      [{ session_date: "2026-07-10", rpe: 2, duration_minutes: 20 }], // 40
      new Map([["2026-07-10", 450]]),
    );
    expect(out).toEqual([{ date: "2026-07-10", load: 450 }]);
  });

  it("is a no-op when gameLoadsByDay is omitted or empty", () => {
    const sessions = [
      { session_date: "2026-07-01", rpe: 6, duration_minutes: 60 },
    ];
    expect(aggregateDailyLoad(sessions)).toEqual(
      aggregateDailyLoad(sessions, new Map()),
    );
  });
});
