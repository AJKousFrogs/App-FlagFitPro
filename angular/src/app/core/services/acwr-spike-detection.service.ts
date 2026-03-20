/**
 * ACWR Spike Detection Service
 *
 * Detects ACWR spikes and automatically caps training load for next sessions
 */

import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";
import { isBenignSupabaseQueryError } from "../../shared/utils/error.utils";

export interface LoadCap {
  id?: string;
  playerId: string;
  maxLoad: number; // 0.0 to 1.0 (percentage)
  sessionsRemaining: number;
  reason: string;
  status: "active" | "inactive" | "overridden";
  createdAt?: Date;
}

@Injectable({
  providedIn: "root",
})
export class AcwrSpikeDetectionService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly logger = inject(LoggerService);
  private loadCapsUnavailable = false;

  /**
   * Check for ACWR spike and create load cap if needed
   */
  async checkAndCapLoad(playerId: string, acwrValue: number): Promise<boolean> {
    if (this.loadCapsUnavailable) {
      return false;
    }

    if (acwrValue <= 1.5) {
      return false;
    }

    try {
      // Check if cap already exists
      const existingCap = await this.getActiveLoadCap(playerId);
      if (existingCap) {
        return true; // Cap already exists
      }

      // Create load cap for next 3 sessions
      await this.createLoadCap(playerId, {
        maxLoad: 0.7,
        sessionsRemaining: 3,
        reason: `ACWR spike detected (${acwrValue.toFixed(2)})`,
      });

      this.logger.info(
        `[AcwrSpike] Created load cap for player ${playerId} due to ACWR ${acwrValue.toFixed(2)}`,
      );
      return true;
    } catch (error) {
      this.logger.error("[AcwrSpike] Error creating load cap:", error);
      return false;
    }
  }

  /**
   * Create load cap record
   */
  private async createLoadCap(
    playerId: string,
    cap: Omit<LoadCap, "id" | "playerId" | "status" | "createdAt">,
  ): Promise<void> {
    try {
      const { error } = await this.supabaseService.client
        .from("load_caps")
        .insert({
          player_id: playerId,
          max_load_percent: cap.maxLoad * 100,
          sessions_remaining: cap.sessionsRemaining,
          reason: cap.reason,
          status: "active",
          created_at: new Date().toISOString(),
        });

      if (error) {
        if (isBenignSupabaseQueryError(error)) {
          this.loadCapsUnavailable = true;
          this.logger.warn("[AcwrSpike] Skipping load cap creation:", error);
          return;
        }
        this.logger.error("[AcwrSpike] Error creating load cap:", error);
        throw error;
      }
    } catch (error) {
      if (isBenignSupabaseQueryError(error)) {
        this.loadCapsUnavailable = true;
      } else {
        this.logger.error("[AcwrSpike] Error creating load cap:", error);
      }
      throw error;
    }
  }

  /**
   * Check if player has active load cap
   */
  async getActiveLoadCap(playerId: string): Promise<LoadCap | null> {
    if (this.loadCapsUnavailable) {
      return null;
    }

    try {
      const { data, error } = await this.supabaseService.client
        .from("load_caps")
        .select("*")
        .eq("player_id", playerId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        if (isBenignSupabaseQueryError(error)) {
          this.loadCapsUnavailable = true;
          return null;
        }
        this.logger.error("[AcwrSpike] Error fetching load cap:", error);
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        id: data.id,
        playerId: data.player_id,
        maxLoad: data.max_load_percent / 100,
        sessionsRemaining: data.sessions_remaining,
        reason: data.reason,
        status: data.status,
        createdAt: new Date(data.created_at),
      };
    } catch (error) {
      if (isBenignSupabaseQueryError(error)) {
        this.loadCapsUnavailable = true;
      } else {
        this.logger.error("[AcwrSpike] Error fetching load cap:", error);
      }
      return null;
    }
  }

  /**
   * Decrement sessions remaining when session logged
   */
  async decrementLoadCap(playerId: string): Promise<void> {
    if (this.loadCapsUnavailable) {
      return;
    }

    const cap = await this.getActiveLoadCap(playerId);
    if (!cap || !cap.id) {
      return;
    }

    const newRemaining = cap.sessionsRemaining - 1;

    try {
      if (newRemaining <= 0) {
        // Deactivate cap
        const { error } = await this.supabaseService.client
          .from("load_caps")
          .update({
            status: "inactive",
            updated_at: new Date().toISOString(),
          })
          .eq("id", cap.id);

        if (error) {
          if (isBenignSupabaseQueryError(error)) {
            this.loadCapsUnavailable = true;
          } else {
            this.logger.error("[AcwrSpike] Error deactivating load cap:", error);
          }
        } else {
          this.logger.info(
            `[AcwrSpike] Load cap completed for player ${playerId}`,
          );
        }
      } else {
        // Update remaining
        const { error } = await this.supabaseService.client
          .from("load_caps")
          .update({
            sessions_remaining: newRemaining,
            updated_at: new Date().toISOString(),
          })
          .eq("id", cap.id);

        if (error) {
          if (isBenignSupabaseQueryError(error)) {
            this.loadCapsUnavailable = true;
          } else {
            this.logger.error("[AcwrSpike] Error updating load cap:", error);
          }
        }
      }
    } catch (error) {
      if (isBenignSupabaseQueryError(error)) {
        this.loadCapsUnavailable = true;
      } else {
        this.logger.error("[AcwrSpike] Error updating load cap:", error);
      }
    }
  }

  /**
   * Override load cap (coach decision)
   */
  async overrideLoadCap(
    playerId: string,
    reason: string,
    coachId: string,
  ): Promise<void> {
    if (this.loadCapsUnavailable) {
      return;
    }

    const cap = await this.getActiveLoadCap(playerId);
    if (!cap || !cap.id) {
      return;
    }

    try {
      const { error } = await this.supabaseService.client
        .from("load_caps")
        .update({
          status: "overridden",
          override_reason: reason,
          overridden_by: coachId,
          overridden_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", cap.id);

      if (error) {
        if (isBenignSupabaseQueryError(error)) {
          this.loadCapsUnavailable = true;
        } else {
          this.logger.error("[AcwrSpike] Error overriding load cap:", error);
        }
      } else {
        this.logger.info(
          `[AcwrSpike] Load cap overridden for player ${playerId} by coach ${coachId}`,
        );
      }
    } catch (error) {
      if (isBenignSupabaseQueryError(error)) {
        this.loadCapsUnavailable = true;
      } else {
        this.logger.error("[AcwrSpike] Error overriding load cap:", error);
      }
    }
  }
}
