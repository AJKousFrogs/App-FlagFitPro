/**
 * Training Limits Service
 *
 * EVIDENCE-BASED TRAINING FREQUENCY AND VOLUME LIMITS
 *
 * This service enforces safe training limits to prevent overtraining
 * and reduce injury risk. Limits are based on research and adjusted
 * for athlete age and training experience.
 *
 * Research Base:
 * - Gabbett (2016) - Training-injury prevention paradox
 * - Hulin et al. (2016) - Spikes in acute workload and injury risk
 * - Meeusen et al. (2013) - Prevention, diagnosis and treatment of overtraining
 * - Kellmann et al. (2018) - Recovery and performance in sport
 *
 * Key Principles:
 * - Maximum weekly load increases of 10% (Hulin et al. 2016)
 * - Minimum 1 rest day per week
 * - Maximum consecutive training days
 * - Movement-specific volume limits
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { LoggerService } from "./logger.service";

// ============================================================================
// INTERFACES
// ============================================================================

export interface TrainingLimitsConfig {
  maxSessionsPerWeek: number;
  maxHighIntensityPerWeek: number;
  minRestDaysPerWeek: number;
  maxConsecutiveTrainingDays: number;
  maxWeeklyLoadIncreasePercent: number;
  movementLimits: MovementLimits;
}

export interface MovementLimits {
  sprints: SprintLimits;
  cuts: CuttingLimits;
  throws: ThrowingLimits;
  jumps: JumpingLimits;
  decelerations: DecelerationLimits;
}

export interface SprintLimits {
  maxPerSession: number;
  maxPerWeek: number;
  minRestBetweenSets: number; // seconds
  maxConsecutiveDays: number;
  warningThreshold: number; // percentage of max before warning
}

export interface CuttingLimits {
  maxPerSession: number;
  maxPerWeek: number;
  minRestBetweenDrills: number; // seconds
  maxConsecutiveDays: number;
}

export interface ThrowingLimits {
  maxPerSession: number;
  maxPerWeek: number;
  maxPerTournament: number;
  armCareRequired: boolean;
  restBetweenHighVolumeDays: number; // hours
}

export interface JumpingLimits {
  maxPerSession: number;
  maxPerWeek: number;
  landingStressTracking: boolean;
  maxDropHeight: number; // cm for depth jumps
}

export interface DecelerationLimits {
  maxHighIntensityPerSession: number;
  maxPerWeek: number;
  eccentricLoadTracking: boolean;
}

export interface TrainingSession {
  date: Date;
  duration: number; // minutes
  intensity: "low" | "moderate" | "high";
  rpe: number; // 1-10
  load: number; // RPE × duration
  movements: SessionMovements;
}

export interface SessionMovements {
  sprints?: number;
  cuts?: number;
  throws?: number;
  jumps?: number;
  decelerations?: number;
}

export interface WeeklyTrainingSummary {
  totalSessions: number;
  highIntensitySessions: number;
  totalLoad: number;
  restDays: number;
  consecutiveTrainingDays: number;
  movements: SessionMovements;
}

export interface LimitViolation {
  type: "session" | "weekly" | "movement" | "load";
  severity: "warning" | "danger" | "critical";
  metric: string;
  currentValue: number;
  limit: number;
  message: string;
  recommendation: string;
}

export interface TrainingPlanValidation {
  isValid: boolean;
  violations: LimitViolation[];
  warnings: string[];
  recommendations: string[];
  adjustedPlan?: TrainingSession[];
}

// ============================================================================
// DEFAULT LIMITS (Adult Athletes)
// ============================================================================

const DEFAULT_LIMITS: TrainingLimitsConfig = {
  maxSessionsPerWeek: 6,
  maxHighIntensityPerWeek: 3,
  minRestDaysPerWeek: 1,
  maxConsecutiveTrainingDays: 4,
  maxWeeklyLoadIncreasePercent: 10,
  movementLimits: {
    sprints: {
      maxPerSession: 30,
      maxPerWeek: 100,
      minRestBetweenSets: 120,
      maxConsecutiveDays: 2,
      warningThreshold: 80,
    },
    cuts: {
      maxPerSession: 50,
      maxPerWeek: 200,
      minRestBetweenDrills: 60,
      maxConsecutiveDays: 3,
    },
    throws: {
      maxPerSession: 60,
      maxPerWeek: 300,
      maxPerTournament: 350,
      armCareRequired: true,
      restBetweenHighVolumeDays: 48,
    },
    jumps: {
      maxPerSession: 40,
      maxPerWeek: 150,
      landingStressTracking: true,
      maxDropHeight: 60,
    },
    decelerations: {
      maxHighIntensityPerSession: 30,
      maxPerWeek: 120,
      eccentricLoadTracking: true,
    },
  },
};

// ============================================================================
// AGE-ADJUSTED LIMITS
// ============================================================================

const AGE_ADJUSTED_LIMITS: Record<string, Partial<TrainingLimitsConfig>> = {
  youth: {
    maxSessionsPerWeek: 5,
    maxHighIntensityPerWeek: 2,
    maxConsecutiveTrainingDays: 3,
    maxWeeklyLoadIncreasePercent: 15,
    movementLimits: {
      ...DEFAULT_LIMITS.movementLimits,
      sprints: {
        ...DEFAULT_LIMITS.movementLimits.sprints,
        maxPerSession: 25,
        maxPerWeek: 80,
      },
      throws: {
        ...DEFAULT_LIMITS.movementLimits.throws,
        maxPerSession: 50,
        maxPerWeek: 200,
      },
    },
  },
  masters: {
    maxSessionsPerWeek: 5,
    maxHighIntensityPerWeek: 2,
    maxConsecutiveTrainingDays: 3,
    maxWeeklyLoadIncreasePercent: 8,
    movementLimits: {
      ...DEFAULT_LIMITS.movementLimits,
      sprints: {
        ...DEFAULT_LIMITS.movementLimits.sprints,
        maxPerSession: 25,
        maxPerWeek: 80,
        maxConsecutiveDays: 1,
      },
      throws: {
        ...DEFAULT_LIMITS.movementLimits.throws,
        maxPerSession: 50,
        maxPerWeek: 250,
        restBetweenHighVolumeDays: 72,
      },
      jumps: {
        ...DEFAULT_LIMITS.movementLimits.jumps,
        maxPerSession: 30,
        maxPerWeek: 100,
        maxDropHeight: 45,
      },
    },
  },
  senior_masters: {
    maxSessionsPerWeek: 4,
    maxHighIntensityPerWeek: 2,
    maxConsecutiveTrainingDays: 2,
    maxWeeklyLoadIncreasePercent: 5,
    movementLimits: {
      ...DEFAULT_LIMITS.movementLimits,
      sprints: {
        ...DEFAULT_LIMITS.movementLimits.sprints,
        maxPerSession: 20,
        maxPerWeek: 60,
        maxConsecutiveDays: 1,
      },
      throws: {
        ...DEFAULT_LIMITS.movementLimits.throws,
        maxPerSession: 40,
        maxPerWeek: 200,
        restBetweenHighVolumeDays: 72,
      },
      jumps: {
        ...DEFAULT_LIMITS.movementLimits.jumps,
        maxPerSession: 25,
        maxPerWeek: 80,
        maxDropHeight: 30,
      },
    },
  },
};

// ============================================================================
// POSITION-SPECIFIC LIMITS
// ============================================================================

const POSITION_LIMITS: Record<string, Partial<MovementLimits>> = {
  QB: {
    throws: {
      maxPerSession: 80, // QBs can throw more
      maxPerWeek: 400,
      maxPerTournament: 350,
      armCareRequired: true,
      restBetweenHighVolumeDays: 48,
    },
    sprints: {
      maxPerSession: 25, // QBs sprint less
      maxPerWeek: 80,
      minRestBetweenSets: 120,
      maxConsecutiveDays: 2,
      warningThreshold: 80,
    },
  },
  WR: {
    sprints: {
      maxPerSession: 40, // WRs sprint more
      maxPerWeek: 120,
      minRestBetweenSets: 90,
      maxConsecutiveDays: 2,
      warningThreshold: 80,
    },
    cuts: {
      maxPerSession: 60,
      maxPerWeek: 250,
      minRestBetweenDrills: 45,
      maxConsecutiveDays: 3,
    },
  },
  DB: {
    sprints: {
      maxPerSession: 35,
      maxPerWeek: 110,
      minRestBetweenSets: 90,
      maxConsecutiveDays: 2,
      warningThreshold: 80,
    },
    cuts: {
      maxPerSession: 70, // DBs do more cutting
      maxPerWeek: 280,
      minRestBetweenDrills: 45,
      maxConsecutiveDays: 3,
    },
  },
  Rusher: {
    sprints: {
      maxPerSession: 35,
      maxPerWeek: 100,
      minRestBetweenSets: 90,
      maxConsecutiveDays: 2,
      warningThreshold: 80,
    },
    decelerations: {
      maxHighIntensityPerSession: 40, // Rushers decelerate more
      maxPerWeek: 150,
      eccentricLoadTracking: true,
    },
  },
};

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: "root",
})
export class TrainingLimitsService {
  private logger = inject(LoggerService);

  // State
  private readonly _currentLimits =
    signal<TrainingLimitsConfig>(DEFAULT_LIMITS);
  private readonly _weeklyHistory = signal<TrainingSession[]>([]);
  private readonly _violations = signal<LimitViolation[]>([]);

  // Public signals
  readonly currentLimits = this._currentLimits.asReadonly();
  readonly weeklyHistory = this._weeklyHistory.asReadonly();
  readonly violations = this._violations.asReadonly();

  // Computed
  readonly hasViolations = computed(() => this._violations().length > 0);
  readonly criticalViolations = computed(() =>
    this._violations().filter((v) => v.severity === "critical"),
  );

  /**
   * Get training limits adjusted for age and position
   */
  getLimits(
    ageGroup?: "youth" | "adult" | "masters" | "senior_masters",
    position?: string,
  ): TrainingLimitsConfig {
    let limits = { ...DEFAULT_LIMITS };

    // Apply age adjustments
    if (ageGroup && AGE_ADJUSTED_LIMITS[ageGroup]) {
      limits = {
        ...limits,
        ...AGE_ADJUSTED_LIMITS[ageGroup],
        movementLimits: {
          ...limits.movementLimits,
          ...AGE_ADJUSTED_LIMITS[ageGroup].movementLimits,
        },
      };
    }

    // Apply position adjustments
    if (position && POSITION_LIMITS[position]) {
      limits.movementLimits = {
        ...limits.movementLimits,
        ...POSITION_LIMITS[position],
      };
    }

    this._currentLimits.set(limits);
    return limits;
  }

  /**
   * Validate a single training session against limits
   */
  validateSession(
    session: TrainingSession,
    limits: TrainingLimitsConfig = DEFAULT_LIMITS,
  ): LimitViolation[] {
    const violations: LimitViolation[] = [];
    const movements = session.movements;

    // Check sprint limits
    if (movements.sprints !== undefined) {
      if (movements.sprints > limits.movementLimits.sprints.maxPerSession) {
        violations.push({
          type: "movement",
          severity:
            movements.sprints >
            limits.movementLimits.sprints.maxPerSession * 1.2
              ? "danger"
              : "warning",
          metric: "sprints",
          currentValue: movements.sprints,
          limit: limits.movementLimits.sprints.maxPerSession,
          message: `Sprint count (${movements.sprints}) exceeds session limit (${limits.movementLimits.sprints.maxPerSession})`,
          recommendation:
            "Reduce sprint volume to prevent hamstring injury risk",
        });
      } else if (
        movements.sprints >
        limits.movementLimits.sprints.maxPerSession *
          (limits.movementLimits.sprints.warningThreshold / 100)
      ) {
        violations.push({
          type: "movement",
          severity: "warning",
          metric: "sprints",
          currentValue: movements.sprints,
          limit: limits.movementLimits.sprints.maxPerSession,
          message: `Sprint count (${movements.sprints}) approaching session limit (${limits.movementLimits.sprints.maxPerSession})`,
          recommendation:
            "Monitor fatigue and consider reducing volume if fatigued",
        });
      }
    }

    // Check cutting limits
    if (
      movements.cuts !== undefined &&
      movements.cuts > limits.movementLimits.cuts.maxPerSession
    ) {
      violations.push({
        type: "movement",
        severity:
          movements.cuts > limits.movementLimits.cuts.maxPerSession * 1.2
            ? "danger"
            : "warning",
        metric: "cuts",
        currentValue: movements.cuts,
        limit: limits.movementLimits.cuts.maxPerSession,
        message: `Cutting movements (${movements.cuts}) exceed session limit (${limits.movementLimits.cuts.maxPerSession})`,
        recommendation:
          "Reduce cutting volume to prevent knee and ankle injury risk",
      });
    }

    // Check throwing limits
    if (
      movements.throws !== undefined &&
      movements.throws > limits.movementLimits.throws.maxPerSession
    ) {
      violations.push({
        type: "movement",
        severity:
          movements.throws > limits.movementLimits.throws.maxPerSession * 1.2
            ? "danger"
            : "warning",
        metric: "throws",
        currentValue: movements.throws,
        limit: limits.movementLimits.throws.maxPerSession,
        message: `Throw count (${movements.throws}) exceeds session limit (${limits.movementLimits.throws.maxPerSession})`,
        recommendation: "Reduce throwing volume and prioritize arm care",
      });
    }

    // Check jump limits
    if (
      movements.jumps !== undefined &&
      movements.jumps > limits.movementLimits.jumps.maxPerSession
    ) {
      violations.push({
        type: "movement",
        severity: "warning",
        metric: "jumps",
        currentValue: movements.jumps,
        limit: limits.movementLimits.jumps.maxPerSession,
        message: `Jump count (${movements.jumps}) exceeds session limit (${limits.movementLimits.jumps.maxPerSession})`,
        recommendation: "Reduce jumping volume to manage landing stress",
      });
    }

    return violations;
  }

  /**
   * Validate weekly training against limits
   */
  validateWeeklyTraining(
    sessions: TrainingSession[],
    previousWeekLoad: number,
    limits: TrainingLimitsConfig = DEFAULT_LIMITS,
  ): TrainingPlanValidation {
    const violations: LimitViolation[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Calculate weekly summary
    const summary = this.calculateWeeklySummary(sessions);

    // Check total sessions
    if (summary.totalSessions > limits.maxSessionsPerWeek) {
      violations.push({
        type: "weekly",
        severity: "danger",
        metric: "totalSessions",
        currentValue: summary.totalSessions,
        limit: limits.maxSessionsPerWeek,
        message: `Weekly sessions (${summary.totalSessions}) exceed limit (${limits.maxSessionsPerWeek})`,
        recommendation:
          "Remove low-priority sessions to allow adequate recovery",
      });
    }

    // Check high intensity sessions
    if (summary.highIntensitySessions > limits.maxHighIntensityPerWeek) {
      violations.push({
        type: "weekly",
        severity: "danger",
        metric: "highIntensitySessions",
        currentValue: summary.highIntensitySessions,
        limit: limits.maxHighIntensityPerWeek,
        message: `High-intensity sessions (${summary.highIntensitySessions}) exceed limit (${limits.maxHighIntensityPerWeek})`,
        recommendation:
          "Convert some high-intensity sessions to moderate intensity",
      });
    }

    // Check rest days
    if (summary.restDays < limits.minRestDaysPerWeek) {
      violations.push({
        type: "weekly",
        severity: "critical",
        metric: "restDays",
        currentValue: summary.restDays,
        limit: limits.minRestDaysPerWeek,
        message: `Rest days (${summary.restDays}) below minimum (${limits.minRestDaysPerWeek})`,
        recommendation:
          "Add at least one complete rest day to prevent overtraining",
      });
    }

    // Check consecutive training days
    if (summary.consecutiveTrainingDays > limits.maxConsecutiveTrainingDays) {
      violations.push({
        type: "weekly",
        severity: "warning",
        metric: "consecutiveTrainingDays",
        currentValue: summary.consecutiveTrainingDays,
        limit: limits.maxConsecutiveTrainingDays,
        message: `Consecutive training days (${summary.consecutiveTrainingDays}) exceed limit (${limits.maxConsecutiveTrainingDays})`,
        recommendation: "Insert a rest day to break up consecutive training",
      });
    }

    // Check weekly load increase
    if (previousWeekLoad > 0) {
      const loadIncrease =
        ((summary.totalLoad - previousWeekLoad) / previousWeekLoad) * 100;
      if (loadIncrease > limits.maxWeeklyLoadIncreasePercent) {
        violations.push({
          type: "load",
          severity:
            loadIncrease > limits.maxWeeklyLoadIncreasePercent * 1.5
              ? "critical"
              : "danger",
          metric: "weeklyLoadIncrease",
          currentValue: Math.round(loadIncrease),
          limit: limits.maxWeeklyLoadIncreasePercent,
          message: `Weekly load increase (${loadIncrease.toFixed(1)}%) exceeds safe limit (${limits.maxWeeklyLoadIncreasePercent}%)`,
          recommendation:
            "Reduce planned load to stay within safe progression limits (Hulin et al. 2016)",
        });
      }
    }

    // Check weekly movement totals
    if (
      summary.movements.sprints &&
      summary.movements.sprints > limits.movementLimits.sprints.maxPerWeek
    ) {
      violations.push({
        type: "movement",
        severity: "danger",
        metric: "weeklySprintsTotal",
        currentValue: summary.movements.sprints,
        limit: limits.movementLimits.sprints.maxPerWeek,
        message: `Weekly sprints (${summary.movements.sprints}) exceed limit (${limits.movementLimits.sprints.maxPerWeek})`,
        recommendation:
          "Distribute sprint work more evenly or reduce total volume",
      });
    }

    if (
      summary.movements.throws &&
      summary.movements.throws > limits.movementLimits.throws.maxPerWeek
    ) {
      violations.push({
        type: "movement",
        severity: "danger",
        metric: "weeklyThrowsTotal",
        currentValue: summary.movements.throws,
        limit: limits.movementLimits.throws.maxPerWeek,
        message: `Weekly throws (${summary.movements.throws}) exceed limit (${limits.movementLimits.throws.maxPerWeek})`,
        recommendation:
          "Reduce throwing volume and ensure arm care protocol is followed",
      });
    }

    // Add general recommendations
    if (violations.length > 0) {
      recommendations.push(
        "Review and adjust training plan to address violations",
      );
      recommendations.push(
        "Consider consulting with a coach or sports scientist",
      );
    }

    if (summary.highIntensitySessions >= limits.maxHighIntensityPerWeek) {
      recommendations.push(
        "Ensure adequate recovery between high-intensity sessions",
      );
    }

    this._violations.set(violations);

    return {
      isValid: violations.filter((v) => v.severity !== "warning").length === 0,
      violations,
      warnings,
      recommendations,
    };
  }

  /**
   * Calculate weekly training summary
   */
  calculateWeeklySummary(sessions: TrainingSession[]): WeeklyTrainingSummary {
    const totalSessions = sessions.length;
    const highIntensitySessions = sessions.filter(
      (s) => s.intensity === "high",
    ).length;
    const totalLoad = sessions.reduce((sum, s) => sum + s.load, 0);

    // Calculate rest days (assuming 7-day week)
    const trainingDays = new Set(sessions.map((s) => s.date.getDay())).size;
    const restDays = 7 - trainingDays;

    // Calculate max consecutive training days
    const sortedDates = sessions
      .map((s) => s.date.getTime())
      .sort((a, b) => a - b);
    let maxConsecutive = 1;
    let currentConsecutive = 1;
    const oneDay = 24 * 60 * 60 * 1000;

    for (let i = 1; i < sortedDates.length; i++) {
      if (sortedDates[i] - sortedDates[i - 1] <= oneDay) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 1;
      }
    }

    // Sum movements
    const movements: SessionMovements = {
      sprints: sessions.reduce((sum, s) => sum + (s.movements.sprints || 0), 0),
      cuts: sessions.reduce((sum, s) => sum + (s.movements.cuts || 0), 0),
      throws: sessions.reduce((sum, s) => sum + (s.movements.throws || 0), 0),
      jumps: sessions.reduce((sum, s) => sum + (s.movements.jumps || 0), 0),
      decelerations: sessions.reduce(
        (sum, s) => sum + (s.movements.decelerations || 0),
        0,
      ),
    };

    return {
      totalSessions,
      highIntensitySessions,
      totalLoad,
      restDays,
      consecutiveTrainingDays: maxConsecutive,
      movements,
    };
  }

  /**
   * Get recommendations for safe load progression
   */
  getSafeLoadProgression(
    currentWeekLoad: number,
    targetWeekLoad: number,
    maxWeeklyIncrease: number = 10,
  ): { weeks: number; weeklyLoads: number[]; recommendation: string } {
    if (targetWeekLoad <= currentWeekLoad) {
      return {
        weeks: 1,
        weeklyLoads: [targetWeekLoad],
        recommendation:
          "Target load is at or below current load - safe to implement immediately",
      };
    }

    const weeklyLoads: number[] = [currentWeekLoad];
    let currentLoad = currentWeekLoad;
    let weeks = 0;

    while (currentLoad < targetWeekLoad && weeks < 12) {
      const maxIncrease = currentLoad * (maxWeeklyIncrease / 100);
      currentLoad = Math.min(currentLoad + maxIncrease, targetWeekLoad);
      weeklyLoads.push(Math.round(currentLoad));
      weeks++;
    }

    return {
      weeks,
      weeklyLoads,
      recommendation: `Progress from ${currentWeekLoad} to ${targetWeekLoad} AU over ${weeks} weeks (max ${maxWeeklyIncrease}% increase per week)`,
    };
  }

  /**
   * Check if tournament schedule is safe
   */
  validateTournamentSchedule(
    gamesPerDay: number[],
    throwsPerGame: number,
    position: string,
  ): { safe: boolean; warnings: string[]; recommendations: string[] } {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    const limits = this.getLimits(undefined, position);

    const totalGames = gamesPerDay.reduce((a, b) => a + b, 0);
    const totalThrows = position === "QB" ? totalGames * throwsPerGame : 0;

    // Check QB throwing limits
    if (
      position === "QB" &&
      totalThrows > limits.movementLimits.throws.maxPerTournament
    ) {
      warnings.push(
        `Estimated throws (${totalThrows}) exceed tournament limit (${limits.movementLimits.throws.maxPerTournament})`,
      );
      recommendations.push("Consider rotating QBs or reducing throws per game");
      recommendations.push("Ensure ice and arm care between games");
    }

    // Check games per day
    const maxGamesPerDay = Math.max(...gamesPerDay);
    if (maxGamesPerDay > 4) {
      warnings.push(
        `${maxGamesPerDay} games in one day is very high - injury risk elevated`,
      );
      recommendations.push("Ensure adequate rest between games");
      recommendations.push("Monitor fatigue closely");
    }

    // Check consecutive high-load days
    const highLoadDays = gamesPerDay.filter((g) => g >= 3).length;
    if (highLoadDays > 2) {
      warnings.push(
        `${highLoadDays} consecutive high-load days increases injury risk`,
      );
      recommendations.push("Consider lighter warm-ups on day 3+");
    }

    return {
      safe: warnings.length === 0,
      warnings,
      recommendations,
    };
  }

  /**
   * Get overtraining risk indicators
   */
  getOvertrainingRiskIndicators(
    weeklyLoads: number[], // Last 4 weeks
    sleepQuality: number[], // Last 7 days (1-10)
    moodScores: number[], // Last 7 days (1-10)
    performanceDecline: boolean,
  ): {
    riskLevel: "low" | "moderate" | "high" | "critical";
    indicators: string[];
    recommendations: string[];
  } {
    const indicators: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    // Check monotony (consistent high load without variation)
    if (weeklyLoads.length >= 4) {
      const mean = weeklyLoads.reduce((a, b) => a + b, 0) / weeklyLoads.length;
      const stdDev = Math.sqrt(
        weeklyLoads.reduce((sum, load) => sum + Math.pow(load - mean, 2), 0) /
          weeklyLoads.length,
      );
      const monotony = mean / (stdDev || 1);

      if (monotony > 2.0) {
        indicators.push(
          `High training monotony (${monotony.toFixed(1)}) - lack of variation`,
        );
        riskScore += 2;
      }

      // Check strain
      const strain = weeklyLoads[weeklyLoads.length - 1] * monotony;
      if (strain > 6000) {
        indicators.push(
          `High training strain (${Math.round(strain)}) - accumulated fatigue`,
        );
        riskScore += 2;
      }
    }

    // Check sleep quality
    const avgSleep =
      sleepQuality.reduce((a, b) => a + b, 0) / sleepQuality.length;
    if (avgSleep < 6) {
      indicators.push(`Poor sleep quality (${avgSleep.toFixed(1)}/10)`);
      riskScore += 2;
    } else if (avgSleep < 7) {
      indicators.push(
        `Below optimal sleep quality (${avgSleep.toFixed(1)}/10)`,
      );
      riskScore += 1;
    }

    // Check mood
    const avgMood = moodScores.reduce((a, b) => a + b, 0) / moodScores.length;
    if (avgMood < 5) {
      indicators.push(
        `Low mood scores (${avgMood.toFixed(1)}/10) - possible overreaching`,
      );
      riskScore += 2;
    } else if (avgMood < 6) {
      indicators.push(`Below optimal mood (${avgMood.toFixed(1)}/10)`);
      riskScore += 1;
    }

    // Check performance
    if (performanceDecline) {
      indicators.push("Performance decline detected");
      riskScore += 3;
    }

    // Determine risk level
    let riskLevel: "low" | "moderate" | "high" | "critical";
    if (riskScore >= 7) {
      riskLevel = "critical";
      recommendations.push("IMMEDIATE: Reduce training load by 50% for 1 week");
      recommendations.push("Prioritize sleep (8+ hours)");
      recommendations.push("Consider consulting sports medicine professional");
    } else if (riskScore >= 5) {
      riskLevel = "high";
      recommendations.push("Reduce training load by 30% this week");
      recommendations.push("Add extra rest day");
      recommendations.push("Focus on recovery modalities");
    } else if (riskScore >= 3) {
      riskLevel = "moderate";
      recommendations.push("Monitor closely for next 7 days");
      recommendations.push("Ensure adequate sleep");
      recommendations.push("Consider reducing high-intensity sessions");
    } else {
      riskLevel = "low";
      recommendations.push("Continue current training with normal monitoring");
    }

    return { riskLevel, indicators, recommendations };
  }
}
