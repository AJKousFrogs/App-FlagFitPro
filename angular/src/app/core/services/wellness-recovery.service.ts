/**
 * Wellness Recovery Service
 * 
 * Implements cross-day continuity: Wellness < 40% → Next Day Recovery Focus
 */

import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";

@Injectable({
  providedIn: "root",
})
export class WellnessRecoveryService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly logger = inject(LoggerService);

  /**
   * Check if player had low wellness yesterday and create recovery focus for today
   */
  async checkAndCreateRecoveryFocus(playerId: string): Promise<void> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      // Check yesterday's wellness
      const { data: yesterdayWellness } = await this.supabaseService.client
        .from("athlete_daily_state")
        .select("readiness_score")
        .eq("user_id", playerId)
        .eq("state_date", yesterdayStr)
        .maybeSingle();

      if (!yesterdayWellness || yesterdayWellness.readiness_score >= 40) {
        return; // No recovery needed
      }

      const today = new Date().toISOString().split("T")[0];

      // Check if recovery focus already exists for today
      const { data: existing } = await this.supabaseService.client
        .from("recovery_blocks")
        .select("id")
        .eq("player_id", playerId)
        .eq("block_date", today)
        .eq("protocol_type", "wellness_recovery")
        .maybeSingle();

      if (existing) {
        return; // Already exists
      }

      // Create recovery block for today
      await this.supabaseService.client.from("recovery_blocks").insert({
        player_id: playerId,
        block_date: today,
        max_load_percent: 50, // Reduced load
        focus: "recovery",
        restrictions: [
          "light_movement_only",
          "sleep_focus",
          "hydration_focus",
          "no_intense_work",
        ],
        protocol_type: "wellness_recovery",
        created_at: new Date().toISOString(),
      });

      // Create notification for player
      await this.supabaseService.client.from("notifications").insert({
        user_id: playerId,
        notification_type: "wellness",
        message: `Your wellness was low yesterday (${yesterdayWellness.readiness_score}%). Today's training is focused on recovery - prioritize sleep, hydration, and light movement.`,
        priority: "medium",
      });

      this.logger.info(
        `[WellnessRecovery] Created recovery focus for player ${playerId} due to low wellness yesterday`
      );
    } catch (error) {
      this.logger.error(
        "[WellnessRecovery] Error creating recovery focus:",
        error
      );
    }
  }
}

