/**
 * Continuity Indicators Service
 * 
 * Tracks active protocols, recovery blocks, and continuity events
 * Used to display "What's Next" sections on dashboards
 */

import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";
import { GameDayRecoveryService } from "./game-day-recovery.service";
import { AcwrSpikeDetectionService } from "./acwr-spike-detection.service";

export interface ContinuityEvent {
  type:
    | "recovery_protocol"
    | "load_cap"
    | "travel_recovery"
    | "rtp_protocol"
    | "wellness_focus";
  title: string;
  description: string;
  status: "active" | "upcoming" | "completed";
  endDate?: Date | null;
  daysRemaining?: number;
  sessionsRemaining?: number;
}

@Injectable({
  providedIn: "root",
})
export class ContinuityIndicatorsService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly logger = inject(LoggerService);
  private readonly gameDayRecovery = inject(GameDayRecoveryService);
  private readonly acwrSpike = inject(AcwrSpikeDetectionService);

  /**
   * Get active continuity events for player
   */
  async getPlayerContinuity(
    playerId: string
  ): Promise<ContinuityEvent[]> {
    const events: ContinuityEvent[] = [];

    try {
      // Check for active recovery protocol
      const recovery = await this.gameDayRecovery.getActiveRecovery(playerId);
      if (recovery) {
        const today = new Date();
        const recoveryDate = new Date(recovery.date);
        const daysRemaining = Math.ceil(
          (recoveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        events.push({
          type: "recovery_protocol",
          title: "Game Day Recovery",
          description: `Active for ${Math.max(0, daysRemaining)} more day(s)`,
          status: daysRemaining > 0 ? "active" : "completed",
          endDate: recoveryDate,
          daysRemaining: Math.max(0, daysRemaining),
        });
      }

      // Check for active load cap
      const loadCap = await this.acwrSpike.getActiveLoadCap(playerId);
      if (loadCap) {
        events.push({
          type: "load_cap",
          title: "ACWR Load Cap",
          description: `${loadCap.sessionsRemaining} sessions remaining at ${Math.round(loadCap.maxLoad * 100)}% max`,
          status: "active",
          endDate: null,
          sessionsRemaining: loadCap.sessionsRemaining,
        });
      }

      // Check for travel recovery
      const travelRecovery = await this.getActiveTravelRecovery(playerId);
      if (travelRecovery) {
        events.push({
          type: "travel_recovery",
          title: "Travel Recovery",
          description: `Complete in ${travelRecovery.daysRemaining} day(s)`,
          status: "active",
          endDate: travelRecovery.endDate,
          daysRemaining: travelRecovery.daysRemaining,
        });
      }

      // Check for RTP protocol
      const rtp = await this.getActiveRTPProtocol(playerId);
      if (rtp) {
        events.push({
          type: "rtp_protocol",
          title: "Return-to-Play Protocol",
          description: `Phase ${rtp.phase}: ${rtp.description}`,
          status: "active",
          endDate: rtp.endDate,
        });
      }
    } catch (error) {
      this.logger.error(
        "[Continuity] Error fetching player continuity:",
        error
      );
    }

    return events.sort((a, b) => {
      // Sort by status: active first, then upcoming, then completed
      const statusOrder = { active: 0, upcoming: 1, completed: 2 };
      return (
        statusOrder[a.status] - statusOrder[b.status] ||
        (a.endDate?.getTime() || 0) - (b.endDate?.getTime() || 0)
      );
    });
  }

  /**
   * Get active travel recovery from athlete_travel_log
   * Travel recovery is active if there's a recent travel and adaptation_day < 3
   */
  private async getActiveTravelRecovery(
    playerId: string
  ): Promise<{ endDate: Date; daysRemaining: number } | null> {
    try {
      const today = new Date();
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(today.getDate() - 2);

      // Check for recent travel where adaptation is still needed
      const { data, error } = await this.supabaseService.client
        .from("athlete_travel_log")
        .select("arrival_date, adaptation_day, timezone_difference")
        .eq("user_id", playerId)
        .gte("arrival_date", twoDaysAgo.toISOString().split("T")[0])
        .order("arrival_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        // Log only if it's not a "no rows" error
        this.logger.warn(
          "[Continuity] Travel recovery query failed (table may not have data):",
          error.code
        );
        return null;
      }

      if (!data) {
        return null;
      }

      // Calculate days remaining in recovery
      // Typical recovery is 1 day per timezone crossed, max 3 days
      const timezoneDiff = Math.abs(data.timezone_difference || 0);
      const recoveryDays = Math.min(timezoneDiff || 1, 3);
      
      const arrivalDate = new Date(data.arrival_date);
      const recoveryEndDate = new Date(arrivalDate);
      recoveryEndDate.setDate(arrivalDate.getDate() + recoveryDays);

      const daysRemaining = Math.ceil(
        (recoveryEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysRemaining <= 0) {
        return null; // Recovery complete
      }

      return {
        endDate: recoveryEndDate,
        daysRemaining: Math.max(0, daysRemaining),
      };
    } catch (_error) {
      // Silently return null - travel recovery is optional
      return null;
    }
  }

  /**
   * Get active RTP protocol
   */
  private async getActiveRTPProtocol(
    playerId: string
  ): Promise<{ phase: number; description: string; endDate: Date } | null> {
    try {
      const { data, error } = await this.supabaseService.client
        .from("return_to_play_protocols")
        .select("current_phase, phase_description, estimated_completion_date")
        .eq("athlete_id", playerId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        this.logger.error("[Continuity] Error fetching RTP:", error);
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        phase: data.current_phase || 1,
        description: data.phase_description || "Active protocol",
        endDate: data.estimated_completion_date
          ? new Date(data.estimated_completion_date)
          : new Date(),
      };
    } catch (error) {
      this.logger.error("[Continuity] Error fetching RTP:", error);
      return null;
    }
  }

  /**
   * Get team-wide continuity summary for coach
   */
  async getTeamContinuity(teamId: string): Promise<{
    gameDayRecovery: Array<{ playerId: string; playerName: string; dayNumber: number }>;
    loadCaps: Array<{ playerId: string; playerName: string; sessionsRemaining: number }>;
    travelRecovery: Array<{ playerId: string; playerName: string; daysRemaining: number }>;
  }> {
    try {
      // Get all team members
      const { data: teamMembers } = await this.supabaseService.client
        .from("team_members")
        .select("user_id, users!inner(id, name)")
        .eq("team_id", teamId)
        .eq("role", "player");

      if (!teamMembers) {
        return { gameDayRecovery: [], loadCaps: [], travelRecovery: [] };
      }

      const gameDayRecovery: Array<{
        playerId: string;
        playerName: string;
        dayNumber: number;
      }> = [];
      const loadCaps: Array<{
        playerId: string;
        playerName: string;
        sessionsRemaining: number;
      }> = [];
      const travelRecovery: Array<{
        playerId: string;
        playerName: string;
        daysRemaining: number;
      }> = [];

      for (const member of teamMembers) {
        const users = member.users as Array<{ id: string; name: string }>;
        const user = users?.[0] || { id: "", name: "Unknown" };
        const playerId = member.user_id;

        // Check game day recovery
        const recovery = await this.gameDayRecovery.getActiveRecovery(playerId);
        if (recovery) {
          const today = new Date();
          const recoveryDate = new Date(recovery.date);
          const dayNumber = Math.ceil(
            (recoveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (dayNumber >= 0 && dayNumber <= 2) {
            gameDayRecovery.push({
              playerId,
              playerName: user.name || "Unknown",
              dayNumber,
            });
          }
        }

        // Check load caps
        const loadCap = await this.acwrSpike.getActiveLoadCap(playerId);
        if (loadCap) {
          loadCaps.push({
            playerId,
            playerName: user.name || "Unknown",
            sessionsRemaining: loadCap.sessionsRemaining,
          });
        }

        // Check travel recovery
        const travel = await this.getActiveTravelRecovery(playerId);
        if (travel && travel.daysRemaining > 0) {
          travelRecovery.push({
            playerId,
            playerName: user.name || "Unknown",
            daysRemaining: travel.daysRemaining,
          });
        }
      }

      return { gameDayRecovery, loadCaps, travelRecovery };
    } catch (error) {
      this.logger.error("[Continuity] Error fetching team continuity:", error);
      return { gameDayRecovery: [], loadCaps: [], travelRecovery: [] };
    }
  }
}

