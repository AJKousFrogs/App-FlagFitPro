/**
 * Supplement Data Service
 *
 * Handles CRUD operations and realtime subscriptions for the
 * `supplement_logs` Supabase table.
 *
 * Extracted from performance-data.service.ts for single responsibility.
 */

import { Injectable, computed, effect, inject, signal } from "@angular/core";
import { Observable, from, of } from "rxjs";
import { catchError, map } from "rxjs";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";
import { isBenignSupabaseQueryError } from "../../shared/utils/error.utils";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { RealtimeBroadcastPayload } from "../models/realtime-broadcast.model";
import { Supplement, SupplementCompliance } from "../models/supplement.models";
import { DatabaseSupplement } from "../models/performance-data.models";
import { parseTimeframeToDays } from "../../shared/utils/date.utils";

@Injectable({
  providedIn: "root",
})
export class SupplementDataService {
  private supabaseService = inject(SupabaseService);
  private logger = inject(LoggerService);

  private userId = computed(() => this.supabaseService.userId());

  // State signals
  private readonly _todaysSupplements = signal<Supplement[]>([]);
  private lastRealtimeUserId: string | null = null;
  private supplementChannel: RealtimeChannel | null = null;

  readonly todaysSupplements = this._todaysSupplements.asReadonly();

  readonly supplementComplianceToday = computed(() => {
    const supplements = this._todaysSupplements();
    if (supplements.length === 0) return 100;
    const taken = supplements.filter((s) => s.taken).length;
    return Math.round((taken / supplements.length) * 100);
  });

  constructor() {
    effect(() => {
      const userId = this.userId();

      if (userId) {
        if (this.lastRealtimeUserId === userId) {
          return;
        }

        this.cleanup();
        this.logger.info("supplement_data_realtime_setup_start");
        this.lastRealtimeUserId = userId;
        this.loadRecent();
        this.subscribe(userId);
      } else {
        this.logger.info("supplement_data_user_logged_out_cleanup");
        this._todaysSupplements.set([]);
        this.cleanup();
      }
    });
  }

  private cleanup(): void {
    if (this.supplementChannel) {
      this.supabaseService.unsubscribe(this.supplementChannel);
    }
    this.supplementChannel = null;
    this.lastRealtimeUserId = null;
  }

  private loadRecent(): void {
    const userId = this.userId();
    if (!userId) return;

    this.getSupplements("1d").subscribe({
      next: ({ data }) => {
        this._todaysSupplements.set(data);
        this.logger.success("supplement_data_loaded");
      },
      error: (error) => {
        this.logger.error("supplement_data_load_failed", error);
      },
    });
  }

  private subscribe(userId: string): void {
    if (this.supplementChannel) {
      this.supabaseService.unsubscribe(this.supplementChannel);
    }

    this.supplementChannel = this.supabaseService.client
      .channel(`supplement_logs:${userId}`)
      .on("broadcast", { event: "supplement_change" }, (payload) => {
        this.handleBroadcast(payload.payload as RealtimeBroadcastPayload);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          this.logger.debug("supplement_data_broadcast_subscribed");
        }
      });
  }

  private handleBroadcast(payload: RealtimeBroadcastPayload): void {
    if (!payload.record) return;
    const log = payload.record as Record<string, unknown>
    const today = new Date().toISOString().split("T")[0];
    const logDate =
      (log["date"] as string | undefined) ??
      new Date(String(log["logged_at"] ?? new Date().toISOString()))
        .toISOString()
        .split("T")[0];
    const current = this._todaysSupplements();

    if (payload.operation === "DELETE") {
      const id = log["id"] as number;
      this._todaysSupplements.set(current.filter((s) => s.id !== id));
      return;
    }

    if (logDate !== today) return;

    const supplement = this.transformSupplement(log as DatabaseSupplement);

    if (payload.operation === "INSERT") {
      this._todaysSupplements.set([...current, supplement]);
    } else if (payload.operation === "UPDATE") {
      const index = current.findIndex((s) => s.id === supplement.id);
      if (index !== -1) {
        const updated = [...current];
        updated[index] = supplement;
        this._todaysSupplements.set(updated);
      }
    }
  }

  private transformSupplement(data: DatabaseSupplement): Supplement {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.supplement_name,
      dosage: data.dosage,
      taken: data.taken,
      date: data.date,
      timeOfDay: data.time_of_day,
      notes: data.notes,
      timestamp: data.created_at,
    };
  }

  private validateSupplementData(supplement: Partial<Supplement>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Name validation (required, max 200 chars)
    if (!supplement.name || supplement.name.trim().length === 0) {
      errors.push("Supplement name is required");
    } else if (supplement.name.length > 200) {
      errors.push("Supplement name must be at most 200 characters");
    }

    // Dosage validation (max 100 chars)
    if (supplement.dosage && supplement.dosage.length > 100) {
      errors.push("Dosage must be at most 100 characters");
    }

    // Time of day validation (enum)
    const validTimeOfDay = [
      "morning",
      "afternoon",
      "evening",
      "pre-workout",
      "post-workout",
    ];
    if (
      supplement.timeOfDay &&
      !validTimeOfDay.includes(supplement.timeOfDay)
    ) {
      errors.push(`Time of day must be one of: ${validTimeOfDay.join(", ")}`);
    }

    // Date validation
    if (supplement.date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(supplement.date)) {
        errors.push("Date must be in YYYY-MM-DD format");
      } else {
        const parsedDate = new Date(supplement.date);
        if (isNaN(parsedDate.getTime())) {
          errors.push("Invalid date");
        }
      }
    }

    // Notes validation (max 500 chars)
    if (supplement.notes && supplement.notes.length > 500) {
      errors.push("Notes must be at most 500 characters");
    }

    return { valid: errors.length === 0, errors };
  }

  // Public API

  getSupplements(timeframe = "30d"): Observable<{
    data: Supplement[];
    compliance: SupplementCompliance;
  }> {
    const userId = this.userId();

    if (!userId) {
      return of({
        data: [],
        compliance: { complianceRate: 0, totalDays: 0, missedDays: 0 },
      });
    }

    const days = parseTimeframeToDays(timeframe);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return from(
      (async () => {
        const { data, error } = await this.supabaseService.client
          .from("supplement_logs")
          .select("*")
          .eq("user_id", userId)
          .gte("date", cutoffDate.toISOString().split("T")[0])
          .order("date", { ascending: false });

        if (error) {
          if (isBenignSupabaseQueryError(error)) {
            this.logger.warn(
              "supplement_data_unavailable_environment",
              error,
            );
            return {
              data: [] as Supplement[],
              compliance: { complianceRate: 0, totalDays: 0, missedDays: 0 },
            };
          }
          this.logger.error("supplement_data_fetch_error", error);
          throw error;
        }

        const supplements: Supplement[] = (data || []).map(
          (s: DatabaseSupplement) => ({
            id: s.id,
            userId: s.user_id,
            name: s.supplement_name,
            dosage: s.dosage,
            taken: s.taken,
            date: s.date,
            timeOfDay: s.time_of_day,
            notes: s.notes,
            timestamp: s.created_at,
          }),
        );

        // Calculate compliance
        const totalLogs = supplements.length;
        const takenLogs = supplements.filter((s) => s.taken).length;
        const complianceRate =
          totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 0;

        return {
          data: supplements,
          compliance: {
            complianceRate,
            totalDays: days,
            missedDays: totalLogs - takenLogs,
          },
        };
      })(),
    ).pipe(
      catchError((error) => {
        if (!isBenignSupabaseQueryError(error)) {
          this.logger.error("supplement_data_fetch_failed", error);
        }
        return of({
          data: [],
          compliance: { complianceRate: 0, totalDays: 0, missedDays: 0 },
        });
      }),
    );
  }

  logSupplement(supplement: Partial<Supplement>): Observable<{
    success: boolean;
    data?: DatabaseSupplement;
    error?: unknown;
  }> {
    const userId = this.userId();

    if (!userId) {
      this.logger.error("supplement_log_no_user");
      return of({ success: false, error: "Not authenticated" });
    }

    // Validate supplement data
    const validation = this.validateSupplementData(supplement);
    if (!validation.valid) {
      this.logger.error("supplement_validation_failed", undefined, {
        errors: validation.errors,
      });
      return of({ success: false, error: validation.errors.join(", ") });
    }

    return from(
      this.supabaseService.client
        .from("supplement_logs")
        .insert({
          user_id: userId,
          supplement_name: supplement.name?.trim(),
          dosage: supplement.dosage?.trim(),
          taken: supplement.taken !== undefined ? supplement.taken : true,
          date: supplement.date || new Date().toISOString().split("T")[0],
          time_of_day: supplement.timeOfDay,
          notes: supplement.notes?.trim(),
        })
        .select()
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error("supplement_log_error", error);
          return { success: false, error };
        }
        this.logger.success("supplement_logged", { id: data.id });
        return { success: true, data };
      }),
      catchError((error) => {
        this.logger.error("supplement_log_failed", error);
        return of({ success: false, error: error.message });
      }),
    );
  }
}
