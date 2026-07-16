import { describe, it, expect } from "vitest";
import { SCENARIOS, runScenario } from "./engine-inspector.presets";

describe("engine-inspector presets", () => {
  it("every scenario runs the real engine and returns a 7-day plan", () => {
    for (const s of SCENARIOS) {
      const r = runScenario(s.key);
      expect(r.week).toHaveLength(7);
      expect(r.scenario.key).toBe(s.key);
    }
  });

  it("heatwave: the WBGT guard stops an outdoor session on a hot day", () => {
    const { week } = runScenario("heatwave");
    expect(
      week.some(
        (d) =>
          d.weatherAdjustment?.applied && d.weatherAdjustment.action === "stop",
      ),
    ).toBe(true);
  });

  it("rtp: the hamstring injury guard holds the whole week at recovery", () => {
    const { week } = runScenario("rtp");
    expect(
      week.every(
        (d) =>
          d.injuryAdjustment?.regions.includes("hamstring") &&
          d.intent === "recovery",
      ),
    ).toBe(true);
  });

  it("travel-low-readiness: day 0 is demoted to recovery", () => {
    const { week } = runScenario("travel-low-readiness");
    expect(week[0].intent).toBe("recovery");
  });

  it("storm-practice: the storm stops the practice-day session (weather over practice)", () => {
    const { week } = runScenario("storm-practice");
    expect(week[2].weatherAdjustment?.applied).toBe(true);
  });

  it("is deterministic — same key, same plan intents", () => {
    const a = runScenario("heatwave").week.map((d) => d.intent);
    const b = runScenario("heatwave").week.map((d) => d.intent);
    expect(a).toEqual(b);
  });
});
