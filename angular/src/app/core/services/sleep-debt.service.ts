/**
 * Sleep Debt Tracking Service
 *
 * EVIDENCE-BASED SLEEP MONITORING FOR ATHLETIC PERFORMANCE
 *
 * Sleep is one of the most critical factors for athletic recovery and performance.
 * This service tracks cumulative sleep debt and its impact on training capacity.
 *
 * Research Base:
 * - Halson (2014) - Sleep in elite athletes and nutritional interventions
 * - Fullagar et al. (2015) - Sleep and athletic performance
 * - Mah et al. (2011) - The effects of sleep extension on basketball players
 * - Simpson et al. (2017) - Sleep and inflammation
 * - Vitale et al. (2019) - Sleep hygiene for optimizing recovery
 *
 * Key Findings:
 * - Athletes need 7-9 hours of sleep (more than general population)
 * - Sleep debt accumulates and takes multiple nights to recover
 * - Reaction time decreases 300% with sleep deprivation
 * - Injury risk increases 1.7x with <8 hours sleep
 * - HRV decreases significantly with poor sleep
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { LoggerService } from "./logger.service";

// ============================================================================
// INTERFACES
// ============================================================================

export interface SleepEntry {
  date: Date;
  hoursSlept: number;
  quality: number; // 1-10
  bedTime?: string; // HH:MM
  wakeTime?: string; // HH:MM
  interruptions?: number;
  notes?: string;
}

export interface SleepDebtAnalysis {
  last7DaysAverage: number;
  last14DaysAverage: number;
  optimalSleep: number;
  cumulativeDebt: number; // Hours below optimal over 7 days
  debtLevel: "none" | "mild" | "moderate" | "severe" | "critical";
  qualityAverage: number;
  consistencyScore: number; // 0-100 (consistent sleep/wake times)
  trainingImpact: number; // 0-1 multiplier for training capacity
  recoveryImpact: number; // 0-1 multiplier for recovery rate
  injuryRiskMultiplier: number;
  recommendations: string[];
}

export interface SleepTrend {
  direction: "improving" | "stable" | "declining";
  weekOverWeekChange: number; // Hours
  qualityTrend: "improving" | "stable" | "declining";
  message: string;
}

export interface SleepRecommendation {
  priority: "critical" | "high" | "medium" | "low";
  category: "duration" | "quality" | "consistency" | "timing";
  recommendation: string;
  evidenceBase: string;
}

export interface OptimalSleepProfile {
  ageGroup: string;
  optimalHours: number;
  minimumHours: number;
  qualityThreshold: number;
  notes: string;
}

export interface SleepRecoveryPlan {
  currentDebt: number;
  daysToRecover: number;
  targetSleepPerNight: number;
  weeklyPlan: Array<{ day: number; targetHours: number; notes: string }>;
  trainingAdjustments: string[];
}

// ============================================================================
// SLEEP PROFILES BY AGE
// ============================================================================

const SLEEP_PROFILES: Record<string, OptimalSleepProfile> = {
  youth: {
    ageGroup: "Under 18",
    optimalHours: 9,
    minimumHours: 8,
    qualityThreshold: 7,
    notes: "Growing bodies need more sleep for recovery and development",
  },
  young_adult: {
    ageGroup: "18-24",
    optimalHours: 8.5,
    minimumHours: 7.5,
    qualityThreshold: 7,
    notes: "Peak training capacity but still need adequate sleep",
  },
  adult: {
    ageGroup: "25-34",
    optimalHours: 8,
    minimumHours: 7,
    qualityThreshold: 7,
    notes: "Standard adult sleep requirements",
  },
  masters: {
    ageGroup: "35-44",
    optimalHours: 7.5,
    minimumHours: 7,
    qualityThreshold: 7,
    notes: "Sleep quality becomes more important than quantity",
  },
  senior_masters: {
    ageGroup: "45+",
    optimalHours: 7,
    minimumHours: 6.5,
    qualityThreshold: 6,
    notes: "Natural sleep duration decreases but quality remains critical",
  },
};

// ============================================================================
// SLEEP DEBT THRESHOLDS
// ============================================================================

const DEBT_THRESHOLDS = {
  none: 0, // No debt
  mild: 3, // Up to 3 hours debt
  moderate: 7, // 3-7 hours debt
  severe: 14, // 7-14 hours debt
  critical: 21, // 14+ hours debt
};

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: "root",
})
export class SleepDebtService {
  private logger = inject(LoggerService);

  // State
  private readonly _sleepHistory = signal<SleepEntry[]>([]);
  private readonly _currentAnalysis = signal<SleepDebtAnalysis | null>(null);
  private readonly _ageGroup = signal<string>("adult");

  // Public signals
  readonly sleepHistory = this._sleepHistory.asReadonly();
  readonly currentAnalysis = this._currentAnalysis.asReadonly();

  // Computed
  readonly hasDebt = computed(() => {
    const analysis = this._currentAnalysis();
    return analysis ? analysis.debtLevel !== "none" : false;
  });

  readonly isAtRisk = computed(() => {
    const analysis = this._currentAnalysis();
    return analysis
      ? ["severe", "critical"].includes(analysis.debtLevel)
      : false;
  });

  /**
   * Set athlete's age group for optimal sleep calculation
   */
  setAgeGroup(ageGroup: string): void {
    this._ageGroup.set(ageGroup);
  }

  /**
   * Get optimal sleep profile for age group
   */
  getSleepProfile(ageGroup?: string): OptimalSleepProfile {
    const group = ageGroup || this._ageGroup();
    return SLEEP_PROFILES[group] || SLEEP_PROFILES["adult"];
  }

  /**
   * Add sleep entry
   */
  addSleepEntry(entry: SleepEntry): void {
    const history = [...this._sleepHistory(), entry];
    // Keep last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const filtered = history.filter((e) => e.date >= thirtyDaysAgo);
    this._sleepHistory.set(filtered);

    // Recalculate analysis
    this.analyzeSleepDebt();
  }

  /**
   * Set sleep history (e.g., from database)
   */
  setSleepHistory(entries: SleepEntry[]): void {
    this._sleepHistory.set(entries);
    this.analyzeSleepDebt();
  }

  /**
   * Analyze sleep debt based on history
   */
  analyzeSleepDebt(ageGroup?: string): SleepDebtAnalysis {
    const profile = this.getSleepProfile(ageGroup);
    const history = this._sleepHistory();
    const recommendations: string[] = [];

    // Get last 7 and 14 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const last7Days = history.filter((e) => e.date >= sevenDaysAgo);
    const last14Days = history.filter((e) => e.date >= fourteenDaysAgo);

    // Calculate averages
    const last7DaysAverage =
      last7Days.length > 0
        ? last7Days.reduce((sum, e) => sum + e.hoursSlept, 0) / last7Days.length
        : profile.optimalHours;

    const last14DaysAverage =
      last14Days.length > 0
        ? last14Days.reduce((sum, e) => sum + e.hoursSlept, 0) /
          last14Days.length
        : profile.optimalHours;

    const qualityAverage =
      last7Days.length > 0
        ? last7Days.reduce((sum, e) => sum + e.quality, 0) / last7Days.length
        : 7;

    // Calculate cumulative debt
    const cumulativeDebt = Math.max(
      0,
      (profile.optimalHours - last7DaysAverage) * 7,
    );

    // Determine debt level
    let debtLevel: SleepDebtAnalysis["debtLevel"] = "none";
    if (cumulativeDebt >= DEBT_THRESHOLDS.critical) {
      debtLevel = "critical";
    } else if (cumulativeDebt >= DEBT_THRESHOLDS.severe) {
      debtLevel = "severe";
    } else if (cumulativeDebt >= DEBT_THRESHOLDS.moderate) {
      debtLevel = "moderate";
    } else if (cumulativeDebt >= DEBT_THRESHOLDS.mild) {
      debtLevel = "mild";
    }

    // Calculate consistency score
    const consistencyScore = this.calculateConsistencyScore(last7Days);

    // Calculate impact multipliers
    const trainingImpact = this.calculateTrainingImpact(
      last7DaysAverage,
      qualityAverage,
      profile,
    );
    const recoveryImpact = this.calculateRecoveryImpact(
      last7DaysAverage,
      qualityAverage,
      profile,
    );
    const injuryRiskMultiplier = this.calculateInjuryRisk(
      last7DaysAverage,
      profile,
    );

    // Generate recommendations
    if (cumulativeDebt > 0) {
      recommendations.push(
        `Sleep debt of ${cumulativeDebt.toFixed(1)} hours detected - prioritize sleep recovery`,
      );
    }

    if (last7DaysAverage < profile.minimumHours) {
      recommendations.push(
        `Average sleep (${last7DaysAverage.toFixed(1)}h) below minimum (${profile.minimumHours}h) - increase sleep duration`,
      );
    }

    if (qualityAverage < profile.qualityThreshold) {
      recommendations.push(
        `Sleep quality (${qualityAverage.toFixed(1)}/10) below optimal - focus on sleep hygiene`,
      );
    }

    if (consistencyScore < 70) {
      recommendations.push(
        "Inconsistent sleep schedule detected - try to maintain regular bed/wake times",
      );
    }

    if (injuryRiskMultiplier > 1.3) {
      recommendations.push(
        "⚠️ ELEVATED INJURY RISK due to sleep deficit - consider reducing training intensity",
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "Sleep patterns are within healthy range - maintain current habits",
      );
    }

    const analysis: SleepDebtAnalysis = {
      last7DaysAverage,
      last14DaysAverage,
      optimalSleep: profile.optimalHours,
      cumulativeDebt,
      debtLevel,
      qualityAverage,
      consistencyScore,
      trainingImpact,
      recoveryImpact,
      injuryRiskMultiplier,
      recommendations,
    };

    this._currentAnalysis.set(analysis);
    return analysis;
  }

  /**
   * Calculate consistency score based on bed/wake time variance
   */
  private calculateConsistencyScore(entries: SleepEntry[]): number {
    if (entries.length < 3) return 100; // Not enough data

    // Calculate variance in sleep duration
    const durations = entries.map((e) => e.hoursSlept);
    const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
    const variance =
      durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) /
      durations.length;
    const stdDev = Math.sqrt(variance);

    // Lower variance = higher consistency
    // stdDev of 0 = 100%, stdDev of 2+ = 0%
    const consistencyFromDuration = Math.max(0, 100 - stdDev * 50);

    // If we have bed/wake times, factor those in
    const entriesWithTimes = entries.filter((e): e is typeof e & { bedTime: string; wakeTime: string } => 
      Boolean(e.bedTime && e.wakeTime)
    );
    if (entriesWithTimes.length >= 3) {
      const bedTimes = entriesWithTimes.map((e) =>
        this.timeToMinutes(e.bedTime),
      );
      const bedMean = bedTimes.reduce((a, b) => a + b, 0) / bedTimes.length;
      const bedVariance =
        bedTimes.reduce((sum, t) => sum + Math.pow(t - bedMean, 2), 0) /
        bedTimes.length;
      const bedStdDev = Math.sqrt(bedVariance);

      // stdDev of 30 min or less = good, 60+ min = poor
      const consistencyFromTiming = Math.max(0, 100 - bedStdDev);

      return Math.round((consistencyFromDuration + consistencyFromTiming) / 2);
    }

    return Math.round(consistencyFromDuration);
  }

  /**
   * Convert time string to minutes from midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    // Handle times after midnight (e.g., 1:00 AM should be treated as late, not early)
    const adjustedHours = hours < 12 ? hours + 24 : hours;
    return adjustedHours * 60 + minutes;
  }

  /**
   * Calculate training capacity impact
   */
  private calculateTrainingImpact(
    avgSleep: number,
    avgQuality: number,
    profile: OptimalSleepProfile,
  ): number {
    // Base impact from duration
    let durationFactor = 1.0;
    if (avgSleep < profile.minimumHours) {
      // Significant reduction below minimum
      durationFactor = 0.5 + (avgSleep / profile.minimumHours) * 0.5;
    } else if (avgSleep < profile.optimalHours) {
      // Minor reduction below optimal
      durationFactor =
        0.85 +
        ((avgSleep - profile.minimumHours) /
          (profile.optimalHours - profile.minimumHours)) *
          0.15;
    }

    // Quality factor
    const qualityFactor = 0.7 + (avgQuality / 10) * 0.3;

    // Combined impact (minimum 0.5)
    return Math.max(0.5, Math.min(1.0, durationFactor * qualityFactor));
  }

  /**
   * Calculate recovery rate impact
   */
  private calculateRecoveryImpact(
    avgSleep: number,
    avgQuality: number,
    profile: OptimalSleepProfile,
  ): number {
    // Recovery is more sensitive to sleep than training capacity
    let durationFactor = 1.0;
    if (avgSleep < profile.minimumHours) {
      durationFactor = 0.4 + (avgSleep / profile.minimumHours) * 0.4;
    } else if (avgSleep < profile.optimalHours) {
      durationFactor =
        0.8 +
        ((avgSleep - profile.minimumHours) /
          (profile.optimalHours - profile.minimumHours)) *
          0.2;
    }

    const qualityFactor = 0.6 + (avgQuality / 10) * 0.4;

    return Math.max(0.4, Math.min(1.0, durationFactor * qualityFactor));
  }

  /**
   * Calculate injury risk multiplier
   * Based on Milewski et al. (2014) - athletes sleeping <8h have 1.7x injury risk
   */
  private calculateInjuryRisk(
    avgSleep: number,
    profile: OptimalSleepProfile,
  ): number {
    if (avgSleep >= profile.optimalHours) {
      return 1.0; // Baseline risk
    } else if (avgSleep >= profile.minimumHours) {
      // Linear increase from 1.0 to 1.3
      const ratio =
        (profile.optimalHours - avgSleep) /
        (profile.optimalHours - profile.minimumHours);
      return 1.0 + ratio * 0.3;
    } else {
      // Below minimum - significant increase
      // Based on research: <6h sleep = ~1.7x injury risk
      const ratio = (profile.minimumHours - avgSleep) / profile.minimumHours;
      return 1.3 + ratio * 0.7; // Up to 2.0x at very low sleep
    }
  }

  /**
   * Get sleep trend analysis
   */
  getSleepTrend(): SleepTrend {
    const history = this._sleepHistory();
    const now = new Date();

    const thisWeek = history.filter(
      (e) => e.date >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    );
    const lastWeek = history.filter(
      (e) =>
        e.date >= new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) &&
        e.date < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    );

    if (thisWeek.length < 3 || lastWeek.length < 3) {
      return {
        direction: "stable",
        weekOverWeekChange: 0,
        qualityTrend: "stable",
        message: "Not enough data to determine trend",
      };
    }

    const thisWeekAvg =
      thisWeek.reduce((sum, e) => sum + e.hoursSlept, 0) / thisWeek.length;
    const lastWeekAvg =
      lastWeek.reduce((sum, e) => sum + e.hoursSlept, 0) / lastWeek.length;
    const change = thisWeekAvg - lastWeekAvg;

    const thisWeekQuality =
      thisWeek.reduce((sum, e) => sum + e.quality, 0) / thisWeek.length;
    const lastWeekQuality =
      lastWeek.reduce((sum, e) => sum + e.quality, 0) / lastWeek.length;
    const qualityChange = thisWeekQuality - lastWeekQuality;

    let direction: SleepTrend["direction"] = "stable";
    if (change > 0.3) direction = "improving";
    else if (change < -0.3) direction = "declining";

    let qualityTrend: SleepTrend["qualityTrend"] = "stable";
    if (qualityChange > 0.5) qualityTrend = "improving";
    else if (qualityChange < -0.5) qualityTrend = "declining";

    let message = "";
    if (direction === "improving") {
      message = `Sleep duration improving (+${change.toFixed(1)}h vs last week)`;
    } else if (direction === "declining") {
      message = `Sleep duration declining (${change.toFixed(1)}h vs last week) - prioritize rest`;
    } else {
      message = "Sleep duration stable";
    }

    if (qualityTrend === "declining" && direction !== "declining") {
      message += " but quality is declining";
    }

    return {
      direction,
      weekOverWeekChange: change,
      qualityTrend,
      message,
    };
  }

  /**
   * Get personalized sleep recommendations
   */
  getRecommendations(ageGroup?: string): SleepRecommendation[] {
    const analysis = this._currentAnalysis();
    const profile = this.getSleepProfile(ageGroup);
    const recommendations: SleepRecommendation[] = [];

    if (!analysis) {
      return [
        {
          priority: "medium",
          category: "duration",
          recommendation:
            "Start tracking sleep to receive personalized recommendations",
          evidenceBase: "Sleep tracking enables data-driven optimization",
        },
      ];
    }

    // Duration recommendations
    if (analysis.last7DaysAverage < profile.minimumHours) {
      recommendations.push({
        priority: "critical",
        category: "duration",
        recommendation: `Increase sleep to at least ${profile.minimumHours} hours per night`,
        evidenceBase: "Milewski et al. (2014) - <8h sleep = 1.7x injury risk",
      });
    } else if (analysis.last7DaysAverage < profile.optimalHours) {
      recommendations.push({
        priority: "high",
        category: "duration",
        recommendation: `Aim for ${profile.optimalHours} hours per night for optimal recovery`,
        evidenceBase:
          "Mah et al. (2011) - Sleep extension improves athletic performance",
      });
    }

    // Quality recommendations
    if (analysis.qualityAverage < 6) {
      recommendations.push({
        priority: "critical",
        category: "quality",
        recommendation:
          "Focus on sleep hygiene: dark room, cool temperature, no screens 1h before bed",
        evidenceBase:
          "Vitale et al. (2019) - Sleep hygiene for optimizing recovery",
      });
    } else if (analysis.qualityAverage < 7) {
      recommendations.push({
        priority: "high",
        category: "quality",
        recommendation:
          "Consider sleep environment improvements and pre-sleep routine",
        evidenceBase: "Halson (2014) - Sleep quality affects recovery markers",
      });
    }

    // Consistency recommendations
    if (analysis.consistencyScore < 60) {
      recommendations.push({
        priority: "high",
        category: "consistency",
        recommendation:
          "Maintain consistent bed and wake times (within 30 minutes daily)",
        evidenceBase:
          "Circadian rhythm consistency improves sleep quality and recovery",
      });
    } else if (analysis.consistencyScore < 80) {
      recommendations.push({
        priority: "medium",
        category: "consistency",
        recommendation: "Try to improve sleep schedule consistency",
        evidenceBase:
          "Regular sleep patterns optimize hormonal recovery cycles",
      });
    }

    // Debt recovery recommendations
    if (analysis.debtLevel === "severe" || analysis.debtLevel === "critical") {
      recommendations.push({
        priority: "critical",
        category: "duration",
        recommendation: `You have ${analysis.cumulativeDebt.toFixed(1)} hours of sleep debt - add 1-2 hours per night for the next week`,
        evidenceBase:
          "Sleep debt accumulates and requires extended recovery periods",
      });
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
    );

    return recommendations;
  }

  /**
   * Create sleep recovery plan
   */
  createRecoveryPlan(ageGroup?: string): SleepRecoveryPlan {
    const analysis = this._currentAnalysis();
    const profile = this.getSleepProfile(ageGroup);

    if (!analysis || analysis.cumulativeDebt <= 0) {
      return {
        currentDebt: 0,
        daysToRecover: 0,
        targetSleepPerNight: profile.optimalHours,
        weeklyPlan: [],
        trainingAdjustments: ["No sleep debt - maintain current sleep habits"],
      };
    }

    // Calculate recovery time
    // Can realistically add 1-1.5 hours per night without disrupting schedule
    const extraSleepPerNight = 1.0;
    const daysToRecover = Math.ceil(
      analysis.cumulativeDebt / extraSleepPerNight,
    );
    const targetSleep = profile.optimalHours + extraSleepPerNight;

    // Create weekly plan
    const weeklyPlan: SleepRecoveryPlan["weeklyPlan"] = [];
    let remainingDebt = analysis.cumulativeDebt;

    for (let day = 1; day <= 7 && remainingDebt > 0; day++) {
      const extraTonight = Math.min(extraSleepPerNight, remainingDebt);
      weeklyPlan.push({
        day,
        targetHours: profile.optimalHours + extraTonight,
        notes:
          day <= 3
            ? "Priority recovery night - go to bed early"
            : "Continue recovery - maintain extended sleep",
      });
      remainingDebt -= extraTonight;
    }

    // Training adjustments based on debt level
    const trainingAdjustments: string[] = [];

    if (analysis.debtLevel === "critical") {
      trainingAdjustments.push(
        "Reduce training intensity by 50% until debt is below 7 hours",
      );
      trainingAdjustments.push(
        "No high-intensity sessions until sleep improves",
      );
      trainingAdjustments.push("Focus on technical work and recovery sessions");
    } else if (analysis.debtLevel === "severe") {
      trainingAdjustments.push("Reduce training intensity by 30%");
      trainingAdjustments.push("Limit high-intensity sessions to 1 per week");
      trainingAdjustments.push("Add extra rest day this week");
    } else if (analysis.debtLevel === "moderate") {
      trainingAdjustments.push("Monitor fatigue closely during training");
      trainingAdjustments.push("Consider reducing volume by 20%");
      trainingAdjustments.push("Prioritize sleep over early morning training");
    } else {
      trainingAdjustments.push(
        "Minor adjustments - prioritize sleep this week",
      );
      trainingAdjustments.push(
        "Avoid training that interferes with sleep schedule",
      );
    }

    return {
      currentDebt: analysis.cumulativeDebt,
      daysToRecover,
      targetSleepPerNight: targetSleep,
      weeklyPlan,
      trainingAdjustments,
    };
  }

  /**
   * Check if training should be modified based on sleep
   */
  shouldModifyTraining(): {
    shouldModify: boolean;
    reason: string;
    suggestedIntensityMultiplier: number;
  } {
    const analysis = this._currentAnalysis();

    if (!analysis) {
      return {
        shouldModify: false,
        reason: "No sleep data available",
        suggestedIntensityMultiplier: 1.0,
      };
    }

    if (analysis.debtLevel === "critical") {
      return {
        shouldModify: true,
        reason: `Critical sleep debt (${analysis.cumulativeDebt.toFixed(1)}h) - significantly reduce training`,
        suggestedIntensityMultiplier: 0.5,
      };
    }

    if (analysis.debtLevel === "severe") {
      return {
        shouldModify: true,
        reason: `Severe sleep debt (${analysis.cumulativeDebt.toFixed(1)}h) - reduce training intensity`,
        suggestedIntensityMultiplier: 0.7,
      };
    }

    if (analysis.injuryRiskMultiplier > 1.5) {
      return {
        shouldModify: true,
        reason: `Elevated injury risk (${analysis.injuryRiskMultiplier.toFixed(1)}x) due to sleep deficit`,
        suggestedIntensityMultiplier: 0.8,
      };
    }

    if (analysis.trainingImpact < 0.8) {
      return {
        shouldModify: true,
        reason: "Reduced training capacity due to sleep quality/duration",
        suggestedIntensityMultiplier: analysis.trainingImpact,
      };
    }

    return {
      shouldModify: false,
      reason: "Sleep metrics within acceptable range",
      suggestedIntensityMultiplier: 1.0,
    };
  }
}
