import { Injectable, inject, computed } from "@angular/core";
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
  
  // Get current user ID reactively
  private userId = computed(() => this.supabaseService.userId());

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
   * Create a new training session
   * Uses direct Supabase insert with RLS
   */
  createTrainingSession(
    session: Omit<TrainingSession, "id" | "created_at" | "updated_at">,
  ): Observable<TrainingSession | null> {
    const userId = this.userId();
    
    if (!userId) {
      this.logger.error("Cannot create training session: No user logged in");
      return of(null);
    }

    // Ensure user_id is set
    const sessionData = { ...session, user_id: userId };

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
   * Uses direct Supabase update with RLS
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
    const { id: _, created_at: __, user_id: ___, ...updateData } = updates as any;

    return from(
      this.supabaseService.client
        .from("training_sessions")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", userId) // RLS ensures user can only update their own sessions
        .select()
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error("Error updating training session:", error);
          throw error;
        }
        this.logger.info("Training session updated successfully:", data.id);
        return data;
      }),
      catchError((error) => {
        this.logger.error("Error updating training session:", error);
        return of(null);
      }),
    );
  }

  /**
   * Delete a training session
   * Uses direct Supabase delete with RLS
   */
  deleteTrainingSession(id: string): Observable<boolean> {
    const userId = this.userId();
    
    if (!userId) {
      this.logger.error("Cannot delete training session: No user logged in");
      return of(false);
    }

    return from(
      this.supabaseService.client
        .from("training_sessions")
        .delete()
        .eq("id", id)
        .eq("user_id", userId), // RLS ensures user can only delete their own sessions
    ).pipe(
      map(({ error }) => {
        if (error) {
          this.logger.error("Error deleting training session:", error);
          return false;
        }
        this.logger.info("Training session deleted successfully:", id);
        return true;
      }),
      catchError((error) => {
        this.logger.error("Error deleting training session:", error);
        return of(false);
      }),
    );
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
            ? weeklySessions.reduce((sum, s) => sum + (s.intensity_level || 0), 0) /
              weekly_sessions
            : 0;

        // Try to get ACWR data from load_monitoring table
        const { data: loadData } = await this.supabaseService.client
          .from("load_monitoring")
          .select("acwr, acute_load, chronic_load, injury_risk_level")
          .eq("player_id", userId)
          .order("date", { ascending: false })
          .limit(1)
          .single();

        return {
          total_sessions,
          total_duration,
          avg_duration: Math.round(avg_duration),
          sessions_this_week,
          sessions_this_month,
          total_load: Math.round(total_load),
          avg_load: Math.round(avg_load),
          current_streak: 0, // TODO: Calculate streak
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
