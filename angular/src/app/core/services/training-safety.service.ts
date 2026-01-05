/**
 * Training Safety Service
 *
 * CRITICAL SAFETY SERVICE - Enforces training limits and recovery requirements
 *
 * This service prevents athlete injury by:
 * 1. Age-adjusted recovery requirements
 * 2. Training frequency limits
 * 3. Movement-specific volume limits
 * 4. Sleep debt tracking
 * 5. Overtraining detection
 *
 * Based on sports science research:
 * - Gabbett (2016) - Training load management
 * - Halson (2014) - Sleep and recovery
 * - Hulin et al. (2016) - Training monotony
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";
import { DataSourceService } from "./data-source.service";

// ============================================================================
// INTERFACES
// ============================================================================

export type AgeGroup = "youth" | "adult" | "masters" | "senior";
export type WarningSeverity = "info" | "warning" | "danger" | "critical";

export interface AgeAdjustedProfile {
  ageGroup: AgeGroup;
  age: number;
  minRestDaysBetweenHighIntensity: number;
  acwrDangerThreshold: number; // Adjusted from default 1.5
  recoveryTimeMultiplier: number;
  maxSessionsPerWeek: number;
  maxHighIntensityPerWeek: number;
  maxConsecutiveHighIntensityDays: number;
  maxConsecutiveTrainingDays: number;
}

export interface TrainingLimits {
  maxSessionsPerWeek: number;
  maxHighIntensityPerWeek: number;
  minRestDaysPerWeek: number;
  maxConsecutiveTrainingDays: number;
  maxSprintsPerSession: number;
  maxSprintsPerWeek: number;
  maxCutsPerSession: number;
  maxCutsPerWeek: number;
  maxThrowsPerSession: number; // For QBs
  maxThrowsPerWeek: number;
  maxJumpsPerSession: number;
  maxJumpsPerWeek: number;
}

export interface MovementTotals {
  sprints: number;
  cuts: number;
  throws: number;
  jumps: number;
  totalSessions: number;
  highIntensitySessions: number;
  consecutiveTrainingDays: number;
  consecutiveHighIntensityDays: number;
  restDays: number;
}

export interface SleepDebtAnalysis {
  last7DaysAverage: number;
  optimalSleep: number;
  cumulativeDebt: number;
  debtLevel: "none" | "mild" | "moderate" | "severe";
  recoveryRecommendation: string;
  trainingImpact: number; // 0-1 multiplier
  daysToRecover: number;
}

export interface SafetyWarning {
  id: string;
  type: string;
  severity: WarningSeverity;
  title: string;
  message: string;
  recommendation: string;
  metric?: string;
  currentValue?: number;
  threshold?: number;
  timestamp: Date;
}

export interface SafetyCheckResult {
  isApproved: boolean;
  overallRisk: "low" | "moderate" | "high" | "critical";
  warnings: SafetyWarning[];
  recommendations: string[];
  adjustedIntensity?: number; // Suggested intensity reduction
  adjustedVolume?: number; // Suggested volume reduction
}

// ============================================================================
// CONSTANTS - Evidence-Based Thresholds
// ============================================================================

/**
 * Age-adjusted profiles based on recovery research
 * Masters athletes (35+) need significantly more recovery time
 */
const AGE_PROFILES: Record<AgeGroup, Omit<AgeAdjustedProfile, "age">> = {
  youth: {
    // Under 18
    ageGroup: "youth",
    minRestDaysBetweenHighIntensity: 1,
    acwrDangerThreshold: 1.5,
    recoveryTimeMultiplier: 0.9, // Recover faster
    maxSessionsPerWeek: 5, // Youth need more rest
    maxHighIntensityPerWeek: 2,
    maxConsecutiveHighIntensityDays: 1,
    maxConsecutiveTrainingDays: 3,
  },
  adult: {
    // 18-34
    ageGroup: "adult",
    minRestDaysBetweenHighIntensity: 1,
    acwrDangerThreshold: 1.5,
    recoveryTimeMultiplier: 1.0,
    maxSessionsPerWeek: 6,
    maxHighIntensityPerWeek: 3,
    maxConsecutiveHighIntensityDays: 2,
    maxConsecutiveTrainingDays: 4,
  },
  masters: {
    // 35-44
    ageGroup: "masters",
    minRestDaysBetweenHighIntensity: 2,
    acwrDangerThreshold: 1.4, // Lower threshold
    recoveryTimeMultiplier: 1.3, // 30% longer recovery
    maxSessionsPerWeek: 5,
    maxHighIntensityPerWeek: 2,
    maxConsecutiveHighIntensityDays: 1,
    maxConsecutiveTrainingDays: 3,
  },
  senior: {
    // 45+
    ageGroup: "senior",
    minRestDaysBetweenHighIntensity: 2,
    acwrDangerThreshold: 1.3, // Even lower threshold
    recoveryTimeMultiplier: 1.5, // 50% longer recovery
    maxSessionsPerWeek: 4,
    maxHighIntensityPerWeek: 2,
    maxConsecutiveHighIntensityDays: 1,
    maxConsecutiveTrainingDays: 2,
  },
};

/**
 * Movement-specific limits to prevent overuse injuries
 * Based on flag football injury research
 */
const MOVEMENT_LIMITS: TrainingLimits = {
  maxSessionsPerWeek: 6,
  maxHighIntensityPerWeek: 3,
  minRestDaysPerWeek: 1,
  maxConsecutiveTrainingDays: 4,
  maxSprintsPerSession: 30,
  maxSprintsPerWeek: 100,
  maxCutsPerSession: 50,
  maxCutsPerWeek: 200,
  maxThrowsPerSession: 60, // QB-specific
  maxThrowsPerWeek: 250,
  maxJumpsPerSession: 40,
  maxJumpsPerWeek: 150,
};

/**
 * Sleep thresholds based on Halson (2014), Fullagar et al. (2015)
 */
const SLEEP_THRESHOLDS = {
  optimal: 8, // hours
  minimum: 7,
  critical: 6,
  debtMild: 3, // hours
  debtModerate: 7,
  debtSevere: 14,
};

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: "root",
})
export class TrainingSafetyService {
  private supabaseService = inject(SupabaseService);
  private logger = inject(LoggerService);
  private dataSourceService = inject(DataSourceService);

  // Current user's profile
  private userId = computed(() => this.supabaseService.userId());

  // Cached athlete profile
  private readonly _athleteAge = signal<number | null>(null);
  private readonly _athleteProfile = signal<AgeAdjustedProfile | null>(null);
  private readonly _weeklyMovements = signal<MovementTotals | null>(null);
  private readonly _sleepDebt = signal<SleepDebtAnalysis | null>(null);
  private readonly _activeWarnings = signal<SafetyWarning[]>([]);

  // Public readonly signals
  readonly athleteAge = this._athleteAge.asReadonly();
  readonly athleteProfile = this._athleteProfile.asReadonly();
  readonly weeklyMovements = this._weeklyMovements.asReadonly();
  readonly sleepDebt = this._sleepDebt.asReadonly();
  readonly activeWarnings = this._activeWarnings.asReadonly();

  // Computed
  readonly hasAgeData = computed(() => this._athleteAge() !== null);
  readonly ageGroup = computed(
    () => this._athleteProfile()?.ageGroup || "adult",
  );
  readonly warningCount = computed(() => this._activeWarnings().length);
  readonly hasCriticalWarnings = computed(() =>
    this._activeWarnings().some((w) => w.severity === "critical"),
  );

  /**
   * Get age group from chronological age
   */
  getAgeGroup(age: number): AgeGroup {
    if (age < 18) return "youth";
    if (age < 35) return "adult";
    if (age < 45) return "masters";
    return "senior";
  }

  /**
   * Get age-adjusted profile for an athlete
   */
  getAgeAdjustedProfile(age: number): AgeAdjustedProfile {
    const ageGroup = this.getAgeGroup(age);
    const baseProfile = AGE_PROFILES[ageGroup];

    return {
      ...baseProfile,
      age,
    };
  }

  /**
   * Load athlete's age from profile
   */
  async loadAthleteAge(userId?: string): Promise<number | null> {
    const targetUserId = userId || this.userId();
    if (!targetUserId) return null;

    try {
      const { data, error } = await this.supabaseService.client
        .from("users")
        .select("birth_date, date_of_birth")
        .eq("id", targetUserId)
        .single();

      if (error || !data) {
        this.logger.warn("[TrainingSafety] Could not load athlete age");
        return null;
      }

      const birthDate = data.birth_date || data.date_of_birth;
      if (!birthDate) {
        this.logger.warn("[TrainingSafety] No birth date set for athlete");
        this._athleteAge.set(null);
        return null;
      }

      const age = this.calculateAge(new Date(birthDate));
      this._athleteAge.set(age);
      this._athleteProfile.set(this.getAgeAdjustedProfile(age));

      this.logger.info(
        `[TrainingSafety] Athlete age: ${age}, Group: ${this.getAgeGroup(age)}`,
      );

      return age;
    } catch (error) {
      this.logger.error("[TrainingSafety] Error loading athlete age:", error);
      return null;
    }
  }

  /**
   * Calculate age from birth date
   */
  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  /**
   * Get training limits adjusted for athlete's age
   */
  getAdjustedLimits(age?: number): TrainingLimits {
    const athleteAge = age || this._athleteAge();
    if (!athleteAge) return MOVEMENT_LIMITS;

    const profile = this.getAgeAdjustedProfile(athleteAge);

    return {
      ...MOVEMENT_LIMITS,
      maxSessionsPerWeek: profile.maxSessionsPerWeek,
      maxHighIntensityPerWeek: profile.maxHighIntensityPerWeek,
      maxConsecutiveTrainingDays: profile.maxConsecutiveTrainingDays,
      // Reduce sprint/cut limits for older athletes
      maxSprintsPerSession: Math.round(
        MOVEMENT_LIMITS.maxSprintsPerSession / profile.recoveryTimeMultiplier,
      ),
      maxSprintsPerWeek: Math.round(
        MOVEMENT_LIMITS.maxSprintsPerWeek / profile.recoveryTimeMultiplier,
      ),
      maxCutsPerSession: Math.round(
        MOVEMENT_LIMITS.maxCutsPerSession / profile.recoveryTimeMultiplier,
      ),
      maxCutsPerWeek: Math.round(
        MOVEMENT_LIMITS.maxCutsPerWeek / profile.recoveryTimeMultiplier,
      ),
    };
  }

  /**
   * Calculate sleep debt from recent entries
   */
  calculateSleepDebt(
    sleepEntries: { hours: number; date: string }[],
  ): SleepDebtAnalysis {
    if (sleepEntries.length === 0) {
      return {
        last7DaysAverage: 0,
        optimalSleep: SLEEP_THRESHOLDS.optimal,
        cumulativeDebt: 0,
        debtLevel: "none",
        recoveryRecommendation:
          "No sleep data available. Log your sleep to track recovery.",
        trainingImpact: 1.0,
        daysToRecover: 0,
      };
    }

    // Get last 7 days
    const last7Days = sleepEntries.slice(0, 7);
    const average =
      last7Days.reduce((sum, e) => sum + (e.hours || 0), 0) / last7Days.length;

    // Calculate cumulative debt (hours below optimal over 7 days)
    const debt = Math.max(
      0,
      (SLEEP_THRESHOLDS.optimal - average) * last7Days.length,
    );

    // Determine debt level
    let debtLevel: SleepDebtAnalysis["debtLevel"] = "none";
    if (debt >= SLEEP_THRESHOLDS.debtSevere) {
      debtLevel = "severe";
    } else if (debt >= SLEEP_THRESHOLDS.debtModerate) {
      debtLevel = "moderate";
    } else if (debt >= SLEEP_THRESHOLDS.debtMild) {
      debtLevel = "mild";
    }

    // Calculate training impact (3% reduction per hour of debt, min 50%)
    const trainingImpact = Math.max(0.5, 1 - debt * 0.03);

    // Estimate days to recover (1 hour of extra sleep per night)
    const daysToRecover = Math.ceil(debt);

    // Generate recommendation
    let recommendation = "";
    switch (debtLevel) {
      case "severe":
        recommendation =
          "⚠️ CRITICAL: Severe sleep debt detected. Reduce training intensity by 50% and prioritize 9+ hours of sleep for the next week.";
        break;
      case "moderate":
        recommendation =
          "Moderate sleep debt. Consider reducing high-intensity sessions and aim for 8.5+ hours of sleep.";
        break;
      case "mild":
        recommendation =
          "Mild sleep debt. Maintain current training but prioritize 8+ hours of sleep.";
        break;
      default:
        recommendation =
          "Sleep is adequate. Maintain current sleep habits for optimal recovery.";
    }

    const result: SleepDebtAnalysis = {
      last7DaysAverage: Math.round(average * 10) / 10,
      optimalSleep: SLEEP_THRESHOLDS.optimal,
      cumulativeDebt: Math.round(debt * 10) / 10,
      debtLevel,
      recoveryRecommendation: recommendation,
      trainingImpact: Math.round(trainingImpact * 100) / 100,
      daysToRecover,
    };

    this._sleepDebt.set(result);
    return result;
  }

  /**
   * Load and calculate weekly movement totals
   */
  async loadWeeklyMovements(userId?: string): Promise<MovementTotals | null> {
    const targetUserId = userId || this.userId();
    if (!targetUserId) return null;

    try {
      // Get current week's sessions
      const weekStart = this.getWeekStart(new Date());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const { data: sessions, error } = await this.supabaseService.client
        .from("training_sessions")
        .select("*")
        .eq("user_id", targetUserId)
        .gte("session_date", weekStart.toISOString().split("T")[0])
        .lte("session_date", weekEnd.toISOString().split("T")[0])
        .order("session_date", { ascending: true });

      if (error) {
        this.logger.error("[TrainingSafety] Error loading sessions:", error);
        return null;
      }

      // Calculate totals
      const totals: MovementTotals = {
        sprints: 0,
        cuts: 0,
        throws: 0,
        jumps: 0,
        totalSessions: sessions?.length || 0,
        highIntensitySessions: 0,
        consecutiveTrainingDays: 0,
        consecutiveHighIntensityDays: 0,
        restDays: 0,
      };

      if (sessions) {
        sessions.forEach((session) => {
          totals.sprints += session.sprint_repetitions || 0;
          totals.cuts += session.cutting_movements || 0;
          totals.throws += session.throws || session.route_running_volume || 0;
          totals.jumps += session.jumps || 0;

          const rpe = session.rpe || session.intensity_level || 5;
          if (rpe >= 7) {
            totals.highIntensitySessions++;
          }
        });

        // Calculate consecutive days
        const sessionDates = sessions.map((s) => s.session_date);
        totals.consecutiveTrainingDays =
          this.calculateConsecutiveDays(sessionDates);

        // Calculate rest days (7 - training days)
        const uniqueDays = new Set(sessionDates).size;
        totals.restDays = 7 - uniqueDays;
      }

      this._weeklyMovements.set(totals);
      return totals;
    } catch (error) {
      this.logger.error("[TrainingSafety] Error calculating movements:", error);
      return null;
    }
  }

  /**
   * Calculate consecutive training days
   */
  private calculateConsecutiveDays(dates: string[]): number {
    if (dates.length === 0) return 0;

    const sortedDates = [...new Set(dates)].sort();
    let maxConsecutive = 1;
    let currentConsecutive = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.round(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 1) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 1;
      }
    }

    return maxConsecutive;
  }

  /**
   * Get start of current week (Monday)
   */
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  /**
   * Perform comprehensive safety check before training
   */
  async performSafetyCheck(
    plannedSession: {
      intensity: "low" | "medium" | "high";
      duration: number;
      sprints?: number;
      cuts?: number;
      throws?: number;
      jumps?: number;
    },
    userId?: string,
  ): Promise<SafetyCheckResult> {
    const warnings: SafetyWarning[] = [];
    const recommendations: string[] = [];
    let overallRisk: SafetyCheckResult["overallRisk"] = "low";

    // Load current data if not cached
    const age = this._athleteAge() || (await this.loadAthleteAge(userId));
    const movements =
      this._weeklyMovements() || (await this.loadWeeklyMovements(userId));
    const limits = this.getAdjustedLimits(age || undefined);
    const profile = age ? this.getAgeAdjustedProfile(age) : null;

    // 1. Check if age data is missing
    if (!age) {
      warnings.push({
        id: "missing_age",
        type: "data_quality",
        severity: "warning",
        title: "Age Not Set",
        message:
          "Your birth date is not set. Recovery recommendations may be inaccurate.",
        recommendation:
          "Update your profile with your birth date for personalized recovery guidance.",
        timestamp: new Date(),
      });
    }

    // 2. Check weekly session limits
    if (movements) {
      if (movements.totalSessions >= limits.maxSessionsPerWeek) {
        warnings.push({
          id: "session_limit",
          type: "frequency",
          severity: "danger",
          title: "Weekly Session Limit Reached",
          message: `You've completed ${movements.totalSessions} sessions this week. Maximum recommended: ${limits.maxSessionsPerWeek}.`,
          recommendation:
            "Take a rest day. Additional training increases injury risk.",
          metric: "sessions_per_week",
          currentValue: movements.totalSessions,
          threshold: limits.maxSessionsPerWeek,
          timestamp: new Date(),
        });
        overallRisk = "high";
      }

      // Check high-intensity limit
      if (
        plannedSession.intensity === "high" &&
        movements.highIntensitySessions >= limits.maxHighIntensityPerWeek
      ) {
        warnings.push({
          id: "high_intensity_limit",
          type: "intensity",
          severity: "danger",
          title: "High-Intensity Limit Reached",
          message: `You've completed ${movements.highIntensitySessions} high-intensity sessions this week.`,
          recommendation:
            "Switch to low or medium intensity, or take a rest day.",
          metric: "high_intensity_sessions",
          currentValue: movements.highIntensitySessions,
          threshold: limits.maxHighIntensityPerWeek,
          timestamp: new Date(),
        });
        overallRisk = "high";
      }

      // Check consecutive training days
      if (
        movements.consecutiveTrainingDays >= limits.maxConsecutiveTrainingDays
      ) {
        warnings.push({
          id: "consecutive_days",
          type: "recovery",
          severity: "warning",
          title: "Consecutive Training Days",
          message: `You've trained ${movements.consecutiveTrainingDays} days in a row.`,
          recommendation: "Take a rest day to allow recovery and adaptation.",
          metric: "consecutive_days",
          currentValue: movements.consecutiveTrainingDays,
          threshold: limits.maxConsecutiveTrainingDays,
          timestamp: new Date(),
        });
        if (overallRisk === "low") overallRisk = "moderate";
      }

      // Check rest days
      if (movements.restDays < limits.minRestDaysPerWeek) {
        warnings.push({
          id: "insufficient_rest",
          type: "recovery",
          severity: "warning",
          title: "Insufficient Rest Days",
          message: `Only ${movements.restDays} rest day(s) this week. Minimum: ${limits.minRestDaysPerWeek}.`,
          recommendation: "Schedule at least one complete rest day per week.",
          timestamp: new Date(),
        });
      }

      // 3. Check movement-specific limits
      if (plannedSession.sprints) {
        const projectedSprints = movements.sprints + plannedSession.sprints;
        if (plannedSession.sprints > limits.maxSprintsPerSession) {
          warnings.push({
            id: "sprint_session_limit",
            type: "movement",
            severity: "danger",
            title: "Sprint Volume Too High",
            message: `Planned ${plannedSession.sprints} sprints exceeds session limit of ${limits.maxSprintsPerSession}.`,
            recommendation:
              "Reduce sprint volume to prevent hamstring injury risk.",
            metric: "sprints_per_session",
            currentValue: plannedSession.sprints,
            threshold: limits.maxSprintsPerSession,
            timestamp: new Date(),
          });
          overallRisk = "high";
        }
        if (projectedSprints > limits.maxSprintsPerWeek) {
          warnings.push({
            id: "sprint_weekly_limit",
            type: "movement",
            severity: "warning",
            title: "Weekly Sprint Limit Approaching",
            message: `This session would bring weekly sprints to ${projectedSprints}/${limits.maxSprintsPerWeek}.`,
            recommendation: "Consider reducing sprint volume.",
            timestamp: new Date(),
          });
        }
      }

      // Similar checks for cuts
      if (plannedSession.cuts) {
        const _projectedCuts = movements.cuts + plannedSession.cuts;
        if (plannedSession.cuts > limits.maxCutsPerSession) {
          warnings.push({
            id: "cuts_session_limit",
            type: "movement",
            severity: "danger",
            title: "Cutting Volume Too High",
            message: `Planned ${plannedSession.cuts} cuts exceeds session limit of ${limits.maxCutsPerSession}.`,
            recommendation:
              "Reduce cutting movements to prevent knee/ankle injury risk.",
            metric: "cuts_per_session",
            currentValue: plannedSession.cuts,
            threshold: limits.maxCutsPerSession,
            timestamp: new Date(),
          });
          overallRisk = "high";
        }
      }
    }

    // 4. Check sleep debt
    const sleepDebt = this._sleepDebt();
    if (sleepDebt && sleepDebt.debtLevel !== "none") {
      const severity: WarningSeverity =
        sleepDebt.debtLevel === "severe"
          ? "critical"
          : sleepDebt.debtLevel === "moderate"
            ? "danger"
            : "warning";

      warnings.push({
        id: "sleep_debt",
        type: "recovery",
        severity,
        title: `${sleepDebt.debtLevel.charAt(0).toUpperCase() + sleepDebt.debtLevel.slice(1)} Sleep Debt`,
        message: `${sleepDebt.cumulativeDebt} hours of sleep debt accumulated. Average: ${sleepDebt.last7DaysAverage}h/night.`,
        recommendation: sleepDebt.recoveryRecommendation,
        metric: "sleep_debt_hours",
        currentValue: sleepDebt.cumulativeDebt,
        threshold: SLEEP_THRESHOLDS.debtMild,
        timestamp: new Date(),
      });

      if (sleepDebt.debtLevel === "severe") {
        overallRisk = "critical";
      } else if (
        sleepDebt.debtLevel === "moderate" &&
        (overallRisk as string) !== "critical"
      ) {
        overallRisk = "high";
      }
    }

    // 5. Age-specific warnings
    if (profile && profile.ageGroup === "masters") {
      recommendations.push(
        "As a masters athlete (35+), ensure 48+ hours between high-intensity sessions.",
      );
    }
    if (profile && profile.ageGroup === "senior") {
      recommendations.push(
        "As a senior athlete (45+), prioritize recovery and consider reducing session frequency.",
      );
    }

    // Calculate adjustments
    let adjustedIntensity = 1.0;
    let adjustedVolume = 1.0;

    if (overallRisk === "critical") {
      adjustedIntensity = 0.3;
      adjustedVolume = 0.3;
      recommendations.push(
        "CRITICAL: Consider skipping this session or doing light recovery only.",
      );
    } else if (overallRisk === "high") {
      adjustedIntensity = 0.6;
      adjustedVolume = 0.7;
      recommendations.push(
        "Reduce intensity and volume significantly for this session.",
      );
    } else if (overallRisk === "moderate") {
      adjustedIntensity = 0.8;
      adjustedVolume = 0.85;
      recommendations.push("Consider a lighter session today.");
    }

    // Apply sleep debt impact
    if (sleepDebt) {
      adjustedIntensity *= sleepDebt.trainingImpact;
      adjustedVolume *= sleepDebt.trainingImpact;
    }

    // Update active warnings
    this._activeWarnings.set(warnings);

    return {
      isApproved: overallRisk !== "critical",
      overallRisk,
      warnings,
      recommendations,
      adjustedIntensity: Math.round(adjustedIntensity * 100) / 100,
      adjustedVolume: Math.round(adjustedVolume * 100) / 100,
    };
  }

  /**
   * Get recovery recommendation based on last session
   */
  getRecoveryRecommendation(
    lastSessionIntensity: "low" | "medium" | "high",
    lastSessionDate: Date,
  ): {
    minRestHours: number;
    recommendedRestHours: number;
    canTrainHighIntensity: boolean;
    message: string;
  } {
    const profile = this._athleteProfile();
    const recoveryMultiplier = profile?.recoveryTimeMultiplier || 1.0;

    // Base recovery times in hours
    const baseRecovery = {
      low: { min: 12, recommended: 24 },
      medium: { min: 24, recommended: 36 },
      high: { min: 36, recommended: 48 },
    };

    const recovery = baseRecovery[lastSessionIntensity];
    const minRestHours = Math.round(recovery.min * recoveryMultiplier);
    const recommendedRestHours = Math.round(
      recovery.recommended * recoveryMultiplier,
    );

    // Calculate hours since last session
    const hoursSinceSession =
      (new Date().getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60);

    const canTrainHighIntensity = hoursSinceSession >= minRestHours;

    let message = "";
    if (hoursSinceSession < minRestHours) {
      const hoursRemaining = Math.ceil(minRestHours - hoursSinceSession);
      message = `Wait ${hoursRemaining} more hours before high-intensity training.`;
    } else if (hoursSinceSession < recommendedRestHours) {
      message =
        "Minimum recovery met. Consider medium intensity for optimal adaptation.";
    } else {
      message = "Fully recovered. Ready for any intensity level.";
    }

    return {
      minRestHours,
      recommendedRestHours,
      canTrainHighIntensity,
      message,
    };
  }

  /**
   * Clear all cached data
   */
  reset(): void {
    this._athleteAge.set(null);
    this._athleteProfile.set(null);
    this._weeklyMovements.set(null);
    this._sleepDebt.set(null);
    this._activeWarnings.set([]);
    this.logger.info("[TrainingSafety] Service reset");
  }
}
