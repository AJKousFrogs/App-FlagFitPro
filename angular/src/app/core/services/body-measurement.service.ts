import { Injectable, computed, inject, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";

/** One body measurement as the client sees it (mapped by performance-data.js). */
export interface BodyMeasurement {
  id: string;
  weight: number | null;
  height: number | null;
  bodyFat: number | null;
  muscleMass: number | null;
  /** ISO timestamp (created_at) — the measurement's date. */
  timestamp: string;
}

interface MeasurementsResponse {
  data?: BodyMeasurement[];
}

/**
 * BodyMeasurementService — the athlete's own body-mass history + logging.
 *
 * Reads/writes the pre-existing `/api/performance-data/measurements` lane
 * (GET history, POST a new measurement → `physical_measurements`). Purely the
 * athlete's own data (the endpoint self-scopes to the auth user). No fabricated
 * values: an empty history stays empty, and the trend renders its honest
 * empty state until ≥ 2 real logs exist.
 */
@Injectable({ providedIn: "root" })
export class BodyMeasurementService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  private readonly _history = signal<BodyMeasurement[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  /** Weight logs, chronological (oldest → newest), weight present. */
  readonly weightHistory = computed(() =>
    [...this._history()]
      .filter((m) => typeof m.weight === "number" && Number.isFinite(m.weight))
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      ),
  );

  readonly latest = computed(() => {
    const h = this.weightHistory();
    return h.length ? h[h.length - 1] : null;
  });

  /** Latest logged weight in kg, or null. */
  readonly latestWeightKg = computed(() => this.latest()?.weight ?? null);

  async loadHistory(timeframe = "12m"): Promise<void> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(
        this.api.get<MeasurementsResponse>(
          `/api/performance-data/measurements?timeframe=${timeframe}&limit=100`,
        ),
      );
      // Envelope: ApiResponse.data holds the endpoint's { data: [...], … }.
      this._history.set(res?.data?.data ?? []);
    } catch (e) {
      // Non-fatal: an unavailable/empty history is a real state, not an error
      // the athlete needs to see. Keep whatever we had.
      this.logger.error("body_measurement_history_failed", e);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Log a body-mass entry. Returns true on success. The endpoint validates
   * weight 30–300 kg; we guard the same range client-side so the error is
   * immediate and specific, never a generic server 422.
   */
  async logWeight(
    weightKg: number,
    extra?: { bodyFat?: number | null; notes?: string | null },
  ): Promise<boolean> {
    if (!(weightKg >= 30 && weightKg <= 300)) {
      this.error.set("Enter a weight between 30 and 300 kg.");
      return false;
    }
    this.saving.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(
        this.api.post("/api/performance-data/measurements", {
          weight: weightKg,
          bodyFat: extra?.bodyFat ?? undefined,
          notes: extra?.notes ?? undefined,
        }),
      );
      await this.loadHistory();
      return true;
    } catch (e) {
      this.logger.error("body_measurement_log_failed", e);
      this.error.set("Couldn't save that weight — check your connection.");
      return false;
    } finally {
      this.saving.set(false);
    }
  }
}
