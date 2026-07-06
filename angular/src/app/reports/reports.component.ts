import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";

import { ApiService, API_ENDPOINTS } from "../core/services/api.service";
import {
  NutritionReportRow,
  NutritionReportsService,
} from "../core/services/nutrition-reports.service";
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
interface NutritionRec {
  priority?: string;
  message?: string;
}
/** GET /api/trends/{change-of-direction,sprint-volume}: current vs previous fortnight. */
interface WeekTrend {
  current: number;
  previous: number;
  change: number;
  weeks: unknown[];
}
/** GET /api/trends/game-performance. */
interface GameTrend {
  games: unknown[];
  averagePerformance: number;
  trend: string;
  message?: string;
}
interface TrendsState {
  cod: WeekTrend | null;
  sprint: WeekTrend | null;
  game: GameTrend | null;
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
      .chips {
        display: flex;
        gap: var(--s-2);
        margin-bottom: var(--s-3);
      }
      .trow {
        display: flex;
        align-items: center;
        gap: var(--s-3);
        padding: var(--s-2) 0;
      }
      .trow .t {
        width: 96px;
        font-size: var(--fs-sm);
        color: var(--text-muted);
        flex: 0 0 auto;
      }
      .bar {
        height: 8px;
        border-radius: var(--r-pill);
        background: var(--surface-2);
        overflow: hidden;
        flex: 1;
      }
      .bar > i {
        display: block;
        height: 100%;
        background: var(--accent);
        border-radius: var(--r-pill);
      }
      .trow .v {
        width: 84px;
        text-align: right;
        font-size: var(--fs-sm);
        flex: 0 0 auto;
      }
    `,
  ],
})
export class ReportsComponent {
  private readonly api = inject(ApiService);
  private readonly nutritionReportsService = inject(NutritionReportsService);

  readonly periodDays = signal(30);
  readonly loaded = signal(false);
  readonly stats = signal<ReportStats | null>(null);

  // Reports the nutritionist generated for this athlete (RLS scopes to own rows).
  readonly nutritionReports = signal<NutritionReportRow[]>([]);

  // Rolling 4-week training trends (agility / sprint sessions, game performance).
  readonly trends = signal<TrendsState | null>(null);

  constructor() {
    this.fetch();
    this.loadNutritionReports();
    this.loadTrends();
  }

  private loadTrends(): void {
    const e = API_ENDPOINTS.trends;
    this.trends.set({ cod: null, sprint: null, game: null });
    this.api.get<WeekTrend>(e.changeOfDirection).subscribe({
      next: (r) =>
        this.trends.update((s) => ({
          ...(s ?? { cod: null, sprint: null, game: null }),
          cod: extractApiPayload<WeekTrend>(r) ?? null,
        })),
      error: () => undefined,
    });
    this.api.get<WeekTrend>(e.sprintVolume).subscribe({
      next: (r) =>
        this.trends.update((s) => ({
          ...(s ?? { cod: null, sprint: null, game: null }),
          sprint: extractApiPayload<WeekTrend>(r) ?? null,
        })),
      error: () => undefined,
    });
    this.api.get<GameTrend>(e.gamePerformance).subscribe({
      next: (r) =>
        this.trends.update((s) => ({
          ...(s ?? { cod: null, sprint: null, game: null }),
          game: extractApiPayload<GameTrend>(r) ?? null,
        })),
      error: () => undefined,
    });
  }

  /** Direction indicator for a current-vs-previous change %. */
  trendDir(change: number | undefined | null): { cls: string; arrow: string } {
    const c = change ?? 0;
    if (c > 2) return { cls: "good", arrow: "↑" };
    if (c < -2) return { cls: "caution", arrow: "↓" };
    return { cls: "neutral", arrow: "→" };
  }
  weekTrendLabel(t: WeekTrend | null): string {
    return t ? `${t.current} vs ${t.previous}` : "—";
  }
  gamePerf(t: GameTrend | null): { label: string; cls: string } {
    if (!t || t.message || !t.games?.length) {
      return { label: "no games yet", cls: "neutral" };
    }
    const cls =
      t.trend === "improving"
        ? "good"
        : t.trend === "declining"
          ? "caution"
          : "neutral";
    return {
      label: `${t.trend} · avg ${Math.round(t.averagePerformance)}`,
      cls,
    };
  }

  private loadNutritionReports(): void {
    void this.nutritionReportsService
      .loadRecent(10)
      .then((reports) => this.nutritionReports.set(reports));
  }

  metric(r: NutritionReportRow, key: string): string {
    const v = r.report_data?.metrics?.[key];
    return v == null ? "—" : `${Math.round(v * 10) / 10}`;
  }
  recs(r: NutritionReportRow): NutritionRec[] {
    return r.report_data?.recommendations ?? [];
  }
  recBand(priority?: string): string {
    return priority === "high"
      ? "danger"
      : priority === "medium"
        ? "caution"
        : "info";
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
