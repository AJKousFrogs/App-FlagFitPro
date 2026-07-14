import { describe, it, expect } from "vitest";
import {
  derivePresetId,
  MASTERS_FLAG_V1,
  EVIDENCE_PRESETS,
  ADULT_FLAG_COMPETITIVE_V1,
} from "../../angular/src/app/core/config/evidence-presets.ts";
import { QB_THROW_MONITOR } from "../../angular/src/app/core/config/position-volume.config.ts";
import { ageYearsFromUserMetadata } from "../../angular/src/app/core/utils/age-years.util.ts";
import { progressPrescription } from "../../netlify/functions/utils/daily-protocol-progression.js";

// ─────────────────────────────────────────────────────────────────────────────
// Audit batch 3: derived cohort assignment (§4.1 — un-orphans the presets),
// masters preset, QB monitor re-anchor (§5), strength double progression (§3.3).
// ─────────────────────────────────────────────────────────────────────────────

describe("§4.1 — derived cohort assignment (derived, not selected)", () => {
  it("active RTP beats everything (highest precedence)", () => {
    expect(derivePresetId(16, true)).toBe("return_to_play_v1");
    expect(derivePresetId(40, true)).toBe("return_to_play_v1");
  });
  it("age bands: <18 youth · ≥35 masters · else adult", () => {
    expect(derivePresetId(17, false)).toBe("youth_flag_v1");
    expect(derivePresetId(18, false)).toBe("adult_flag_competitive_v1");
    expect(derivePresetId(34, false)).toBe("adult_flag_competitive_v1");
    expect(derivePresetId(35, false)).toBe("masters_flag_v1");
    expect(derivePresetId(37, false)).toBe("masters_flag_v1");
  });
  it("unknown age → adult (the server baseline, never a fabricated cohort)", () => {
    expect(derivePresetId(null, false)).toBe("adult_flag_competitive_v1");
  });
});

describe("masters preset — tightens only (safe-direction rule)", () => {
  it("is registered and tighter than adult on the high side", () => {
    expect(EVIDENCE_PRESETS["masters_flag_v1"]).toBe(MASTERS_FLAG_V1);
    const a = ADULT_FLAG_COMPETITIVE_V1.acwr.thresholds;
    const m = MASTERS_FLAG_V1.acwr.thresholds;
    expect(m.sweetSpotHigh).toBeLessThan(a.sweetSpotHigh); // 1.2 < 1.3
    expect(m.dangerHigh).toBeLessThan(a.dangerHigh); // 1.4 < 1.5
    expect(m.sweetSpotLow).toBe(a.sweetSpotLow); // low side unchanged
  });
});

describe("ageYearsFromUserMetadata — one derivation for CNS windows AND cohorts", () => {
  it("reads date_of_birth (and legacy keys); implausible → null", () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 37);
    const iso = dob.toISOString().slice(0, 10);
    expect(ageYearsFromUserMetadata({ date_of_birth: iso })).toBe(37);
    expect(ageYearsFromUserMetadata({ birth_date: iso })).toBe(37);
    expect(ageYearsFromUserMetadata({})).toBeNull();
    expect(
      ageYearsFromUserMetadata({ date_of_birth: "not-a-date" }),
    ).toBeNull();
    expect(
      ageYearsFromUserMetadata({ date_of_birth: "2020-01-01" }),
    ).toBeNull(); // < 16
  });
});

describe("§5 — QB monitor replaces the pitch-count template", () => {
  it("monitors ramp + arm signals; youth gets a real progression rule", () => {
    expect(QB_THROW_MONITOR.weeklyVolumeSpikeFactor).toBeGreaterThan(1);
    expect(QB_THROW_MONITOR.armFeelingDropFlag).toBeGreaterThanOrEqual(2);
    expect(QB_THROW_MONITOR.youth.maxWeeklyVolumeIncreaseFactor).toBeLessThan(
      QB_THROW_MONITOR.weeklyVolumeSpikeFactor,
    ); // youth stricter
    expect(QB_THROW_MONITOR.youth.minNoThrowDaysPerWeek).toBeGreaterThanOrEqual(
      2,
    );
    expect(QB_THROW_MONITOR.note).toContain("clinician");
  });
});

describe("§3.3 — strength double progression (reps first, then load)", () => {
  it("no logged history → static base, nothing fabricated (Law #7)", () => {
    expect(progressPrescription(null, 8)).toEqual({
      reps: 8,
      weightKg: null,
      note: null,
    });
    expect(progressPrescription({ actual_reps: 0 }, 8).note).toBeNull();
  });

  it("below the ceiling → one more rep than last time", () => {
    const p = progressPrescription(
      { actual_reps: 9, actual_weight_kg: 40 },
      8,
      {
        maxReps: 12,
      },
    );
    expect(p.reps).toBe(10);
    expect(p.weightKg).toBe(40); // load held while reps climb
    expect(p.note).toContain("9 → 10");
  });

  it("top of the range → load steps ~2.5%, reps reset to base", () => {
    const p = progressPrescription(
      { actual_reps: 12, actual_weight_kg: 100 },
      8,
      { maxReps: 12 },
    );
    expect(p.reps).toBe(8);
    expect(p.weightKg).toBe(102.5);
    expect(p.note).toContain("reps reset to 8");
  });

  it("top of range without a logged load → harder-variation note, no invented kg", () => {
    const p = progressPrescription({ actual_reps: 12 }, 8, { maxReps: 12 });
    expect(p.reps).toBe(8);
    expect(p.weightKg).toBeNull();
    expect(p.note).toContain("harder variation");
  });

  it("never prescribes below the base reps", () => {
    const p = progressPrescription({ actual_reps: 5 }, 8, { maxReps: 12 });
    expect(p.reps).toBe(8);
  });
});
