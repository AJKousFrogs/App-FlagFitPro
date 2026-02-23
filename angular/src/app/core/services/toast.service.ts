/**
 *Notification Service
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
import type { ToastMessageOptions } from "primeng/api";
import { MessageService } from "primeng/api";

export interface ToastOptions {
  severity?: "success" | "info" | "warn" | "warning" | "error";
  summary?: string;
  detail?: string;
  life?: number;
  sticky?: boolean;
  closable?: boolean;
  key?: string;
}

/**
 * Options that can be passed as second argument to toast methods
 */
export interface ToastMethodOptions {
  life?: number;
  sticky?: boolean;
  summary?: string;
  key?: string;
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
const DEFAULT_TOAST_KEY = "app-toast";

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
    const { summary, lifeMs, sticky, key } = this.parseArgs(
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
      key,
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
    const { summary, lifeMs, sticky, key } = this.parseArgs(
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
      key,
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
    const { summary, lifeMs, sticky, key } = this.parseArgs(
      summaryOrOptions,
      "Warning",
      life,
    );
    this.addWithDedup({
      severity: "warn",
      summary,
      detail,
      life: lifeMs,
      sticky,
      key,
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
    const { summary, lifeMs, sticky, key } = this.parseArgs(
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
      key,
    });
  }

  /**
   * Parse arguments to support both old and new API signatures
   */
  private parseArgs(
    summaryOrOptions: string | ToastMethodOptions | undefined,
    defaultSummary: string,
    defaultLife: number,
  ): { summary: string; lifeMs: number; sticky?: boolean; key?: string } {
    if (typeof summaryOrOptions === "string") {
      return { summary: summaryOrOptions, lifeMs: defaultLife };
    }
    if (typeof summaryOrOptions === "object") {
      return {
        summary: summaryOrOptions.summary || defaultSummary,
        lifeMs: summaryOrOptions.life ?? defaultLife,
        sticky: summaryOrOptions.sticky,
        key: summaryOrOptions.key,
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
      severity: this.normalizeSeverity(options.severity || "info"),
      summary: this.normalizeText(options.summary || ""),
      detail: this.normalizeText(options.detail),
      life: options.life || 3000,
      sticky: options.sticky,
      closable: options.closable,
      key: options.key || DEFAULT_TOAST_KEY,
    });
  }

  /**
   * Add a toast with deduplication
   * Prevents duplicate messages within DEDUP_WINDOW_MS
   * Limits max visible toasts to MAX_VISIBLE_TOASTS
   */
  private addWithDedup(message: ToastMessageOptions): void {
    const normalizedMessage: ToastMessageOptions = {
      ...message,
      severity: this.normalizeSeverity(message.severity || "info"),
      summary: this.normalizeText(message.summary || ""),
      detail: this.normalizeText(message.detail),
      key: message.key || DEFAULT_TOAST_KEY,
    };

    if (!normalizedMessage.summary && !normalizedMessage.detail) {
      return;
    }

    if (normalizedMessage.summary && !normalizedMessage.detail) {
      normalizedMessage.detail = normalizedMessage.summary;
      normalizedMessage.summary = this.defaultSummaryForSeverity(
        normalizedMessage.severity || "info",
      );
    }

    // Create a unique key for this message
    const key = `${normalizedMessage.severity}:${normalizedMessage.summary}:${normalizedMessage.detail || ""}`;
    const now = Date.now();

    // Check for duplicate within dedup window
    const lastShown = this.recentMessages.get(key);
    if (lastShown && now - lastShown < DEDUP_WINDOW_MS) {
      // Duplicate within window, skip
      return;
    }

    // Check max visible limit
    if (this.visibleCount >= MAX_VISIBLE_TOASTS) {
      // Keep the UI responsive under toast floods.
      this.messageService.clear(normalizedMessage.key);
      this.visibleCount = 0;
    }

    // Track this message
    this.recentMessages.set(key, now);
    this.visibleCount++;

    // Schedule cleanup
    const lifeMs = normalizedMessage.life || 3000;
    if (!normalizedMessage.sticky) {
      setTimeout(() => {
        this.visibleCount = Math.max(0, this.visibleCount - 1);
      }, lifeMs);
    }

    // Clean up old entries from recentMessages map
    this.cleanupOldEntries(now);

    // Add the message
    this.messageService.add(normalizedMessage);
  }

  private normalizeText(value?: string): string | undefined {
    if (value === undefined) {
      return undefined;
    }
    return value.trim().replace(/\s+/g, " ");
  }

  private normalizeSeverity(
    severity: string,
  ): "success" | "info" | "warn" | "error" {
    if (severity === "warning") {
      return "warn";
    }
    if (severity === "success" || severity === "info" || severity === "warn" || severity === "error") {
      return severity;
    }
    return "info";
  }

  private defaultSummaryForSeverity(severity: string): string {
    switch (severity) {
      case "success":
        return "Success";
      case "warn":
        return "Warning";
      case "error":
        return "Error";
      default:
        return "Info";
    }
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
    this.messageService.clear(DEFAULT_TOAST_KEY);
    this.visibleCount = 0;
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
    this.visibleCount = 0;
  }
}
