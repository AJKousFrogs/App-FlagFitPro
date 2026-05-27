/**
 * Measurement Data Service
 *
 * Handles CRUD operations and realtime subscriptions for the
 * `physical_measurements` Supabase table.
 *
 * Extracted from performance-data.service.ts for single responsibility.
 */

import { Injectable, computed, effect, inject, signal } from "@angular/core";
import { Observable, from, of } from "rxjs";
import { catchError, map } from "rxjs";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { RealtimeBroadcastPayload } from "../models/realtime-broadcast.model";
import {
  DatabaseMeasurement,
  MeasurementsSummary,
  PaginationInfo,
  PhysicalMeasurement,
} from "../models/performance-data.models";
import { parseTimeframeToDays } from "../../shared/utils/date.utils";

@Injectable({
  providedIn: "root",
})
export class MeasurementDataService {
  private supabaseService = inject(SupabaseService);
  private logger = inject(LoggerService);

  private userId = computed(() => this.supabaseService.userId());

  // State signals
  private readonly _recentMeasurements = signal<PhysicalMeasurement[]>([]);
  private lastRealtimeUserId: string | null = null;
  private measurementChannel: RealtimeChannel | null = null;

  readonly recentMeasurements = this._recentMeasurements.asReadonly();

  readonly latestMeasurement = computed(() => {
    const measurements = this._recentMeasurements();
    return measurements.length > 0 ? measurements[0] : null;
  });

  constructor() {
    effect(() => {
      const userId = this.userId();

      if (userId) {
        if (this.lastRealtimeUserId === userId) {
          return;
        }

        this.cleanup();
        this.logger.info("measurement_data_realtime_setup_start");
        this.lastRealtimeUserId = userId;
        this.loadRecent();
        this.subscribe(userId);
      } else {
        this.logger.info("measurement_data_user_logged_out_cleanup");
        this._recentMeasurements.set([]);
        this.cleanup();
      }
    });
  }

  private cleanup(): void {
    if (this.measurementChannel) {
      this.supabaseService.unsubscribe(this.measurementChannel);
    }
    this.measurementChannel = null;
    this.lastRealtimeUserId = null;
  }

  private loadRecent(): void {
    const userId = this.userId();
    if (!userId) return;

    this.getMeasurements("3m", 1, 10).subscribe({
      next: ({ data }) => {
        this._recentMeasurements.set(data);
        this.logger.success("measurement_data_loaded");
      },
      error: (error) => {
        this.logger.error("measurement_data_load_failed", error);
      },
    });
  }

  private subscribe(userId: string): void {
    if (this.measurementChannel) {
      this.supabaseService.unsubscribe(this.measurementChannel);
    }

    this.measurementChannel = this.supabaseService.client
      .channel(`physical_measurements:${userId}`)
      .on("broadcast", { event: "measurement_change" }, (payload) => {
        this.handleBroadcast(payload.payload as RealtimeBroadcastPayload);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          this.logger.debug("measurement_data_broadcast_subscribed");
        }
      });
  }

  private handleBroadcast(payload: RealtimeBroadcastPayload): void {
    if (!payload.record) return;
    const measurement = this.transformMeasurement(
      payload.record as DatabaseMeasurement,
    );
    const current = this._recentMeasurements();

    if (payload.operation === "INSERT") {
      this._recentMeasurements.set([measurement, ...current.slice(0, 9)]);
      return;
    }

    if (payload.operation === "UPDATE") {
      const index = current.findIndex((m) => m.id === measurement.id);
      if (index !== -1) {
        const updated = [...current];
        updated[index] = measurement;
        this._recentMeasurements.set(updated);
      }
      return;
    }

    if (payload.operation === "DELETE") {
      this._recentMeasurements.set(
        current.filter((m) => m.id !== measurement.id),
      );
    }
  }

  private transformMeasurement(data: DatabaseMeasurement): PhysicalMeasurement {
    return {
      id: data.id,
      userId: data.user_id,
      weight: data.weight,
      height: data.height,
      bodyFat: data.body_fat,
      muscleMass: data.muscle_mass,
      bodyWaterMass: data.body_water_mass,
      fatMass: data.fat_mass,
      proteinMass: data.protein_mass,
      boneMineralContent: data.bone_mineral_content,
      skeletalMuscleMass: data.skeletal_muscle_mass,
      musclePercentage: data.muscle_percentage,
      bodyWaterPercentage: data.body_water_percentage,
      proteinPercentage: data.protein_percentage,
      boneMineralPercentage: data.bone_mineral_percentage,
      visceralFatRating: data.visceral_fat_rating,
      basalMetabolicRate: data.basal_metabolic_rate,
      waistToHipRatio: data.waist_to_hip_ratio,
      bodyAge: data.body_age,
      notes: data.notes,
      timestamp: data.created_at || new Date().toISOString(),
    };
  }

  // Public API

  getMeasurements(
    timeframe = "6m",
    page = 1,
    limit = 50,
  ): Observable<{
    data: PhysicalMeasurement[];
    summary: MeasurementsSummary;
    pagination: PaginationInfo;
  }> {
    const userId = this.userId();

    if (!userId) {
      this.logger.warn("measurement_no_user");
      return of({
        data: [] as PhysicalMeasurement[],
        summary: {} as MeasurementsSummary,
        pagination: { page: 1, limit, total: 0 } as PaginationInfo,
      });
    }

    const days = parseTimeframeToDays(timeframe);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return from(
      (async () => {
        const { data, error } = await this.supabaseService.client
          .from("physical_measurements")
          .select("*")
          .eq("user_id", userId)
          .gte("created_at", cutoffDate.toISOString())
          .order("created_at", { ascending: false })
          .range((page - 1) * limit, page * limit - 1);

        if (error) {
          this.logger.error("measurement_fetch_error", error);
          throw error;
        }

        const measurements: PhysicalMeasurement[] = (data || []).map(
          (m: DatabaseMeasurement) => this.transformMeasurement(m),
        );

        const summary: MeasurementsSummary = {};
        if (measurements.length > 0) {
          summary.latest = measurements[0];
          if (measurements.length > 1) {
            const previous = measurements[1];
            summary.changes = {
              weight: `${(measurements[0].weight - previous.weight).toFixed(1)} kg`,
              bodyFat:
                measurements[0].bodyFat && previous.bodyFat
                  ? `${(measurements[0].bodyFat - previous.bodyFat).toFixed(1)}%`
                  : undefined,
            };
          }
        }

        return {
          data: measurements,
          summary,
          pagination: { page, limit, total: data?.length || 0 },
        };
      })(),
    ).pipe(
      catchError((error) => {
        this.logger.error("measurement_fetch_failed", error);
        return of({
          data: [] as PhysicalMeasurement[],
          summary: {} as MeasurementsSummary,
          pagination: { page: 1, limit, total: 0 } as PaginationInfo,
        });
      }),
    );
  }

  logMeasurement(measurement: Partial<PhysicalMeasurement>): Observable<{
    success: boolean;
    data?: DatabaseMeasurement;
    error?: unknown;
  }> {
    const userId = this.userId();

    if (!userId) {
      this.logger.error("measurement_log_no_user");
      return of({
        success: false,
        error: "Not authenticated. Please log in again.",
      });
    }

    return from(
      this.supabaseService.client
        .from("physical_measurements")
        .insert({
          user_id: userId,
          weight: measurement.weight,
          height: measurement.height,
          body_fat: measurement.bodyFat,
          muscle_mass: measurement.muscleMass,
          // Enhanced body composition fields
          body_water_mass: measurement.bodyWaterMass,
          fat_mass: measurement.fatMass,
          protein_mass: measurement.proteinMass,
          bone_mineral_content: measurement.boneMineralContent,
          skeletal_muscle_mass: measurement.skeletalMuscleMass,
          muscle_percentage: measurement.musclePercentage,
          body_water_percentage: measurement.bodyWaterPercentage,
          protein_percentage: measurement.proteinPercentage,
          bone_mineral_percentage: measurement.boneMineralPercentage,
          visceral_fat_rating: measurement.visceralFatRating,
          basal_metabolic_rate: measurement.basalMetabolicRate,
          waist_to_hip_ratio: measurement.waistToHipRatio,
          body_age: measurement.bodyAge,
          notes: measurement.notes,
          created_at: measurement.timestamp || new Date().toISOString(),
        })
        .select()
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error("measurement_log_error", error);
          return { success: false, error };
        }
        this.logger.success("measurement_logged", {
          id: data.id,
        });
        return { success: true, data };
      }),
      catchError((error) => {
        this.logger.error("measurement_log_failed", error);
        return of({ success: false, error: error.message });
      }),
    );
  }
}
