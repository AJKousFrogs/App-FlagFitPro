/**
 * Training Statistics Calculation Service
 * Centralized service for calculating training statistics (ACWR, REP, volume, intensity)
 * Used by Analytics, Performance, and Game Tracker components
 *
 * This service ensures consistent calculations across all views
 *
 * NOTE: ACWR calculations are now delegated to AcwrService (single source of truth)
 * The calculateACWR method here is DEPRECATED - use AcwrService.acwrData() instead
 */

import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { TrainingDataService, TrainingSession } from "./training-data.service";
import { ApiService, API_ENDPOINTS } from "./api.service";
import { LoggerService } from "./logger.service";
import { AcwrService } from "./acwr.service";

export interface ACWRData {
  acwr: number | null;
  acuteLoad: number;
  chronicLoad: number;
  acuteDays: number;
  chronicDays: number;
  riskZone:
    | "insufficient_data"
    | "detraining"
    | "optimal"
    | "elevated"
    | "danger";
  message: string;
}

export interface WeeklyVolumeData {
  totalLoad: number;
  totalDuration: number;
  sessionCount: number;
  avgIntensity: number;
  weekStart: string;
  weekEnd: string;
}

export interface TrainingStatsData {
  // Overall stats
  totalSessions: number;
  totalDuration: number;
  totalLoad: number;
  avgDuration: number;
  avgLoad: number;
  currentStreak: number;

  // ACWR metrics
  acwr: number | null;
  acuteLoad: number;
  chronicLoad: number;
  acwrRiskZone: string;
  acwrMessage: string;

  // Weekly volume
  weeklyVolume: number;
  weeklyDuration: number;
  weeklySessions: number;
  weeklyAvgIntensity: number;

  // Breakdown by type
  sessionsByType: Record<
    string,
    {
      count: number;
      totalDuration: number;
      totalLoad: number;
    }
  >;

  // Date range
  dateRange: {
    startDate: string | null;
    endDate: string | null;
    filteredToToday: string;
  };
}

@Injectable({
  providedIn: "root",
})
export class TrainingStatsCalculationService {
  private apiService = inject(ApiService);
  private trainingDataService = inject(TrainingDataService);
  private logger = inject(LoggerService);
  private acwrService = inject(AcwrService);

  /**
   * Get comprehensive training statistics
   * Uses backend API for consistent calculations
   */
  getTrainingStats(options?: {
    startDate?: string;
    endDate?: string;
  }): Observable<TrainingStatsData> {
    const params: Record<string, string> = {};

    if (options?.startDate) {
      params["startDate"] = options.startDate;
    }

    if (options?.endDate) {
      params["endDate"] = options.endDate;
    }

    return this.apiService
      .get<TrainingStatsData>(API_ENDPOINTS.training.statsEnhanced, params)
      .pipe(
        map((response) => {
          if (response.error || !response.data) {
            this.logger.error("Error fetching training stats:", response.error);
            return this.getEmptyStats();
          }
          return response.data;
        }),
      );
  }

  /**
   * Calculate weekly volume
   */
  calculateWeeklyVolume(
    sessions: TrainingSession[],
    referenceDate: Date = new Date(),
  ): WeeklyVolumeData {
    const today =
      referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
    const _todayStr = today.toISOString().split("T")[0];

    // Get ISO week start (Monday)
    const getISOWeekStart = (date: Date): Date => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff));
    };

    const weekStart = getISOWeekStart(today);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekStartStr = weekStart.toISOString().split("T")[0];
    const weekEndStr = weekEnd.toISOString().split("T")[0];

    const weekSessions = sessions.filter((s) => {
      const sessionDate = s.session_date || s.date;
      return (
        sessionDate && sessionDate >= weekStartStr && sessionDate <= weekEndStr
      );
    });

    const calculateLoad = (session: TrainingSession): number => {
      const duration = session.duration_minutes || session.duration || 0;
      const rpe = session.rpe || session.intensity_level || 5;
      return duration * rpe;
    };

    const totalLoad = weekSessions.reduce(
      (sum, s) => sum + calculateLoad(s),
      0,
    );
    const totalDuration = weekSessions.reduce(
      (sum, s) => sum + (s.duration_minutes || s.duration || 0),
      0,
    );
    const avgIntensity =
      weekSessions.length > 0
        ? weekSessions.reduce(
            (sum, s) => sum + (s.rpe || s.intensity_level || 5),
            0,
          ) / weekSessions.length
        : 0;

    return {
      totalLoad: Math.round(totalLoad),
      totalDuration: Math.round(totalDuration),
      sessionCount: weekSessions.length,
      avgIntensity: Math.round(avgIntensity * 10) / 10,
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
    };
  }

  /**
   * Calculate current streak (consecutive days with training)
   */
  calculateStreak(
    sessions: TrainingSession[],
    referenceDate: Date = new Date(),
  ): number {
    const today =
      referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
    const todayStr = today.toISOString().split("T")[0];

    // Filter sessions up to and including today
    const validSessions = sessions.filter((s) => {
      const sessionDate = s.session_date || s.date;
      return sessionDate && sessionDate <= todayStr;
    });

    let currentStreak = 0;
    const todayDate = new Date(todayStr);

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(todayDate);
      checkDate.setDate(todayDate.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];

      const hasSessionOnDate = validSessions.some((s) => {
        const sessionDate = s.session_date || s.date;
        return sessionDate === dateStr;
      });

      if (hasSessionOnDate) {
        currentStreak++;
      } else if (i > 0) {
        // Don't break streak on first day (today) if no session yet
        break;
      }
    }

    return currentStreak;
  }

  /**
   * Get empty stats object
   */
  private getEmptyStats(): TrainingStatsData {
    return {
      totalSessions: 0,
      totalDuration: 0,
      totalLoad: 0,
      avgDuration: 0,
      avgLoad: 0,
      currentStreak: 0,
      acwr: null,
      acuteLoad: 0,
      chronicLoad: 0,
      acwrRiskZone: "insufficient_data",
      acwrMessage: "Insufficient data",
      weeklyVolume: 0,
      weeklyDuration: 0,
      weeklySessions: 0,
      weeklyAvgIntensity: 0,
      sessionsByType: {},
      dateRange: {
        startDate: null,
        endDate: null,
        filteredToToday: new Date().toISOString().split("T")[0],
      },
    };
  }
}
