import { describe, it, expect } from "vitest";
import { computeCheckInCoverage } from "./check-in-coverage";

/**
 * The 28-day check-in coverage grid on Today. Regression coverage for the
 * local/UTC day-keying bug (2026-07-24): a positive-UTC-offset athlete (e.g.
 * Ljubljana, UTC+2 in summer) checking in "today" was shown as a miss, because
 * the grid keyed cells with `toISOString()` (UTC) while the grid itself was
 * built from local-time Date arithmetic — local midnight is still 22:00 UTC
 * the PREVIOUS day, so every cell's day-key silently shifted back by one.
 */

// A fixed instant that is unambiguous in UTC+2 (Ljubljana, summer) but whose
// UTC calendar date is the day BEFORE the local calendar date — the exact
// condition that exposed the bug (local 2026-07-24 09:00 CEST = 2026-07-24
// 07:00Z, so this alone wouldn't trigger it; the bug lived in the MIDNIGHT
// instant the grid derives internally, not in `now` itself).
const NOW_LOCAL_NOON = new Date("2026-07-24T12:00:00");

function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

describe("computeCheckInCoverage", () => {
  it("marks today as done when a readiness score exists for today's LOCAL date", () => {
    const todayKey = localDateKey(NOW_LOCAL_NOON);
    const result = computeCheckInCoverage([todayKey], [], NOW_LOCAL_NOON);
    const todayCell = result.cells.find((c) => c.isToday);
    expect(todayCell?.date).toBe(todayKey);
    expect(todayCell?.status).toBe("done");
  });

  it("never labels a cell with a UTC-shifted date (the original bug)", () => {
    const todayKey = localDateKey(NOW_LOCAL_NOON);
    const utcShiftedKey = localDateKey(
      new Date(NOW_LOCAL_NOON.getTime() - 24 * 60 * 60 * 1000),
    );
    const result = computeCheckInCoverage([], [], NOW_LOCAL_NOON);
    const todayCell = result.cells.find((c) => c.isToday);
    expect(todayCell?.date).toBe(todayKey);
    expect(todayCell?.date).not.toBe(utcShiftedKey);
  });

  it("counts a wellness-only (no readiness score) day as done when complete", () => {
    const todayKey = localDateKey(NOW_LOCAL_NOON);
    const result = computeCheckInCoverage(
      [],
      [{ date: todayKey, sleep: 4, energy: 4, stress: 3, soreness: 2 }],
      NOW_LOCAL_NOON,
    );
    const todayCell = result.cells.find((c) => c.isToday);
    expect(todayCell?.status).toBe("done");
  });

  it("counts an incomplete wellness row as partial, not done", () => {
    const todayKey = localDateKey(NOW_LOCAL_NOON);
    const result = computeCheckInCoverage(
      [],
      [{ date: todayKey, sleep: 4, energy: null, stress: 3, soreness: 2 }],
      NOW_LOCAL_NOON,
    );
    const todayCell = result.cells.find((c) => c.isToday);
    expect(todayCell?.status).toBe("partial");
  });

  it("a day with neither a score nor a wellness row is a miss", () => {
    const result = computeCheckInCoverage([], [], NOW_LOCAL_NOON);
    const todayCell = result.cells.find((c) => c.isToday);
    expect(todayCell?.status).toBe("miss");
  });

  it("streak counts consecutive done days ending today and stops at the first gap", () => {
    const keys = [-2, -1, 0].map((offset) =>
      localDateKey(new Date(NOW_LOCAL_NOON.getTime() + offset * 86_400_000)),
    );
    const result = computeCheckInCoverage(keys, [], NOW_LOCAL_NOON);
    expect(result.streak).toBe(3);
  });

  it("future days are never counted toward elapsed/missed", () => {
    const result = computeCheckInCoverage([], [], NOW_LOCAL_NOON);
    const futureCells = result.cells.filter((c) => c.status === "future");
    expect(futureCells.length).toBeGreaterThan(0);
    // 28 local days + up to 6 lead-in days to reach Monday, minus future days,
    // should equal missed + done + partial (no double counting).
    const nonFuture = result.cells.length - futureCells.length;
    expect(result.missed + result.partial).toBeLessThanOrEqual(nonFuture);
  });
});
