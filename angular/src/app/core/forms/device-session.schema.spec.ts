/**
 * device-session.schema.ts — Signal Forms pilot.
 *
 * The whole argument for moving validation out of the component: these rules
 * are now testable without TestBed, without a fixture, without mounting
 * anything. Compare device-data.component.spec.ts, which needs all three to
 * assert the same behaviour through the UI.
 */

import { describe, it, expect } from "vitest";
import {
  emptyDeviceSession,
  hasRealMetric,
  DEVICE_SESSION_METRIC_KEYS,
  type DeviceSessionForm,
} from "./device-session.schema";

const base = (over: Partial<DeviceSessionForm> = {}): DeviceSessionForm => ({
  ...emptyDeviceSession("2026-07-18"),
  ...over,
});

describe("hasRealMetric — never write an all-null row", () => {
  it("an empty session has no real metric", () => {
    expect(hasRealMetric(base())).toBe(false);
  });

  it.each(DEVICE_SESSION_METRIC_KEYS)("%s alone counts", (key) => {
    expect(hasRealMetric(base({ [key]: 42 }))).toBe(true);
  });

  it("a device name alone does NOT count — that's still an empty row", () => {
    expect(hasRealMetric(base({ deviceName: "Garmin" }))).toBe(false);
  });

  it("notes alone do NOT count", () => {
    expect(hasRealMetric(base({ notes: "felt good" }))).toBe(false);
  });

  it("a zero metric does not count as data", () => {
    expect(hasRealMetric(base({ totalDistanceM: 0 }))).toBe(false);
  });

  it("counts a metric alongside empty others", () => {
    expect(
      hasRealMetric(base({ totalDistanceM: 5000, playerLoad: null })),
    ).toBe(true);
  });
});

// The non-negative rule is declared with the framework's own `min()` validator
// rather than a hand-written helper, so it is asserted through the form in
// device-data.component.spec.ts ("rejects a negative metric") rather than here.
// Duplicating it as a pure predicate would put the rule in two places.

describe("emptyDeviceSession", () => {
  it("keeps the date it was given and nulls every metric", () => {
    const s = emptyDeviceSession("2026-08-01");
    expect(s.sessionDate).toBe("2026-08-01");
    for (const key of DEVICE_SESSION_METRIC_KEYS) {
      expect(s[key]).toBeNull();
    }
  });
});
