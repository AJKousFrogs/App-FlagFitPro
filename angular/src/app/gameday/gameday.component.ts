import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { AvatarComponent } from "../shared/avatar.component";
import { SkeletonComponent } from "../shared/skeleton.component";

import { ScheduleService } from "../core/services/schedule.service";
import { PeriodizationService } from "../core/services/periodization.service";
import { ApiService } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";
import { TeamMembershipService } from "../core/services/team-membership.service";
import { EventGamesService } from "../core/services/event-games.service";
import { TournamentPlanService } from "../core/services/tournament-plan.service";
import { TOURNAMENT_DAY } from "../core/config/position-volume.config";
import { TournamentPlanBlock } from "../core/models/tournament-plan.models";

/**
 * Game day — go-time card + heat guard + fueling timeline + hydration. Ported 1:1
 * from redesign/ground-zero/02-hifi/gameday.html. The card reads the engine's
 * game-day prescription (reasoning + nutrition); the heat card surfaces the
 * weatherAdjustment when present; hydration → POST /api/hydration/log.
 *
 * V2.0 Tournament Mode: when the coach has entered per-game kickoff times
 * (`event_games`, 2+ games) for the next event, {@link tournamentPlan} takes
 * over the fueling/warm-up section with a real gap-classified timeline
 * instead of the flat day-level split. Falls back to the V1 static card when
 * no kickoff times are entered yet — see docs/v2/V2.0-tournament-mode.md.
 */
@Component({
  selector: "app-gameday",
  imports: [
    AvatarComponent,
    SkeletonComponent,
    RouterLink,
    LucideAngularModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./gameday.component.html",
})
export class GamedayComponent {
  private readonly schedule = inject(ScheduleService);
  private readonly periodization = inject(PeriodizationService);
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly teamMembership = inject(TeamMembershipService);
  private readonly eventGames = inject(EventGamesService);
  readonly tournamentPlan = inject(TournamentPlanService);

  readonly nextEvent = this.schedule.nextEvent;
  /** Fueling timeline gates on the schedule snapshot — skeleton until resolved. */
  readonly loading = this.schedule.loading;
  readonly rx = this.periodization.today;
  readonly weather = computed(() => this.rx()?.weatherAdjustment ?? null);
  /** Re-warm-before-every-game protocol — a multi-game tournament day stacks
   * games (08:00 / 11:30 / 13:00 / 15:00 / 16:00 / 19:00), each needing its own
   * warm-up. Shown when the day carries more than one game AND the coach
   * hasn't entered real kickoff times yet (Tournament Mode replaces this once
   * they have). */
  readonly multiGame = computed(
    () =>
      (this.nextEvent()?.expectedGameCount ?? 0) > 1 &&
      !this.tournamentPlan.isTournamentDay(),
  );
  readonly warmupNote = TOURNAMENT_DAY.note;

  readonly isCoach = this.teamMembership.isCoach;
  readonly showScheduleEditor = signal(false);
  readonly bulkKickoffInput = signal("");
  readonly bulkSaving = signal(false);
  readonly bulkError = signal<string | null>(null);

  /** Live "now" for highlighting the current/next timeline block — ticks every 60s. */
  private readonly now = signal(Date.now());

  constructor() {
    const destroyRef = inject(DestroyRef);
    const timer = setInterval(() => this.now.set(Date.now()), 60_000);
    destroyRef.onDestroy(() => clearInterval(timer));

    // Load this event's kickoff times whenever the next event changes.
    effect(() => {
      const ev = this.nextEvent();
      this.teamMembership.loadMembership().catch(() => null);
      if (ev?.id) {
        this.eventGames.load(ev.id);
      }
    });

    // Without this the hydration counter silently resets to 0 on every
    // visit/reload even though earlier logs today already persisted server-side
    // (mirrors wellness.component.ts's loadTodayHydration()).
    this.api.get<{ logs?: { amount: number }[] }>("/api/hydration").subscribe({
      next: (res) => {
        const total = (res?.data?.logs ?? []).reduce(
          (sum, l) => sum + (l.amount ?? 0),
          0,
        );
        this.hydrationMl.set(total);
      },
      error: (e) => this.logger.error("hydration_today_load_failed", e),
    });
  }

  /**
   * Pick the conditions icon + band from the actual adjustment, not a fixed sun —
   * a cold/wet/windy day must not render with a sunny glyph. Derived from the
   * heat-load factor and the engine's reason text (which carries the weather cue).
   */
  readonly conditions = computed(() => {
    const w = this.weather();
    if (!w) return null;
    const r = (w.reason ?? "").toLowerCase();
    if (w.heatLoadFactor > 1 || /too hot|feels-like.*hot|heat/.test(r))
      return { icon: "flame", band: "danger", label: "heat" };
    if (/storm|lightning/.test(r))
      return { icon: "cloud-rain", band: "danger", label: "storm" };
    if (/warm/.test(r)) return { icon: "sun", band: "caution", label: "warm" };
    if (/cold/.test(r))
      return { icon: "cloud-rain", band: "info", label: "cold" };
    if (/wind/.test(r))
      return { icon: "cloud-rain", band: "info", label: "wind" };
    if (/rain|wet/.test(r))
      return { icon: "cloud-rain", band: "info", label: "wet" };
    return {
      icon: "sun",
      band: null as string | null,
      label: null as string | null,
    };
  });

  readonly reasoning = computed(
    () =>
      this.rx()?.reasoning ??
      "Activate, play, refuel between games, sleep tonight.",
  );

  /** Tournament fueling splits derived from the engine's daily macro targets — V1 fallback when no per-game kickoff times exist. */
  readonly fuel = computed(() => {
    const n = this.rx()?.nutrition;
    if (!n) return null;
    return {
      before: Math.round(n.carbsG * 0.3),
      betweenCarb: Math.round(n.carbsG * 0.12),
      afterCarb: Math.round(n.carbsG * 0.3),
      afterProtein: Math.round(n.proteinG * 0.3),
    };
  });

  // ---------------------------------------------------------------------------
  // V2.0 Tournament Mode
  // ---------------------------------------------------------------------------

  readonly timelineBlocks = computed(
    () => this.tournamentPlan.plan()?.blocks ?? [],
  );

  /** Index of the next block that hasn't started yet, for "you are here" styling. */
  readonly nextBlockIndex = computed(() => {
    const blocks = this.timelineBlocks();
    const nowMinutes = this.minutesSinceMidnight(this.now());
    const idx = blocks.findIndex((b) => this.blockMinutes(b) >= nowMinutes);
    return idx === -1 ? blocks.length - 1 : idx;
  });

  private blockMinutes(block: TournamentPlanBlock): number {
    const [h, m] = block.time.split(":").map(Number);
    return h * 60 + m;
  }

  private minutesSinceMidnight(epochMs: number): number {
    const d = new Date(epochMs);
    return d.getHours() * 60 + d.getMinutes();
  }

  toggleScheduleEditor(): void {
    this.showScheduleEditor.update((v) => !v);
    if (!this.bulkKickoffInput()) {
      const existing = this.eventGames.sortedGames();
      if (existing.length > 0) {
        this.bulkKickoffInput.set(
          existing.map((g) => g.kickoffTime.slice(0, 5)).join(", "),
        );
      }
    }
  }

  /** Coach bulk-entry: "11:00, 12:30, 15:30, 17:00" → one event_games row per kickoff. */
  async saveKickoffTimes(): Promise<void> {
    const ev = this.nextEvent();
    if (!ev?.id) return;
    const times = this.bulkKickoffInput()
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (times.length === 0) {
      this.bulkError.set(
        "Enter at least one kickoff time (e.g. 11:00, 12:30).",
      );
      return;
    }
    const timePattern = /^\d{1,2}:\d{2}$/;
    if (times.some((t) => !timePattern.test(t))) {
      this.bulkError.set(
        "Times must be HH:MM, comma-separated (e.g. 11:00, 12:30, 15:30).",
      );
      return;
    }
    const gameDate = ev.startsAt.slice(0, 10);
    this.bulkSaving.set(true);
    this.bulkError.set(null);
    try {
      await this.eventGames.bulkSet(
        ev.id,
        times.map((kickoffTime, i) => ({
          gameNumber: i + 1,
          gameDate,
          kickoffTime,
        })),
      );
      this.showScheduleEditor.set(false);
    } catch (err) {
      this.bulkError.set(
        err instanceof Error ? err.message : "Could not save the schedule",
      );
      this.logger.error("event_games_bulk_save_failed", err);
    } finally {
      this.bulkSaving.set(false);
    }
  }

  readonly hydrationMl = signal(0);
  readonly hydrationL = computed(() => (this.hydrationMl() / 1000).toFixed(1));

  addHydration(ml: number): void {
    this.hydrationMl.update((v) => v + ml);
    this.api.post("/api/hydration/log", { amount: ml }).subscribe({
      // Roll back the optimistic total if the log didn't persist.
      error: (e) => {
        this.hydrationMl.update((v) => v - ml);
        this.logger.error("hydration_log_failed", e);
      },
    });
  }
}
