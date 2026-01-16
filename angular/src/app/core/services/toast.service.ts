/**
 * Toast Notification Service
 *
 * Centralized service for displaying toast notifications using PrimeNG MessageService.
 * Provides simple, type-safe methods for common notification types.
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

@Injectable({
  providedIn: "root",
})
export class ToastService {
  private messageService = inject(MessageService);

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
    this.messageService.add({
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
    this.messageService.add({
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
    this.messageService.add({
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
    this.messageService.add({
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
    this.messageService.add({
      severity: options.severity || "info",
      summary: options.summary || "",
      detail: options.detail,
      life: options.life || 3000,
      sticky: options.sticky,
      closable: options.closable,
    });
  }

  /**
   * Clear all notifications
   */
  clear(): void {
    if (!this.messageService || typeof this.messageService.clear !== "function") {
      return;
    }
    this.messageService.clear();
  }

  /**
   * Clear a specific notification by key
   * @param key - The key of the notification to clear
   */
  clearByKey(key: string): void {
    if (!this.messageService || typeof this.messageService.clear !== "function") {
      return;
    }
    this.messageService.clear(key);
  }
}
