import { describe, it, expect } from "vitest";
import { TRAINING } from "./app.constants";
import { ADULT_FLAG_COMPETITIVE_V1 } from "../config/evidence-presets";

/**
 * 2026-07-08 consistency audit E1. app.constants.ts's TRAINING.ACWR_* values
 * are a SECOND definition of the ACWR sweet-spot/danger thresholds that
 * evidence-presets' ADULT_FLAG_COMPETITIVE_V1.acwr.thresholds owns as the single
 * source (F9). They're used only by validateAllConstants()'s ordering sanity
 * check today — NOT for live athlete-facing risk classification (that path reads
 * the preset) — so a silent divergence wouldn't surface anywhere at runtime.
 * This guard turns that latent duplicate into a caught one: if either side is
 * edited without the other, this fails. If the constants ever gain a real
 * consumer, migrate them to read the preset directly and delete this guard.
 */
describe("ACWR threshold drift guard (audit E1)", () => {
  const canonical = ADULT_FLAG_COMPETITIVE_V1.acwr.thresholds;

  it("TRAINING.ACWR_SAFE_RANGE_MIN matches the canonical sweetSpotLow", () => {
    expect(TRAINING.ACWR_SAFE_RANGE_MIN).toBe(canonical.sweetSpotLow);
  });

  it("TRAINING.ACWR_SAFE_RANGE_MAX matches the canonical sweetSpotHigh", () => {
    expect(TRAINING.ACWR_SAFE_RANGE_MAX).toBe(canonical.sweetSpotHigh);
  });

  it("TRAINING.ACWR_WARNING_THRESHOLD matches the canonical dangerHigh", () => {
    expect(TRAINING.ACWR_WARNING_THRESHOLD).toBe(canonical.dangerHigh);
  });
});
