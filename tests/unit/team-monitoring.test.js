import { describe, it, expect } from "vitest";
import { __test__ } from "../../netlify/functions/team-monitoring.js";

const { wellnessFlag, loadFlag, actionFor, meanOf } = __test__;

/**
 * team-monitoring.js — the squad-wide coach/physio daily monitoring table.
 * These lock in the flag thresholds (readiness < 55 low; ACWR sweet-spot vs
 * watch vs high) and that the column means only average consent-VISIBLE rows.
 */
describe("team-monitoring flags", () => {
  it("wellnessFlag: <55 LOW, else OK, missing dash", () => {
    expect(wellnessFlag(40)).toBe("LOW");
    expect(wellnessFlag(54)).toBe("LOW");
    expect(wellnessFlag(55)).toBe("OK");
    expect(wellnessFlag(80)).toBe("OK");
    expect(wellnessFlag(null)).toBe("—");
    expect(wellnessFlag(undefined)).toBe("—");
  });

  it("loadFlag: sweet spot OK, elevated/under WATCH, danger HIGH", () => {
    expect(loadFlag(1.0)).toBe("OK");
    expect(loadFlag(1.3)).toBe("OK");
    expect(loadFlag(1.4)).toBe("WATCH");
    expect(loadFlag(0.7)).toBe("WATCH");
    expect(loadFlag(1.6)).toBe("HIGH");
    expect(loadFlag(null)).toBe("—");
  });

  it("actionFor: escalates on LOW wellness or HIGH load", () => {
    expect(actionFor("OK", "OK")).toBe("Full session");
    expect(actionFor("LOW", "OK")).toBe("Individualise / review");
    expect(actionFor("OK", "HIGH")).toBe("Individualise / review");
    expect(actionFor("OK", "WATCH")).toBe("Monitor");
    expect(actionFor("—", "—")).toBe("Monitor");
  });
});

describe("team-monitoring meanOf", () => {
  const row = (readiness, srpe, acwr) => ({
    consentPending: false,
    wellness: { sleep: null, readiness },
    load: { rpe: null, durationMin: null, srpe },
    acwr,
  });

  it("averages only consent-visible rows and skips nulls", () => {
    const rows = [
      row(80, 400, 1.2),
      row(60, 200, 1.0),
      { consentPending: true, name: "Hidden" }, // must be excluded
    ];
    const m = meanOf(rows);
    expect(m.readiness).toBe(70); // (80+60)/2
    expect(m.srpe).toBe(300); // (400+200)/2
    expect(m.acwr).toBe(1.1); // (1.2+1.0)/2
  });

  it("returns null when no rows are visible", () => {
    expect(meanOf([{ consentPending: true }])).toBeNull();
    expect(meanOf([])).toBeNull();
  });

  it("a column with no data averages to null, not 0", () => {
    const m = meanOf([row(null, null, null)]);
    expect(m.readiness).toBeNull();
    expect(m.srpe).toBeNull();
  });
});
