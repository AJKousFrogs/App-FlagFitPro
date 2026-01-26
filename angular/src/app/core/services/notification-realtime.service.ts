/**
 * Notification Realtime Service
 *
 * Handles real-time notification subscriptions via Supabase.
 * Split from notification-state.service.ts for single responsibility.
 *
 * Responsibilities:
 * - Real-time channel management
 * - Subscription lifecycle
 * - Connection status tracking
 * - Reconnection logic
 */

import {
  Injectable,
  inject,
  signal,
  OnDestroy,
  DestroyRef,
} from "@angular/core";
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { AuthService } from "./auth.service";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";

export interface RealtimeNotificationPayload {
  id: string;
  type: string;
  title?: string;
  message: string;
  read: boolean;
  created_at: string;
  priority?: "low" | "medium" | "high";
  category?: string;
  severity?: string;
  data?: Record<string, unknown>;
}

export type NotificationChangeType = "INSERT" | "UPDATE" | "DELETE";

export interface NotificationChangeEvent {
  type: NotificationChangeType;
  payload: RealtimeNotificationPayload;
  oldPayload?: RealtimeNotificationPayload;
}

@Injectable({
  providedIn: "root",
})
export class NotificationRealtimeService implements OnDestroy {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);
  private logger = inject(LoggerService);
  private destroyRef = inject(DestroyRef);

  private channel: RealtimeChannel | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  // Reactive state
  private readonly _isConnected = signal(false);
  private readonly _connectionError = signal<string | null>(null);

  // Public signals
  readonly isConnected = this._isConnected.asReadonly();
  readonly connectionError = this._connectionError.asReadonly();

  // Event callbacks
  private onInsertCallback?: (payload: RealtimeNotificationPayload) => void;
  private onUpdateCallback?: (
    payload: RealtimeNotificationPayload,
    old?: RealtimeNotificationPayload,
  ) => void;
  private onDeleteCallback?: (payload: RealtimeNotificationPayload) => void;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.disconnect();
    });
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  /**
   * Subscribe to real-time notification changes
   */
  subscribe(options: {
    onInsert?: (payload: RealtimeNotificationPayload) => void;
    onUpdate?: (
      payload: RealtimeNotificationPayload,
      old?: RealtimeNotificationPayload,
    ) => void;
    onDelete?: (payload: RealtimeNotificationPayload) => void;
  }): void {
    const userId = this.auth.currentUser()?.id;
    if (!userId) {
      this.logger.warn("Cannot subscribe to notifications - not authenticated");
      return;
    }

    // Store callbacks
    this.onInsertCallback = options.onInsert;
    this.onUpdateCallback = options.onUpdate;
    this.onDeleteCallback = options.onDelete;

    // Disconnect existing channel
    this.disconnect();

    // Create new channel
    this.channel = this.supabase.client
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (
          payload: RealtimePostgresChangesPayload<RealtimeNotificationPayload>,
        ) => {
          this.handleRealtimeEvent(payload);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          this._isConnected.set(true);
          this._connectionError.set(null);
          this.reconnectAttempts = 0;
          this.logger.info("Subscribed to notification realtime channel");
        } else if (status === "CHANNEL_ERROR") {
          this._isConnected.set(false);
          this._connectionError.set("Channel error occurred");
          this.scheduleReconnect();
        } else if (status === "TIMED_OUT") {
          this._isConnected.set(false);
          this._connectionError.set("Connection timed out");
          this.scheduleReconnect();
        }
      });
  }

  /**
   * Disconnect from real-time channel
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.channel) {
      this.supabase.client.removeChannel(this.channel);
      this.channel = null;
    }

    this._isConnected.set(false);
  }

  /**
   * Manually trigger reconnection
   */
  async reconnect(): Promise<void> {
    this.reconnectAttempts = 0;
    this.disconnect();

    // Small delay before reconnecting
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (
      this.onInsertCallback ||
      this.onUpdateCallback ||
      this.onDeleteCallback
    ) {
      this.subscribe({
        onInsert: this.onInsertCallback,
        onUpdate: this.onUpdateCallback,
        onDelete: this.onDeleteCallback,
      });
    }
  }

  /**
   * Handle real-time events
   */
  private handleRealtimeEvent(
    payload: RealtimePostgresChangesPayload<RealtimeNotificationPayload>,
  ): void {
    const eventType = payload.eventType as NotificationChangeType;

    switch (eventType) {
      case "INSERT":
        if (payload.new && this.onInsertCallback) {
          this.onInsertCallback(payload.new as RealtimeNotificationPayload);
        }
        break;

      case "UPDATE":
        if (payload.new && this.onUpdateCallback) {
          this.onUpdateCallback(
            payload.new as RealtimeNotificationPayload,
            payload.old as RealtimeNotificationPayload | undefined,
          );
        }
        break;

      case "DELETE":
        if (payload.old && this.onDeleteCallback) {
          this.onDeleteCallback(payload.old as RealtimeNotificationPayload);
        }
        break;
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.warn("Max reconnect attempts reached for notifications");
      this._connectionError.set("Failed to reconnect after multiple attempts");
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    this.logger.info(
      `Scheduling notification reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`,
    );

    this.reconnectTimeout = setTimeout(() => {
      this.reconnect();
    }, delay);
  }
}
