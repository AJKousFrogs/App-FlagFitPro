import { Injectable, computed, effect, inject, signal } from "@angular/core";
import { Observable, defer, from, of } from "rxjs";
import { catchError, map, switchMap, take, tap } from "rxjs";
import { STATUS_HEX_COLORS } from "../utils/design-tokens.util";
import { LoggerService } from "./logger.service";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { RealtimeService } from "./realtime.service";
import { SupabaseService } from "./supabase.service";
import { RealtimeBroadcastPayload } from "../models/realtime-broadcast.model";

/** Result shape from public.calculate_acwr (jsonb). */
export interface AcwrCalculationResult {
  acute_load: number;
  chronic_load: number;
  ratio: number;
  sufficient: boolean;
  days_with_data: number;
  sessions_in_window: number;
  computed_at: string;
}

export interface WellnessData {
  id?: number;
  userId?: string;
  date: string;
  sleep?: number;
  sleepHours?: number;
  sleepScore?: number; // 0-100 from wearables
  energy?: number;
  stress?: number;
  soreness?: number;
  motivation?: number;
  mood?: number;
  hydration?: number;
  readinessScore?: number;
  weight?: number;
  resting_hr?: number;
  notes?: string;
  timestamp?: string;
  /** Regions for soreness (canonical RPC). */
  sorenessAreas?: string[];
}

export interface WellnessAverages {
  sleep?: number;
  energy?: number;
  stress?: number;
  soreness?: number;
  motivation?: number;
  mood?: number;
  hydration?: number;
}

export interface WellnessPatterns {
  patterns: string[];
  insights: string[];
  averages?: WellnessAverages;
}

export interface WellnessResponse {
  success: boolean;
  data: WellnessData[];
  averages?: WellnessAverages;
  patterns?: WellnessPatterns;
}

interface DatabaseWellnessEntry {
  id: number;
  athlete_id: string;
  date: string;
  sleep_quality?: number;
  energy_level?: number;
  stress_level?: number;
  muscle_soreness?: number;
  motivation_level?: number;
  mood?: number;
  hydration_level?: number;
  notes?: string;
  created_at: string;
}

// Interface for daily_wellness_checkin table (canonical source)
interface DailyWellnessCheckinEntry {
  id: number;
  user_id: string;
  checkin_date: string;
  sleep_quality?: number;
  sleep_hours?: number;
  energy_level?: number;
  stress_level?: number;
  muscle_soreness?: number;
  motivation_level?: number;
  mood?: number;
  hydration_level?: number;
  resting_hr?: number;
  soreness_areas?: string[];
  notes?: string;
  calculated_readiness?: number;
  readiness_score?: number;
  created_at: string;
  updated_at?: string;
}

// RealtimeEvent is now imported from realtime.service.ts

interface WellnessTrend {
  metric: string;
  trend: "improving" | "declining" | "stable";
  change: number;
}

/**
 * Memory management constants for wellness data
 * Prevents unbounded data growth
 */
const WELLNESS_MEMORY_LIMITS = {
  /** Maximum days of wellness data to keep in memory */
  MAX_DAYS: 90,
  /** Maximum entries in memory cache */
  MAX_ENTRIES: 100,
} as const;

@Injectable({
  providedIn: "root",
})
export class WellnessService {
  private supabaseService = inject(SupabaseService);
  private logger = inject(LoggerService);
  private realtimeService = inject(RealtimeService);

  // Get current user ID reactively
  private userId = computed(() => this.supabaseService.userId());

  private readonly _wellnessData = signal<WellnessData[]>([]);
  private readonly _averages = signal<WellnessAverages | null>(null);

  // Public readonly signals for components
  readonly wellnessData = this._wellnessData.asReadonly();
  readonly averages = this._averages.asReadonly();

  // Computed signals for derived state
  readonly hasWellnessData = computed(() => this._wellnessData().length > 0);
  readonly latestWellnessEntry = computed(() => {
    const data = this._wellnessData();
    return data.length > 0 ? data[0] : null;
  });

  // MEMORY SAFETY: Track realtime channel + last user
  private wellnessChannel: RealtimeChannel | null = null;
  private lastLoadedUserId: string | null = null;

  constructor() {
    // Set up realtime subscription when user logs in/out
    effect(() => {
      const userId = this.userId();

      if (userId) {
        // MEMORY SAFETY: Prevent duplicate loads for same user
        if (this.lastLoadedUserId === userId) {
          return;
        }

        this.logger.info("wellness_realtime_setup_start", { userId });
        this.lastLoadedUserId = userId;
        this.loadWellnessData();
        this.subscribeToWellnessUpdates(userId);
      } else {
        this.logger.info("wellness_user_logged_out_cleanup");
        this.cleanup();
      }
    });
  }

  /**
   * MEMORY SAFETY: Centralized cleanup method
   */
  private cleanup(): void {
    this.cleanupWellnessChannel();

    // Clear cached data
    this.clearCache();
    this.lastLoadedUserId = null;

  }

  private cleanupWellnessChannel(): void {
    if (this.wellnessChannel) {
      this.supabaseService.unsubscribe(this.wellnessChannel);
      this.wellnessChannel = null;
    }
  }

  /**
   * Get wellness data for a specific timeframe
   * @param timeframe - Time range (e.g., '7d', '30d', '3m')
   * Returns Observable using direct Supabase queries
   */
  getWellnessData(timeframe: string = "30d"): Observable<WellnessResponse> {
    const userId = this.userId();

    if (!userId) {
      this.logger.warn("wellness_fetch_no_user");
      return of({ success: false, data: [] });
    }

    // Parse timeframe to days
    const days = this.parseTimeframe(timeframe);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return from(
      (async () => {
        // Query from daily_wellness_checkin (canonical source)
        const { data, error } = await this.supabaseService.client
          .from("daily_wellness_checkin")
          .select("*")
          .eq("user_id", userId)
          .gte("checkin_date", cutoffDate.toISOString().split("T")[0])
          .order("checkin_date", { ascending: false });

        if (error) {
          this.logger.error("wellness_fetch_error", error);
          throw error;
        }

        const wellnessData: WellnessData[] = (data || []).map(
          (entry: DailyWellnessCheckinEntry) => ({
            id: entry.id,
            userId: entry.user_id,
            date: entry.checkin_date,
            sleep: entry.sleep_quality,
            sleepHours: entry.sleep_hours,
            energy: entry.energy_level,
            stress: entry.stress_level,
            soreness: entry.muscle_soreness,
            motivation: entry.motivation_level,
            mood: entry.mood,
            hydration: entry.hydration_level,
            resting_hr: entry.resting_hr,
            readinessScore:
              entry.calculated_readiness ?? entry.readiness_score,
            notes: entry.notes,
            timestamp: entry.created_at,
          }),
        );

        // Calculate averages
        const averages = this.calculateAverages(wellnessData);

        // Update signals
        this._wellnessData.set(wellnessData);
        this._averages.set(averages);

        return {
          success: true,
          data: wellnessData,
          averages,
        };
      })(),
    ).pipe(
      catchError((error) => {
        this.logger.error("wellness_fetch_failed", error);
        // Return a distinct `error: true` flag so components can show "error
        // loading data" rather than the misleading "no wellness data yet" state.
        return of({ success: false, error: true, data: [] });
      }),
    );
  }

  /**
   * Parse timeframe string to number of days
   */
  private parseTimeframe(timeframe: string): number {
    const match = timeframe.match(/^(\d+)([dmyw])$/);
    if (!match) return 30; // Default to 30 days

    const [, num, unit] = match;
    const value = parseInt(num, 10);

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
   * Calculate averages from wellness data
   */
  private calculateAverages(data: WellnessData[]): WellnessAverages {
    if (data.length === 0) {
      return {};
    }

    const sums = {
      sleep: 0,
      energy: 0,
      stress: 0,
      soreness: 0,
      motivation: 0,
      mood: 0,
      hydration: 0,
    };
    const counts = { ...sums };

    data.forEach((entry) => {
      if (entry.sleep !== undefined && !Number.isNaN(entry.sleep)) {
        sums.sleep += entry.sleep;
        counts.sleep++;
      }
      if (entry.energy !== undefined && !Number.isNaN(entry.energy)) {
        sums.energy += entry.energy;
        counts.energy++;
      }
      if (entry.stress !== undefined && !Number.isNaN(entry.stress)) {
        sums.stress += entry.stress;
        counts.stress++;
      }
      if (entry.soreness !== undefined && !Number.isNaN(entry.soreness)) {
        sums.soreness += entry.soreness;
        counts.soreness++;
      }
      if (entry.motivation !== undefined && !Number.isNaN(entry.motivation)) {
        sums.motivation += entry.motivation;
        counts.motivation++;
      }
      if (entry.mood !== undefined && !Number.isNaN(entry.mood)) {
        sums.mood += entry.mood;
        counts.mood++;
      }
      if (entry.hydration !== undefined && !Number.isNaN(entry.hydration)) {
        sums.hydration += entry.hydration;
        counts.hydration++;
      }
    });

    return {
      sleep:
        counts.sleep > 0
          ? Math.round((sums.sleep / counts.sleep) * 10) / 10
          : undefined,
      energy:
        counts.energy > 0
          ? Math.round((sums.energy / counts.energy) * 10) / 10
          : undefined,
      stress:
        counts.stress > 0
          ? Math.round((sums.stress / counts.stress) * 10) / 10
          : undefined,
      soreness:
        counts.soreness > 0
          ? Math.round((sums.soreness / counts.soreness) * 10) / 10
          : undefined,
      motivation:
        counts.motivation > 0
          ? Math.round((sums.motivation / counts.motivation) * 10) / 10
          : undefined,
      mood:
        counts.mood > 0
          ? Math.round((sums.mood / counts.mood) * 10) / 10
          : undefined,
      hydration:
        counts.hydration > 0
          ? Math.round((sums.hydration / counts.hydration) * 10) / 10
          : undefined,
    };
  }

  /**
   * Log wellness entry for today or specific date via Supabase RPC
   * `upsert_wellness_checkin` (upserts `daily_wellness_checkin` + legacy entries).
   *
   * @param data Wellness data to log
   * @returns Observable with success status and data
   *
   * @see DailyReadinessComponent for example usage
   */
  logWellness(
    data: Partial<WellnessData>,
  ): Observable<{ success: boolean; data?: unknown; error?: string }> {
    const userId = this.userId();

    if (!userId) {
      this.logger.error("wellness_log_no_user");
      return of({ success: false, error: "Not authenticated" });
    }

    const checkinDate = data.date || new Date().toISOString().split("T")[0];

    const rpcPayload = {
      p_user_id: userId,
      p_checkin_date: checkinDate,
      p_sleep_quality: data.sleep ?? null,
      p_sleep_hours: data.sleepHours ?? null,
      p_energy_level: data.energy ?? null,
      p_muscle_soreness: data.soreness ?? null,
      p_stress_level: data.stress ?? null,
      p_soreness_areas: data.sorenessAreas ?? [],
      p_notes: data.notes ?? null,
      p_calculated_readiness: data.readinessScore ?? null,
      p_motivation_level: data.motivation ?? null,
      p_mood: data.mood ?? null,
      p_hydration_level: data.hydration ?? null,
    };

    this.logger.info("wellness_upsert_rpc_start", {
      checkinDate,
      userId,
    });

    return defer(() => this.supabaseService.waitForInit()).pipe(
      switchMap(() =>
        from(
          this.supabaseService.client.rpc(
            "upsert_wellness_checkin",
            rpcPayload,
          ),
        ),
      ),
      map(({ data: row, error }) => {
        if (error) {
          throw error;
        }
        this.logger.success("wellness_entry_saved");
        const rowObj = Array.isArray(row) ? row[0] : row;
        const data =
          rowObj && typeof rowObj === "object"
            ? {
                ...rowObj,
                checkin_date:
                  (rowObj as { checkin_date?: string; saved_checkin_date?: string })
                    .checkin_date ??
                  (rowObj as { saved_checkin_date?: string }).saved_checkin_date,
              }
            : rowObj;
        return { success: true as const, data };
      }),
      tap((result) => {
        if (result.success) {
          this.getWellnessData("30d")
            .pipe(take(1))
            .subscribe({
              error: (err) =>
                this.logger.warn("wellness_refresh_after_checkin_failed", err),
            });

          document.dispatchEvent(
            new CustomEvent("wellnessSubmitted", {
              detail: {
                date: checkinDate,
                sleep: data.sleep,
                sleepHours: data.sleepHours,
                energy: data.energy,
                stress: data.stress,
                soreness: data.soreness,
                motivation: data.motivation,
                mood: data.mood,
                hydration: data.hydration,
                readinessScore: data.readinessScore,
              },
            }),
          );
          this.logger.info("wellness_submitted_event_dispatched", {
            checkinDate,
          });
        }
      }),
      catchError((error: { message?: string; details?: string }) => {
        const errorMessage =
          error?.message || error?.details || JSON.stringify(error);
        this.logger.error("wellness_log_rpc_failed", error, {
          message: errorMessage,
        });
        return of({ success: false, error: errorMessage });
      }),
    );
  }

  /**
   * Server-side ACWR (EWMA) from `workout_logs`; matches default evidence preset math.
   */
  calculateAcwr(): Observable<{
    success: boolean;
    data?: AcwrCalculationResult;
    error?: string;
  }> {
    const userId = this.userId();
    if (!userId) {
      return of({ success: false, error: "Not authenticated" });
    }

    return defer(() => this.supabaseService.waitForInit()).pipe(
      switchMap(() =>
        from(
          this.supabaseService.client.rpc("calculate_acwr", {
            p_user_id: userId,
          }),
        ),
      ),
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return {
          success: true as const,
          data: data as AcwrCalculationResult,
        };
      }),
      catchError((error: { message?: string; details?: string }) => {
        const errorMessage =
          error?.message || error?.details || JSON.stringify(error);
        this.logger.error("wellness_calculate_acwr_failed", error, {
          message: errorMessage,
        });
        return of({ success: false, error: errorMessage });
      }),
    );
  }

  /**
   * Get wellness score (average of all metrics)
   *
   * For a full evidence-based readiness score, use ReadinessService.calculateToday().
   * This method provides a quick client-side average suitable for UI display.
   */
  getWellnessScore(data: WellnessData): number {
    // Clamp inverted metrics to [1,10] before inverting to prevent negative scores
    // from out-of-range data (e.g. stress=15 would otherwise produce -5)
    const clamp = (v: number) => Math.min(10, Math.max(1, v));
    const metrics = [
      data.sleep,
      data.energy,
      data.stress !== undefined && data.stress !== null ? 10 - clamp(data.stress) : undefined,
      data.soreness !== undefined && data.soreness !== null ? 10 - clamp(data.soreness) : undefined,
      data.motivation,
      data.mood,
      data.hydration,
    ].filter((m): m is number => m !== undefined && m !== null && !Number.isNaN(m));

    if (metrics.length === 0) return 0;

    const sum = metrics.reduce((acc, val) => acc + val, 0);
    return Math.round((sum / metrics.length) * 10) / 10;
  }

  /**
   * Get wellness status based on score
   */
  getWellnessStatus(score: number): {
    status: "excellent" | "good" | "fair" | "poor";
    color: string;
    message: string;
  } {
    if (score >= 8) {
      return {
        status: "excellent",
        color: STATUS_HEX_COLORS.success, // var(--p-highlight-text-color) (brand green)
        message: "Your wellness is excellent! Keep up the great work.",
      };
    } else if (score >= 6) {
      return {
        status: "good",
        color: STATUS_HEX_COLORS.info, // var(--color-chart-tertiary) (blue)
        message:
          "Your wellness is good. Small improvements can make a big difference.",
      };
    } else if (score >= 4) {
      return {
        status: "fair",
        color: STATUS_HEX_COLORS.warning, // var(--color-chart-quaternary) (amber)
        message: "Your wellness needs attention. Focus on recovery and rest.",
      };
    } else {
      return {
        status: "poor",
        color: STATUS_HEX_COLORS.error, // var(--color-chart-quinary) (red)
        message:
          "Your wellness is concerning. Consider taking a rest day and consulting a coach.",
      };
    }
  }

  /**
   * Get wellness trends over time
   */
  getWellnessTrends(data: WellnessData[]): WellnessTrend[] {
    if (data.length < 2) return [];

    const metrics = [
      "sleep",
      "energy",
      "stress",
      "soreness",
      "motivation",
      "mood",
      "hydration",
    ];
    const trends: WellnessTrend[] = [];

    metrics.forEach((metric) => {
      const values = data
        .map((d) => (d as unknown as Record<string, unknown>)[metric])
        .filter((v): v is number => typeof v === "number");

      if (values.length < 2) return;

      // Use fixed 7-day windows rather than 50/50 split so that
      // small datasets (e.g. 3 entries → 1 vs 2) don't produce biased trends.
      // `data` is ordered newest-first; values preserves that order.
      const recentWindow = values.slice(0, Math.min(7, Math.floor(values.length / 2)));
      const earlierWindow = values.slice(recentWindow.length, recentWindow.length + Math.min(7, values.length - recentWindow.length));

      if (recentWindow.length === 0 || earlierWindow.length === 0) return;

      const recent = recentWindow;
      const earlier = earlierWindow;

      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;

      const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;

      // For stress and soreness, lower is better
      const invertMetrics = ["stress", "soreness"];
      const adjustedChange = invertMetrics.includes(metric) ? -change : change;

      trends.push({
        metric,
        trend:
          adjustedChange > 5
            ? "improving"
            : adjustedChange < -5
              ? "declining"
              : "stable",
        change: Math.round(Math.abs(change) * 10) / 10,
      });
    });

    return trends;
  }

  /**
   * Get recommendations based on wellness data
   */
  getRecommendations(data: WellnessData): string[] {
    const recommendations: string[] = [];

    if (data.sleep !== undefined && data.sleep < 6) {
      recommendations.push(
        "Prioritize 7-9 hours of sleep for optimal recovery",
      );
    }

    if (data.energy !== undefined && data.energy < 5) {
      recommendations.push("Consider a rest day or light training session");
    }

    if (data.stress !== undefined && data.stress > 7) {
      recommendations.push(
        "Practice stress management techniques like meditation or breathing exercises",
      );
    }

    if (data.soreness !== undefined && data.soreness > 7) {
      recommendations.push(
        "Focus on recovery protocols: foam rolling, stretching, ice baths",
      );
    }

    if (data.hydration !== undefined && data.hydration < 6) {
      recommendations.push(
        "Increase water intake to support performance and recovery",
      );
    }

    if (data.motivation !== undefined && data.motivation < 5) {
      recommendations.push(
        "Try varying your training routine to maintain engagement",
      );
    }

    if (recommendations.length === 0) {
      recommendations.push("Keep up the excellent wellness habits!");
    }

    return recommendations;
  }

  /**
   * Load wellness data from database
   */
  private loadWellnessData(): void {
    this.getWellnessData("30d").subscribe({
      next: ({ success }) => {
        if (success) {
          this.logger.success("wellness_data_loaded");
        }
      },
      error: (error) => {
        this.logger.error("wellness_data_load_failed", error);
      },
    });
  }

  /**
   * Subscribe to realtime wellness updates
   * MEMORY SAFETY: Stores unsubscribe function for cleanup
   */
  private subscribeToWellnessUpdates(userId: string): void {
    this.cleanupWellnessChannel();

    this.wellnessChannel = this.supabaseService.client
      .channel(`wellness:${userId}`)
      .on("broadcast", { event: "wellness_change" }, (payload) => {
        this.handleWellnessBroadcast(payload.payload as RealtimeBroadcastPayload);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          this.logger.info("wellness_broadcast_subscribed");
        } else {
          this.logger.debug("wellness_broadcast_status", { status });
        }
      });
  }

  private handleWellnessBroadcast(payload: RealtimeBroadcastPayload): void {
    if (!payload || !payload.record) return;
    this.logger.debug("wellness_broadcast_received", {
      operation: payload.operation,
    });
    switch (payload.operation) {
      case "INSERT":
        this.handleWellnessInsert(payload.record);
        break;
      case "UPDATE":
        this.handleWellnessUpdate(payload.record);
        break;
      case "DELETE":
        this.handleWellnessDelete(payload.record);
        break;
    }
  }

  private handleWellnessInsert(record: Record<string, unknown>): void {
    const newEntry = this.transformCheckinEntry(
      this.mapRecordToCheckin(record),
    );
    const current = this._wellnessData();
    const newData = [newEntry, ...current].slice(
      0,
      WELLNESS_MEMORY_LIMITS.MAX_ENTRIES,
    );
    this._wellnessData.set(newData);
    this._averages.set(this.calculateAverages(newData));
  }

  private handleWellnessUpdate(record: Record<string, unknown>): void {
    const updatedEntry = this.transformCheckinEntry(
      this.mapRecordToCheckin(record),
    );
    const current = this._wellnessData();
    const index = current.findIndex((e) => e.id === updatedEntry.id);

    if (index !== -1) {
      const updated = [...current];
      updated[index] = updatedEntry;
      this._wellnessData.set(updated);
      this._averages.set(this.calculateAverages(updated));
    }
  }

  private handleWellnessDelete(record: Record<string, unknown>): void {
    const oldEntry = this.mapRecordToCheckin(record);
    const current = this._wellnessData();
    const filtered = current.filter((e) => e.id !== oldEntry.id);
    this._wellnessData.set(filtered);
    this._averages.set(this.calculateAverages(filtered));
  }

  private mapRecordToCheckin(
    record: Record<string, unknown>,
  ): DailyWellnessCheckinEntry {
    return {
      id: Number(record["id"]),
      user_id: String(record["user_id"]),
      checkin_date: String(record["checkin_date"] ?? record["date"] ?? ""),
      sleep_hours: Number(record["sleep_hours"] ?? record["sleep_quality"] ?? 0),
      sleep_quality: Number(record["sleep_quality"] ?? 0),
      energy_level: Number(record["energy_level"] ?? 0),
      stress_level: Number(record["stress_level"] ?? 0),
      muscle_soreness: Number(record["muscle_soreness"] ?? 0),
      motivation_level: Number(record["motivation_level"] ?? 0),
      mood: Number(record["mood"] ?? 0),
      hydration_level: Number(record["hydration_level"] ?? 0),
      resting_hr: record["resting_hr"] !== undefined ? Number(record["resting_hr"]) : undefined,
      soreness_areas: record["soreness_areas"] as string[] | undefined,
      notes: record["notes"] as string | undefined,
      calculated_readiness: Number(record["calculated_readiness"] ?? 0),
      readiness_score: Number(record["readiness_score"] ?? 0),
      created_at: String(record["created_at"] ?? new Date().toISOString()),
      updated_at: record["updated_at"] as string | undefined,
    };
  }

  /**
   * Transform database entry to WellnessData (legacy format)
   */
  private transformEntry(entry: DatabaseWellnessEntry): WellnessData {
    return {
      id: entry.id,
      userId: entry.athlete_id,
      date: entry.date,
      sleep: entry.sleep_quality,
      energy: entry.energy_level,
      stress: entry.stress_level,
      soreness: entry.muscle_soreness,
      motivation: entry.motivation_level,
      mood: entry.mood,
      hydration: entry.hydration_level,
      notes: entry.notes,
      timestamp: entry.created_at,
    };
  }

  /**
   * Transform daily_wellness_checkin entry to WellnessData
   */
  private transformCheckinEntry(
    entry: DailyWellnessCheckinEntry,
  ): WellnessData {
    return {
      id: entry.id,
      userId: entry.user_id,
      date: entry.checkin_date,
      sleep: entry.sleep_quality,
      sleepHours: entry.sleep_hours,
      energy: entry.energy_level,
      stress: entry.stress_level,
      soreness: entry.muscle_soreness,
      motivation: entry.motivation_level,
      mood: entry.mood,
      hydration: entry.hydration_level,
      resting_hr: entry.resting_hr,
      readinessScore: entry.calculated_readiness ?? entry.readiness_score,
      notes: entry.notes,
      timestamp: entry.created_at,
    };
  }

  /**
   * Clear cached wellness data
   */
  clearCache(): void {
    this._wellnessData.set([]);
    this._averages.set(null);
  }
}
