/**
 * Training Stats Service
 *
 * Handles training statistics calculations and aggregations.
 * Split from training-data.service.ts for single responsibility.
 *
 * Responsibilities:
 * - Training stats calculations
 * - Streak tracking
 * - Weekly/monthly aggregations
 * - ACWR calculations (delegates to acwr.service)
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { Observable, from, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { AuthService } from "./auth.service";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";
import { TRAINING } from "../constants/app.constants";

export interface TrainingStats {
  totalSessions: number;
  totalDuration: number;
  avgDuration: number;
  sessionsThisWeek: number;
  sessionsThisMonth: number;
  totalLoad: number;
  avgLoad: number;
  currentStreak: number;
  weeklyVolume: number;
  weeklyDuration: number;
  weeklySessions: number;
  weeklyAvgIntensity: number;
}

export interface StreakInfo {
  current: number;
  longest: number;
  lastTrainingDate: string | null;
}

interface SessionRecord {
  session_date: string;
  duration_minutes: number;
  workload: number;
  intensity_level: number;
  status: string;
}

@Injectable({
  providedIn: "root",
})
export class TrainingStatsService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);
  private logger = inject(LoggerService);

  // Reactive state
  private readonly _stats = signal<TrainingStats | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public signals
  readonly stats = this._stats.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly currentStreak = computed(() => this._stats()?.currentStreak ?? 0);
  readonly totalSessions = computed(() => this._stats()?.totalSessions ?? 0);
  readonly weeklyProgress = computed(() => {
    const stats = this._stats();
    if (!stats) return 0;
    return Math.min(
      100,
      Math.round((stats.sessionsThisWeek / TRAINING.MAX_SESSIONS_PER_WEEK) * 100)
    );
  });

  /**
   * Calculate and fetch training stats
   */
  calculateStats(options?: {
    startDate?: string;
    endDate?: string;
  }): Observable<{ data: TrainingStats | null; error: string | null }> {
    this._isLoading.set(true);
    this._error.set(null);

    const userId = this.auth.getCurrentUserId();
    if (!userId) {
      return of({ data: null, error: "Not authenticated" });
    }

    // Build query
    let query = this.supabase.client
      .from("training_sessions")
      .select("session_date, duration_minutes, workload, intensity_level, status")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("session_date", { ascending: false });

    if (options?.startDate) {
      query = query.gte("session_date", options.startDate);
    }
    if (options?.endDate) {
      query = query.lte("session_date", options.endDate);
    }

    return from(query).pipe(
      map((response) => {
        this._isLoading.set(false);

        if (response.error) {
          this._error.set(response.error.message);
          return { data: null, error: response.error.message };
        }

        const sessions = (response.data || []) as SessionRecord[];
        const stats = this.computeStats(sessions);
        this._stats.set(stats);

        return { data: stats, error: null };
      }),
      catchError((err) => {
        this._isLoading.set(false);
        this._error.set(err.message);
        this.logger.error("Failed to calculate training stats", err);
        return of({ data: null, error: err.message });
      })
    );
  }

  /**
   * Get current streak info
   */
  getStreakInfo(): Observable<{ data: StreakInfo; error: string | null }> {
    const userId = this.auth.getCurrentUserId();
    if (!userId) {
      return of({
        data: { current: 0, longest: 0, lastTrainingDate: null },
        error: "Not authenticated",
      });
    }

    return from(
      this.supabase.client
        .from("training_sessions")
        .select("session_date")
        .eq("user_id", userId)
        .eq("status", "completed")
        .order("session_date", { ascending: false })
        .limit(100)
    ).pipe(
      map((response) => {
        if (response.error) {
          return {
            data: { current: 0, longest: 0, lastTrainingDate: null },
            error: response.error.message,
          };
        }

        const dates = (response.data || []).map((s) => s.session_date as string);
        const streakInfo = this.calculateStreakInfo(dates);

        return { data: streakInfo, error: null };
      }),
      catchError((err) => {
        this.logger.error("Failed to get streak info", err);
        return of({
          data: { current: 0, longest: 0, lastTrainingDate: null },
          error: err.message,
        });
      })
    );
  }

  /**
   * Compute stats from session records
   */
  private computeStats(sessions: SessionRecord[]): TrainingStats {
    if (sessions.length === 0) {
      return this.getEmptyStats();
    }

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Filter sessions
    const weekSessions = sessions.filter(
      (s) => new Date(s.session_date) >= startOfWeek
    );
    const monthSessions = sessions.filter(
      (s) => new Date(s.session_date) >= startOfMonth
    );

    // Calculate totals
    const totalDuration = sessions.reduce(
      (sum, s) => sum + (s.duration_minutes || 0),
      0
    );
    const totalLoad = sessions.reduce((sum, s) => sum + (s.workload || 0), 0);
    const weeklyDuration = weekSessions.reduce(
      (sum, s) => sum + (s.duration_minutes || 0),
      0
    );
    const weeklyLoad = weekSessions.reduce(
      (sum, s) => sum + (s.workload || 0),
      0
    );

    // Calculate averages
    const avgDuration =
      sessions.length > 0 ? Math.round(totalDuration / sessions.length) : 0;
    const avgLoad =
      sessions.length > 0 ? Math.round(totalLoad / sessions.length) : 0;
    const weeklyAvgIntensity =
      weekSessions.length > 0
        ? weekSessions.reduce((sum, s) => sum + (s.intensity_level || 5), 0) /
          weekSessions.length
        : 0;

    // Calculate streak
    const dates = sessions.map((s) => s.session_date);
    const currentStreak = this.calculateCurrentStreak(dates);

    return {
      totalSessions: sessions.length,
      totalDuration,
      avgDuration,
      sessionsThisWeek: weekSessions.length,
      sessionsThisMonth: monthSessions.length,
      totalLoad,
      avgLoad,
      currentStreak,
      weeklyVolume: weeklyLoad,
      weeklyDuration,
      weeklySessions: weekSessions.length,
      weeklyAvgIntensity: Math.round(weeklyAvgIntensity * 10) / 10,
    };
  }

  /**
   * Calculate current training streak
   */
  private calculateCurrentStreak(dates: string[]): number {
    if (dates.length === 0) return 0;

    // Sort dates descending
    const sortedDates = [...new Set(dates)].sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const mostRecent = new Date(sortedDates[0]);
    mostRecent.setHours(0, 0, 0, 0);

    // Check if streak is still active (trained today or yesterday)
    if (mostRecent < yesterday) {
      return 0; // Streak broken
    }

    let streak = 1;
    let currentDate = mostRecent;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(currentDate);
      prevDate.setDate(prevDate.getDate() - 1);

      const sessionDate = new Date(sortedDates[i]);
      sessionDate.setHours(0, 0, 0, 0);

      if (sessionDate.getTime() === prevDate.getTime()) {
        streak++;
        currentDate = sessionDate;
      } else if (sessionDate.getTime() < prevDate.getTime()) {
        break; // Gap in streak
      }
    }

    return streak;
  }

  /**
   * Calculate streak info including longest streak
   */
  private calculateStreakInfo(dates: string[]): StreakInfo {
    if (dates.length === 0) {
      return { current: 0, longest: 0, lastTrainingDate: null };
    }

    const sortedDates = [...new Set(dates)].sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    const currentStreak = this.calculateCurrentStreak(sortedDates);

    // Calculate longest streak
    let longest = 0;
    let tempStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const current = new Date(sortedDates[i - 1]);
      const prev = new Date(sortedDates[i]);
      const diffDays = Math.floor(
        (current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longest = Math.max(longest, tempStreak);
        tempStreak = 1;
      }
    }
    longest = Math.max(longest, tempStreak);

    return {
      current: currentStreak,
      longest,
      lastTrainingDate: sortedDates[0] || null,
    };
  }

  /**
   * Get empty stats object
   */
  private getEmptyStats(): TrainingStats {
    return {
      totalSessions: 0,
      totalDuration: 0,
      avgDuration: 0,
      sessionsThisWeek: 0,
      sessionsThisMonth: 0,
      totalLoad: 0,
      avgLoad: 0,
      currentStreak: 0,
      weeklyVolume: 0,
      weeklyDuration: 0,
      weeklySessions: 0,
      weeklyAvgIntensity: 0,
    };
  }
}
