import { Injectable } from "@angular/core";

/**
 * Holds a stack of correlation / trace IDs for nested operations (e.g. ACWR save → Supabase).
 * HTTP layer sends `X-Correlation-Id` using {@link getOrCreateForRequest} so logs align
 * with backend request logs when a trace is active; otherwise each request gets an ephemeral ID.
 */
@Injectable({
  providedIn: "root",
})
export class CorrelationContextService {
  private readonly stack: string[] = [];

  /** Starts a new trace; returns the trace id. Nestable. */
  startTrace(): string {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `trace_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    this.stack.push(id);
    return id;
  }

  /** Pops the innermost trace. */
  endTrace(): void {
    this.stack.pop();
  }

  /** Active trace id when inside {@link startTrace} / {@link endTrace}. */
  traceId(): string | null {
    return this.stack.length ? this.stack[this.stack.length - 1]! : null;
  }

  /**
   * For outbound HTTP: reuse active trace or generate a one-off correlation id
   * (not pushed onto the stack).
   */
  getOrCreateForRequest(): string {
    return (
      this.traceId() ??
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`)
    );
  }
}
