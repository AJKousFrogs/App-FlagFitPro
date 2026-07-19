import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { firstValueFrom, retry } from "rxjs";

import { ApiService } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";
import { SeasonPhase, SeasonWindow } from "../core/models/prescription.models";

/** A team the user can join, from GET /api/team-join. */
interface TeamOption {
  id: string;
  name: string;
  homeCity: string | null;
}

/** A role the user can self-select in onboarding. `staff` roles skip the
 *  athlete-only steps and join as pending_approval (report access stays
 *  consent-gated); players join approved and see only their own data. */
interface RoleOption {
  value: string;
  label: string;
  staff: boolean;
}

/**
 * Onboarding — the multi-step setup. Ported from
 * redesign/ground-zero/02-hifi/onboarding.html (which details the season step).
 * Collects position/physicals/season-calendar/training prefs and saves via
 * POST /api/player-settings (upserts athlete_training_config + users.date_of_birth),
 * then routes to /today. The season-calendar editor is athlete-declared — the
 * player states their own windows; nothing is hardcoded. Top-level route (no shell).
 */
@Component({
  selector: "app-onboarding",
  imports: [RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./onboarding.component.html",
  styles: [
    `
      :host {
        display: block;
        max-width: 480px;
        margin: 0 auto;
        min-height: 100dvh;
      }
      .dots {
        display: flex;
        gap: var(--s-2);
      }
      .dots i {
        width: 8px;
        height: 8px;
        border-radius: var(--r-pill);
        background: var(--surface-2);
        display: inline-block;
        transition: width 0.15s;
      }
      .dots i.on {
        background: var(--accent);
        width: 20px;
      }
      .field {
        margin: var(--s-3) 0;
      }
      .field label {
        font-size: var(--fs-sm);
        color: var(--text-muted);
        display: block;
        margin-bottom: var(--s-1);
      }
      .input {
        width: 100%;
        background: var(--surface-2);
        border: 1px solid var(--border-soft);
        border-radius: var(--r-sm);
        padding: var(--s-3) var(--s-3);
        color: var(--text-strong);
        font-family: var(--font-body);
      }
      .chip.sel {
        background: var(--accent-soft);
        color: var(--accent);
        border-color: var(--accent);
      }
      .seasonrow {
        display: flex;
        gap: var(--s-2);
        align-items: center;
      }
      .seasonrow .input {
        padding: var(--s-2) var(--s-3);
      }
    `,
  ],
})
export class OnboardingComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);

  constructor() {
    // Load joinable teams for the first step. A user arriving here without an
    // invitation would otherwise never get a team — this is what lets them pick
    // one (e.g. "International Frogs").
    this.api.get<{ teams: TeamOption[] }>("/api/team-join").subscribe({
      next: (res) => {
        const teams = res?.data?.teams ?? [];
        this.teams.set(teams);
        // Single-club convenience: preselect when there's only one option.
        if (teams.length === 1) this.selectedTeamId.set(teams[0].id);
      },
      error: (e) => {
        this.logger.error("onboarding_teams_load_failed", e);
        this.teams.set([]);
      },
    });
  }

  readonly step = signal(0);

  // step 0 — team & role
  readonly teams = signal<TeamOption[]>([]);
  readonly selectedTeamId = signal<string | null>(null);
  readonly role = signal("player");
  readonly roleOptions: RoleOption[] = [
    { value: "player", label: "Player", staff: false },
    { value: "head_coach", label: "Head coach", staff: true },
    { value: "coach", label: "Coach", staff: true },
    { value: "physiotherapist", label: "Physiotherapist", staff: true },
    { value: "nutritionist", label: "Nutritionist", staff: true },
    { value: "psychologist", label: "Sport psychologist", staff: true },
    { value: "strength_conditioning_coach", label: "S&C coach", staff: true },
    { value: "manager", label: "Team manager", staff: true },
  ];
  readonly isPlayer = computed(() => this.role() === "player");

  // Player fills the full athlete profile; staff just pick team + role then a
  // short confirm. The step sequence (and the progress dots) follow from that.
  readonly stepKeys = computed<string[]>(() =>
    this.isPlayer()
      ? ["team", "position", "physicals", "season", "training"]
      : ["team", "staff"],
  );
  readonly totalSteps = computed(() => this.stepKeys().length);
  readonly currentKey = computed(() => this.stepKeys()[this.step()] ?? "team");
  readonly roleLabel = computed(
    () =>
      this.roleOptions.find((r) => r.value === this.role())?.label ?? "Member",
  );
  readonly selectedTeamName = computed(
    () =>
      this.teams().find((t) => t.id === this.selectedTeamId())?.name ??
      "your team",
  );

  setRole(value: string): void {
    this.role.set(value);
    // Changing role changes how many steps there are — clamp so we never point
    // past the end of the (now shorter) staff sequence.
    if (this.step() > this.totalSteps() - 1) {
      this.step.set(this.totalSteps() - 1);
    }
  }

  // step 1 — identity
  readonly position = signal("QB");
  readonly jersey = signal<number | null>(null);
  readonly positions = ["QB", "WR", "RB", "C", "Rusher", "Safety", "CB"];

  // step 2 — physicals (input-level bounds so garbage can't be entered/saved)
  readonly heightCm = signal<number | null>(null);
  readonly weightKg = signal<number | null>(null);
  readonly dob = signal("");
  readonly maxDob = new Date().toISOString().split("T")[0]; // no future birth dates

  // step 3 — season calendar (athlete-declared)
  readonly season = signal<SeasonWindow[]>([
    { phase: "inseason", from: "09-01", to: "04-30" },
    { phase: "offseason", from: "07-01", to: "08-15" },
  ]);
  // Picker options (legacy "transition" stays valid in the type/engine for any
  // already-stored windows, but athletes now choose "Post-season" instead).
  readonly phases: SeasonPhase[] = [
    "offseason",
    "preseason",
    "inseason",
    "peak",
    "postseason",
  ];
  readonly phaseLabels: Record<SeasonPhase, string> = {
    offseason: "Off-season",
    preseason: "Pre-season",
    inseason: "In-season",
    peak: "Peak",
    postseason: "Post-season",
    transition: "Transition",
  };

  // step 4 — training prefs
  readonly equipment = signal<Record<string, boolean>>({
    Gym: true,
    Field: true,
    Sled: false,
    Bands: true,
  });
  /**
   * "HH:MM", venue-local. Replaces the old Morning/Afternoon/Evening select
   * whose answer was sent as `preferredTime` — a key NO server code ever read
   * (found in the 2026-07-19 contract audit; the athlete's answer was silently
   * discarded). Saved through the same `teamTrainingDays.time` channel Settings
   * uses, which anchors the Phase 5b cooler-hour suggestion from day one.
   * Default matches Settings' default.
   */
  readonly trainingTime = signal("18:00");

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  next(): void {
    // Can't leave the first step without a team chosen.
    if (this.currentKey() === "team" && !this.selectedTeamId()) {
      this.error.set("Pick your team to continue.");
      return;
    }
    this.error.set(null);
    if (this.step() < this.totalSteps() - 1) this.step.update((s) => s + 1);
    else void this.finish();
  }
  back(): void {
    if (this.step() > 0) this.step.update((s) => s - 1);
  }

  toggleEquip(k: string): void {
    this.equipment.update((e) => ({ ...e, [k]: !e[k] }));
  }
  addPeriod(): void {
    this.season.update((s) => [...s, { phase: "offseason", from: "", to: "" }]);
  }
  removePeriod(i: number): void {
    this.season.update((s) => s.filter((_, idx) => idx !== i));
  }
  setPhase(i: number, phase: string): void {
    this.season.update((s) =>
      s.map((w, idx) =>
        idx === i ? { ...w, phase: phase as SeasonPhase } : w,
      ),
    );
  }
  setFrom(i: number, v: string): void {
    this.season.update((s) =>
      s.map((w, idx) => (idx === i ? { ...w, from: v } : w)),
    );
  }
  setTo(i: number, v: string): void {
    this.season.update((s) =>
      s.map((w, idx) => (idx === i ? { ...w, to: v } : w)),
    );
  }

  private async finish(): Promise<void> {
    if (this.saving()) return;
    const teamId = this.selectedTeamId();
    if (!teamId) {
      this.error.set("Pick your team first.");
      this.step.set(0);
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    try {
      // 1. Join the team with the chosen role. This creates the membership that
      //    every downstream feature keys off (roster, weather via home_city,
      //    season plan, reports). Staff join as pending_approval; players as
      //    approved — the endpoint owns that policy.
      await firstValueFrom(
        this.api
          .post("/api/team-join", {
            teamId,
            role: this.role(),
            position: this.isPlayer() ? this.position() : undefined,
          })
          .pipe(retry({ count: 1, delay: 2000 })),
      );

      // 2. Players also persist the athlete profile the engine needs (position,
      //    DOB, season) — this call is what marks their onboarding complete.
      //    Staff have no such profile; team-join marked them complete already.
      if (this.isPlayer()) {
        await firstValueFrom(
          this.api
            .post("/api/player-settings", {
              position: this.position(),
              jerseyNumber: this.jersey(),
              heightCm: this.heightCm(),
              weightKg: this.weightKg(),
              dateOfBirth: this.dob() || null,
              equipment: Object.keys(this.equipment()).filter(
                (k) => this.equipment()[k],
              ),
              // days:[] is correct for a first write — recurring practice days
              // aren't known at onboarding; the engine reads .time independently
              // (periodization-prescription parseTrainingHour), so Phase 5b gets
              // its anchor even with no days set.
              teamTrainingDays: { days: [], time: this.trainingTime() },
              seasonCalendar: this.season().filter((w) => w.from && w.to),
            })
            .pipe(retry({ count: 1, delay: 2000 })),
        );
      }

      // 3. Route to the right home for the role (staff shell vs athlete /today).
      await this.router.navigate([this.isPlayer() ? "/today" : "/staff"]);
    } catch (e) {
      this.logger.error("onboarding_save_failed", e);
      // Onboarding's whole job is to persist the team + profile the app needs.
      // Proceeding on a failure would drop the user into the app half-configured
      // and stuck — so surface the error and let them retry rather than silently
      // losing their setup.
      this.saving.set(false);
      this.error.set(
        "Couldn't finish setup — check your connection and tap Finish again.",
      );
    }
  }
}
