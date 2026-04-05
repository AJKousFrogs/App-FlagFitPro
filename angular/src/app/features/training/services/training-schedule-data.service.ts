import { Injectable, inject } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { ApiService } from "../../../core/services/api.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { extractApiPayload } from "../../../core/utils/api-response-mapper";

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
  week_id?: string | null;
  session_name?: string | null;
  session_type?: string | null;
  day_of_week?: number | null;
  session_order?: number | null;
  duration_minutes?: number | null;
  intensity_level?: string | null;
  description?: string | null;
  is_team_practice?: boolean | null;
  is_outdoor?: boolean | null;
  weather_sensitive?: boolean | null;
  training_weeks?: TrainingWeekRow | TrainingWeekRow[] | null;
}

export interface TrainingWeekRow {
  id: string;
  week_number?: number | null;
  start_date: string;
  end_date: string;
}

interface PlayerProgramAssignmentResponse {
  assignment?: {
    program_id?: string | null;
  } | null;
}

interface TrainingProgramWeekResponse extends TrainingWeekRow {
  sessions?: TrainingTemplateRow[] | null;
}

interface TrainingProgramPhaseResponse {
  weeks?: TrainingProgramWeekResponse[] | null;
}

interface TrainingProgramDetails {
  training_phases?: TrainingProgramPhaseResponse[] | null;
}

interface TrainingProgramDetailsResponse {
  data?: TrainingProgramDetails | null;
}

@Injectable({
  providedIn: "root",
})
export class TrainingScheduleDataService {
  private readonly api = inject(ApiService);
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

  async fetchPracticeDays(userId: string): Promise<{
    practiceDays: string[];
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client
      .from("user_preferences")
      .select("practice_days")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return { practiceDays: [], error };
    }

    const raw = data?.practice_days;
    const practiceDays = Array.isArray(raw)
      ? raw.filter((d): d is string => typeof d === "string")
      : [];

    return { practiceDays, error: null };
  }

  async fetchScheduledTemplates(input: {
    userId: string;
    startDate: string;
    endDate: string;
  }): Promise<{
    templates: TrainingTemplateRow[];
    error: { message?: string } | null;
  }> {
    let activeProgramId: string | null = null;

    try {
      const response = await firstValueFrom(
        this.api.get<PlayerProgramAssignmentResponse>("/api/player-programs/me"),
      );
      activeProgramId =
        extractApiPayload<PlayerProgramAssignmentResponse>(response)?.assignment
          ?.program_id ?? null;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load active training assignment";
      return { templates: [], error: { message } };
    }

    if (!activeProgramId) {
      return { templates: [], error: null };
    }

    try {
      const response = await firstValueFrom(
        this.api.get<TrainingProgramDetailsResponse>("/api/training-programs", {
          id: activeProgramId,
          full: true,
        }),
      );

      const program =
        extractApiPayload<TrainingProgramDetailsResponse>(response)?.data;
      const mappedTemplates =
        program?.training_phases
          ?.flatMap((phase) => phase.weeks ?? [])
          .filter(
            (week) =>
              week.start_date <= input.endDate && week.end_date >= input.startDate,
          )
          .flatMap((week) =>
            (week.sessions ?? []).map((session) => ({
              ...session,
              training_weeks: week,
            })),
          )
          .sort((a, b) => {
            const aWeek = Array.isArray(a.training_weeks)
              ? a.training_weeks[0]
              : a.training_weeks;
            const bWeek = Array.isArray(b.training_weeks)
              ? b.training_weeks[0]
              : b.training_weeks;
            const startDateCompare = (aWeek?.start_date || "").localeCompare(
              bWeek?.start_date || "",
            );

            if (startDateCompare !== 0) {
              return startDateCompare;
            }

            const dayCompare = (a.day_of_week ?? 0) - (b.day_of_week ?? 0);
            if (dayCompare !== 0) {
              return dayCompare;
            }

            return (a.session_order ?? 0) - (b.session_order ?? 0);
          }) ?? [];

      return { templates: mappedTemplates, error: null };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load scheduled training templates";
      return { templates: [], error: { message } };
    }
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
