/**
 * Body Weight Load Normalization Service
 *
 * EVIDENCE-BASED LOAD NORMALIZATION BY BODY WEIGHT
 *
 * A 95kg athlete experiences different absolute stress than a 70kg athlete
 * doing the same workout. This service normalizes training load calculations
 * to account for body weight differences.
 *
 * Research Base:
 * - Impellizzeri et al. (2004) - Use of RPE-based training load in soccer
 * - Scott et al. (2013) - Body mass and training load in team sports
 * - Gabbett et al. (2017) - Relationships between training load and injury
 *
 * Key Principles:
 * - Heavier athletes experience more absolute joint stress
 * - Relative strength (strength/bodyweight) is key for performance
 * - Weight changes can indicate hydration or recovery status
 * - Sudden weight loss increases injury risk
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { LoggerService } from "./logger.service";

// ============================================================================
// INTERFACES
// ============================================================================

export interface WeightEntry {
  date: Date;
  weight: number; // kg
  bodyFatPercentage?: number;
  hydrationLevel?: "poor" | "adequate" | "good" | "optimal";
  notes?: string;
}

export interface BodyCompositionProfile {
  currentWeight: number;
  targetWeight?: number;
  bodyFatPercentage?: number;
  leanMass?: number;
  heightCm: number;
  bmi: number;
  relativeStrengthBenchmarks: RelativeStrengthBenchmarks;
}

export interface RelativeStrengthBenchmarks {
  squat1RM?: number;
  relativeSquat?: number; // squat/bodyweight
  deadlift1RM?: number;
  relativeDeadlift?: number;
  benchPress1RM?: number;
  relativeBench?: number;
}

export interface WeightChangeAnalysis {
  currentWeight: number;
  weeklyChange: number; // kg
  weeklyChangePercent: number;
  monthlyChange: number;
  monthlyChangePercent: number;
  trend: "gaining" | "stable" | "losing";
  alerts: WeightAlert[];
  recommendations: string[];
}

export interface WeightAlert {
  severity: "info" | "warning" | "danger";
  type: "rapid_loss" | "rapid_gain" | "dehydration_risk" | "competition_weight";
  message: string;
  recommendation: string;
}

export interface NormalizedLoad {
  rawLoad: number;
  normalizedLoad: number;
  normalizationFactor: number;
  athleteWeight: number;
  referenceWeight: number;
  explanation: string;
}

export interface JointStressEstimate {
  activity: string;
  bodyWeight: number;
  stressMultiplier: number;
  estimatedForce: number; // Newtons
  riskLevel: "low" | "moderate" | "high";
  recommendations: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const REFERENCE_WEIGHT = 80; // kg - baseline for normalization

// Joint stress multipliers by activity (times bodyweight)
const JOINT_STRESS_MULTIPLIERS: Record<string, number> = {
  walking: 1.5,
  jogging: 3.0,
  running: 4.0,
  sprinting: 5.5,
  cutting: 6.0,
  jumping_landing: 7.0,
  depth_jump: 8.0,
  single_leg_landing: 9.0,
};

// Weight change thresholds
const WEIGHT_CHANGE_THRESHOLDS = {
  rapidLossWeekly: -2, // kg per week
  rapidLossPercent: -3, // % per week
  rapidGainWeekly: 2, // kg per week
  dehydrationRisk: -1.5, // kg in 24 hours
  competitionBuffer: 2, // kg above competition weight
};

// Position-specific weight considerations
const POSITION_WEIGHT_PROFILES: Record<string, { minBMI: number; maxBMI: number; notes: string }> = {
  QB: { minBMI: 22, maxBMI: 27, notes: "QBs benefit from moderate build for mobility and arm strength" },
  WR: { minBMI: 20, maxBMI: 25, notes: "WRs typically lean for speed and agility" },
  DB: { minBMI: 20, maxBMI: 25, notes: "DBs need to be lean for coverage speed" },
  Rusher: { minBMI: 21, maxBMI: 26, notes: "Rushers need balance of power and speed" },
  Center: { minBMI: 22, maxBMI: 27, notes: "Centers can carry slightly more mass" },
};

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: "root",
})
export class BodyWeightLoadService {
  private logger = inject(LoggerService);

  // State
  private readonly _weightHistory = signal<WeightEntry[]>([]);
  private readonly _currentProfile = signal<BodyCompositionProfile | null>(null);

  // Public signals
  readonly weightHistory = this._weightHistory.asReadonly();
  readonly currentProfile = this._currentProfile.asReadonly();

  // Computed
  readonly currentWeight = computed(() => {
    const history = this._weightHistory();
    return history.length > 0 ? history[history.length - 1].weight : null;
  });

  readonly hasRecentWeight = computed(() => {
    const history = this._weightHistory();
    if (history.length === 0) return false;
    const lastEntry = history[history.length - 1];
    const daysSinceEntry = (Date.now() - lastEntry.date.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceEntry <= 7;
  });

  /**
   * Add weight entry
   */
  addWeightEntry(entry: WeightEntry): void {
    const history = [...this._weightHistory(), entry];
    // Keep last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const filtered = history.filter((e) => e.date >= ninetyDaysAgo);
    this._weightHistory.set(filtered.sort((a, b) => a.date.getTime() - b.date.getTime()));
  }

  /**
   * Set weight history (e.g., from database)
   */
  setWeightHistory(entries: WeightEntry[]): void {
    this._weightHistory.set(entries.sort((a, b) => a.date.getTime() - b.date.getTime()));
  }

  /**
   * Set body composition profile
   */
  setProfile(profile: BodyCompositionProfile): void {
    this._currentProfile.set(profile);
  }

  /**
   * Calculate BMI
   */
  calculateBMI(weightKg: number, heightCm: number): number {
    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
  }

  /**
   * Normalize training load by body weight
   * Heavier athletes experience more absolute stress
   */
  normalizeLoad(
    rawLoad: number,
    athleteWeight: number,
    referenceWeight: number = REFERENCE_WEIGHT
  ): NormalizedLoad {
    // Weight factor: heavier = higher normalized load
    const weightFactor = athleteWeight / referenceWeight;
    const normalizedLoad = rawLoad * weightFactor;

    return {
      rawLoad,
      normalizedLoad: Math.round(normalizedLoad),
      normalizationFactor: weightFactor,
      athleteWeight,
      referenceWeight,
      explanation:
        weightFactor > 1
          ? `Load increased by ${((weightFactor - 1) * 100).toFixed(0)}% due to body weight above reference`
          : weightFactor < 1
          ? `Load decreased by ${((1 - weightFactor) * 100).toFixed(0)}% due to body weight below reference`
          : "No adjustment - athlete at reference weight",
    };
  }

  /**
   * Normalize ACWR calculation by body weight
   */
  normalizeACWR(
    acuteLoad: number,
    chronicLoad: number,
    athleteWeight: number,
    referenceWeight: number = REFERENCE_WEIGHT
  ): { rawACWR: number; normalizedACWR: number; recommendation: string } {
    const rawACWR = chronicLoad > 0 ? acuteLoad / chronicLoad : 0;

    // For ACWR, we adjust the danger threshold based on weight
    // Heavier athletes may need slightly lower thresholds due to joint stress
    const weightFactor = athleteWeight / referenceWeight;

    // Adjust ACWR interpretation (not the calculation itself)
    // Heavier athletes should be more conservative
    const thresholdAdjustment = weightFactor > 1.1 ? -0.05 : weightFactor < 0.9 ? 0.05 : 0;

    const adjustedDangerThreshold = 1.5 + thresholdAdjustment;

    let recommendation = "";
    if (rawACWR > adjustedDangerThreshold) {
      recommendation = `ACWR (${rawACWR.toFixed(2)}) exceeds adjusted threshold (${adjustedDangerThreshold.toFixed(2)}) for your body weight - reduce load`;
    } else if (rawACWR > 1.3) {
      recommendation = `ACWR (${rawACWR.toFixed(2)}) approaching danger zone - monitor closely`;
    } else if (rawACWR >= 0.8) {
      recommendation = `ACWR (${rawACWR.toFixed(2)}) in optimal range`;
    } else {
      recommendation = `ACWR (${rawACWR.toFixed(2)}) below optimal - consider increasing load gradually`;
    }

    return {
      rawACWR,
      normalizedACWR: rawACWR, // ACWR itself doesn't change, just interpretation
      recommendation,
    };
  }

  /**
   * Analyze weight changes
   */
  analyzeWeightChanges(): WeightChangeAnalysis {
    const history = this._weightHistory();
    const alerts: WeightAlert[] = [];
    const recommendations: string[] = [];

    if (history.length < 2) {
      return {
        currentWeight: history.length > 0 ? history[history.length - 1].weight : 0,
        weeklyChange: 0,
        weeklyChangePercent: 0,
        monthlyChange: 0,
        monthlyChangePercent: 0,
        trend: "stable",
        alerts: [],
        recommendations: ["Log weight regularly (at least weekly) to track trends"],
      };
    }

    const currentWeight = history[history.length - 1].weight;
    const now = new Date();

    // Find weight from ~7 days ago
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoEntry = history.find((e) => e.date >= weekAgo) || history[0];
    const weeklyChange = currentWeight - weekAgoEntry.weight;
    const weeklyChangePercent = (weeklyChange / weekAgoEntry.weight) * 100;

    // Find weight from ~30 days ago
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const monthAgoEntry = history.find((e) => e.date >= monthAgo) || history[0];
    const monthlyChange = currentWeight - monthAgoEntry.weight;
    const monthlyChangePercent = (monthlyChange / monthAgoEntry.weight) * 100;

    // Determine trend
    let trend: WeightChangeAnalysis["trend"] = "stable";
    if (weeklyChange > 0.5) trend = "gaining";
    else if (weeklyChange < -0.5) trend = "losing";

    // Check for rapid weight loss (injury/illness risk)
    if (weeklyChange < WEIGHT_CHANGE_THRESHOLDS.rapidLossWeekly) {
      alerts.push({
        severity: "danger",
        type: "rapid_loss",
        message: `Rapid weight loss detected: ${weeklyChange.toFixed(1)}kg in past week`,
        recommendation: "Check for dehydration, illness, or undereating. Consider reducing training intensity.",
      });
    } else if (weeklyChangePercent < WEIGHT_CHANGE_THRESHOLDS.rapidLossPercent) {
      alerts.push({
        severity: "warning",
        type: "rapid_loss",
        message: `Significant weight loss: ${weeklyChangePercent.toFixed(1)}% in past week`,
        recommendation: "Monitor hydration and nutrition. Ensure adequate caloric intake.",
      });
    }

    // Check for rapid weight gain
    if (weeklyChange > WEIGHT_CHANGE_THRESHOLDS.rapidGainWeekly) {
      alerts.push({
        severity: "warning",
        type: "rapid_gain",
        message: `Rapid weight gain: +${weeklyChange.toFixed(1)}kg in past week`,
        recommendation: "Review nutrition. Rapid gain may indicate fluid retention or dietary changes.",
      });
    }

    // Check 24-hour change for dehydration
    if (history.length >= 2) {
      const yesterday = history[history.length - 2];
      const daysSince = (now.getTime() - yesterday.date.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince <= 2) {
        const dailyChange = currentWeight - yesterday.weight;
        if (dailyChange < WEIGHT_CHANGE_THRESHOLDS.dehydrationRisk) {
          alerts.push({
            severity: "warning",
            type: "dehydration_risk",
            message: `Possible dehydration: ${dailyChange.toFixed(1)}kg change since yesterday`,
            recommendation: "Increase fluid intake. Check urine color (should be light yellow).",
          });
        }
      }
    }

    // Generate recommendations
    if (trend === "losing" && monthlyChange < -2) {
      recommendations.push("Gradual weight loss detected - ensure this is intentional");
      recommendations.push("Monitor energy levels during training");
    } else if (trend === "gaining" && monthlyChange > 2) {
      recommendations.push("Weight gain detected - review if aligned with training goals");
      recommendations.push("Consider body composition testing to distinguish muscle vs fat gain");
    } else {
      recommendations.push("Weight stable - continue current nutrition plan");
    }

    return {
      currentWeight,
      weeklyChange,
      weeklyChangePercent,
      monthlyChange,
      monthlyChangePercent,
      trend,
      alerts,
      recommendations,
    };
  }

  /**
   * Estimate joint stress for an activity
   */
  estimateJointStress(
    activity: string,
    bodyWeight: number,
    repetitions: number = 1
  ): JointStressEstimate {
    const multiplier = JOINT_STRESS_MULTIPLIERS[activity] || 3.0;
    const forceNewtons = bodyWeight * 9.81 * multiplier; // F = m * g * multiplier
    const totalStress = forceNewtons * repetitions;

    let riskLevel: JointStressEstimate["riskLevel"] = "low";
    const recommendations: string[] = [];

    // Risk assessment based on total stress
    if (totalStress > 500000) {
      riskLevel = "high";
      recommendations.push("High cumulative joint stress - ensure adequate recovery");
      recommendations.push("Consider reducing volume or intensity");
    } else if (totalStress > 200000) {
      riskLevel = "moderate";
      recommendations.push("Moderate joint stress - monitor for any discomfort");
    }

    // Weight-specific recommendations
    if (bodyWeight > 90) {
      recommendations.push("Higher body weight increases landing forces - prioritize landing technique");
      if (activity.includes("jump") || activity.includes("landing")) {
        recommendations.push("Consider reducing jump volume compared to lighter athletes");
      }
    }

    return {
      activity,
      bodyWeight,
      stressMultiplier: multiplier,
      estimatedForce: Math.round(forceNewtons),
      riskLevel,
      recommendations,
    };
  }

  /**
   * Get position-specific weight recommendations
   */
  getPositionWeightRecommendations(
    position: string,
    currentWeight: number,
    heightCm: number
  ): {
    currentBMI: number;
    optimalRange: { min: number; max: number };
    inRange: boolean;
    recommendation: string;
  } {
    const currentBMI = this.calculateBMI(currentWeight, heightCm);
    const profile = POSITION_WEIGHT_PROFILES[position] || POSITION_WEIGHT_PROFILES["WR"];

    const inRange = currentBMI >= profile.minBMI && currentBMI <= profile.maxBMI;

    let recommendation = "";
    if (currentBMI < profile.minBMI) {
      const targetWeight = profile.minBMI * Math.pow(heightCm / 100, 2);
      recommendation = `BMI (${currentBMI.toFixed(1)}) below optimal for ${position}. Consider gradual weight gain to ~${targetWeight.toFixed(0)}kg. ${profile.notes}`;
    } else if (currentBMI > profile.maxBMI) {
      const targetWeight = profile.maxBMI * Math.pow(heightCm / 100, 2);
      recommendation = `BMI (${currentBMI.toFixed(1)}) above optimal for ${position}. Consider gradual weight loss to ~${targetWeight.toFixed(0)}kg for improved agility. ${profile.notes}`;
    } else {
      recommendation = `BMI (${currentBMI.toFixed(1)}) in optimal range for ${position}. ${profile.notes}`;
    }

    return {
      currentBMI,
      optimalRange: { min: profile.minBMI, max: profile.maxBMI },
      inRange,
      recommendation,
    };
  }

  /**
   * Calculate relative strength
   */
  calculateRelativeStrength(
    exercise: "squat" | "deadlift" | "bench",
    oneRepMax: number,
    bodyWeight: number
  ): {
    relativeStrength: number;
    level: "beginner" | "intermediate" | "advanced" | "elite";
    recommendation: string;
  } {
    const relativeStrength = oneRepMax / bodyWeight;

    // Benchmarks based on strength standards
    const benchmarks: Record<string, { beginner: number; intermediate: number; advanced: number; elite: number }> = {
      squat: { beginner: 1.0, intermediate: 1.5, advanced: 2.0, elite: 2.5 },
      deadlift: { beginner: 1.25, intermediate: 1.75, advanced: 2.25, elite: 2.75 },
      bench: { beginner: 0.75, intermediate: 1.0, advanced: 1.5, elite: 2.0 },
    };

    const benchmark = benchmarks[exercise];
    let level: "beginner" | "intermediate" | "advanced" | "elite" = "beginner";

    if (relativeStrength >= benchmark.elite) {
      level = "elite";
    } else if (relativeStrength >= benchmark.advanced) {
      level = "advanced";
    } else if (relativeStrength >= benchmark.intermediate) {
      level = "intermediate";
    }

    let recommendation = "";
    if (level === "beginner") {
      recommendation = `Focus on building ${exercise} strength - target ${benchmark.intermediate.toFixed(1)}x bodyweight`;
    } else if (level === "intermediate") {
      recommendation = `Good ${exercise} strength - continue progressive overload toward ${benchmark.advanced.toFixed(1)}x bodyweight`;
    } else if (level === "advanced") {
      recommendation = `Excellent ${exercise} strength - maintain while focusing on sport-specific power`;
    } else {
      recommendation = `Elite ${exercise} strength - focus on maintaining and converting to sport-specific performance`;
    }

    return {
      relativeStrength,
      level,
      recommendation,
    };
  }

  /**
   * Get hydration recommendations based on weight and activity
   */
  getHydrationRecommendations(
    bodyWeight: number,
    activityDurationMinutes: number,
    temperature: "cool" | "moderate" | "hot" = "moderate"
  ): {
    baselineFluidOz: number;
    activityFluidOz: number;
    totalFluidOz: number;
    recommendations: string[];
  } {
    // Baseline: ~0.5oz per pound of body weight
    const weightLbs = bodyWeight * 2.205;
    const baselineFluidOz = weightLbs * 0.5;

    // Activity: 4-8oz per 15-20 minutes depending on temperature
    const tempMultiplier = temperature === "hot" ? 1.5 : temperature === "cool" ? 0.75 : 1.0;
    const activityFluidOz = (activityDurationMinutes / 15) * 6 * tempMultiplier;

    const recommendations: string[] = [
      `Drink ${Math.round(baselineFluidOz / 8)} cups (${Math.round(baselineFluidOz)}oz) of water daily as baseline`,
      `Add ${Math.round(activityFluidOz)}oz during/after training`,
      "Monitor urine color - should be light yellow",
      "Weigh yourself before and after training - replace each kg lost with 1.5L fluid",
    ];

    if (temperature === "hot") {
      recommendations.push("Hot conditions - consider electrolyte supplementation");
    }

    return {
      baselineFluidOz: Math.round(baselineFluidOz),
      activityFluidOz: Math.round(activityFluidOz),
      totalFluidOz: Math.round(baselineFluidOz + activityFluidOz),
      recommendations,
    };
  }
}
