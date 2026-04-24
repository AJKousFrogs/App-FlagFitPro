import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../../core/services/supabase.service";
import { isBenignSupabaseQueryError } from "../../../shared/utils/error.utils";

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
  private teamEventsUnavailable = false;

  private mapIntensityToLevel(intensity: string): number {
    switch (`${intensity || ""}`.toLowerCase()) {
      case "low":
        return 3;
      case "moderate":
      case "medium":
        return 5;
      case "high":
        return 8;
      case "very_high":
        return 9;
      default:
        return 5;
    }
  }

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
    if (this.teamEventsUnavailable) {
      return { events: [], error: null };
    }

    const { data: events, error } = await this.supabaseService.client
      .from("team_events")
      .select("start_time, title, event_type")
      .gte("start_time", `${startDate}T00:00:00`)
      .order("start_time", { ascending: true })
      .limit(5);

    if (error && isBenignSupabaseQueryError(error)) {
      this.teamEventsUnavailable = true;
      return { events: [], error: null };
    }

    const mappedEvents = (events ?? []).map((event) => ({
      event_date:
        typeof event.start_time === "string"
          ? event.start_time
          : `${startDate}T00:00:00`,
      title: event.title ?? null,
      event_type: event.event_type ?? null,
    }));

    return { events: mappedEvents, error };
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
        intensity_level: this.mapIntensityToLevel(input.intensity),
        session_date: input.scheduledDate,
        status: "scheduled",
        notes: input.notes,
      })
      .select()
      .single();

    return { error };
  }
}
