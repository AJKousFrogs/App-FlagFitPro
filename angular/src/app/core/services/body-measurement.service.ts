import { Injectable, computed, inject, resource, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";
import { lastGoodByKey } from "./resource-last-good";

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
 *
 * Follows the `resource()` convention in `core/services/README.md`, with TWO
 * deliberate deviations, both preserving pre-migration behaviour:
 *
 * 1. `history` uses {@link lastGoodByKey}, not the plain `hasValue()` read.
 *    The original explicitly kept the previous list on a failed load ("Keep
 *    whatever we had"), and it must: {@link latestWeightKg} feeds PER-KG
 *    nutrition dosing, so dropping it on a flaky refetch would swap real
 *    targets for "add your weight" (Law #7's no-bodyweight-no-targets path)
 *    even though a real weight is on record.
 * 2. `error` surfaces MUTATION failures only, never load failures. Stats
 *    renders this signal, and the original deliberately swallowed load errors
 *    — "an unavailable/empty history is a real state, not an error the athlete
 *    needs to see". Merging the load error in (as the other migrated services
 *    do) would start showing an error the original chose to hide.
 */
@Injectable({ providedIn: "root" })
export class BodyMeasurementService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly supabase = inject(SupabaseService);

  /** Lazy: only Today and Stats read this, and both call loadHistory(). */
  private readonly enabled = signal(false);
  private readonly timeframe = signal("12m");

  /**
   * Composite key — the fetch varies by BOTH athlete and timeframe, and
   * `lastGoodByKey` compares keys with `!==`, so it has to be a primitive.
   */
  private readonly historyKey = computed<string | undefined>(() => {
    if (!this.enabled()) return undefined;
    const userId = this.supabase.userId();
    return userId ? `${userId}|${this.timeframe()}` : undefined;
  });

  private readonly historyResource = resource({
    params: () => this.historyKey(),
    loader: async ({ params: key }) => {
      const timeframe = key.split("|")[1] ?? "12m";
      const res = await firstValueFrom(
        this.api.get<MeasurementsResponse>(
          `/api/performance-data/measurements?timeframe=${timeframe}&limit=100`,
        ),
      );
      // Envelope: ApiResponse.data holds the endpoint's { data: [...], … }.
      return res?.data?.data ?? [];
    },
  });

  private readonly history = lastGoodByKey(
    this.historyResource,
    () => this.historyKey(),
    [] as BodyMeasurement[],
  );

  readonly loading = this.historyResource.isLoading;
  readonly saving = signal(false);
  /** Mutation failures only — see the class comment, deviation 2. */
  readonly error = signal<string | null>(null);

  /** Weight logs, chronological (oldest → newest), weight present. */
  readonly weightHistory = computed(() =>
    [...this.history()]
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

  /**
   * Load (or reload) the history. Preserves the pre-resource contract that
   * calling this always results in a fetch — Today and Stats both call it from
   * their init, so a plain idempotent enable() would stop refetching on later
   * mounts.
   */
  loadHistory(timeframe = "12m"): void {
    const changed = this.timeframe() !== timeframe;
    this.timeframe.set(timeframe);
    if (!this.enabled()) {
      this.enabled.set(true);
      return; // params flips from undefined → a key, which loads.
    }
    // An unchanged key won't refetch on its own; force it.
    if (!changed) this.historyResource.reload();
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
      // Awaited refetch, not reload(): the caller shows the new weight
      // immediately afterwards, and this value drives per-kg dosing — the
      // pre-resource version resolved only once the fresh list was in. Same
      // reasoning as injury#refreshNow / schedule#refresh.
      await this.refreshNow();
      return true;
    } catch (e) {
      this.logger.error("body_measurement_log_failed", e);
      this.error.set("Couldn't save that weight — check your connection.");
      return false;
    } finally {
      this.saving.set(false);
    }
  }

  /** Refetch and await the fresh list before resolving. */
  private async refreshNow(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.api.get<MeasurementsResponse>(
          `/api/performance-data/measurements?timeframe=${this.timeframe()}&limit=100`,
        ),
      );
      this.historyResource.value.set(res?.data?.data ?? []);
    } catch (e) {
      // Non-fatal, and deliberately silent: an unavailable history is a real
      // state, not an error the athlete needs to see. Keeps what we had.
      this.logger.error("body_measurement_history_failed", e);
    }
  }
}
