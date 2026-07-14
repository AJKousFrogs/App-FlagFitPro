import { describe, it, expect } from "vitest";
import {
  RECOVERY_PROTOCOLS,
  resolveRecoveryProtocols,
  ADAPTATION_BLUNTING,
} from "../../netlify/functions/utils/recovery-protocols.js";

/**
 * Recovery modalities are evidence-graded. The one property that can actively HURT
 * an athlete is deploying cold-water immersion / contrast during an adaptation
 * block — it blunts strength/hypertrophy (Roberts 2015). These lock the
 * context-switch and the "sleep first / no injury-prevention claims" honesty.
 */
describe("resolveRecoveryProtocols: adaptation context-switch", () => {
  it("recovery day: sleep is first, no cold-water immersion (that's a tournament tool)", () => {
    const p = resolveRecoveryProtocols({ dayType: "recovery" });
    expect(p[0].key).toBe("sleep"); // Tier 1 always leads
    const keys = p.map((m) => m.key);
    expect(keys).toContain("active_recovery");
    expect(keys).toContain("foam_rolling");
    expect(keys).not.toContain("cold_water_immersion");
    // static stretching is never prescribed as recovery
    expect(keys).not.toContain("static_stretching");
  });

  it("tournament day: cold-water immersion IS prescribed (restore performance fast)", () => {
    const p = resolveRecoveryProtocols({ dayType: "tournament" });
    expect(p.map((m) => m.key)).toContain("cold_water_immersion");
  });

  it("tournament day INSIDE an adaptation block: CWI + contrast are withheld", () => {
    const p = resolveRecoveryProtocols({
      dayType: "tournament",
      phase: "adaptation",
    });
    const keys = p.map((m) => m.key);
    expect(keys).not.toContain("cold_water_immersion");
    expect(keys).not.toContain("contrast_therapy");
  });

  it("a strength/power session earlier today withholds the adaptation-blunting tools", () => {
    const p = resolveRecoveryProtocols({
      dayType: "tournament",
      hadAdaptationSessionToday: true,
    });
    for (const k of ADAPTATION_BLUNTING) {
      expect(p.map((m) => m.key)).not.toContain(k);
    }
  });
});

describe("recovery catalogue honesty", () => {
  it("NO modality claims injury prevention (only strength/proprioception do)", () => {
    for (const m of Object.values(RECOVERY_PROTOCOLS)) {
      expect(m.injuryPrevention).toBe(false);
    }
  });

  it("static stretching is tagged not-recovery (no context, avoids recovery/rest)", () => {
    const s = RECOVERY_PROTOCOLS.static_stretching;
    expect(s.contexts).toEqual([]);
    expect(s.avoidWhen).toEqual(expect.arrayContaining(["recovery", "rest"]));
  });

  it("massage carries the debunked lactate-flush note", () => {
    expect(RECOVERY_PROTOCOLS.massage.debunked).toMatch(/flush|blood flow/i);
  });
});
