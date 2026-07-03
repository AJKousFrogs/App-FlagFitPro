import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { retry } from "rxjs";

import { ApiService } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";
import { SeasonPhase, SeasonWindow } from "../core/models/prescription.models";

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
  standalone: true,
  imports: [FormsModule, RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./onboarding.component.html",
  styles: [
    `
      :host { display: block; max-width: 480px; margin: 0 auto; min-height: 100dvh; }
      .dots { display: flex; gap: var(--s-2); }
      .dots i { width: 8px; height: 8px; border-radius: var(--r-pill); background: var(--surface-2); display: inline-block; transition: width .15s; }
      .dots i.on { background: var(--accent); width: 20px; }
      .field { margin: var(--s-3) 0; }
      .field label { font-size: var(--fs-sm); color: var(--text-muted); display: block; margin-bottom: var(--s-1); }
      .input { width: 100%; background: var(--surface-2); border: 1px solid var(--border-soft);
        border-radius: var(--r-sm); padding: var(--s-3) var(--s-3); color: var(--text-strong); font-family: var(--font-body); }
      .chip.sel { background: var(--accent-soft); color: var(--accent); border-color: var(--accent); }
      .seasonrow { display: flex; gap: var(--s-2); align-items: center; }
      .seasonrow .input { padding: var(--s-2) var(--s-3); }
    `,
  ],
})
export class OnboardingComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);

  readonly STEPS = 4;
  readonly step = signal(0);

  // step 1 — identity
  readonly position = signal("QB");
  readonly jersey = signal<number | null>(null);
  readonly positions = ["QB", "WR", "RB", "C", "Rusher", "Safety", "CB"];

  // step 2 — physicals (input-level bounds so garbage can't be entered/saved)
  readonly heightCm = signal<number | null>(null);
  readonly weightKg = signal<number | null>(null);
  readonly dob = signal("");
  readonly maxDob = new Date().toISOString().split("T")[0]; // no future birth dates

  // step 3 — season calendar (athlete-declared). Default is the club's actual
  // annual calendar (2026-07-03: confirmed real dates, not a proposal) — a
  // split flag-football season with two competitive blocks (April-July,
  // August-September) separated by a mid-year break, a full-October
  // peak/playoff window, a November recovery window, and a Dec-Feb winter
  // off-season — fully editable; the athlete's own calendar always wins once
  // they touch it. Windows are contiguous ("to" of one = day before "from" of
  // the next) so macroPhaseFor never falls through to the generic fallback
  // for a date in the default calendar. Winter off-season's "to": "02-29"
  // (not "02-28") deliberately covers Feb 29 in leap years while still
  // matching correctly in non-leap years (Feb 28 <= "02-29" either way).
  readonly season = signal<SeasonWindow[]>([
    { phase: "preseason", from: "03-01", to: "03-31" }, // pre-season
    { phase: "inseason", from: "04-01", to: "07-07" }, // mid-season #1
    { phase: "offseason", from: "07-08", to: "08-14" }, // first off-season break
    { phase: "inseason", from: "08-15", to: "09-30" }, // mid-season #2
    { phase: "peak", from: "10-01", to: "10-31" }, // peak season (whole October)
    { phase: "postseason", from: "11-01", to: "11-30" }, // recovery season
    { phase: "offseason", from: "12-01", to: "02-29" }, // winter off-season (Dec-Feb, wraps year end)
  ]);
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
  };

  // step 4 — training prefs
  readonly equipment = signal<Record<string, boolean>>({ Gym: true, Field: true, Sled: false, Bands: true });
  readonly preferredTime = signal("evening");

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  next(): void {
    if (this.step() < this.STEPS - 1) this.step.update((s) => s + 1);
    else this.finish();
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
    this.season.update((s) => s.map((w, idx) => (idx === i ? { ...w, phase: phase as SeasonPhase } : w)));
  }
  setFrom(i: number, v: string): void {
    this.season.update((s) => s.map((w, idx) => (idx === i ? { ...w, from: v } : w)));
  }
  setTo(i: number, v: string): void {
    this.season.update((s) => s.map((w, idx) => (idx === i ? { ...w, to: v } : w)));
  }

  private finish(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    this.api
      .post("/api/player-settings", {
        position: this.position(),
        jerseyNumber: this.jersey(),
        heightCm: this.heightCm(),
        weightKg: this.weightKg(),
        dateOfBirth: this.dob() || null,
        equipment: Object.keys(this.equipment()).filter((k) => this.equipment()[k]),
        preferredTime: this.preferredTime(),
        seasonCalendar: this.season().filter((w) => w.from && w.to),
      })
      .pipe(retry({ count: 1, delay: 2000 }))
      .subscribe({
        next: () => this.router.navigate(["/today"]),
        error: (e) => {
          this.logger.error("onboarding_save_failed", e);
          // Onboarding's whole job is to persist the profile the engine needs
          // (position, DOB, season). Proceeding on a save failure would drop the
          // athlete into the app with no profile and no way back in — so surface
          // the error and let them retry rather than silently losing their setup.
          this.saving.set(false);
          this.error.set(
            "Couldn't save your profile — check your connection and tap Finish again.",
          );
        },
      });
  }
}
