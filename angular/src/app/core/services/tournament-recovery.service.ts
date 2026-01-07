/**
 * Tournament Recovery Service
 * 
 * Implements cross-day continuity: Tournament End → Sleep + Hydration Emphasis (7 days)
 */

import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";

@Injectable({
  providedIn: "root",
})
export class TournamentRecoveryService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly logger = inject(LoggerService);

  /**
   * Check if tournament ended and create recovery protocol
   */
  async checkAndCreateTournamentRecovery(
    playerId: string,
    tournamentEndDate: Date
  ): Promise<void> {
    try {
      const endDate = new Date(tournamentEndDate);
      endDate.setHours(0, 0, 0, 0);

      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() + 1); // Start recovery day after tournament

      const protocolEndDate = new Date(endDate);
      protocolEndDate.setDate(protocolEndDate.getDate() + 7); // 7-day protocol

      // Check if protocol already exists
      const { data: existing } = await this.supabaseService.client
        .from("recovery_protocols")
        .select("id")
        .eq("player_id", playerId)
        .eq("protocol_type", "tournament_recovery")
        .eq("start_date", startDate.toISOString().split("T")[0])
        .maybeSingle();

      if (existing) {
        return; // Already exists
      }

      // Create recovery protocol
      await this.supabaseService.client.from("recovery_protocols").insert({
        player_id: playerId,
        protocol_type: "tournament_recovery",
        start_date: startDate.toISOString().split("T")[0],
        end_date: protocolEndDate.toISOString().split("T")[0],
        max_load_percent: 60, // Reduced load for first 3 days, then gradual increase
        restrictions: [
          "sleep_emphasis",
          "hydration_targets",
          "light_movement",
          "no_intense_work",
        ],
        focus: "sleep_and_hydration",
        created_at: new Date().toISOString(),
      });

      // Create recovery blocks for days 1-3 (sleep/hydration emphasis)
      const blocks = [];
      for (let i = 1; i <= 3; i++) {
        const blockDate = new Date(startDate);
        blockDate.setDate(blockDate.getDate() + i - 1);
        blocks.push({
          player_id: playerId,
          block_date: blockDate.toISOString().split("T")[0],
          max_load_percent: 40, // Very light for first 3 days
          focus: "sleep_and_hydration",
          restrictions: [
            "sleep_emphasis",
            "hydration_targets",
            "light_movement_only",
            "no_intense_work",
          ],
          protocol_type: "tournament_recovery",
          created_at: new Date().toISOString(),
        });
      }

      // Create recovery blocks for days 4-7 (gradual return)
      for (let i = 4; i <= 7; i++) {
        const blockDate = new Date(startDate);
        blockDate.setDate(blockDate.getDate() + i - 1);
        blocks.push({
          player_id: playerId,
          block_date: blockDate.toISOString().split("T")[0],
          max_load_percent: 60, // Gradual return
          focus: "gradual_return",
          restrictions: ["monitor_load", "wellness_checks", "acwr_tracking"],
          protocol_type: "tournament_recovery",
          created_at: new Date().toISOString(),
        });
      }

      await this.supabaseService.client.from("recovery_blocks").insert(blocks);

      // Create notification
      await this.supabaseService.client.from("notifications").insert({
        user_id: playerId,
        notification_type: "recovery",
        message: "Tournament recovery protocol activated. Focus on sleep, hydration, and gradual return to training over the next 7 days.",
        priority: "medium",
      });

      this.logger.info(
        `[TournamentRecovery] Created 7-day recovery protocol for player ${playerId} after tournament`
      );
    } catch (error) {
      this.logger.error(
        "[TournamentRecovery] Error creating recovery protocol:",
        error
      );
    }
  }
}

