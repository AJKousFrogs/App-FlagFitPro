/**
 * Real-Time Service
 *
 * Manages real-time subscriptions for all data entities in the app.
 * Provides a centralized way to subscribe to database changes.
 *
 * MEMORY SAFETY:
 * - Tracks all subscriptions for cleanup
 * - Provides unsubscribeAll() for app-level cleanup
 * - Auto-cleans up on user logout via effect
 * - Prevents duplicate subscriptions
 */

import { Injectable, effect, inject, signal } from "@angular/core";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import {
  REALTIME_LISTEN_TYPES,
  REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
} from "../supabase-realtime-constants";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";

export interface RealtimeEvent<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  new: T;
  old: T;
  errors: unknown;
}

export type RealtimeCallback<
  T extends Record<string, unknown> = Record<string, unknown>,
> = (event: RealtimeEvent<T>) => void;

export interface RealtimeSubscriptionCallbacks<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  onInsert?: (payload: RealtimeEvent<T>) => void;
  onUpdate?: (payload: RealtimeEvent<T>) => void;
  onDelete?: (payload: RealtimeEvent<T>) => void;
}

@Injectable({
  providedIn: "root",
})
export class RealtimeService {
  private supabase = inject(SupabaseService);
  private logger = inject(LoggerService);
  private channels = new Map<string, RealtimeChannel>();
  private channelMeta = new Map<string, { table: string }>();
  private tableSubscriptions = new Map<string, Set<string>>();
  private readonly _subscriptionSummary = signal<Record<string, number>>({});
  readonly subscriptionSummary = this._subscriptionSummary.asReadonly();

  // Connection status
  readonly isConnected = signal(false);
  readonly connectionStatus = signal<
    "connected" | "disconnected" | "connecting"
  >("disconnected");

  // Track last user ID to detect logout
  private lastUserId: string | null = null;

  constructor() {
    this.initializeConnectionStatus();
    this.initializeLogoutCleanup();
  }

  /**
   * MEMORY SAFETY: Clean up all subscriptions when user logs out
   */
  private initializeLogoutCleanup(): void {
    effect(() => {
      const currentUserId = this.supabase.userId();

      // User logged out - clean up all subscriptions
      if (this.lastUserId && !currentUserId) {
        this.logger.info(
          "[Realtime] User logged out, cleaning up all subscriptions",
        );
        this.unsubscribeAll();
      }

      this.lastUserId = currentUserId ?? null;
    });
  }

  /**
   * Monitor connection status using signals + effect()
   * More efficient than subscriptions and zoneless-compatible
   */
  private initializeConnectionStatus() {
    // Use effect() to reactively watch session signal changes
    effect(() => {
      const session = this.supabase.session();
      if (session) {
        this.connectionStatus.set("connected");
        this.isConnected.set(true);
      } else {
        this.connectionStatus.set("disconnected");
        this.isConnected.set(false);
      }
    });
  }

  /**
   * Generic subscribe method for any table
   * Allows subscribing to specific tables with custom callbacks
   */
  subscribe<T extends Record<string, unknown> = Record<string, unknown>>(
    tableName: string,
    filter: string,
    callbacks: RealtimeSubscriptionCallbacks<T>,
  ): () => void {
    const channelName = `${tableName}_${filter}`;

    if (this.channels.has(channelName)) {
      this.logger.warn(
        `Already subscribed to ${channelName}, skipping duplicate subscription`,
      );
      // Return the real unsubscribe function so the caller can clean up the
      // shared channel if they hold the only remaining reference.
      return () => this.unsubscribe(channelName);
    }

    const channel = this.supabase.client
      .channel(channelName)
      .on<T>(
        REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
        {
          event: REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.ALL,
          schema: "public",
          table: tableName,
          filter: filter,
        },
        (payload: RealtimePostgresChangesPayload<T>) => {
          const event: RealtimeEvent<T> = {
            eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
            table: payload.table,
            schema: payload.schema,
            new: payload.new as T,
            old: payload.old as T,
            errors: payload.errors,
          };

          // Call appropriate callback based on event type
          if (payload.eventType === "INSERT" && callbacks.onInsert) {
            callbacks.onInsert(event);
          } else if (payload.eventType === "UPDATE" && callbacks.onUpdate) {
            callbacks.onUpdate(event);
          } else if (payload.eventType === "DELETE" && callbacks.onDelete) {
            callbacks.onDelete(event);
          }
        },
      )
      .subscribe();

    this.channels.set(channelName, channel);
    this.channelMeta.set(channelName, { table: tableName });
    this.incrementTableSubscription(tableName, channelName);
    this.logSubscriptionSummary();
    this.logger.debug(`Subscribed to ${channelName}`);

    return () => this.unsubscribe(channelName);
  }

  /**
   * Subscribe to training sessions changes
   */
  subscribeToTrainingSessions(callback: RealtimeCallback): () => void {
    // Use signal instead of property access
    const userId = this.supabase.currentUser()?.id;
    if (!userId) {
      this.logger.warn("Cannot subscribe: No user logged in");
      return () => {};
    }

    return this.createSubscription(
      "training_sessions",
      "training_sessions",
      `user_id=eq.${userId}`,
      callback,
    );
  }

  /**
   * Subscribe to games/matches changes
   */
  subscribeToGames(callback: RealtimeCallback): () => void {
    const userId = this.supabase.currentUser()?.id;
    if (!userId) {
      this.logger.warn("Cannot subscribe: No user logged in");
      return () => {};
    }

    return this.createSubscription(
      "games",
      "games",
      `user_id=eq.${userId}`,
      callback,
    );
  }

  /**
   * Subscribe to wellness data changes
   */
  subscribeToWellness(callback: RealtimeCallback): () => void {
    const userId = this.supabase.currentUser()?.id;
    if (!userId) {
      this.logger.warn("Cannot subscribe: No user logged in");
      return () => {};
    }

    return this.createSubscription(
      "wellness",
      "daily_wellness_checkin",
      `user_id=eq.${userId}`,
      callback,
    );
  }

  /**
   * Subscribe to performance metrics changes
   */
  subscribeToPerformance(callback: RealtimeCallback): () => void {
    const userId = this.supabase.currentUser()?.id;
    if (!userId) {
      this.logger.warn("Cannot subscribe: No user logged in");
      return () => {};
    }

    return this.createSubscription(
      "performance",
      "performance_metrics",
      `athlete_id=eq.${userId}`,
      callback,
    );
  }

  /**
   * Subscribe to team updates (for coaches)
   */
  subscribeToTeamUpdates(
    teamId: string,
    callback: RealtimeCallback,
  ): () => void {
    if (!teamId) {
      this.logger.warn("Cannot subscribe: No team ID provided");
      return () => {};
    }

    return this.createSubscription(
      `team_${teamId}`,
      "team_members",
      `team_id=eq.${teamId}`,
      callback,
    );
  }

  /**
   * Subscribe to ACWR/readiness updates
   */
  subscribeToReadiness(callback: RealtimeCallback): () => void {
    const userId = this.supabase.currentUser()?.id;
    if (!userId) {
      this.logger.warn("Cannot subscribe: No user logged in");
      return () => {};
    }

    return this.createSubscription(
      "readiness",
      "readiness_scores",
      `athlete_id=eq.${userId}`,
      callback,
    );
  }

  /**
   * Subscribe to chat/messages
   */
  subscribeToMessages(
    conversationId: string,
    callback: RealtimeCallback,
  ): () => void {
    if (!conversationId) {
      this.logger.warn("Cannot subscribe: No conversation ID provided");
      return () => {};
    }

    return this.createSubscription(
      `messages_${conversationId}`,
      "messages",
      `conversation_id=eq.${conversationId}`,
      callback,
    );
  }

  /**
   * Subscribe to channel messages (for new chat system)
   */
  subscribeToChannelMessages(
    channelId: string,
    callback: RealtimeCallback,
  ): () => void {
    if (!channelId) {
      this.logger.warn("Cannot subscribe: No channel ID provided");
      return () => {};
    }

    return this.createSubscription(
      `channel_messages_${channelId}`,
      "chat_messages",
      `channel_id=eq.${channelId}`,
      callback,
    );
  }

  /**
   * Subscribe to notifications for a user
   */
  subscribeToNotifications(callback: RealtimeCallback): () => void {
    const userId = this.supabase.currentUser()?.id;
    if (!userId) {
      this.logger.warn("Cannot subscribe: No user logged in");
      return () => {};
    }

    return this.createSubscription(
      `notifications_${userId}`,
      "notifications",
      `user_id=eq.${userId}`,
      callback,
    );
  }

  /**
   * Subscribe to coach activity log
   */
  subscribeToCoachActivity(
    teamId: string,
    callback: RealtimeCallback,
  ): () => void {
    if (!teamId) {
      this.logger.warn("Cannot subscribe: No team ID provided");
      return () => {};
    }

    return this.createSubscription(
      `coach_activity_${teamId}`,
      "coach_activity_log",
      `team_id=eq.${teamId}`,
      callback,
    );
  }

  /**
   * Subscribe to channel updates (new channels, archived, etc.)
   */
  subscribeToChannels(teamId: string, callback: RealtimeCallback): () => void {
    if (!teamId) {
      this.logger.warn("Cannot subscribe: No team ID provided");
      return () => {};
    }

    return this.createSubscription(
      `channels_${teamId}`,
      "channels",
      `team_id=eq.${teamId}`,
      callback,
    );
  }

  /**
   * Generic subscription creator
   */
  private createSubscription(
    channelName: string,
    tableName: string,
    filter: string,
    callback: RealtimeCallback,
  ): () => void {
    // Check if channel already exists
    if (this.channels.has(channelName)) {
      this.logger.warn(`Channel ${channelName} already exists`);
      // Return a real unsubscribe so the caller can remove the shared channel.
      return () => this.unsubscribe(channelName);
    }

    // Create channel
    const channel = this.supabase.client
      .channel(channelName)
      .on(
        REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
        {
          event: REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.ALL,
          schema: "public",
          table: tableName,
          filter: filter,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const event: RealtimeEvent = {
            eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
            table: payload.table,
            schema: payload.schema,
            new: payload.new,
            old: payload.old,
            errors: payload.errors,
          };
          callback(event);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          this.logger.success(`Subscribed to ${channelName}`);
        } else if (status === "CHANNEL_ERROR") {
          this.logger.error(`Error subscribing to ${channelName}`);
        } else if (status === "CLOSED" || status === "TIMED_OUT") {
          this.logger.warn(`Channel ${channelName} status: ${status}`);
        }
      });

    // Store channel
    this.channels.set(channelName, channel);
    this.channelMeta.set(channelName, { table: tableName });
    this.incrementTableSubscription(tableName, channelName);

    // Return unsubscribe function
    return () => {
      const ch = this.channels.get(channelName);
      if (ch) {
        this.supabase.client.removeChannel(ch);
        this.channels.delete(channelName);
        this.decrementTableSubscription(channelName);
        this.logSubscriptionSummary();
        this.logger.debug(`Unsubscribed from ${channelName}`);
      }
    };
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    this.channels.forEach((channel, name) => {
      this.supabase.client.removeChannel(channel);
      this.logger.debug(`Unsubscribed from ${name}`);
      this.decrementTableSubscription(name);
    });
    this.channels.clear();
    this.channelMeta.clear();
    this.tableSubscriptions.clear();
  }

  /**
   * Unsubscribe from a specific channel
   */
  unsubscribe(channelName: string): void {
    const exactChannel = this.channels.get(channelName);
    if (exactChannel) {
      this.supabase.client.removeChannel(exactChannel);
      this.channels.delete(channelName);
      this.logger.debug(`Unsubscribed from ${channelName}`);
      return;
    }

    const matchedChannels = Array.from(this.channels.entries()).filter(
      ([name]) => name === channelName || name.startsWith(`${channelName}_`),
    );

    matchedChannels.forEach(([name, channel]) => {
      this.supabase.client.removeChannel(channel);
      this.channels.delete(name);
      this.decrementTableSubscription(name);
      this.logSubscriptionSummary();
      this.logger.debug(`Unsubscribed from ${name}`);
    });
  }

  /**
   * Get list of active subscriptions
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Check if subscribed to a specific channel
   */
  isSubscribed(channelName: string): boolean {
    return this.channels.has(channelName);
  }

  /**
   * Get statistics about current subscriptions
   * Useful for debugging memory issues
   */
  getStats(): { channelCount: number; channels: string[] } {
    return {
      channelCount: this.channels.size,
      channels: Array.from(this.channels.keys()),
    };
  }

  private incrementTableSubscription(tableName: string, channelName: string): void {
    if (!tableName) return;

    const set = this.tableSubscriptions.get(tableName) ?? new Set<string>();
    set.add(channelName);
    this.tableSubscriptions.set(tableName, set);

    if (set.size > 3) {
      this.logger.warn(
        `[Realtime] ${tableName} has ${set.size} concurrent subscriptions; verify they are intended`,
      );
    }
  }

  private decrementTableSubscription(channelName: string): void {
    const meta = this.channelMeta.get(channelName);
    if (!meta) return;

    const set = this.tableSubscriptions.get(meta.table);
    if (!set) return;

    set.delete(channelName);
    if (set.size === 0) {
      this.tableSubscriptions.delete(meta.table);
    } else {
      this.tableSubscriptions.set(meta.table, set);
    }

    this.channelMeta.delete(channelName);
  }

  getSubscriptionSummary(): Record<string, number> {
    const summary: Record<string, number> = {};
    this.tableSubscriptions.forEach((set, table) => {
      summary[table] = set.size;
    });
    return summary;
  }

  private logSubscriptionSummary(): void {
    const summary = this.getSubscriptionSummary();
    this._subscriptionSummary.set(summary);
    if (Object.keys(summary).length === 0) return;
    this.logger.debug("realtime_subscription_summary", summary as object);
  }
}
