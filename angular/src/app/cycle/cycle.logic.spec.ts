import { describe, it, expect } from "vitest";
import {
  estimateCycle,
  FORBIDDEN_CYCLE_ADVICE,
  type CycleLog,
  type CycleProfile,
} from "./cycle.logic";

const DAY = 86_400_000;

function profile(over: Partial<CycleProfile> = {}): CycleProfile {
  return {
    enabled: true,
    hormonalContraception: false,
    adaptationLevel: "inform",
    typicalCycleLength: null,
    typicalPeriodLength: null,
    ...over,
  };
}

function iso(offsetDaysFromToday: number): string {
  return new Date(Date.now() + offsetDaysFromToday * DAY)
    .toISOString()
    .slice(0, 10);
}

/** Build period-start bleed logs at the given day-offsets (each 4 bleed days). */
function periods(startOffsets: number[]): CycleLog[] {
  const logs: CycleLog[] = [];
  for (const s of startOffsets) {
    for (let d = 0; d < 4; d++) {
      logs.push({ date: iso(s + d), flow: "medium", symptoms: [] });
    }
  }
  return logs;
}

describe("estimateCycle", () => {
  it("returns null phase and no message when the module is disabled", () => {
    const r = estimateCycle([], profile({ enabled: false }), iso(0));
    expect(r.phase).toBeNull();
    expect(r.message).toBe("");
  });

  it("hormonal contraception → phase null (never fabricates a suppressed cycle)", () => {
    const r = estimateCycle(
      periods([-56, -28, 0]),
      profile({ hormonalContraception: true }),
      iso(0),
    );
    expect(r.phase).toBeNull();
    expect(r.message).toMatch(/contraception/i);
  });

  it("no logs → null phase, invites logging, low confidence", () => {
    const r = estimateCycle([], profile(), iso(0));
    expect(r.phase).toBeNull();
    expect(r.confidence).toBe("low");
  });

  it("a logged bleed today → menstrual as a FACT (not tentative)", () => {
    const logs = periods([-56, -28, 0]);
    const r = estimateCycle(logs, profile(), iso(0));
    expect(r.phase).toBe("menstrual");
    expect(r.tentative).toBe(false);
  });

  it("with ≥3 logged cycles, mid-cycle estimates the phase at higher confidence", () => {
    // periods at -84,-56,-28,0 → 3 observed 28-day cycles; check day ~14 of a new cycle
    const logs = periods([-84, -56, -28]);
    const r = estimateCycle(logs, profile(), iso(-28 + 13)); // ~day 14
    expect(r.cycleLength).toBe(28);
    expect(["follicular", "ovulatory"]).toContain(r.phase);
    expect(r.tentative).toBe(true); // estimated, not logged
    expect(r.confidence).not.toBe("low");
  });

  it("fewer than 2 logged cycles → low confidence and tentative (no textbook-28 certainty)", () => {
    const logs = periods([-28, 0]); // only 1 observed cycle
    const r = estimateCycle(logs, profile(), iso(-28 + 20));
    expect(r.confidence).toBe("low");
    expect(r.tentative).toBe(true);
  });

  it("ovulatory confidence never exceeds medium (no physiological measurement)", () => {
    const logs = periods([-112, -84, -56, -28]); // 4 cycles → would be 'high'
    const r = estimateCycle(logs, profile(), iso(-28 + 13)); // ~day 14 ≈ ovulation (28-14)
    if (r.phase === "ovulatory") {
      expect(r.confidence).not.toBe("high");
    }
  });

  it("predicts the next period from the last start + cycle length", () => {
    const logs = periods([-56, -28, 0]);
    const r = estimateCycle(logs, profile(), iso(0));
    expect(r.nextPeriodDate).toBe(iso(28));
  });

  it("derives cycle length from the athlete's own cycles, not a textbook default", () => {
    // 31-day cycles
    const logs = periods([-62, -31, 0]);
    const r = estimateCycle(logs, profile(), iso(0));
    expect(r.cycleLength).toBe(31);
  });

  it("NEVER prescribes or restricts training in any phase message (inform-only)", () => {
    const scenarios: string[][] = [
      [], // disabled/empty handled above; here exercise real phases
    ];
    void scenarios;
    const logs = periods([-84, -56, -28]);
    for (let d = 0; d < 28; d++) {
      const r = estimateCycle(logs, profile(), iso(-28 + d));
      expect(
        FORBIDDEN_CYCLE_ADVICE.test(r.message),
        `${r.phase}: ${r.message}`,
      ).toBe(false);
    }
    // and the contraception + empty messages
    expect(
      FORBIDDEN_CYCLE_ADVICE.test(
        estimateCycle(logs, profile({ hormonalContraception: true }), iso(0))
          .message,
      ),
    ).toBe(false);
  });
});
