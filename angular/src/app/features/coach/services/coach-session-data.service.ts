import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../../core/services/supabase.service";

@Injectable({
  providedIn: "root",
})
export class CoachSessionDataService {
  private readonly supabaseService = inject(SupabaseService);

  getCurrentUser() {
    return this.supabaseService.getCurrentUser();
  }

  async createTrainingSession(input: {
    coachId: string;
    title: string;
    sessionType: string;
    scheduledAt: string;
    durationMinutes: number;
    location: string;
    notes: string;
  }): Promise<{ error: { message?: string } | null }> {
    const { error } = await this.supabaseService.client
      .from("training_sessions")
      .insert({
        coach_id: input.coachId,
        title: input.title,
        session_type: input.sessionType,
        scheduled_at: input.scheduledAt,
        duration_minutes: input.durationMinutes,
        location: input.location,
        notes: input.notes,
        status: "scheduled",
        created_at: new Date().toISOString(),
      });

    return { error };
  }
}
