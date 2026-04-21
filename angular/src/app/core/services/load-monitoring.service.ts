/**
 * Load Monitoring Service
 *
 * Handles multi-metric tracking for training load monitoring:
 * - External load (GPS, wearables, distance, sprints)
 * - Internal load (sRPE, heart rate, wellness)
 * - Load calculations and aggregation
 * - Database persistence to workout_logs table
 *
 * Integrates with ACWR service for injury prevention
 *
 * @author FlagFit Pro Team
 * @version 2.0.0 - Added database integration
 */

import { computed, inject, Injectable, signal } from "@angular/core";
import {
  ExternalLoad,
  InternalLoad,
  LoadCalculationOptions,
  LoadMetrics,
  SessionType,
  TrainingSession,
  WellnessMetrics,
} from "../models/acwr.models";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";

@Injectable({
  providedIn: "root",
})
export class LoadMonitoringService {
  private supabaseService = inject(SupabaseService);
  private logger = inject(LoggerService);

  // Get current user ID reactively
  private userId = computed(() => this.supabaseService.userId());

  // Current session being tracked
  private currentSession = signal<Partial<TrainingSession> | null>(null);

  // Load calculation preferences
  private calculationOptions = signal<LoadCalculationOptions>({
    includeWellness: true,
    externalLoadWeight: 0.5, // 50/50 split between external/internal
    usePlayerLoad: true,
    normalizeBySeason: false,
  });

  /**
   * Calculate internal load from sRPE
   * Formula: Session RPE (1-10) × Duration (minutes) = Workload (AU)
   *
   * @param sessionRPE - Rating of Perceived Exertion (1-10)
   * @param duration - Session duration in minutes
   * @param avgHeartRate - Optional average heart rate
   * @returns Internal load object
   *
   * @example
   * // Player rates session 6/10, trained for 100 minutes
   * // Load = 6 × 100 = 600 AU
   * calculateInternalLoad(6, 100)
   */
  public calculateInternalLoad(
    sessionRPE: number,
    duration: number,
    avgHeartRate?: number,
    maxHeartRate?: number,
  ): InternalLoad {
    // Validate inputs
    if (sessionRPE < 1 || sessionRPE > 10) {
      throw new Error("Session RPE must be between 1 and 10");
    }

    if (duration <= 0) {
      throw new Error("Duration must be positive");
    }

    const workload = sessionRPE * duration;

    return {
      sessionRPE,
      duration,
      workload,
      avgHeartRate,
      maxHeartRate,
    };
  }

  /**
   * Calculate external load score from GPS/wearable metrics
   *
   * Uses a weighted formula combining:
   * - Total distance (30%)
   * - Sprint distance (40%)
   * - Player load from device (30%)
   *
   * @param external - External load metrics
   * @returns Calculated external load score
   */
  public calculateExternalLoad(external: ExternalLoad): number {
    let score = 0;

    // Distance component (normalize to 10km = 100 points)
    const distanceScore = (external.totalDistance / 10000) * 100 * 0.3;
    score += distanceScore;

    // Sprint component (high-intensity work)
    // Normalize: 500m sprints = 100 points
    const sprintScore = (external.sprintDistance / 500) * 100 * 0.4;
    score += sprintScore;

    // Device player load (if available)
    if (external.playerLoad) {
      // PlayerData/Catapult typically range 0-1000
      const playerLoadScore = (external.playerLoad / 1000) * 100 * 0.3;
      score += playerLoadScore;
    } else {
      // Redistribute weight to sprint work if no device data
      const extraSprintScore = (external.sprintDistance / 500) * 100 * 0.3;
      score += extraSprintScore;
    }

    return Math.round(score);
  }

  /**
   * Calculate wellness-adjusted load factor
   * Poor wellness = multiply load by 1.0-1.3 (increases perceived load)
   * Good wellness = multiply load by 0.8-1.0 (decreases perceived load)
   *
   * @param wellness - Wellness metrics
   * @returns Adjustment factor (0.8-1.3)
   */
  public calculateWellnessFactor(wellness: WellnessMetrics): number {
    // Calculate composite wellness score (0-10)
    const wellnessScore =
      (wellness.sleepQuality +
        (wellness.sleepDuration >= 7 ? 10 : wellness.sleepDuration * 1.43) +
        wellness.muscleSoreness +
        (10 - wellness.stressLevel) + // Invert stress (lower is better)
        wellness.energyLevel +
        wellness.mood) /
      6;

    // Map wellness score to load factor
    // 10 = perfect wellness → 0.80 factor (session feels easier)
    // 5 = poor wellness → 1.15 factor (session feels harder)
    // 1 = very poor wellness → 1.30 factor (session very taxing)

    if (wellnessScore >= 8) return 0.8;
    if (wellnessScore >= 7) return 0.9;
    if (wellnessScore >= 6) return 1.0;
    if (wellnessScore >= 4) return 1.1;
    if (wellnessScore >= 2) return 1.2;
    return 1.3;
  }

  /**
   * Calculate combined load from external and internal metrics
   *
   * @param external - Optional external load data
   * @param internal - Internal load data (required)
   * @param wellness - Optional wellness data
   * @returns Complete load metrics with calculated load
   */
  public calculateCombinedLoad(
    internal: InternalLoad,
    external?: ExternalLoad,
    wellness?: WellnessMetrics,
  ): LoadMetrics {
    const options = this.calculationOptions();
    let calculatedLoad: number;

    if (external && options.externalLoadWeight > 0) {
      // Combined approach
      const externalScore = this.calculateExternalLoad(external);
      const internalScore = internal.workload;

      // Weighted average
      calculatedLoad =
        externalScore * options.externalLoadWeight +
        internalScore * (1 - options.externalLoadWeight);
    } else {
      // Internal load only (sRPE × duration)
      calculatedLoad = internal.workload;
    }

    // Apply wellness adjustment if enabled
    if (options.includeWellness && wellness) {
      const wellnessFactor = this.calculateWellnessFactor(wellness);
      calculatedLoad *= wellnessFactor;
    }

    return {
      type: external ? "combined" : "internal",
      external,
      internal,
      wellness,
      calculatedLoad: Math.round(calculatedLoad),
    };
  }

  /**
   * Create a training session record and save to database
   *
   * @param playerId - Player ID
   * @param sessionType - Type of training
   * @param internal - Internal load metrics
   * @param external - Optional external load
   * @param wellness - Optional wellness data
   * @param notes - Optional session notes
   * @returns Complete training session object with database ID
   */
  public async createSession(
    playerId: string,
    sessionType: SessionType,
    internal: InternalLoad,
    external?: ExternalLoad,
    wellness?: WellnessMetrics,
    notes?: string,
  ): Promise<TrainingSession> {
    const metrics = this.calculateCombinedLoad(internal, external, wellness);

    const session: TrainingSession = {
      playerId,
      date: new Date(),
      sessionType,
      metrics,
      load: metrics.calculatedLoad,
      notes,
      completed: true,
      modifiedFromPlan: false,
    };

    // Save to database
    try {
      const userId = this.userId();
      if (!userId) {
        this.logger.error(
          "[LoadMonitoring] Cannot save session: No user logged in",
        );
        return session;
      }

      // Prepare external load data for storage
      const externalLoadData = external
        ? {
            totalDistance: external.totalDistance,
            sprintDistance: external.sprintDistance,
            playerLoad: external.playerLoad,
            accelerations: external.accelerations,
            decelerations: external.decelerations,
            maxSpeed: external.maxSpeed,
            highIntensityDistance: external.highSpeedRunning,
          }
        : null;

      // Prepare wellness snapshot for storage
      const wellnessSnapshot = wellness
        ? {
            sleepQuality: wellness.sleepQuality,
            sleepDuration: wellness.sleepDuration,
            muscleSoreness: wellness.muscleSoreness,
            stressLevel: wellness.stressLevel,
            energyLevel: wellness.energyLevel,
            mood: wellness.mood,
          }
        : null;

      // Calculate wellness adjustment factor
      const wellnessAdjustmentFactor = wellness
        ? this.calculateWellnessFactor(wellness)
        : null;

      const { data, error } = await this.supabaseService.client
        .from("workout_logs")
        .insert({
          player_id: playerId,
          session_id: null, // Can be linked to training_sessions if available
          completed_at: session.date.toISOString(),
          rpe: internal.sessionRPE,
          duration_minutes: internal.duration,
          notes: notes || null,
          // New fields for complete load tracking
          load_au: metrics.calculatedLoad,
          session_type: sessionType,
          external_load_data: externalLoadData,
          wellness_snapshot: wellnessSnapshot,
          wellness_adjustment_factor: wellnessAdjustmentFactor,
          avg_heart_rate: internal.avgHeartRate || null,
          max_heart_rate: internal.maxHeartRate || null,
        })
        .select()
        .single();

      if (error) {
        this.logger.error("[LoadMonitoring] Error saving workout log:", error);
        throw error;
      }

      this.logger.success(
        "[LoadMonitoring] Workout log saved with load:",
        data.id,
        metrics.calculatedLoad,
      );

      // Note: Database trigger will automatically calculate ACWR in load_monitoring table

      return {
        ...session,
        id: data.id,
      };
    } catch (error) {
      this.logger.error("[LoadMonitoring] Failed to save session:", error);
      return session;
    }
  }

  /**
   * Quick session creation using sRPE only and save to database
   * Ideal for coaches who want simple input
   *
   * @param playerId - Player ID
   * @param sessionType - Training type
   * @param rpe - Rating 1-10
   * @param duration - Minutes
   * @returns Training session with database ID
   *
   * @example
   * // Player did 100-minute technical session, rated 7/10
   * await createQuickSession('player123', 'technical', 7, 100)
   * // Result: Load = 700 AU, saved to database
   */
  public async createQuickSession(
    playerId: string,
    sessionType: SessionType,
    rpe: number,
    duration: number,
    notes?: string,
  ): Promise<TrainingSession> {
    const internal = this.calculateInternalLoad(rpe, duration);
    return await this.createSession(
      playerId,
      sessionType,
      internal,
      undefined,
      undefined,
      notes,
    );
  }

  /**
   * Aggregate multiple sessions for daily total
   * Players often have multiple sessions per day:
   * - Morning: Gym (strength)
   * - Afternoon: Field work (technical + conditioning)
   * - Evening: Recovery
   *
   * @param sessions - Array of sessions from same day
   * @returns Aggregated metrics
   */
  public aggregateDailySessions(sessions: TrainingSession[]): {
    totalLoad: number;
    totalDuration: number;
    sessionTypes: SessionType[];
    breakdown: Map<SessionType, number>;
  } {
    const breakdown = new Map<SessionType, number>();
    let totalLoad = 0;
    let totalDuration = 0;
    const sessionTypes: SessionType[] = [];

    sessions.forEach((session) => {
      totalLoad += session.load;
      totalDuration += session.metrics.internal.duration;
      sessionTypes.push(session.sessionType);

      const current = breakdown.get(session.sessionType) || 0;
      breakdown.set(session.sessionType, current + session.load);
    });

    return {
      totalLoad,
      totalDuration,
      sessionTypes: [...new Set(sessionTypes)],
      breakdown,
    };
  }

  /**
   * Estimate load from planned session
   * Used for training plan preview
   *
   * @param sessionType - Type of session
   * @param plannedIntensity - 1-10 scale
   * @param duration - Minutes
   * @returns Estimated load
   */
  public estimatePlannedLoad(
    sessionType: SessionType,
    plannedIntensity: number,
    duration: number,
  ): number {
    // Base estimation: intensity × duration
    let baseLoad = plannedIntensity * duration;

    // Adjust based on session type
    const typeMultipliers: Record<SessionType, number> = {
      game: 1.2, // Games are typically more intense
      sprint: 1.15, // High-intensity work
      technical: 1.0, // Normal
      conditioning: 1.05, // Slightly elevated
      strength: 0.95, // Controlled intensity
      recovery: 0.7, // Lower intensity
    };

    baseLoad *= typeMultipliers[sessionType];

    return Math.round(baseLoad);
  }

  /**
   * Convert device player load to internal load equivalent
   * Useful for teams with GPS/wearable data
   *
   * @param playerLoad - Device metric (0-1000)
   * @param duration - Session duration
   * @returns Equivalent RPE and workload
   */
  public convertPlayerLoadToRPE(
    playerLoad: number,
    duration: number,
  ): {
    estimatedRPE: number;
    workload: number;
  } {
    // Normalize player load to RPE scale (0-1000 → 1-10)
    // 0-100: Light (1-3)
    // 100-300: Moderate (4-6)
    // 300-600: Hard (7-8)
    // 600+: Very Hard (9-10)

    let estimatedRPE: number;

    if (playerLoad < 100) estimatedRPE = 2;
    else if (playerLoad < 200) estimatedRPE = 4;
    else if (playerLoad < 300) estimatedRPE = 5;
    else if (playerLoad < 400) estimatedRPE = 6;
    else if (playerLoad < 500) estimatedRPE = 7;
    else if (playerLoad < 650) estimatedRPE = 8;
    else if (playerLoad < 800) estimatedRPE = 9;
    else estimatedRPE = 10;

    const workload = estimatedRPE * duration;

    return { estimatedRPE, workload };
  }

  /**
   * Get load recommendations based on player history
   *
   * @param recentSessions - Last 7 days of sessions
   * @param targetACWR - Target ACWR ratio (default: 1.0)
   * @returns Recommended load for next session
   */
  public getLoadRecommendation(
    recentSessions: TrainingSession[],
    targetACWR = 1.0,
  ): {
    recommendedLoad: number;
    recommendedRPE: number;
    recommendedDuration: number;
    reasoning: string;
  } {
    if (recentSessions.length === 0) {
      return {
        recommendedLoad: 400,
        recommendedRPE: 5,
        recommendedDuration: 80,
        reasoning: "No history available. Starting with moderate load.",
      };
    }

    // Calculate average recent load
    const totalLoad = recentSessions.reduce((sum, s) => sum + s.load, 0);
    const avgLoad = totalLoad / recentSessions.length;

    // Adjust based on target ACWR
    const recommendedLoad = Math.round(avgLoad * targetACWR);

    // Estimate RPE and duration (assume 90-minute session)
    const recommendedDuration = 90;
    const recommendedRPE = Math.min(
      10,
      Math.round(recommendedLoad / recommendedDuration),
    );

    let reasoning: string;
    if (targetACWR < 0.9) {
      reasoning = "Reducing load to allow recovery and avoid under-training.";
    } else if (targetACWR > 1.2) {
      reasoning = "Increasing load cautiously to build fitness.";
    } else {
      reasoning = "Maintaining optimal load for injury prevention.";
    }

    return {
      recommendedLoad,
      recommendedRPE,
      recommendedDuration,
      reasoning,
    };
  }

  /**
   * Validate session data before submission
   */
  public validateSession(session: Partial<TrainingSession>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!session.playerId) errors.push("Player ID is required");
    if (!session.sessionType) errors.push("Session type is required");
    if (!session.metrics?.internal)
      errors.push("Internal load metrics required");

    if (session.metrics?.internal) {
      const rpe = session.metrics.internal.sessionRPE;
      if (rpe < 1 || rpe > 10) {
        errors.push("Session RPE must be between 1 and 10");
      }

      if (session.metrics.internal.duration <= 0) {
        errors.push("Duration must be positive");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Set load calculation preferences
   */
  public setCalculationOptions(options: Partial<LoadCalculationOptions>): void {
    this.calculationOptions.update((current) => ({
      ...current,
      ...options,
    }));
  }

  /**
   * Get current calculation options
   */
  public getCalculationOptions(): LoadCalculationOptions {
    return this.calculationOptions();
  }

  /**
   * Calculate readiness score from wellness metrics
   * Returns 0-100 score indicating player readiness, or null if required data is missing
   *
   * IMPORTANT: Do NOT use default values. Returns null if required data is missing.
   * Required: sleepQuality AND energyLevel (minimum for valid calculation)
   *
   * Evidence-based weights (team-sport optimized):
   * - Sleep Quality: 30% (strong evidence - Halson 2014, Fullagar et al. 2015)
   * - Energy Level: 25% (correlates with perceived performance)
   * - Stress Level: 25% (inverted - lower stress = better readiness)
   * - Muscle Soreness: 20% (inverted - lower soreness = better readiness)
   */
  public calculateReadinessScore(wellness: WellnessMetrics): number | null {
    // CRITICAL: Require at least sleep quality AND energy level
    // DO NOT use defaults - user must provide real data
    if (
      wellness.sleepQuality === undefined ||
      wellness.sleepQuality === null ||
      wellness.energyLevel === undefined ||
      wellness.energyLevel === null
    ) {
      return null;
    }

    // All values on 0-10 scale, convert to 0-100
    const sleepScore = (wellness.sleepQuality / 10) * 100;
    const energyScore = (wellness.energyLevel / 10) * 100;

    // Check which optional metrics are available
    const hasStress =
      wellness.stressLevel !== undefined && wellness.stressLevel !== null;
    const hasSoreness =
      wellness.muscleSoreness !== undefined && wellness.muscleSoreness !== null;

    let score: number;

    if (hasStress && hasSoreness) {
      // Full calculation
      const stressScore = ((10 - wellness.stressLevel) / 10) * 100; // Invert
      const sorenessScore = ((10 - wellness.muscleSoreness) / 10) * 100; // Invert
      score =
        sleepScore * 0.3 +
        energyScore * 0.25 +
        stressScore * 0.25 +
        sorenessScore * 0.2;
    } else if (hasStress) {
      // Sleep, energy, stress only
      const stressScore = ((10 - wellness.stressLevel) / 10) * 100;
      score = sleepScore * 0.375 + energyScore * 0.3125 + stressScore * 0.3125;
    } else if (hasSoreness) {
      // Sleep, energy, soreness only
      const sorenessScore = ((10 - wellness.muscleSoreness) / 10) * 100;
      score = sleepScore * 0.4 + energyScore * 0.333 + sorenessScore * 0.267;
    } else {
      // Minimal: sleep and energy only
      score = sleepScore * 0.55 + energyScore * 0.45;
    }

    return Math.round(Math.min(100, Math.max(0, score)));
  }
}
