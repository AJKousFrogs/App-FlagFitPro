import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../../core/services/supabase.service";

@Injectable({
  providedIn: "root",
})
export class GameDayReadinessDataService {
  private readonly supabaseService = inject(SupabaseService);

  async submitReadinessEntry(
    readinessData: Record<string, unknown>,
  ): Promise<{ error: { message?: string } | null }> {
    const { error } = await this.supabaseService.client
      .from("game_day_readiness")
      .insert(readinessData);

    return { error };
  }

  async notifyCoach(input: {
    userId: string;
    message: string;
    data: Record<string, unknown>;
  }): Promise<{ error: { message?: string } | null }> {
    const { error } = await this.supabaseService.client
      .from("notifications")
      .insert({
        user_id: input.userId,
        type: "readiness_alert",
        title: "⚠️ Low Game Day Readiness",
        message: input.message,
        data: input.data,
        read: false,
      });

    return { error };
  }
}
