import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";

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
      .dots { display: flex; gap: 6px; }
      .dots i { width: 8px; height: 8px; border-radius: var(--r-pill); background: var(--surface-2); display: inline-block; transition: width .15s; }
      .dots i.on { background: var(--accent); width: 20px; }
      .field { margin: 10px 0; }
      .field label { font-size: var(--fs-sm); color: var(--text-muted); display: block; margin-bottom: 4px; }
      .input { width: 100%; background: var(--surface-2); border: 1px solid var(--border-soft);
        border-radius: var(--r-sm); padding: 11px 12px; color: var(--text-strong); font-family: var(--font-body); }
      .chip.sel { background: var(--accent-soft); color: var(--accent); border-color: var(--accent); }
      .seasonrow { display: flex; gap: 6px; align-items: center; }
      .seasonrow .input { padding: 8px 10px; }
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

  // step 2 — physicals
  readonly heightCm = signal<number | null>(null);
  readonly weightKg = signal<number | null>(null);
  readonly dob = signal("");

  // step 3 — season calendar (athlete-declared)
  readonly season = signal<SeasonWindow[]>([
    { phase: "inseason", from: "09-01", to: "04-30" },
    { phase: "offseason", from: "07-01", to: "08-15" },
  ]);
  readonly phases: SeasonPhase[] = ["offseason", "preseason", "inseason", "transition"];

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
      .subscribe({
        next: () => this.router.navigate(["/today"]),
        error: (e) => {
          this.logger.error("onboarding_save_failed", e);
          // don't trap the athlete on a setup error — proceed into the app
          this.router.navigate(["/today"]);
        },
      });
  }
}
