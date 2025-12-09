import { Injectable, inject } from "@angular/core";
import { Observable, from } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { SupabaseService } from "./supabase.service";

export interface TrainingSession {
  id?: string;
  user_id: string;
  date: string;
  type: string;
  duration: number;
  intensity?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TrainingStats {
  total_sessions: number;
  total_duration: number;
  avg_duration: number;
  sessions_this_week: number;
  sessions_this_month: number;
}

@Injectable({
  providedIn: "root",
})
export class TrainingDataService {
  private supabase = inject(SupabaseService);

  /**
   * Get all training sessions for the current user
   */
  getTrainingSessions(): Observable<TrainingSession[]> {
    const userId = this.supabase.currentUser?.id;
    if (!userId) {
      return from(Promise.resolve([]));
    }

    return from(
      this.supabase.client
        .from("training_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false })
    ).pipe(
      map((response) => {
        if (response.error) {
          console.error("Error fetching training sessions:", response.error);
          return [];
        }
        return response.data as TrainingSession[];
      })
    );
  }

  /**
   * Get training session by ID
   */
  getTrainingSession(id: string): Observable<TrainingSession | null> {
    return from(
      this.supabase.client
        .from("training_sessions")
        .select("*")
        .eq("id", id)
        .single()
    ).pipe(
      map((response) => {
        if (response.error) {
          console.error("Error fetching training session:", response.error);
          return null;
        }
        return response.data as TrainingSession;
      })
    );
  }

  /**
   * Create a new training session
   */
  createTrainingSession(
    session: Omit<TrainingSession, "id" | "created_at" | "updated_at">
  ): Observable<TrainingSession | null> {
    return from(
      this.supabase.client
        .from("training_sessions")
        .insert([session])
        .select()
        .single()
    ).pipe(
      map((response) => {
        if (response.error) {
          console.error("Error creating training session:", response.error);
          throw response.error;
        }
        return response.data as TrainingSession;
      })
    );
  }

  /**
   * Update a training session
   */
  updateTrainingSession(
    id: string,
    updates: Partial<TrainingSession>
  ): Observable<TrainingSession | null> {
    return from(
      this.supabase.client
        .from("training_sessions")
        .update(updates)
        .eq("id", id)
        .select()
        .single()
    ).pipe(
      map((response) => {
        if (response.error) {
          console.error("Error updating training session:", response.error);
          throw response.error;
        }
        return response.data as TrainingSession;
      })
    );
  }

  /**
   * Delete a training session
   */
  deleteTrainingSession(id: string): Observable<boolean> {
    return from(
      this.supabase.client.from("training_sessions").delete().eq("id", id)
    ).pipe(
      map((response) => {
        if (response.error) {
          console.error("Error deleting training session:", response.error);
          return false;
        }
        return true;
      })
    );
  }

  /**
   * Get training statistics for the current user
   */
  getTrainingStats(): Observable<TrainingStats | null> {
    const userId = this.supabase.currentUser?.id;
    if (!userId) {
      return from(Promise.resolve(null));
    }

    return from(
      this.supabase.client.rpc("get_training_stats", { user_id: userId })
    ).pipe(
      map((response) => {
        if (response.error) {
          console.error("Error fetching training stats:", response.error);
          // Return default stats if RPC function doesn't exist
          return {
            total_sessions: 0,
            total_duration: 0,
            avg_duration: 0,
            sessions_this_week: 0,
            sessions_this_month: 0,
          };
        }
        return response.data as TrainingStats;
      })
    );
  }

  /**
   * Subscribe to real-time updates for training sessions
   */
  subscribeToTrainingSessions(
    callback: (payload: any) => void
  ): () => void {
    const userId = this.supabase.currentUser?.id;
    if (!userId) {
      return () => {};
    }

    const channel = this.supabase.client
      .channel("training_sessions_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "training_sessions",
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      this.supabase.client.removeChannel(channel);
    };
  }
}
