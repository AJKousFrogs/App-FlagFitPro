import { describe, it, expect } from "vitest";
import { buildLoadsByDay } from "../../netlify/functions/calc-readiness.js";
import { computeSessionLoad } from "../../netlify/functions/utils/acwr.js";

// The OLD inline definition calc-readiness used before 2026-07-09: `duration *
// rpe`, with an intensity_level→rpe fallback, ignoring any stored `workload`.
// Reproduced here to PROVE the switch to canonical `computeSessionLoad` is a
// no-op on today's data and to pin the two intended deltas where it isn't.
function oldInlineLoadsByDay(sessions) {
  const m = new Map();
  for (const s of sessions ?? []) {
    const duration = s.duration_minutes;
    const rpe =
      s.rpe !== null && s.rpe !== undefined ? s.rpe : s.intensity_level || 0;
    if (!duration || !s.session_date) {
      continue;
    }
    if (rpe === 0 || rpe === null) {
      continue;
    }
    m.set(s.session_date, (m.get(s.session_date) || 0) + duration * rpe);
  }
  return m;
}

describe("buildLoadsByDay — canonical load, parity with the retired inline calc", () => {
  it("is IDENTICAL to the old inline calc when workload == rpe*duration (today's live shape)", () => {
    const sessions = [
      {
        session_date: "2026-07-01",
        rpe: 6,
        duration_minutes: 60,
        workload: 360,
      },
      {
        session_date: "2026-07-01",
        rpe: 4,
        duration_minutes: 30,
        workload: 120,
      },
      {
        session_date: "2026-07-02",
        rpe: 7,
        duration_minutes: 45,
        workload: 315,
      },
    ];
    expect([...buildLoadsByDay(sessions)]).toEqual([
      ...oldInlineLoadsByDay(sessions),
    ]);
  });

  it("prefers a real stored workload over rpe*duration (the intended fix)", () => {
    // stored workload 500 ≠ rpe*duration 300 (e.g. an imported/adjusted load)
    const sessions = [
      {
        session_date: "2026-07-03",
        rpe: 5,
        duration_minutes: 60,
        workload: 500,
      },
    ];
    expect(buildLoadsByDay(sessions).get("2026-07-03")).toBe(500);
    expect(oldInlineLoadsByDay(sessions).get("2026-07-03")).toBe(300); // the divergence we're closing
  });

  it("drops the intensity_level-as-RPE fallback (aligns with every other consumer)", () => {
    const sessions = [
      {
        session_date: "2026-07-04",
        rpe: null,
        intensity_level: 8,
        duration_minutes: 60,
      },
    ];
    // canonical: no workload, no rpe → 0 load → the day is omitted
    expect(buildLoadsByDay(sessions).has("2026-07-04")).toBe(false);
    // old inline treated intensity_level as rpe → 480
    expect(oldInlineLoadsByDay(sessions).get("2026-07-04")).toBe(480);
  });

  it("delegates the per-session number to computeSessionLoad and sums by day", () => {
    const s = { session_date: "2026-07-05", rpe: 6, duration_minutes: 50 };
    expect(buildLoadsByDay([s]).get("2026-07-05")).toBe(computeSessionLoad(s));
  });

  it("skips date-less and zero-load sessions", () => {
    const sessions = [
      { session_date: null, rpe: 5, duration_minutes: 60 },
      { session_date: "2026-07-06", rpe: 0, duration_minutes: 60 },
    ];
    expect(buildLoadsByDay(sessions).size).toBe(0);
  });
});
