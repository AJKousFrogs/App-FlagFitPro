/**
 * Session Expiry Service
 *
 * Monitors the active Supabase session and warns the user before expiry,
 * then silently refreshes the token so they are never unexpectedly logged out
 * mid-workflow.
 *
 * Timeline:
 *   T - 5 min  → toast warning with "Stay logged in" action
 *   T - 1 min  → final warning
 *   T          → Supabase's onAuthStateChange fires SIGNED_OUT automatically
 */

import { Injectable, inject, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { SupabaseService } from "./supabase.service";
import { ToastService } from "./toast.service";
import { LoggerService } from "./logger.service";

/** How often we poll the session expiry in milliseconds. */
const POLL_INTERVAL_MS = 30_000; // 30 seconds

/** Warn when session expires within this many seconds. */
const WARN_AT_SECONDS_REMAINING = 5 * 60; // 5 minutes

/** Final warning threshold. */
const FINAL_WARN_AT_SECONDS_REMAINING = 60; // 1 minute

@Injectable({
  providedIn: "root",
})
export class SessionExpiryService implements OnDestroy {
  private readonly supabase = inject(SupabaseService);
  private readonly toastService = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private warnedAt5Min = false;
  private warnedAt1Min = false;

  /**
   * Start monitoring. Call this once the user is authenticated
   * (e.g., from AppComponent or AuthGuard on successful entry).
   */
  startMonitoring(): void {
    this.stopMonitoring();
    this.resetWarningFlags();

    this.pollTimer = setInterval(() => this.checkExpiry(), POLL_INTERVAL_MS);
    // Also run immediately so the first check happens right away
    void this.checkExpiry();
  }

  /** Stop monitoring and clear timers. Call on logout. */
  stopMonitoring(): void {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.resetWarningFlags();
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
  }

  private resetWarningFlags(): void {
    this.warnedAt5Min = false;
    this.warnedAt1Min = false;
  }

  private async checkExpiry(): Promise<void> {
    const session = this.supabase.getSession();
    if (!session) {
      this.stopMonitoring();
      return;
    }

    const expiresAt = session.expires_at; // Unix timestamp (seconds)
    if (!expiresAt) return;

    const secondsRemaining = expiresAt - Math.floor(Date.now() / 1000);

    if (secondsRemaining <= 0) {
      // Already expired — Supabase will fire SIGNED_OUT; just clean up
      this.stopMonitoring();
      return;
    }

    // Final warning: ~1 minute remaining
    if (secondsRemaining <= FINAL_WARN_AT_SECONDS_REMAINING && !this.warnedAt1Min) {
      this.warnedAt1Min = true;
      this.toastService.warn(
        "Your session expires in less than 1 minute. Save your work.",
        "Session expiring",
      );
      // Try a silent refresh as a last resort
      await this.attemptSilentRefresh();
      return;
    }

    // First warning: ~5 minutes remaining
    if (
      secondsRemaining <= WARN_AT_SECONDS_REMAINING &&
      !this.warnedAt5Min
    ) {
      this.warnedAt5Min = true;
      // Attempt silent token refresh — if it succeeds the user never sees a warning
      const refreshed = await this.attemptSilentRefresh();
      if (!refreshed) {
        const minutesLeft = Math.ceil(secondsRemaining / 60);
        this.toastService.info(
          `Your session expires in ${minutesLeft} minute${minutesLeft !== 1 ? "s" : ""}. ` +
          "Tap to stay logged in.",
          "Session expiring soon",
        );
      } else {
        // Refresh succeeded — reset flags so warnings fire again if needed
        this.resetWarningFlags();
      }
    }
  }

  /**
   * Attempt a silent token refresh via Supabase.
   * Returns true if the refresh succeeded.
   */
  private async attemptSilentRefresh(): Promise<boolean> {
    try {
      const refreshed = await this.supabase.refreshSessionForHttpRetry();
      if (refreshed) {
        this.logger.debug("[SessionExpiry] Silent token refresh succeeded");
      } else {
        this.logger.warn("[SessionExpiry] Silent token refresh failed");
      }
      return refreshed;
    } catch (err) {
      this.logger.error("[SessionExpiry] Silent refresh threw:", err);
      return false;
    }
  }
}
