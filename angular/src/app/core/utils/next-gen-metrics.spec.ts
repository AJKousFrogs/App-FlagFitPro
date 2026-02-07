import { describe, expect, it } from "vitest";
import {
  nextGen_computeLbmTrend,
  nextGen_computeLoadSpike,
  nextGen_computeReadinessScore,
  nextGen_computeWellnessScore,
} from "./next-gen-metrics";

describe("nextGen metrics utilities", () => {
  it("computes wellness score with inverted stress/soreness", () => {
    const result = nextGen_computeWellnessScore({
      sleepQuality: 8,
      energy: 7,
      stress: 3,
      soreness: 3,
    });

    expect(result.score).toBeCloseTo(72.5, 1);
    expect(result.includedMetrics).toBe(4);
  });

  it("detects acute load spike with wellness integration", () => {
    const entries = [
      { date: "2026-02-01", load: 100 },
      { date: "2026-02-02", load: 100 },
      { date: "2026-02-03", load: 100 },
      { date: "2026-02-04", load: 100 },
      { date: "2026-02-05", load: 100 },
      { date: "2026-02-06", load: 100 },
      { date: "2026-02-07", load: 100 },
      { date: "2026-01-25", load: 85 },
      { date: "2026-01-26", load: 85 },
      { date: "2026-01-27", load: 85 },
      { date: "2026-01-28", load: 85 },
      { date: "2026-01-29", load: 85 },
      { date: "2026-01-30", load: 85 },
      { date: "2026-01-31", load: 85 },
    ];

    const result = nextGen_computeLoadSpike(
      entries,
      new Date("2026-02-07T12:00:00Z"),
    );

    expect(result.acuteLoad).toBe(700);
    expect(result.priorLoad).toBe(595);
    expect(result.spikeDetected).toBe(true);
    expect(result.spikePct).toBeCloseTo(0.176, 3);
  });

  it("computes baseline-aware readiness score", () => {
    const result = nextGen_computeReadinessScore({
      wellnessScore: 80,
      sleepHours: 8,
      energyScore: 70,
      baselines: {
        wellness: { mean: 70, stdDev: 10, samples: 10 },
        sleepHours: { mean: 7.5, stdDev: 0.5, samples: 10 },
        energyScore: { mean: 65, stdDev: 5, samples: 10 },
      },
    });

    expect(result.dataMode).toBe("baseline");
    expect(result.score).toBeCloseTo(78, 1);
  });

  it("computes LBM trend and flags loss", () => {
    const result = nextGen_computeLbmTrend([
      { date: "2026-02-06", lbm: 59.2 },
      { date: "2026-01-07", lbm: 60.0 },
    ]);

    expect(result.trend).toBe("loss");
    expect(result.alert).toBe(true);
    expect(result.changePct).toBeCloseTo(-1.3, 1);
  });
});
