import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { CorrelationContextService } from "./correlation-context.service";

/**
 * Persists client-side telemetry to `public.frontend_logs` (insert-only RLS).
 * All methods fail silently — never throws and does not block callers.
 */
@Injectable({
  providedIn: "root",
})
export class RemoteTelemetryService {
  private readonly supabase = inject(SupabaseService);
  private readonly correlation = inject(CorrelationContextService);

  private write(
    level: "error" | "warn" | "info",
    message: string,
    context?: Record<string, unknown>,
  ): void {
    void this.writeAsync(level, message, context);
  }

  private async writeAsync(
    level: "error" | "warn" | "info",
    message: string,
    context?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.supabase.waitForInit();
      const user = this.supabase.getCurrentUser();
      if (!user) {
        return;
      }

      const traceId =
        this.correlation.traceId() ?? this.correlation.getOrCreateForRequest();

      const { error } = await this.supabase.client.from("frontend_logs").insert({
        level,
        trace_id: traceId,
        user_id: user.id,
        message,
        context: {
          ...(context ?? {}),
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          path:
            typeof window !== "undefined"
              ? window.location?.pathname
              : undefined,
        },
      });

      if (error) {
        // Intentionally silent — logging must never break the app
      }
    } catch {
      // Intentionally silent
    }
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.write("error", message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.write("warn", message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.write("info", message, context);
  }
}
