/**
 * Body Composition Service
 *
 * Handles physical measurements and body composition tracking.
 * Split from performance-data.service.ts for single responsibility.
 *
 * Responsibilities:
 * - Physical measurements (weight, height, body fat)
 * - BMI calculations
 * - Body composition analysis
 * - Measurement history
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { Observable, from, of } from "rxjs";
import { catchError, map } from "rxjs";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";

export interface PhysicalMeasurement {
  id?: string;
  userId?: string;
  weight: number;
  height: number;
  bodyFat?: number;
  muscleMass?: number;
  bodyWaterMass?: number;
  fatMass?: number;
  proteinMass?: number;
  boneMineralContent?: number;
  skeletalMuscleMass?: number;
  musclePercentage?: number;
  bodyWaterPercentage?: number;
  proteinPercentage?: number;
  boneMineralPercentage?: number;
  visceralFatRating?: number;
  basalMetabolicRate?: number;
  waistToHipRatio?: number;
  bodyAge?: number;
  notes?: string;
  timestamp: string;
}

export interface MeasurementsSummary {
  latest?: PhysicalMeasurement;
  changes?: {
    weight?: string;
    bodyFat?: string;
  };
}

interface BMICategory {
  category: string;
  color: string;
  description: string;
}

@Injectable({
  providedIn: "root",
})
export class BodyCompositionService {
  private supabase = inject(SupabaseService);
  private logger = inject(LoggerService);

  // Reactive state
  private readonly _measurements = signal<PhysicalMeasurement[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public computed signals
  readonly measurements = this._measurements.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly latestMeasurement = computed(() => {
    const all = this._measurements();
    return all.length > 0 ? all[0] : null;
  });

  readonly currentBMI = computed(() => {
    const latest = this.latestMeasurement();
    if (latest?.weight && latest?.height) {
      return this.calculateBMI(latest.weight, latest.height);
    }
    return null;
  });

  /**
   * Get measurements with optional filters
   */
  getMeasurements(options?: {
    limit?: number;
    timeframe?: string;
  }): Observable<{ data: PhysicalMeasurement[]; error: string | null }> {
    this._isLoading.set(true);
    this._error.set(null);

    const userId = this.supabase.userId();
    if (!userId) {
      return of({ data: [], error: "Not authenticated" });
    }

    const limit = options?.limit || 50;

    return from(
      this.supabase.client
        .from("physical_measurements")
        .select("*")
        .eq("user_id", userId)
        .order("timestamp", { ascending: false })
        .limit(limit),
    ).pipe(
      map(({ data, error }) => {
        this._isLoading.set(false);
        if (error) {
          this._error.set(error.message);
          return { data: [], error: error.message };
        }
        const measurementRows = Array.isArray(data) ? data : [];
        const measurements = measurementRows.map((m) =>
          this.transformMeasurement(m),
        );
        this._measurements.set(measurements);
        return { data: measurements, error: null };
      }),
      catchError((err) => {
        this._isLoading.set(false);
        this._error.set(err.message);
        this.logger.error("Failed to fetch measurements", err);
        return of({ data: [], error: err.message });
      }),
    );
  }

  /**
   * Log a new measurement
   */
  logMeasurement(
    measurement: Partial<PhysicalMeasurement>,
  ): Observable<{ success: boolean; error?: string }> {
    const userId = this.supabase.userId();
    if (!userId) {
      return of({ success: false, error: "Not authenticated" });
    }

    const record = {
      user_id: userId,
      weight: measurement.weight,
      height: measurement.height,
      body_fat: measurement.bodyFat,
      muscle_mass: measurement.muscleMass,
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
      timestamp: measurement.timestamp || new Date().toISOString(),
    };

    return from(
      this.supabase.client
        .from("physical_measurements")
        .insert(record)
        .select(),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          return { success: false, error: error.message };
        }
        // Update local state
        const insertedMeasurement = Array.isArray(data) ? data[0] : undefined;
        if (insertedMeasurement) {
          const newMeasurement = this.transformMeasurement(insertedMeasurement);
          this._measurements.update((prev) => [newMeasurement, ...prev]);
        }
        return { success: true };
      }),
      catchError((err) => {
        this.logger.error("Failed to log measurement", err);
        return of({ success: false, error: err.message });
      }),
    );
  }

  /**
   * Calculate BMI from weight (kg) and height (cm)
   */
  calculateBMI(weight: number, height: number): number {
    if (height <= 0 || weight <= 0) return 0;
    const heightInMeters = height / 100;
    return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
  }

  /**
   * Get BMI category with styling info
   */
  getBMICategory(bmi: number): BMICategory {
    if (bmi < 18.5) {
      return {
        category: "Underweight",
        color: "var(--color-status-info)",
        description: "Below healthy range",
      };
    } else if (bmi < 25) {
      return {
        category: "Normal",
        color: "var(--color-status-success)",
        description: "Healthy weight range",
      };
    } else if (bmi < 30) {
      return {
        category: "Overweight",
        color: "var(--color-status-warning)",
        description: "Above healthy range",
      };
    } else {
      return {
        category: "Obese",
        color: "var(--color-status-error)",
        description: "Well above healthy range",
      };
    }
  }

  /**
   * Calculate lean body mass
   */
  calculateLeanBodyMass(weight: number, bodyFat: number): number {
    if (bodyFat < 0 || bodyFat > 100) return weight;
    return Math.round(weight * (1 - bodyFat / 100) * 10) / 10;
  }

  /**
   * Transform database record to interface
   */
  private transformMeasurement(
    data: Record<string, unknown>,
  ): PhysicalMeasurement {
    return {
      id: data["id"] as string,
      userId: data["user_id"] as string,
      weight: data["weight"] as number,
      height: data["height"] as number,
      bodyFat: data["body_fat"] as number | undefined,
      muscleMass: data["muscle_mass"] as number | undefined,
      bodyWaterMass: data["body_water_mass"] as number | undefined,
      fatMass: data["fat_mass"] as number | undefined,
      proteinMass: data["protein_mass"] as number | undefined,
      boneMineralContent: data["bone_mineral_content"] as number | undefined,
      skeletalMuscleMass: data["skeletal_muscle_mass"] as number | undefined,
      musclePercentage: data["muscle_percentage"] as number | undefined,
      bodyWaterPercentage: data["body_water_percentage"] as number | undefined,
      proteinPercentage: data["protein_percentage"] as number | undefined,
      boneMineralPercentage: data["bone_mineral_percentage"] as
        | number
        | undefined,
      visceralFatRating: data["visceral_fat_rating"] as number | undefined,
      basalMetabolicRate: data["basal_metabolic_rate"] as number | undefined,
      waistToHipRatio: data["waist_to_hip_ratio"] as number | undefined,
      bodyAge: data["body_age"] as number | undefined,
      notes: data["notes"] as string | undefined,
      timestamp: data["timestamp"] as string,
    };
  }
}
