import { Injectable, computed, inject, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";
import { ScheduleService } from "./schedule.service";
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
 */
@Injectable({ providedIn: "root" })
export class AthleteEventsService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly schedule = inject(ScheduleService);

  private readonly _events = signal<AthleteEvent[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  /** Athlete-entered events, soonest first. */
  readonly events = this._events.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /** Upcoming athlete-entered events only (ends in the future). */
  readonly upcoming = computed(() => {
    const now = Date.now();
    return this._events().filter(
      (e) =>
        e.status !== "cancelled" &&
        new Date(e.endsAt ?? e.startsAt).getTime() >= now,
    );
  });

  /** Load (or reload) the athlete's events. */
  async load(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const res = await firstValueFrom(
        this.api.get<{ events: AthleteEvent[] }>("/api/athlete-events"),
      );
      if (res.success && res.data) {
        this._events.set(res.data.events ?? []);
      } else {
        this._error.set(res.error ?? "Could not load events");
      }
    } catch (err) {
      this._error.set("Could not load events");
      this.logger.error("athlete_events_load_failed", err);
    } finally {
      this._loading.set(false);
    }
  }

  async create(input: AthleteEventInput): Promise<AthleteEvent | null> {
    const res = await firstValueFrom(
      this.api.post<AthleteEvent>("/api/athlete-events", input),
    );
    if (res.success && res.data) {
      await this.load();
      await this.schedule.refresh();
      return res.data;
    }
    throw new Error(res.error ?? "Could not add event");
  }

  async update(
    id: string,
    input: Partial<AthleteEventInput>,
  ): Promise<AthleteEvent | null> {
    const res = await firstValueFrom(
      this.api.put<AthleteEvent>(`/api/athlete-events/${id}`, input),
    );
    if (res.success && res.data) {
      await this.load();
      await this.schedule.refresh();
      return res.data;
    }
    throw new Error(res.error ?? "Could not update event");
  }

  async remove(id: string): Promise<void> {
    const res = await firstValueFrom(
      this.api.delete<{ id: string; deleted: boolean }>(
        `/api/athlete-events/${id}`,
      ),
    );
    if (res.success) {
      await this.load();
      await this.schedule.refresh();
      return;
    }
    throw new Error(res.error ?? "Could not delete event");
  }
}
