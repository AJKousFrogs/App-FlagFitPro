import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../../core/services/supabase.service";

export interface WorkoutLogRecord {
  id: string;
  completed_at: string;
  duration_minutes?: number | null;
  notes?: string | null;
  training_sessions?: {
    name?: string | null;
    exercises?: unknown;
  } | Array<{
    name?: string | null;
    exercises?: unknown;
  }> | null;
}

@Injectable({
  providedIn: "root",
})
export class WorkoutDataService {
  private readonly supabaseService = inject(SupabaseService);

  async fetchWorkoutLogs(userId: string): Promise<{
    workoutLogs: WorkoutLogRecord[];
    error: { message?: string } | null;
  }> {
    const { data: workoutLogs, error } = await this.supabaseService.client
      .from("workout_logs")
      .select(
        `
          id,
          session_id,
          completed_at,
          rpe,
          duration_minutes,
          notes,
          training_sessions (
            id,
            name,
            session_type,
            exercises
          )
        `,
      )
      .eq("player_id", userId)
      .order("completed_at", { ascending: false })
      .limit(20);

    return { workoutLogs: workoutLogs ?? [], error };
  }

  async createWorkoutLog(input: {
    playerId: string;
    durationMinutes: number;
    rpe: number;
    notes: string;
  }): Promise<{ error: { message?: string } | null }> {
    const { error } = await this.supabaseService.client
      .from("workout_logs")
      .insert({
        player_id: input.playerId,
        completed_at: new Date().toISOString(),
        duration_minutes: input.durationMinutes,
        rpe: input.rpe,
        notes: input.notes,
      });

    return { error };
  }
}
