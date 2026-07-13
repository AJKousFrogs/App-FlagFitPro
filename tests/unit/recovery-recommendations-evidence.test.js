import { describe, it, expect } from "vitest";
import { generateRecoveryRecommendations } from "../../netlify/functions/recovery-core.js";

/**
 * 2026-07-13 — recovery-core.js was migrated onto the single-source evidence
 * catalogue (utils/recovery-protocols.js). Its old private catalogue had drifted
 * from the evidence: it recommended static stretching AS recovery and offered cold
 * therapy after any high-intensity session regardless of adaptation cost. These
 * tests lock the corrected, evidence-aligned behaviour so it can't regress.
 */

const allRecs = (r) => [
  ...r.immediate,
  ...r.sameDay,
  ...r.nextDay,
  ...r.ongoing,
];

describe("recovery recommendations are evidence-aligned (single-source catalogue)", () => {
  it("never recommends static stretching as recovery (Afonso 2021)", () => {
    const r = generateRecoveryRecommendations({
      trainingType: "strength",
      intensity: 8,
      soreness: 6,
      timeAvailable: 60,
      muscleGroups: ["legs"],
      equipment: ["foam_roller", "massage_gun", "compression"],
    });
    expect(
      allRecs(r).some((rec) => rec.protocol === "static_stretching"),
    ).toBe(false);
  });

  it("carries the honest headline (Tier 1 dwarfs passive modalities)", () => {
    const r = generateRecoveryRecommendations({ intensity: 5 });
    expect(typeof r.headline).toBe("string");
    expect(r.headline.length).toBeGreaterThan(0);
  });

  it("WITHHOLDS cold-water immersion after a strength session — it blunts adaptation (Roberts 2015)", () => {
    const r = generateRecoveryRecommendations({
      trainingType: "strength",
      intensity: 9,
      equipment: ["ice_bath"],
    });
    // not prescribed in the actionable blocks
    expect(r.immediate.some((rec) => rec.protocol === "cold_water_immersion")).toBe(
      false,
    );
    expect(r.sameDay.some((rec) => rec.protocol === "cold_water_immersion")).toBe(
      false,
    );
    // surfaced as an explicit "skipped on purpose" note instead
    expect(
      r.ongoing.some(
        (rec) => rec.protocol === "cold_water_immersion" && rec.priority === "info",
      ),
    ).toBe(true);
  });

  it("OFFERS cold-water immersion after a game — no adaptation to protect", () => {
    const r = generateRecoveryRecommendations({
      trainingType: "game",
      intensity: 9,
      equipment: ["ice_bath"],
    });
    const cwi = r.immediate.find((rec) => rec.protocol === "cold_water_immersion");
    expect(cwi).toBeTruthy();
  });

  it("does NOT offer cold therapy when session intensity is below the threshold", () => {
    const r = generateRecoveryRecommendations({
      trainingType: "game",
      intensity: 5,
      equipment: ["ice_bath"],
    });
    expect(allRecs(r).some((rec) => rec.protocol === "cold_water_immersion")).toBe(
      false,
    );
  });

  it("modality doses match the single-source catalogue (no drift)", async () => {
    const { RECOVERY_PROTOCOLS } = await import(
      "../../netlify/functions/utils/recovery-protocols.js"
    );
    const r = generateRecoveryRecommendations({
      trainingType: "conditioning",
      intensity: 7,
      timeAvailable: 40,
      equipment: ["foam_roller"],
    });
    const foam = r.immediate.find((rec) => rec.protocol === "foam_rolling");
    expect(foam.duration).toBe(RECOVERY_PROTOCOLS.foam_rolling.dose.durationText);
  });
});
