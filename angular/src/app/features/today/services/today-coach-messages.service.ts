/**
 * TodayCoachMessagesService
 *
 * The Today component used to own coach-alert + coach-note display logic,
 * the acknowledgement HTTP call, and the timestamp formatting — ~80 lines
 * of coupled "show / ack / format" code wedged between routing and CTA
 * dispatch. Per architecture doc §8 ("Components stay under 300 lines"),
 * a focused domain like this belongs in a service.
 *
 * This service is a thin coordinator over `ApiService` + `ToastService`.
 * Pure helpers (`formatTimestamp`, `getCoachAuthor`) are exported for
 * testing without DI.
 */

import { Injectable, inject } from "@angular/core";
import { Observable, map } from "rxjs";

import { ApiService } from "../../../core/services/api.service";
import { ToastService } from "../../../core/services/toast.service";
import { isSuccessfulApiResponse } from "../../../core/utils/api-response-mapper";
import { getTodayISO } from "../../../shared/utils/date.utils";

/**
 * Subset of `ProtocolJson` the coach-message flow needs. Decoupled from
 * the resolver's full interface so this service doesn't break every time
 * the protocol shape gains a field.
 */
export interface CoachMessageProtocol {
  id?: string | null;
  protocol_date?: string | null;
  coach_alert_message?: string | null;
  coach_note?: { content?: string | null } | null;
  modified_by_coach_name?: string | null;
}

/** Result of an acknowledgement attempt. */
export interface AcknowledgeResult {
  ok: boolean;
  /** Server-side error message, when ok = false. */
  message?: string;
}

/** Toast duration for surfaced coach messages — long enough to read. */
const COACH_MESSAGE_TOAST_MS = 10_000;

@Injectable({ providedIn: "root" })
export class TodayCoachMessagesService {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  /**
   * Surface the coach's blocking alert (and any attached note) via toasts.
   * Silent no-op when `protocol` is null — the page hasn't loaded yet.
   */
  showAlert(protocol: CoachMessageProtocol | null): void {
    if (!protocol) {
      return;
    }

    const alertMessage =
      protocol.coach_alert_message || "Coach has updated your plan.";
    const author = getCoachAuthor(protocol);
    this.showMessage(alertMessage, `Coach Alert from ${author}`);

    const noteContent = protocol.coach_note?.content?.trim();
    if (noteContent) {
      // Defer the note toast so the alert lands first and they don't
      // overlap visually in the corner stack.
      setTimeout(() => {
        this.showMessage(noteContent, `Coach Note from ${author}`);
      }, 500);
    }
  }

  /**
   * Surface a standalone coach note, or an info toast if none exists. The
   * latter handles the "user clicked View Note but the note field is empty"
   * edge case explicitly so they don't think the click did nothing.
   */
  showNote(protocol: CoachMessageProtocol | null): void {
    const noteContent = protocol?.coach_note?.content?.trim();
    if (!noteContent) {
      this.toast.info("No coach note is attached to today's plan.", "Coach Note");
      return;
    }

    const author = getCoachAuthor(protocol);
    this.showMessage(noteContent, `Coach Note from ${author}`);
  }

  /**
   * POST acknowledgement to `/api/coach-alerts/:id/acknowledge`. Resolves
   * with `{ ok: true }` on success, `{ ok: false, message }` on a wrapped
   * API error. Network errors propagate via the Observable's error channel
   * — the caller is responsible for the user-facing failure toast so the
   * page can also refresh state on success.
   */
  acknowledge(
    alertId: string,
    sessionDate: string,
  ): Observable<AcknowledgeResult> {
    return this.api
      .post<{
        success: boolean;
        data?: unknown;
        error?: string;
        code?: string;
      }>(`/api/coach-alerts/${alertId}/acknowledge`, { sessionDate })
      .pipe(
        map((response) => {
          if (isSuccessfulApiResponse(response)) {
            return { ok: true } satisfies AcknowledgeResult;
          }
          // Wrapped failure responses put the message at the top level,
          // not under `data` — the previous extractApiPayload-based call
          // was a latent bug that silently dropped server-side error text.
          const errorMessage = (response as { error?: string }).error;
          return {
            ok: false,
            message: errorMessage ?? "Failed to acknowledge alert",
          } satisfies AcknowledgeResult;
        }),
      );
  }

  /**
   * Format a coach-modification timestamp as a relative phrase ("2 hours
   * ago") for the first 24 hours, then fall back to a short date. Returns
   * the raw string if it's unparseable so the caller never shows "NaN".
   */
  formatTimestamp(timestamp: string): string {
    return formatCoachTimestamp(timestamp);
  }

  /**
   * Author display name, with a stable fallback so the toast title is
   * never blank. Pure — exported below for tests.
   */
  getAuthor(protocol: CoachMessageProtocol | null): string {
    return getCoachAuthor(protocol);
  }

  /** Convenience: today's protocol date or local today. */
  resolveSessionDate(protocol: CoachMessageProtocol | null): string {
    return protocol?.protocol_date ?? getTodayISO();
  }

  /** Internal toast helper — long duration for readability. */
  private showMessage(message: string, title: string): void {
    this.toast.info(message, title, COACH_MESSAGE_TOAST_MS);
  }
}

// =============================================================================
// PURE HELPERS — exported so tests can exercise them without DI.
// =============================================================================

export function getCoachAuthor(
  protocol: CoachMessageProtocol | null,
): string {
  return protocol?.modified_by_coach_name?.trim() || "Your coach";
}

export function formatCoachTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return timestamp;
    }
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      const hours = Math.floor(diffHours);
      if (hours === 0) {
        const minutes = Math.floor(diffMs / (1000 * 60));
        return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
      }
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return timestamp;
  }
}
