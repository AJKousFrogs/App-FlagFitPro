/**
 * Push Notification Service
 *
 * Handles push notifications using the Web Push API and service workers.
 * Integrates with Supabase for storing push subscriptions.
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";
import { toLogContext } from "./logger.service";
import { ToastService } from "./toast.service";
import { TOAST } from "../constants/toast-messages.constants";
import { environment } from "../../../environments/environment";

export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
}

export type NotificationPermissionState = "default" | "granted" | "denied";

@Injectable({
  providedIn: "root",
})
export class PushNotificationService {
  private supabase = inject(SupabaseService);
  private logger = inject(LoggerService);
  private toastService = inject(ToastService);

  // State
  private readonly _permission = signal<NotificationPermissionState>("default");
  private readonly _isSupported = signal<boolean>(false);
  private readonly _isSubscribed = signal<boolean>(false);
  private readonly _subscription = signal<PushSubscription | null>(null);

  // Public readonly signals
  readonly permission = this._permission.asReadonly();
  readonly isSupported = this._isSupported.asReadonly();
  readonly isSubscribed = this._isSubscribed.asReadonly();

  readonly canSubscribe = computed(
    () =>
      this._isSupported() &&
      this._permission() !== "denied" &&
      !this._isSubscribed(),
  );

  readonly isEnabled = computed(
    () =>
      this._isSupported() &&
      this._permission() === "granted" &&
      this._isSubscribed(),
  );

  // VAPID public key - from environment configuration
  // Fallback to hardcoded value for development only
  private readonly VAPID_PUBLIC_KEY =
    environment.vapidPublicKey ||
    "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the push notification service
   */
  private async initialize(): Promise<void> {
    // Check if push notifications are supported
    if (!("Notification" in window)) {
      this.logger.warn("Push notifications not supported in this browser");
      this._isSupported.set(false);
      return;
    }

    if (!("serviceWorker" in navigator)) {
      this.logger.warn("Service workers not supported");
      this._isSupported.set(false);
      return;
    }

    if (!("PushManager" in window)) {
      this.logger.warn("Push API not supported");
      this._isSupported.set(false);
      return;
    }

    this._isSupported.set(true);
    this._permission.set(
      Notification.permission as NotificationPermissionState,
    );

    // Check for existing subscription
    await this.checkExistingSubscription();
  }

  /**
   * Check for existing push subscription
   */
  private async checkExistingSubscription(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        this._subscription.set(subscription);
        this._isSubscribed.set(true);
        this.logger.info("Existing push subscription found");
      }
    } catch (error) {
      this.logger.error("Error checking existing subscription:", error);
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermissionState> {
    if (!this._isSupported()) {
      return "denied";
    }

    try {
      const permission = await Notification.requestPermission();
      this._permission.set(permission as NotificationPermissionState);

      if (permission === "granted") {
        this.logger.info("Notification permission granted");
      } else if (permission === "denied") {
        this.logger.warn("Notification permission denied");
        this.toastService.warn(
          "Notifications blocked. Enable them in your browser settings to receive updates.",
        );
      }

      return permission as NotificationPermissionState;
    } catch (error) {
      this.logger.error("Error requesting permission:", error);
      return "denied";
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<boolean> {
    if (!this._isSupported()) {
      this.toastService.error(
        "Push notifications are not supported in this browser",
      );
      return false;
    }

    // Request permission if not already granted
    if (this._permission() !== "granted") {
      const permission = await this.requestPermission();
      if (permission !== "granted") {
        return false;
      }
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          this.VAPID_PUBLIC_KEY,
        ) as BufferSource,
      });

      this._subscription.set(subscription);
      this._isSubscribed.set(true);

      // Save subscription to Supabase
      await this.saveSubscription(subscription);

      this.logger.info("Push subscription successful");
      this.toastService.success(TOAST.SUCCESS.PUSH_ENABLED);

      return true;
    } catch (error) {
      this.logger.error("Push subscription failed:", error);

      if (error instanceof DOMException && error.name === "NotAllowedError") {
        this.toastService.error(TOAST.ERROR.PUSH_DENIED);
      } else {
        this.toastService.error(TOAST.ERROR.PUSH_FAILED);
      }

      return false;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    const subscription = this._subscription();

    if (!subscription) {
      this._isSubscribed.set(false);
      return true;
    }

    try {
      await subscription.unsubscribe();

      // Remove subscription from Supabase
      await this.removeSubscription(subscription);

      this._subscription.set(null);
      this._isSubscribed.set(false);

      this.logger.info("Push subscription cancelled");
      this.toastService.success(TOAST.SUCCESS.PUSH_DISABLED);

      return true;
    } catch (error) {
      this.logger.error("Error unsubscribing:", error);
      this.toastService.error(TOAST.ERROR.PUSH_FAILED);
      return false;
    }
  }

  /**
   * Show a local notification (doesn't require push subscription)
   */
  async showNotification(options: PushNotificationOptions): Promise<boolean> {
    if (!this._isSupported()) {
      return false;
    }

    if (this._permission() !== "granted") {
      const permission = await this.requestPermission();
      if (permission !== "granted") {
        return false;
      }
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Note: 'actions' is only supported in service workers, not in showNotification
      await registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || "/assets/icons/icon-192x192.png",
        badge: options.badge || "/assets/icons/badge-72x72.png",
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction,
        silent: options.silent,
        vibrate: options.vibrate || [200, 100, 200],
      } as NotificationOptions);

      return true;
    } catch (error) {
      this.logger.error("Error showing notification:", error);
      return false;
    }
  }

  /**
   * Save subscription to Supabase
   */
  private async saveSubscription(
    subscription: PushSubscription,
  ): Promise<void> {
    try {
      const user = this.supabase.getCurrentUser();
      if (!user) return;

      const subscriptionJson = subscription.toJSON();

      const { error } = await this.supabase.client
        .from("push_subscriptions")
        .upsert({
          user_id: user.id,
          endpoint: subscriptionJson.endpoint,
          p256dh: subscriptionJson.keys?.["p256dh"],
          auth: subscriptionJson.keys?.["auth"],
          user_agent: navigator.userAgent,
          created_at: new Date().toISOString(),
        });

      if (error) {
        // Table might not exist yet
        this.logger.warn(
          "Could not save push subscription:",
          toLogContext(error.message),
        );
      }
    } catch (error) {
      this.logger.error("Error saving subscription:", error);
    }
  }

  /**
   * Remove subscription from Supabase
   */
  private async removeSubscription(
    subscription: PushSubscription,
  ): Promise<void> {
    try {
      const user = this.supabase.getCurrentUser();
      if (!user) return;

      const subscriptionJson = subscription.toJSON();

      const { error } = await this.supabase.client
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id)
        .eq("endpoint", subscriptionJson.endpoint);

      if (error) {
        this.logger.warn(
          "Could not remove push subscription:",
          toLogContext(error.message),
        );
      }
    } catch (error) {
      this.logger.error("Error removing subscription:", error);
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /**
   * Send a test notification
   */
  async sendTestNotification(): Promise<void> {
    await this.showNotification({
      title: "Test Notification",
      body: "Push notifications are working correctly!",
      tag: "test-notification",
      data: { type: "test" },
    });
  }

  /**
   * Notify about training reminder
   */
  async notifyTrainingReminder(
    workoutName: string,
    scheduledTime: string,
  ): Promise<void> {
    await this.showNotification({
      title: "Training Reminder",
      body: `Time for ${workoutName}! Scheduled for ${scheduledTime}`,
      tag: "training-reminder",
      data: { type: "training", workout: workoutName },
      actions: [
        { action: "start", title: "Start Workout" },
        { action: "snooze", title: "Snooze 15min" },
      ],
      requireInteraction: true,
    });
  }

  /**
   * Notify about team update
   */
  async notifyTeamUpdate(message: string): Promise<void> {
    await this.showNotification({
      title: "Team Update",
      body: message,
      tag: "team-update",
      data: { type: "team" },
    });
  }

  /**
   * Notify about new message
   */
  async notifyNewMessage(senderName: string, preview: string): Promise<void> {
    await this.showNotification({
      title: `New message from ${senderName}`,
      body: preview,
      tag: `message-${senderName}`,
      data: { type: "message", sender: senderName },
      actions: [
        { action: "reply", title: "Reply" },
        { action: "view", title: "View" },
      ],
    });
  }

  /**
   * Notify about achievement
   */
  async notifyAchievement(
    achievementName: string,
    description: string,
  ): Promise<void> {
    await this.showNotification({
      title: "Achievement Unlocked!",
      body: `${achievementName}: ${description}`,
      tag: "achievement",
      data: { type: "achievement", name: achievementName },
      vibrate: [100, 50, 100, 50, 100],
    });
  }
}
