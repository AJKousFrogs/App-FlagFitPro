import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../../core/services/supabase.service";

@Injectable({
  providedIn: "root",
})
export class TrainingSessionDetailDataService {
  private readonly supabaseService = inject(SupabaseService);

  async getActualSession(sessionId: string, userId: string): Promise<{
    session: Record<string, unknown> | null;
    error: { message?: string } | null;
  }> {
    const { data: session, error } = await this.supabaseService.client
      .from("training_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    return { session: (session as Record<string, unknown>) ?? null, error };
  }

  async getTemplateSession(sessionId: string): Promise<{
    template: Record<string, unknown> | null;
    error: { message?: string } | null;
  }> {
    const { data: template, error } = await this.supabaseService.client
      .from("training_session_templates")
      .select(
        `
          *,
          training_weeks!inner (
            id,
            week_number,
            start_date,
            end_date
          )
        `,
      )
      .eq("id", sessionId)
      .single();

    return { template: (template as Record<string, unknown>) ?? null, error };
  }

  async createSessionFromTemplate(input: {
    userId: string;
    sessionDate: string;
    sessionType: string;
    durationMinutes: number;
  }): Promise<{
    id: string | null;
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

    return { id: (data as { id?: string } | null)?.id ?? null, error };
  }
}
