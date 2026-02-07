/**
 * Next-Gen Athlete Monitoring Metrics (Phase 1 utilities)
 * Pure calculation helpers with deterministic outputs.
 */

export type NextGenRiskLevel = "low" | "moderate" | "high" | "critical";
export type NextGenDataMode = "baseline" | "reduced" | "insufficient_data";

export interface NextGenWorkloadEntry {
  date: string; // YYYY-MM-DD
  load: number;
}

export interface NextGenWellnessSnapshot {
  sleepQuality?: number; // 1-10
  energy?: number; // 1-10
  stress?: number; // 1-10 (higher = worse)
  soreness?: number; // 1-10 (higher = worse)
  fatigue?: number; // 1-10 (higher = worse)
}

export interface NextGenWellnessScoreResult {
  score: number | null; // 0-100
  includedMetrics: number;
}

export interface NextGenLoadSpikeResult {
  acuteLoad: number;
  priorLoad: number;
  spikePct: number | null;
  spikeDetected: boolean;
  wellnessScore: number | null;
  riskLevel: NextGenRiskLevel;
}

export interface NextGenBaselineStats {
  mean: number;
  stdDev: number;
  samples: number;
}

export interface NextGenReadinessInput {
  wellnessScore?: number; // 0-100
  sleepHours?: number; // hours
  energyScore?: number; // 0-100
  performanceScore?: number; // 0-100
  baselines?: {
    wellness?: NextGenBaselineStats;
    sleepHours?: NextGenBaselineStats;
    energyScore?: NextGenBaselineStats;
    performanceScore?: NextGenBaselineStats;
  };
}

export interface NextGenReadinessResult {
  score: number;
  dataMode: NextGenDataMode;
  components: {
    wellness?: number;
    sleep?: number;
    energy?: number;
    performance?: number;
  };
}

export interface NextGenLbmEntry {
  date: string; // YYYY-MM-DD
  lbm: number; // kg
}

export interface NextGenLbmTrendResult {
  current?: number;
  prior?: number;
  change?: number;
  changePct?: number;
  trend: "loss" | "stable" | "gain" | "insufficient_data";
  alert: boolean;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const toDate = (dateStr: string): Date => new Date(`${dateStr}T12:00:00Z`);

const dayDiff = (from: Date, to: Date): number => {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};

const normalize10 = (value: number): number => clamp((value / 10) * 100, 0, 100);

const zScore = (value: number, baseline?: NextGenBaselineStats): number | null => {
  if (!baseline || baseline.samples < 5 || baseline.stdDev <= 0) return null;
  return (value - baseline.mean) / baseline.stdDev;
};

/**
 * Compute wellness score from subjective metrics.
 * Uses inverted values for stress/soreness/fatigue.
 */
export const nextGen_computeWellnessScore = (
  snapshot: NextGenWellnessSnapshot,
): NextGenWellnessScoreResult => {
  const values: number[] = [];
  if (snapshot.sleepQuality !== undefined) {
    values.push(normalize10(snapshot.sleepQuality));
  }
  if (snapshot.energy !== undefined) {
    values.push(normalize10(snapshot.energy));
  }
  if (snapshot.stress !== undefined) {
    values.push(normalize10(10 - snapshot.stress));
  }
  if (snapshot.soreness !== undefined) {
    values.push(normalize10(10 - snapshot.soreness));
  }
  if (snapshot.fatigue !== undefined) {
    values.push(normalize10(10 - snapshot.fatigue));
  }

  if (values.length < 2) {
    return { score: null, includedMetrics: values.length };
  }

  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return { score: Math.round(avg * 10) / 10, includedMetrics: values.length };
};

/**
 * Compute acute vs prior week load spike and integrate wellness.
 * Spike threshold: > 15% increase week-over-week.
 */
export const nextGen_computeLoadSpike = (
  entries: NextGenWorkloadEntry[],
  referenceDate: Date = new Date(),
  wellness?: NextGenWellnessSnapshot,
): NextGenLoadSpikeResult => {
  const acuteDays = entries.filter((entry) => {
    const diff = dayDiff(toDate(entry.date), referenceDate);
    return diff >= 0 && diff <= 6;
  });
  const priorDays = entries.filter((entry) => {
    const diff = dayDiff(toDate(entry.date), referenceDate);
    return diff >= 7 && diff <= 13;
  });

  const acuteLoad = Math.round(
    acuteDays.reduce((sum, entry) => sum + (entry.load || 0), 0),
  );
  const priorLoad = Math.round(
    priorDays.reduce((sum, entry) => sum + (entry.load || 0), 0),
  );

  const spikePct = priorLoad > 0 ? (acuteLoad - priorLoad) / priorLoad : null;
  const spikeDetected =
    priorLoad > 0 ? spikePct !== null && spikePct > 0.15 : acuteLoad > 0;

  const wellnessResult = wellness
    ? nextGen_computeWellnessScore(wellness)
    : { score: null, includedMetrics: 0 };

  const wellnessScore = wellnessResult.score;

  let riskLevel: NextGenRiskLevel = "low";
  if (spikeDetected || (wellnessScore !== null && wellnessScore < 70)) {
    riskLevel = "moderate";
  }
  if (
    (spikePct !== null && spikePct > 0.3) ||
    (spikeDetected && wellnessScore !== null && wellnessScore < 60)
  ) {
    riskLevel = "high";
  }
  if (
    (spikePct !== null && spikePct > 0.5) ||
    (spikeDetected && wellnessScore !== null && wellnessScore < 50)
  ) {
    riskLevel = "critical";
  }

  return {
    acuteLoad,
    priorLoad,
    spikePct: spikePct !== null ? Math.round(spikePct * 1000) / 1000 : null,
    spikeDetected,
    wellnessScore,
    riskLevel,
  };
};

/**
 * Baseline-aware readiness scoring.
 * Uses baseline z-score deviations where available.
 */
export const nextGen_computeReadinessScore = (
  input: NextGenReadinessInput,
): NextGenReadinessResult => {
  const components: NextGenReadinessResult["components"] = {};
  const baselines = input.baselines;

  const wellnessZ =
    input.wellnessScore !== undefined
      ? zScore(input.wellnessScore, baselines?.wellness)
      : null;
  const sleepZ =
    input.sleepHours !== undefined
      ? zScore(input.sleepHours, baselines?.sleepHours)
      : null;
  const energyZ =
    input.energyScore !== undefined
      ? zScore(input.energyScore, baselines?.energyScore)
      : null;
  const perfZ =
    input.performanceScore !== undefined
      ? zScore(input.performanceScore, baselines?.performanceScore)
      : null;

  const baselineAvailable =
    wellnessZ !== null || sleepZ !== null || energyZ !== null || perfZ !== null;

  if (baselineAvailable) {
    const zWeights = {
      wellness: 0.45,
      sleep: 0.25,
      energy: 0.1,
      performance: 0.2,
    };
    const weightedZ =
      (wellnessZ ?? 0) * zWeights.wellness +
      (sleepZ ?? 0) * zWeights.sleep +
      (energyZ ?? 0) * zWeights.energy +
      (perfZ ?? 0) * zWeights.performance;

    if (input.wellnessScore !== undefined) {
      components.wellness = clamp(
        Math.round((50 + (wellnessZ ?? 0) * 10) * 10) / 10,
        0,
        100,
      );
    }
    if (input.sleepHours !== undefined) {
      components.sleep = clamp(
        Math.round((50 + (sleepZ ?? 0) * 10) * 10) / 10,
        0,
        100,
      );
    }
    if (input.energyScore !== undefined) {
      components.energy = clamp(
        Math.round((50 + (energyZ ?? 0) * 10) * 10) / 10,
        0,
        100,
      );
    }
    if (input.performanceScore !== undefined) {
      components.performance = clamp(
        Math.round((50 + (perfZ ?? 0) * 10) * 10) / 10,
        0,
        100,
      );
    }

    const score = clamp(Math.round((70 + weightedZ * 10) * 10) / 10, 0, 100);
    return {
      score,
      dataMode: "baseline",
      components,
    };
  }

  if (
    input.sleepHours !== undefined &&
    input.energyScore !== undefined &&
    input.sleepHours > 0
  ) {
    const sleepNorm = clamp((input.sleepHours / 10) * 100, 0, 100);
    const energyNorm = clamp(input.energyScore, 0, 100);
    components.sleep = Math.round(sleepNorm * 10) / 10;
    components.energy = Math.round(energyNorm * 10) / 10;
    const score = Math.round(((sleepNorm + energyNorm) / 2) * 10) / 10;
    return { score, dataMode: "reduced", components };
  }

  return { score: 0, dataMode: "insufficient_data", components };
};

/**
 * Lean body mass trend detection.
 * Uses closest value to ~30 days prior within a 7-day window.
 */
export const nextGen_computeLbmTrend = (
  entries: NextGenLbmEntry[],
  referenceDate?: Date,
): NextGenLbmTrendResult => {
  if (entries.length < 2) {
    return { trend: "insufficient_data", alert: false };
  }

  const sorted = [...entries].sort(
    (a, b) => toDate(b.date).getTime() - toDate(a.date).getTime(),
  );
  const current = sorted[0];
  const currentDate = referenceDate ? referenceDate : toDate(current.date);
  const targetDate = new Date(currentDate);
  targetDate.setDate(targetDate.getDate() - 30);

  const prior = sorted.find((entry) => {
    const diff = Math.abs(dayDiff(toDate(entry.date), targetDate));
    return diff <= 7;
  });

  if (!prior) {
    return { current: current.lbm, trend: "insufficient_data", alert: false };
  }

  const change = current.lbm - prior.lbm;
  const changePct = (change / prior.lbm) * 100;
  const isLoss = changePct <= -1 || change <= -0.5;
  const isGain = changePct >= 1 || change >= 0.5;

  return {
    current: current.lbm,
    prior: prior.lbm,
    change: Math.round(change * 10) / 10,
    changePct: Math.round(changePct * 10) / 10,
    trend: isLoss ? "loss" : isGain ? "gain" : "stable",
    alert: isLoss,
  };
};
