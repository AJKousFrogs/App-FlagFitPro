import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";

import { WellnessService } from "../core/services/wellness.service";
import { ReadinessService } from "../core/services/readiness.service";
import { ApiService } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";

/**
 * Wellness — the daily check-in. Ported 1:1 from
 * redesign/ground-zero/02-hifi/wellness.html. The sliders submit to the kept
 * WellnessService (RPC upsert_wellness_checkin), the supplement toggles upsert
 * via POST /api/supplements (the daily log we built), hydration via
 * /api/hydration/log. Readiness is read server-canonical — never re-derived.
 */
@Component({
  selector: "app-wellness",
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./wellness.component.html",
})
export class WellnessComponent {
  private readonly wellnessSvc = inject(WellnessService);
  private readonly readinessSvc = inject(ReadinessService);
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  readonly today = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  // --- check-in sliders ---
  readonly sleepQuality = signal(7);
  readonly sleepHours = signal(7.5);
  readonly soreness = signal(4);
  readonly energy = signal(6);
  readonly mood = signal(7);
  readonly stress = signal(3);

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly submitError = signal<string | null>(null);

  submitCheckin(): void {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.submitError.set(null);
    this.wellnessSvc
      .logWellness({
        sleep: this.sleepQuality(),
        sleepHours: this.sleepHours(),
        soreness: this.soreness(),
        energy: this.energy(),
        mood: this.mood(),
        stress: this.stress(),
      })
      .subscribe({
        next: (res) => {
          this.submitting.set(false);
          if (res.success) {
            this.submitted.set(true);
            // refresh readiness (recomputed server-side from the new check-in)
            this.readinessSvc.calculateToday().subscribe({
              error: (err) => this.logger.error("readiness_recalc_failed", err),
            });
          } else {
            this.submitError.set(res.error ?? "Could not save check-in");
          }
        },
        error: (err) => {
          this.submitting.set(false);
          this.submitError.set("Could not save check-in");
          this.logger.error("wellness_submit_failed", err);
        },
      });
  }

  // --- daily supplement log (upsert batch) ---
  readonly creatine = signal(true);
  readonly caffeine = signal(true);
  readonly beta = signal(false);

  toggleSupplement(which: "creatine" | "caffeine" | "beta"): void {
    const sig = { creatine: this.creatine, caffeine: this.caffeine, beta: this.beta }[which];
    sig.set(!sig());
    this.api
      .post("/api/supplements", {
        supplements: [
          { name: "Creatine", taken: this.creatine(), dosage: "5 g" },
          { name: "Caffeine", taken: this.caffeine(), dosage: "200 mg", timeOfDay: "pre-session" },
          { name: "Beta-alanine", taken: this.beta(), dosage: "4 g" },
        ],
      })
      .subscribe({
        error: (err) => this.logger.error("supplement_log_failed", err),
      });
  }

  // --- readiness (server-canonical) ---
  readonly readiness = this.readinessSvc.current;
  readonly readinessPct = computed(() => {
    const s = this.readiness()?.score;
    return typeof s === "number" ? Math.round(s) : null;
  });
  readonly readinessBand = computed<{ label: string; cls: string } | null>(() => {
    const pct = this.readinessPct();
    if (pct == null) return null;
    const cls = pct < 55 ? "danger" : pct <= 75 ? "info" : "good";
    const word = pct < 55 ? "Low — deload" : pct <= 75 ? "Moderate" : "High — push";
    return { label: word, cls };
  });

  // --- hydration quick-add ---
  readonly hydrationMl = signal(0);
  addHydration(ml: number): void {
    this.hydrationMl.update((v) => v + ml);
    this.api
      .post("/api/hydration/log", { amountMl: ml })
      .subscribe({ error: (err) => this.logger.error("hydration_log_failed", err) });
  }
  readonly hydrationL = computed(() => (this.hydrationMl() / 1000).toFixed(1));
}
