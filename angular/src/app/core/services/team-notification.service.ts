/**
 * Team Notification Service
 *
 * Handles notifications for team events including:
 * - Coach announcements
 * - Player stats uploads
 * - Training completions
 * - @mentions in chat
 * - Important message alerts
 *
 * Integrates with Supabase realtime for instant notifications.
 */

import { Injectable, inject, signal, computed, effect } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { AuthService } from "./auth.service";
import { LoggerService } from "./logger.service";
import { toLogContext } from "./logger.service";
import {
  NotificationStateService,
  Notification as AppNotification,
} from "./notification-state.service";
import { ToastService } from "./toast.service";
import { TOAST } from "../constants/toast-messages.constants";
import { formatDate } from "../../shared/utils/date.utils";
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
  REALTIME_LISTEN_TYPES,
} from "@supabase/supabase-js";

// ============================================================================
// TYPES
// ============================================================================

export interface CoachActivityItem {
  id: string;
  team_id: string;
  player_id: string;
  coach_id: string | null;
  activity_type: ActivityType;
  title: string;
  description: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  // Joined fields
  player?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    position?: string;
  };
}

export type ActivityType =
  | "stats_uploaded"
  | "training_completed"
  | "wellness_logged"
  | "injury_reported"
  | "achievement_earned"
  | "message_sent";

export interface TeamNotificationPreferences {
  announcements: boolean;
  mentions: boolean;
  stats_uploads: boolean;
  training_completions: boolean;
  player_alerts: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
}

export interface UnreadAnnouncement {
  id: string;
  message: string;
  channel_name: string;
  author_name: string;
  created_at: string;
  is_important: boolean;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: "root",
})
export class TeamNotificationService {
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);
  private notificationState = inject(NotificationStateService);
  private toastService = inject(ToastService);

  // Realtime channels
  private notificationChannel: RealtimeChannel | null = null;
  private activityChannel: RealtimeChannel | null = null;

  // State
  private readonly _activityFeed = signal<CoachActivityItem[]>([]);
  private readonly _unreadAnnouncements = signal<UnreadAnnouncement[]>([]);
  private readonly _loading = signal(false);

  // Public signals
  readonly activityFeed = computed(() => this._activityFeed());
  readonly unreadAnnouncements = computed(() => this._unreadAnnouncements());
  readonly loading = computed(() => this._loading());

  readonly unreadActivityCount = computed(
    () => this._activityFeed().filter((a) => !a.is_read).length,
  );

  readonly hasUnreadAnnouncements = computed(
    () => this._unreadAnnouncements().length > 0,
  );

  // Group activities by date
  readonly groupedActivityFeed = computed(() => {
    const activities = this._activityFeed();
    const groups: Map<string, CoachActivityItem[]> = new Map();

    activities.forEach((activity) => {
      const date = formatDate(activity.created_at, "P");
      const existing = groups.get(date) || [];
      groups.set(date, [...existing, activity]);
    });

    return Array.from(groups.entries()).map(([date, items]) => ({
      date,
      items,
    }));
  });

  constructor() {
    // Auto-subscribe when user logs in
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.initializeSubscriptions();
      } else {
        this.cleanup();
      }
    });
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize realtime subscriptions for notifications
   */
  private async initializeSubscriptions(): Promise<void> {
    const userId = this.authService.getUser()?.id;
    if (!userId) return;

    this.logger.debug("Initializing team notification subscriptions");

    // Subscribe to notifications table
    this.subscribeToNotifications(userId);

    // If coach, subscribe to activity feed
    const isCoach = await this.checkIsCoach();
    if (isCoach) {
      await this.subscribeToActivityFeed();
    }

    // Load initial data
    await this.loadUnreadAnnouncements();
  }

  /**
   * Subscribe to user's notifications in realtime
   */
  private subscribeToNotifications(userId: string): void {
    if (this.notificationChannel) {
      this.supabase.client.removeChannel(this.notificationChannel);
    }

    this.notificationChannel = this.supabase.client
      .channel(`notifications:${userId}`)
      .on<AppNotification>(
        REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
        {
          event: REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.INSERT,
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<AppNotification>) => {
          this.handleNewNotification(payload.new as AppNotification);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          this.logger.success("Subscribed to notifications");
        }
      });
  }

  /**
   * Subscribe to coach activity feed in realtime
   */
  private async subscribeToActivityFeed(): Promise<void> {
    const userId = this.authService.getUser()?.id;
    if (!userId) return;

    // Get coach's team(s)
    const { data: teams } = await this.supabase.client
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId)
      .in("role", ["coach", "assistant_coach"]);

    if (!teams || teams.length === 0) return;

    const teamIds = teams.map((t) => t.team_id);

    if (this.activityChannel) {
      this.supabase.client.removeChannel(this.activityChannel);
    }

    // Subscribe to activity for all coach's teams
    this.activityChannel = this.supabase.client
      .channel(`activity:${userId}`)
      .on<CoachActivityItem>(
        REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
        {
          event: REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.INSERT,
          schema: "public",
          table: "coach_activity_log",
        },
        (payload: RealtimePostgresChangesPayload<CoachActivityItem>) => {
          const activity = payload.new as CoachActivityItem;
          // Only show if it's for one of coach's teams
          if (teamIds.includes(activity.team_id)) {
            this.handleNewActivity(activity);
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          this.logger.success("Subscribed to activity feed");
        }
      });

    // Load initial activity
    await this.loadActivityFeed(teamIds);
  }

  // ============================================================================
  // NOTIFICATION HANDLERS
  // ============================================================================

  /**
   * Handle incoming notification
   */
  private handleNewNotification(notification: AppNotification): void {
    this.logger.info("📬 New notification:", toLogContext(notification.message));

    // Add to state
    this.notificationState.addNotification(notification);

    // Show toast based on priority
    const toastMessage = notification.message || "New notification";

    switch (notification.priority) {
      case "high":
        this.toastService.error(toastMessage, {
          life: 10000,
          sticky: true,
        });
        // Also show browser notification if permitted
        this.showBrowserNotification(notification);
        break;
      case "medium":
        this.toastService.warn(toastMessage, { life: 5000 });
        break;
      default:
        this.toastService.info(toastMessage, { life: 3000 });
    }
  }

  /**
   * Handle new activity item
   */
  private handleNewActivity(activity: CoachActivityItem): void {
    this.logger.info("📊 New activity:", toLogContext(activity.title));

    // Add to feed
    this._activityFeed.update((feed) => [activity, ...feed]);

    // Show toast for important activities
    if (
      activity.activity_type === "stats_uploaded" ||
      activity.activity_type === "injury_reported"
    ) {
      this.toastService.info(activity.title, { life: 5000 });
    }
  }

  /**
   * Show browser notification (if permitted)
   */
  private async showBrowserNotification(
    notification: AppNotification,
  ): Promise<void> {
    if (!("Notification" in window)) return;

    // Use window.Notification to reference the browser's Notification API
    if (window.Notification.permission === "granted") {
      new window.Notification(notification.type || "FlagFit Pro", {
        body: notification.message,
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-72.png",
        tag: notification.id,
      });
    } else if (window.Notification.permission !== "denied") {
      const permission = await window.Notification.requestPermission();
      if (permission === "granted") {
        this.showBrowserNotification(notification);
      }
    }
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  /**
   * Load activity feed for coach
   */
  async loadActivityFeed(teamIds?: string[]): Promise<CoachActivityItem[]> {
    this._loading.set(true);

    try {
      const userId = this.authService.getUser()?.id;
      if (!userId) return [];

      // Get team IDs if not provided
      if (!teamIds) {
        const { data: teams } = await this.supabase.client
          .from("team_members")
          .select("team_id")
          .eq("user_id", userId)
          .in("role", ["coach", "assistant_coach"]);

        teamIds = teams?.map((t) => t.team_id) || [];
      }

      if (teamIds.length === 0) return [];

      // Type for auth.users join - Supabase can't parse this automatically
      interface ActivityWithPlayer {
        id: string;
        team_id: string;
        coach_id: string | null;
        player_id: string | null;
        activity_type: string;
        title: string;
        description: string | null;
        data: Record<string, unknown> | null;
        is_read: boolean;
        read_at: string | null;
        created_at: string;
        player: {
          id: string;
          email: string;
          raw_user_meta_data: Record<string, unknown>;
        } | null;
      }

      const { data, error } = (await this.supabase.client
        .from("coach_activity_log")
        .select(
          `
          *,
          player:auth.users!coach_activity_log_player_id_fkey(
            id, email, raw_user_meta_data
          )
        `,
        )
        .in("team_id", teamIds)
        .or(`coach_id.eq.${userId},coach_id.is.null`)
        .order("created_at", { ascending: false })
        .limit(50)) as { data: ActivityWithPlayer[] | null; error: unknown };

      if (error) throw error;

      const activities: CoachActivityItem[] = (data || []).map((a) => ({
        id: a.id,
        team_id: a.team_id,
        coach_id: a.coach_id,
        player_id: a.player_id || "",
        activity_type: a.activity_type as ActivityType,
        title: a.title,
        description: a.description,
        data: a.data || {},
        is_read: a.is_read ?? false,
        read_at: a.read_at,
        created_at: a.created_at,
        player: a.player
          ? {
              id: a.player.id,
              email: a.player.email,
              full_name:
                (a.player.raw_user_meta_data?.["full_name"] as string) ||
                a.player.email,
              avatar_url: a.player.raw_user_meta_data?.["avatar_url"] as
                | string
                | undefined,
              position: a.player.raw_user_meta_data?.["position"] as
                | string
                | undefined,
            }
          : undefined,
      }));

      this._activityFeed.set(activities);
      return activities;
    } catch (error) {
      this.logger.error("Error loading activity feed:", error);
      return [];
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Load unread announcements for current user
   */
  async loadUnreadAnnouncements(): Promise<UnreadAnnouncement[]> {
    try {
      const userId = this.authService.getUser()?.id;
      if (!userId) return [];

      // Get user's teams
      const { data: teams } = await this.supabase.client
        .from("team_members")
        .select("team_id")
        .eq("user_id", userId)
        .eq("status", "active");

      if (!teams || teams.length === 0) return [];

      const teamIds = teams.map((t) => t.team_id);

      // Get announcement channels
      const { data: channels } = await this.supabase.client
        .from("channels")
        .select("id, name")
        .in("team_id", teamIds)
        .eq("channel_type", "announcements");

      if (!channels || channels.length === 0) return [];

      const channelIds = channels.map((c) => c.id);
      const channelMap = new Map(channels.map((c) => [c.id, c.name]));

      // Get messages user hasn't read
      const { data: readMessages } = await this.supabase.client
        .from("announcement_reads")
        .select("message_id")
        .eq("user_id", userId);

      const readMessageIds = new Set(
        (readMessages || []).map((r) => r.message_id),
      );

      // Get unread announcements
      const { data: messages } = await this.supabase.client
        .from("chat_messages")
        .select(
          `
          id, message, is_important, created_at, channel_id,
          author:users!chat_messages_user_id_fkey(
            id, email, raw_user_meta_data
          )
        `,
        )
        .in("channel_id", channelIds)
        .order("created_at", { ascending: false })
        .limit(20);

      const unread = (messages || [])
        .filter((m) => !readMessageIds.has(m.id))
        .map((m) => ({
          id: m.id,
          message: m.message,
          channel_name: channelMap.get(m.channel_id) || "announcements",
          author_name:
            (
              m.author as {
                raw_user_meta_data?: { full_name?: string };
                email?: string;
              } | null
            )?.raw_user_meta_data?.full_name ||
            (m.author as { email?: string } | null)?.email ||
            "Coach",
          created_at: m.created_at,
          is_important: m.is_important,
        })) as UnreadAnnouncement[];

      this._unreadAnnouncements.set(unread);
      return unread;
    } catch (error) {
      this.logger.error("Error loading unread announcements:", error);
      return [];
    }
  }

  // ============================================================================
  // ACTIVITY ACTIONS
  // ============================================================================

  /**
   * Mark activity item as read
   */
  async markActivityRead(activityId: string): Promise<void> {
    try {
      const { error } = await this.supabase.client
        .from("coach_activity_log")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("id", activityId);

      if (error) throw error;

      this._activityFeed.update((feed) =>
        feed.map((a) =>
          a.id === activityId
            ? { ...a, is_read: true, read_at: new Date().toISOString() }
            : a,
        ),
      );
    } catch (error) {
      this.logger.error("Error marking activity read:", error);
    }
  }

  /**
   * Mark all activity as read
   */
  async markAllActivityRead(): Promise<void> {
    try {
      const userId = this.authService.getUser()?.id;
      if (!userId) return;

      const unreadIds = this._activityFeed()
        .filter((a) => !a.is_read)
        .map((a) => a.id);

      if (unreadIds.length === 0) return;

      const { error } = await this.supabase.client
        .from("coach_activity_log")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .in("id", unreadIds);

      if (error) throw error;

      this._activityFeed.update((feed) =>
        feed.map((a) => ({
          ...a,
          is_read: true,
          read_at: a.read_at || new Date().toISOString(),
        })),
      );

      this.toastService.success(TOAST.SUCCESS.ACTIVITY_MARKED_READ);
    } catch (error) {
      this.logger.error("Error marking all activity read:", error);
    }
  }

  /**
   * Mark announcement as read
   */
  async markAnnouncementRead(messageId: string): Promise<void> {
    try {
      const userId = this.authService.getUser()?.id;
      if (!userId) return;

      await this.supabase.client.from("announcement_reads").upsert(
        {
          message_id: messageId,
          user_id: userId,
          read_at: new Date().toISOString(),
        },
        { onConflict: "message_id,user_id" },
      );

      this._unreadAnnouncements.update((announcements) =>
        announcements.filter((a) => a.id !== messageId),
      );
    } catch (error) {
      this.logger.error("Error marking announcement read:", error);
    }
  }

  // ============================================================================
  // NOTIFICATION CREATION (for manual triggers)
  // ============================================================================

  /**
   * Create a notification for stats upload (called from game tracker)
   */
  async notifyStatsUploaded(
    gameId: string,
    playType: string,
    yardsGained?: number,
  ): Promise<void> {
    // The database trigger handles this automatically,
    // but this can be used for additional client-side notifications
    this.logger.debug("Stats uploaded notification triggered", {
      gameId,
      playType,
      yardsGained,
    });
  }

  /**
   * Create notification for training completion
   */
  async notifyTrainingCompleted(
    sessionType: string,
    duration: number,
    _rpe?: number,
  ): Promise<void> {
    // Database trigger handles coach notifications
    // This shows local confirmation
    this.toastService.success(
      TOAST.SUCCESS.TRAINING_COMPLETED.replace("{type}", sessionType).replace(
        "{duration}",
        duration.toString(),
      ),
      { life: 3000 },
    );
  }

  /**
   * Send a coach announcement with notification
   */
  async sendAnnouncement(
    channelId: string,
    message: string,
    isImportant: boolean = false,
  ): Promise<void> {
    try {
      const userId = this.authService.getUser()?.id;
      if (!userId) throw new Error("Not authenticated");

      // Insert message - database trigger will create notifications
      const { error } = await this.supabase.client
        .from("chat_messages")
        .insert({
          user_id: userId,
          channel_id: channelId,
          channel: `channel-${channelId}`,
          message: message,
          message_type: "text",
          is_important: isImportant,
        });

      if (error) throw error;

      this.toastService.success(
        isImportant
          ? TOAST.SUCCESS.ANNOUNCEMENT_SENT
          : TOAST.SUCCESS.ANNOUNCEMENT_POSTED,
      );
    } catch (error) {
      this.logger.error("Error sending announcement:", error);
      throw error;
    }
  }

  // ============================================================================
  // PREFERENCES
  // ============================================================================

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<TeamNotificationPreferences> {
    try {
      const userId = this.authService.getUser()?.id;
      if (!userId) throw new Error("Not authenticated");

      const { data } = await this.supabase.client
        .from("user_notification_preferences")
        .select("*")
        .eq("user_id", userId);

      // Convert to preferences object
      const prefs: TeamNotificationPreferences = {
        announcements: true,
        mentions: true,
        stats_uploads: true,
        training_completions: true,
        player_alerts: true,
        push_enabled: true,
        email_enabled: false,
      };

      (data || []).forEach((p) => {
        if (p.notification_type === "team" && p.muted) {
          prefs.announcements = false;
        }
        // Add more mappings as needed
      });

      return prefs;
    } catch (error) {
      this.logger.error("Error getting preferences:", error);
      return {
        announcements: true,
        mentions: true,
        stats_uploads: true,
        training_completions: true,
        player_alerts: true,
        push_enabled: true,
        email_enabled: false,
      };
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    prefs: Partial<TeamNotificationPreferences>,
  ): Promise<void> {
    try {
      const userId = this.authService.getUser()?.id;
      if (!userId) throw new Error("Not authenticated");

      // Map preferences to notification types
      const updates = [];

      if (prefs.announcements !== undefined) {
        updates.push({
          user_id: userId,
          notification_type: "team",
          muted: !prefs.announcements,
          push_enabled: prefs.push_enabled ?? true,
        });
      }

      if (updates.length > 0) {
        await this.supabase.client
          .from("user_notification_preferences")
          .upsert(updates, { onConflict: "user_id,notification_type" });
      }

      this.toastService.success(TOAST.SUCCESS.PREFERENCES_UPDATED);
    } catch (error) {
      this.logger.error("Error updating preferences:", error);
      throw error;
    }
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Check if current user is a coach
   */
  private async checkIsCoach(): Promise<boolean> {
    const userId = this.authService.getUser()?.id;
    if (!userId) return false;

    const { data } = await this.supabase.client
      .from("team_members")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["coach", "assistant_coach"])
      .limit(1);

    return (data?.length || 0) > 0;
  }

  /**
   * Get activity icon based on type
   */
  getActivityIcon(type: ActivityType): string {
    switch (type) {
      case "stats_uploaded":
        return "pi pi-chart-bar";
      case "training_completed":
        return "pi pi-check-circle";
      case "wellness_logged":
        return "pi pi-heart";
      case "injury_reported":
        return "pi pi-exclamation-triangle";
      case "achievement_earned":
        return "pi pi-star";
      case "message_sent":
        return "pi pi-comments";
      default:
        return "pi pi-info-circle";
    }
  }

  /**
   * Get activity color based on type
   */
  getActivityColor(type: ActivityType): string {
    switch (type) {
      case "stats_uploaded":
        return "var(--color-brand-primary)";
      case "training_completed":
        return "var(--color-status-success)";
      case "wellness_logged":
        return "var(--color-status-info)";
      case "injury_reported":
        return "var(--color-status-error)";
      case "achievement_earned":
        return "var(--color-status-warning)";
      case "message_sent":
        return "var(--text-secondary)";
      default:
        return "var(--text-secondary)";
    }
  }

  /**
   * Format activity time
   */
  formatActivityTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return formatDate(date, "P");
  }

  /**
   * Cleanup subscriptions
   */
  cleanup(): void {
    if (this.notificationChannel) {
      this.supabase.client.removeChannel(this.notificationChannel);
      this.notificationChannel = null;
    }
    if (this.activityChannel) {
      this.supabase.client.removeChannel(this.activityChannel);
      this.activityChannel = null;
    }

    this._activityFeed.set([]);
    this._unreadAnnouncements.set([]);
  }
}
