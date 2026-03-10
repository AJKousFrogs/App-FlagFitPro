import { COLORS } from "../constants/app.constants";
import { WELLNESS } from "../constants/wellness.constants";
import type { SmartRecommendationsResponse, TrainingSessionRecord } from "../models/api.models";
import type {
  Achievement,
  ReadinessStatus,
  TrainingStatCard,
  WellnessAlert,
} from "../models/training.models";

interface WellnessCheckinRecord {
  sleep_quality?: number;
  sleep?: number;
  energy_level?: number;
  energy?: number;
  stress_level?: number;
  stress?: number;
  soreness_level?: number;
  soreness?: number;
  motivation_level?: number;
  motivation?: number;
}

interface TrainingInsightInput {
  recommendations?: SmartRecommendationsResponse;
  acwr: number | null;
  readiness: number | null;
  hydration: number;
  userName: string;
  aiRationale?: string | null;
  streakValue?: string | null;
}

export function calculateReadinessScoreFromWellness(
  wellness: WellnessCheckinRecord,
): number | null {
  const sleep = wellness.sleep_quality ?? wellness.sleep ?? null;
  const energy = wellness.energy_level ?? wellness.energy ?? null;
  const stress = wellness.stress_level ?? wellness.stress ?? null;
  const soreness = wellness.soreness_level ?? wellness.soreness ?? null;

  if (sleep === null || energy === null) {
    return null;
  }

  const sleepScore = (sleep / 10) * 100;
  const energyScore = (energy / 10) * 100;
  const hasStress = stress !== null;
  const hasSoreness = soreness !== null;

  let score: number;
  if (hasStress && hasSoreness) {
    const stressScore = ((10 - stress) / 10) * 100;
    const sorenessScore = ((10 - soreness) / 10) * 100;
    score =
      sleepScore * 0.3 +
      energyScore * 0.25 +
      stressScore * 0.25 +
      sorenessScore * 0.2;
  } else if (hasStress) {
    const stressScore = ((10 - stress) / 10) * 100;
    score = sleepScore * 0.375 + energyScore * 0.3125 + stressScore * 0.3125;
  } else if (hasSoreness) {
    const sorenessScore = ((10 - soreness) / 10) * 100;
    score = sleepScore * 0.4 + energyScore * 0.333 + sorenessScore * 0.267;
  } else {
    score = sleepScore * 0.55 + energyScore * 0.45;
  }

  return Math.round(Math.max(0, Math.min(100, score)));
}

export function getReadinessStatusFromScore(score: number): ReadinessStatus {
  if (score >= WELLNESS.READINESS_EXCELLENT) return "excellent";
  if (score >= WELLNESS.READINESS_GOOD) return "good";
  if (score >= WELLNESS.READINESS_MODERATE) return "caution";
  return "rest";
}

export function generateWellnessAlertFromStatus(
  status: ReadinessStatus,
): WellnessAlert | null {
  if (status === "rest") {
    return {
      severity: "critical",
      message: "Your body needs rest. Consider light recovery work today.",
      recommendations: ["Focus on sleep", "Light stretching", "Proper hydration"],
      icon: "pi-exclamation-triangle",
    };
  }

  if (status === "caution") {
    return {
      severity: "warning",
      message: "Signs of fatigue detected. Train with caution.",
      recommendations: ["Reduce intensity 20%", "Extra warm-up"],
      icon: "pi-info-circle",
    };
  }

  return null;
}

export function calculateTrainingStreak(
  sessions: TrainingSessionRecord[],
): number {
  if (sessions.length === 0) return 0;

  const validDates = sessions
    .map((s) => s.session_date || s.date)
    .filter((d): d is string => {
      if (!d) return false;
      const dateObj = new Date(d);
      return !Number.isNaN(dateObj.getTime());
    })
    .map((d) => new Date(d).toISOString().split("T")[0]);

  if (validDates.length === 0) return 0;

  const uniqueDates = [...new Set(validDates)].sort().reverse();
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;

  let streak = 0;
  for (let i = 0; i < uniqueDates.length; i++) {
    const expected = new Date();
    expected.setDate(expected.getDate() - i);
    if (uniqueDates[i] === expected.toISOString().split("T")[0]) streak++;
    else break;
  }
  return streak;
}

export function calculateTrainingStatsFromSessions(
  sessions: TrainingSessionRecord[],
  isThisWeek: (date: Date) => boolean,
): TrainingStatCard[] {
  const thisWeek = sessions.filter((s) => {
    const dateStr = s.session_date || s.date;
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return !Number.isNaN(date.getTime()) && isThisWeek(date);
  });
  const totalDuration = thisWeek.reduce((sum, s) => sum + (s.duration ?? 0), 0);
  const streak = calculateTrainingStreak(sessions);

  return [
    {
      label: "This Week",
      value: `${thisWeek.length} sessions`,
      icon: "pi-calendar",
      color: COLORS.BLUE,
      trend: "Active",
      trendType: "neutral",
    },
    {
      label: "Total Duration",
      value: `${totalDuration} min`,
      icon: "pi-clock",
      color: COLORS.SUCCESS,
      trend: "This week",
      trendType: "neutral",
    },
    {
      label: "Current Streak",
      value: `${streak} days`,
      icon: "pi-bolt",
      color: COLORS.ERROR,
      trend: "Keep it up!",
      trendType: "positive",
    },
  ];
}

export function loadAchievementsForProgress(
  streak: number,
  total: number,
): Achievement[] {
  const list: Achievement[] = [];
  if (streak >= 7) {
    list.push({
      icon: "pi-bolt",
      title: "7-Day Streak",
      date: new Date().toISOString(),
      level: "bronze",
    });
  }
  if (total >= 10) {
    list.push({
      icon: "pi-check-circle",
      title: "10 Sessions",
      date: new Date().toISOString(),
      level: "bronze",
    });
  }
  return list;
}

export function generateTrainingInsight(input: TrainingInsightInput): string {
  const {
    recommendations,
    acwr,
    readiness,
    hydration,
    userName,
    aiRationale,
    streakValue,
  } = input;

  if (recommendations) {
    if (recommendations.overallStatus === "injured") {
      return `Hey ${userName}, let's take it easy. ${recommendations.warnings[0] || "Focus on recovery exercises today."}`;
    }
    if (recommendations.overallStatus === "caution") {
      return `Watch out, ${userName}! ${recommendations.warnings[0] || "Your training load is high. Reduce intensity to stay safe."}`;
    }
    if (recommendations.overallStatus === "taper") {
      return `Tournament mode on! ${recommendations.suggestions[0] || "Keep intensity high but volume low."}`;
    }
  }

  if (acwr !== null && acwr > 1.5) {
    return `Your injury risk is very high (ACWR: ${acwr.toFixed(2)}). Merlin recommends immediate rest today.`;
  }
  if (readiness !== null && readiness < 40) {
    return `Readiness is low (${readiness}%). Focus heavily on recovery and extra sleep tonight.`;
  }
  if (hydration < 5 && hydration > 0) {
    return "You're a bit dehydrated. Drink 500ml of water before you start your session.";
  }
  if (aiRationale) {
    return aiRationale;
  }
  if (streakValue && parseInt(streakValue, 10) >= 3) {
    return `${streakValue} streak! You're building amazing momentum, ${userName}. Keep it rolling!`;
  }
  if (readiness !== null && readiness > 80 && acwr !== null && acwr < 1.3) {
    return "Physiological green light! You're perfectly primed for a high-intensity session.";
  }
  return "Consistency is your superpower. Follow today's protocol to stay on track.";
}

export type { WellnessCheckinRecord };
