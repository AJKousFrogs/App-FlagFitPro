/**
 * Age-Adjusted Recovery Service
 *
 * EVIDENCE-BASED RECOVERY PROTOCOLS ADJUSTED FOR ATHLETE AGE
 *
 * Recovery needs vary significantly by age. A 35-year-old athlete needs
 * more recovery time than a 22-year-old for the same training stimulus.
 *
 * Research Base:
 * - Fell & Williams (2008) - The effect of aging on skeletal-muscle recovery
 * - Tanaka & Seals (2008) - Endurance exercise performance in Masters athletes
 * - Reaburn & Dascombe (2008) - Endurance performance in Masters athletes
 * - Doering et al. (2016) - Recovery in Masters athletes
 * - Easthope et al. (2010) - Age and recovery from eccentric exercise
 *
 * Key Findings:
 * - Recovery time increases ~10% per decade after age 30
 * - Eccentric damage recovery is particularly affected by age
 * - Sleep quality becomes more important with age
 * - Chronic inflammation increases with age (affects recovery)
 * - Training age can partially offset chronological age effects
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { LoggerService } from "./logger.service";

// ============================================================================
// INTERFACES
// ============================================================================

export type AgeGroup =
  | "youth"
  | "young_adult"
  | "adult"
  | "masters"
  | "senior_masters";

export interface AgeAdjustedRecoveryProfile {
  ageGroup: AgeGroup;
  ageRange: string;
  minRestDaysBetweenHighIntensity: number;
  acwrThresholdAdjustment: number; // Adjustment to danger threshold
  recoveryTimeMultiplier: number; // Multiplier for recovery time
  maxSessionsPerWeek: number;
  maxHighIntensityPerWeek: number;
  maxConsecutiveHighIntensityDays: number;
  minSleepHours: number;
  nutritionEmphasis: string[];
  recoveryStrategies: string[];
  warningThresholds: AgeWarningThresholds;
  evidenceBase: string;
}

export interface AgeWarningThresholds {
  acwrDanger: number; // ACWR threshold for danger zone
  maxWeeklyLoadIncrease: number; // Percentage
  minRestBetweenGames: number; // Hours
  maxSprintsPerSession: number;
  maxThrowsPerSession: number; // For QBs
}

export interface AthleteAgeProfile {
  chronologicalAge: number;
  trainingAge: number; // Years of structured training
  ageGroup: AgeGroup;
  adjustedAgeGroup: AgeGroup; // May be younger if high training age
  recoveryProfile: AgeAdjustedRecoveryProfile;
}

export interface RecoveryRecommendation {
  type: "rest" | "active_recovery" | "light_training" | "normal_training";
  reason: string;
  duration: string;
  activities: string[];
  warnings: string[];
}

export interface TrainingCapacityAssessment {
  canTrainToday: boolean;
  recommendedIntensity: number; // 0-100%
  maxDuration: number; // minutes
  restrictions: string[];
  reasoning: string;
}

// ============================================================================
// AGE-ADJUSTED RECOVERY PROFILES
// ============================================================================

const AGE_RECOVERY_PROFILES: Record<AgeGroup, AgeAdjustedRecoveryProfile> = {
  youth: {
    ageGroup: "youth",
    ageRange: "Under 18",
    minRestDaysBetweenHighIntensity: 1,
    acwrThresholdAdjustment: 0,
    recoveryTimeMultiplier: 0.85, // Recover faster
    maxSessionsPerWeek: 6,
    maxHighIntensityPerWeek: 3,
    maxConsecutiveHighIntensityDays: 2,
    minSleepHours: 9, // Growing bodies need more sleep
    nutritionEmphasis: [
      "Adequate protein for growth (1.4-1.6g/kg)",
      "Calcium and Vitamin D for bone development",
      "Iron (especially for females)",
      "Hydration emphasis",
    ],
    recoveryStrategies: [
      "Active recovery (light movement)",
      "Adequate sleep (9+ hours)",
      "Balanced nutrition",
      "Avoid overspecialization",
    ],
    warningThresholds: {
      acwrDanger: 1.5,
      maxWeeklyLoadIncrease: 15,
      minRestBetweenGames: 24,
      maxSprintsPerSession: 25,
      maxThrowsPerSession: 50,
    },
    evidenceBase:
      "Youth athletes recover faster but are at risk for overuse injuries during growth spurts",
  },

  young_adult: {
    ageGroup: "young_adult",
    ageRange: "18-24",
    minRestDaysBetweenHighIntensity: 1,
    acwrThresholdAdjustment: 0,
    recoveryTimeMultiplier: 0.9,
    maxSessionsPerWeek: 7,
    maxHighIntensityPerWeek: 4,
    maxConsecutiveHighIntensityDays: 3,
    minSleepHours: 8,
    nutritionEmphasis: [
      "High protein for muscle development (1.6-2.0g/kg)",
      "Adequate carbohydrates for training fuel",
      "Hydration",
      "Post-workout nutrition timing",
    ],
    recoveryStrategies: [
      "Active recovery",
      "Sleep optimization",
      "Nutrition timing",
      "Mobility work",
    ],
    warningThresholds: {
      acwrDanger: 1.5,
      maxWeeklyLoadIncrease: 12,
      minRestBetweenGames: 18,
      maxSprintsPerSession: 35,
      maxThrowsPerSession: 70,
    },
    evidenceBase: "Peak recovery capacity, can handle higher training loads",
  },

  adult: {
    ageGroup: "adult",
    ageRange: "25-34",
    minRestDaysBetweenHighIntensity: 1,
    acwrThresholdAdjustment: 0,
    recoveryTimeMultiplier: 1.0, // Baseline
    maxSessionsPerWeek: 6,
    maxHighIntensityPerWeek: 3,
    maxConsecutiveHighIntensityDays: 2,
    minSleepHours: 7.5,
    nutritionEmphasis: [
      "Protein for maintenance (1.4-1.8g/kg)",
      "Anti-inflammatory foods",
      "Omega-3 fatty acids",
      "Adequate hydration",
    ],
    recoveryStrategies: [
      "Active recovery",
      "Sleep quality focus",
      "Mobility and flexibility",
      "Stress management",
    ],
    warningThresholds: {
      acwrDanger: 1.5,
      maxWeeklyLoadIncrease: 10,
      minRestBetweenGames: 24,
      maxSprintsPerSession: 30,
      maxThrowsPerSession: 60,
    },
    evidenceBase: "Baseline recovery profile - standard recommendations apply",
  },

  masters: {
    ageGroup: "masters",
    ageRange: "35-44",
    minRestDaysBetweenHighIntensity: 2, // KEY DIFFERENCE
    acwrThresholdAdjustment: -0.1, // Lower danger threshold to 1.4
    recoveryTimeMultiplier: 1.3, // 30% longer recovery
    maxSessionsPerWeek: 5,
    maxHighIntensityPerWeek: 2,
    maxConsecutiveHighIntensityDays: 1, // No back-to-back high intensity
    minSleepHours: 7.5,
    nutritionEmphasis: [
      "Higher protein needs (1.6-2.0g/kg) - anabolic resistance",
      "Anti-inflammatory diet emphasis",
      "Omega-3s (2-3g/day)",
      "Vitamin D (important for muscle function)",
      "Collagen for joint health",
    ],
    recoveryStrategies: [
      "Extended active recovery periods",
      "Mobility work (daily)",
      "Sleep quality optimization",
      "Stress management",
      "Soft tissue work (massage, foam rolling)",
      "Consider contrast therapy",
    ],
    warningThresholds: {
      acwrDanger: 1.4, // Lower threshold
      maxWeeklyLoadIncrease: 8, // More conservative
      minRestBetweenGames: 36, // Longer rest
      maxSprintsPerSession: 25,
      maxThrowsPerSession: 50,
    },
    evidenceBase:
      "Fell & Williams (2008), Doering et al. (2016) - Recovery time increases ~30% in this age group",
  },

  senior_masters: {
    ageGroup: "senior_masters",
    ageRange: "45+",
    minRestDaysBetweenHighIntensity: 2,
    acwrThresholdAdjustment: -0.2, // Lower danger threshold to 1.3
    recoveryTimeMultiplier: 1.5, // 50% longer recovery
    maxSessionsPerWeek: 4,
    maxHighIntensityPerWeek: 2,
    maxConsecutiveHighIntensityDays: 1,
    minSleepHours: 7,
    nutritionEmphasis: [
      "High protein (1.8-2.2g/kg) - significant anabolic resistance",
      "Leucine-rich protein sources",
      "Anti-inflammatory diet critical",
      "Omega-3s (3g/day)",
      "Vitamin D + K2",
      "Collagen and joint support",
      "Creatine (3-5g/day) - evidence for older athletes",
    ],
    recoveryStrategies: [
      "Extended recovery periods (48-72h after high intensity)",
      "Daily mobility work (non-negotiable)",
      "Sleep quality focus",
      "Stress management",
      "Regular soft tissue work",
      "Consider professional recovery modalities",
      "Joint-friendly training modifications",
    ],
    warningThresholds: {
      acwrDanger: 1.3, // Much lower threshold
      maxWeeklyLoadIncrease: 5, // Very conservative
      minRestBetweenGames: 48, // Much longer rest
      maxSprintsPerSession: 20,
      maxThrowsPerSession: 40,
    },
    evidenceBase:
      "Tanaka & Seals (2008), Reaburn & Dascombe (2008) - Significant recovery adaptations needed",
  },
};

// ============================================================================
// TRAINING AGE ADJUSTMENTS
// ============================================================================

/**
 * Training age can offset some effects of chronological age
 * An experienced 40-year-old may recover like a less experienced 35-year-old
 */
const TRAINING_AGE_ADJUSTMENTS: Record<number, number> = {
  // Training years: Age group adjustment (negative = younger effective age group)
  0: 0, // Beginner - no adjustment
  2: 0, // Still building base
  5: -2, // Intermediate - 2 years younger effective age
  10: -3, // Experienced - 3 years younger
  15: -5, // Very experienced - 5 years younger
  20: -5, // Maximum adjustment
};

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: "root",
})
export class AgeAdjustedRecoveryService {
  private logger = inject(LoggerService);

  // State
  private readonly _currentProfile = signal<AthleteAgeProfile | null>(null);
  private readonly _lastHighIntensityDate = signal<Date | null>(null);

  // Public signals
  readonly currentProfile = this._currentProfile.asReadonly();
  readonly lastHighIntensityDate = this._lastHighIntensityDate.asReadonly();

  /**
   * Determine age group from chronological age
   */
  getAgeGroup(age: number): AgeGroup {
    if (age < 18) return "youth";
    if (age < 25) return "young_adult";
    if (age < 35) return "adult";
    if (age < 45) return "masters";
    return "senior_masters";
  }

  /**
   * Get adjusted age group based on training age
   * Experienced athletes may recover like younger athletes
   */
  getAdjustedAgeGroup(chronologicalAge: number, trainingAge: number): AgeGroup {
    // Find the adjustment based on training age
    let adjustment = 0;
    for (const [years, adj] of Object.entries(TRAINING_AGE_ADJUSTMENTS)) {
      if (trainingAge >= parseInt(years)) {
        adjustment = adj;
      }
    }

    // Calculate effective age
    const effectiveAge = Math.max(18, chronologicalAge + adjustment);
    return this.getAgeGroup(effectiveAge);
  }

  /**
   * Get recovery profile for an athlete
   */
  getRecoveryProfile(
    chronologicalAge: number,
    trainingAge: number = 0,
  ): AthleteAgeProfile {
    const ageGroup = this.getAgeGroup(chronologicalAge);
    const adjustedAgeGroup = this.getAdjustedAgeGroup(
      chronologicalAge,
      trainingAge,
    );

    const profile: AthleteAgeProfile = {
      chronologicalAge,
      trainingAge,
      ageGroup,
      adjustedAgeGroup,
      recoveryProfile: AGE_RECOVERY_PROFILES[adjustedAgeGroup],
    };

    this._currentProfile.set(profile);
    return profile;
  }

  /**
   * Get all recovery profiles
   */
  getAllRecoveryProfiles(): AgeAdjustedRecoveryProfile[] {
    return Object.values(AGE_RECOVERY_PROFILES);
  }

  /**
   * Get recovery profile by age group
   */
  getRecoveryProfileByAgeGroup(ageGroup: AgeGroup): AgeAdjustedRecoveryProfile {
    return AGE_RECOVERY_PROFILES[ageGroup];
  }

  /**
   * Calculate adjusted ACWR danger threshold for athlete's age
   */
  getAdjustedACWRThreshold(
    chronologicalAge: number,
    trainingAge: number = 0,
  ): number {
    const profile = this.getRecoveryProfile(chronologicalAge, trainingAge);
    const baseThreshold = 1.5; // Standard danger threshold
    return baseThreshold + profile.recoveryProfile.acwrThresholdAdjustment;
  }

  /**
   * Check if athlete can train today based on recovery status
   */
  assessTrainingCapacity(
    chronologicalAge: number,
    trainingAge: number,
    lastHighIntensityDate: Date | null,
    plannedIntensity: "low" | "moderate" | "high",
    currentACWR: number,
    sleepHoursLast7Days: number[],
  ): TrainingCapacityAssessment {
    const profile = this.getRecoveryProfile(chronologicalAge, trainingAge);
    const recoveryProfile = profile.recoveryProfile;

    const restrictions: string[] = [];
    let canTrain = true;
    let recommendedIntensity = 100;
    let maxDuration = 120; // Default 2 hours max
    let reasoning = "";

    // Check days since last high intensity
    if (lastHighIntensityDate && plannedIntensity === "high") {
      const daysSinceHighIntensity = Math.floor(
        (Date.now() - lastHighIntensityDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (
        daysSinceHighIntensity < recoveryProfile.minRestDaysBetweenHighIntensity
      ) {
        restrictions.push(
          `Need ${recoveryProfile.minRestDaysBetweenHighIntensity} days between high-intensity sessions (only ${daysSinceHighIntensity} days since last)`,
        );
        recommendedIntensity = 60; // Reduce to moderate
        reasoning =
          "Insufficient recovery time since last high-intensity session";
      }
    }

    // Check ACWR
    const acwrThreshold = recoveryProfile.warningThresholds.acwrDanger;
    if (currentACWR > acwrThreshold) {
      restrictions.push(
        `ACWR (${currentACWR.toFixed(2)}) exceeds age-adjusted threshold (${acwrThreshold})`,
      );
      recommendedIntensity = Math.min(recommendedIntensity, 50);
      canTrain = currentACWR < acwrThreshold + 0.3; // Complete rest if very high
      reasoning += " High injury risk due to elevated ACWR.";
    }

    // Check sleep
    const avgSleep =
      sleepHoursLast7Days.reduce((a, b) => a + b, 0) /
      sleepHoursLast7Days.length;
    if (avgSleep < recoveryProfile.minSleepHours) {
      restrictions.push(
        `Average sleep (${avgSleep.toFixed(1)}h) below minimum (${recoveryProfile.minSleepHours}h)`,
      );
      recommendedIntensity = Math.min(recommendedIntensity, 70);
      reasoning += " Sleep deficit affecting recovery.";
    }

    // Adjust duration based on age
    maxDuration = Math.round(120 / recoveryProfile.recoveryTimeMultiplier);

    return {
      canTrainToday: canTrain,
      recommendedIntensity,
      maxDuration,
      restrictions,
      reasoning: reasoning || "All recovery markers within acceptable range",
    };
  }

  /**
   * Get recovery recommendation after a training session
   */
  getRecoveryRecommendation(
    chronologicalAge: number,
    trainingAge: number,
    sessionIntensity: "low" | "moderate" | "high",
    sessionDuration: number, // minutes
    sessionType: string,
  ): RecoveryRecommendation {
    const profile = this.getRecoveryProfile(chronologicalAge, trainingAge);
    const recoveryProfile = profile.recoveryProfile;

    // Base recovery time in hours
    let baseRecoveryHours =
      sessionIntensity === "high"
        ? 48
        : sessionIntensity === "moderate"
          ? 24
          : 12;

    // Adjust for age
    baseRecoveryHours = Math.round(
      baseRecoveryHours * recoveryProfile.recoveryTimeMultiplier,
    );

    // Adjust for duration
    if (sessionDuration > 90) {
      baseRecoveryHours = Math.round(baseRecoveryHours * 1.2);
    }

    const warnings: string[] = [];
    let type: RecoveryRecommendation["type"] = "normal_training";
    let activities: string[] = [];

    if (sessionIntensity === "high") {
      type = "active_recovery";
      activities = [
        "Light walking or cycling (20-30 min)",
        "Mobility work",
        "Foam rolling",
        ...recoveryProfile.recoveryStrategies.slice(0, 3),
      ];

      if (
        profile.ageGroup === "masters" ||
        profile.ageGroup === "senior_masters"
      ) {
        warnings.push(
          `As a ${recoveryProfile.ageRange} athlete, allow ${recoveryProfile.minRestDaysBetweenHighIntensity} full days before next high-intensity session`,
        );
      }
    } else if (sessionIntensity === "moderate") {
      type = "light_training";
      activities = [
        "Light technical work",
        "Mobility",
        "Low-intensity conditioning",
      ];
    } else {
      type = "normal_training";
      activities = ["Normal training can resume tomorrow"];
    }

    return {
      type,
      reason: `Based on ${sessionIntensity} intensity session and ${recoveryProfile.ageRange} age profile`,
      duration: `${baseRecoveryHours} hours minimum before next ${sessionIntensity} session`,
      activities,
      warnings,
    };
  }

  /**
   * Get maximum training limits for athlete's age
   */
  getTrainingLimits(
    chronologicalAge: number,
    trainingAge: number = 0,
  ): AgeWarningThresholds & {
    maxSessionsPerWeek: number;
    maxHighIntensityPerWeek: number;
    nutritionEmphasis: string[];
  } {
    const profile = this.getRecoveryProfile(chronologicalAge, trainingAge);
    const recoveryProfile = profile.recoveryProfile;

    return {
      ...recoveryProfile.warningThresholds,
      maxSessionsPerWeek: recoveryProfile.maxSessionsPerWeek,
      maxHighIntensityPerWeek: recoveryProfile.maxHighIntensityPerWeek,
      nutritionEmphasis: recoveryProfile.nutritionEmphasis,
    };
  }

  /**
   * Check if weekly training plan is appropriate for athlete's age
   */
  validateWeeklyPlan(
    chronologicalAge: number,
    trainingAge: number,
    plannedSessions: Array<{
      intensity: "low" | "moderate" | "high";
      day: number;
    }>,
  ): { valid: boolean; warnings: string[]; recommendations: string[] } {
    const profile = this.getRecoveryProfile(chronologicalAge, trainingAge);
    const limits = profile.recoveryProfile;
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check total sessions
    if (plannedSessions.length > limits.maxSessionsPerWeek) {
      warnings.push(
        `Planned ${plannedSessions.length} sessions exceeds maximum ${limits.maxSessionsPerWeek} for ${limits.ageRange} athletes`,
      );
    }

    // Check high intensity count
    const highIntensitySessions = plannedSessions.filter(
      (s) => s.intensity === "high",
    );
    if (highIntensitySessions.length > limits.maxHighIntensityPerWeek) {
      warnings.push(
        `Planned ${highIntensitySessions.length} high-intensity sessions exceeds maximum ${limits.maxHighIntensityPerWeek}`,
      );
    }

    // Check consecutive high intensity days
    const sortedHighIntensity = highIntensitySessions
      .map((s) => s.day)
      .sort((a, b) => a - b);
    let consecutiveCount = 1;
    for (let i = 1; i < sortedHighIntensity.length; i++) {
      if (sortedHighIntensity[i] - sortedHighIntensity[i - 1] === 1) {
        consecutiveCount++;
        if (consecutiveCount > limits.maxConsecutiveHighIntensityDays) {
          warnings.push(
            `${consecutiveCount} consecutive high-intensity days exceeds maximum ${limits.maxConsecutiveHighIntensityDays}`,
          );
          break;
        }
      } else {
        consecutiveCount = 1;
      }
    }

    // Add recommendations
    if (
      profile.ageGroup === "masters" ||
      profile.ageGroup === "senior_masters"
    ) {
      recommendations.push(
        "Consider adding extra mobility work on rest days",
        "Prioritize sleep quality (7.5+ hours)",
        ...limits.nutritionEmphasis.slice(0, 2),
      );
    }

    return {
      valid: warnings.length === 0,
      warnings,
      recommendations,
    };
  }

  /**
   * Get age-specific warm-up recommendations
   */
  getWarmUpRecommendations(chronologicalAge: number): {
    duration: number;
    components: string[];
    emphasis: string;
  } {
    const ageGroup = this.getAgeGroup(chronologicalAge);

    const baseWarmUp = {
      youth: {
        duration: 10,
        components: [
          "Light jog (3 min)",
          "Dynamic stretching (5 min)",
          "Sport-specific movements (2 min)",
        ],
        emphasis: "Movement quality and fun",
      },
      young_adult: {
        duration: 12,
        components: [
          "Light jog (3 min)",
          "Dynamic stretching (5 min)",
          "Activation drills (2 min)",
          "Sport-specific prep (2 min)",
        ],
        emphasis: "Activation and preparation",
      },
      adult: {
        duration: 15,
        components: [
          "Light cardio (5 min)",
          "Dynamic stretching (5 min)",
          "Activation drills (3 min)",
          "Sport-specific prep (2 min)",
        ],
        emphasis: "Thorough preparation",
      },
      masters: {
        duration: 20,
        components: [
          "Light cardio (5 min)",
          "Joint mobility (5 min)",
          "Dynamic stretching (5 min)",
          "Activation drills (3 min)",
          "Gradual intensity build-up (2 min)",
        ],
        emphasis: "Extended mobility and gradual intensity increase",
      },
      senior_masters: {
        duration: 25,
        components: [
          "Light cardio (5 min)",
          "Joint mobility (7 min)",
          "Dynamic stretching (5 min)",
          "Activation drills (5 min)",
          "Gradual intensity build-up (3 min)",
        ],
        emphasis:
          "Comprehensive joint preparation and very gradual intensity increase",
      },
    };

    return baseWarmUp[ageGroup];
  }
}
