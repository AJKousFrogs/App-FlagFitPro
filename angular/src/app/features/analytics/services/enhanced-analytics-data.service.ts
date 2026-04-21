import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../../core/services/supabase.service";

export interface TrainingSessionRow {
  session_date: string;
  status: string;
  duration_minutes?: number | null;
  intensity_level?: number | null;
}

@Injectable({
  providedIn: "root",
})
export class EnhancedAnalyticsDataService {
  private readonly supabaseService = inject(SupabaseService);

  async getRecentTrainingSessions(
    userId: string,
    weeks = 7,
  ): Promise<{
    sessions: TrainingSessionRow[] | null;
    error: unknown | null;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    const { data: sessions, error } = await this.supabaseService.client
      .from("training_sessions")
      .select("session_date, status, duration_minutes, intensity_level")
      .eq("user_id", userId)
      .gte("session_date", startDate.toISOString().split("T")[0])
      .order("session_date", { ascending: true });

    return { sessions, error };
  }
}
