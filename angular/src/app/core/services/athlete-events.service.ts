import { Injectable, computed, inject, resource, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";
import { ScheduleService } from "./schedule.service";
import { SupabaseService } from "./supabase.service";
import { lastGoodByKey } from "./resource-last-good";
import {
  AthleteEvent,
  AthleteEventInput,
} from "../models/athlete-event.models";

/**
 * Athlete Events Service — CRUD for athlete-entered schedule events
 * (personal / domestic / national-team). Backed by `/api/athlete-events`.
 *
 * Every write refreshes {@link ScheduleService} so the periodization engine,
 * Today, and Training immediately reflect the new event (taper/recovery).
 *
 * Follows the `resource()` convention in `core/services/README.md`.
 */
@Injectable({ providedIn: "root" })
export class AthleteEventsService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly schedule = inject(ScheduleService);
  private readonly supabase = inject(SupabaseService);

  /**
   * Kept lazy on purpose. This list is only read by the Schedule screen, so
   * auto-loading on sign-in would spend a request for every athlete who never
   * opens it. {@link load} switches it on — see README rule 4.
   */
  private readonly enabled = signal(false);

  private readonly eventsResource = resource({
    params: () => (this.enabled() ? this.supabase.userId() : undefined),
    loader: async ({ params: userId }) => {
      if (!userId) return [];
      try {
        const res = await firstValueFrom(
          this.api.get<{ events: AthleteEvent[] }>("/api/athlete-events"),
        );
        if (res.success && res.data) return res.data.events ?? [];
        throw new Error(res.error ?? "Could not load events");
      } catch (err) {
        this.logger.error("athlete_events_load_failed", err);
        throw err instanceof Error ? err : new Error("Could not load events");
      }
    },
  });

  /**
   * Athlete-entered events, soonest first. `[]` until loaded and on a first
   * failed load; a failed RELOAD keeps the last good list
   * (resource-last-good.ts).
   */
  readonly events = lastGoodByKey(
    this.eventsResource,
    () => this.supabase.userId(),
    [] as AthleteEvent[],
  );
  readonly loading = this.eventsResource.isLoading;

  private readonly _mutationError = signal<string | null>(null);

  readonly error = computed<string | null>(() => {
    const mutationError = this._mutationError();
    if (mutationError) return mutationError;
    const loadError = this.eventsResource.error();
    if (!loadError) return null;
    return loadError instanceof Error ? loadError.message : String(loadError);
  });

  /** Upcoming athlete-entered events only (ends in the future). */
  readonly upcoming = computed(() => {
    const now = Date.now();
    return this.events().filter(
      (e) =>
        e.status !== "cancelled" &&
        new Date(e.endsAt ?? e.startsAt).getTime() >= now,
    );
  });

  /**
   * Load (or reload) the athlete's events. Preserves the pre-resource
   * contract that calling this always results in a fetch — the first call
   * switches the lane on, later ones force a refetch.
   */
  load(): void {
    if (this.enabled()) this.eventsResource.reload();
    else this.enabled.set(true);
  }

  async create(input: AthleteEventInput): Promise<AthleteEvent | null> {
    this._mutationError.set(null);
    const res = await firstValueFrom(
      this.api.post<AthleteEvent>("/api/athlete-events", input),
    );
    if (res.success && res.data) {
      // Single-row response — refetch the list (README rule 2).
      this.eventsResource.reload();
      // Awaited: the schedule spine feeds the engine, and callers navigate
      // straight to screens that read it.
      await this.schedule.refresh();
      return res.data;
    }
    const message = res.error ?? "Could not add event";
    this._mutationError.set(message);
    throw new Error(message);
  }

  async update(
    id: string,
    input: Partial<AthleteEventInput>,
  ): Promise<AthleteEvent | null> {
    this._mutationError.set(null);
    const res = await firstValueFrom(
      this.api.put<AthleteEvent>(`/api/athlete-events/${id}`, input),
    );
    if (res.success && res.data) {
      this.eventsResource.reload();
      await this.schedule.refresh();
      return res.data;
    }
    const message = res.error ?? "Could not update event";
    this._mutationError.set(message);
    throw new Error(message);
  }

  async remove(id: string): Promise<void> {
    this._mutationError.set(null);
    const res = await firstValueFrom(
      this.api.delete<{ id: string; deleted: boolean }>(
        `/api/athlete-events/${id}`,
      ),
    );
    if (res.success) {
      this.eventsResource.reload();
      await this.schedule.refresh();
      return;
    }
    const message = res.error ?? "Could not delete event";
    this._mutationError.set(message);
    throw new Error(message);
  }
}
