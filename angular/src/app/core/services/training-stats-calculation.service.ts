/**
 * Training Statistics Calculation Service
 * Centralized service for calculating training statistics (volume, intensity, weekly stats)
 * Used by Analytics, Performance, and Game Tracker components
 *
 * This service ensures consistent calculations across all views.
 * ACWR calculations are delegated to AcwrService (single source of truth).
 */

import { Injectable, inject } from "@angular/core";
import { Observable, of, from } from "rxjs";
import { catchError } from "rxjs/operators";
import { TrainingDataService, TrainingSession } from "./training-data.service";
import { LoggerService } from "./logger.service";
import { AcwrService } from "./acwr.service";
import { SupabaseService } from "./supabase.service";
import { AuthService } from "./auth.service";

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
  private trainingDataService = inject(TrainingDataService);
  private logger = inject(LoggerService);
  private acwrService = inject(AcwrService);
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);

  /**
   * Get comprehensive training statistics
   * Uses direct Supabase calculation (API fallback removed for reliability)
   * 
   * Note: Previously tried API first, but this caused connection errors
   * when backend wasn't running. Now uses direct Supabase for reliability.
   */
  getTrainingStats(options?: {
    startDate?: string;
    endDate?: string;
  }): Observable<TrainingStatsData> {
    // Use direct Supabase calculation for reliability
    // This avoids connection errors when backend API isn't running
    return from(this.calculateStatsFromSupabase(options)).pipe(
      catchError((err) => {
        this.logger.error("[TrainingStats] Error calculating stats:", err);
        return of(this.getEmptyStats());
      }),
    );
  }

  /**
   * Calculate training stats directly from Supabase when API is unavailable
   */
  private async calculateStatsFromSupabase(options?: {
    startDate?: string;
    endDate?: string;
  }): Promise<TrainingStatsData> {
    const user = this.authService.getUser();
    if (!user?.id) {
      return this.getEmptyStats();
    }

    try {
      // Build query with optional date filters
      let query = this.supabase.client
        .from("training_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("session_date", { ascending: false });

      if (options?.startDate) {
        query = query.gte("session_date", options.startDate);
      }
      if (options?.endDate) {
        query = query.lte("session_date", options.endDate);
      }

      const { data: sessions, error } = await query;

      if (error || !sessions) {
        this.logger.warn("[TrainingStats] Error loading sessions:", error);
        return this.getEmptyStats();
      }

      // Calculate stats from sessions
      const totalSessions = sessions.length;
      const totalDuration = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      const totalLoad = sessions.reduce((sum, s) => {
        const duration = s.duration_minutes || 0;
        const rpe = s.rpe || s.intensity_level || 5;
        return sum + (duration * rpe);
      }, 0);

      // Weekly volume calculation
      const weeklyVolume = this.calculateWeeklyVolume(sessions as TrainingSession[]);

      // Session breakdown by type
      const sessionsByType: Record<string, { count: number; totalDuration: number; totalLoad: number }> = {};
      sessions.forEach(s => {
        const type = s.session_type || "general";
        if (!sessionsByType[type]) {
          sessionsByType[type] = { count: 0, totalDuration: 0, totalLoad: 0 };
        }
        sessionsByType[type].count++;
        sessionsByType[type].totalDuration += s.duration_minutes || 0;
        sessionsByType[type].totalLoad += (s.duration_minutes || 0) * (s.rpe || 5);
      });

      // Get ACWR from dedicated service
      const acwrData = this.acwrService.acwrData();

      return {
        totalSessions,
        totalDuration,
        totalLoad,
        avgDuration: totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0,
        avgLoad: totalSessions > 0 ? Math.round(totalLoad / totalSessions) : 0,
        currentStreak: this.calculateStreakFromSessions(sessions),
        acwr: acwrData?.ratio ?? null,
        acuteLoad: acwrData?.acute ?? 0,
        chronicLoad: acwrData?.chronic ?? 0,
        acwrRiskZone: acwrData?.riskZone?.level ?? "no-data",
        acwrMessage: acwrData?.riskZone?.description ?? "Not enough data",
        weeklyVolume: weeklyVolume.totalLoad,
        weeklyDuration: weeklyVolume.totalDuration,
        weeklySessions: weeklyVolume.sessionCount,
        weeklyAvgIntensity: weeklyVolume.avgIntensity,
        sessionsByType,
        dateRange: {
          startDate: options?.startDate || null,
          endDate: options?.endDate || null,
          filteredToToday: new Date().toISOString().split("T")[0],
        },
      };
    } catch (err) {
      this.logger.error("[TrainingStats] Error calculating stats:", err);
      return this.getEmptyStats();
    }
  }

  /**
   * Calculate current training streak from raw session data
   */
  private calculateStreakFromSessions(sessions: Array<{ session_date?: string; date?: string }>): number {
    if (sessions.length === 0) return 0;

    const sortedDates = [...new Set(
      sessions
        .map(s => s.session_date || s.date)
        .filter((d): d is string => Boolean(d))
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    )];

    if (sortedDates.length === 0) return 0;

    let streak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastSession = new Date(sortedDates[0]);
    lastSession.setHours(0, 0, 0, 0);

    // Check if streak is still active (within last 2 days)
    const daysSinceLastSession = Math.floor((today.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLastSession > 2) return 0;

    for (let i = 1; i < sortedDates.length; i++) {
      const current = new Date(sortedDates[i - 1]);
      const prev = new Date(sortedDates[i]);
      const dayDiff = Math.floor((current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff <= 2) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
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
