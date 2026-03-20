/**
 * Override Logging Service
 *
 * Logs all coach overrides of AI recommendations for transparency and accountability
 */

import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";
import { AuthService } from "./auth.service";
import { isBenignSupabaseQueryError } from "../../shared/utils/error.utils";

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
  private readonly authService = inject(AuthService);
  private usersTableUnavailable = false;
  private notificationsUnavailable = false;

  /**
   * Log coach override of AI recommendation
   * Also creates notification for player (Phase 2.1 - Trust Repair)
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
        this.logger.error("[OverrideLogging] Error logging override:", error);
        return null;
      }

      this.logger.info(
        `[OverrideLogging] Logged override: ${override.overrideType} for player ${override.playerId}`,
      );

      // Phase 2.1: Create notification for player about the override
      await this.createPlayerNotification(data.id, override);

      return data.id;
    } catch (error) {
      this.logger.error("[OverrideLogging] Error logging override:", error);
      return null;
    }
  }

  /**
   * Create notification for player when coach overrides training plan
   * Phase 2.1 - Trust Repair: Mandatory notification system
   */
  private async createPlayerNotification(
    overrideId: string,
    override: Omit<CoachOverride, "id" | "createdAt">,
  ): Promise<void> {
    try {
      // Get coach name for notification (use 'users' table - profiles doesn't exist)
      let coachName = "Your coach";
      if (!this.usersTableUnavailable) {
        const { data: coachData, error: coachError } =
          await this.supabaseService.client
            .from("users")
            .select("full_name")
            .eq("id", override.coachId)
            .single();

        if (coachError) {
          if (isBenignSupabaseQueryError(coachError)) {
            this.usersTableUnavailable = true;
          } else {
            throw coachError;
          }
        } else {
          coachName = coachData?.full_name || coachName;
        }
      }

      // Determine what changed based on override type
      let changeDescription = "";
      if (override.overrideType === "training_load") {
        const aiLoad = override.aiRecommendation.load as number;
        const coachLoad = override.coachDecision.load as number;
        changeDescription = `Training load adjusted from ${aiLoad}% to ${coachLoad}%`;
      } else if (override.overrideType === "session_modification") {
        changeDescription = "Training session modified";
      } else if (override.overrideType === "acwr_override") {
        changeDescription = "ACWR calculation adjusted";
      } else {
        changeDescription = "Training plan adjusted";
      }

      // Create notification following 5-Question Contract
      const notificationMessage = `${coachName} adjusted your training plan. ${changeDescription}`;

      // Note: notifications table uses 'data' not 'metadata', 'is_read' not 'read'
      if (this.notificationsUnavailable) {
        return;
      }

      const { error: notificationError } = await this.supabaseService.client
        .from("notifications")
        .insert({
          user_id: override.playerId,
          notification_type: "coach_override",
          title: "Training Plan Adjusted",
          message: notificationMessage,
          priority: "high",
          is_read: false,
          data: {
            overrideId,
            overrideType: override.overrideType,
            coachId: override.coachId,
            coachName,
            reason: override.reason,
            context: override.context,
          },
          created_at: new Date().toISOString(),
        });

      if (notificationError) {
        const status = Number((notificationError as { status?: number }).status);
        if (
          isBenignSupabaseQueryError(notificationError) ||
          notificationError.code === "23505" ||
          status === 409
        ) {
          this.notificationsUnavailable = true;
          return;
        }
        throw notificationError;
      }

      this.logger.info(
        `[OverrideLogging] Created notification for player ${override.playerId} about override ${overrideId}`,
      );
    } catch (error) {
      this.logger.error(
        "[OverrideLogging] Error creating player notification:",
        error,
      );
      // Don't fail the override logging if notification fails
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
        this.logger.error("[OverrideLogging] Error fetching overrides:", error);
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
      this.logger.error("[OverrideLogging] Error fetching overrides:", error);
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
        this.logger.error("[OverrideLogging] Error counting overrides:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      this.logger.error("[OverrideLogging] Error counting overrides:", error);
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
