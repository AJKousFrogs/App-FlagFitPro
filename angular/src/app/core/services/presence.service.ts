/**
 * Presence Service
 *
 * Manages real-time presence tracking for users in channels and the app.
 * Uses Supabase Realtime Presence to track who is online and in which channel.
 *
 * Features:
 * - Track users viewing a specific channel
 * - Global online status for team members
 * - Automatic cleanup on disconnect
 * - Idle detection (optional)
 */

import { Injectable, inject, signal, computed, OnDestroy } from "@angular/core";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";
import { TIMEOUTS } from "../constants/app.constants";
import { formatDate } from "../../shared/utils/date.utils";

// ============================================================================
// TYPES
// ============================================================================

export interface PresenceState {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  status: "online" | "away" | "offline";
  current_channel_id: string | null;
  last_seen: string;
  presence_ref?: string;
}

export interface ChannelPresence {
  channel_id: string;
  online_users: PresenceState[];
  online_count: number;
}

export interface TeamPresence {
  team_id: string;
  online_users: Map<string, PresenceState>;
  online_count: number;
  away_count: number;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: "root",
})
export class PresenceService implements OnDestroy {
  private supabase = inject(SupabaseService);
  private logger = inject(LoggerService);

  // Presence channels
  private teamPresenceChannel: RealtimeChannel | null = null;
  private channelPresenceChannels = new Map<string, RealtimeChannel>();

  // Idle detection
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly IDLE_TIMEOUT_MS = TIMEOUTS.IDLE_TIMEOUT;
  private readonly idleActivityHandler = () => this.resetIdleTimer();
  private readonly visibilityChangeHandler = () => {
    if (document.hidden) {
      if (this.idleTimer) {
        clearTimeout(this.idleTimer);
      }
      this.idleTimer = setTimeout(() => {
        this.setStatus("away");
      }, 30000);
    } else {
      this.resetIdleTimer();
    }
  };

  // State
  private readonly _myPresence = signal<PresenceState | null>(null);
  private readonly _teamPresence = signal<Map<string, PresenceState>>(
    new Map(),
  );
  private readonly _channelPresence = signal<Map<string, PresenceState[]>>(
    new Map(),
  );
  private readonly _isTracking = signal(false);

  // Public computed signals
  readonly myPresence = computed(() => this._myPresence());
  readonly teamOnlineUsers = computed(() =>
    Array.from(this._teamPresence().values()),
  );
  readonly teamOnlineCount = computed(
    () =>
      Array.from(this._teamPresence().values()).filter(
        (u) => u.status === "online",
      ).length,
  );
  readonly isTracking = computed(() => this._isTracking());

  constructor() {
    // Setup idle detection listeners
    if (typeof window !== "undefined") {
      this.setupIdleDetection();
    }
  }

  ngOnDestroy(): void {
    this.stopTracking();
    this.cleanupIdleDetection();
  }

  // ============================================================================
  // TEAM-WIDE PRESENCE
  // ============================================================================

  /**
   * Start tracking presence for a team
   * This creates a shared presence channel for all team members
   */
  async startTeamPresence(teamId: string): Promise<void> {
    if (this._isTracking()) {
      this.logger.warn("Already tracking presence");
      return;
    }

    const user = this.supabase.currentUser();
    if (!user) {
      this.logger.warn("Cannot start presence: No user logged in");
      return;
    }

    try {
      // Get user metadata for display
      const metadata =
        (user as { user_metadata?: Record<string, unknown> }).user_metadata ||
        {};

      const myPresence: PresenceState = {
        user_id: user.id,
        full_name:
          (metadata.full_name as string) ||
          user.email?.split("@")[0] ||
          "Unknown",
        avatar_url: (metadata.avatar_url as string) || null,
        role: (metadata.role as string) || "player",
        status: "online",
        current_channel_id: null,
        last_seen: new Date().toISOString(),
      };

      this._myPresence.set(myPresence);

      // Create team presence channel
      const channelName = `presence:team:${teamId}`;

      this.teamPresenceChannel = this.supabase.client
        .channel(channelName, {
          config: {
            presence: {
              key: user.id,
            },
          },
        })
        .on("presence", { event: "sync" }, () => {
          this.handleTeamPresenceSync();
        })
        .on("presence", { event: "join" }, ({ key, newPresences }) => {
          this.handleTeamPresenceJoin(key, newPresences);
        })
        .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
          this.handleTeamPresenceLeave(key, leftPresences);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            // Track my presence
            await this.teamPresenceChannel?.track(myPresence);
            this._isTracking.set(true);
            this.logger.success(`Started presence tracking for team ${teamId}`);
          }
        });
    } catch (error) {
      this.logger.error("Error starting team presence:", error);
    }
  }

  /**
   * Stop tracking team presence
   */
  async stopTracking(): Promise<void> {
    if (this.teamPresenceChannel) {
      await this.teamPresenceChannel.untrack();
      this.supabase.client.removeChannel(this.teamPresenceChannel);
      this.teamPresenceChannel = null;
    }

    // Clean up channel presence subscriptions
    this.channelPresenceChannels.forEach((channel) => {
      this.supabase.client.removeChannel(channel);
    });
    this.channelPresenceChannels.clear();

    this._isTracking.set(false);
    this._teamPresence.set(new Map());
    this._channelPresence.set(new Map());
    this._myPresence.set(null);

    this.logger.debug("Stopped presence tracking");
  }

  /**
   * Update my current channel (when entering/leaving a channel)
   */
  async setCurrentChannel(channelId: string | null): Promise<void> {
    const current = this._myPresence();
    if (!current || !this.teamPresenceChannel) return;

    const updated: PresenceState = {
      ...current,
      current_channel_id: channelId,
      last_seen: new Date().toISOString(),
    };

    this._myPresence.set(updated);
    await this.teamPresenceChannel.track(updated);
  }

  /**
   * Update my status (online/away)
   */
  async setStatus(status: "online" | "away"): Promise<void> {
    const current = this._myPresence();
    if (!current || !this.teamPresenceChannel) return;

    const updated: PresenceState = {
      ...current,
      status,
      last_seen: new Date().toISOString(),
    };

    this._myPresence.set(updated);
    await this.teamPresenceChannel.track(updated);
  }

  // ============================================================================
  // CHANNEL-SPECIFIC PRESENCE
  // ============================================================================

  /**
   * Get users currently viewing a specific channel
   */
  getChannelOnlineUsers(channelId: string): PresenceState[] {
    const channelPresence = this._channelPresence().get(channelId);
    return channelPresence || [];
  }

  /**
   * Get online count for a specific channel
   */
  getChannelOnlineCount(channelId: string): number {
    return this.getChannelOnlineUsers(channelId).length;
  }

  /**
   * Check if a specific user is online
   */
  isUserOnline(userId: string): boolean {
    const user = this._teamPresence().get(userId);
    return user?.status === "online";
  }

  /**
   * Get a user's current presence state
   */
  getUserPresence(userId: string): PresenceState | undefined {
    return this._teamPresence().get(userId);
  }

  /**
   * Get all online user IDs (for quick lookups)
   */
  getOnlineUserIds(): Set<string> {
    const ids = new Set<string>();
    this._teamPresence().forEach((presence, id) => {
      if (presence.status === "online") {
        ids.add(id);
      }
    });
    return ids;
  }

  // ============================================================================
  // PRESENCE EVENT HANDLERS
  // ============================================================================

  private handleTeamPresenceSync(): void {
    if (!this.teamPresenceChannel) return;

    const state = this.teamPresenceChannel.presenceState<PresenceState>();
    const presenceMap = new Map<string, PresenceState>();

    // Process all presence states
    Object.entries(state).forEach(([userId, presences]) => {
      if (presences && presences.length > 0) {
        // Take the most recent presence for each user
        const latestPresence = presences[presences.length - 1];
        presenceMap.set(userId, latestPresence);
      }
    });

    this._teamPresence.set(presenceMap);
    this.updateChannelPresence(presenceMap);

    this.logger.debug(`Presence sync: ${presenceMap.size} users online`);
  }

  private handleTeamPresenceJoin(
    key: string,
    newPresences: Record<string, unknown>[],
  ): void {
    if (!newPresences || newPresences.length === 0) return;

    const presence = newPresences[0] as unknown as PresenceState;
    const currentMap = new Map(this._teamPresence());
    currentMap.set(key, presence);
    this._teamPresence.set(currentMap);
    this.updateChannelPresence(currentMap);

    this.logger.debug(`User joined: ${presence.full_name}`);
  }

  private handleTeamPresenceLeave(
    key: string,
    leftPresences: Record<string, unknown>[],
  ): void {
    const currentMap = new Map(this._teamPresence());
    currentMap.delete(key);
    this._teamPresence.set(currentMap);
    this.updateChannelPresence(currentMap);

    if (leftPresences && leftPresences.length > 0) {
      const presence = leftPresences[0] as unknown as PresenceState;
      this.logger.debug(`User left: ${presence.full_name}`);
    }
  }

  /**
   * Update channel-specific presence from team presence
   */
  private updateChannelPresence(
    teamPresence: Map<string, PresenceState>,
  ): void {
    const channelMap = new Map<string, PresenceState[]>();

    teamPresence.forEach((presence) => {
      if (presence.current_channel_id) {
        const existing = channelMap.get(presence.current_channel_id) || [];
        existing.push(presence);
        channelMap.set(presence.current_channel_id, existing);
      }
    });

    this._channelPresence.set(channelMap);
  }

  // ============================================================================
  // IDLE DETECTION
  // ============================================================================

  private setupIdleDetection(): void {
    // Listen for user activity
    window.addEventListener("mousemove", this.idleActivityHandler, {
      passive: true,
    });
    window.addEventListener("keydown", this.idleActivityHandler, {
      passive: true,
    });
    window.addEventListener("click", this.idleActivityHandler, {
      passive: true,
    });
    window.addEventListener("touchstart", this.idleActivityHandler, {
      passive: true,
    });
    document.addEventListener("scroll", this.idleActivityHandler, {
      passive: true,
      capture: true,
    });

    document.addEventListener(
      "visibilitychange",
      this.visibilityChangeHandler,
    );

    // Initial timer
    this.resetIdleTimer();
  }

  private cleanupIdleDetection(): void {
    window.removeEventListener("mousemove", this.idleActivityHandler);
    window.removeEventListener("keydown", this.idleActivityHandler);
    window.removeEventListener("click", this.idleActivityHandler);
    window.removeEventListener("touchstart", this.idleActivityHandler);
    document.removeEventListener("scroll", this.idleActivityHandler, true);
    document.removeEventListener(
      "visibilitychange",
      this.visibilityChangeHandler,
    );

    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  private resetIdleTimer(): void {
    if (this._myPresence()?.status === "away") {
      this.setStatus("online");
    }

    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    this.idleTimer = setTimeout(() => {
      if (this._myPresence()?.status === "online") {
        this.setStatus("away");
        this.logger.debug("User idle - marked as away");
      }
    }, this.IDLE_TIMEOUT_MS);
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Format "last seen" for display
   */
  formatLastSeen(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24) return `${diffHours}h ago`;

    return formatDate(date, "P");
  }
}
