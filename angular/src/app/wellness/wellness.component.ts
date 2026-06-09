import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { AvatarComponent } from "../shared/avatar.component";
import { ReadinessTrendComponent } from "../shared/readiness-trend.component";

/** Shape of a row from GET /api/supplements/recent. */
interface SuppLog {
  supplement_name?: string;
  taken?: boolean;
  date?: string;
}

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
  imports: [AvatarComponent, ReadinessTrendComponent, RouterLink, LucideAngularModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./wellness.component.html",
})
export class WellnessComponent {
  private readonly wellnessSvc = inject(WellnessService);
  private readonly readinessSvc = inject(ReadinessService);
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);

  private prefilledCheckin = false;

  constructor() {
    // Prefill the sliders from today's existing daily_wellness_checkin row so the
    // form shows what was actually logged instead of fixed defaults. Without this,
    // reopening Wellness shows 7/7.5/4/6/7/3 and re-submitting (an upsert) would
    // overwrite the real entry with those literals — corrupting readiness/ACWR.
    // WellnessService auto-loads on login; prefill once when today's row appears.
    effect(() => {
      if (this.prefilledCheckin) return;
      const todayKey = new Date().toISOString().slice(0, 10);
      const entry = this.wellnessSvc.wellnessData().find((e) => e.date === todayKey);
      if (!entry) return;
      this.prefilledCheckin = true;
      if (entry.sleep != null) this.sleepQuality.set(entry.sleep);
      if (entry.sleepHours != null) this.sleepHours.set(entry.sleepHours);
      if (entry.soreness != null) this.soreness.set(entry.soreness);
      if (entry.energy != null) this.energy.set(entry.energy);
      if (entry.mood != null) this.mood.set(entry.mood);
      if (entry.stress != null) this.stress.set(entry.stress);
    });

    // Reflect today's ACTUAL supplement logs rather than fabricated ON/ON/OFF —
    // otherwise re-toggling overwrites the real log with literals.
    this.api.get<{ logs?: SuppLog[] }>("/api/supplements/recent").subscribe({
      next: (res) => {
        const logs = res?.data?.logs ?? [];
        const todayKey = new Date().toISOString().slice(0, 10);
        const takenToday = (re: RegExp): boolean =>
          logs.some(
            (l) => l.date === todayKey && !!l.taken && re.test(l.supplement_name ?? ""),
          );
        this.creatine.set(takenToday(/creatine/i));
        this.caffeine.set(takenToday(/caffeine/i));
        this.beta.set(takenToday(/beta/i));
      },
      error: (e) => this.logger.error("supplements_recent_load_failed", e),
    });
  }

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
            // Recompute readiness server-side from the new check-in, THEN land on
            // Today so it reflects the just-logged session. Navigate even if the
            // recalc fails so the user is never stranded on the check-in screen.
            this.readinessSvc.calculateToday().subscribe({
              next: () => this.goToToday(),
              error: (err) => {
                this.logger.error("readiness_recalc_failed", err);
                this.goToToday();
              },
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

  private goToToday(): void {
    void this.router.navigate(["/today"]);
  }

  // --- daily supplement log (upsert batch) ---
  readonly creatine = signal(true);
  readonly caffeine = signal(true);
  readonly beta = signal(false);

  toggleSupplement(which: "creatine" | "caffeine" | "beta"): void {
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
      .subscribe({
        // Revert the optimistic flip on failure so the switch never misrepresents
        // what's actually logged (ACWR/coach views read this).
        error: (err) => {
          sig.set(prev);
          this.logger.error("supplement_log_failed", err);
        },
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
      .post("/api/hydration/log", { amount: ml })
      .subscribe({
        // Roll the optimistic total back if the log didn't persist, so the UI
        // never shows water that isn't actually recorded.
        error: (err) => {
          this.hydrationMl.update((v) => v - ml);
          this.logger.error("hydration_log_failed", err);
        },
      });
  }
  readonly hydrationL = computed(() => (this.hydrationMl() / 1000).toFixed(1));
}
