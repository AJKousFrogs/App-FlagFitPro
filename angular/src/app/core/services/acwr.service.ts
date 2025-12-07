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
 * Risk Zones:
 * - < 0.80: Under-training (orange) - insufficient conditioning
 * - 0.80-1.30: Sweet spot (green) - optimal, lowest injury risk
 * - > 1.30: Elevated risk (yellow) - caution needed
 * - > 1.50: Danger zone (red) - highest injury risk, reduce load
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import { Injectable, Signal, computed, signal } from '@angular/core';
import { LoadMetrics, TrainingSession, ACWRData, RiskZone, LoadType } from '../models/acwr.models';

@Injectable({
  providedIn: 'root'
})
export class AcwrService {
  // Lambda value for EWMA calculation (0.2 recommended for 7-day acute)
  private readonly ACUTE_LAMBDA = 0.2; // More weight to recent days
  private readonly CHRONIC_LAMBDA = 0.05; // Smoother for 28-day average

  // Training sessions history (stores last 28 days)
  private readonly trainingSessions = signal<TrainingSession[]>([]);

  // Current player ID being tracked
  private readonly currentPlayerId = signal<string | null>(null);

  /**
   * Calculate EWMA (Exponentially Weighted Moving Average)
   * Formula: EWMA_today = lambda × load_today + (1 - lambda) × EWMA_yesterday
   *
   * @param loads - Array of daily loads (most recent first)
   * @param lambda - Decay factor (0-1), higher = more weight to recent
   * @param days - Number of days to calculate over
   */
  private calculateEWMA(loads: number[], lambda: number, days: number): number {
    if (loads.length === 0) return 0;

    // Start with first value
    let ewma = loads[0];

    // Apply EWMA formula iteratively
    for (let i = 1; i < Math.min(loads.length, days); i++) {
      ewma = lambda * loads[i] + (1 - lambda) * ewma;
    }

    return ewma;
  }

  /**
   * Aggregate daily loads from all session types
   * Combines: technical training + gym + conditioning + games
   */
  private aggregateDailyLoads(sessions: TrainingSession[]): Map<string, number> {
    const dailyLoads = new Map<string, number>();

    sessions.forEach(session => {
      const dateKey = this.getDateKey(session.date);
      const currentLoad = dailyLoads.get(dateKey) || 0;
      dailyLoads.set(dateKey, currentLoad + session.load);
    });

    return dailyLoads;
  }

  /**
   * Get loads for last N days
   */
  private getRecentLoads(dailyLoads: Map<string, number>, days: number): number[] {
    const loads: number[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = this.getDateKey(date);
      loads.push(dailyLoads.get(dateKey) || 0);
    }

    return loads;
  }

  /**
   * Convert date to string key (YYYY-MM-DD)
   */
  private getDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Reactive signal: Calculate 7-day acute load (fatigue)
   */
  public acuteLoad: Signal<number> = computed(() => {
    const sessions = this.trainingSessions();
    if (sessions.length === 0) return 0;

    const dailyLoads = this.aggregateDailyLoads(sessions);
    const loads = this.getRecentLoads(dailyLoads, 7);

    return this.calculateEWMA(loads, this.ACUTE_LAMBDA, 7);
  });

  /**
   * Reactive signal: Calculate 28-day chronic load (fitness)
   */
  public chronicLoad: Signal<number> = computed(() => {
    const sessions = this.trainingSessions();
    if (sessions.length === 0) return 0;

    const dailyLoads = this.aggregateDailyLoads(sessions);
    const loads = this.getRecentLoads(dailyLoads, 28);

    return this.calculateEWMA(loads, this.CHRONIC_LAMBDA, 28);
  });

  /**
   * Reactive signal: Calculate ACWR ratio
   */
  public acwrRatio: Signal<number> = computed(() => {
    const acute = this.acuteLoad();
    const chronic = this.chronicLoad();

    // Avoid division by zero
    if (chronic === 0) return 0;

    return acute / chronic;
  });

  /**
   * Reactive signal: Determine risk zone based on ACWR
   */
  public riskZone: Signal<RiskZone> = computed(() => {
    const ratio = this.acwrRatio();

    if (ratio === 0) return {
      level: 'no-data',
      color: 'gray',
      label: 'No Data',
      description: 'Insufficient training data',
      recommendation: 'Continue logging sessions'
    };

    if (ratio < 0.80) return {
      level: 'under-training',
      color: 'orange',
      label: 'Under-Training',
      description: 'Player lacks conditioning',
      recommendation: 'Gradually increase training volume by 5-10%'
    };

    if (ratio <= 1.30) return {
      level: 'sweet-spot',
      color: 'green',
      label: 'Sweet Spot',
      description: 'Optimal workload - lowest injury risk',
      recommendation: 'Maintain current training load'
    };

    if (ratio <= 1.50) return {
      level: 'elevated-risk',
      color: 'yellow',
      label: 'Elevated Risk',
      description: 'Approaching danger zone',
      recommendation: 'Reduce high-intensity sessions, monitor closely'
    };

    return {
      level: 'danger-zone',
      color: 'red',
      label: 'Danger Zone',
      description: 'Highest injury risk - immediate action needed',
      recommendation: 'Reduce load by 20-30%, skip sprints, focus on recovery'
    };
  });

  /**
   * Reactive signal: Weekly load progression check
   * Ensures week-to-week increases don't exceed 10%
   */
  public weeklyProgression: Signal<{
    currentWeek: number;
    previousWeek: number;
    changePercent: number;
    isSafe: boolean;
    warning?: string;
  }> = computed(() => {
    const sessions = this.trainingSessions();
    if (sessions.length === 0) {
      return {
        currentWeek: 0,
        previousWeek: 0,
        changePercent: 0,
        isSafe: true
      };
    }

    const dailyLoads = this.aggregateDailyLoads(sessions);
    const currentWeekLoads = this.getRecentLoads(dailyLoads, 7);
    const previousWeekLoads = this.getRecentLoads(dailyLoads, 14).slice(7);

    const currentWeek = currentWeekLoads.reduce((sum, load) => sum + load, 0);
    const previousWeek = previousWeekLoads.reduce((sum, load) => sum + load, 0);

    const changePercent = previousWeek === 0 ? 0 :
      ((currentWeek - previousWeek) / previousWeek) * 100;

    const isSafe = changePercent <= 10;

    return {
      currentWeek,
      previousWeek,
      changePercent,
      isSafe,
      warning: !isSafe ?
        `Weekly load increased by ${changePercent.toFixed(1)}% (max recommended: 10%)` :
        undefined
    };
  });

  /**
   * Reactive signal: Complete ACWR data for dashboard
   */
  public acwrData: Signal<ACWRData> = computed(() => {
    return {
      acute: this.acuteLoad(),
      chronic: this.chronicLoad(),
      ratio: this.acwrRatio(),
      riskZone: this.riskZone(),
      weeklyProgression: this.weeklyProgression(),
      lastUpdated: new Date()
    };
  });

  /**
   * Add a training session
   * @param session - Training session data
   */
  public addSession(session: TrainingSession): void {
    const sessions = [...this.trainingSessions(), session];

    // Keep only last 28 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 28);

    const filtered = sessions.filter(s => s.date >= cutoffDate);

    // Sort by date (most recent first)
    filtered.sort((a, b) => b.date.getTime() - a.date.getTime());

    this.trainingSessions.set(filtered);
  }

  /**
   * Add multiple sessions at once
   */
  public addSessions(sessions: TrainingSession[]): void {
    sessions.forEach(session => this.addSession(session));
  }

  /**
   * Set current player being tracked
   */
  public setPlayer(playerId: string): void {
    this.currentPlayerId.set(playerId);
  }

  /**
   * Clear all sessions (useful for switching players)
   */
  public clearSessions(): void {
    this.trainingSessions.set([]);
  }

  /**
   * Get sessions for date range
   */
  public getSessionsInRange(startDate: Date, endDate: Date): TrainingSession[] {
    return this.trainingSessions().filter(
      session => session.date >= startDate && session.date <= endDate
    );
  }

  /**
   * Calculate predicted load for next session
   * Used for training adjustment logic
   */
  public predictNextSessionLoad(plannedIntensity: number): {
    projected: number;
    projectedACWR: number;
    recommendation: string;
  } {
    const current = this.acwrData();
    const chronic = current.chronic;

    // Estimate load based on intensity (1-10 scale) × typical duration (90 min)
    const estimatedLoad = plannedIntensity * 90;

    // Project what ACWR would be after adding this session
    const recentLoads = this.getRecentLoads(
      this.aggregateDailyLoads(this.trainingSessions()),
      7
    );
    const projectedLoads = [estimatedLoad, ...recentLoads.slice(0, 6)];
    const projectedAcute = this.calculateEWMA(projectedLoads, this.ACUTE_LAMBDA, 7);
    const projectedACWR = chronic === 0 ? 0 : projectedAcute / chronic;

    let recommendation = '';
    if (projectedACWR > 1.50) {
      recommendation = 'DANGER: Reduce session intensity or duration by 30-40%';
    } else if (projectedACWR > 1.30) {
      recommendation = 'CAUTION: Consider reducing intensity by 15-20%';
    } else if (projectedACWR < 0.80) {
      recommendation = 'SAFE: Can increase intensity if player feels good';
    } else {
      recommendation = 'OPTIMAL: Proceed as planned';
    }

    return {
      projected: estimatedLoad,
      projectedACWR,
      recommendation
    };
  }

  /**
   * Should player skip sprints today?
   * Based on ACWR and day of week
   */
  public shouldSkipSprints(dayOfWeek: number, gameDay: number = 6): boolean {
    const risk = this.riskZone();
    const ratio = this.acwrRatio();

    // Skip if in danger zone
    if (risk.level === 'danger-zone') return true;

    // Skip if elevated risk and within 2 days of game
    const daysUntilGame = (gameDay - dayOfWeek + 7) % 7;
    if (risk.level === 'elevated-risk' && daysUntilGame <= 2) return true;

    // Skip if ACWR > 1.30 and it's Friday (day before Saturday game)
    if (ratio > 1.30 && dayOfWeek === 5) return true;

    return false;
  }

  /**
   * Get recommended training modification
   */
  public getTrainingModification(): {
    shouldModify: boolean;
    modifications: string[];
  } {
    const risk = this.riskZone();
    const progression = this.weeklyProgression();
    const modifications: string[] = [];

    if (risk.level === 'danger-zone') {
      modifications.push('🚨 Reduce overall volume by 25-30%');
      modifications.push('🚫 Skip all sprint sessions');
      modifications.push('✅ Focus on technique and recovery');
      modifications.push('📊 Monitor wellness scores daily');
    } else if (risk.level === 'elevated-risk') {
      modifications.push('⚠️ Reduce high-intensity work by 15-20%');
      modifications.push('🏃 Limit sprint volume to 50%');
      modifications.push('🔄 Add extra recovery day');
    } else if (!progression.isSafe) {
      modifications.push(`📈 Weekly load spike: ${progression.changePercent.toFixed(1)}%`);
      modifications.push('⏸️ Maintain current load, don\'t increase');
      modifications.push('🎯 Target: <10% weekly increase');
    }

    return {
      shouldModify: modifications.length > 0,
      modifications
    };
  }
}
