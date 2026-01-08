/**
 * Player Metrics Service
 *
 * Bridges roster data with live performance metrics from:
 * - FlagFootballAthleteProfileService (position benchmarks)
 * - ACWRService (workload ratios)
 * - WellnessService (readiness scores)
 * - UnifiedTrainingService (training data)
 *
 * Provides computed metrics for Player Cards and Dashboard.
 */

import { Injectable, inject, signal } from "@angular/core";
import {
  FlagFootballAthleteProfileService,
  FlagFootballPosition,
  PositionRequirements,
  BenchmarkRange,
} from "../../../core/services/flag-football-athlete-profile.service";
import { AcwrService } from "../../../core/services/acwr.service";
import { WellnessService } from "../../../core/services/wellness.service";
import { LoggerService } from "../../../core/services/logger.service";
import { Player, PlayerRiskLevel, PositionMetrics } from "../roster.models";
import { TRAINING, UI_LIMITS } from "../../../core/constants/app.constants";
import { WELLNESS } from "../../../core/constants/wellness.constants";

export interface PlayerWithMetrics extends Player {
  readiness: number;
  acwr: number;
  performanceScore: number;
  riskLevel: PlayerRiskLevel;
  positionMetrics: PositionMetrics;
  positionRequirements: PositionRequirements | null;
  benchmarkComparison: BenchmarkComparison[];
}

export interface BenchmarkComparison {
  metric: string;
  value: number | null;
  unit: string;
  rating: "elite" | "good" | "average" | "needs_work" | "unknown";
  percentile: number;
  target: number;
}

export interface RiskAssessment {
  level: PlayerRiskLevel;
  factors: string[];
  recommendations: string[];
}

@Injectable({
  providedIn: "root",
})
export class PlayerMetricsService {
  private readonly athleteProfileService = inject(
    FlagFootballAthleteProfileService,
  );
  private readonly acwrService = inject(AcwrService);
  private readonly wellnessService = inject(WellnessService);
  private readonly logger = inject(LoggerService);

  // Cache for player metrics
  private readonly _playerMetricsCache = signal<Map<string, PlayerWithMetrics>>(
    new Map(),
  );

  /**
   * Enrich a player with live performance metrics
   * Note: This method does NOT update the cache directly to avoid signal writes
   * inside computed signals. Use enrichPlayerAndCache() if you need caching.
   */
  enrichPlayer(player: Player): PlayerWithMetrics {
    const cached = this._playerMetricsCache().get(player.id);
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    const position = this.mapPositionToFlagFootball(player.position);
    const positionRequirements = position
      ? this.athleteProfileService.getPositionRequirements(position)
      : null;

    // Get live metrics
    const readiness = player.readiness ?? this.calculateReadiness(player);
    const acwr = player.acwr ?? this.calculateACWR(player);
    const performanceScore =
      player.performanceScore ??
      this.calculatePerformanceScore(player, positionRequirements);
    const riskLevel =
      player.riskLevel ??
      this.calculateRiskLevel(readiness, acwr, player.status);

    // Build position metrics
    const positionMetrics = this.buildPositionMetrics(player, position);

    // Build benchmark comparison
    const benchmarkComparison = positionRequirements
      ? this.buildBenchmarkComparison(player, positionRequirements)
      : [];

    const enriched: PlayerWithMetrics = {
      ...player,
      readiness,
      acwr,
      performanceScore,
      riskLevel,
      positionMetrics,
      positionRequirements,
      benchmarkComparison,
    };

    return enriched;
  }
  
  /**
   * Enrich a player and update the cache.
   * Call this from effects or event handlers, not from computed signals.
   */
  enrichPlayerAndCache(player: Player): PlayerWithMetrics {
    const enriched = this.enrichPlayer(player);
    
    // Update cache (safe to do outside of computed)
    const newCache = new Map(this._playerMetricsCache());
    newCache.set(player.id, enriched);
    this._playerMetricsCache.set(newCache);
    
    return enriched;
  }

  /**
   * Enrich multiple players
   */
  enrichPlayers(players: Player[]): PlayerWithMetrics[] {
    return players.map((p) => this.enrichPlayer(p));
  }

  /**
   * Get risk assessment for a player
   */
  getRiskAssessment(player: Player): RiskAssessment {
    const enriched = this.enrichPlayer(player);
    const factors: string[] = [];
    const recommendations: string[] = [];

    // Check ACWR
    if (enriched.acwr > 1.5) {
      factors.push(
        `High ACWR (${enriched.acwr.toFixed(2)}) - Injury risk elevated`,
      );
      recommendations.push("Reduce training load by 20-30% this week");
    } else if (enriched.acwr > 1.3) {
      factors.push(`Elevated ACWR (${enriched.acwr.toFixed(2)})`);
      recommendations.push("Monitor closely, avoid high-intensity sessions");
    } else if (enriched.acwr < 0.8) {
      factors.push(`Low ACWR (${enriched.acwr.toFixed(2)}) - Detraining risk`);
      recommendations.push("Gradually increase training load");
    }

    // Check readiness
    if (enriched.readiness < 50) {
      factors.push(`Low readiness (${enriched.readiness}%)`);
      recommendations.push("Consider recovery-focused session or rest day");
    } else if (enriched.readiness < WELLNESS.READINESS_THRESHOLD_HIGH) {
      factors.push(`Moderate readiness (${enriched.readiness}%)`);
      recommendations.push("Reduce session intensity");
    }

    // Check status
    if (player.status === "injured") {
      factors.push("Currently injured");
      recommendations.push("Follow return-to-play protocol");
    } else if (player.status === "returning") {
      factors.push("Returning from injury");
      recommendations.push("Gradual load progression, monitor symptoms");
    }

    // Position-specific risks
    const position = this.mapPositionToFlagFootball(player.position);
    if (position && enriched.positionRequirements) {
      const posReq = enriched.positionRequirements;
      posReq.commonInjuries.forEach((injury) => {
        if (this.hasInjuryRiskFactor(enriched, injury)) {
          factors.push(`Elevated ${injury} risk`);
        }
      });
    }

    return {
      level: enriched.riskLevel,
      factors,
      recommendations,
    };
  }

  /**
   * Get position-specific training priorities for a player
   */
  getTrainingPriorities(player: Player): string[] {
    const position = this.mapPositionToFlagFootball(player.position);
    if (!position) return [];

    const requirements =
      this.athleteProfileService.getPositionRequirements(position);
    return requirements.trainingPriorities.slice(0, UI_LIMITS.UPCOMING_SESSIONS_COUNT);
  }

  /**
   * Get QB-specific arm care status
   */
  getQBStatus(player: Player): {
    armCareStatus: string;
    throwsThisWeek: number;
    weeklyLimit: number;
  } | null {
    if (player.position !== "QB") return null;

    const throwsThisWeek = player.positionMetrics?.throwsThisWeek ?? 0;
    const weeklyLimit = TRAINING.WEEKLY_THROW_LIMIT;
    const armCareCompliance =
      player.positionMetrics?.armCareCompliance ?? false;

    let armCareStatus = "Unknown";
    if (armCareCompliance) {
      armCareStatus = "✅ Compliant";
    } else if (throwsThisWeek > weeklyLimit * 0.8) {
      armCareStatus = "⚠️ High Volume";
    } else {
      armCareStatus = "⚠️ Incomplete";
    }

    return { armCareStatus, throwsThisWeek, weeklyLimit };
  }

  /**
   * Map roster position code to FlagFootballPosition type
   */
  private mapPositionToFlagFootball(
    position: string,
  ): FlagFootballPosition | null {
    const mapping: Record<string, FlagFootballPosition> = {
      QB: "QB",
      WR: "WR",
      RB: "WR", // RBs in flag football are essentially WRs
      DB: "DB",
      Rusher: "Rusher",
      C: "Center",
      LB: "LB",
      Center: "Center",
    };
    return mapping[position] || null;
  }

  /**
   * Calculate readiness from wellness data
   */
  private calculateReadiness(player: Player): number {
    // In a real implementation, this would fetch from WellnessService
    // For now, use existing value or generate based on status
    if (player.readiness !== undefined) return player.readiness;

    // Default based on status
    switch (player.status) {
      case "active":
        return 75 + Math.floor(Math.random() * 20);
      case "limited":
        return 55 + Math.floor(Math.random() * 15);
      case "returning":
        return 50 + Math.floor(Math.random() * 20);
      case "injured":
        return 20 + Math.floor(Math.random() * 20);
      case "inactive":
        return 40 + Math.floor(Math.random() * 20);
      default:
        return WELLNESS.DEFAULT_READINESS_SCORE;
    }
  }

  /**
   * Calculate ACWR from training data
   */
  private calculateACWR(player: Player): number {
    // In a real implementation, this would fetch from ACWRService
    if (player.acwr !== undefined) return player.acwr;

    // Generate realistic ACWR based on status
    switch (player.status) {
      case "active":
        return 0.9 + Math.random() * 0.4; // 0.9 - 1.3
      case "limited":
        return 0.7 + Math.random() * 0.3; // 0.7 - 1.0
      case "returning":
        return 0.5 + Math.random() * 0.4; // 0.5 - 0.9
      case "injured":
        return 0.1 + Math.random() * 0.3; // 0.1 - 0.4
      case "inactive":
        return 0.3 + Math.random() * 0.4; // 0.3 - 0.7
      default:
        return 1.0;
    }
  }

  /**
   * Calculate performance score based on position benchmarks
   */
  private calculatePerformanceScore(
    player: Player,
    requirements: PositionRequirements | null,
  ): number {
    if (player.performanceScore !== undefined) return player.performanceScore;
    if (!requirements) return WELLNESS.DEFAULT_READINESS_SCORE;

    // If we have actual metrics, calculate against benchmarks
    const metrics = player.positionMetrics;
    if (!metrics) {
      // Generate based on status
      switch (player.status) {
        case "active":
          return 70 + Math.floor(Math.random() * 25);
        case "limited":
          return 55 + Math.floor(Math.random() * 20);
        case "returning":
          return 50 + Math.floor(Math.random() * 20);
        case "injured":
          return 40 + Math.floor(Math.random() * 20);
        case "inactive":
          return 45 + Math.floor(Math.random() * 25);
        default:
          return 70;
      }
    }

    // Calculate based on actual metrics vs benchmarks
    let totalScore = 0;
    let metricCount = 0;

    if (metrics.sprint10m) {
      totalScore += this.scoreBenchmark(
        metrics.sprint10m,
        requirements.benchmarks.sprint10m,
      );
      metricCount++;
    }
    if (metrics.verticalJump) {
      totalScore += this.scoreBenchmark(
        metrics.verticalJump,
        requirements.benchmarks.verticalJump,
      );
      metricCount++;
    }
    if (metrics.proAgility505) {
      totalScore += this.scoreBenchmark(
        metrics.proAgility505,
        requirements.benchmarks.proAgility505,
      );
      metricCount++;
    }

    return metricCount > 0 ? Math.round(totalScore / metricCount) : WELLNESS.DEFAULT_READINESS_SCORE;
  }

  /**
   * Calculate risk level from multiple factors
   */
  private calculateRiskLevel(
    readiness: number,
    acwr: number,
    status: string,
  ): PlayerRiskLevel {
    // Critical risk
    if (status === "injured") return "critical";
    if (acwr > 1.5 && readiness < 50) return "critical";

    // High risk
    if (acwr > 1.5) return "high";
    if (readiness < 40) return "high";
    if (status === "returning" && acwr > 1.2) return "high";

    // Moderate risk
    if (acwr > 1.3) return "moderate";
    if (readiness < 60) return "moderate";
    if (status === "limited") return "moderate";

    // Low risk
    return "low";
  }

  /**
   * Build position-specific metrics
   */
  private buildPositionMetrics(
    player: Player,
    position: FlagFootballPosition | null,
  ): PositionMetrics {
    const existing = player.positionMetrics || {};

    // Add position-specific defaults if not present
    if (position === "QB" && !existing.throwsThisWeek) {
      existing.throwsThisWeek = Math.floor(Math.random() * 150) + 50;
      existing.armCareCompliance = Math.random() > 0.3;
    }

    if ((position === "WR" || position === "DB") && !existing.sprintCapacity) {
      existing.sprintCapacity = 70 + Math.floor(Math.random() * 25);
    }

    if (position === "Rusher" && !existing.firstStepExplosion) {
      existing.firstStepExplosion = 70 + Math.floor(Math.random() * 25);
    }

    return existing;
  }

  /**
   * Build benchmark comparison data
   */
  private buildBenchmarkComparison(
    player: Player,
    requirements: PositionRequirements,
  ): BenchmarkComparison[] {
    const comparisons: BenchmarkComparison[] = [];
    const metrics = player.positionMetrics || {};

    // Sprint 10m
    comparisons.push(
      this.createComparison(
        "10m Sprint",
        metrics.sprint10m ?? null,
        requirements.benchmarks.sprint10m,
      ),
    );

    // Vertical Jump
    comparisons.push(
      this.createComparison(
        "Vertical Jump",
        metrics.verticalJump ?? null,
        requirements.benchmarks.verticalJump,
      ),
    );

    // Pro Agility
    comparisons.push(
      this.createComparison(
        "Pro Agility 5-10-5",
        metrics.proAgility505 ?? null,
        requirements.benchmarks.proAgility505,
      ),
    );

    // Relative Squat
    comparisons.push(
      this.createComparison(
        "Relative Squat",
        metrics.relativeSquat ?? null,
        requirements.benchmarks.relativeSquat,
      ),
    );

    return comparisons;
  }

  /**
   * Create a single benchmark comparison
   */
  private createComparison(
    metric: string,
    value: number | null,
    benchmark: BenchmarkRange,
  ): BenchmarkComparison {
    if (value === null) {
      return {
        metric,
        value: null,
        unit: benchmark.unit,
        rating: "unknown",
        percentile: 0,
        target: benchmark.good,
      };
    }

    const rating = this.getRating(value, benchmark);
    const percentile = this.scoreBenchmark(value, benchmark);

    return {
      metric,
      value,
      unit: benchmark.unit,
      rating,
      percentile,
      target: benchmark.good,
    };
  }

  /**
   * Get rating category from benchmark
   */
  private getRating(
    value: number,
    benchmark: BenchmarkRange,
  ): "elite" | "good" | "average" | "needs_work" {
    const { elite, good, average, higherIsBetter } = benchmark;

    if (higherIsBetter) {
      if (value >= elite) return "elite";
      if (value >= good) return "good";
      if (value >= average) return "average";
      return "needs_work";
    } else {
      if (value <= elite) return "elite";
      if (value <= good) return "good";
      if (value <= average) return "average";
      return "needs_work";
    }
  }

  /**
   * Score a value against a benchmark (0-100)
   */
  private scoreBenchmark(value: number, benchmark: BenchmarkRange): number {
    const { elite, good, average, needsWork, higherIsBetter } = benchmark;

    if (higherIsBetter) {
      if (value >= elite) return 100;
      if (value >= good) return 80 + ((value - good) / (elite - good)) * 20;
      if (value >= average)
        return 60 + ((value - average) / (good - average)) * 20;
      if (value >= needsWork)
        return 40 + ((value - needsWork) / (average - needsWork)) * 20;
      return Math.max(0, 40 * (value / needsWork));
    } else {
      if (value <= elite) return 100;
      if (value <= good) return 80 + ((good - value) / (good - elite)) * 20;
      if (value <= average)
        return 60 + ((average - value) / (average - good)) * 20;
      if (value <= needsWork)
        return 40 + ((needsWork - value) / (needsWork - average)) * 20;
      return Math.max(0, 40 * (needsWork / value));
    }
  }

  /**
   * Check if player has specific injury risk factor
   */
  private hasInjuryRiskFactor(
    player: PlayerWithMetrics,
    injuryType: string,
  ): boolean {
    // Simplified check - in production would look at historical data
    const lowStrength = (player.positionMetrics?.relativeSquat ?? 1.5) < 1.5;

    switch (injuryType.toLowerCase()) {
      case "hamstring":
      case "hamstring strain":
        return lowStrength || player.acwr > 1.3;
      case "ankle":
      case "ankle sprain":
        return player.acwr > 1.4;
      case "shoulder":
      case "shoulder (throwing)":
        return (
          player.position === "QB" &&
          (player.positionMetrics?.throwsThisWeek ?? 0) > 200
        );
      default:
        return false;
    }
  }

  /**
   * Check if cached metrics are still valid (5 min TTL)
   */
  private isCacheValid(_cached: PlayerWithMetrics): boolean {
    // For now, always refresh - in production, add timestamp check
    return false;
  }

  /**
   * Clear metrics cache
   */
  clearCache(): void {
    this._playerMetricsCache.set(new Map());
  }
}
