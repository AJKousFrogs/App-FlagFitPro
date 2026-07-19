/**
 * wellness-checkin.schema.ts — the second Signal Forms migration.
 *
 * This is a consistency migration (always-valid range sliders, no submit gate),
 * so the spec pins the two things that COULD silently regress: the defaults
 * must match the pre-migration slider seeds byte-for-byte, and the declared
 * bounds must match what the range inputs used to carry as HTML attributes.
 * (That the bounds actually reach the DOM is verified separately — a rendered
 * check confirmed every input's min/max/value against these numbers.)
 */

import { describe, it, expect } from "vitest";
import {
  defaultWellnessCheckin,
  WELLNESS_FIELD_BOUNDS,
  type WellnessCheckinForm,
} from "./wellness-checkin.schema";

describe("wellness-checkin defaults", () => {
  it("match the pre-migration slider seeds exactly", () => {
    expect(defaultWellnessCheckin()).toEqual({
      sleepQuality: 7,
      sleepHours: 7.5,
      soreness: 4,
      energy: 6,
      mood: 7,
      stress: 3,
    });
  });

  it("every default sits inside its own bounds", () => {
    const d = defaultWellnessCheckin();
    for (const key of Object.keys(
      WELLNESS_FIELD_BOUNDS,
    ) as (keyof WellnessCheckinForm)[]) {
      const [lo, hi] = WELLNESS_FIELD_BOUNDS[key];
      expect(d[key]).toBeGreaterThanOrEqual(lo);
      expect(d[key]).toBeLessThanOrEqual(hi);
    }
  });

  it("returns a fresh object each call (no shared mutable default)", () => {
    const a = defaultWellnessCheckin();
    a.soreness = 10;
    expect(defaultWellnessCheckin().soreness).toBe(4);
  });
});

describe("wellness-checkin bounds", () => {
  it("match the ranges the range inputs previously hard-coded as attributes", () => {
    expect(WELLNESS_FIELD_BOUNDS).toEqual({
      sleepQuality: [1, 10],
      sleepHours: [0, 12],
      soreness: [1, 10],
      energy: [1, 10],
      mood: [1, 10],
      stress: [1, 10],
    });
  });

  it("covers all six fields, none extra", () => {
    expect(Object.keys(WELLNESS_FIELD_BOUNDS).sort()).toEqual([
      "energy",
      "mood",
      "sleepHours",
      "sleepQuality",
      "soreness",
      "stress",
    ]);
  });

  it("every bound is a valid lo ≤ hi pair", () => {
    for (const [lo, hi] of Object.values(WELLNESS_FIELD_BOUNDS)) {
      expect(lo).toBeLessThanOrEqual(hi);
    }
  });
});
