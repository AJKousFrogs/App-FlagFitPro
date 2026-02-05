import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../../core/services/supabase.service";

@Injectable({
  providedIn: "root",
})
export class TrainingSafetyDataService {
  private readonly supabaseService = inject(SupabaseService);

  async getUserProfileDob(userId: string): Promise<{
    dateOfBirth: string | null;
    error: { message?: string } | null;
  }> {
    const { data: profile, error } = await this.supabaseService.client
      .from("users")
      .select("date_of_birth")
      .eq("id", userId)
      .single();

    return { dateOfBirth: profile?.date_of_birth ?? null, error };
  }

  async getWellnessEntries(input: {
    userId: string;
    sinceDate: string;
  }): Promise<{
    entries: { sleep_quality?: number }[];
    error: { message?: string } | null;
  }> {
    const { data: wellnessEntries, error } = await this.supabaseService.client
      .from("daily_wellness_checkin")
      .select("sleep_quality, checkin_date")
      .eq("user_id", input.userId)
      .gte("checkin_date", input.sinceDate)
      .order("checkin_date", { ascending: false });

    return { entries: (wellnessEntries as { sleep_quality?: number }[]) ?? [], error };
  }

  async getWorkoutLogsSince(input: {
    userId: string;
    sinceDate: string;
  }): Promise<{
    logs: { notes?: string; duration_minutes?: number; completed_at?: string; rpe?: number }[];
    error: { message?: string } | null;
  }> {
    const { data: workoutLogs, error } = await this.supabaseService.client
      .from("workout_logs")
      .select("notes, duration_minutes, rpe, completed_at")
      .eq("player_id", input.userId)
      .gte("completed_at", input.sinceDate);

    return {
      logs:
        (workoutLogs as {
          notes?: string;
          duration_minutes?: number;
          completed_at?: string;
          rpe?: number;
        }[]) ?? [],
      error,
    };
  }

  async getWorkoutLogsBetween(input: {
    userId: string;
    startDate: string;
    endDate: string;
  }): Promise<{
    logs: { rpe?: number; duration_minutes?: number; completed_at?: string }[];
    error: { message?: string } | null;
  }> {
    const { data: logs, error } = await this.supabaseService.client
      .from("workout_logs")
      .select("completed_at, rpe, duration_minutes")
      .eq("player_id", input.userId)
      .gte("completed_at", input.startDate)
      .lt("completed_at", input.endDate);

    return {
      logs:
        (logs as {
          rpe?: number;
          duration_minutes?: number;
          completed_at?: string;
        }[]) ?? [],
      error,
    };
  }

  async getActiveRtpProtocol(userId: string): Promise<{
    protocol: {
      injury_type?: string | null;
      injury_date?: string | null;
    } | null;
    error: { message?: string } | null;
  }> {
    const { data: rtpProtocol, error } = await this.supabaseService.client
      .from("injury_tracking")
      .select("*")
      .eq("player_id", userId)
      .eq("status", "in_recovery")
      .order("injury_date", { ascending: false })
      .limit(1)
      .single();

    return { protocol: (rtpProtocol as { injury_type?: string; injury_date?: string }) ?? null, error };
  }
}
