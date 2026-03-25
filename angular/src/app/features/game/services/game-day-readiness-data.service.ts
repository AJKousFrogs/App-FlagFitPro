import { Injectable, inject } from "@angular/core";
import { LoggerService } from "../../../core/services/logger.service";
import { SupabaseService } from "../../../core/services/supabase.service";

@Injectable({
  providedIn: "root",
})
export class GameDayReadinessDataService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly logger = inject(LoggerService);
  private readonly directCoachNotificationWritesSupported = false;

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
    if (!this.directCoachNotificationWritesSupported) {
      this.logger.debug(
        "[GameDayReadiness] Skipping direct browser coach notification write; backend-managed notification flow required",
      );
      return { error: null };
    }

    const { error } = await this.supabaseService.client
      .from("notifications")
      .insert({
        user_id: input.userId,
        notification_type: "readiness_alert",
        title: "⚠️ Low Game Day Readiness",
        message: input.message,
        data: input.data,
        is_read: false,
      });

    return { error };
  }
}
