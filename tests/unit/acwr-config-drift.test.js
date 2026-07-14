import { describe, it, expect } from "vitest";
import {
  ACWR_DEFAULTS,
  ACWR_RISK_ZONES,
} from "../../netlify/functions/utils/acwr.js";
import { EVIDENCE_PRESETS } from "../../angular/src/app/core/config/evidence-presets.ts";

/**
 * DRIFT GUARD — the frontend must not compute/classify ACWR in a way that drifts
 * from the backend authority (`netlify/functions/utils/acwr.js`) in the DANGEROUS
 * direction. If the client is ever LAXER than the server (flags danger later, or
 * uses a higher chronic-load floor), an athlete is told "safe" while the server
 * would flag risk. In a load-management app that is an injury vector.
 *
 * Imports BOTH real sources (no reimplementation) and fails on drift.
 *
 * KNOWN, INTENTIONAL divergence documented here: the backend risk classifier is
 * currently POPULATION-BLIND — it uses one set of risk-zone boundaries + chronic
 * floor (the adult baseline) for EVERY athlete, while the frontend tightens them for
 * youth and return-to-play (e.g. RTP flags danger at ACWR 1.3 vs the server's 1.5).
 * So a returning-from-injury athlete's UI shows danger the server treats as safe.
 * Making the backend population-aware is the backend-authoritative migration target
 * (Batch 3). Until then this guard enforces the safe direction only.
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
