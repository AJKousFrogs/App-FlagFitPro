import { Injectable, signal, computed, inject } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";

/**
 * Unit System configuration
 */
export interface UnitSettings {
  distance: "metric" | "imperial";
  weight: "metric" | "imperial";
  height: "metric" | "imperial";
  time: "minutes" | "seconds";
  temperature: "fahrenheit" | "celsius";
}

/**
 * Performance test range configuration
 */
export interface PerformanceRange {
  min: number;
  max: number;
  unit: string;
  elite: string;
  good: string;
  average: string;
}

/**
 * UNIT MANAGEMENT SYSTEM
 * Handles conversions between metric and imperial units.
 * Ported from legacy unit-manager.js
 */
@Injectable({
  providedIn: "root",
})
export class UnitManagerService {
  private logger = inject(LoggerService);
  private supabase = inject(SupabaseService);

  private readonly STORAGE_KEY = "flagfit_units";

  // State
  private unitsSignal = signal<UnitSettings>(this.loadUnits());

  // Public state
  readonly units = this.unitsSignal.asReadonly();

  // Computed unit labels
  readonly distanceLabel = computed(() =>
    this.units().distance === "metric" ? "cm" : "in",
  );
  readonly weightLabel = computed(() =>
    this.units().weight === "metric" ? "kg" : "lbs",
  );
  readonly heightLabel = computed(() =>
    this.units().height === "metric" ? "cm" : "in",
  );

  constructor() {
    this.logger.info("Unit Manager Service initialized");
  }

  private loadUnits(): UnitSettings {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved
      ? JSON.parse(saved)
      : {
          distance: "imperial",
          weight: "imperial",
          height: "imperial",
          time: "minutes",
          temperature: "fahrenheit",
        };
  }

  private saveUnits(units: UnitSettings): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(units));
    this.unitsSignal.set(units);

    // Sync with Supabase profile if authenticated
    const user = this.supabase.getCurrentUser();
    if (user) {
      this.supabase.client
        .from("users")
        .update({ preferred_units: units.distance }) // The DB only has a single preference for now
        .eq("id", user.id)
        .then(({ error }) => {
          if (error)
            this.logger.error("Failed to sync unit preferences to DB:", error);
        });
    }
  }

  setDistanceUnit(unit: "metric" | "imperial"): void {
    this.saveUnits({ ...this.units(), distance: unit });
  }

  setWeightUnit(unit: "metric" | "imperial"): void {
    this.saveUnits({ ...this.units(), weight: unit });
  }

  setHeightUnit(unit: "metric" | "imperial"): void {
    this.saveUnits({ ...this.units(), height: unit });
  }

  setTimeUnit(unit: "minutes" | "seconds"): void {
    this.saveUnits({ ...this.units(), time: unit });
  }

  formatTime(
    value: number,
    preferredUnit: "minutes" | "seconds" | null = null,
  ): string {
    const unit = preferredUnit || this.units().time;

    if (unit === "seconds") {
      return `${Math.round(value)}s`;
    } else {
      const minutes = Math.floor(value / 60);
      const seconds = Math.round(value % 60);
      if (seconds === 0) {
        return `${minutes} min`;
      }
      return `${minutes}m ${seconds}s`;
    }
  }

  formatDistance(
    valueInMeters: number,
    preferredUnit: "metric" | "imperial" | null = null,
  ): string {
    const unit = preferredUnit || this.units().distance;

    if (unit === "metric") {
      if (valueInMeters >= 1000) {
        return `${(valueInMeters / 1000).toFixed(2)}km`;
      } else if (valueInMeters >= 1) {
        return `${valueInMeters.toFixed(1)}m`;
      } else {
        return `${Math.round(valueInMeters * 100)}cm`;
      }
    } else {
      const yards = valueInMeters * 1.09361;
      if (yards >= 1760) {
        return `${(yards / 1760).toFixed(2)} miles`;
      } else if (yards >= 1) {
        return `${Math.round(yards)} yds`;
      } else {
        const feet = valueInMeters * 3.28084;
        const inches = Math.round((feet % 1) * 12);
        const wholeFeet = Math.floor(feet);
        if (inches === 0) {
          return `${wholeFeet}'`;
        }
        return `${wholeFeet}'${inches}"`;
      }
    }
  }

  formatWeight(
    valueInLbs: number,
    preferredUnit: "metric" | "imperial" | null = null,
  ): string {
    const unit = preferredUnit || this.units().weight;

    if (unit === "metric") {
      return `${(valueInLbs * 0.453592).toFixed(1)}kg`;
    } else {
      return `${Math.round(valueInLbs)}lbs`;
    }
  }

  formatHeight(
    valueInInches: number,
    preferredUnit: "metric" | "imperial" | null = null,
  ): string {
    const unit = preferredUnit || this.units().height;

    if (unit === "metric") {
      return `${(valueInInches * 2.54).toFixed(1)}cm`;
    } else {
      const feet = Math.floor(valueInInches / 12);
      const inches = Math.round(valueInInches % 12);
      return inches > 0 ? `${feet}'${inches}"` : `${feet}'`;
    }
  }

  convertDistance(value: number, fromUnit: string, toUnit: string): number {
    if (fromUnit === toUnit) return value;

    let meters: number;
    switch (fromUnit) {
      case "yards":
      case "yds":
        meters = value * 0.9144;
        break;
      case "feet":
      case "ft":
        meters = value * 0.3048;
        break;
      case "inches":
      case "in":
        meters = value * 0.0254;
        break;
      case "miles":
      case "mi":
        meters = value * 1609.34;
        break;
      case "cm":
        meters = value * 0.01;
        break;
      case "meters":
      case "m":
        meters = value;
        break;
      default:
        meters = value;
    }

    switch (toUnit) {
      case "yards":
      case "yds":
        return meters / 0.9144;
      case "feet":
      case "ft":
        return meters / 0.3048;
      case "inches":
      case "in":
        return meters / 0.0254;
      case "miles":
      case "mi":
        return meters / 1609.34;
      case "cm":
        return meters / 0.01;
      case "meters":
      case "m":
        return meters;
      default:
        return meters;
    }
  }

  convertWeight(
    value: number,
    fromUnit: "lbs" | "kg",
    toUnit: "lbs" | "kg",
  ): number {
    if (fromUnit === toUnit) return value;
    if (fromUnit === "lbs" && toUnit === "kg") return value * 0.453592;
    if (fromUnit === "kg" && toUnit === "lbs") return value / 0.453592;
    return value;
  }

  convertTemperature(
    value: number,
    fromUnit: "fahrenheit" | "celsius",
    toUnit: "fahrenheit" | "celsius",
  ): number {
    if (fromUnit === toUnit) return value;
    if (fromUnit === "fahrenheit" && toUnit === "celsius")
      return ((value - 32) * 5) / 9;
    if (fromUnit === "celsius" && toUnit === "fahrenheit")
      return (value * 9) / 5 + 32;
    return value;
  }

  displayDistance(valueInInches: number): number {
    return this.units().distance === "metric"
      ? this.convertDistance(valueInInches, "inches", "cm")
      : valueInInches;
  }

  displayWeight(valueInLbs: number): number {
    return this.units().weight === "metric"
      ? this.convertWeight(valueInLbs, "lbs", "kg")
      : valueInLbs;
  }

  displayHeight(valueInInches: number): number {
    return this.units().height === "metric"
      ? this.convertDistance(valueInInches, "inches", "cm")
      : valueInInches;
  }

  storeDistance(displayValue: number): number {
    return this.units().distance === "metric"
      ? this.convertDistance(displayValue, "cm", "inches")
      : displayValue;
  }

  storeWeight(displayValue: number): number {
    return this.units().weight === "metric"
      ? this.convertWeight(displayValue, "kg", "lbs")
      : displayValue;
  }

  storeHeight(displayValue: number): number {
    return this.units().height === "metric"
      ? this.convertDistance(displayValue, "cm", "inches")
      : displayValue;
  }

  getPerformanceRanges(): Record<string, PerformanceRange> {
    const isMetric = this.units().distance === "metric";
    const distUnit = this.distanceLabel();

    return {
      fortyYardDash: {
        min: 3.5,
        max: 8.0,
        unit: "sec",
        elite: "< 4.40s",
        good: "4.40-4.65s",
        average: "4.65-4.80s",
      },
      verticalJump: {
        min: isMetric ? 38 : 15,
        max: isMetric ? 127 : 50,
        unit: distUnit,
        elite: isMetric ? "> 89cm" : "> 35in",
        good: isMetric ? "64-89cm" : "25-35in",
        average: isMetric ? "51-64cm" : "20-25in",
      },
      boxJump: {
        min: isMetric ? 51 : 20,
        max: isMetric ? 152 : 60,
        unit: distUnit,
        elite: isMetric ? "> 102cm" : "> 40in",
        good: isMetric ? "76-102cm" : "30-40in",
        average: isMetric ? "61-76cm" : "24-30in",
      },
    };
  }
}
