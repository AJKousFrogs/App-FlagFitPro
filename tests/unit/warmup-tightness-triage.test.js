import { describe, it, expect } from "vitest";
import {
  buildWarmupTemplate,
  tightnessTriageStretch,
  WARMUP_TARGET_SECONDS,
} from "../../netlify/functions/utils/daily-protocol-training-logic.js";

const sumSeconds = (plan) =>
  plan.reduce((t, item) => t + (item.durationSeconds || 0), 0);

// The static holds retired from the recovery warm-up default (2026-07-13).
const RETIRED_STATIC_HOLDS = [
  "Hip 90/90 Stretch",
  "Pigeon Pose",
  "Seated Hamstring Stretch",
  "Hip Flexor Lunge Stretch",
];

describe("recovery warm-up is dynamic RAMP, not static holds", () => {
  const recovery = buildWarmupTemplate({ variant: "recovery" });

  it("no longer contains the retired static-hold defaults", () => {
    const names = recovery.map((i) => i.name);
    for (const hold of RETIRED_STATIC_HOLDS) {
      expect(names).not.toContain(hold);
    }
  });

  it("uses dynamic through-range mobility (the mobilise items have sets/reps)", () => {
    for (const name of [
      "90/90 Hip Switches",
      "Cossack Squats",
      "Straight-Leg Kicks (Toy Soldiers)",
      "Walking Hip-Flexor Lunges",
    ]) {
      const item = recovery.find((i) => i.name === name);
      expect(item, `${name} present`).toBeTruthy();
      expect(item.reps, `${name} is dynamic`).toBeGreaterThan(0);
    }
  });

  it("still sums to the 25-min budget (conversion preserved duration)", () => {
    expect(sumSeconds(recovery)).toBe(WARMUP_TARGET_SECONDS);
  });
});

describe("tightnessTriageStretch — static stretch is triage-only", () => {
  it("returns a short targeted hold for a genuine ROM restriction", () => {
    const s = tightnessTriageStretch("hamstring");
    expect(s).toBeTruthy();
    expect(s.triage).toBe(true);
    expect(s.region).toBe("hamstring");
    expect(s.durationSeconds).toBeLessThanOrEqual(30);
  });

  it("resolves region synonyms (achilles→calf, hips→hip_flexor, pec→chest)", () => {
    expect(tightnessTriageStretch("achilles").region).toBe("calf");
    expect(tightnessTriageStretch("hips").region).toBe("hip_flexor");
    expect(tightnessTriageStretch("pec").region).toBe("chest");
  });

  it("returns null for an unknown region", () => {
    expect(tightnessTriageStretch("elbow")).toBeNull();
    expect(tightnessTriageStretch("")).toBeNull();
    expect(tightnessTriageStretch(undefined)).toBeNull();
  });

  it("is CONTRAINDICATED on an acutely sore region (never stretch damaged tissue)", () => {
    expect(
      tightnessTriageStretch("hamstring", { soreRegions: ["hamstring"] }),
    ).toBeNull();
  });

  it("is CONTRAINDICATED on an active-injury region (synonym-aware)", () => {
    // 'achilles' injury must block the 'calf' triage stretch (same complex)
    expect(
      tightnessTriageStretch("calf", { injuryRegions: ["achilles"] }),
    ).toBeNull();
  });

  it("still fires for a tight region when a DIFFERENT region is sore", () => {
    const s = tightnessTriageStretch("shoulder", { soreRegions: ["hamstring"] });
    expect(s).toBeTruthy();
    expect(s.region).toBe("shoulder");
  });
});
