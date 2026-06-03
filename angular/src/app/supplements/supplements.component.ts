import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { AvatarComponent } from "../shared/avatar.component";

import { ApiService } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";

interface SuppLog {
  supplement_name?: string;
  taken?: boolean;
  date?: string;
}

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

  readonly creatine = signal(true);
  readonly caffeine = signal(true);
  readonly beta = signal(false);

  /** creatine-taken days in the last 7 (real adherence); null until loaded. */
  readonly creatineDays = signal<number | null>(null);

  constructor() {
    this.api.get<{ logs?: SuppLog[] }>("/api/supplements/recent").subscribe({
      next: (res) => {
        const logs = res?.data?.logs ?? [];
        const days = new Set(
          logs
            .filter((l) => l.taken && /creatine/i.test(l.supplement_name ?? ""))
            .map((l) => l.date),
        );
        this.creatineDays.set(days.size);
      },
      error: (e) => this.logger.error("supplements_recent_failed", e),
    });
  }

  toggle(which: "creatine" | "caffeine" | "beta"): void {
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
      .subscribe({ error: (e) => this.logger.error("supplement_log_failed", e) });
  }
}
