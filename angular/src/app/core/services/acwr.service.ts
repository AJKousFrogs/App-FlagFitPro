/**
 * ACWR (Acute:Chronic Workload Ratio) Service
 *
 * Implements EWMA (Exponentially Weighted Moving Average) model for injury prevention
 * Based on sports science research showing optimal training load ratios reduce injury risk
 *
 * Key Concepts:
 * - Acute Load (7 days): Represents fatigue/current load
 * - Chronic Load (28 days): Represents fitness/training adaptation
 * - ACWR Ratio: Acute ÷ Chronic (optimal: 0.80-1.30)
 *
 * Risk Zones (Gabbett 2016, multiple systematic reviews):
 * - < 0.80: Under-training (orange) - insufficient conditioning
 * - 0.80-1.30: Sweet spot (green) - optimal, lowest injury risk
 * - > 1.30: Elevated risk (yellow) - caution needed
 * - > 1.50: Danger zone (red) - highest injury risk, reduce load
 *
 * Evidence-Based Safeguards:
 * - Minimum chronic load floor to prevent inflated ratios during returns from injury/time off
 * - Minimum days (3-4 weeks) required before computing meaningful ACWR
 * - Data quality flags for sparse data scenarios
 * - Weekly load change caps (10-20% increase limits)
 * - Tolerance detection for athletes repeatedly training above thresholds without issues
 *
 * References:
 * - Gabbett, T. J. (2016). The training—injury prevention paradox: should athletes be training smarter and harder?
 * - Multiple systematic reviews and practitioner guidelines
 *
 * @author FlagFit Pro Team
 * @version 2.0.0 - Enhanced with evidence-based safeguards
 */

import {
  Injectable,
  Signal,
  computed,
  signal,
  inject,
  effect,
} from "@angular/core";
import {
  TrainingSession,
  ACWRData,
  RiskZone,
  ACWRConfig,
  ACWRDataQuality,
  DataQualityLevel,
  ToleranceDetection,
} from "../models/acwr.models";
import { EvidenceConfigService } from "./evidence-config.service";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";
import { toLogContext } from "./logger.service";
import { AcwrSpikeDetectionService } from "./acwr-spike-detection.service";
import {
  RealtimeChannel,
  REALTIME_LISTEN_TYPES,
  REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
} from "@supabase/supabase-js";
import {
  mapEvidenceCitations,
  getPresetDisplay,
} from "../../shared/utils/evidence-info.utils";
import {
  roundToPrecision,
  safeDivide,
  ACWR_PRECISION,
  percentageChange,
  clamp,
} from "../../shared/utils/precision.utils";
import { getDateKey } from "../../shared/utils/date.utils";

interface LoadMonitoringRecord {
  daily_load?: number;
  acute_load?: number;
  chronic_load?: number;
  acwr?: number;
  injury_risk_level?: string;
}

interface WorkoutLog {
  id?: string;
  player_id: string;
  session_id?: string;
  completed_at: string;
  rpe?: number;
  duration_minutes?: number;
  notes?: string;
  load_monitoring?: LoadMonitoringRecord[];
}

/**
 * Memory management constants for ACWR service
 * Prevents unbounded memory growth from historical data
 */
const ACWR_MEMORY_LIMITS = {
  /** Maximum days of training sessions to retain in memory */
  MAX_SESSION_DAYS: 35,
  /** Maximum days of historical ACWR data for tolerance detection */
  MAX_HISTORICAL_ACWR_DAYS: 90,
  /** Maximum entries in historical ACWR array */
  MAX_HISTORICAL_ACWR_ENTRIES: 90,
} as const;

@Injectable({
  providedIn: "root",
})
export class AcwrService {
  private evidenceConfigService = inject(EvidenceConfigService);
  private supabaseService = inject(SupabaseService);
  private logger = inject(LoggerService);
  private acwrSpikeDetection = inject(AcwrSpikeDetectionService);

  // Realtime subscription channel
  private realtimeChannel: RealtimeChannel | null = null;

  /**
   * Convert evidence config to ACWRConfig format
   * Uses active preset from EvidenceConfigService
   */
  private getDefaultConfigFromPreset(): ACWRConfig {
    const evidenceConfig = this.evidenceConfigService.getACWRConfig();

    return {
      acuteWindowDays: evidenceConfig.acuteWindowDays,
      chronicWindowDays: evidenceConfig.chronicWindowDays,
      acuteLambda: evidenceConfig.acuteLambda,
      chronicLambda: evidenceConfig.chronicLambda,
      thresholds: {
        sweetSpotLow: evidenceConfig.thresholds.sweetSpotLow,
        sweetSpotHigh: evidenceConfig.thresholds.sweetSpotHigh,
        dangerHigh: evidenceConfig.thresholds.dangerHigh,
        maxWeeklyIncreasePercent:
          evidenceConfig.thresholds.maxWeeklyIncreasePercent,
        maxWeeklyIncreasePercentConservative:
          evidenceConfig.thresholds.maxWeeklyIncreasePercentConservative,
      },
      minChronicLoad: evidenceConfig.minChronicLoad,
      minDaysForChronic: evidenceConfig.minDaysForChronic,
      minSessionsForChronic: evidenceConfig.minSessionsForChronic,
      dataQuality: {
        lowConfidenceThreshold:
          evidenceConfig.dataQuality.lowConfidenceThreshold,
        enableQualityFlags: evidenceConfig.dataQuality.enableQualityFlags,
      },
      toleranceDetection: {
        enabled: true,
        consecutiveHighDays: 7,
        checkFrequency: "weekly",
      },
      personalization: {
        enabled: false,
        adjustThresholdsBasedOnHistory: false,
        trackInjuryCorrelation: true,
      },
      autoAdjust: true,
      alertsEnabled: true,
      enablePredictiveLoad: true,
    };
  }

  // Current configuration (initialized from evidence preset)
  private readonly config = signal<ACWRConfig>(
    this.getDefaultConfigFromPreset(),
  );

  // Training sessions history (stores last 28+ days)
  private readonly trainingSessions = signal<TrainingSession[]>([]);

  // Current player ID being tracked
  private readonly currentPlayerId = signal<string | null>(null);

  // Historical ACWR data for tolerance detection
  private readonly historicalACWR = signal<
    Array<{ date: Date; ratio: number; chronic: number }>
  >([]);

  // Track the last loaded user to prevent duplicate loads
  private lastLoadedUserId: string | null = null;

  constructor() {
    // Auto-load and subscribe to workout logs when user logs in
    effect(() => {
      const userId = this.supabaseService.userId();
      if (userId) {
        // Prevent duplicate loading for same user (memory optimization)
        if (this.lastLoadedUserId === userId) {
          this.logger.debug("[ACWR] User already loaded, skipping reload");
          return;
        }

        this.logger.info("[ACWR] User authenticated, loading training data...");
        this.lastLoadedUserId = userId;
        this.setPlayer(userId);
        this.loadPlayerSessions(userId);
        this.subscribeToWorkoutLogs(userId);
      } else {
        this.logger.debug("[ACWR] No user authenticated, cleaning up");
        this.lastLoadedUserId = null;
        this.unsubscribeFromWorkoutLogs();
        this.clearSessions();
      }
    });
  }

  /**
   * Calculate EWMA (Exponentially Weighted Moving Average)
   * Formula: EWMA_today = lambda × load_today + (1 - lambda) × EWMA_yesterday
   *
   * Uses precision utilities for consistent rounding.
   *
   * @param loads - Array of daily loads (most recent first)
   * @param lambda - Decay factor (0-1), higher = more weight to recent
   * @param days - Number of days to calculate over
   */
  private calculateEWMA(loads: number[], lambda: number, days: number): number {
    if (loads.length === 0) return 0;

    // Validate lambda is in valid range
    const validLambda = clamp(lambda, 0, 1);

    // Start with first value
    let ewma = loads[0] || 0;

    // Apply EWMA formula iteratively
    for (let i = 1; i < Math.min(loads.length, days); i++) {
      const load = loads[i] || 0;
      ewma = validLambda * load + (1 - validLambda) * ewma;
    }

    // Return with standard precision
    return roundToPrecision(ewma, ACWR_PRECISION);
  }

  /**
   * Aggregate daily loads from all session types
   * Combines: technical training + gym + conditioning + games
   */
  private aggregateDailyLoads(
    sessions: TrainingSession[],
  ): Map<string, number> {
    const dailyLoads = new Map<string, number>();

    sessions.forEach((session) => {
      const dateKey = this.getDateKeyLocal(session.date);
      const currentLoad = dailyLoads.get(dateKey) || 0;
      const sessionLoad =
        Number.isFinite(session.load) && session.load > 0
          ? session.load
          : (session.metrics?.calculatedLoad ??
            session.metrics?.internal?.workload ??
            0);
      dailyLoads.set(dateKey, currentLoad + sessionLoad);
    });

    return dailyLoads;
  }

  /**
   * Get loads for last N days
   */
  private getRecentLoads(
    dailyLoads: Map<string, number>,
    days: number,
  ): number[] {
    const loads: number[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = this.getDateKeyLocal(date);
      loads.push(dailyLoads.get(dateKey) || 0);
    }

    return loads;
  }

  /**
   * Convert date to string key (YYYY-MM-DD)
   * Uses centralized date utility for consistency.
   */
  private getDateKeyLocal(date: Date): string {
    return getDateKey(date);
  }

  /**
   * Reactive signal: Calculate acute load (fatigue)
   * Uses configurable window size and lambda from ACWRConfig
   */
  public acuteLoad: Signal<number> = computed(() => {
    const sessions = this.trainingSessions();
    const cfg = this.config();

    if (sessions.length === 0) return 0;

    const dailyLoads = this.aggregateDailyLoads(sessions);
    const loads = this.getRecentLoads(dailyLoads, cfg.acuteWindowDays);

    return this.calculateEWMA(loads, cfg.acuteLambda, cfg.acuteWindowDays);
  });

  /**
   * Reactive signal: Calculate chronic load with minimum floor safeguard
   * Implements minimum chronic load floor to prevent inflated ratios during returns from injury/time off
   */
  public chronicLoad: Signal<number> = computed(() => {
    const sessions = this.trainingSessions();
    const cfg = this.config();

    if (sessions.length === 0) return 0;

    const dailyLoads = this.aggregateDailyLoads(sessions);
    const loads = this.getRecentLoads(dailyLoads, cfg.chronicWindowDays);

    const calculatedChronic = this.calculateEWMA(
      loads,
      cfg.chronicLambda,
      cfg.chronicWindowDays,
    );

    // Apply minimum chronic load floor safeguard
    // Prevents inflated ACWR ratios when chronic load is artificially low
    // (e.g., during return from injury or extended time off)
    return Math.max(calculatedChronic, cfg.minChronicLoad);
  });

  /**
   * Check if sufficient data exists for reliable ACWR calculation
   * Requires minimum days and sessions as per evidence-based guidelines
   */
  private hasSufficientData(): {
    sufficient: boolean;
    daysWithData: number;
    sessionsCount: number;
  } {
    const sessions = this.trainingSessions();
    const cfg = this.config();

    if (sessions.length === 0) {
      return { sufficient: false, daysWithData: 0, sessionsCount: 0 };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - cfg.chronicWindowDays);

    const recentSessions = sessions.filter((s) => s.date >= cutoffDate);
    const uniqueDays = new Set(
      recentSessions.map((s) => this.getDateKeyLocal(s.date)),
    );

    const daysWithData = uniqueDays.size;
    const sessionsCount = recentSessions.length;

    const sufficient =
      daysWithData >= cfg.minDaysForChronic &&
      sessionsCount >= cfg.minSessionsForChronic;

    return { sufficient, daysWithData, sessionsCount };
  }

  /**
   * Assess data quality for ACWR calculation
   * Flags low confidence scenarios when data is sparse
   */
  private assessDataQuality(): ACWRDataQuality {
    const { sufficient, daysWithData, sessionsCount } =
      this.hasSufficientData();
    const cfg = this.config();

    const issues: string[] = [];
    const recommendations: string[] = [];

    let level: DataQualityLevel = "high";
    let confidence = 100;

    if (!sufficient) {
      if (daysWithData < cfg.minDaysForChronic) {
        issues.push(
          `Only ${daysWithData} days of data (minimum ${cfg.minDaysForChronic} days required)`,
        );
        recommendations.push(
          `Continue logging sessions for ${cfg.minDaysForChronic - daysWithData} more days`,
        );
        confidence -= 40;
      }

      if (sessionsCount < cfg.minSessionsForChronic) {
        issues.push(
          `Only ${sessionsCount} sessions in chronic window (minimum ${cfg.minSessionsForChronic} required)`,
        );
        recommendations.push(
          `Log more training sessions for reliable ACWR calculation`,
        );
        confidence -= 30;
      }

      if (sessionsCount < cfg.dataQuality.lowConfidenceThreshold) {
        issues.push(
          `Sparse data: ${sessionsCount} sessions in ${cfg.chronicWindowDays} days`,
        );
        recommendations.push(`ACWR may not be predictive with sparse data`);
        confidence -= 20;
      }
    }

    // Determine quality level
    if (confidence >= 80) {
      level = "high";
    } else if (confidence >= 60) {
      level = "medium";
    } else if (confidence >= 40) {
      level = "low";
    } else {
      level = "insufficient";
    }

    return {
      level,
      confidence: Math.max(0, confidence),
      sessionsInChronicWindow: sessionsCount,
      daysWithData,
      issues,
      recommendations,
    };
  }

  /**
   * Reactive signal: Calculate ACWR ratio with data quality checks
   * Returns 0 if insufficient data for reliable calculation.
   * Uses safeDivide for precision and division-by-zero safety.
   */
  public acwrRatio: Signal<number> = computed(() => {
    const acute = this.acuteLoad();
    const chronic = this.chronicLoad();
    const { sufficient } = this.hasSufficientData();

    // Return 0 if insufficient data (prevents misleading ratios)
    if (!sufficient) return 0;

    // Use safeDivide for precision handling and division-by-zero safety
    return safeDivide(acute, chronic, ACWR_PRECISION);
  });

  /**
   * Reactive signal: Determine risk zone based on ACWR
   * Uses evidence-based thresholds from Gabbett (2016) and later syntheses
   */
  public riskZone: Signal<RiskZone> = computed(() => {
    const ratio = this.acwrRatio();
    const cfg = this.config();
    const { sufficient } = this.hasSufficientData();

    // Check data sufficiency first
    if (!sufficient || ratio === 0) {
      return {
        level: "no-data",
        color: "gray",
        label: "Insufficient Data",
        description: `Need ${cfg.minDaysForChronic} days and ${cfg.minSessionsForChronic} sessions for reliable ACWR`,
        recommendation:
          "Continue logging sessions - ACWR will be calculated once sufficient data is available",
      };
    }

    // Evidence-based thresholds (Gabbett 2016)
    if (ratio < cfg.thresholds.sweetSpotLow) {
      return {
        level: "under-training",
        color: "orange",
        label: "Under-Training",
        description:
          "Player lacks conditioning - chronic load may be insufficient",
        recommendation: "Gradually increase training volume by 5-10% per week",
      };
    }

    if (ratio <= cfg.thresholds.sweetSpotHigh) {
      return {
        level: "sweet-spot",
        color: "green",
        label: "Sweet Spot",
        description: "Optimal workload - lowest injury risk (Gabbett 2016)",
        recommendation: "Maintain current training load",
      };
    }

    if (ratio <= cfg.thresholds.dangerHigh) {
      return {
        level: "elevated-risk",
        color: "yellow",
        label: "Elevated Risk",
        description: "Approaching danger zone - increased injury risk",
        recommendation:
          "Reduce high-intensity sessions by 15-20%, monitor closely",
      };
    }

    return {
      level: "danger-zone",
      color: "red",
      label: "Danger Zone",
      description:
        "Highest injury risk - immediate action needed (Gabbett 2016)",
      recommendation: "Reduce load by 20-30%, skip sprints, focus on recovery",
    };
  });

  /**
   * Reactive signal: Weekly load progression check with evidence-based caps
   * Implements 10% weekly increase cap (Gabbett 2016)
   * Can use conservative 7% cap for higher-risk athletes
   */
  public weeklyProgression: Signal<{
    currentWeek: number;
    previousWeek: number;
    changePercent: number;
    isSafe: boolean;
    cappedAtMax: boolean;
    warning?: string;
  }> = computed(() => {
    const sessions = this.trainingSessions();
    const cfg = this.config();

    if (sessions.length === 0) {
      return {
        currentWeek: 0,
        previousWeek: 0,
        changePercent: 0,
        isSafe: true,
        cappedAtMax: false,
      };
    }

    const dailyLoads = this.aggregateDailyLoads(sessions);
    const currentWeekLoads = this.getRecentLoads(dailyLoads, 7);
    const previousWeekLoads = this.getRecentLoads(dailyLoads, 14).slice(7);

    const currentWeek = roundToPrecision(
      currentWeekLoads.reduce((sum, load) => sum + load, 0),
      ACWR_PRECISION,
    );
    const previousWeek = roundToPrecision(
      previousWeekLoads.reduce((sum, load) => sum + load, 0),
      ACWR_PRECISION,
    );

    // Use percentageChange utility for consistent precision
    const changePercent = percentageChange(previousWeek, currentWeek, 1);

    // Use conservative cap if configured, otherwise use standard cap
    const maxIncrease =
      cfg.thresholds.maxWeeklyIncreasePercentConservative ??
      cfg.thresholds.maxWeeklyIncreasePercent;

    const isSafe = changePercent <= maxIncrease;
    const cappedAtMax = changePercent > maxIncrease;

    return {
      currentWeek,
      previousWeek,
      changePercent: cappedAtMax
        ? maxIncrease
        : roundToPrecision(changePercent, 1),
      isSafe,
      cappedAtMax,
      warning: !isSafe
        ? `Weekly load increased by ${roundToPrecision(changePercent, 1)}% (max recommended: ${maxIncrease}% per Gabbett 2016)`
        : undefined,
    };
  });

  /**
   * Detect tolerance for athletes repeatedly training above thresholds without issues
   * Suggests either higher tolerance or underestimation of chronic load
   * Note: Injury checking is done asynchronously via checkToleranceWithInjuryData()
   */
  private detectTolerance(): ToleranceDetection | undefined {
    const cfg = this.config();
    if (!cfg.toleranceDetection.enabled) return undefined;

    const history = this.historicalACWR();
    if (history.length < cfg.toleranceDetection.consecutiveHighDays) {
      return undefined;
    }

    // Check recent history for consecutive days above danger threshold
    const recentHistory = history.slice(
      0,
      cfg.toleranceDetection.consecutiveHighDays,
    );
    const daysAboveThreshold = recentHistory.filter(
      (h) => h.ratio > cfg.thresholds.dangerHigh,
    ).length;

    if (daysAboveThreshold >= cfg.toleranceDetection.consecutiveHighDays) {
      const averageACWR =
        recentHistory
          .filter((h) => h.ratio > cfg.thresholds.dangerHigh)
          .reduce((sum, h) => sum + h.ratio, 0) / daysAboveThreshold;

      // Default to investigate - injury check can be done separately via checkToleranceWithInjuryData()
      const recommendation: "maintain" | "adjust" | "investigate" =
        "investigate";
      const message =
        `Athlete has trained above ${cfg.thresholds.dangerHigh} ACWR for ${daysAboveThreshold} consecutive days. ` +
        `This may indicate: (1) Higher individual tolerance, (2) Underestimated chronic load, or (3) Need for personalized thresholds. ` +
        `Monitor closely and consider adjusting thresholds if pattern continues.`;

      return {
        detected: true,
        daysAboveThreshold,
        averageACWRAboveThreshold: averageACWR,
        injuryOccurred: false, // Will be updated async if needed
        recommendation,
        message,
      };
    }

    return undefined;
  }

  /**
   * Async method to check tolerance with injury data
   * Call this separately when you need injury-aware tolerance detection
   */
  public async checkToleranceWithInjuryData(): Promise<
    ToleranceDetection | undefined
  > {
    const cfg = this.config();
    if (!cfg.toleranceDetection.enabled) return undefined;

    const history = this.historicalACWR();
    if (history.length < cfg.toleranceDetection.consecutiveHighDays) {
      return undefined;
    }

    const recentHistory = history.slice(
      0,
      cfg.toleranceDetection.consecutiveHighDays,
    );
    const daysAboveThreshold = recentHistory.filter(
      (h) => h.ratio > cfg.thresholds.dangerHigh,
    ).length;

    if (daysAboveThreshold >= cfg.toleranceDetection.consecutiveHighDays) {
      const averageACWR =
        recentHistory
          .filter((h) => h.ratio > cfg.thresholds.dangerHigh)
          .reduce((sum, h) => sum + h.ratio, 0) / daysAboveThreshold;

      const playerId = this.currentPlayerId();
      const startDate = recentHistory[recentHistory.length - 1]?.date;
      const endDate = recentHistory[0]?.date;

      // Check if injury occurred during this high-load period
      const injuryOccurred = playerId
        ? await this.checkForRecentInjury(
            playerId,
            startDate?.toISOString(),
            endDate?.toISOString(),
          )
        : false;

      let recommendation: "maintain" | "adjust" | "investigate" = "investigate";
      let message = "";

      if (injuryOccurred) {
        recommendation = "adjust";
        message = `Training above ${cfg.thresholds.dangerHigh} ACWR for ${daysAboveThreshold} days preceded injury. Reduce load immediately.`;
      } else {
        recommendation = "investigate";
        message =
          `Athlete has trained above ${cfg.thresholds.dangerHigh} ACWR for ${daysAboveThreshold} consecutive days without apparent issues. ` +
          `This may indicate: (1) Higher individual tolerance, (2) Underestimated chronic load, or (3) Need for personalized thresholds. ` +
          `Monitor closely and consider adjusting thresholds if pattern continues.`;
      }

      return {
        detected: true,
        daysAboveThreshold,
        averageACWRAboveThreshold: averageACWR,
        injuryOccurred,
        recommendation,
        message,
      };
    }

    return undefined;
  }

  /**
   * Reactive signal: Complete ACWR data for dashboard with quality assessment
   */
  public acwrData: Signal<ACWRData> = computed(() => {
    const dataQuality = this.assessDataQuality();
    const toleranceDetection = this.detectTolerance();

    return {
      acute: this.acuteLoad(),
      chronic: this.chronicLoad(),
      ratio: this.acwrRatio(),
      riskZone: this.riskZone(),
      weeklyProgression: this.weeklyProgression(),
      dataQuality,
      toleranceDetection,
      lastUpdated: new Date(),
    };
  });

  /**
   * Add a training session and update historical ACWR
   * @param session - Training session data
   *
   * MEMORY SAFETY: Limits session and history retention to prevent unbounded growth
   */
  public addSession(session: TrainingSession): void {
    const sessions = [...this.trainingSessions(), session];
    const cfg = this.config();

    // MEMORY SAFETY: Keep sessions for chronic window + buffer, but cap at MAX_SESSION_DAYS
    const maxDays = Math.min(
      cfg.chronicWindowDays + 7,
      ACWR_MEMORY_LIMITS.MAX_SESSION_DAYS,
    );
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxDays);

    const filtered = sessions.filter((s) => s.date >= cutoffDate);

    // Sort by date (most recent first)
    filtered.sort((a, b) => b.date.getTime() - a.date.getTime());

    this.trainingSessions.set(filtered);

    // Update historical ACWR for tolerance detection
    const currentData = this.acwrData();
    if (currentData.ratio > 0) {
      const history = [...this.historicalACWR()];
      history.unshift({
        date: new Date(),
        ratio: currentData.ratio,
        chronic: currentData.chronic,
      });

      // MEMORY SAFETY: Keep history limited by both date and count
      const historyCutoff = new Date();
      historyCutoff.setDate(
        historyCutoff.getDate() - ACWR_MEMORY_LIMITS.MAX_HISTORICAL_ACWR_DAYS,
      );

      // Check for ACWR spike and create load cap if needed
      if (currentData.ratio > 1.5 && session.playerId) {
        this.acwrSpikeDetection
          .checkAndCapLoad(session.playerId, currentData.ratio)
          .catch((error) => {
            this.logger.error("[ACWR] Error checking spike:", error);
          });
      }

      // Decrement load cap if session was logged
      if (session.playerId && session.completed) {
        this.acwrSpikeDetection
          .decrementLoadCap(session.playerId)
          .catch((error) => {
            this.logger.error("[ACWR] Error decrementing load cap:", error);
          });
      }

      // Filter by date and then cap by count for memory safety
      const filteredHistory = history
        .filter((h) => h.date >= historyCutoff)
        .slice(0, ACWR_MEMORY_LIMITS.MAX_HISTORICAL_ACWR_ENTRIES);

      this.historicalACWR.set(filteredHistory);
    }
  }

  /**
   * Add multiple sessions at once
   */
  public addSessions(sessions: TrainingSession[]): void {
    sessions.forEach((session) => this.addSession(session));
  }

  /**
   * Set current player being tracked
   */
  public setPlayer(playerId: string): void {
    this.currentPlayerId.set(playerId);
  }

  /**
   * Clear all sessions (useful for switching players or logout)
   * MEMORY SAFETY: Ensures all cached data is released
   */
  public clearSessions(): void {
    this.trainingSessions.set([]);
    this.historicalACWR.set([]);
    this.currentPlayerId.set(null);
    this.lastLoadedUserId = null;
    this.logger.debug("[ACWR] Sessions and history cleared");
  }

  /**
   * Get sessions for date range
   */
  public getSessionsInRange(startDate: Date, endDate: Date): TrainingSession[] {
    return this.trainingSessions().filter(
      (session) => session.date >= startDate && session.date <= endDate,
    );
  }

  /**
   * Calculate predicted load for next session with weekly change cap enforcement
   * Enhanced predictive load management with evidence-based safeguards
   */
  public predictNextSessionLoad(
    plannedIntensity: number,
    plannedDuration: number = 90,
  ): {
    projected: number;
    projectedACWR: number;
    weeklyChangePercent: number;
    recommendation: string;
    adjustments?: {
      suggestedIntensity: number;
      suggestedDuration: number;
      reason: string;
    };
  } {
    const current = this.acwrData();
    const cfg = this.config();
    const chronic = current.chronic;
    const weeklyProg = current.weeklyProgression;

    // Estimate load based on intensity (1-10 scale) × duration
    const estimatedLoad = plannedIntensity * plannedDuration;

    // Project what ACWR would be after adding this session
    const dailyLoads = this.aggregateDailyLoads(this.trainingSessions());
    const recentLoads = this.getRecentLoads(dailyLoads, cfg.acuteWindowDays);
    const projectedLoads = [
      estimatedLoad,
      ...recentLoads.slice(0, cfg.acuteWindowDays - 1),
    ];
    const projectedAcute = this.calculateEWMA(
      projectedLoads,
      cfg.acuteLambda,
      cfg.acuteWindowDays,
    );

    // Use chronic load with floor safeguard
    const projectedChronic = Math.max(chronic, cfg.minChronicLoad);
    const projectedACWR =
      projectedChronic === 0 ? 0 : projectedAcute / projectedChronic;

    // Calculate weekly change if this session is added
    const projectedWeeklyLoad = weeklyProg.currentWeek + estimatedLoad;
    const weeklyChangePercent =
      weeklyProg.previousWeek === 0
        ? 0
        : ((projectedWeeklyLoad - weeklyProg.previousWeek) /
            weeklyProg.previousWeek) *
          100;

    // Check weekly change cap
    const maxIncrease =
      cfg.thresholds.maxWeeklyIncreasePercentConservative ??
      cfg.thresholds.maxWeeklyIncreasePercent;
    const exceedsWeeklyCap = weeklyChangePercent > maxIncrease;

    let recommendation = "";
    let adjustments:
      | {
          suggestedIntensity: number;
          suggestedDuration: number;
          reason: string;
        }
      | undefined;

    // First check weekly change cap (takes precedence)
    if (exceedsWeeklyCap) {
      const reductionFactor = maxIncrease / weeklyChangePercent;
      const suggestedIntensity = Math.max(
        3,
        Math.round(plannedIntensity * reductionFactor * 0.9),
      );
      const suggestedDuration = Math.round(
        plannedDuration * reductionFactor * 0.9,
      );

      recommendation =
        `WEEKLY CAP EXCEEDED: Projected ${weeklyChangePercent.toFixed(1)}% increase exceeds ${maxIncrease}% cap (Gabbett 2016). ` +
        `Reduce intensity to ${suggestedIntensity}/10 and duration to ${suggestedDuration} min.`;

      adjustments = {
        suggestedIntensity,
        suggestedDuration,
        reason: `Weekly load increase cap (${maxIncrease}%) would be exceeded`,
      };
    }
    // Then check ACWR thresholds
    else if (projectedACWR > cfg.thresholds.dangerHigh) {
      const reductionFactor = cfg.thresholds.dangerHigh / projectedACWR;
      const suggestedIntensity = Math.max(
        3,
        Math.round(plannedIntensity * reductionFactor * 0.8),
      );
      const suggestedDuration = Math.round(
        plannedDuration * reductionFactor * 0.8,
      );

      recommendation =
        `DANGER: Projected ACWR ${projectedACWR.toFixed(2)} exceeds ${cfg.thresholds.dangerHigh} threshold. ` +
        `Reduce intensity to ${suggestedIntensity}/10 and duration to ${suggestedDuration} min.`;

      adjustments = {
        suggestedIntensity,
        suggestedDuration,
        reason: `Projected ACWR (${projectedACWR.toFixed(2)}) exceeds danger threshold (${cfg.thresholds.dangerHigh})`,
      };
    } else if (projectedACWR > cfg.thresholds.sweetSpotHigh) {
      const reductionFactor = cfg.thresholds.sweetSpotHigh / projectedACWR;
      const suggestedIntensity = Math.max(
        4,
        Math.round(plannedIntensity * reductionFactor * 0.9),
      );
      const suggestedDuration = Math.round(
        plannedDuration * reductionFactor * 0.9,
      );

      recommendation =
        `CAUTION: Projected ACWR ${projectedACWR.toFixed(2)} exceeds sweet spot (${cfg.thresholds.sweetSpotHigh}). ` +
        `Consider reducing intensity to ${suggestedIntensity}/10 and duration to ${suggestedDuration} min.`;

      adjustments = {
        suggestedIntensity,
        suggestedDuration,
        reason: `Projected ACWR (${projectedACWR.toFixed(2)}) exceeds sweet spot upper bound`,
      };
    } else if (projectedACWR < cfg.thresholds.sweetSpotLow) {
      recommendation =
        "SAFE: Projected ACWR is below sweet spot. Can increase intensity if player feels good.";
    } else {
      recommendation =
        "OPTIMAL: Projected ACWR is within sweet spot (0.8-1.3). Proceed as planned.";
    }

    return {
      projected: estimatedLoad,
      projectedACWR,
      weeklyChangePercent,
      recommendation,
      adjustments,
    };
  }

  /**
   * Update configuration (for personalization)
   */
  public updateConfig(config: Partial<ACWRConfig>): void {
    this.config.set({ ...this.config(), ...config });
  }

  /**
   * Get current configuration
   */
  public getConfig(): ACWRConfig {
    return this.config();
  }

  /**
   * Reset to default configuration (from active evidence preset)
   */
  public resetConfig(): void {
    this.config.set(this.getDefaultConfigFromPreset());
  }

  /**
   * Get evidence citation information for current thresholds
   */
  public getEvidenceInfo(): {
    preset: string;
    citations: Array<{
      authors: string;
      year: number;
      title: string;
      doi?: string;
    }>;
    scienceNotes: string;
    coachOverride: string;
  } {
    const preset = this.evidenceConfigService.getActivePreset();
    const acwrConfig = preset.acwr;

    return {
      preset: getPresetDisplay(preset),
      citations: mapEvidenceCitations(acwrConfig.citations),
      scienceNotes: acwrConfig.scienceNotes.thresholds,
      coachOverride: acwrConfig.scienceNotes.coachOverride,
    };
  }

  /**
   * Should player skip sprints today?
   * Based on ACWR and day of week using evidence-based thresholds
   */
  public shouldSkipSprints(dayOfWeek: number, gameDay: number = 6): boolean {
    const risk = this.riskZone();
    const ratio = this.acwrRatio();
    const cfg = this.config();

    // Skip if in danger zone (ACWR > 1.5)
    if (risk.level === "danger-zone") return true;

    // Skip if elevated risk and within 2 days of game
    const daysUntilGame = (gameDay - dayOfWeek + 7) % 7;
    if (risk.level === "elevated-risk" && daysUntilGame <= 2) return true;

    // Skip if ACWR exceeds sweet spot upper bound and it's Friday (day before Saturday game)
    if (ratio > cfg.thresholds.sweetSpotHigh && dayOfWeek === 5) return true;

    return false;
  }

  /**
   * Get recommended training modification using evidence-based thresholds
   */
  public getTrainingModification(): {
    shouldModify: boolean;
    modifications: string[];
  } {
    const risk = this.riskZone();
    const progression = this.weeklyProgression();
    const cfg = this.config();
    const dataQuality = this.assessDataQuality();
    const modifications: string[] = [];

    // Add data quality warnings if applicable
    if (dataQuality.level === "low" || dataQuality.level === "insufficient") {
      modifications.push(
        `Low data quality: ${dataQuality.issues.join(", ")}`,
      );
      modifications.push(`Tip: ${dataQuality.recommendations[0]}`);
    }

    // Risk-based modifications
    if (risk.level === "danger-zone") {
      modifications.push("Reduce overall volume by 25-30%");
      modifications.push("Skip all sprint sessions");
      modifications.push("Focus on technique and recovery");
      modifications.push("Monitor wellness scores daily");
    } else if (risk.level === "elevated-risk") {
      modifications.push("Reduce high-intensity work by 15-20%");
      modifications.push("Limit sprint volume to 50%");
      modifications.push("Add extra recovery day");
    }

    // Weekly progression warnings
    if (!progression.isSafe) {
      const maxIncrease =
        cfg.thresholds.maxWeeklyIncreasePercentConservative ??
        cfg.thresholds.maxWeeklyIncreasePercent;
      modifications.push(
        `Weekly load spike: ${progression.changePercent.toFixed(1)}%`,
      );
      modifications.push("Maintain current load, don't increase");
      modifications.push(
        `Target: <${maxIncrease}% weekly increase (Gabbett 2016)`,
      );
    }

    // Tolerance detection warnings
    const tolerance = this.detectTolerance();
    if (tolerance?.detected && tolerance.recommendation === "investigate") {
      modifications.push(`Tolerance detected: ${tolerance.message}`);
    }

    return {
      shouldModify: modifications.length > 0,
      modifications,
    };
  }

  /**
   * Load player training sessions from database
   * Fetches workout logs for the last 35 days (chronic window + buffer)
   */
  private async loadPlayerSessions(userId: string): Promise<void> {
    try {
      const cfg = this.config();
      const daysToLoad = cfg.chronicWindowDays + 7; // Extra buffer
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToLoad);

      this.logger.debug(
        `[ACWR] Loading ${daysToLoad} days of training data...`,
      );

      const { data: workoutLogs, error } = await this.supabaseService.client
        .from("workout_logs")
        .select(
          `
          id,
          player_id,
          session_id,
          completed_at,
          rpe,
          duration_minutes,
          notes,
          load_monitoring (
            daily_load,
            acute_load,
            chronic_load,
            acwr,
            injury_risk_level
          )
        `,
        )
        .eq("player_id", userId)
        .gte("completed_at", cutoffDate.toISOString())
        .order("completed_at", { ascending: false });

      if (error) {
        this.logger.error("[ACWR] Error loading workout logs:", error);
        return;
      }

      if (!workoutLogs || workoutLogs.length === 0) {
        this.logger.info("[ACWR] No workout logs found for player");
        return;
      }

      // Convert workout logs to TrainingSession format
      const sessions: TrainingSession[] = workoutLogs.map(
        (log: WorkoutLog) => ({
          playerId: log.player_id,
          date: new Date(log.completed_at),
          sessionType: this.inferSessionType(log),
          metrics: {
            type: "internal",
            internal: {
              sessionRPE: log.rpe || 5,
              duration: log.duration_minutes || 60,
              workload: (log.rpe || 5) * (log.duration_minutes || 60),
            },
            calculatedLoad: (log.rpe || 5) * (log.duration_minutes || 60),
          },
          load: (log.rpe || 5) * (log.duration_minutes || 60),
          notes: log.notes,
          completed: true,
          modifiedFromPlan: false,
        }),
      );

      this.addSessions(sessions);
      this.logger.success(`[ACWR] Loaded ${sessions.length} training sessions`);

      // Load historical ACWR for tolerance detection
      if (workoutLogs[0]?.load_monitoring?.length) {
        const history = workoutLogs
          .filter((log: WorkoutLog) => log.load_monitoring?.[0]?.acwr)
          .map((log: WorkoutLog) => {
            const monitoring = log.load_monitoring?.[0];
            return {
              date: new Date(log.completed_at),
              ratio: monitoring?.acwr ?? 0,
              chronic: monitoring?.chronic_load ?? 0,
            };
          });
        this.historicalACWR.set(history);
      }
    } catch (error) {
      this.logger.error("[ACWR] Failed to load player sessions:", error);
    }
  }

  /**
   * Subscribe to realtime workout log updates
   */
  private subscribeToWorkoutLogs(userId: string): void {
    if (this.realtimeChannel) {
      this.logger.debug("[ACWR] Unsubscribing from previous channel");
      this.unsubscribeFromWorkoutLogs();
    }

    this.logger.info(
      `[ACWR] Subscribing to realtime updates for player ${userId}`,
    );

    this.realtimeChannel = this.supabaseService.client
      .channel(`workout_logs:${userId}`)
      .on<WorkoutLog>(
        REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
        {
          event: REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.INSERT,
          schema: "public",
          table: "workout_logs",
          filter: `player_id=eq.${userId}`,
        },
        (payload: RealtimePostgresInsertPayload<WorkoutLog>) => {
          this.logger.info(
            "[ACWR] New workout log received",
            toLogContext(payload.new),
          );
          const log = payload.new;

          const session: TrainingSession = {
            playerId: log.player_id,
            date: new Date(log.completed_at),
            sessionType: this.inferSessionType(log),
            metrics: {
              type: "internal",
              internal: {
                sessionRPE: log.rpe || 5,
                duration: log.duration_minutes || 60,
                workload: (log.rpe || 5) * (log.duration_minutes || 60),
              },
              calculatedLoad: (log.rpe || 5) * (log.duration_minutes || 60),
            },
            load: (log.rpe || 5) * (log.duration_minutes || 60),
            notes: log.notes,
            completed: true,
            modifiedFromPlan: false,
          };

          this.addSession(session);
          this.logger.success(
            "[ACWR] Training session added from realtime update",
          );
        },
      )
      .on<WorkoutLog>(
        REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
        {
          event: REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.UPDATE,
          schema: "public",
          table: "workout_logs",
          filter: `player_id=eq.${userId}`,
        },
        (payload: RealtimePostgresUpdatePayload<WorkoutLog>) => {
          this.logger.info(
            "[ACWR] Workout log updated",
            toLogContext(payload.new),
          );
          // Reload sessions to update calculations
          this.loadPlayerSessions(userId);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          this.logger.success("[ACWR] Realtime subscription active");
        } else if (status === "CHANNEL_ERROR") {
          // Channel errors are common during page transitions and network issues
          // Log as debug instead of error to reduce console noise
          this.logger.debug(
            "[ACWR] Realtime subscription channel error (connection may have been lost)",
          );
        } else if (status === "CLOSED") {
          this.logger.debug("[ACWR] Realtime subscription closed");
        } else if (status === "TIMED_OUT") {
          this.logger.debug(
            "[ACWR] Realtime subscription timed out (will auto-reconnect)",
          );
        }
      });
  }

  /**
   * Unsubscribe from realtime updates
   */
  private unsubscribeFromWorkoutLogs(): void {
    if (this.realtimeChannel) {
      this.supabaseService.client.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
      this.logger.debug("[ACWR] Unsubscribed from realtime updates");
    }
  }

  /**
   * Infer session type from workout log data
   */
  private inferSessionType(
    log: WorkoutLog,
  ):
    | "game"
    | "sprint"
    | "technical"
    | "conditioning"
    | "strength"
    | "recovery" {
    // Try to infer from notes or session_id
    // For now, default to technical
    const notes = (log.notes || "").toLowerCase();

    if (notes.includes("game") || notes.includes("match")) {
      return "game";
    } else if (notes.includes("sprint") || notes.includes("speed")) {
      return "sprint";
    } else if (
      notes.includes("strength") ||
      notes.includes("gym") ||
      notes.includes("weights")
    ) {
      return "strength";
    } else if (notes.includes("conditioning") || notes.includes("cardio")) {
      return "conditioning";
    } else if (notes.includes("recovery") || notes.includes("rest")) {
      return "recovery";
    }

    return "technical";
  }

  /**
   * Save ACWR data back to database (for analytics/reporting)
   * Note: The database trigger already calculates ACWR, but this can be used
   * for storing additional computed metrics or overrides
   */
  public async saveACWRToDatabase(userId: string): Promise<void> {
    const acwrData = this.acwrData();

    if (acwrData.ratio === 0) {
      this.logger.debug("[ACWR] Skipping save - insufficient data");
      return;
    }

    try {
      // Note: load_monitoring uses calculated_at (timestamp with time zone) not date column
      const { error } = await this.supabaseService.client
        .from("load_monitoring")
        .upsert({
          player_id: userId,
          calculated_at: new Date().toISOString(),
          daily_load: Math.round(acwrData.acute), // Current day's load estimate
          acute_load: acwrData.acute,
          chronic_load: acwrData.chronic,
          acwr: acwrData.ratio,
          injury_risk_level: acwrData.riskZone.label,
        });

      if (error) {
        this.logger.error("[ACWR] Error saving to database:", error);
      } else {
        this.logger.debug("[ACWR] Saved to database successfully");

        // Check for ACWR spike and create load cap if needed
        if (acwrData.ratio > 1.5) {
          await this.acwrSpikeDetection.checkAndCapLoad(userId, acwrData.ratio);
        }
      }
    } catch (error) {
      this.logger.error("[ACWR] Failed to save ACWR data:", error);
    }
  }

  /**
   * Check if player had an injury during a specific date range
   * @param playerId - Player ID to check
   * @param startDate - Start date of the period (ISO string)
   * @param endDate - End date of the period (ISO string)
   * @returns Promise<boolean> - True if injury occurred during period
   */
  private async checkForRecentInjury(
    playerId: string,
    startDate: string | undefined,
    endDate: string | undefined,
  ): Promise<boolean> {
    if (!startDate || !endDate) {
      return false;
    }

    try {
      const { data, error } = await this.supabaseService.client
        .from("injury_tracking")
        .select("injury_date")
        .eq("player_id", playerId)
        .gte("injury_date", startDate)
        .lte("injury_date", endDate)
        .limit(1);

      if (error) {
        this.logger.warn(
          "[ACWR] Error checking injury history:",
          toLogContext(error),
        );
        return false;
      }

      return (data && data.length > 0) || false;
    } catch (error) {
      this.logger.warn(
        "[ACWR] Failed to check injury history:",
        toLogContext(error),
      );
      return false;
    }
  }
}
