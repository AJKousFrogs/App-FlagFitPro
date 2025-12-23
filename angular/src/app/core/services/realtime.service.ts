/**
 * Real-Time Service
 *
 * Manages real-time subscriptions for all data entities in the app.
 * Provides a centralized way to subscribe to database changes.
 */

import { Injectable, inject, signal, effect } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { RealtimeChannel } from "@supabase/supabase-js";
import { LoggerService } from "./logger.service";

export interface RealtimeEvent<T = any> {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  new: T;
  old: T;
  errors: any;
}

export type RealtimeCallback<T = any> = (event: RealtimeEvent<T>) => void;

@Injectable({
  providedIn: "root",
})
export class RealtimeService {
  private supabase = inject(SupabaseService);
  private logger = inject(LoggerService);
  private channels = new Map<string, RealtimeChannel>();

  // Connection status
  readonly isConnected = signal(false);
  readonly connectionStatus = signal<
    "connected" | "disconnected" | "connecting"
  >("disconnected");

  constructor() {
    this.initializeConnectionStatus();
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
      "wellness_entries",
      `athlete_id=eq.${userId}`,
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
      return () => {};
    }

    // Create channel
    const channel = this.supabase.client
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: tableName,
          filter: filter,
        },
        (payload: any) => {
          const event: RealtimeEvent = {
            eventType: payload.eventType,
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
        }
      });

    // Store channel
    this.channels.set(channelName, channel);

    // Return unsubscribe function
    return () => {
      const ch = this.channels.get(channelName);
      if (ch) {
        this.supabase.client.removeChannel(ch);
        this.channels.delete(channelName);
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
    });
    this.channels.clear();
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
}
