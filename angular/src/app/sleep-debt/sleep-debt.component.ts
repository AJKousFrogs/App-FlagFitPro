import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";

import { ApiService } from "../core/services/api.service";
import { extractApiPayload } from "../core/utils/api-response-mapper";

interface SleepNight {
  date: string;
  hoursSlept: number;
  quality: number | null;
}

/**
 * Sleep debt (athlete) — the recovery cost of under-sleeping, computed from the
 * wellness sleep log (GET /api/sleep-data → sleepHistory + age). Debt = the gap
 * between an age-appropriate target and what you actually slept, summed over the
 * last 7 nights (you can't bank sleep, so only deficits count). Server-canonical
 * data; honest empty state prompts logging sleep in Wellness when there's none.
 */
@Component({
  selector: "app-sleep-debt",
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./sleep-debt.component.html",
  styles: [
    `
      .bar { height: 8px; border-radius: var(--r-pill); background: var(--surface-2); overflow: hidden; flex: 1; }
      .bar > i { display: block; height: 100%; border-radius: var(--r-pill); }
      .nrow { display: flex; align-items: center; gap: var(--s-3); padding: var(--s-2) 0; }
      .nrow .d { width: 52px; font-size: var(--fs-sm); color: var(--text-muted); flex: 0 0 auto; }
      .nrow .h { width: 58px; text-align: right; font-size: var(--fs-sm); font-weight: var(--fw-bold); flex: 0 0 auto; }
      .big { font-family: var(--font-display); font-size: 40px; line-height: 1; font-weight: var(--fw-bold); }
    `,
  ],
})
export class SleepDebtComponent {
  private readonly api = inject(ApiService);

  readonly loaded = signal(false);
  readonly history = signal<SleepNight[]>([]);
  readonly age = signal<number | null>(null);

  constructor() {
    this.api.get<{ sleepHistory: SleepNight[]; userAge: number | null }>("/api/sleep-data").subscribe({
      next: (res) => {
        const d = extractApiPayload<{ sleepHistory: SleepNight[]; userAge: number | null }>(res) ?? {
          sleepHistory: [],
          userAge: null,
        };
        this.history.set(Array.isArray(d.sleepHistory) ? d.sleepHistory : []);
        this.age.set(d.userAge ?? null);
        this.loaded.set(true);
      },
      error: () => this.loaded.set(true),
    });
  }

  /** National Sleep Foundation: 14–17y → ~9h, adults → ~8h. */
  readonly targetHours = computed(() => {
    const a = this.age();
    return a != null && a < 18 ? 9 : 8;
  });

  readonly last7 = computed(() => this.history().slice(0, 7));

  readonly debtHours = computed(() => {
    const t = this.targetHours();
    return this.last7().reduce((sum, n) => sum + Math.max(0, t - n.hoursSlept), 0);
  });

  readonly avgHours = computed(() => {
    const nights = this.last7();
    if (!nights.length) return null;
    return nights.reduce((s, n) => s + n.hoursSlept, 0) / nights.length;
  });

  readonly debtBand = computed(() => {
    const d = this.debtHours();
    if (d <= 0.5) return { label: "on track", cls: "good" };
    if (d < 3) return { label: "minor", cls: "info" };
    if (d <= 7) return { label: "building", cls: "caution" };
    return { label: "high", cls: "danger" };
  });

  /** Per-night bar: width = proportion of target met; colour by how far under. */
  nightFill(hours: number): { width: string; cls: string } {
    const t = this.targetHours();
    const pct = Math.max(0, Math.min(100, Math.round((hours / t) * 100)));
    const cls = hours >= t ? "good" : hours >= t - 1.5 ? "caution" : "danger";
    return { width: `${pct}%`, cls };
  }
  barColor(cls: string): string {
    return cls === "good"
      ? "var(--good)"
      : cls === "caution"
        ? "var(--warn)"
        : "var(--danger)";
  }

  round1(n: number): number {
    return Math.round(n * 10) / 10;
  }
  weekday(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString([], { weekday: "short" });
  }
}
