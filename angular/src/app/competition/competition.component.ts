import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { NgOptimizedImage, DatePipe } from "@angular/common";
import { TopbarComponent } from "../shared/topbar.component";
import { SkeletonComponent } from "../shared/skeleton.component";

import { ScheduleService } from "../core/services/schedule.service";
import { ApiService } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";
import { CompetitionEvent } from "../core/models/schedule.models";
import { extractApiPayload } from "../core/utils/api-response-mapper";
import {
  competitionLoadFactor,
  effectiveGameMinutes,
  type PlayingSurface,
  type PlayingWay,
} from "./competition-load.util";

interface EventGame {
  id: string;
  gameNumber: number;
  gameDate: string;
  opponent: string | null;
  expectedDurationMinutes: number;
  status: string;
}

interface PendingEvent {
  competition_event_id?: string;
  competitionEventId?: string;
  competition_name?: string;
  games_expected?: number;
  gamesExpected?: number;
}

/**
 * Competition — your events across all teams + RSVP + post-event actuals. Ported
 * 1:1 from redesign/ground-zero/02-hifi/competition.html. Events come from the
 * schedule spine (ScheduleService.upcoming); RSVP → POST /api/event-availability
 * (set_event_availability RPC); post-event → POST /api/event-participation (the
 * ACWR actuals feed). Server-canonical.
 */
@Component({
  selector: "app-competition",
  imports: [
    NgOptimizedImage,
    DatePipe,
    TopbarComponent,
    SkeletonComponent,
    RouterLink,
    LucideAngularModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./competition.component.html",
})
export class CompetitionComponent {
  private readonly schedule = inject(ScheduleService);
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  readonly upcoming = this.schedule.upcoming;
  readonly nextEvent = this.schedule.nextEvent;
  /** Upcoming list gates on the schedule snapshot — skeleton until it resolves. */
  readonly loading = this.schedule.loading;
  readonly rest = computed(() => this.upcoming().slice(1));

  // post-event participation prompt
  readonly pending = signal<PendingEvent[]>([]);
  // Slider positions are a STARTING point, not a submission. `formTouched` gates
  // the write so we never log fabricated default actuals (5 games / RPE 8) the
  // athlete never chose — that would feed garbage into ACWR. Only the games/RPE
  // sliders call touch() (see template) — the game-format chip deliberately does
  // NOT, since tapping it alone must not unlock submission of the still-default
  // games/RPE values.
  readonly games = signal(5);
  readonly avgRpe = signal(8);
  readonly formTouched = signal(false);
  readonly logged = signal(false);
  /** True once the pending-events fetch resolves (success or empty). */
  readonly pendingLoaded = signal(false);

  touch(): void {
    this.formTouched.set(true);
  }

  // Game format → per-game minutes. This is what makes 2x12 vs 2x15 vs 2x20 load
  // honest (a flat 40-min/game otherwise mis-scores the shorter formats). These are
  // the three sanctioned flag formats (IFAF/AFFL play 2×20; domestic runs 2×12/2×15).
  readonly formats = [
    { label: "2 × 12 min", min: 24 },
    { label: "2 × 15 min", min: 30 },
    { label: "2 × 20 min", min: 40 },
  ] as const;
  readonly minutesPerGame = signal(40);

  // Exposure inputs that scale the competition load fed to ACWR (single source:
  // competition-load.util.ts). Defaults are neutral/conservative and preserve the
  // app's prior behaviour: both-ways (= the old flat full-minutes model), and
  // unknown players/surface (× 1.0 — never inferred). These do NOT gate submission
  // (only games/RPE do), so an untouched card can't log a fabricated heavier day.
  readonly way = signal<PlayingWay>("both_ways");
  readonly playersPresent = signal<number | null>(null);
  readonly surface = signal<PlayingSurface>(null);
  readonly loadFactor = computed(() =>
    competitionLoadFactor(this.way(), this.playersPresent(), this.surface()),
  );
  readonly loadFactorLabel = computed(() => {
    const f = this.loadFactor();
    return f === 1 ? null : `×${f.toFixed(2)}`;
  });

  setWay(w: PlayingWay): void {
    this.way.set(w);
  }
  setSurface(s: Exclude<PlayingSurface, null>): void {
    // Tapping the selected surface again clears it back to unknown (× 1.0).
    this.surface.update((cur) => (cur === s ? null : s));
  }

  constructor() {
    // The function returns { pending: [...] } (recent ended events awaiting a
    // log). Read that key — the old `.events` read silently yielded [] so the
    // prompt never showed. A failed fetch leaves the card hidden (no defaults
    // submit possible), satisfying the "block on prefill failure" rule.
    this.api
      .get<
        { pending?: PendingEvent[]; events?: PendingEvent[] } | PendingEvent[]
      >("/api/event-participation")
      .subscribe({
        next: (res) => {
          const d = res?.data as
            | { pending?: PendingEvent[]; events?: PendingEvent[] }
            | PendingEvent[]
            | undefined;
          this.pending.set(
            Array.isArray(d) ? d : (d?.pending ?? d?.events ?? []),
          );
          this.pendingLoaded.set(true);
        },
        error: () => {
          this.pending.set([]);
          this.pendingLoaded.set(true);
        },
      });
  }

  daysTo(ev: CompetitionEvent): number {
    const ms = new Date(ev.startsAt).getTime() - Date.now();
    return Math.max(0, Math.round(ms / 864e5));
  }

  // RSVP feedback: chosen status per event, which is in-flight, and which errored.
  readonly rsvpState = signal<
    Record<string, "declined" | "maybe" | "confirmed">
  >({});
  readonly rsvpBusy = signal<string | null>(null);
  readonly rsvpError = signal<string | null>(null);

  rsvp(ev: CompetitionEvent, status: "declined" | "maybe" | "confirmed"): void {
    if (this.rsvpBusy()) return;
    this.rsvpBusy.set(ev.id);
    this.rsvpError.set(null);
    this.api
      .post("/api/event-availability", { competitionEventId: ev.id, status })
      .subscribe({
        next: () => {
          this.rsvpState.update((m) => ({ ...m, [ev.id]: status }));
          this.rsvpBusy.set(null);
        },
        error: (e) => {
          this.logger.error("rsvp_failed", e);
          this.rsvpError.set(ev.id);
          this.rsvpBusy.set(null);
        },
      });
  }
  rsvpLabel(status: string): string {
    return status === "confirmed"
      ? "You're in"
      : status === "maybe"
        ? "Maybe"
        : "Can't make it";
  }

  logParticipation(): void {
    // Never write fabricated defaults: require the athlete to have engaged the
    // form and require a real target event id.
    if (this.logged() || !this.formTouched()) return;
    const p = this.pending()[0];
    const id = p?.competition_event_id ?? p?.competitionEventId;
    if (!id) return;
    this.api
      .post("/api/event-participation", {
        competitionEventId: id,
        attended: true,
        gamesPlayed: this.games(),
        avgRpe: this.avgRpe(),
        // Load-equivalent minutes: real game-clock minutes scaled by one/both-ways,
        // players-on-the-day and surface (competition-load.util) → the Foster sRPE
        // ACWR feed. The multiplier lives in the minutes because the fixed
        // record_event_participation RPC scores load as minutes × RPE.
        totalMinutes: effectiveGameMinutes(
          this.games(),
          this.minutesPerGame(),
          this.way(),
          this.playersPresent(),
          this.surface(),
        ),
        // Context recorded for coach transparency (the multiplier is already in
        // totalMinutes; the server stores this breakdown in the session note).
        playedBothWays: this.way() === "both_ways",
        playersPresent: this.playersPresent(),
        surface: this.surface(),
      })
      .subscribe({
        next: () => this.logged.set(true),
        error: (e) => this.logger.error("participation_failed", e),
      });
  }

  pendingGamesExpected(): number {
    const p = this.pending()[0];
    return p?.games_expected ?? p?.gamesExpected ?? 8;
  }

  // ── Per-game actuals (docs/SOURCE_OF_TRUTH.md §4a/§4b, 2026-07-24/25) ──────
  // Additive alternative to the aggregate "how it went" card above: log one
  // SPECIFIC game's attendance/minutes/RPE instead of a whole-event total.
  // Presented as either/or for a given event — logging some games individually
  // and also submitting the aggregate for the same event can have the two
  // overwrite each other's training-load day (both are idempotent-by-day), so
  // the UI doesn't offer them side by side as if they stack.
  readonly perGameMode = signal(false);
  readonly eventGames = signal<EventGame[]>([]);
  readonly gamesLoading = signal(false);
  readonly gamesError = signal<string | null>(null);
  readonly selectedGameId = signal<string | null>(null);
  readonly gameAttended = signal(true);
  readonly gameRpe = signal(7);
  readonly gameLogging = signal(false);
  readonly loggedGameIds = signal<ReadonlySet<string>>(new Set());

  readonly selectedGame = computed(() =>
    this.eventGames().find((g) => g.id === this.selectedGameId()) ?? null,
  );

  enterPerGameMode(): void {
    this.perGameMode.set(true);
    if (this.eventGames().length || this.gamesLoading()) return;
    const p = this.pending()[0];
    const id = p?.competition_event_id ?? p?.competitionEventId;
    if (!id) return;
    this.gamesLoading.set(true);
    this.gamesError.set(null);
    this.api
      .get<EventGame[]>(`/api/event-games?competitionEventId=${id}`)
      .subscribe({
        next: (res) => {
          const games = extractApiPayload<EventGame[]>(res) ?? [];
          this.eventGames.set(games);
          this.gamesLoading.set(false);
        },
        error: (e) => {
          this.logger.error("event_games_load_failed", e);
          this.gamesError.set("Could not load this event's games.");
          this.gamesLoading.set(false);
        },
      });
  }

  exitPerGameMode(): void {
    this.perGameMode.set(false);
    this.selectedGameId.set(null);
  }

  selectGame(gameId: string): void {
    this.selectedGameId.set(gameId);
    this.gameAttended.set(true);
    this.gameRpe.set(7);
  }

  logGame(): void {
    if (this.gameLogging()) return;
    const p = this.pending()[0];
    const competitionEventId = p?.competition_event_id ?? p?.competitionEventId;
    const gameId = this.selectedGameId();
    const game = this.selectedGame();
    if (!competitionEventId || !gameId || !game) return;

    this.gameLogging.set(true);
    this.api
      .post("/api/event-participation", {
        competitionEventId,
        gameId,
        attended: this.gameAttended(),
        gamesPlayed: this.gameAttended() ? 1 : 0,
        avgRpe: this.gameAttended() ? this.gameRpe() : undefined,
      })
      .subscribe({
        next: () => {
          this.loggedGameIds.update((s) => new Set(s).add(gameId));
          this.gameLogging.set(false);
          this.selectedGameId.set(null);
        },
        error: (e) => {
          this.logger.error("game_participation_failed", e);
          this.gamesError.set("Could not log this game — try again.");
          this.gameLogging.set(false);
        },
      });
  }

  gameLabel(g: EventGame): string {
    return `Game ${g.gameNumber}` + (g.opponent ? ` vs ${g.opponent}` : "");
  }
}
