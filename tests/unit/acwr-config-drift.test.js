import { describe, it, expect } from "vitest";
import {
  ACWR_DEFAULTS,
  ACWR_RISK_ZONES,
  classifyAcwrZone,
} from "../../netlify/functions/utils/acwr.js";
import {
  COHORT_ACWR_THRESHOLDS,
  deriveCohortPresetId,
} from "../../netlify/functions/utils/cohort.js";
import {
  EVIDENCE_PRESETS,
  derivePresetId,
} from "../../angular/src/app/core/config/evidence-presets.ts";

/**
 * DRIFT GUARD — the frontend must not compute/classify ACWR in a way that drifts
 * from the backend authority (`netlify/functions/utils/acwr.js`) in the DANGEROUS
 * direction. If the client is ever LAXER than the server (flags danger later, or
 * uses a higher chronic-load floor), an athlete is told "safe" while the server
 * would flag risk. In a load-management app that is an injury vector.
 *
 * Imports BOTH real sources (no reimplementation) and fails on drift.
 *
 * 2026-07-14 (audit batch 4): the backend is COHORT-AWARE for the canonical
 * readiness score — calc-readiness resolves the athlete's cohort
 * (utils/cohort.js) and scores against its bands. This guard now ALSO asserts
 * the server cohort table + derivation rule are byte-equal to the client
 * presets (below). Display lanes without an athlete context (load-management,
 * smart-training) stay on the adult classifyAcwrZone default; the client
 * tightens those per the safe-direction rule.
 */
describe("ACWR config drift: frontend presets vs backend authority", () => {
  const LAMBDA_TOL = 1e-3;
  const presets = Object.entries(EVIDENCE_PRESETS);
  const DEFAULT_ID = "adult_flag_competitive_v1";

  it("has presets to check, including the default", () => {
    expect(presets.length).toBeGreaterThan(0);
    expect(EVIDENCE_PRESETS[DEFAULT_ID]).toBeTruthy();
  });

  // The EWMA math (windows + decay) MUST be identical everywhere — it is the shared
  // computation; any drift means FE and BE compute a different ACWR for one athlete.
  for (const [id, preset] of presets) {
    const acwr = preset.acwr;

    it(`preset '${id}': EWMA windows equal the backend`, () => {
      expect(acwr.acuteWindowDays).toBe(ACWR_DEFAULTS.acuteDays);
      expect(acwr.chronicWindowDays).toBe(ACWR_DEFAULTS.chronicDays);
    });

    it(`preset '${id}': EWMA lambdas match the backend (±${LAMBDA_TOL})`, () => {
      expect(
        Math.abs(acwr.acuteLambda - ACWR_DEFAULTS.acuteLambda),
      ).toBeLessThan(LAMBDA_TOL);
      expect(
        Math.abs(acwr.chronicLambda - ACWR_DEFAULTS.chronicLambda),
      ).toBeLessThan(LAMBDA_TOL);
    });

    // No preset may be laxer than the server baseline (the dangerous direction).
    it(`preset '${id}' is never laxer than the backend baseline`, () => {
      expect(acwr.thresholds.sweetSpotHigh).toBeLessThanOrEqual(
        ACWR_RISK_ZONES.safe.max,
      );
      expect(acwr.thresholds.dangerHigh).toBeLessThanOrEqual(
        ACWR_RISK_ZONES.danger.min,
      );
      // A LOWER chronic floor makes ACWR more sensitive to spikes = more conservative,
      // so the client floor must not exceed the server's.
      expect(acwr.minChronicLoad).toBeLessThanOrEqual(
        ACWR_DEFAULTS.minChronicLoad,
      );
    });
  }

  // The default (adult) preset IS the backend baseline — it must match exactly, or
  // the "one-size backend" no longer equals the population it was tuned for.
  it(`default preset ('${DEFAULT_ID}') risk zones + floor equal the backend exactly`, () => {
    const acwr = EVIDENCE_PRESETS[DEFAULT_ID].acwr;
    expect(acwr.thresholds.sweetSpotHigh).toBe(ACWR_RISK_ZONES.safe.max);
    expect(acwr.thresholds.dangerHigh).toBe(ACWR_RISK_ZONES.danger.min);
    expect(acwr.minChronicLoad).toBe(ACWR_DEFAULTS.minChronicLoad);
  });
});

describe("cohort drift guard (batch 4): server mirror === client presets", () => {
  it("every client preset's ACWR thresholds equal the server cohort table", () => {
    for (const [id, preset] of Object.entries(EVIDENCE_PRESETS)) {
      expect(
        COHORT_ACWR_THRESHOLDS[id],
        `server table missing '${id}'`,
      ).toBeTruthy();
      expect(COHORT_ACWR_THRESHOLDS[id]).toEqual({
        sweetSpotLow: preset.acwr.thresholds.sweetSpotLow,
        sweetSpotHigh: preset.acwr.thresholds.sweetSpotHigh,
        dangerHigh: preset.acwr.thresholds.dangerHigh,
      });
    }
    // and no server cohort exists without a client preset
    for (const id of Object.keys(COHORT_ACWR_THRESHOLDS)) {
      expect(
        EVIDENCE_PRESETS[id],
        `client preset missing '${id}'`,
      ).toBeTruthy();
    }
  });

  it("the derivation rule is identical on both sides across the grid", () => {
    const ages = [null, 16, 17, 18, 25, 34, 35, 40, 60];
    for (const age of ages) {
      for (const rtp of [false, true]) {
        expect(deriveCohortPresetId(age, rtp)).toBe(derivePresetId(age, rtp));
      }
    }
  });

  it("cohort-aware zones only ever TIGHTEN vs adult (safe direction, per band)", () => {
    const order = ["detraining", "safe", "caution", "danger", "critical"];
    for (const [id, t] of Object.entries(COHORT_ACWR_THRESHOLDS)) {
      for (const acwr of [
        0.6, 0.75, 0.85, 1.15, 1.25, 1.35, 1.45, 1.55, 1.75, 1.9,
      ]) {
        const adult = order.indexOf(classifyAcwrZone(acwr));
        const cohort = order.indexOf(classifyAcwrZone(acwr, t));
        // On the HIGH side a cohort may escalate earlier, never later.
        if (acwr >= 0.8) {
          expect(cohort, `${id} lax at ${acwr}`).toBeGreaterThanOrEqual(adult);
        }
      }
    }
  });
});
