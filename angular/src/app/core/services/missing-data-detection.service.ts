/**
 * Missing Data Detection Service
 *
 * Detects missing wellness data and other incomplete data patterns
 * Used to show "Data Incomplete" badges to coaches
 */

import { Injectable, inject } from "@angular/core";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";

export interface MissingDataStatus {
  missing: boolean;
  daysMissing: number;
  severity: "none" | "warning" | "critical";
  lastCheckin?: string;
}

export interface PlayerMissingData {
  playerId: string;
  playerName: string;
  missing: boolean;
  daysMissing: number;
  severity: "none" | "warning" | "critical";
  lastCheckin?: string;
  dataType: "wellness" | "training" | "both";
}

@Injectable({
  providedIn: "root",
})
export class MissingDataDetectionService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly logger = inject(LoggerService);

  /**
   * Check if player has missing wellness data
   * Returns days since last check-in
   */
  async checkMissingWellness(playerId: string): Promise<MissingDataStatus> {
    try {
      // Check daily_wellness_checkin (canonical wellness table)
      const { data, error } = await this.supabaseService.client
        .from("daily_wellness_checkin")
        .select("checkin_date")
        .eq("user_id", playerId)
        .order("checkin_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "no rows returned" which is fine
        this.logger.error("[MissingData] Error checking wellness:", error);
        return {
          missing: true,
          daysMissing: 999,
          severity: "critical",
        };
      }

      if (!data || !data.checkin_date) {
        return {
          missing: true,
          daysMissing: 999,
          severity: "critical",
        };
      }

      const lastCheckin = new Date(data.checkin_date);
      const now = new Date();
      const daysDiff = Math.floor(
        (now.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60 * 24),
      );

      let severity: "none" | "warning" | "critical" = "none";
      if (daysDiff >= 7) {
        severity = "critical";
      } else if (daysDiff >= 3) {
        severity = "warning";
      }

      return {
        missing: daysDiff >= 3,
        daysMissing: daysDiff,
        severity,
        lastCheckin: data.checkin_date,
      };
    } catch (error) {
      this.logger.error("[MissingData] Error checking wellness:", error);
      return {
        missing: true,
        daysMissing: 999,
        severity: "critical",
      };
    }
  }

  /**
   * Check for players missing wellness 3+ days and create coach reminders
   */
  async checkAndCreateCoachReminders(teamId: string): Promise<void> {
    try {
      const playersWithMissing =
        await this.getPlayersWithMissingWellness(teamId);

      // Filter players with 3+ days missing
      const criticalPlayers = playersWithMissing.filter(
        (p) => p.daysMissing >= 3,
      );

      if (criticalPlayers.length === 0) {
        return;
      }

      // Get coaches for the team
      const { data: coaches } = await this.supabaseService.client
        .from("team_members")
        .select("user_id")
        .eq("team_id", teamId)
        .eq("role", "coach")
        .limit(5);

      if (!coaches || coaches.length === 0) {
        return;
      }

      // Create notifications for coaches
      const notifications = coaches.flatMap((coach) =>
        criticalPlayers.map((player) => ({
          user_id: coach.user_id,
          notification_type: "wellness",
          message: `${player.playerName} has been missing wellness data for ${player.daysMissing} day(s). Follow-up recommended.`,
          priority: player.severity === "critical" ? "high" : "normal",
          metadata: {
            playerId: player.playerId,
            playerName: player.playerName,
            daysMissing: player.daysMissing,
          },
        })),
      );

      await this.supabaseService.client
        .from("notifications")
        .insert(notifications);

      this.logger.info(
        `[MissingData] Created ${notifications.length} coach reminders for ${criticalPlayers.length} players with missing wellness`,
      );
    } catch (error) {
      this.logger.error("[MissingData] Error creating coach reminders:", error);
    }
  }

  /**
   * Get all players with missing wellness data for a team
   */
  async getPlayersWithMissingWellness(
    teamId: string,
  ): Promise<PlayerMissingData[]> {
    try {
      // Get all team members
      const { data: teamMembers, error: teamError } =
        await this.supabaseService.client
          .from("team_members")
          .select("user_id, users!inner(id, name)")
          .eq("team_id", teamId)
          .eq("role", "player");

      if (teamError || !teamMembers) {
        this.logger.error(
          "[MissingData] Error fetching team members:",
          teamError,
        );
        return [];
      }

      // Check each player for missing wellness
      const playersWithMissingData: PlayerMissingData[] = [];

      for (const member of teamMembers) {
        const status = await this.checkMissingWellness(member.user_id);
        const users = member.users as Array<{ id: string; name: string }>;
        const user = users?.[0] || { id: "", name: "Unknown" };

        if (status.missing) {
          playersWithMissingData.push({
            playerId: member.user_id,
            playerName: user.name || "Unknown",
            missing: true,
            daysMissing: status.daysMissing,
            severity: status.severity,
            lastCheckin: status.lastCheckin,
            dataType: "wellness",
          });
        }
      }

      return playersWithMissingData.sort(
        (a, b) => b.daysMissing - a.daysMissing,
      );
    } catch (error) {
      this.logger.error(
        "[MissingData] Error getting players with missing data:",
        error,
      );
      return [];
    }
  }

  /**
   * Check if player has missing training data
   */
  async checkMissingTraining(
    playerId: string,
    daysRequired: number = 7,
  ): Promise<MissingDataStatus> {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - daysRequired);

      const { data, error } = await this.supabaseService.client
        .from("training_sessions")
        .select("session_date")
        .eq("user_id", playerId)
        .eq("status", "completed")
        .gte("session_date", cutoff.toISOString().split("T")[0])
        .order("session_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        this.logger.error("[MissingData] Error checking training:", error);
        return {
          missing: true,
          daysMissing: daysRequired,
          severity: "warning",
        };
      }

      if (!data || !data.session_date) {
        return {
          missing: true,
          daysMissing: daysRequired,
          severity: "warning",
        };
      }

      const lastSession = new Date(data.session_date);
      const now = new Date();
      const daysDiff = Math.floor(
        (now.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24),
      );

      let severity: "none" | "warning" | "critical" = "none";
      if (daysDiff >= 14) {
        severity = "critical";
      } else if (daysDiff >= 7) {
        severity = "warning";
      }

      return {
        missing: daysDiff >= 7,
        daysMissing: daysDiff,
        severity,
        lastCheckin: data.session_date,
      };
    } catch (error) {
      this.logger.error("[MissingData] Error checking training:", error);
      return {
        missing: true,
        daysMissing: daysRequired,
        severity: "warning",
      };
    }
  }

  /**
   * Get comprehensive missing data status for a player
   */
  async getPlayerMissingDataStatus(
    playerId: string,
  ): Promise<PlayerMissingData> {
    const wellnessStatus = await this.checkMissingWellness(playerId);
    const trainingStatus = await this.checkMissingTraining(playerId);

    // Get player name
    const { data: user } = await this.supabaseService.client
      .from("users")
      .select("name")
      .eq("id", playerId)
      .single();

    let dataType: "wellness" | "training" | "both" = "wellness";
    if (wellnessStatus.missing && trainingStatus.missing) {
      dataType = "both";
    } else if (trainingStatus.missing) {
      dataType = "training";
    }

    const severity =
      wellnessStatus.severity === "critical" ||
      trainingStatus.severity === "critical"
        ? "critical"
        : wellnessStatus.severity === "warning" ||
            trainingStatus.severity === "warning"
          ? "warning"
          : "none";

    return {
      playerId,
      playerName: (user?.name as string) || "Unknown",
      missing: wellnessStatus.missing || trainingStatus.missing,
      daysMissing: Math.max(
        wellnessStatus.daysMissing,
        trainingStatus.daysMissing,
      ),
      severity,
      dataType,
    };
  }
}
