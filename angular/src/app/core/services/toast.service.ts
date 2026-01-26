/**
 * Toast Notification Service
 *
 * Centralized service for displaying toast notifications using PrimeNG MessageService.
 * Provides simple, type-safe methods for common notification types.
 *
 * UX AUDIT FIX: Added deduplication to prevent toast stacking on rapid failures.
 * - Tracks recent messages to prevent duplicates within 2 seconds
 * - Limits max visible toasts to prevent UI overflow
 *
 * @example
 * ```typescript
 * constructor(private toastService = inject(ToastService)) {}
 *
 * // Success notification
 * this.toastService.success('Data saved successfully!');
 *
 * // Error notification
 * this.toastService.error('Failed to save data');
 *
 * // Custom notification
 * this.toastService.show({
 *   severity: 'info',
 *   summary: 'Custom',
 *   detail: 'Custom message',
 *   life: 5000
 * });
 * ```
 */

import { Injectable, inject } from "@angular/core";
import { MessageService } from "primeng/api";

export interface ToastOptions {
  severity?: "success" | "info" | "warning" | "error";
  summary?: string;
  detail?: string;
  life?: number;
  sticky?: boolean;
  closable?: boolean;
}

/**
 * Options that can be passed as second argument to toast methods
 */
export interface ToastMethodOptions {
  life?: number;
  sticky?: boolean;
}

/**
 * Maximum number of toasts that can be visible at once
 * Prevents UI overflow during rapid failure scenarios
 */
const MAX_VISIBLE_TOASTS = 5;

/**
 * Deduplication window in milliseconds
 * Same message within this window will be ignored
 */
const DEDUP_WINDOW_MS = 2000;

@Injectable({
  providedIn: "root",
})
export class ToastService {
  private messageService = inject(MessageService);

  /**
   * Track recent messages to prevent duplicates
   * Map of message key -> timestamp
   */
  private recentMessages = new Map<string, number>();

  /**
   * Current visible toast count (approximate)
   */
  private visibleCount = 0;

  constructor() {}

  /**
   * Show a success notification
   * @param detail - The message to display
   * @param summaryOrOptions - Optional summary string or options object
   * @param life - Optional lifetime in ms (defaults to 3000)
   */
  success(
    detail: string,
    summaryOrOptions?: string | ToastMethodOptions,
    life = 3000,
  ): void {
    const { summary, lifeMs, sticky } = this.parseArgs(
      summaryOrOptions,
      "Success",
      life,
    );
    this.addWithDedup({
      severity: "success",
      summary,
      detail,
      life: lifeMs,
      sticky,
    });
  }

  /**
   * Show an error notification
   * @param detail - The error message to display
   * @param summaryOrOptions - Optional summary string or options object
   * @param life - Optional lifetime in ms (defaults to 5000)
   */
  error(
    detail: string,
    summaryOrOptions?: string | ToastMethodOptions,
    life = 5000,
  ): void {
    const { summary, lifeMs, sticky } = this.parseArgs(
      summaryOrOptions,
      "Error",
      life,
    );
    this.addWithDedup({
      severity: "error",
      summary,
      detail,
      life: lifeMs,
      sticky,
    });
  }

  /**
   * Show a warning notification
   * @param detail - The warning message to display
   * @param summaryOrOptions - Optional summary string or options object
   * @param life - Optional lifetime in ms (defaults to 4000)
   */
  warn(
    detail: string,
    summaryOrOptions?: string | ToastMethodOptions,
    life = 4000,
  ): void {
    const { summary, lifeMs, sticky } = this.parseArgs(
      summaryOrOptions,
      "Warning",
      life,
    );
    this.addWithDedup({
      severity: "warning",
      summary,
      detail,
      life: lifeMs,
      sticky,
    });
  }

  /**
   * Show an info notification
   * @param detail - The info message to display
   * @param summaryOrOptions - Optional summary string or options object
   * @param life - Optional lifetime in ms (defaults to 3000)
   */
  info(
    detail: string,
    summaryOrOptions?: string | ToastMethodOptions,
    life = 3000,
  ): void {
    const { summary, lifeMs, sticky } = this.parseArgs(
      summaryOrOptions,
      "Info",
      life,
    );
    this.addWithDedup({
      severity: "info",
      summary,
      detail,
      life: lifeMs,
      sticky,
    });
  }

  /**
   * Parse arguments to support both old and new API signatures
   */
  private parseArgs(
    summaryOrOptions: string | ToastMethodOptions | undefined,
    defaultSummary: string,
    defaultLife: number,
  ): { summary: string; lifeMs: number; sticky?: boolean } {
    if (typeof summaryOrOptions === "string") {
      return { summary: summaryOrOptions, lifeMs: defaultLife };
    }
    if (typeof summaryOrOptions === "object") {
      return {
        summary: defaultSummary,
        lifeMs: summaryOrOptions.life ?? defaultLife,
        sticky: summaryOrOptions.sticky,
      };
    }
    return { summary: defaultSummary, lifeMs: defaultLife };
  }

  /**
   * Show a custom notification with full options
   * @param options - Full toast options
   */
  show(options: ToastOptions): void {
    this.addWithDedup({
      severity: options.severity || "info",
      summary: options.summary || "",
      detail: options.detail,
      life: options.life || 3000,
      sticky: options.sticky,
      closable: options.closable,
    });
  }

  /**
   * Add a toast with deduplication
   * Prevents duplicate messages within DEDUP_WINDOW_MS
   * Limits max visible toasts to MAX_VISIBLE_TOASTS
   */
  private addWithDedup(message: {
    severity: string;
    summary: string;
    detail?: string;
    life?: number;
    sticky?: boolean;
    closable?: boolean;
  }): void {
    // Create a unique key for this message
    const key = `${message.severity}:${message.summary}:${message.detail || ""}`;
    const now = Date.now();

    // Check for duplicate within dedup window
    const lastShown = this.recentMessages.get(key);
    if (lastShown && now - lastShown < DEDUP_WINDOW_MS) {
      // Duplicate within window, skip
      return;
    }

    // Check max visible limit
    if (this.visibleCount >= MAX_VISIBLE_TOASTS) {
      // Clear oldest messages to make room
      this.messageService.clear();
      this.visibleCount = 0;
    }

    // Track this message
    this.recentMessages.set(key, now);
    this.visibleCount++;

    // Schedule cleanup
    const lifeMs = message.life || 3000;
    setTimeout(() => {
      this.visibleCount = Math.max(0, this.visibleCount - 1);
    }, lifeMs);

    // Clean up old entries from recentMessages map
    this.cleanupOldEntries(now);

    // Add the message
    this.messageService.add(message);
  }

  /**
   * Clean up old entries from the recent messages map
   */
  private cleanupOldEntries(now: number): void {
    for (const [key, timestamp] of this.recentMessages.entries()) {
      if (now - timestamp > DEDUP_WINDOW_MS * 2) {
        this.recentMessages.delete(key);
      }
    }
  }

  /**
   * Clear all notifications
   */
  clear(): void {
    if (
      !this.messageService ||
      typeof this.messageService.clear !== "function"
    ) {
      return;
    }
    this.messageService.clear();
  }

  /**
   * Clear a specific notification by key
   * @param key - The key of the notification to clear
   */
  clearByKey(key: string): void {
    if (
      !this.messageService ||
      typeof this.messageService.clear !== "function"
    ) {
      return;
    }
    this.messageService.clear(key);
  }
}
