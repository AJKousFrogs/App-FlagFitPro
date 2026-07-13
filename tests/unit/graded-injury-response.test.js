import { describe, it, expect } from "vitest";
import {
  resolveInjuryResponse,
  detectDeconditioning,
  DECONDITIONING_DROP_THRESHOLD,
} from "../../netlify/functions/utils/active-injuries.js";

const inj = (over = {}) => ({
  injury_location: "hamstring",
  injury_grade: "minor",
  injury_mechanism: "self_report",
  ...over,
});

/**
 * Tissue Load Engine §4.3 — an injury must affect RPE/LOAD, but the response is
 * GRADED, not a blanket recovery-only shutdown (over-conservatism de-conditions
 * the athlete, itself a risk factor). These lock the gating + the load factors.
 */
describe("resolveInjuryResponse: graded severity gate", () => {
  it("no injuries → no response, full load", () => {
    const r = resolveInjuryResponse([]);
    expect(r.hasInjury).toBe(false);
    expect(r.goRtp).toBe(false);
    expect(r.loadFactor).toBe(1);
  });

  it("MINOR self-report → NOT full RTP; keeps training on a down-regulated plan", () => {
    const r = resolveInjuryResponse([inj({ injury_grade: "minor" })]);
    expect(r.goRtp).toBe(false); // the whole point — no recovery-only takeover
    expect(r.severity).toBe("minor");
    expect(r.loadFactor).toBe(0.85);
    expect(r.injuredRegions).toEqual(["hamstring"]);
  });

  it("MODERATE self-report → NOT full RTP; heavier load cut", () => {
    const r = resolveInjuryResponse([inj({ injury_grade: "moderate" })]);
    expect(r.goRtp).toBe(false);
    expect(r.loadFactor).toBe(0.6);
  });

  it("SEVERE self-report → full RTP", () => {
    const r = resolveInjuryResponse([inj({ injury_grade: "severe" })]);
    expect(r.goRtp).toBe(true);
    expect(r.severity).toBe("severe");
  });

  it("ANY clinical injury → full RTP even if graded minor", () => {
    const r = resolveInjuryResponse([
      inj({ injury_grade: "minor", injury_mechanism: "contact" }),
    ]);
    expect(r.goRtp).toBe(true);
    expect(r.hasClinical).toBe(true);
  });

  it("takes the WORST severity across multiple injuries", () => {
    const r = resolveInjuryResponse([
      inj({ injury_location: "calf", injury_grade: "minor" }),
      inj({ injury_location: "groin", injury_grade: "moderate" }),
    ]);
    expect(r.severity).toBe("moderate");
    expect(r.goRtp).toBe(false);
    expect(r.injuredRegions).toEqual(expect.arrayContaining(["calf", "groin"]));
  });

  it("accepts clinical 'Grade N' vocab via normalizeSeverity", () => {
    // Grade 3 = severe → RTP
    const r = resolveInjuryResponse([
      inj({ injury_grade: "Grade 3", injury_mechanism: "self_report" }),
    ]);
    expect(r.severity).toBe("severe");
    expect(r.goRtp).toBe(true);
  });
});

describe("resolveInjuryResponse: load factor is a real reduction, monotonic", () => {
  it("minor > moderate > severe factor ordering (more severe = less load)", () => {
    const minor = resolveInjuryResponse([inj({ injury_grade: "minor" })]);
    const moderate = resolveInjuryResponse([inj({ injury_grade: "moderate" })]);
    expect(minor.loadFactor).toBeGreaterThan(moderate.loadFactor);
    expect(moderate.loadFactor).toBeLessThan(1);
  });

  it("a 900 AU base becomes ~765 (minor) / 540 (moderate)", () => {
    const base = 900;
    expect(
      Math.round(
        base *
          resolveInjuryResponse([inj({ injury_grade: "minor" })]).loadFactor,
      ),
    ).toBe(765);
    expect(
      Math.round(
        base *
          resolveInjuryResponse([inj({ injury_grade: "moderate" })]).loadFactor,
      ),
    ).toBe(540);
  });
});

/**
 * §4.5 — the under-load alarm. A chronic-load COLLAPSE under an injury flag is
 * the setup for a return spike; never a fabricated risk %, just a real drop.
 */
describe("detectDeconditioning: chronic-load collapse under injury", () => {
  it("no warning when not injured", () => {
    expect(detectDeconditioning(50, 100, false).warn).toBe(false);
  });

  it("no warning when prior load is unknown/zero", () => {
    expect(detectDeconditioning(50, 0, true).warn).toBe(false);
  });

  it("warns on a >15% drop while injured", () => {
    const r = detectDeconditioning(80, 100, true); // 20% drop
    expect(r.warn).toBe(true);
    expect(r.dropPct).toBeCloseTo(0.2, 5);
  });

  it("does NOT warn on a drop within threshold", () => {
    expect(detectDeconditioning(90, 100, true).warn).toBe(false); // 10% drop
  });

  it("does NOT warn when load is rising (negative drop clamped)", () => {
    const r = detectDeconditioning(120, 100, true);
    expect(r.warn).toBe(false);
    expect(r.dropPct).toBe(0);
  });

  it("threshold constant is 15%", () => {
    expect(DECONDITIONING_DROP_THRESHOLD).toBe(0.15);
  });
});
