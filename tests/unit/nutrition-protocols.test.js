import { describe, it, expect } from "vitest";
import {
  betweenGamesRefuel,
  caffeineSleepGuardrail,
  supplementContaminationRisk,
  BATCH_TESTED_IMPERATIVE,
} from "../../netlify/functions/utils/nutrition-protocols.js";

describe("betweenGamesRefuel — tournament recovery windows", () => {
  it("scales per kg, not a flat number (100 kg > 60 kg)", () => {
    const light = betweenGamesRefuel({ weightKg: 60, hoursUntilNextGame: 3 });
    const heavy = betweenGamesRefuel({ weightKg: 100, hoursUntilNextGame: 3 });
    expect(heavy.carbs_g).toBeGreaterThan(light.carbs_g);
    expect(heavy.protein_g).toBeGreaterThan(light.protein_g);
    // 60 kg @ 1.0 g/kg/h over 3 h = 180 g carbs; 0.3 g/kg = 18 g protein
    expect(light.carbs_g).toBe(180);
    expect(light.protein_g).toBe(18);
  });

  it("caps the aggressive carb window at 4 h (a 6 h gap is not 6× carbs)", () => {
    const four = betweenGamesRefuel({ weightKg: 80, hoursUntilNextGame: 4 });
    const six = betweenGamesRefuel({ weightKg: 80, hoursUntilNextGame: 6 });
    expect(six.carbs_g).toBe(four.carbs_g); // window capped
    expect(six.windowHours).toBe(6);
  });

  it("picks a GI-safe strategy by gap length", () => {
    expect(
      betweenGamesRefuel({ weightKg: 80, hoursUntilNextGame: 1 }).strategy,
    ).toBe("short");
    expect(
      betweenGamesRefuel({ weightKg: 80, hoursUntilNextGame: 3 }).strategy,
    ).toBe("medium");
    expect(
      betweenGamesRefuel({ weightKg: 80, hoursUntilNextGame: 6 }).strategy,
    ).toBe("long");
  });

  it("rejects nonsense input", () => {
    expect(
      betweenGamesRefuel({ weightKg: 10, hoursUntilNextGame: 3 }),
    ).toBeNull();
    expect(
      betweenGamesRefuel({ weightKg: 80, hoursUntilNextGame: 0 }),
    ).toBeNull();
    expect(betweenGamesRefuel({})).toBeNull();
  });
});

describe("caffeineSleepGuardrail — one night's sleep beats a marginal bump", () => {
  it("recommends caffeine for an afternoon game (sleep protected)", () => {
    const r = caffeineSleepGuardrail({
      weightKg: 80,
      gameStartHour: 14,
      bedtimeHour: 23,
    });
    expect(r.recommend).toBe(true);
    expect(r.protectsSleep).toBe(true);
    // 3–6 mg/kg for 80 kg = 240–480 mg
    expect(r.doseMgLow).toBe(240);
    expect(r.doseMgHigh).toBe(480);
    expect(r.warning).toBeNull();
  });

  it("WITHHOLDS caffeine for a late evening game (would wreck sleep)", () => {
    const r = caffeineSleepGuardrail({
      weightKg: 80,
      gameStartHour: 20,
      bedtimeHour: 23,
    });
    expect(r.recommend).toBe(false);
    expect(r.protectsSleep).toBe(false);
    expect(r.doseMgLow).toBe(0);
    expect(r.warning).toMatch(/sleep/i);
  });

  it("handles an after-midnight bedtime (1 am) without going negative", () => {
    const r = caffeineSleepGuardrail({
      weightKg: 80,
      gameStartHour: 19,
      bedtimeHour: 1, // 1 am → treated as +24
    });
    // take at 18:00, bed at 25:00 → 7 h → protected
    expect(r.hoursBeforeBed).toBe(7);
    expect(r.recommend).toBe(true);
  });

  it("rejects nonsense input", () => {
    expect(
      caffeineSleepGuardrail({ weightKg: 5, gameStartHour: 14 }),
    ).toBeNull();
    expect(
      caffeineSleepGuardrail({ weightKg: 80, gameStartHour: 30 }),
    ).toBeNull();
  });
});

describe("supplementContaminationRisk — strict-liability batch-testing", () => {
  it("flags pre-workouts / 'test boosters' as HIGH risk", () => {
    expect(supplementContaminationRisk("Extreme Pre-Workout").risk).toBe(
      "high",
    );
    expect(supplementContaminationRisk("Test Booster 9000").risk).toBe("high");
    expect(
      supplementContaminationRisk("proprietary blend fat burner").risk,
    ).toBe("high");
  });

  it("rates single reputable ingredients LOW (but still batch-test)", () => {
    expect(supplementContaminationRisk("Creatine Monohydrate").risk).toBe(
      "low",
    );
    expect(supplementContaminationRisk("Vitamin D3").risk).toBe("low");
  });

  it("treats unknown / multi-ingredient as MODERATE", () => {
    expect(supplementContaminationRisk("Mystery Recovery Complex").risk).toBe(
      "moderate",
    );
  });

  it("ALWAYS requires batch testing, regardless of tier", () => {
    for (const name of [
      "Creatine Monohydrate",
      "Pre-Workout",
      "Random Blend",
    ]) {
      expect(supplementContaminationRisk(name).batchTestedRequired).toBe(true);
    }
    expect(BATCH_TESTED_IMPERATIVE).toMatch(/Informed Sport|NSF/);
  });
});
