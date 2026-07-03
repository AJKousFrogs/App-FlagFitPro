import { Injectable, computed, inject, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";

export type TravelMode = "bus" | "car" | "plane" | "train" | "other";

export interface EventTravelLeg {
  id: string;
  competitionEventId: string | null;
  teamId: string | null;
  mode: TravelMode;
  departAt: string;
  arriveAt: string;
  timezoneDeltaHours: number | null;
  overnightStay: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventTravelInput {
  mode?: TravelMode;
  departAt: string;
  arriveAt: string;
  timezoneDeltaHours?: number | null;
  overnightStay?: boolean;
  notes?: string | null;
  competitionEventId?: string | null;
}

/**
 * Event Travel Service — CRUD for declared travel legs (V2.1). Backed by
 * `/api/event-travel`. Feeds a proactive travel-aware card: today's wellness
 * check-in can suggest a travel-hours value from a declared leg instead of
 * only reacting after the fact. See docs/v2/V2.1-plan-travel.md.
 */
@Injectable({ providedIn: "root" })
export class EventTravelService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  private readonly _legs = signal<EventTravelLeg[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly legs = this._legs.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /** The leg (if any) whose window covers "now" — the trip happening today. */
  readonly legToday = computed(() => {
    const now = Date.now();
    return (
      this._legs().find((leg) => {
        const depart = new Date(leg.departAt).getTime();
        const arrive = new Date(leg.arriveAt).getTime();
        return now >= depart && now <= arrive;
      }) ?? null
    );
  });

  /** Rounded seated-travel hours for today's leg, or null if none. */
  readonly todayTravelHours = computed(() => {
    const leg = this.legToday();
    if (!leg) return null;
    const hours =
      (new Date(leg.arriveAt).getTime() - new Date(leg.departAt).getTime()) / 3_600_000;
    return Math.round(hours);
  });

  async load(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const res = await firstValueFrom(
        this.api.get<{ legs: EventTravelLeg[] }>("/api/event-travel"),
      );
      if (res.success && res.data) {
        this._legs.set(res.data.legs ?? []);
      } else {
        this._error.set(res.error ?? "Could not load travel");
      }
    } catch (err) {
      this._error.set("Could not load travel");
      this.logger.error("event_travel_load_failed", err);
    } finally {
      this._loading.set(false);
    }
  }

  async create(input: EventTravelInput): Promise<EventTravelLeg> {
    const res = await firstValueFrom(
      this.api.post<EventTravelLeg>("/api/event-travel", input),
    );
    if (res.success && res.data) {
      await this.load();
      return res.data;
    }
    throw new Error(res.error ?? "Could not add travel leg");
  }

  async remove(id: string): Promise<void> {
    const res = await firstValueFrom(
      this.api.delete<{ id: string; deleted: boolean }>(`/api/event-travel/${id}`),
    );
    if (res.success) {
      await this.load();
      return;
    }
    throw new Error(res.error ?? "Could not delete travel leg");
  }
}
