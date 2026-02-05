import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../../core/services/supabase.service";

export interface TrainingSessionRow {
  id: string;
  session_date: string;
  session_type?: string | null;
  duration_minutes?: number | null;
  status?: string | null;
  notes?: string | null;
}

export interface TrainingTemplateRow {
  id: string;
  session_name?: string | null;
  session_type?: string | null;
  day_of_week?: number | null;
  duration_minutes?: number | null;
  intensity_level?: string | null;
  description?: string | null;
  is_team_practice?: boolean | null;
  is_outdoor?: boolean | null;
  weather_sensitive?: boolean | null;
  training_weeks?: unknown;
}

@Injectable({
  providedIn: "root",
})
export class TrainingScheduleDataService {
  private readonly supabaseService = inject(SupabaseService);

  async fetchActualSessions(input: {
    userId: string;
    startDate: string;
    endDate: string;
  }): Promise<{
    sessions: TrainingSessionRow[];
    error: { message?: string } | null;
  }> {
    const { data: sessions, error } = await this.supabaseService.client
      .from("training_sessions")
      .select(
        `
          id,
          session_date,
          session_type,
          duration_minutes,
          status,
          notes
        `,
      )
      .eq("user_id", input.userId)
      .gte("session_date", input.startDate)
      .lte("session_date", input.endDate)
      .order("session_date", { ascending: true });

    return { sessions: (sessions as TrainingSessionRow[]) ?? [], error };
  }

  async fetchScheduledTemplates(input: {
    startDate: string;
    endDate: string;
  }): Promise<{
    templates: TrainingTemplateRow[];
    error: { message?: string } | null;
  }> {
    const { data: templates, error } = await this.supabaseService.client
      .from("training_session_templates")
      .select(
        `
          id,
          session_name,
          session_type,
          day_of_week,
          duration_minutes,
          intensity_level,
          description,
          is_team_practice,
          is_outdoor,
          weather_sensitive,
          training_weeks!inner (
            id,
            week_number,
            start_date,
            end_date
          )
        `,
      )
      .lte("training_weeks.start_date", input.endDate)
      .gte("training_weeks.end_date", input.startDate);

    return { templates: (templates as TrainingTemplateRow[]) ?? [], error };
  }

  async markSessionComplete(sessionId: string): Promise<{
    error: { message?: string } | null;
  }> {
    const { error } = await this.supabaseService.client
      .from("training_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    return { error };
  }

  async startTemplateSession(input: {
    userId: string;
    sessionDate: string;
    sessionType: string;
    durationMinutes: number;
  }): Promise<{
    sessionId: string | null;
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client
      .from("training_sessions")
      .insert({
        athlete_id: input.userId,
        user_id: input.userId,
        session_date: input.sessionDate,
        session_type: input.sessionType,
        duration_minutes: input.durationMinutes,
        status: "in_progress",
      })
      .select("id")
      .single();

    return { sessionId: data?.id ?? null, error };
  }

  async fetchDateMarkers(input: {
    userId: string;
    startDate: string;
    endDate: string;
  }): Promise<{
    sessions: { session_date: string; session_type?: string | null; status?: string | null }[];
    error: { message?: string } | null;
  }> {
    const { data: sessions, error } = await this.supabaseService.client
      .from("training_sessions")
      .select("session_date, session_type, status")
      .eq("user_id", input.userId)
      .gte("session_date", input.startDate)
      .lte("session_date", input.endDate);

    return {
      sessions:
        (sessions as {
          session_date: string;
          session_type?: string | null;
          status?: string | null;
        }[]) ?? [],
      error,
    };
  }

  async fetchMonthlyStats(input: {
    userId: string;
    startDate: string;
    endDate: string;
  }): Promise<{
    sessions: { status?: string | null; duration_minutes?: number | null }[];
    error: { message?: string } | null;
  }> {
    const { data: sessions, error } = await this.supabaseService.client
      .from("training_sessions")
      .select("status, duration_minutes")
      .eq("user_id", input.userId)
      .gte("session_date", input.startDate)
      .lte("session_date", input.endDate);

    return {
      sessions:
        (sessions as { status?: string | null; duration_minutes?: number | null }[]) ??
        [],
      error,
    };
  }
}
