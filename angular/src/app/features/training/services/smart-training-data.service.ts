import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../../core/services/supabase.service";

export interface RecentSessionRecord {
  created_at: string;
  rpe?: number | null;
  session_type?: string | null;
}

export interface TeamEventRecord {
  event_date: string;
  title?: string | null;
  event_type?: string | null;
}

@Injectable({
  providedIn: "root",
})
export class SmartTrainingDataService {
  private readonly supabaseService = inject(SupabaseService);

  async fetchRecentSessions(userId: string): Promise<{
    sessions: RecentSessionRecord[];
    error: { message?: string } | null;
  }> {
    const { data: sessions, error } = await this.supabaseService.client
      .from("training_sessions")
      .select("created_at, rpe, session_type")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    return { sessions: sessions ?? [], error };
  }

  async fetchUpcomingTeamEvents(startDate: string): Promise<{
    events: TeamEventRecord[];
    error: { message?: string } | null;
  }> {
    const { data: events, error } = await this.supabaseService.client
      .from("team_events")
      .select("event_date, title, event_type")
      .gte("event_date", startDate)
      .order("event_date", { ascending: true })
      .limit(5);

    return { events: events ?? [], error };
  }

  async createTrainingSession(input: {
    athleteId: string;
    userId: string;
    sessionType: string;
    durationMinutes: number;
    intensity: string;
    isOutdoor: boolean;
    scheduledDate: string;
    notes: string;
  }): Promise<{ error: { message?: string } | null }> {
    const { error } = await this.supabaseService.client
      .from("training_sessions")
      .insert({
        athlete_id: input.athleteId,
        user_id: input.userId,
        session_type: input.sessionType,
        duration_minutes: input.durationMinutes,
        intensity: input.intensity,
        is_outdoor: input.isOutdoor,
        scheduled_date: input.scheduledDate,
        status: "scheduled",
        notes: input.notes,
      })
      .select()
      .single();

    return { error };
  }
}
