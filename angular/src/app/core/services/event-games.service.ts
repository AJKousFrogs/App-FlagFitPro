import { Injectable, computed, inject, resource, signal } from "@angular/core";
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
 *
 * Follows the `resource()` convention in `core/services/README.md`. Unlike
 * the qb-throwing pilot this one is keyed on an arbitrary id rather than the
 * signed-in user: {@link load} sets the key, and the resource does the rest.
 */
@Injectable({ providedIn: "root" })
export class EventGamesService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  private readonly eventId = signal<string | null>(null);

  private readonly gamesResource = resource({
    // No event selected ⇒ undefined ⇒ the resource stays idle and never
    // fires a request for a competitionEventId that doesn't exist yet.
    params: () => this.eventId() ?? undefined,
    loader: async ({ params: competitionEventId }) => {
      try {
        const res = await firstValueFrom(
          this.api.get<{ games: EventGame[] }>("/api/event-games", {
            competitionEventId,
          }),
        );
        if (res.success && res.data) return res.data.games ?? [];
        throw new Error(res.error ?? "Could not load games");
      } catch (err) {
        this.logger.error("event_games_load_failed", err);
        throw err instanceof Error ? err : new Error("Could not load games");
      }
    },
  });

  /**
   * Empty (never null) so the three consumers can bind directly. The
   * `hasValue()` guard is required — `resource.value()` throws in an error
   * state, which would take out the whole game-day timeline on a failed
   * request instead of showing no games. See README rule 1.
   */
  readonly games = computed<EventGame[]>(() =>
    this.gamesResource.hasValue() ? this.gamesResource.value() : [],
  );
  readonly loading = this.gamesResource.isLoading;
  readonly competitionEventId = this.eventId.asReadonly();

  private readonly _mutationError = signal<string | null>(null);

  readonly error = computed<string | null>(() => {
    const mutationError = this._mutationError();
    if (mutationError) return mutationError;
    const loadError = this.gamesResource.error();
    if (!loadError) return null;
    return loadError instanceof Error ? loadError.message : String(loadError);
  });

  readonly sortedGames = computed(() =>
    [...this.games()].sort((a, b) => a.gameNumber - b.gameNumber),
  );

  /**
   * Point the service at a competition_event. Idempotent: re-calling with the
   * same id does NOT re-fetch (unchanged `params` identity), so this is safe
   * to drive straight from an effect. Falsy id ⇒ idle, games back to [].
   */
  load(competitionEventId: string): void {
    this.eventId.set(competitionEventId || null);
  }

  /** Force a re-fetch of the current event's games. */
  reload(): void {
    this.gamesResource.reload();
  }

  /**
   * Coach bulk-entry: replace the event's whole game list from an ordered
   * array of kickoff times (game_number assigned by array order).
   */
  async bulkSet(
    competitionEventId: string,
    games: EventGameInput[],
  ): Promise<EventGame[]> {
    this._mutationError.set(null);
    const res = await firstValueFrom(
      this.api.post<{ games: EventGame[] }>("/api/event-games/bulk", {
        competitionEventId,
        games,
      }),
    );
    if (res.success && res.data) {
      const saved = res.data.games ?? [];
      // The response IS the authoritative new list, so publish it directly
      // rather than paying for a refetch that would return the same rows
      // (README rule 2's exception — same reasoning as schedule#refresh).
      this.eventId.set(competitionEventId);
      this.gamesResource.value.set(saved);
      return saved;
    }
    const message = res.error ?? "Could not save the game schedule";
    this._mutationError.set(message);
    throw new Error(message);
  }

  async create(
    competitionEventId: string,
    input: EventGameInput,
  ): Promise<EventGame> {
    this._mutationError.set(null);
    const res = await firstValueFrom(
      this.api.post<EventGame>("/api/event-games", {
        competitionEventId,
        ...input,
      }),
    );
    if (res.success && res.data) {
      // Single-row responses don't carry the full list — refetch.
      this.eventId.set(competitionEventId);
      this.gamesResource.reload();
      return res.data;
    }
    const message = res.error ?? "Could not add game";
    this._mutationError.set(message);
    throw new Error(message);
  }

  async update(id: string, input: EventGameInput): Promise<EventGame> {
    this._mutationError.set(null);
    const res = await firstValueFrom(
      this.api.patch<EventGame>(`/api/event-games/${id}`, input),
    );
    if (res.success && res.data) {
      this.gamesResource.reload();
      return res.data;
    }
    const message = res.error ?? "Could not update game";
    this._mutationError.set(message);
    throw new Error(message);
  }

  async remove(id: string): Promise<void> {
    this._mutationError.set(null);
    const res = await firstValueFrom(
      this.api.delete<{ id: string; deleted: boolean }>(
        `/api/event-games/${id}`,
      ),
    );
    if (res.success) {
      this.gamesResource.reload();
      return;
    }
    const message = res.error ?? "Could not delete game";
    this._mutationError.set(message);
    throw new Error(message);
  }
}
