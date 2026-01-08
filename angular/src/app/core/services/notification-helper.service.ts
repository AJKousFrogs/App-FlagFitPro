/**
 * Notification Helper Service
 *
 * Provides convenient methods for creating flag football specific notifications.
 * Integrates with Supabase to create notifications that will be delivered
 * via the real-time subscription in NotificationStateService.
 *
 * Usage:
 * ```typescript
 * // Inject the service
 * private notificationHelper = inject(NotificationHelperService);
 *
 * // Send a game invite
 * await this.notificationHelper.sendGameInvite(userId, {
 *   gameName: 'Friendly Match',
 *   teamName: 'Thunder',
 *   gameDate: new Date('2024-01-15'),
 *   location: 'City Park Field 3'
 * });
 * ```
 */

import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";
import {
  NotificationCategory,
  NotificationSeverity,
} from "./notification-state.service";
import { TIME } from "../constants/app.constants";

/**
 * Flag Football Notification Types
 */
export type FlagFootballNotificationType =
  // Game related
  | "game_invite"
  | "game_reminder"
  | "game_started"
  | "game_score_update"
  | "game_ended"
  | "game_canceled"
  | "game_rescheduled"
  // Team related
  | "team_invite"
  | "team_joined"
  | "team_left"
  | "roster_update"
  | "team_announcement"
  | "player_rsvp"
  // Training related
  | "training_reminder"
  | "training_scheduled"
  | "training_canceled"
  | "training_completed"
  | "workout_recommendation"
  // Tournament related
  | "tournament_registration"
  | "tournament_bracket_update"
  | "tournament_game_scheduled"
  | "tournament_results"
  // Coach related
  | "coach_override"
  | "coach_feedback"
  | "coach_recommendation"
  | "coach_message"
  // Wellness related
  | "wellness_alert"
  | "recovery_recommendation"
  | "injury_risk_warning"
  | "rest_day_reminder"
  // Achievement related
  | "achievement_unlocked"
  | "personal_record"
  | "milestone_reached"
  | "streak_milestone"
  // System related
  | "system_update"
  | "account_activity"
  | "welcome";

/**
 * Options for game invite notification
 */
export interface GameInviteOptions {
  gameName: string;
  teamName: string;
  gameDate: Date;
  location?: string;
  opponentTeam?: string;
  gameId?: string;
}

/**
 * Options for team invite notification
 */
export interface TeamInviteOptions {
  teamName: string;
  inviterName: string;
  teamId: string;
  role?: string;
}

/**
 * Options for training notification
 */
export interface TrainingNotificationOptions {
  sessionName: string;
  scheduledTime?: Date;
  duration?: number;
  trainingType?: string;
  sessionId?: string;
}

/**
 * Options for tournament notification
 */
export interface TournamentNotificationOptions {
  tournamentName: string;
  tournamentId: string;
  roundName?: string;
  opponentTeam?: string;
  gameTime?: Date;
  location?: string;
}

/**
 * Options for achievement notification
 */
export interface AchievementNotificationOptions {
  achievementName: string;
  achievementDescription?: string;
  achievementIcon?: string;
  xpEarned?: number;
}

/**
 * Options for wellness notification
 */
export interface WellnessNotificationOptions {
  alertType: "recovery" | "injury_risk" | "rest_reminder" | "wellness_check";
  riskLevel?: "low" | "medium" | "high";
  recommendation?: string;
  affectedArea?: string;
}

/**
 * Options for coach notification
 */
export interface CoachNotificationOptions {
  coachName: string;
  coachId: string;
  messageType: "override" | "feedback" | "recommendation" | "message";
  subject?: string;
  details?: string;
}

@Injectable({
  providedIn: "root",
})
export class NotificationHelperService {
  private supabaseService = inject(SupabaseService);
  private logger = inject(LoggerService);

  // =========================================================================
  // Game Notifications
  // =========================================================================

  /**
   * Send a game invite notification
   */
  async sendGameInvite(
    userId: string,
    options: GameInviteOptions,
    senderId?: string,
  ): Promise<string | null> {
    const gameDate = options.gameDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    let message = `You've been invited to play "${options.gameName}" with ${options.teamName} on ${gameDate}`;
    if (options.location) {
      message += ` at ${options.location}`;
    }
    if (options.opponentTeam) {
      message += ` vs ${options.opponentTeam}`;
    }

    return this.createNotification(
      userId,
      {
        type: "game_invite",
        title: "Game Invite",
        message,
        category: "game",
        severity: "info",
        priority: "high",
        action_url: options.gameId ? `/games/${options.gameId}/rsvp` : "/games",
        data: {
          gameName: options.gameName,
          teamName: options.teamName,
          gameDate: options.gameDate.toISOString(),
          location: options.location,
          opponentTeam: options.opponentTeam,
          gameId: options.gameId,
        },
      },
      senderId,
    );
  }

  /**
   * Send a game reminder notification
   */
  async sendGameReminder(
    userId: string,
    options: GameInviteOptions,
    hoursUntilGame: number,
  ): Promise<string | null> {
    const timeText =
      hoursUntilGame <= 1
        ? "in 1 hour"
        : hoursUntilGame <= 24
          ? `in ${hoursUntilGame} hours`
          : `tomorrow`;

    const message = `Reminder: "${options.gameName}" starts ${timeText} at ${options.location || "TBD"}`;

    return this.createNotification(userId, {
      type: "game_reminder",
      title: "Game Reminder ⏰",
      message,
      category: "game",
      severity: "warning",
      priority: "high",
      action_url: options.gameId ? `/games/${options.gameId}` : "/games",
      data: {
        gameName: options.gameName,
        gameDate: options.gameDate.toISOString(),
        hoursUntilGame,
      },
    });
  }

  /**
   * Send game score update notification
   */
  async sendGameScoreUpdate(
    userId: string,
    gameName: string,
    yourTeamScore: number,
    opponentScore: number,
    opponentName: string,
    gameId?: string,
  ): Promise<string | null> {
    const isWinning = yourTeamScore > opponentScore;
    const isTied = yourTeamScore === opponentScore;
    const statusEmoji = isWinning ? "🔥" : isTied ? "⚖️" : "💪";

    return this.createNotification(userId, {
      type: "game_score_update",
      title: `Score Update ${statusEmoji}`,
      message: `${gameName}: Your team ${yourTeamScore} - ${opponentScore} ${opponentName}`,
      category: "game",
      severity: isWinning ? "success" : "info",
      priority: "medium",
      action_url: gameId ? `/games/${gameId}` : "/game-tracker",
      data: { yourTeamScore, opponentScore, opponentName, gameId },
    });
  }

  /**
   * Send game canceled notification
   */
  async sendGameCanceled(
    userId: string,
    gameName: string,
    reason?: string,
    gameId?: string,
  ): Promise<string | null> {
    let message = `"${gameName}" has been canceled`;
    if (reason) {
      message += `: ${reason}`;
    }

    return this.createNotification(userId, {
      type: "game_canceled",
      title: "Game Canceled",
      message,
      category: "game",
      severity: "warning",
      priority: "high",
      action_url: "/games",
      data: { gameName, reason, gameId },
    });
  }

  // =========================================================================
  // Team Notifications
  // =========================================================================

  /**
   * Send team invite notification
   */
  async sendTeamInvite(
    userId: string,
    options: TeamInviteOptions,
  ): Promise<string | null> {
    const message = `${options.inviterName} invited you to join "${options.teamName}"${options.role ? ` as ${options.role}` : ""}`;

    return this.createNotification(userId, {
      type: "team_invite",
      title: "Team Invite",
      message,
      category: "team",
      severity: "info",
      priority: "high",
      action_url: `/teams/${options.teamId}/invite`,
      data: { ...options },
    });
  }

  /**
   * Send roster update notification
   */
  async sendRosterUpdate(
    userId: string,
    teamName: string,
    updateType: "player_added" | "player_removed" | "role_changed",
    playerName: string,
    details?: string,
  ): Promise<string | null> {
    const messages = {
      player_added: `${playerName} joined ${teamName}`,
      player_removed: `${playerName} left ${teamName}`,
      role_changed: `${playerName}'s role changed in ${teamName}`,
    };

    return this.createNotification(userId, {
      type: "roster_update",
      title: "Roster Update",
      message: details || messages[updateType],
      category: "team",
      severity: "info",
      priority: "low",
      action_url: "/roster",
      data: { teamName, updateType, playerName },
    });
  }

  /**
   * Send player RSVP notification (for coaches/team admins)
   */
  async sendPlayerRsvp(
    userId: string,
    playerName: string,
    gameName: string,
    rsvpStatus: "yes" | "no" | "maybe",
    gameId?: string,
  ): Promise<string | null> {
    const statusEmoji = rsvpStatus === "yes" ? "✅" : rsvpStatus === "no" ? "❌" : "❓";
    const statusText = rsvpStatus === "yes" ? "confirmed" : rsvpStatus === "no" ? "can't make it" : "is maybe";

    return this.createNotification(userId, {
      type: "player_rsvp",
      title: `RSVP Update ${statusEmoji}`,
      message: `${playerName} ${statusText} for "${gameName}"`,
      category: "team",
      severity: "info",
      priority: "medium",
      action_url: gameId ? `/games/${gameId}/roster` : "/games",
      data: { playerName, gameName, rsvpStatus, gameId },
    });
  }

  // =========================================================================
  // Training Notifications
  // =========================================================================

  /**
   * Send training reminder notification
   */
  async sendTrainingReminder(
    userId: string,
    options: TrainingNotificationOptions,
  ): Promise<string | null> {
    let message = `Don't forget: "${options.sessionName}"`;
    if (options.scheduledTime) {
      const time = options.scheduledTime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      message += ` at ${time}`;
    }
    if (options.duration) {
      message += ` (${options.duration} min)`;
    }

    return this.createNotification(userId, {
      type: "training_reminder",
      title: "Training Reminder 💪",
      message,
      category: "training",
      severity: "info",
      priority: "medium",
      action_url: options.sessionId
        ? `/training/${options.sessionId}`
        : "/todays-practice",
      data: {
        ...options,
        scheduledTime: options.scheduledTime?.toISOString(),
      },
    });
  }

  /**
   * Send training canceled notification
   */
  async sendTrainingCanceled(
    userId: string,
    sessionName: string,
    reason?: string,
    rescheduledTo?: Date,
  ): Promise<string | null> {
    let message = `"${sessionName}" has been canceled`;
    if (reason) {
      message += `: ${reason}`;
    }
    if (rescheduledTo) {
      const newTime = rescheduledTo.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      message += `. Rescheduled to ${newTime}`;
    }

    return this.createNotification(userId, {
      type: "training_canceled",
      title: "Training Canceled",
      message,
      category: "training",
      severity: "warning",
      priority: "high",
      action_url: "/training",
      data: { sessionName, reason, rescheduledTo: rescheduledTo?.toISOString() },
    });
  }

  /**
   * Send workout recommendation notification
   */
  async sendWorkoutRecommendation(
    userId: string,
    recommendation: string,
    workoutType: string,
    duration?: number,
  ): Promise<string | null> {
    return this.createNotification(userId, {
      type: "workout_recommendation",
      title: "Workout Suggestion",
      message: recommendation,
      category: "training",
      severity: "info",
      priority: "low",
      action_url: "/training",
      data: { workoutType, duration },
    });
  }

  // =========================================================================
  // Tournament Notifications
  // =========================================================================

  /**
   * Send tournament registration notification
   */
  async sendTournamentRegistration(
    userId: string,
    options: TournamentNotificationOptions,
  ): Promise<string | null> {
    return this.createNotification(userId, {
      type: "tournament_registration",
      title: "Tournament Registration 🏆",
      message: `Your team has been registered for "${options.tournamentName}"`,
      category: "tournament",
      severity: "success",
      priority: "medium",
      action_url: `/tournaments/${options.tournamentId}`,
      data: {
        ...options,
        gameTime: options.gameTime?.toISOString(),
      },
    });
  }

  /**
   * Send tournament bracket update notification
   */
  async sendTournamentBracketUpdate(
    userId: string,
    options: TournamentNotificationOptions,
  ): Promise<string | null> {
    let message = `${options.tournamentName}: ${options.roundName || "Bracket"} updated`;
    if (options.opponentTeam) {
      message += `. Your next opponent: ${options.opponentTeam}`;
    }
    if (options.gameTime) {
      const time = options.gameTime.toLocaleString("en-US", {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
      });
      message += ` at ${time}`;
    }

    return this.createNotification(userId, {
      type: "tournament_bracket_update",
      title: "Bracket Update",
      message,
      category: "tournament",
      severity: "info",
      priority: "high",
      action_url: `/tournaments/${options.tournamentId}/bracket`,
      data: {
        ...options,
        gameTime: options.gameTime?.toISOString(),
      },
    });
  }

  // =========================================================================
  // Coach Notifications
  // =========================================================================

  /**
   * Send coach override notification (when coach modifies player's plan)
   */
  async sendCoachOverride(
    userId: string,
    options: CoachNotificationOptions,
  ): Promise<string | null> {
    const message = options.details
      ? `${options.coachName} updated your plan: ${options.details}`
      : `${options.coachName} has made changes to your training plan`;

    return this.createNotification(
      userId,
      {
        type: "coach_override",
        title: `Coach Update from ${options.coachName}`,
        message,
        category: "coach",
        severity: "warning",
        priority: "high",
        action_url: "/todays-practice",
        data: { ...options },
      },
      options.coachId,
    );
  }

  /**
   * Send coach feedback notification
   */
  async sendCoachFeedback(
    userId: string,
    options: CoachNotificationOptions,
  ): Promise<string | null> {
    return this.createNotification(
      userId,
      {
        type: "coach_feedback",
        title: `Feedback from ${options.coachName}`,
        message: options.details || `${options.coachName} sent you feedback`,
        category: "coach",
        severity: "info",
        priority: "medium",
        action_url: "/profile",
        data: { ...options },
      },
      options.coachId,
    );
  }

  // =========================================================================
  // Wellness Notifications
  // =========================================================================

  /**
   * Send wellness alert notification
   */
  async sendWellnessAlert(
    userId: string,
    options: WellnessNotificationOptions,
  ): Promise<string | null> {
    const titles: Record<string, string> = {
      recovery: "Recovery Alert",
      injury_risk: "Injury Risk Warning ⚠️",
      rest_reminder: "Rest Day Reminder",
      wellness_check: "Wellness Check",
    };

    const severity: NotificationSeverity =
      options.riskLevel === "high"
        ? "error"
        : options.riskLevel === "medium"
          ? "warning"
          : "info";

    return this.createNotification(userId, {
      type: "wellness_alert",
      title: titles[options.alertType] || "Wellness Alert",
      message:
        options.recommendation ||
        `Please check your wellness status${options.affectedArea ? ` - ${options.affectedArea}` : ""}`,
      category: "wellness",
      severity,
      priority: options.riskLevel === "high" ? "high" : "medium",
      action_url: "/wellness",
      data: { ...options },
    });
  }

  /**
   * Send recovery recommendation notification
   */
  async sendRecoveryRecommendation(
    userId: string,
    recommendation: string,
    recoveryType?: string,
  ): Promise<string | null> {
    return this.createNotification(userId, {
      type: "recovery_recommendation",
      title: "Recovery Tip 🧘",
      message: recommendation,
      category: "wellness",
      severity: "info",
      priority: "low",
      action_url: "/wellness",
      data: { recoveryType },
    });
  }

  // =========================================================================
  // Achievement Notifications
  // =========================================================================

  /**
   * Send achievement unlocked notification
   */
  async sendAchievementUnlocked(
    userId: string,
    options: AchievementNotificationOptions,
  ): Promise<string | null> {
    let message = `You unlocked "${options.achievementName}"!`;
    if (options.achievementDescription) {
      message += ` - ${options.achievementDescription}`;
    }
    if (options.xpEarned) {
      message += ` (+${options.xpEarned} XP)`;
    }

    return this.createNotification(userId, {
      type: "achievement_unlocked",
      title: "Achievement Unlocked! 🏆",
      message,
      category: "achievement",
      severity: "success",
      priority: "medium",
      action_url: "/achievements",
      data: { ...options },
    });
  }

  /**
   * Send personal record notification
   */
  async sendPersonalRecord(
    userId: string,
    recordType: string,
    newValue: string | number,
    previousValue?: string | number,
  ): Promise<string | null> {
    let message = `New personal record in ${recordType}: ${newValue}`;
    if (previousValue) {
      message += ` (previous: ${previousValue})`;
    }

    return this.createNotification(userId, {
      type: "personal_record",
      title: "Personal Record! 🎯",
      message,
      category: "achievement",
      severity: "success",
      priority: "medium",
      action_url: "/analytics",
      data: { recordType, newValue, previousValue },
    });
  }

  /**
   * Send streak milestone notification
   */
  async sendStreakMilestone(
    userId: string,
    streakType: string,
    streakCount: number,
  ): Promise<string | null> {
    return this.createNotification(userId, {
      type: "streak_milestone",
      title: `${streakCount} Day Streak! 🔥`,
      message: `Amazing! You've maintained your ${streakType} streak for ${streakCount} days!`,
      category: "achievement",
      severity: "success",
      priority: "medium",
      action_url: "/dashboard",
      data: { streakType, streakCount },
    });
  }

  // =========================================================================
  // System Notifications
  // =========================================================================

  /**
   * Send welcome notification for new users
   */
  async sendWelcome(userId: string, userName: string): Promise<string | null> {
    return this.createNotification(userId, {
      type: "welcome",
      title: "Welcome to FlagFit Pro! 🏈",
      message: `Hey ${userName}! Start by setting up your profile and joining a team.`,
      category: "system",
      severity: "info",
      priority: "medium",
      action_url: "/profile",
      data: { userName },
    });
  }

  // =========================================================================
  // Core notification creation method
  // =========================================================================

  /**
   * Create a notification in Supabase
   */
  private async createNotification(
    userId: string,
    options: {
      type: string;
      title?: string;
      message: string;
      category?: NotificationCategory;
      severity?: NotificationSeverity;
      priority?: "low" | "medium" | "high";
      action_url?: string;
      data?: Record<string, unknown>;
      related_entity_type?: string;
      related_entity_id?: string;
    },
    senderId?: string,
  ): Promise<string | null> {
    try {
      const { data, error } = await this.supabaseService.client
        .from("notifications")
        .insert({
          user_id: userId,
          user_id_uuid: userId,
          notification_type: options.type,
          title: options.title,
          message: options.message,
          category: options.category || "general",
          severity: options.severity || "info",
          priority: options.priority || "medium",
          action_url: options.action_url,
          data: options.data || {},
          sender_id: senderId,
          related_entity_type: options.related_entity_type,
          related_entity_id: options.related_entity_id,
          is_read: false,
          dismissed: false,
          expires_at: new Date(
            Date.now() + TIME.NOTIFICATION_EXPIRY_DAYS * TIME.MS_PER_DAY,
          ).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error) {
        this.logger.error("[NotificationHelper] Failed to create notification:", error);
        return null;
      }

      this.logger.debug(
        `[NotificationHelper] Notification created: ${options.type} for user ${userId}`,
      );
      return data?.id ? String(data.id) : null;
    } catch (error) {
      this.logger.error("[NotificationHelper] Error creating notification:", error);
      return null;
    }
  }

  /**
   * Batch create notifications for multiple users
   */
  async createBatchNotifications(
    userIds: string[],
    options: {
      type: string;
      title?: string;
      message: string;
      category?: NotificationCategory;
      severity?: NotificationSeverity;
      priority?: "low" | "medium" | "high";
      action_url?: string;
      data?: Record<string, unknown>;
    },
    senderId?: string,
  ): Promise<number> {
    try {
      const notifications = userIds.map((userId) => ({
        user_id: userId,
        user_id_uuid: userId,
        notification_type: options.type,
        title: options.title,
        message: options.message,
        category: options.category || "general",
        severity: options.severity || "info",
        priority: options.priority || "medium",
        action_url: options.action_url,
        data: options.data || {},
        sender_id: senderId,
        is_read: false,
        dismissed: false,
        expires_at: new Date(Date.now() + TIME.NOTIFICATION_EXPIRY_DAYS * TIME.MS_PER_DAY).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { data, error } = await this.supabaseService.client
        .from("notifications")
        .insert(notifications)
        .select("id");

      if (error) {
        this.logger.error("[NotificationHelper] Failed to create batch notifications:", error);
        return 0;
      }

      const count = data?.length || 0;
      this.logger.debug(
        `[NotificationHelper] Batch notifications created: ${count} for ${options.type}`,
      );
      return count;
    } catch (error) {
      this.logger.error("[NotificationHelper] Error creating batch notifications:", error);
      return 0;
    }
  }
}
