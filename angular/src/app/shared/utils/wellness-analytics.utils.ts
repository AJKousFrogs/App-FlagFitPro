/**
 * Pure wellness analytics functions — no DI, no Supabase, no Angular state.
 * Extracted from WellnessService so the scoring/trend math is independently
 * testable and the service can stay focused on data access + realtime sync.
 */
import { STATUS_HEX_COLORS } from "../../core/utils/design-tokens.util";
import type {
  WellnessAverages,
  WellnessData,
} from "../../core/services/wellness.service";

/**
 * Parse a timeframe string (e.g. '7d', '2w', '3m', '1y') to a number of days.
 * @example
 * parseTimeframe('2w') // 14
 */
export function parseTimeframe(timeframe: string): number {
  const match = timeframe.match(/^(\d+)([dmyw])$/);
  if (!match) return 30; // Default to 30 days

  const [, num, unit] = match;
  const value = parseInt(num, 10);

  switch (unit) {
    case "d":
      return value;
    case "w":
      return value * 7;
    case "m":
      return value * 30;
    case "y":
      return value * 365;
    default:
      return 30;
  }
}

/**
 * Calculate per-metric averages across a list of wellness entries.
 */
export function calculateAverages(data: WellnessData[]): WellnessAverages {
  if (data.length === 0) {
    return {};
  }

  const sums = {
    sleep: 0,
    energy: 0,
    stress: 0,
    soreness: 0,
    motivation: 0,
    mood: 0,
    hydration: 0,
  };
  const counts = { ...sums };

  data.forEach((entry) => {
    if (entry.sleep !== undefined && !Number.isNaN(entry.sleep)) {
      sums.sleep += entry.sleep;
      counts.sleep++;
    }
    if (entry.energy !== undefined && !Number.isNaN(entry.energy)) {
      sums.energy += entry.energy;
      counts.energy++;
    }
    if (entry.stress !== undefined && !Number.isNaN(entry.stress)) {
      sums.stress += entry.stress;
      counts.stress++;
    }
    if (entry.soreness !== undefined && !Number.isNaN(entry.soreness)) {
      sums.soreness += entry.soreness;
      counts.soreness++;
    }
    if (entry.motivation !== undefined && !Number.isNaN(entry.motivation)) {
      sums.motivation += entry.motivation;
      counts.motivation++;
    }
    if (entry.mood !== undefined && !Number.isNaN(entry.mood)) {
      sums.mood += entry.mood;
      counts.mood++;
    }
    if (entry.hydration !== undefined && !Number.isNaN(entry.hydration)) {
      sums.hydration += entry.hydration;
      counts.hydration++;
    }
  });

  return {
    sleep:
      counts.sleep > 0
        ? Math.round((sums.sleep / counts.sleep) * 10) / 10
        : undefined,
    energy:
      counts.energy > 0
        ? Math.round((sums.energy / counts.energy) * 10) / 10
        : undefined,
    stress:
      counts.stress > 0
        ? Math.round((sums.stress / counts.stress) * 10) / 10
        : undefined,
    soreness:
      counts.soreness > 0
        ? Math.round((sums.soreness / counts.soreness) * 10) / 10
        : undefined,
    motivation:
      counts.motivation > 0
        ? Math.round((sums.motivation / counts.motivation) * 10) / 10
        : undefined,
    mood:
      counts.mood > 0
        ? Math.round((sums.mood / counts.mood) * 10) / 10
        : undefined,
    hydration:
      counts.hydration > 0
        ? Math.round((sums.hydration / counts.hydration) * 10) / 10
        : undefined,
  };
}

/**
 * Quick client-side wellness score (average of all logged metrics, 0-10).
 * For the full evidence-based readiness score, use ReadinessService.calculateToday().
 */
export function getWellnessScore(data: WellnessData): number {
  // Clamp inverted metrics to [1,10] before inverting to prevent negative scores
  // from out-of-range data (e.g. stress=15 would otherwise produce -5)
  const clamp = (v: number) => Math.min(10, Math.max(1, v));
  const metrics = [
    data.sleep,
    data.energy,
    data.stress !== undefined && data.stress !== null
      ? 10 - clamp(data.stress)
      : undefined,
    data.soreness !== undefined && data.soreness !== null
      ? 10 - clamp(data.soreness)
      : undefined,
    data.motivation,
    data.mood,
    data.hydration,
  ].filter(
    (m): m is number => m !== undefined && m !== null && !Number.isNaN(m),
  );

  if (metrics.length === 0) return 0;

  const sum = metrics.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / metrics.length) * 10) / 10;
}

/**
 * Map a wellness score (0-10) to a status band, brand color, and message.
 */
export function getWellnessStatus(score: number): {
  status: "excellent" | "good" | "fair" | "poor";
  color: string;
  message: string;
} {
  if (score >= 8) {
    return {
      status: "excellent",
      color: STATUS_HEX_COLORS.success, // var(--good) (brand mint)
      message: "Your wellness is excellent! Keep up the great work.",
    };
  } else if (score >= 6) {
    return {
      status: "good",
      color: STATUS_HEX_COLORS.info, // var(--info) (blue)
      message:
        "Your wellness is good. Small improvements can make a big difference.",
    };
  } else if (score >= 4) {
    return {
      status: "fair",
      color: STATUS_HEX_COLORS.warning, // var(--warn) (amber)
      message: "Your wellness needs attention. Focus on recovery and rest.",
    };
  } else {
    return {
      status: "poor",
      color: STATUS_HEX_COLORS.error, // var(--danger) (red)
      message:
        "Your wellness is concerning. Consider taking a rest day and consulting a coach.",
    };
  }
}

/**
 * Plain-language recommendations derived from a single wellness entry.
 */
export function getRecommendations(entry: WellnessData): string[] {
  const recs: string[] = [];

  if (entry.sleep !== undefined && entry.sleep < 5) {
    recs.push("Prioritize sleep — aim for 7–9 hours tonight.");
  }
  if (entry.energy !== undefined && entry.energy < 5) {
    recs.push(
      "Low energy detected — consider rest and lighter activity today.",
    );
  }
  if (entry.stress !== undefined && entry.stress > 7) {
    recs.push(
      "High stress levels — try breathing exercises or stress management techniques.",
    );
  }
  if (entry.soreness !== undefined && entry.soreness > 7) {
    recs.push(
      "High soreness — prioritize recovery, foam rolling, and reduced intensity.",
    );
  }
  if (entry.hydration !== undefined && entry.hydration < 5) {
    recs.push("Drink more water — target at least 2–3 litres today.");
  }
  if (entry.motivation !== undefined && entry.motivation < 5) {
    recs.push(
      "Motivation is low — vary your training or try a fun drill session.",
    );
  }

  if (recs.length === 0) {
    recs.push("Great wellness scores — keep up the great work!");
  }

  return recs;
}

/**
 * Compare the first half (recent) vs second half (older) of a wellness data
 * window per metric to classify a trend direction.
 */
export function getWellnessTrends(
  data: WellnessData[],
): { metric: string; trend: "improving" | "declining" | "stable" }[] {
  if (data.length < 2) return [];

  const mid = Math.ceil(data.length / 2);
  const recent = data.slice(0, mid);
  const older = data.slice(mid);

  const invertedMetrics = new Set(["stress", "soreness"]);
  const metrics: (keyof WellnessData)[] = [
    "sleep",
    "energy",
    "stress",
    "soreness",
    "mood",
    "hydration",
    "motivation",
  ];

  const avg = (entries: WellnessData[], key: keyof WellnessData) => {
    const vals = entries
      .map((e) => e[key] as number | undefined)
      .filter((v): v is number => v !== undefined);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  const results: {
    metric: string;
    trend: "improving" | "declining" | "stable";
  }[] = [];

  for (const metric of metrics) {
    const recentAvg = avg(recent, metric);
    const olderAvg = avg(older, metric);

    if (recentAvg === null || olderAvg === null) continue;

    const diff = recentAvg - olderAvg;
    const THRESHOLD = 0.5;

    let trend: "improving" | "declining" | "stable";
    if (Math.abs(diff) < THRESHOLD) {
      trend = "stable";
    } else if (invertedMetrics.has(metric)) {
      trend = diff < 0 ? "improving" : "declining";
    } else {
      trend = diff > 0 ? "improving" : "declining";
    }

    results.push({ metric: metric as string, trend });
  }

  return results;
}
