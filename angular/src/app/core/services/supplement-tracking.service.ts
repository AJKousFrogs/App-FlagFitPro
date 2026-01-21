/**
 * Supplement Tracking Service
 *
 * Handles supplement logging and compliance tracking.
 * Split from performance-data.service.ts for single responsibility.
 *
 * Responsibilities:
 * - Supplement CRUD operations
 * - Compliance rate calculation
 * - Supplement schedules
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { Observable, from, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { AuthService } from "./auth.service";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";
import { Supplement, SupplementCompliance } from "../models/supplement.models";

interface ComplianceStatus {
  status: string;
  color: string;
  description: string;
}

@Injectable({
  providedIn: "root",
})
export class SupplementTrackingService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);
  private logger = inject(LoggerService);

  // Reactive state
  private readonly _supplements = signal<Supplement[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public computed signals
  readonly supplements = this._supplements.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly todaysSupplements = computed(() => {
    const today = new Date().toISOString().split("T")[0];
    return this._supplements().filter((s) => s.date === today);
  });

  readonly complianceRate = computed(() => {
    const all = this._supplements();
    if (all.length === 0) return 100;
    const taken = all.filter((s) => s.taken).length;
    return Math.round((taken / all.length) * 100);
  });

  /**
   * Get supplements with optional timeframe filter
   */
  getSupplements(
    timeframe: string = "30d"
  ): Observable<{ data: Supplement[]; error: string | null }> {
    this._isLoading.set(true);
    this._error.set(null);

    const userId = this.auth.getCurrentUserId();
    if (!userId) {
      return of({ data: [], error: "Not authenticated" });
    }

    const days = this.parseTimeframeToDays(timeframe);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return from(
      this.supabase.client
        .from("supplements")
        .select("*")
        .eq("user_id", userId)
        .gte("date", startDate.toISOString().split("T")[0])
        .order("date", { ascending: false })
    ).pipe(
      map((response) => {
        this._isLoading.set(false);
        if (response.error) {
          this._error.set(response.error.message);
          return { data: [], error: response.error.message };
        }
        const supplements = (response.data || []).map((s) =>
          this.transformSupplement(s)
        );
        this._supplements.set(supplements);
        return { data: supplements, error: null };
      }),
      catchError((err) => {
        this._isLoading.set(false);
        this._error.set(err.message);
        this.logger.error("Failed to fetch supplements", err);
        return of({ data: [], error: err.message });
      })
    );
  }

  /**
   * Log a supplement intake
   */
  logSupplement(
    supplement: Partial<Supplement>
  ): Observable<{ success: boolean; error?: string }> {
    const validation = this.validateSupplementData(supplement);
    if (!validation.valid) {
      return of({ success: false, error: validation.error });
    }

    const userId = this.auth.getCurrentUserId();
    if (!userId) {
      return of({ success: false, error: "Not authenticated" });
    }

    const record = {
      user_id: userId,
      name: supplement.name,
      dosage: supplement.dosage,
      taken: supplement.taken ?? true,
      date: supplement.date || new Date().toISOString().split("T")[0],
      time_of_day: supplement.timeOfDay,
      notes: supplement.notes,
      timestamp: new Date().toISOString(),
    };

    return from(
      this.supabase.client.from("supplements").insert(record).select()
    ).pipe(
      map((response) => {
        if (response.error) {
          return { success: false, error: response.error.message };
        }
        // Update local state
        if (response.data?.[0]) {
          const newSupplement = this.transformSupplement(response.data[0]);
          this._supplements.update((prev) => [newSupplement, ...prev]);
        }
        return { success: true };
      }),
      catchError((err) => {
        this.logger.error("Failed to log supplement", err);
        return of({ success: false, error: err.message });
      })
    );
  }

  /**
   * Toggle supplement taken status
   */
  toggleSupplement(
    supplementId: number,
    taken: boolean
  ): Observable<{ success: boolean; error?: string }> {
    return from(
      this.supabase.client
        .from("supplements")
        .update({ taken })
        .eq("id", supplementId)
        .select()
    ).pipe(
      map((response) => {
        if (response.error) {
          return { success: false, error: response.error.message };
        }
        // Update local state
        this._supplements.update((prev) =>
          prev.map((s) => (s.id === supplementId ? { ...s, taken } : s))
        );
        return { success: true };
      }),
      catchError((err) => {
        this.logger.error("Failed to toggle supplement", err);
        return of({ success: false, error: err.message });
      })
    );
  }

  /**
   * Get compliance status based on rate
   */
  getComplianceStatus(complianceRate: number): ComplianceStatus {
    if (complianceRate >= 90) {
      return {
        status: "Excellent",
        color: "var(--color-status-success)",
        description: "Outstanding supplement adherence",
      };
    } else if (complianceRate >= 70) {
      return {
        status: "Good",
        color: "var(--ds-primary-green)",
        description: "Good supplement adherence",
      };
    } else if (complianceRate >= 50) {
      return {
        status: "Fair",
        color: "var(--color-status-warning)",
        description: "Room for improvement",
      };
    } else {
      return {
        status: "Poor",
        color: "var(--color-status-error)",
        description: "Significant improvement needed",
      };
    }
  }

  /**
   * Validate supplement data
   */
  private validateSupplementData(supplement: Partial<Supplement>): {
    valid: boolean;
    error?: string;
  } {
    if (!supplement.name || supplement.name.trim().length === 0) {
      return { valid: false, error: "Supplement name is required" };
    }
    if (supplement.name.length > 100) {
      return { valid: false, error: "Supplement name too long (max 100 chars)" };
    }
    return { valid: true };
  }

  /**
   * Parse timeframe string to days
   */
  private parseTimeframeToDays(timeframe: string): number {
    const match = timeframe.match(/^(\d+)([dwmy])$/);
    if (!match) return 30;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "d":
        return value;
      case "w":
        return value * 7;
      case "m":
        return value * 30;
      case "y":
        return value * 365;
      default:
        return 30;
    }
  }

  /**
   * Transform database record to interface
   */
  private transformSupplement(data: Record<string, unknown>): Supplement {
    return {
      id: data["id"] as number,
      userId: data["user_id"] as string,
      name: data["name"] as string,
      dosage: data["dosage"] as string | undefined,
      taken: data["taken"] as boolean,
      date: data["date"] as string,
      timeOfDay: data["time_of_day"] as Supplement["timeOfDay"],
      notes: data["notes"] as string | undefined,
      timestamp: data["timestamp"] as string | undefined,
    };
  }
}
