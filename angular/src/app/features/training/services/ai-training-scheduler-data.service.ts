import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../../core/services/supabase.service";

@Injectable({
  providedIn: "root",
})
export class AiTrainingSchedulerDataService {
  private readonly supabaseService = inject(SupabaseService);

  async getLatestReadiness(userId: string): Promise<{
    readiness: { score?: number | null } | null;
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client
      .from("readiness_scores")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(1)
      .single();

    return { readiness: (data as { score?: number }) ?? null, error };
  }

  async getLatestAcwr(userId: string): Promise<{
    acwr: { acwr_ratio?: number | null } | null;
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client
      .from("acwr_calculations")
      .select("acwr_ratio")
      .eq("user_id", userId)
      .order("calculated_at", { ascending: false })
      .limit(1)
      .single();

    return { acwr: (data as { acwr_ratio?: number }) ?? null, error };
  }

  async getSuggestions(userId: string): Promise<{
    suggestions: Array<{
      id: string;
      suggestion_type: string;
      priority?: string | null;
      message: string;
      reason?: string | null;
      created_at: string;
      accepted?: boolean | null;
      dismissed?: boolean | null;
      affected_session_id?: string | null;
      suggested_changes?: unknown;
    }>;
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client
      .from("ai_training_suggestions")
      .select("*")
      .eq("user_id", userId)
      .eq("dismissed", false)
      .order("created_at", { ascending: false })
      .limit(10);

    return { suggestions: (data as typeof data) ?? [], error };
  }

  async getScheduledSessions(input: {
    userId: string;
    startDate: string;
    endDate: string;
  }): Promise<{
    sessions: Array<{
      id: string;
      scheduled_date?: string | null;
      session_type?: string | null;
      duration_minutes?: number | null;
      intensity?: string | null;
      status?: string | null;
      ai_optimized?: boolean | null;
    }>;
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client
      .from("training_sessions")
      .select("*")
      .eq("user_id", input.userId)
      .gte("scheduled_date", input.startDate)
      .lte("scheduled_date", input.endDate)
      .order("scheduled_date", { ascending: true });

    return { sessions: (data as typeof data) ?? [], error };
  }

  async upsertSuggestion(input: {
    id: string;
    userId: string;
    suggestionType: string;
    priority?: string;
    message: string;
    reason?: string;
    accepted?: boolean;
    dismissed?: boolean;
    appliedAt?: string;
    dismissedAt?: string;
  }): Promise<{ error: { message?: string } | null }> {
    const { error } = await this.supabaseService.client
      .from("ai_training_suggestions")
      .upsert({
        id: input.id,
        user_id: input.userId,
        suggestion_type: input.suggestionType,
        priority: input.priority,
        message: input.message,
        reason: input.reason,
        accepted: input.accepted,
        dismissed: input.dismissed,
        applied_at: input.appliedAt,
        dismissed_at: input.dismissedAt,
      });

    return { error };
  }
}
