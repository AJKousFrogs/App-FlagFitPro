import { Injectable, computed, inject, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";
import { EventGame, EventGameInput } from "../models/tournament-plan.models";

/**
 * Event Games Service — CRUD for per-game kickoff times (V2.0 Tournament
 * Mode). Backed by `/api/event-games`. `TournamentPlanService` reads
 * {@link games} to generate the gap-classified day timeline; coaches write
 * through {@link bulkSet} (the "paste 11:00, 12:30, 15:30, 17:00" flow) or
 * individual {@link create}/{@link update} calls to re-time a single game.
 */
@Injectable({ providedIn: "root" })
export class EventGamesService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  private readonly _games = signal<EventGame[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _competitionEventId = signal<string | null>(null);

  readonly games = this._games.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly competitionEventId = this._competitionEventId.asReadonly();

  readonly sortedGames = computed(() =>
    [...this._games()].sort((a, b) => a.gameNumber - b.gameNumber),
  );

  /** Load the game list for a competition_event. No-op games if the event has none entered yet. */
  async load(competitionEventId: string): Promise<void> {
    if (!competitionEventId) {
      this._games.set([]);
      return;
    }
    this._competitionEventId.set(competitionEventId);
    this._loading.set(true);
    this._error.set(null);
    try {
      const res = await firstValueFrom(
        this.api.get<{ games: EventGame[] }>("/api/event-games", {
          competitionEventId,
        }),
      );
      if (res.success && res.data) {
        this._games.set(res.data.games ?? []);
      } else {
        this._games.set([]);
        this._error.set(res.error ?? "Could not load games");
      }
    } catch (err) {
      this._games.set([]);
      this._error.set("Could not load games");
      this.logger.error("event_games_load_failed", err);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Coach bulk-entry: replace the event's whole game list from an ordered
   * array of kickoff times (game_number assigned by array order).
   */
  async bulkSet(
    competitionEventId: string,
    games: EventGameInput[],
  ): Promise<EventGame[]> {
    const res = await firstValueFrom(
      this.api.post<{ games: EventGame[] }>("/api/event-games/bulk", {
        competitionEventId,
        games,
      }),
    );
    if (res.success && res.data) {
      this._games.set(res.data.games ?? []);
      return res.data.games ?? [];
    }
    throw new Error(res.error ?? "Could not save the game schedule");
  }

  async create(
    competitionEventId: string,
    input: EventGameInput,
  ): Promise<EventGame> {
    const res = await firstValueFrom(
      this.api.post<EventGame>("/api/event-games", {
        competitionEventId,
        ...input,
      }),
    );
    if (res.success && res.data) {
      await this.load(competitionEventId);
      return res.data;
    }
    throw new Error(res.error ?? "Could not add game");
  }

  async update(id: string, input: EventGameInput): Promise<EventGame> {
    const res = await firstValueFrom(
      this.api.patch<EventGame>(`/api/event-games/${id}`, input),
    );
    if (res.success && res.data) {
      const eventId = this._competitionEventId();
      if (eventId) await this.load(eventId);
      return res.data;
    }
    throw new Error(res.error ?? "Could not update game");
  }

  async remove(id: string): Promise<void> {
    const res = await firstValueFrom(
      this.api.delete<{ id: string; deleted: boolean }>(
        `/api/event-games/${id}`,
      ),
    );
    if (res.success) {
      const eventId = this._competitionEventId();
      if (eventId) await this.load(eventId);
      return;
    }
    throw new Error(res.error ?? "Could not delete game");
  }
}
