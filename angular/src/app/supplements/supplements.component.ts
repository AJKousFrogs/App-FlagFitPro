import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { AvatarComponent } from "../shared/avatar.component";

import { ApiService } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";
import { ScheduleService } from "../core/services/schedule.service";
import { SupabaseService } from "../core/services/supabase.service";
import { EventGamesService } from "../core/services/event-games.service";

interface SuppLog {
  supplement_name?: string;
  taken?: boolean;
  date?: string;
}

// V2.1 caffeine-timing constants (documented starting points — see
// SOURCE_OF_TRUTH.md's "calibration constants" convention). No per-athlete
// bedtime setting exists yet, so a conservative fixed target bedtime is used
// for the sleep-cutoff guard rather than fabricating a personalized one.
const CAFFEINE_MG_PER_KG = 3;
const CAFFEINE_LEAD_MINUTES = 50;
const ASSUMED_BEDTIME_HOUR = 23;
const SLEEP_CUTOFF_HOURS = 8;
const FALLBACK_BODYWEIGHT_KG = 80;

/**
 * Supplements — the dedicated stack/log screen. Ported 1:1 from
 * redesign/ground-zero/02-hifi/supplements.html. Today's toggles upsert via
 * POST /api/supplements (the daily log); adherence is computed from the real
 * last-7-days logs (GET /api/supplements/recent). Supplements are engine CONTEXT,
 * not an ACWR term — the caffeine note states the honesty rule.
 */
@Component({
  selector: "app-supplements",
  standalone: true,
  imports: [AvatarComponent, RouterLink, LucideAngularModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./supplements.component.html",
})
export class SupplementsComponent {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly schedule = inject(ScheduleService);
  private readonly supabase = inject(SupabaseService);
  private readonly eventGames = inject(EventGamesService);

  // --- V2.1 caffeine timing (game-day only) ---
  readonly nextEvent = this.schedule.nextEvent;
  readonly isGameDay = computed(() => this.schedule.currentPhase() === "competition");

  private readBodyweight(): number {
    // Mirrors PeriodizationService's private readBodyweight (see also
    // tournament-plan.service.ts) — no dedicated profile signal exists yet.
    const user = this.supabase.currentUser?.();
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const candidates = [meta["weight_kg"], meta["bodyweight_kg"], meta["weight"]];
    for (const c of candidates) {
      const n = typeof c === "number" ? c : Number(c);
      if (Number.isFinite(n) && n > 30 && n < 200) return n;
    }
    return FALLBACK_BODYWEIGHT_KG;
  }

  /** Suggested pre-game dose, timing, and a sleep-cutoff guard for a late-day top-up. */
  readonly caffeineTiming = computed(() => {
    if (!this.isGameDay()) return null;
    const ev = this.nextEvent();
    if (!ev) return null;
    const bodyweight = this.readBodyweight();
    const doseMg = Math.round(CAFFEINE_MG_PER_KG * bodyweight);

    const games = this.eventGames.sortedGames();
    const firstKickoff = games.length > 0 ? games[0].kickoffTime.slice(0, 5) : null;
    const lastGame = games.length > 0 ? games[games.length - 1] : null;

    let topUpWarning: string | null = null;
    if (lastGame) {
      const [h, m] = lastGame.kickoffTime.split(":").map(Number);
      const lastEndMinutes = h * 60 + m + lastGame.expectedDurationMinutes;
      const bedtimeMinutes = ASSUMED_BEDTIME_HOUR * 60;
      const hoursToBed = (bedtimeMinutes - lastEndMinutes) / 60;
      if (hoursToBed < SLEEP_CUTOFF_HOURS) {
        topUpWarning = `Skip a caffeine top-up before the last game — it's within ${SLEEP_CUTOFF_HOURS}h of a typical bedtime. Tonight's sleep matters more than one more edge.`;
      }
    }

    return {
      doseMg,
      leadMinutes: CAFFEINE_LEAD_MINUTES,
      firstKickoff,
      topUpWarning,
      multiGame: games.length > 1,
    };
  });

  readonly creatine = signal(true);
  readonly caffeine = signal(true);
  readonly beta = signal(false);

  /** creatine-taken days in the last 7 (real adherence); null until loaded. */
  readonly creatineDays = signal<number | null>(null);

  // add-to-stack inline form
  readonly adding = signal(false);
  readonly newName = signal("");
  readonly newDose = signal("");
  readonly added = signal<string[]>([]);

  saveSupplement(): void {
    const name = this.newName().trim();
    if (!name) return;
    const dosage = this.newDose().trim();
    this.api
      .post("/api/supplements/stack", { name, dosage: dosage || null, active: true })
      .subscribe({
        next: () => {
          this.added.update((a) => [...a, name]);
          this.newName.set("");
          this.newDose.set("");
          this.adding.set(false);
        },
        error: (e) => this.logger.error("supplement_stack_failed", e),
      });
  }

  constructor() {
    // Load the next event's per-game kickoff times (if the coach entered
    // Tournament Mode data) so the caffeine top-up guard can see the last
    // game's finish time instead of only the day-level event.
    effect(() => {
      const ev = this.nextEvent();
      if (ev?.id) this.eventGames.load(ev.id);
    });

    this.api.get<{ logs?: SuppLog[] }>("/api/supplements/recent").subscribe({
      next: (res) => {
        const logs = res?.data?.logs ?? [];
        const days = new Set(
          logs
            .filter((l) => l.taken && /creatine/i.test(l.supplement_name ?? ""))
            .map((l) => l.date),
        );
        this.creatineDays.set(days.size);

        // Reflect today's ACTUAL logged state instead of fabricated ON/ON/OFF —
        // re-toggling otherwise overwrites the real daily log with literals.
        const todayKey = new Date().toISOString().slice(0, 10);
        const takenToday = (re: RegExp): boolean =>
          logs.some(
            (l) => l.date === todayKey && !!l.taken && re.test(l.supplement_name ?? ""),
          );
        this.creatine.set(takenToday(/creatine/i));
        this.caffeine.set(takenToday(/caffeine/i));
        this.beta.set(takenToday(/beta/i));
      },
      error: (e) => this.logger.error("supplements_recent_failed", e),
    });
  }

  toggle(which: "creatine" | "caffeine" | "beta"): void {
    const sig = { creatine: this.creatine, caffeine: this.caffeine, beta: this.beta }[which];
    const prev = sig();
    sig.set(!prev);
    this.api
      .post("/api/supplements", {
        supplements: [
          { name: "Creatine", taken: this.creatine(), dosage: "5 g" },
          { name: "Caffeine", taken: this.caffeine(), dosage: "200 mg", timeOfDay: "pre-session" },
          { name: "Beta-alanine", taken: this.beta(), dosage: "4 g" },
        ],
      })
      // Revert the optimistic flip on failure (don't misrepresent the logged state).
      .subscribe({
        error: (e) => {
          sig.set(prev);
          this.logger.error("supplement_log_failed", e);
        },
      });
  }
}
