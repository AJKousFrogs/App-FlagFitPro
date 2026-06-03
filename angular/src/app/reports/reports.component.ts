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

interface TypeAgg {
  count?: number;
  totalDuration?: number;
  totalLoad?: number;
}
interface ReportStats {
  totalSessions?: number;
  totalDuration?: number;
  totalLoad?: number;
  avgDuration?: number;
  avgLoad?: number;
  currentStreak?: number;
  acwr?: number | null;
  acwrRiskZone?: string;
  acwrMessage?: string;
  sessionsByType?: Record<string, TypeAgg>;
}
interface TypeRow {
  type: string;
  count: number;
  load: number;
  pct: number;
}

/** Athlete-friendly labels for the engine's session types. */
const TYPE_LABEL: Record<string, string> = {
  sprint: "Sprint",
  strength: "Strength",
  conditioning: "Conditioning",
  mixed: "Mixed",
  mobility: "Mobility",
  technical: "Skills",
  recovery: "Recovery",
  skills: "Skills",
  flag_football: "Flag football",
  game: "Games",
};

/**
 * Reports (athlete) — a weekly/monthly training report computed server-side from
 * your own sessions (GET /api/training/stats-enhanced, windowed by startDate). No
 * stored "report" exists in the system, so this is a live summary, not a snapshot:
 * sessions, total load & minutes, current streak, the ACWR/load verdict, and a
 * by-type breakdown. Honest empty state until sessions are logged.
 */
@Component({
  selector: "app-reports",
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./reports.component.html",
  styles: [
    `
      .chips { display: flex; gap: var(--s-2); margin-bottom: var(--s-3); }
      .trow { display: flex; align-items: center; gap: var(--s-3); padding: var(--s-2) 0; }
      .trow .t { width: 96px; font-size: var(--fs-sm); color: var(--text-muted); flex: 0 0 auto; }
      .bar { height: 8px; border-radius: var(--r-pill); background: var(--surface-2); overflow: hidden; flex: 1; }
      .bar > i { display: block; height: 100%; background: var(--accent); border-radius: var(--r-pill); }
      .trow .v { width: 84px; text-align: right; font-size: var(--fs-sm); flex: 0 0 auto; }
    `,
  ],
})
export class ReportsComponent {
  private readonly api = inject(ApiService);

  readonly periodDays = signal(30);
  readonly loaded = signal(false);
  readonly stats = signal<ReportStats | null>(null);

  constructor() {
    this.fetch();
  }

  setPeriod(days: number): void {
    if (this.periodDays() === days) return;
    this.periodDays.set(days);
    this.fetch();
  }

  private fetch(): void {
    this.loaded.set(false);
    const start = new Date(Date.now() - this.periodDays() * 86_400_000)
      .toISOString()
      .split("T")[0];
    this.api
      .get<ReportStats>(`/api/training/stats-enhanced?startDate=${start}`)
      .subscribe({
        next: (res) => {
          this.stats.set(extractApiPayload<ReportStats>(res) ?? null);
          this.loaded.set(true);
        },
        error: () => {
          this.stats.set(null);
          this.loaded.set(true);
        },
      });
  }

  readonly hasData = computed(() => (this.stats()?.totalSessions ?? 0) > 0);

  readonly typeRows = computed<TypeRow[]>(() => {
    const by = this.stats()?.sessionsByType ?? {};
    const rows = Object.entries(by).map(([type, a]) => ({
      type: TYPE_LABEL[type] ?? type.replace(/_/g, " "),
      count: a.count ?? 0,
      load: Math.round(a.totalLoad ?? 0),
    }));
    const max = Math.max(1, ...rows.map((r) => r.load));
    return rows
      .sort((a, b) => b.load - a.load)
      .map((r) => ({ ...r, pct: Math.round((r.load / max) * 100) }));
  });

  readonly acwrBand = computed(() => {
    const r = this.stats()?.acwr;
    if (r == null) return { label: "building", cls: "neutral" };
    const v = r.toFixed(2);
    if (r > 1.5) return { label: `${v} · high risk`, cls: "danger" };
    if (r > 1.3) return { label: `${v} · elevated`, cls: "caution" };
    if (r < 0.8) return { label: `${v} · under-training`, cls: "caution" };
    return { label: `${v} · sweet spot`, cls: "good" };
  });

  hours(min: number | undefined): string {
    const m = min ?? 0;
    return m >= 60 ? `${(m / 60).toFixed(1)}h` : `${m}m`;
  }
}
