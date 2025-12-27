/**
 * Phase-Based Load Calculator Service
 *
 * EVIDENCE-BASED TRAINING LOAD CALCULATION FOR FLAG FOOTBALL
 *
 * This service calculates appropriate training loads based on:
 * - Current training phase (periodization)
 * - Athlete's training history and capacity
 * - ACWR (Acute:Chronic Workload Ratio) guidelines
 * - Phase-specific volume and intensity targets
 *
 * Research Base:
 * - Gabbett (2016) - Training-Injury Prevention Paradox
 * - Foster et al. (2001) - Session RPE method
 * - Impellizzeri et al. (2004) - Training load monitoring
 * - Hulin et al. (2014) - Spikes in acute workload
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { LoggerService } from "./logger.service";

// ============================================================================
// INTERFACES
// ============================================================================

export interface TrainingLoad {
  sessionRPE: number; // 1-10
  duration: number; // minutes
  load: number; // AU (Arbitrary Units) = RPE × Duration
  type: TrainingType;
  date: Date;
}

export type TrainingType =
  | "strength"
  | "speed"
  | "agility"
  | "conditioning"
  | "sport_specific"
  | "recovery"
  | "game";

export interface WeeklyLoadTarget {
  phase: string;
  minLoad: number; // AU
  maxLoad: number; // AU
  targetLoad: number; // AU
  strengthSessions: number;
  speedSessions: number;
  agilitySessions: number;
  conditioningSessions: number;
  recoveryDays: number;
  gameDays: number;
}

export interface LoadRecommendation {
  recommendedLoad: number;
  loadRange: [number, number];
  sessionDistribution: SessionDistribution[];
  warnings: string[];
  adjustments: string[];
  evidenceBase: string[];
}

export interface SessionDistribution {
  day: string;
  type: TrainingType;
  targetRPE: number;
  targetDuration: number;
  targetLoad: number;
  notes: string;
}

export interface ACWRCalculation {
  acuteLoad: number; // 7-day rolling average
  chronicLoad: number; // 28-day rolling average (EWMA)
  acwr: number;
  riskZone: "optimal" | "caution" | "danger";
  recommendation: string;
}

export interface PhaseLoadConfig {
  phase: string;
  volumeMultiplier: number; // 0.3-1.2
  intensityMultiplier: number; // 0.4-1.0
  baseWeeklyLoad: number; // AU
  maxWeeklyIncrease: number; // percentage
  strengthEmphasis: number; // 0-1
  speedEmphasis: number; // 0-1
  agilityEmphasis: number; // 0-1
  conditioningEmphasis: number; // 0-1
  recoveryEmphasis: number; // 0-1
}

export interface LoadProgressionModel {
  week: number;
  targetLoad: number;
  loadType: "build" | "maintain" | "deload" | "peak";
  notes: string;
}

// ============================================================================
// PHASE-SPECIFIC LOAD CONFIGURATIONS
// ============================================================================

const PHASE_LOAD_CONFIGS: Record<string, PhaseLoadConfig> = {
  off_season_rest: {
    phase: "Off-Season Rest",
    volumeMultiplier: 0.3,
    intensityMultiplier: 0.4,
    baseWeeklyLoad: 1500, // AU
    maxWeeklyIncrease: 0,
    strengthEmphasis: 0.1,
    speedEmphasis: 0,
    agilityEmphasis: 0,
    conditioningEmphasis: 0.2,
    recoveryEmphasis: 0.7,
  },
  foundation: {
    phase: "Foundation",
    volumeMultiplier: 0.6,
    intensityMultiplier: 0.6,
    baseWeeklyLoad: 2000,
    maxWeeklyIncrease: 10,
    strengthEmphasis: 0.3,
    speedEmphasis: 0.15,
    agilityEmphasis: 0.15,
    conditioningEmphasis: 0.25,
    recoveryEmphasis: 0.15,
  },
  strength_accumulation: {
    phase: "Strength Accumulation",
    volumeMultiplier: 0.8,
    intensityMultiplier: 0.8,
    baseWeeklyLoad: 2500,
    maxWeeklyIncrease: 10,
    strengthEmphasis: 0.4,
    speedEmphasis: 0.15,
    agilityEmphasis: 0.15,
    conditioningEmphasis: 0.15,
    recoveryEmphasis: 0.15,
  },
  power_development: {
    phase: "Power Development",
    volumeMultiplier: 0.9,
    intensityMultiplier: 0.85,
    baseWeeklyLoad: 2800,
    maxWeeklyIncrease: 8,
    strengthEmphasis: 0.25,
    speedEmphasis: 0.25,
    agilityEmphasis: 0.2,
    conditioningEmphasis: 0.15,
    recoveryEmphasis: 0.15,
  },
  speed_development: {
    phase: "Speed Development",
    volumeMultiplier: 1.0,
    intensityMultiplier: 0.95,
    baseWeeklyLoad: 3000,
    maxWeeklyIncrease: 5,
    strengthEmphasis: 0.15,
    speedEmphasis: 0.35,
    agilityEmphasis: 0.25,
    conditioningEmphasis: 0.1,
    recoveryEmphasis: 0.15,
  },
  competition_prep: {
    phase: "Competition Prep",
    volumeMultiplier: 0.85,
    intensityMultiplier: 0.9,
    baseWeeklyLoad: 2600,
    maxWeeklyIncrease: 5,
    strengthEmphasis: 0.2,
    speedEmphasis: 0.25,
    agilityEmphasis: 0.25,
    conditioningEmphasis: 0.1,
    recoveryEmphasis: 0.2,
  },
  in_season_maintenance: {
    phase: "In-Season Maintenance",
    volumeMultiplier: 0.6,
    intensityMultiplier: 0.85,
    baseWeeklyLoad: 2200,
    maxWeeklyIncrease: 0,
    strengthEmphasis: 0.2,
    speedEmphasis: 0.15,
    agilityEmphasis: 0.15,
    conditioningEmphasis: 0.1,
    recoveryEmphasis: 0.4,
  },
  mid_season_reload: {
    phase: "Mid-Season Reload (July)",
    volumeMultiplier: 0.8,
    intensityMultiplier: 0.75,
    baseWeeklyLoad: 2600,
    maxWeeklyIncrease: 10,
    strengthEmphasis: 0.2,
    speedEmphasis: 0.3,
    agilityEmphasis: 0.2,
    conditioningEmphasis: 0.15,
    recoveryEmphasis: 0.15,
  },
  peak: {
    phase: "Peak",
    volumeMultiplier: 0.7,
    intensityMultiplier: 0.95,
    baseWeeklyLoad: 2000,
    maxWeeklyIncrease: 0,
    strengthEmphasis: 0.15,
    speedEmphasis: 0.3,
    agilityEmphasis: 0.25,
    conditioningEmphasis: 0.05,
    recoveryEmphasis: 0.25,
  },
  taper: {
    phase: "Taper",
    volumeMultiplier: 0.5,
    intensityMultiplier: 0.9,
    baseWeeklyLoad: 1500,
    maxWeeklyIncrease: 0,
    strengthEmphasis: 0.1,
    speedEmphasis: 0.25,
    agilityEmphasis: 0.2,
    conditioningEmphasis: 0,
    recoveryEmphasis: 0.45,
  },
  active_recovery: {
    phase: "Active Recovery",
    volumeMultiplier: 0.3,
    intensityMultiplier: 0.4,
    baseWeeklyLoad: 1000,
    maxWeeklyIncrease: 0,
    strengthEmphasis: 0.1,
    speedEmphasis: 0,
    agilityEmphasis: 0,
    conditioningEmphasis: 0.2,
    recoveryEmphasis: 0.7,
  },
};

// ============================================================================
// EVIDENCE-BASED CONSTANTS
// ============================================================================

const LOAD_CONSTANTS = {
  // ACWR zones (Gabbett 2016)
  acwr: {
    optimalMin: 0.8,
    optimalMax: 1.3,
    cautionMax: 1.5,
    dangerThreshold: 1.5,
  },

  // Weekly load change limits (Hulin et al. 2014)
  weeklyChange: {
    maxIncrease: 10, // percentage
    maxDecrease: 30, // percentage (for deload)
    spikeThreshold: 15, // percentage - above this increases injury risk
  },

  // Session RPE guidelines (Foster et al. 2001)
  sessionRPE: {
    recovery: [1, 3],
    easy: [3, 5],
    moderate: [5, 7],
    hard: [7, 9],
    maximal: [9, 10],
  },

  // Game load estimation
  gameLoad: {
    averageRPE: 8,
    averageDuration: 90, // minutes
    averageLoad: 720, // AU
  },

  // Minimum chronic load floor (Gabbett 2016)
  minChronicLoad: 1500, // AU - athletes below this are underprepared
};

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: "root",
})
export class PhaseLoadCalculatorService {
  private logger = inject(LoggerService);

  // State
  private readonly _trainingHistory = signal<TrainingLoad[]>([]);
  private readonly _currentACWR = signal<ACWRCalculation | null>(null);
  private readonly _weeklyTarget = signal<WeeklyLoadTarget | null>(null);

  // Public signals
  readonly trainingHistory = this._trainingHistory.asReadonly();
  readonly currentACWR = this._currentACWR.asReadonly();
  readonly weeklyTarget = this._weeklyTarget.asReadonly();

  // Computed
  readonly acuteLoad = computed(() => this.calculateAcuteLoad(this._trainingHistory()));
  readonly chronicLoad = computed(() => this.calculateChronicLoad(this._trainingHistory()));
  readonly acwr = computed(() => {
    const acute = this.acuteLoad();
    const chronic = this.chronicLoad();
    return chronic > 0 ? acute / chronic : 0;
  });

  /**
   * Get phase load configuration
   */
  getPhaseConfig(phase: string): PhaseLoadConfig | undefined {
    return PHASE_LOAD_CONFIGS[phase];
  }

  /**
   * Get all phase configurations
   */
  getAllPhaseConfigs(): PhaseLoadConfig[] {
    return Object.values(PHASE_LOAD_CONFIGS);
  }

  /**
   * Calculate recommended load for a phase
   */
  calculatePhaseLoad(
    phase: string,
    athleteChronicLoad: number,
    weekInPhase: number
  ): LoadRecommendation {
    const config = this.getPhaseConfig(phase);
    if (!config) {
      return this.getDefaultRecommendation();
    }

    const warnings: string[] = [];
    const adjustments: string[] = [];
    const evidenceBase: string[] = [];

    // Calculate base target load
    let targetLoad = config.baseWeeklyLoad * config.volumeMultiplier;

    // Adjust for athlete's chronic load capacity
    if (athleteChronicLoad > 0) {
      // Don't exceed 1.3x chronic load (ACWR guideline)
      const maxSafeLoad = athleteChronicLoad * LOAD_CONSTANTS.acwr.optimalMax * 7;
      if (targetLoad > maxSafeLoad) {
        targetLoad = maxSafeLoad;
        adjustments.push(
          `Load capped at ${Math.round(maxSafeLoad)} AU to maintain safe ACWR`
        );
      }
    }

    // Progressive overload within phase
    if (config.maxWeeklyIncrease > 0 && weekInPhase > 1) {
      const progressionFactor = 1 + (config.maxWeeklyIncrease / 100) * (weekInPhase - 1);
      targetLoad *= Math.min(progressionFactor, 1.3); // Cap at 30% increase
    }

    // Week 4 deload
    if (weekInPhase === 4) {
      targetLoad *= 0.7;
      adjustments.push("Deload week - reduced volume to 70%");
    }

    // Check chronic load floor
    if (athleteChronicLoad < LOAD_CONSTANTS.minChronicLoad) {
      warnings.push(
        `Chronic load (${Math.round(athleteChronicLoad)} AU) is below minimum threshold (${LOAD_CONSTANTS.minChronicLoad} AU). ` +
        "Athlete may be underprepared - build gradually."
      );
      evidenceBase.push("Gabbett 2016 - Minimum chronic load floor");
    }

    // Calculate load range
    const loadRange: [number, number] = [
      Math.round(targetLoad * 0.85),
      Math.round(targetLoad * 1.15),
    ];

    // Generate session distribution
    const sessionDistribution = this.generateSessionDistribution(config, targetLoad);

    evidenceBase.push(
      "Foster et al. 2001 - Session RPE method",
      "Gabbett 2016 - ACWR guidelines",
      "Hulin et al. 2014 - Weekly load progression"
    );

    return {
      recommendedLoad: Math.round(targetLoad),
      loadRange,
      sessionDistribution,
      warnings,
      adjustments,
      evidenceBase,
    };
  }

  /**
   * Generate session distribution for the week
   */
  private generateSessionDistribution(
    config: PhaseLoadConfig,
    totalLoad: number
  ): SessionDistribution[] {
    const sessions: SessionDistribution[] = [];
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    // Calculate load per emphasis area
    const strengthLoad = totalLoad * config.strengthEmphasis;
    const speedLoad = totalLoad * config.speedEmphasis;
    const agilityLoad = totalLoad * config.agilityEmphasis;
    const conditioningLoad = totalLoad * config.conditioningEmphasis;

    // Monday - Primary strength/power
    if (config.strengthEmphasis > 0.1) {
      sessions.push({
        day: "Monday",
        type: "strength",
        targetRPE: 7,
        targetDuration: Math.round(strengthLoad / 2 / 7),
        targetLoad: Math.round(strengthLoad / 2),
        notes: "Primary strength session",
      });
    }

    // Tuesday - Speed/Agility
    if (config.speedEmphasis > 0.1) {
      sessions.push({
        day: "Tuesday",
        type: "speed",
        targetRPE: 8,
        targetDuration: Math.round(speedLoad / 8),
        targetLoad: Math.round(speedLoad / 2),
        notes: "Speed and acceleration work",
      });
    }

    // Wednesday - Recovery or light conditioning
    sessions.push({
      day: "Wednesday",
      type: config.recoveryEmphasis > 0.3 ? "recovery" : "conditioning",
      targetRPE: config.recoveryEmphasis > 0.3 ? 3 : 5,
      targetDuration: 30,
      targetLoad: Math.round(conditioningLoad / 3),
      notes: config.recoveryEmphasis > 0.3 ? "Active recovery" : "Light conditioning",
    });

    // Thursday - Secondary strength or agility
    if (config.agilityEmphasis > 0.1) {
      sessions.push({
        day: "Thursday",
        type: "agility",
        targetRPE: 7,
        targetDuration: Math.round(agilityLoad / 7),
        targetLoad: Math.round(agilityLoad),
        notes: "Agility and COD work",
      });
    } else if (config.strengthEmphasis > 0.1) {
      sessions.push({
        day: "Thursday",
        type: "strength",
        targetRPE: 6,
        targetDuration: Math.round(strengthLoad / 2 / 6),
        targetLoad: Math.round(strengthLoad / 2),
        notes: "Secondary strength session",
      });
    }

    // Friday - Sport specific or speed
    sessions.push({
      day: "Friday",
      type: "sport_specific",
      targetRPE: 6,
      targetDuration: 45,
      targetLoad: Math.round(speedLoad / 2),
      notes: "Sport-specific preparation",
    });

    // Saturday - Game or training
    if (config.phase.includes("Season") || config.phase.includes("Competition")) {
      sessions.push({
        day: "Saturday",
        type: "game",
        targetRPE: 8,
        targetDuration: 90,
        targetLoad: LOAD_CONSTANTS.gameLoad.averageLoad,
        notes: "Game day",
      });
    } else {
      sessions.push({
        day: "Saturday",
        type: "conditioning",
        targetRPE: 5,
        targetDuration: 30,
        targetLoad: Math.round(conditioningLoad / 3),
        notes: "Optional conditioning",
      });
    }

    // Sunday - Rest
    sessions.push({
      day: "Sunday",
      type: "recovery",
      targetRPE: 1,
      targetDuration: 0,
      targetLoad: 0,
      notes: "Complete rest",
    });

    return sessions;
  }

  /**
   * Calculate ACWR from training history
   */
  calculateACWR(trainingHistory: TrainingLoad[]): ACWRCalculation {
    const acuteLoad = this.calculateAcuteLoad(trainingHistory);
    const chronicLoad = this.calculateChronicLoad(trainingHistory);

    // Apply minimum chronic load floor
    const effectiveChronicLoad = Math.max(
      chronicLoad,
      LOAD_CONSTANTS.minChronicLoad / 7
    );

    const acwr = acuteLoad / effectiveChronicLoad;

    let riskZone: "optimal" | "caution" | "danger";
    let recommendation: string;

    if (acwr >= LOAD_CONSTANTS.acwr.optimalMin && acwr <= LOAD_CONSTANTS.acwr.optimalMax) {
      riskZone = "optimal";
      recommendation = "Training load is in the optimal zone. Continue current program.";
    } else if (acwr > LOAD_CONSTANTS.acwr.dangerThreshold) {
      riskZone = "danger";
      recommendation = `ACWR (${acwr.toFixed(2)}) exceeds danger threshold (1.5). ` +
        "Reduce training load immediately to prevent injury.";
    } else if (acwr > LOAD_CONSTANTS.acwr.optimalMax) {
      riskZone = "caution";
      recommendation = `ACWR (${acwr.toFixed(2)}) is elevated. ` +
        "Consider reducing volume or intensity next week.";
    } else {
      riskZone = "caution";
      recommendation = `ACWR (${acwr.toFixed(2)}) is below optimal. ` +
        "Athlete may be underprepared. Consider gradual load increase.";
    }

    const result: ACWRCalculation = {
      acuteLoad: Math.round(acuteLoad),
      chronicLoad: Math.round(chronicLoad),
      acwr: parseFloat(acwr.toFixed(2)),
      riskZone,
      recommendation,
    };

    this._currentACWR.set(result);
    return result;
  }

  /**
   * Calculate acute load (7-day rolling average)
   */
  calculateAcuteLoad(trainingHistory: TrainingLoad[]): number {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentLoads = trainingHistory.filter(
      (t) => new Date(t.date) >= sevenDaysAgo
    );

    const totalLoad = recentLoads.reduce((sum, t) => sum + t.load, 0);
    return totalLoad / 7; // Daily average
  }

  /**
   * Calculate chronic load using EWMA (28-day)
   */
  calculateChronicLoad(trainingHistory: TrainingLoad[]): number {
    if (trainingHistory.length === 0) return 0;

    // Sort by date
    const sorted = [...trainingHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // EWMA decay factor for 28-day chronic load
    const lambda = 2 / (28 + 1);

    let ewma = sorted[0].load;
    for (let i = 1; i < sorted.length; i++) {
      ewma = lambda * sorted[i].load + (1 - lambda) * ewma;
    }

    return ewma;
  }

  /**
   * Calculate session load
   */
  calculateSessionLoad(rpe: number, duration: number): number {
    return rpe * duration;
  }

  /**
   * Get weekly load target for phase
   */
  getWeeklyLoadTarget(phase: string): WeeklyLoadTarget {
    const config = this.getPhaseConfig(phase);
    if (!config) {
      return this.getDefaultWeeklyTarget();
    }

    const targetLoad = config.baseWeeklyLoad * config.volumeMultiplier;

    return {
      phase: config.phase,
      minLoad: Math.round(targetLoad * 0.85),
      maxLoad: Math.round(targetLoad * 1.15),
      targetLoad: Math.round(targetLoad),
      strengthSessions: config.strengthEmphasis > 0.2 ? 2 : config.strengthEmphasis > 0.1 ? 1 : 0,
      speedSessions: config.speedEmphasis > 0.2 ? 2 : config.speedEmphasis > 0.1 ? 1 : 0,
      agilitySessions: config.agilityEmphasis > 0.2 ? 2 : config.agilityEmphasis > 0.1 ? 1 : 0,
      conditioningSessions: config.conditioningEmphasis > 0.1 ? 1 : 0,
      recoveryDays: config.recoveryEmphasis > 0.3 ? 2 : 1,
      gameDays: config.phase.includes("Season") ? 1 : 0,
    };
  }

  /**
   * Generate 4-week load progression
   */
  generateLoadProgression(
    phase: string,
    startingLoad: number
  ): LoadProgressionModel[] {
    const config = this.getPhaseConfig(phase);
    if (!config) {
      return [];
    }

    const progression: LoadProgressionModel[] = [];
    let currentLoad = startingLoad;

    for (let week = 1; week <= 4; week++) {
      let loadType: "build" | "maintain" | "deload" | "peak";
      let notes: string;

      if (week === 4) {
        // Week 4 is always deload
        loadType = "deload";
        currentLoad *= 0.7;
        notes = "Deload week - reduce volume, maintain intensity";
      } else if (config.maxWeeklyIncrease > 0) {
        // Building phase
        loadType = "build";
        if (week > 1) {
          currentLoad *= 1 + config.maxWeeklyIncrease / 100;
        }
        notes = `Build week - ${config.maxWeeklyIncrease}% increase`;
      } else if (config.phase === "Peak" || config.phase === "Taper") {
        // Peaking phase
        loadType = "peak";
        notes = "Peak/taper week - high intensity, reduced volume";
      } else {
        // Maintenance phase
        loadType = "maintain";
        notes = "Maintenance week - stable load";
      }

      progression.push({
        week,
        targetLoad: Math.round(currentLoad),
        loadType,
        notes,
      });
    }

    return progression;
  }

  /**
   * Check if weekly load change is safe
   */
  isLoadChangeSafe(previousWeekLoad: number, currentWeekLoad: number): {
    safe: boolean;
    percentageChange: number;
    message: string;
  } {
    if (previousWeekLoad === 0) {
      return {
        safe: true,
        percentageChange: 0,
        message: "No previous load data for comparison",
      };
    }

    const percentageChange =
      ((currentWeekLoad - previousWeekLoad) / previousWeekLoad) * 100;

    if (percentageChange > LOAD_CONSTANTS.weeklyChange.spikeThreshold) {
      return {
        safe: false,
        percentageChange: Math.round(percentageChange),
        message: `Load spike detected (${Math.round(percentageChange)}% increase). ` +
          `Spikes >15% increase injury risk (Hulin et al. 2014). Consider reducing load.`,
      };
    }

    if (percentageChange > LOAD_CONSTANTS.weeklyChange.maxIncrease) {
      return {
        safe: false,
        percentageChange: Math.round(percentageChange),
        message: `Load increase (${Math.round(percentageChange)}%) exceeds recommended maximum (10%). ` +
          `Consider a more gradual progression.`,
      };
    }

    return {
      safe: true,
      percentageChange: Math.round(percentageChange),
      message: `Load change (${Math.round(percentageChange)}%) is within safe limits.`,
    };
  }

  /**
   * Add training session to history
   */
  addTrainingSession(session: TrainingLoad): void {
    const history = this._trainingHistory();
    this._trainingHistory.set([...history, session]);
  }

  /**
   * Get load constants for reference
   */
  getLoadConstants() {
    return LOAD_CONSTANTS;
  }

  /**
   * Default recommendation when no phase config found
   */
  private getDefaultRecommendation(): LoadRecommendation {
    return {
      recommendedLoad: 2000,
      loadRange: [1700, 2300],
      sessionDistribution: [],
      warnings: ["No phase configuration found - using defaults"],
      adjustments: [],
      evidenceBase: [],
    };
  }

  /**
   * Default weekly target
   */
  private getDefaultWeeklyTarget(): WeeklyLoadTarget {
    return {
      phase: "Unknown",
      minLoad: 1500,
      maxLoad: 2500,
      targetLoad: 2000,
      strengthSessions: 2,
      speedSessions: 1,
      agilitySessions: 1,
      conditioningSessions: 1,
      recoveryDays: 1,
      gameDays: 0,
    };
  }
}
