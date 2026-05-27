/**
 * Performance Test Data Service
 *
 * Handles CRUD operations and realtime subscriptions for the
 * `performance_tests` Supabase table.
 *
 * Extracted from performance-data.service.ts for single responsibility.
 */

import { Injectable, computed, effect, inject, signal } from "@angular/core";
import { Observable, from, of } from "rxjs";
import { catchError } from "rxjs";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";
import { isBenignSupabaseQueryError } from "../../shared/utils/error.utils";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { RealtimeBroadcastPayload } from "../models/realtime-broadcast.model";
import {
  DatabaseTest,
  PerformanceTest,
  TestSummary,
  TrendValue,
} from "../models/performance-data.models";
import { parseTimeframeToDays } from "../../shared/utils/date.utils";

@Injectable({
  providedIn: "root",
})
export class PerformanceTestDataService {
  private supabaseService = inject(SupabaseService);
  private logger = inject(LoggerService);

  private userId = computed(() => this.supabaseService.userId());

  // State signals
  private readonly _recentTests = signal<PerformanceTest[]>([]);
  private lastRealtimeUserId: string | null = null;
  private testChannel: RealtimeChannel | null = null;

  readonly recentTests = this._recentTests.asReadonly();

  constructor() {
    effect(() => {
      const userId = this.userId();

      if (userId) {
        if (this.lastRealtimeUserId === userId) {
          return;
        }

        this.cleanup();
        this.logger.info("performance_test_data_realtime_setup_start");
        this.lastRealtimeUserId = userId;
        this.loadRecent();
        this.subscribe(userId);
      } else {
        this.logger.info("performance_test_data_user_logged_out_cleanup");
        this._recentTests.set([]);
        this.cleanup();
      }
    });
  }

  private cleanup(): void {
    if (this.testChannel) {
      this.supabaseService.unsubscribe(this.testChannel);
    }
    this.testChannel = null;
    this.lastRealtimeUserId = null;
  }

  private loadRecent(): void {
    const userId = this.userId();
    if (!userId) return;

    this.getPerformanceTests("3m").subscribe({
      next: ({ data }) => {
        this._recentTests.set(data);
        this.logger.success("performance_test_data_loaded");
      },
      error: (error) => {
        this.logger.error("performance_test_data_load_failed", error);
      },
    });
  }

  private subscribe(userId: string): void {
    if (this.testChannel) {
      this.supabaseService.unsubscribe(this.testChannel);
    }

    this.testChannel = this.supabaseService.client
      .channel(`performance_tests:${userId}`)
      .on("broadcast", { event: "performance_test_change" }, (payload) => {
        this.handleBroadcast(payload.payload as RealtimeBroadcastPayload);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          this.logger.debug("performance_test_data_broadcast_subscribed");
        }
      });
  }

  private handleBroadcast(payload: RealtimeBroadcastPayload): void {
    if (!payload.record) return;
    const test = this.transformTest(payload.record as DatabaseTest);
    const current = this._recentTests();

    if (payload.operation === "INSERT") {
      this._recentTests.set([test, ...current]);
      return;
    }

    if (payload.operation === "UPDATE") {
      const index = current.findIndex((t) => t.id === test.id);
      if (index !== -1) {
        const updated = [...current];
        updated[index] = test;
        this._recentTests.set(updated);
      }
      return;
    }

    if (payload.operation === "DELETE") {
      this._recentTests.set(current.filter((t) => t.id !== test.id));
    }
  }

  private transformTest(data: DatabaseTest): PerformanceTest {
    return {
      id: data.id,
      userId: data.user_id,
      testType: data.test_type ?? data.test_name,
      result: data.result_value,
      target: data.target_value,
      timestamp: data.test_date ?? data.performed_at,
      conditions: data.conditions ?? data.test_conditions,
    };
  }

  // Public API

  getPerformanceTests(
    timeframe = "12m",
    testType?: string,
  ): Observable<{
    data: PerformanceTest[];
    trends: Record<string, TrendValue>;
    summary: TestSummary;
    pagination: { total: number };
  }> {
    const userId = this.userId();

    if (!userId) {
      return of({
        data: [] as PerformanceTest[],
        trends: {} as Record<string, TrendValue>,
        summary: { totalTests: 0 } as TestSummary,
        pagination: { total: 0 },
      });
    }

    const days = parseTimeframeToDays(timeframe);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return from(
      (async () => {
        let query = this.supabaseService.client
          .from("performance_tests")
          .select("*")
          .eq("user_id", userId)
          .gte("test_date", cutoffDate.toISOString());

        if (testType) {
          query = query.eq("test_type", testType);
        }

        const { data, error } = await query.order("test_date", {
          ascending: false,
        });

        if (error) {
          if (isBenignSupabaseQueryError(error)) {
            this.logger.warn(
              "performance_test_data_unavailable_environment",
              error,
            );
            return {
              data: [] as PerformanceTest[],
              trends: {} as Record<string, TrendValue>,
              summary: { totalTests: 0 } as TestSummary,
              pagination: { total: 0 },
            };
          }
          this.logger.error("performance_test_data_fetch_error", error);
          throw error;
        }

        const tests: PerformanceTest[] = (data || []).map(
          (t: DatabaseTest) => ({
            id: t.id,
            userId: t.user_id,
            testType: t.test_type ?? t.test_name,
            result: t.result_value,
            target: t.target_value,
            timestamp: t.test_date ?? t.performed_at,
            conditions: t.conditions ?? t.test_conditions,
          }),
        );

        // Calculate basic trends
        const trends: Record<string, TrendValue> = {};
        const summary: TestSummary = { totalTests: tests.length };

        return {
          data: tests,
          trends,
          summary,
          pagination: { total: tests.length },
        };
      })(),
    ).pipe(
      catchError((error) => {
        if (!isBenignSupabaseQueryError(error)) {
          this.logger.error("performance_test_data_fetch_failed", error);
        }
        return of({
          data: [] as PerformanceTest[],
          trends: {} as Record<string, TrendValue>,
          summary: { totalTests: 0 } as TestSummary,
          pagination: { total: 0 },
        });
      }),
    );
  }
}
