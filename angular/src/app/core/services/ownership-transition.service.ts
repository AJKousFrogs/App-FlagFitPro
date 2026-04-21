/**
 * Ownership Transition Service
 *
 * Logs all ownership transitions (Player → Coach → Physio, etc.)
 * Provides accountability tracking for decision handoffs
 */

import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";
import { isBenignSupabaseQueryError } from "../../shared/utils/error.utils";

export interface OwnershipTransition {
  id?: string;
  trigger: string; // 'wellness_low', 'acwr_critical', 'injury_flag', etc.
  fromRole: string;
  toRole: string;
  playerId: string;
  actionRequired: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  completedAt?: Date;
  createdAt?: Date;
}

@Injectable({
  providedIn: "root",
})
export class OwnershipTransitionService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly logger = inject(LoggerService);
  // ownership_transitions is backend-managed in the live project; direct
  // browser access is currently schema-drifted and policy-incompatible.
  private transitionsUnavailable = true;

  /**
   * Log ownership transition
   */
  async logTransition(
    transition: Omit<OwnershipTransition, "id" | "createdAt">,
  ): Promise<string | null> {
    if (this.transitionsUnavailable) {
      return null;
    }

    try {
      const { data, error } = await this.supabaseService.client
        .from("ownership_transitions")
        .insert({
          trigger: transition.trigger,
          from_role: transition.fromRole,
          to_role: transition.toRole,
          player_id: transition.playerId,
          action_required: transition.actionRequired,
          status: transition.status || "pending",
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error) {
        if (isBenignSupabaseQueryError(error)) {
          this.transitionsUnavailable = true;
          this.logger.warn(
            "[OwnershipTransition] Transition log unavailable in current environment",
            error,
          );
          return null;
        }
        this.logger.error(
          "[OwnershipTransition] Error logging transition:",
          error,
        );
        return null;
      }

      this.logger.info(
        `[OwnershipTransition] Logged transition: ${transition.trigger} (${transition.fromRole} → ${transition.toRole})`,
      );
      return data.id;
    } catch (error) {
      if (isBenignSupabaseQueryError(error)) {
        this.transitionsUnavailable = true;
      } else {
        this.logger.error(
          "[OwnershipTransition] Error logging transition:",
          error,
        );
      }
      return null;
    }
  }

  /**
   * Update transition status
   */
  async updateStatus(
    transitionId: string,
    status: "pending" | "in_progress" | "completed" | "overdue",
    acknowledgedBy?: string,
  ): Promise<boolean> {
    if (this.transitionsUnavailable) {
      return false;
    }

    try {
      const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (acknowledgedBy && status === "in_progress") {
        updateData.acknowledged_by = acknowledgedBy;
        updateData.acknowledged_at = new Date().toISOString();
      }

      if (status === "completed") {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await this.supabaseService.client
        .from("ownership_transitions")
        .update(updateData)
        .eq("id", transitionId);

      if (error) {
        if (isBenignSupabaseQueryError(error)) {
          this.transitionsUnavailable = true;
          return false;
        }
        this.logger.error(
          "[OwnershipTransition] Error updating status:",
          error,
        );
        return false;
      }

      return true;
    } catch (error) {
      if (isBenignSupabaseQueryError(error)) {
        this.transitionsUnavailable = true;
      } else {
        this.logger.error("[OwnershipTransition] Error updating status:", error);
      }
      return false;
    }
  }

  /**
   * Get pending transitions for a role
   */
  async getPendingTransitions(
    toRole: string,
    limit = 20,
  ): Promise<OwnershipTransition[]> {
    if (this.transitionsUnavailable) {
      return [];
    }

    try {
      const { data, error } = await this.supabaseService.client
        .from("ownership_transitions")
        .select("*")
        .eq("to_role", toRole)
        .in("status", ["pending", "in_progress", "overdue"])
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        if (isBenignSupabaseQueryError(error)) {
          this.transitionsUnavailable = true;
          return [];
        }
        this.logger.error(
          "[OwnershipTransition] Error fetching transitions:",
          error,
        );
        return [];
      }

      return (
        data?.map((t) => ({
          id: t.id,
          trigger: t.trigger,
          fromRole: t.from_role,
          toRole: t.to_role,
          playerId: t.player_id,
          actionRequired: t.action_required,
          status: t.status,
          acknowledgedBy: t.acknowledged_by,
          acknowledgedAt: t.acknowledged_at
            ? new Date(t.acknowledged_at)
            : undefined,
          completedAt: t.completed_at ? new Date(t.completed_at) : undefined,
          createdAt: t.created_at ? new Date(t.created_at) : undefined,
        })) || []
      );
    } catch (error) {
      if (isBenignSupabaseQueryError(error)) {
        this.transitionsUnavailable = true;
      } else {
        this.logger.error(
          "[OwnershipTransition] Error fetching transitions:",
          error,
        );
      }
      return [];
    }
  }

  /**
   * Check for overdue transitions
   */
  async checkOverdueTransitions(): Promise<void> {
    if (this.transitionsUnavailable) {
      return;
    }

    try {
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - 24); // 24 hours ago

      // Find critical transitions older than 24h still pending
      const { data, error } = await this.supabaseService.client
        .from("ownership_transitions")
        .select("id")
        .eq("status", "pending")
        .in("trigger", ["acwr_critical", "injury_flag"])
        .lt("created_at", cutoff.toISOString());

      if (error) {
        if (isBenignSupabaseQueryError(error)) {
          this.transitionsUnavailable = true;
          return;
        }
        this.logger.error(
          "[OwnershipTransition] Error checking overdue:",
          error,
        );
        return;
      }

      // Mark as overdue
      if (data && data.length > 0) {
        const ids = data.map((t) => t.id);
        await this.supabaseService.client
          .from("ownership_transitions")
          .update({
            status: "overdue",
            updated_at: new Date().toISOString(),
          })
          .in("id", ids);

        this.logger.warn(
          `[OwnershipTransition] Marked ${ids.length} transitions as overdue`,
        );
      }
    } catch (error) {
      if (isBenignSupabaseQueryError(error)) {
        this.transitionsUnavailable = true;
      } else {
        this.logger.error("[OwnershipTransition] Error checking overdue:", error);
      }
    }
  }

  /**
   * Get transitions for a player
   */
  async getPlayerTransitions(
    playerId: string,
    limit = 10,
  ): Promise<OwnershipTransition[]> {
    if (this.transitionsUnavailable) {
      return [];
    }

    try {
      const { data, error } = await this.supabaseService.client
        .from("ownership_transitions")
        .select("*")
        .eq("player_id", playerId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        if (isBenignSupabaseQueryError(error)) {
          this.transitionsUnavailable = true;
          return [];
        }
        this.logger.error(
          "[OwnershipTransition] Error fetching player transitions:",
          error,
        );
        return [];
      }

      return (
        data?.map((t) => ({
          id: t.id,
          trigger: t.trigger,
          fromRole: t.from_role,
          toRole: t.to_role,
          playerId: t.player_id,
          actionRequired: t.action_required,
          status: t.status,
          acknowledgedBy: t.acknowledged_by,
          acknowledgedAt: t.acknowledged_at
            ? new Date(t.acknowledged_at)
            : undefined,
          completedAt: t.completed_at ? new Date(t.completed_at) : undefined,
          createdAt: t.created_at ? new Date(t.created_at) : undefined,
        })) || []
      );
    } catch (error) {
      if (isBenignSupabaseQueryError(error)) {
        this.transitionsUnavailable = true;
      } else {
        this.logger.error(
          "[OwnershipTransition] Error fetching player transitions:",
          error,
        );
      }
      return [];
    }
  }
}
