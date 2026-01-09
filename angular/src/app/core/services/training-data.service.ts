import { Injectable, inject, computed } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, from, of } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";

export interface TrainingSession {
  id?: string;
  user_id: string;
  date?: string;
  session_date?: string;
  type?: string;
  session_type?: string;
  duration?: number;
  duration_minutes?: number;
  intensity?: string;
  intensity_level?: number;
  rpe?: number;
  notes?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TrainingStats {
  total_sessions: number;
  total_duration: number;
  avg_duration: number;
  sessions_this_week: number;
  sessions_this_month: number;
  total_load?: number;
  avg_load?: number;
  current_streak?: number;
  acwr?: number;
  acute_load?: number;
  chronic_load?: number;
  acwr_risk_zone?: string;
  weekly_volume?: number;
  weekly_duration?: number;
  weekly_sessions?: number;
  weekly_avg_intensity?: number;
}

export interface TrainingSessionsOptions {
  startDate?: string;
  endDate?: string;
  includeUpcoming?: boolean;
  status?: string;
  limit?: number;
}

@Injectable({
  providedIn: "root",
})
export class TrainingDataService {
  private supabaseService = inject(SupabaseService);
  private logger = inject(LoggerService);
  private http = inject(HttpClient);

  // Get current user ID reactively
  private userId = computed(() => this.supabaseService.userId());

  private getApiBaseUrl(): string {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      if (
        hostname.includes("netlify.app") ||
        hostname.includes("netlify.com")
      ) {
        return window.location.origin + "/.netlify/functions";
      }
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return "http://localhost:8888/.netlify/functions";
      }
    }
    return "/.netlify/functions";
  }

  /**
   * Get all training sessions for the current user
   * Uses direct Supabase queries with RLS for security
   * By default, filters to sessions up to and including today
   */
  getTrainingSessions(
    options?: TrainingSessionsOptions,
  ): Observable<TrainingSession[]> {
    const userId = this.userId();

    if (!userId) {
      this.logger.warn("Cannot fetch training sessions: No user logged in");
      return of([]);
    }

    return from(
      (async () => {
        // Query using user_id
        let query = this.supabaseService.client
          .from("training_sessions")
          .select("*")
          .eq("user_id", userId)
          .order("session_date", { ascending: false });

        // Apply filters
        if (options?.startDate) {
          query = query.gte("session_date", options.startDate);
        }

        if (options?.endDate) {
          query = query.lte("session_date", options.endDate);
        } else if (!options?.includeUpcoming) {
          // By default, exclude future sessions
          query = query.lte("session_date", new Date().toISOString());
        }

        if (options?.status) {
          query = query.eq("status", options.status);
        }

        if (options?.limit) {
          query = query.limit(options.limit);
        }

        const { data, error } = await query;

        if (error) {
          this.logger.error("Error fetching training sessions:", error);
          throw error;
        }

        return data || [];
      })(),
    ).pipe(
      catchError((error) => {
        this.logger.error("Error fetching training sessions:", error);
        return of([]);
      }),
    );
  }

  /**
   * Get training session by ID
   * Uses direct Supabase query with RLS
   */
  getTrainingSession(id: string): Observable<TrainingSession | null> {
    const userId = this.userId();

    if (!userId) {
      this.logger.warn("Cannot fetch training session: No user logged in");
      return of(null);
    }

    return from(
      this.supabaseService.client
        .from("training_sessions")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          if (error.code === "PGRST116") {
            // Not found
            return null;
          }
          this.logger.error("Error fetching training session:", error);
          throw error;
        }
        return data;
      }),
      catchError((error) => {
        this.logger.error("Error fetching training session:", error);
        return of(null);
      }),
    );
  }

  /**
   * Detect late logging and conflicts
   */
  private detectLateLoggingAndConflicts(session: {
    session_date?: string | Date;
    rpe?: number;
    session_type?: string;
  }): {
    logStatus: "on_time" | "late" | "retroactive";
    requiresApproval: boolean;
    hoursDelayed: number | null;
    conflicts: Array<{ type: string; message: string }>;
  } {
    const sessionDate = session.session_date
      ? new Date(session.session_date)
      : new Date();
    const now = new Date();
    const hoursDiff =
      (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60);

    let logStatus: "on_time" | "late" | "retroactive" = "on_time";
    let requiresApproval = false;

    if (hoursDiff > 48) {
      logStatus = "retroactive";
      requiresApproval = true;
    } else if (hoursDiff > 24) {
      logStatus = "late";
    }

    // Detect conflicts: RPE vs session type
    const conflicts: Array<{
      type: string;
      message: string;
      playerValue?: number;
      coachValue?: string;
    }> = [];
    if (session.rpe && session.session_type) {
      const sessionTypeIntensity: Record<
        string,
        { max?: number; min?: number }
      > = {
        recovery: { max: 4 },
        light: { max: 5 },
        moderate: { max: 7 },
        intense: { min: 7 },
      };

      const typeRules = sessionTypeIntensity[session.session_type];
      if (typeRules) {
        if (typeRules.max && session.rpe > typeRules.max) {
          conflicts.push({
            type: "rpe_vs_session_type",
            message: `Player logged RPE ${session.rpe} but session marked as ${session.session_type}`,
            playerValue: session.rpe,
            coachValue: session.session_type,
          });
        }
        if (typeRules.min && session.rpe < typeRules.min) {
          conflicts.push({
            type: "rpe_vs_session_type",
            message: `Player logged RPE ${session.rpe} but session marked as ${session.session_type}`,
            playerValue: session.rpe,
            coachValue: session.session_type,
          });
        }
      }
    }

    return {
      logStatus,
      requiresApproval,
      hoursDelayed: hoursDiff > 24 ? Math.floor(hoursDiff) : null,
      conflicts,
    };
  }

  /**
   * Create a new training session
   * Uses direct Supabase insert with RLS
   * Includes late logging detection and conflict detection
   */
  createTrainingSession(
    session: Omit<TrainingSession, "id" | "created_at" | "updated_at">,
  ): Observable<TrainingSession | null> {
    const userId = this.userId();

    if (!userId) {
      this.logger.error("Cannot create training session: No user logged in");
      return of(null);
    }

    // Detect late logging and conflicts
    const detection = this.detectLateLoggingAndConflicts(session);

    // Ensure user_id is set
    const sessionData = {
      ...session,
      user_id: userId,
      log_status: detection.logStatus,
      requires_coach_approval: detection.requiresApproval,
      hours_delayed: detection.hoursDelayed,
      conflicts: detection.conflicts,
    };

    return from(
      this.supabaseService.client
        .from("training_sessions")
        .insert(sessionData)
        .select()
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error("Error creating training session:", error);
          throw error;
        }
        this.logger.info("Training session created successfully:", data.id);

        // Log warning if late or retroactive
        if (detection.logStatus === "late") {
          this.logger.warn(
            `[TrainingLog] Session logged ${detection.hoursDelayed} hours late`,
          );
        } else if (detection.logStatus === "retroactive") {
          this.logger.warn(
            `[TrainingLog] Session logged retroactively (${detection.hoursDelayed} hours late) - requires coach approval`,
          );
        }

        // Log conflicts if any
        if (detection.conflicts.length > 0) {
          this.logger.warn(
            `[TrainingLog] Conflicts detected:`,
            detection.conflicts,
          );
        }

        return data;
      }),
      catchError((error) => {
        this.logger.error("Error creating training session:", error);
        throw error;
      }),
    );
  }

  /**
   * Update a training session
   * Contract: Routes through API endpoint with authorization guards
   * Violation Fix: Removed direct Supabase write (V-003)
   */
  updateTrainingSession(
    id: string,
    updates: Partial<TrainingSession>,
  ): Observable<TrainingSession | null> {
    const userId = this.userId();

    if (!userId) {
      this.logger.error("Cannot update training session: No user logged in");
      return of(null);
    }

    // Remove fields that shouldn't be updated
    const {
      id: _,
      created_at: __,
      user_id: ___,
      ...updateData
    } = updates as Partial<TrainingSession> & {
      id?: string;
      created_at?: string;
      user_id?: string;
    };

    // Route through API endpoint with authorization guards
    // Contract: Section 9.1 - No frontend direct writes
    const apiUrl = this.getApiBaseUrl();
    return this.http
      .put<{
        success: boolean;
        data: TrainingSession;
      }>(`${apiUrl}/training-sessions`, { sessionId: id, ...updateData })
      .pipe(
        map((response) => {
          // API returns { success: true, data: session } from createSuccessResponse
          const session = response.data;
          if (session) {
            this.logger.info(
              "Training session updated successfully:",
              session.id,
            );
          }
          return session || null;
        }),
        catchError((error) => {
          this.logger.error("Error updating training session:", error);
          // Return explicit error, don't swallow
          if (error.status === 403) {
            this.logger.error(
              "Authorization failed - session may be coach_locked or IN_PROGRESS",
            );
          }
          return of(null);
        }),
      );
  }

  /**
   * Delete a training session
   * Contract: Sessions should be locked, not deleted (Section 8.11)
   * Violation Fix: Removed delete operation - violates contract
   */
  deleteTrainingSession(_id: string): Observable<boolean> {
    // Contract violation: Sessions MUST be locked, not deleted
    // See AUTHORIZATION_AND_GUARDRAILS_CONTRACT_v1 Section 8.11
    this.logger.warn(
      "Session deletion not allowed per contract. Sessions must be locked, not deleted.",
    );
    return of(false);
  }

  /**
   * Get training statistics for the current user
   * Calculates stats directly from Supabase data
   */
  getTrainingStats(options?: {
    startDate?: string;
    endDate?: string;
  }): Observable<TrainingStats | null> {
    const userId = this.userId();

    if (!userId) {
      this.logger.warn("Cannot fetch training stats: No user logged in");
      return of(this.getEmptyStats());
    }

    return from(
      (async () => {
        // Get sessions for stats calculation
        let query = this.supabaseService.client
          .from("training_sessions")
          .select("*")
          .eq("user_id", userId);

        const endDate = options?.endDate || new Date().toISOString();
        query = query.lte("session_date", endDate);

        if (options?.startDate) {
          query = query.gte("session_date", options.startDate);
        }

        const { data: sessions, error } = await query;

        if (error) {
          this.logger.error("Error fetching training stats:", error);
          throw error;
        }

        if (!sessions || sessions.length === 0) {
          return this.getEmptyStats();
        }

        // Calculate statistics
        const total_sessions = sessions.length;
        const total_duration = sessions.reduce(
          (sum, s) => sum + (s.duration_minutes || 0),
          0,
        );
        const avg_duration =
          total_sessions > 0 ? total_duration / total_sessions : 0;

        // This week's sessions
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const sessions_this_week = sessions.filter(
          (s) => new Date(s.session_date) >= weekAgo,
        ).length;

        // This month's sessions
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        const sessions_this_month = sessions.filter(
          (s) => new Date(s.session_date) >= monthAgo,
        ).length;

        // Load calculations (if RPE exists)
        const sessionsWithLoad = sessions.filter(
          (s) => s.rpe && s.duration_minutes,
        );
        const total_load = sessionsWithLoad.reduce(
          (sum, s) => sum + (s.rpe || 0) * (s.duration_minutes || 0),
          0,
        );
        const avg_load =
          sessionsWithLoad.length > 0
            ? total_load / sessionsWithLoad.length
            : 0;

        // Weekly metrics
        const weeklySessions = sessions.filter(
          (s) => new Date(s.session_date) >= weekAgo,
        );
        const weekly_duration = weeklySessions.reduce(
          (sum, s) => sum + (s.duration_minutes || 0),
          0,
        );
        const weekly_sessions = weeklySessions.length;
        const weekly_avg_intensity =
          weekly_sessions > 0
            ? weeklySessions.reduce(
                (sum, s) => sum + (s.intensity_level || 0),
                0,
              ) / weekly_sessions
            : 0;

        // Try to get ACWR data from load_monitoring table
        const { data: loadData } = await this.supabaseService.client
          .from("load_monitoring")
          .select("acwr, acute_load, chronic_load, injury_risk_level")
          .eq("player_id", userId)
          .order("date", { ascending: false })
          .limit(1)
          .single();

        // Calculate current streak (consecutive days with sessions)
        const current_streak = this.calculateCurrentStreak(sessions);

        return {
          total_sessions,
          total_duration,
          avg_duration: Math.round(avg_duration),
          sessions_this_week,
          sessions_this_month,
          total_load: Math.round(total_load),
          avg_load: Math.round(avg_load),
          current_streak,
          acwr: loadData?.acwr || undefined,
          acute_load: loadData?.acute_load || undefined,
          chronic_load: loadData?.chronic_load || undefined,
          acwr_risk_zone: loadData?.injury_risk_level || undefined,
          weekly_volume: total_load, // Could be more specific
          weekly_duration,
          weekly_sessions,
          weekly_avg_intensity,
        };
      })(),
    ).pipe(
      catchError((error) => {
        this.logger.error("Error calculating training stats:", error);
        return of(this.getEmptyStats());
      }),
    );
  }

  /**
   * Calculate current training streak (consecutive days with sessions)
   * @param sessions - Array of training sessions sorted by date
   * @returns Number of consecutive days with at least one session
   */
  private calculateCurrentStreak(
    sessions: Array<{ session_date: string }>,
  ): number {
    if (!sessions || sessions.length === 0) {
      return 0;
    }

    // Sort sessions by date descending (most recent first)
    const sortedSessions = [...sessions].sort(
      (a, b) =>
        new Date(b.session_date).getTime() - new Date(a.session_date).getTime(),
    );

    // Get unique dates (in case multiple sessions per day)
    const uniqueDates = [
      ...new Set(
        sortedSessions.map(
          (s) => new Date(s.session_date).toISOString().split("T")[0],
        ),
      ),
    ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (uniqueDates.length === 0) {
      return 0;
    }

    // Check if there's a session today or yesterday (allow 1 day grace)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const mostRecentDate = new Date(uniqueDates[0]);
    mostRecentDate.setHours(0, 0, 0, 0);

    // If most recent session is more than 1 day old, streak is broken
    if (mostRecentDate < yesterday) {
      return 0;
    }

    // Count consecutive days
    let streak = 0;
    let expectedDate = new Date(uniqueDates[0]);

    for (const dateStr of uniqueDates) {
      const currentDate = new Date(dateStr);
      currentDate.setHours(0, 0, 0, 0);

      // Check if this date matches expected date
      if (currentDate.getTime() === expectedDate.getTime()) {
        streak++;
        // Move expected date back one day
        expectedDate = new Date(currentDate);
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        // Streak broken
        break;
      }
    }

    return streak;
  }

  /**
   * Helper to return empty stats object
   */
  private getEmptyStats(): TrainingStats {
    return {
      total_sessions: 0,
      total_duration: 0,
      avg_duration: 0,
      sessions_this_week: 0,
      sessions_this_month: 0,
    };
  }
}
