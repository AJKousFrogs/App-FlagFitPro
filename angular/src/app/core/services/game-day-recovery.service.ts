/**
 * Game Day Recovery Service
 * 
 * Automatically triggers 48h recovery protocol after game day
 */

import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";

export interface RecoveryBlock {
  playerId: string;
  date: Date;
  maxLoad: number; // 0.0 to 1.0 (percentage)
  focus: string;
  restrictions: string[];
  protocolType: "game_day_recovery" | "travel_recovery" | "injury_recovery";
}

@Injectable({
  providedIn: "root",
})
export class GameDayRecoveryService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly logger = inject(LoggerService);

  /**
   * Check if player had game today and trigger recovery protocol
   */
  async checkAndTriggerRecovery(
    playerId: string,
    gameDate: Date
  ): Promise<boolean> {
    try {
      // Check if game was logged
      const gameDateStr = gameDate.toISOString().split("T")[0];
      const { data: game, error: gameError } =
        await this.supabaseService.client
          .from("games")
          .select("id, date")
          .eq("player_id", playerId)
          .eq("date", gameDateStr)
          .maybeSingle();

      if (gameError && gameError.code !== "PGRST116") {
        this.logger.error(
          "[GameDayRecovery] Error checking game:",
          gameError
        );
        return false;
      }

      if (!game) {
        // No game logged, no recovery needed
        return false;
      }

      // Check if recovery protocol already exists
      const day1 = new Date(gameDate);
      day1.setDate(day1.getDate() + 1);
      const day1Str = day1.toISOString().split("T")[0];

      const { data: existing } = await this.supabaseService.client
        .from("recovery_protocols")
        .select("id")
        .eq("player_id", playerId)
        .eq("protocol_type", "game_day_recovery")
        .eq("start_date", day1Str)
        .maybeSingle();

      if (existing) {
        // Recovery already created
        return true;
      }

      // Create recovery protocol for next 48 hours
      await this.createRecoveryProtocol(playerId, gameDate);
      return true;
    } catch (error) {
      this.logger.error(
        "[GameDayRecovery] Error checking/triggering recovery:",
        error
      );
      return false;
    }
  }

  /**
   * Create 48h recovery protocol
   */
  private async createRecoveryProtocol(
    playerId: string,
    gameDate: Date
  ): Promise<void> {
    const day1 = new Date(gameDate);
    day1.setDate(day1.getDate() + 1);
    day1.setHours(0, 0, 0, 0);

    const day2 = new Date(gameDate);
    day2.setDate(day2.getDate() + 2);
    day2.setHours(0, 0, 0, 0);

    const endDate = new Date(day2);
    endDate.setHours(23, 59, 59, 999);

    try {
      // Create recovery protocol record
      const { error: protocolError } = await this.supabaseService.client
        .from("recovery_protocols")
        .insert({
          player_id: playerId,
          protocol_type: "game_day_recovery",
          start_date: day1.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          max_load_percent: 50, // Day 2 max load
          restrictions: [
            "no_intense_work",
            "hydration_focus",
            "light_movement_only",
            "no_contact",
          ],
          focus: "sleep_and_recovery",
          created_at: new Date().toISOString(),
        });

      if (protocolError) {
        this.logger.error(
          "[GameDayRecovery] Error creating protocol:",
          protocolError
        );
        return;
      }

      // Create individual recovery blocks for each day
      await Promise.all([
        this.createRecoveryBlock(playerId, day1, {
          maxLoad: 0.3,
          focus: "sleep",
          restrictions: ["no_intense_work", "hydration_focus"],
        }),
        this.createRecoveryBlock(playerId, day2, {
          maxLoad: 0.5,
          focus: "active_recovery",
          restrictions: ["light_movement_only", "no_contact"],
        }),
      ]);

      this.logger.info(
        `[GameDayRecovery] Created 48h recovery protocol for player ${playerId}`
      );
    } catch (error) {
      this.logger.error(
        "[GameDayRecovery] Error creating recovery protocol:",
        error
      );
    }
  }

  /**
   * Create recovery block for a specific day
   */
  private async createRecoveryBlock(
    playerId: string,
    date: Date,
    config: {
      maxLoad: number;
      focus: string;
      restrictions: string[];
    }
  ): Promise<void> {
    try {
      const { error } = await this.supabaseService.client
        .from("recovery_blocks")
        .insert({
          player_id: playerId,
          block_date: date.toISOString().split("T")[0],
          max_load_percent: config.maxLoad * 100,
          focus: config.focus,
          restrictions: config.restrictions,
          protocol_type: "game_day_recovery",
          created_at: new Date().toISOString(),
        });

      if (error) {
        this.logger.error(
          "[GameDayRecovery] Error creating recovery block:",
          error
        );
      }
    } catch (error) {
      this.logger.error(
        "[GameDayRecovery] Error creating recovery block:",
        error
      );
    }
  }

  /**
   * Get active recovery protocol for player
   */
  async getActiveRecovery(playerId: string): Promise<RecoveryBlock | null> {
    try {
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await this.supabaseService.client
        .from("recovery_blocks")
        .select("*")
        .eq("player_id", playerId)
        .eq("block_date", today)
        .eq("protocol_type", "game_day_recovery")
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        this.logger.error(
          "[GameDayRecovery] Error fetching active recovery:",
          error
        );
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        playerId: data.player_id,
        date: new Date(data.block_date),
        maxLoad: data.max_load_percent / 100,
        focus: data.focus,
        restrictions: data.restrictions || [],
        protocolType: "game_day_recovery",
      };
    } catch (error) {
      this.logger.error(
        "[GameDayRecovery] Error fetching active recovery:",
        error
      );
      return null;
    }
  }

  /**
   * Check if recovery protocol is active for today
   */
  async isRecoveryActive(playerId: string): Promise<boolean> {
    const recovery = await this.getActiveRecovery(playerId);
    return recovery !== null;
  }
}

