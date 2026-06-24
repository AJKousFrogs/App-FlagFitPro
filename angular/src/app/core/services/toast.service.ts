/**
 * Toast notification service — signal-based.
 *
 * Holds an internal `messages` signal (a future <app-toast> outlet can render it)
 * with public API (success/error/warn/info/show/clear) plus dedup + max-visible
 * behaviour.
 */

import { Injectable, signal } from "@angular/core";

export type ToastSeverity = "success" | "info" | "warn" | "error";

export interface ToastOptions {
  severity?: "success" | "info" | "warn" | "warning" | "error";
  summary?: string;
  detail?: string;
  life?: number;
  sticky?: boolean;
  closable?: boolean;
  key?: string;
}

/** Options that can be passed as the second argument to toast methods. */
export interface ToastMethodOptions {
  life?: number;
  sticky?: boolean;
  summary?: string;
  key?: string;
}

export interface ToastItem {
  id: number;
  severity: ToastSeverity;
  summary: string;
  detail?: string;
  life: number;
  sticky?: boolean;
  closable?: boolean;
  key: string;
}

const MAX_VISIBLE_TOASTS = 5;
const DEDUP_WINDOW_MS = 2000;
const DEFAULT_TOAST_KEY = "app-toast";

@Injectable({ providedIn: "root" })
export class ToastService {
  /** Live toasts — render with a future <app-toast> outlet if desired. */
  private readonly _messages = signal<ToastItem[]>([]);
  readonly messages = this._messages.asReadonly();

  private recentMessages = new Map<string, number>();
  private nextId = 1;

  success(detail: string, summaryOrOptions?: string | ToastMethodOptions, life = 3000): void {
    const { summary, lifeMs, sticky, key } = this.parseArgs(summaryOrOptions, "Success", life);
    this.addWithDedup({ severity: "success", summary, detail, life: lifeMs, sticky, key });
  }

  error(detail: string, summaryOrOptions?: string | ToastMethodOptions, life = 5000): void {
    const { summary, lifeMs, sticky, key } = this.parseArgs(summaryOrOptions, "Error", life);
    this.addWithDedup({ severity: "error", summary, detail, life: lifeMs, sticky, key });
  }

  warn(detail: string, summaryOrOptions?: string | ToastMethodOptions, life = 4000): void {
    const { summary, lifeMs, sticky, key } = this.parseArgs(summaryOrOptions, "Warning", life);
    this.addWithDedup({ severity: "warn", summary, detail, life: lifeMs, sticky, key });
  }

  info(detail: string, summaryOrOptions?: string | ToastMethodOptions, life = 3000): void {
    const { summary, lifeMs, sticky, key } = this.parseArgs(summaryOrOptions, "Info", life);
    this.addWithDedup({ severity: "info", summary, detail, life: lifeMs, sticky, key });
  }

  show(options: ToastOptions): void {
    this.addWithDedup({
      severity: this.normalizeSeverity(options.severity || "info"),
      summary: options.summary || "",
      detail: options.detail,
      life: options.life || 3000,
      sticky: options.sticky,
      closable: options.closable,
      key: options.key || DEFAULT_TOAST_KEY,
    });
  }

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

  private addWithDedup(message: {
    severity?: string;
    summary?: string;
    detail?: string;
    life?: number;
    sticky?: boolean;
    closable?: boolean;
    key?: string;
  }): void {
    const severity = this.normalizeSeverity(message.severity || "info");
    let summary = this.normalizeText(message.summary || "") || "";
    let detail = this.normalizeText(message.detail);
    const key = message.key || DEFAULT_TOAST_KEY;

    if (!summary && !detail) return;
    if (summary && !detail) {
      detail = summary;
      summary = this.defaultSummaryForSeverity(severity);
    }

    const dedupKey = `${severity}:${summary}:${detail || ""}`;
    const now = Date.now();
    const lastShown = this.recentMessages.get(dedupKey);
    if (lastShown && now - lastShown < DEDUP_WINDOW_MS) return;

    // Keep the UI responsive under floods — drop the oldest when over the cap.
    this._messages.update((list) => {
      const next = [...list];
      while (next.length >= MAX_VISIBLE_TOASTS) next.shift();
      return next;
    });

    this.recentMessages.set(dedupKey, now);
    this.cleanupOldEntries(now);

    const id = this.nextId++;
    this._messages.update((list) => [
      ...list,
      {
        id,
        severity,
        summary,
        detail,
        life: message.life || 3000,
        sticky: message.sticky,
        closable: message.closable,
        key,
      },
    ]);

    if (!message.sticky) {
      setTimeout(() => this.dismiss(id), message.life || 3000);
    }
  }

  private dismiss(id: number): void {
    this._messages.update((list) => list.filter((m) => m.id !== id));
  }

  private normalizeText(value?: string): string | undefined {
    if (value === undefined) return undefined;
    return value.trim().replace(/\s+/g, " ");
  }

  private normalizeSeverity(severity: string): ToastSeverity {
    if (severity === "warning") return "warn";
    if (severity === "success" || severity === "info" || severity === "warn" || severity === "error") {
      return severity;
    }
    return "info";
  }

  private defaultSummaryForSeverity(severity: string): string {
    switch (severity) {
      case "success": return "Success";
      case "warn": return "Warning";
      case "error": return "Error";
      default: return "Info";
    }
  }

  private cleanupOldEntries(now: number): void {
    for (const [key, timestamp] of this.recentMessages.entries()) {
      if (now - timestamp > DEDUP_WINDOW_MS * 2) this.recentMessages.delete(key);
    }
  }

  /** Clear all notifications. */
  clear(): void {
    this._messages.set([]);
  }

  /** Clear notifications with a given key. */
  clearByKey(key: string): void {
    this._messages.update((list) => list.filter((m) => m.key !== key));
  }
}
