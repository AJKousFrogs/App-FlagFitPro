import { describe, it, expect } from "vitest";
import { __test__ } from "../../netlify/functions/parental-consent.js";

const { getRestrictedFeatures, featuresFromScope } = __test__;

// GDPR-critical (Art. 8): a minor's data features must be RESTRICTED unless a
// guardian has verified consent AND approved that specific feature. Per-feature
// consent lives in the parental_consent.consent_scope jsonb (live schema).
describe("parental consent — feature restriction from status + consent_scope", () => {
  it("no consent row → everything restricted", () => {
    const r = getRestrictedFeatures(null);
    for (const k of ["healthData", "biometrics", "location", "research"]) {
      expect(r[k].restricted).toBe(true);
    }
  });

  it("pending (not verified) → everything restricted regardless of scope", () => {
    const r = getRestrictedFeatures({
      status: "pending",
      consent_scope: { healthData: true, biometrics: true, location: true, research: true },
    });
    for (const k of ["healthData", "biometrics", "location", "research"]) {
      expect(r[k].restricted).toBe(true);
    }
  });

  it("verified → only the features NOT in scope are restricted", () => {
    const r = getRestrictedFeatures({
      status: "verified",
      consent_scope: { healthData: true, biometrics: false, location: true, research: false },
    });
    expect(r.healthData.restricted).toBe(false);
    expect(r.biometrics.restricted).toBe(true);
    expect(r.location.restricted).toBe(false);
    expect(r.research.restricted).toBe(true);
  });

  it("featuresFromScope coerces only strict true to granted", () => {
    expect(featuresFromScope({ healthData: true })).toMatchObject({
      healthData: true,
      biometrics: false,
    });
    expect(featuresFromScope(null)).toMatchObject({
      healthData: false,
      research: false,
    });
    // a non-boolean truthy must NOT grant consent
    expect(featuresFromScope({ healthData: "yes" }).healthData).toBe(false);
  });
});
