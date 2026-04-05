/**
 * Override Logging Service
 *
 * Logs all coach overrides of AI recommendations for transparency and accountability
 */

import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";

export interface CoachOverride {
  id?: string;
  coachId: string;
  playerId: string;
  overrideType:
    | "training_load"
    | "session_modification"
    | "acwr_override"
    | "recovery_protocol"
    | "other";
  aiRecommendation: Record<string, unknown>;
  coachDecision: Record<string, unknown>;
  reason?: string;
  context?: Record<string, unknown>; // ACWR, wellness, etc.
  createdAt?: string;
}

@Injectable({
  providedIn: "root",
})
export class OverrideLoggingService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly logger = inject(LoggerService);

  /**
   * Log coach override of AI recommendation.
   * Player-facing notification delivery is handled by backend workflows.
   */
  async logOverride(
    override: Omit<CoachOverride, "id" | "createdAt">,
  ): Promise<string | null> {
    try {
      const { data, error } = await this.supabaseService.client
        .from("coach_overrides")
        .insert({
          coach_id: override.coachId,
          player_id: override.playerId,
          override_type: override.overrideType,
          ai_recommendation: override.aiRecommendation,
          coach_decision: override.coachDecision,
          reason: override.reason || null,
          context: override.context || {},
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error) {
        this.logger.error("override_logging_write_failed", error);
        return null;
      }

      this.logger.info("override_logging_recorded", {
        overrideType: override.overrideType,
        playerId: override.playerId,
      });

      this.logger.debug("override_logging_record_detail", {
        overrideId: data.id,
      });

      return data.id;
    } catch (error) {
      this.logger.error("override_logging_write_failed", error);
      return null;
    }
  }

  /**
   * Get override history for a player
   */
  async getPlayerOverrides(
    playerId: string,
    limit: number = 10,
  ): Promise<CoachOverride[]> {
    try {
      const { data, error } = await this.supabaseService.client
        .from("coach_overrides")
        .select("*")
        .eq("player_id", playerId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        this.logger.error("override_logging_fetch_failed", error);
        return [];
      }

      return (
        data?.map((override) => ({
          id: override.id,
          coachId: override.coach_id,
          playerId: override.player_id,
          overrideType: override.override_type,
          aiRecommendation: override.ai_recommendation,
          coachDecision: override.coach_decision,
          reason: override.reason,
          context: override.context,
          createdAt: override.created_at,
        })) || []
      );
    } catch (error) {
      this.logger.error("override_logging_fetch_failed", error);
      return [];
    }
  }

  /**
   * Get override count for a player (recent)
   */
  async getPlayerOverrideCount(
    playerId: string,
    days: number = 7,
  ): Promise<number> {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      const { count, error } = await this.supabaseService.client
        .from("coach_overrides")
        .select("*", { count: "exact", head: true })
        .eq("player_id", playerId)
        .gte("created_at", cutoff.toISOString());

      if (error) {
        this.logger.error("override_logging_count_failed", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      this.logger.error("override_logging_count_failed", error);
      return 0;
    }
  }

  /**
   * Get all overrides for a coach
   */
  async getCoachOverrides(
    coachId: string,
    limit: number = 20,
  ): Promise<CoachOverride[]> {
    try {
      const { data, error } = await this.supabaseService.client
        .from("coach_overrides")
        .select("*")
        .eq("coach_id", coachId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        this.logger.error(
          "[OverrideLogging] Error fetching coach overrides:",
          error,
        );
        return [];
      }

      return (
        data?.map((override) => ({
          id: override.id,
          coachId: override.coach_id,
          playerId: override.player_id,
          overrideType: override.override_type,
          aiRecommendation: override.ai_recommendation,
          coachDecision: override.coach_decision,
          reason: override.reason,
          context: override.context,
          createdAt: override.created_at,
        })) || []
      );
    } catch (error) {
      this.logger.error(
        "[OverrideLogging] Error fetching coach overrides:",
        error,
      );
      return [];
    }
  }

  /**
   * Get recent unread override notifications for a player
   * Phase 2.1 - Trust Repair: Fetch recent overrides to display on dashboard
   */
  async getRecentUnreadOverrides(
    playerId: string,
    limit: number = 5,
  ): Promise<CoachOverride[]> {
    try {
      // Get recent override notifications
      // Note: table uses 'is_read' not 'read', and 'data' not 'metadata'
      const { data: notifications, error: notifError } =
        await this.supabaseService.client
          .from("notifications")
          .select("data")
          .eq("user_id", playerId)
          .eq("notification_type", "coach_override")
          .eq("is_read", false)
          .order("created_at", { ascending: false })
          .limit(limit);

      if (notifError) {
        this.logger.error(
          "[OverrideLogging] Error fetching override notifications:",
          notifError,
        );
        return [];
      }

      if (!notifications || notifications.length === 0) {
        return [];
      }

      // Extract override IDs from notifications (data field stores metadata)
      const overrideIds = notifications
        .map((n) => (n.data as Record<string, unknown>)?.overrideId)
        .filter((id): id is string => typeof id === "string");

      if (overrideIds.length === 0) {
        return [];
      }

      // Fetch full override details
      const { data: overrides, error: overrideError } =
        await this.supabaseService.client
          .from("coach_overrides")
          .select("*")
          .in("id", overrideIds)
          .order("created_at", { ascending: false });

      if (overrideError) {
        this.logger.error(
          "[OverrideLogging] Error fetching override details:",
          overrideError,
        );
        return [];
      }

      return (
        overrides?.map((override) => ({
          id: override.id,
          coachId: override.coach_id,
          playerId: override.player_id,
          overrideType: override.override_type,
          aiRecommendation: override.ai_recommendation,
          coachDecision: override.coach_decision,
          reason: override.reason,
          context: override.context,
          createdAt: override.created_at,
        })) || []
      );
    } catch (error) {
      this.logger.error(
        "[OverrideLogging] Error fetching recent unread overrides:",
        error,
      );
      return [];
    }
  }
}
