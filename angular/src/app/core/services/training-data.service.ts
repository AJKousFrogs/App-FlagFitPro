import { Injectable, inject } from "@angular/core";
import { Observable, from } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { ApiService, API_ENDPOINTS } from "./api.service";

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
  private apiService = inject(ApiService);

  /**
   * Get all training sessions for the current user
   * Always uses backend API - never direct Supabase queries
   * By default, filters to sessions up to and including today
   */
  getTrainingSessions(options?: TrainingSessionsOptions): Observable<TrainingSession[]> {
    const params: Record<string, any> = {};
    
    if (options?.startDate) {
      params['startDate'] = options.startDate;
    }
    
    if (options?.endDate) {
      params['endDate'] = options.endDate;
    }
    
    if (options?.includeUpcoming) {
      params['includeUpcoming'] = options.includeUpcoming.toString();
    }
    
    if (options?.status) {
      params['status'] = options.status;
    }
    
    if (options?.limit) {
      params['limit'] = options.limit.toString();
    }

    return this.apiService.get<TrainingSession[]>(
      API_ENDPOINTS.training.sessions,
      params
    ).pipe(
      map((response) => {
        if (response.error) {
          console.error("Error fetching training sessions:", response.error);
          return [];
        }
        return response.data || [];
      }),
      catchError((error) => {
        console.error("Error fetching training sessions:", error);
        return from(Promise.resolve([]));
      })
    );
  }

  /**
   * Get training session by ID
   * Note: This may need a separate endpoint or can be filtered from getTrainingSessions
   */
  getTrainingSession(id: string): Observable<TrainingSession | null> {
    return this.getTrainingSessions({ limit: 1000 }).pipe(
      map((sessions) => {
        const session = sessions.find((s) => s.id === id);
        return session || null;
      })
    );
  }

  /**
   * Create a new training session
   * Uses backend API endpoint
   */
  createTrainingSession(
    session: Omit<TrainingSession, "id" | "created_at" | "updated_at">
  ): Observable<TrainingSession | null> {
    return this.apiService.post<TrainingSession>(
      API_ENDPOINTS.training.createSession,
      session
    ).pipe(
      map((response) => {
        if (response.error) {
          console.error("Error creating training session:", response.error);
          throw new Error(response.error);
        }
        return response.data || null;
      }),
      catchError((error) => {
        console.error("Error creating training session:", error);
        throw error;
      })
    );
  }

  /**
   * Update a training session
   * Note: May need a PUT endpoint - for now returns error
   */
  updateTrainingSession(
    id: string,
    updates: Partial<TrainingSession>
  ): Observable<TrainingSession | null> {
    console.warn("Update training session not yet implemented via API");
    return from(Promise.resolve(null));
  }

  /**
   * Delete a training session
   * Note: May need a DELETE endpoint - for now returns false
   */
  deleteTrainingSession(id: string): Observable<boolean> {
    console.warn("Delete training session not yet implemented via API");
    return from(Promise.resolve(false));
  }

  /**
   * Get training statistics for the current user
   * Uses centralized backend endpoint for consistent calculations
   */
  getTrainingStats(options?: { startDate?: string; endDate?: string }): Observable<TrainingStats | null> {
    const params: Record<string, any> = {};
    
    if (options?.startDate) {
      params['startDate'] = options.startDate;
    }
    
    if (options?.endDate) {
      params['endDate'] = options.endDate;
    }

    return this.apiService.get<TrainingStats>(
      "/training-stats-enhanced",
      params
    ).pipe(
      map((response) => {
        if (response.error) {
          console.error("Error fetching training stats:", response.error);
          return {
            total_sessions: 0,
            total_duration: 0,
            avg_duration: 0,
            sessions_this_week: 0,
            sessions_this_month: 0,
          };
        }
        
        const stats = response.data;
        if (!stats) {
          return {
            total_sessions: 0,
            total_duration: 0,
            avg_duration: 0,
            sessions_this_week: 0,
            sessions_this_month: 0,
          };
        }

        // Map backend response to TrainingStats interface
        return {
          total_sessions: stats.total_sessions || 0,
          total_duration: stats.total_duration || 0,
          avg_duration: stats.avg_duration || 0,
          sessions_this_week: stats.weekly_sessions || 0,
          sessions_this_month: 0, // Can be calculated if needed
          total_load: stats.total_load,
          avg_load: stats.avg_load,
          current_streak: stats.current_streak,
          acwr: stats.acwr,
          acute_load: stats.acute_load,
          chronic_load: stats.chronic_load,
          acwr_risk_zone: stats.acwr_risk_zone,
          weekly_volume: stats.weekly_volume,
          weekly_duration: stats.weekly_duration,
          weekly_sessions: stats.weekly_sessions,
          weekly_avg_intensity: stats.weekly_avg_intensity,
        };
      }),
      catchError((error) => {
        console.error("Error fetching training stats:", error);
        return from(Promise.resolve({
          total_sessions: 0,
          total_duration: 0,
          avg_duration: 0,
          sessions_this_week: 0,
          sessions_this_month: 0,
        }));
      })
    );
  }
}
