import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { DecimalPipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";

import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import { TeamMembershipService } from "../../core/services/team-membership.service";
import { staffLaneFor } from "../../core/guards/staff.guard";

interface CoachMember {
  user_id?: string;
  full_name?: string;
  position?: string;
  acwr?: number | null;
  readiness?: number | null;
  dataState?: string;
}

interface Player {
  id?: string;
  user_id?: string;
  name?: string;
  position?: string;
  jerseyNumber?: number | null;
  jersey_number?: number | null;
}

interface Row {
  id: string;
  name: string;
  position: string;
  jersey: number | null;
  acwr: number | null;
  readiness: number | null;
  shared: boolean;
}

interface InjuryRow {
  athleteId: string;
  athleteName: string;
  location: string;
  grade: string;
  status: string;
  mechanism: string | null;
  expectedReturn: string | null;
  notes: string | null;
  reportedAt: string;
  todaySoreness: number | null;
  todayReadiness: number | null;
}

interface InjurySummary {
  total: number;
  severe: number;
  moderate: number;
  selfReports: number;
  checkinDate: string;
}

interface CycleAthlete {
  athleteId: string;
  athleteName: string;
  trainingFocus: string | null;
  acwr: number | null;
  latestReadiness: number | null;
  avgReadiness7d: number | null;
  readinessTrend: number[];
}

interface NextTeamEvent {
  name: string;
  type: string;
  daysAway: number;
}

const LANE_LABEL: Record<string, string> = {
  coach: "Coach",
  physio: "Physio",
  nutrition: "Nutrition",
  psych: "Psychology",
};

const GRADE_CLS: Record<string, string> = {
  severe: "danger",
  "Grade 3": "danger",
  moderate: "caution",
  "Grade 2": "caution",
  minor: "good",
  "Grade 1": "good",
  self_report: "caution",
};

const FOCUS_CLS: Record<string, string> = {
  sprint: "info",
  speed: "info",
  strength: "good",
  gym: "good",
  recovery: "neutral",
  rest: "neutral",
  mobility: "neutral",
  mixed: "caution",
  conditioning: "caution",
  competition: "danger",
};

@Component({
  selector: "app-roster",
  standalone: true,
  imports: [DecimalPipe, RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./roster.component.html",
  styles: [
    `
      a.lrow {
        color: inherit;
      }
      .tab-bar {
        display: flex;
        gap: var(--s-4);
        border-bottom: 1px solid var(--border-soft);
        margin-bottom: var(--s-4);
      }
      .tab-btn {
        background: none;
        border: 0;
        cursor: pointer;
        padding: var(--s-2) 0;
        color: var(--text-faint);
        font-weight: var(--fw-semi);
        font-size: var(--fs-sm);
        font-family: var(--font-body);
        border-bottom: 2px solid transparent;
      }
      .tab-btn.on {
        color: var(--text-strong);
        border-bottom-color: var(--accent);
      }
      .card-mb {
        margin-bottom: var(--s-4);
      }
      .section-label {
        font-size: var(--fs-xs);
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin-bottom: var(--s-2);
      }
      .summary-chips {
        display: flex;
        flex-wrap: wrap;
        gap: var(--s-3);
        padding: var(--s-3) 0;
      }
      .detail {
        font-size: var(--fs-sm);
        color: var(--text-body);
      }
      .sub {
        font-size: var(--fs-xs);
        color: var(--text-faint);
      }
      .inj-row {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: var(--s-3) 0;
        border-bottom: 1px solid var(--border-soft);
      }
      .inj-row:last-child {
        border-bottom: 0;
      }
      .inj-meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--s-2);
        align-items: center;
      }
      .inj-today {
        display: flex;
        gap: var(--s-2);
        margin-top: 2px;
      }
      .cycle-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: var(--s-2);
        padding: var(--s-3) 0;
        border-bottom: 1px solid var(--border-soft);
        align-items: center;
      }
      .cycle-row:last-child {
        border-bottom: 0;
      }
      .bands {
        display: flex;
        gap: var(--s-2);
        align-items: center;
      }
      .bands.mt {
        margin-top: 4px;
      }
      .trend {
        display: flex;
        gap: 3px;
        align-items: flex-end;
        height: 24px;
      }
      .trend-bar {
        width: 6px;
        border-radius: 2px;
        min-height: 3px;
      }
      .ev-body {
        padding: var(--s-3) 0;
      }
      .ev-type {
        margin-top: 2px;
      }
    `,
  ],
})
export class RosterComponent {
  private readonly api = inject(ApiService);
  private readonly membership = inject(TeamMembershipService);

  readonly teamName = this.membership.teamName;
  readonly lane = computed(() => staffLaneFor(this.membership.role()));
  readonly isCoach = computed(() => this.lane() === "coach");
  readonly roleLabel = computed(() => LANE_LABEL[this.lane() ?? ""] ?? "Staff");

  readonly tab = signal<"roster" | "injuries" | "cycle">("roster");

  readonly rows = signal<Row[] | null>(null);
  readonly injuries = signal<InjuryRow[] | null>(null);
  readonly injurySummary = signal<InjurySummary | null>(null);
  readonly cycleAthletes = signal<CycleAthlete[] | null>(null);
  readonly nextEvent = signal<NextTeamEvent | null>(null);

  private injuriesLoaded = false;
  private cycleLoaded = false;

  constructor() {
    if (this.isCoach()) {
      this.api
        .get<{
          members?: CoachMember[];
          consentInfo?: { blockedPlayerIds?: string[] };
        }>("/api/coach/team")
        .subscribe({
          next: (res) => {
            const d = res?.data ?? {};
            const blocked = new Set(d.consentInfo?.blockedPlayerIds ?? []);
            this.rows.set(
              (d.members ?? []).map((m) => ({
                id: m.user_id ?? "",
                name: m.full_name ?? "Athlete",
                position: m.position ?? "",
                jersey: null,
                acwr: typeof m.acwr === "number" ? m.acwr : null,
                readiness: typeof m.readiness === "number" ? m.readiness : null,
                shared:
                  !blocked.has(m.user_id ?? "") &&
                  (m.dataState ?? "") !== "NO_DATA",
              })),
            );
          },
          error: () => this.rows.set([]),
        });
    } else {
      const teamId = this.membership.teamId();
      const url = teamId
        ? `/api/roster/players?teamId=${teamId}`
        : "/api/roster/players";
      this.api.get<{ players?: Player[] } | Player[]>(url).subscribe({
        next: (res) => {
          const raw = res?.data as
            | { players?: Player[] }
            | Player[]
            | undefined;
          const list = Array.isArray(raw) ? raw : (raw?.players ?? []);
          this.rows.set(
            list.map((p) => ({
              id: (p.id ?? p.user_id ?? "") as string,
              name: p.name ?? "Athlete",
              position: p.position ?? "",
              jersey: p.jerseyNumber ?? p.jersey_number ?? null,
              acwr: null,
              readiness: null,
              shared: true,
            })),
          );
        },
        error: () => this.rows.set([]),
      });
    }
  }

  switchTab(t: "roster" | "injuries" | "cycle"): void {
    this.tab.set(t);
    const teamId = this.membership.teamId();
    if (!teamId) return;

    if (t === "injuries" && !this.injuriesLoaded) {
      this.injuriesLoaded = true;
      this.api
        .get<{
          injuries: InjuryRow[];
          summary: InjurySummary;
        }>(API_ENDPOINTS.roster.injuries(teamId))
        .subscribe({
          next: (res) => {
            this.injuries.set(res?.data?.injuries ?? []);
            this.injurySummary.set(res?.data?.summary ?? null);
          },
          error: () => this.injuries.set([]),
        });
    }

    if (t === "cycle" && !this.cycleLoaded) {
      this.cycleLoaded = true;
      this.api
        .get<{
          athletes: CycleAthlete[];
          nextTeamEvent: NextTeamEvent | null;
        }>(API_ENDPOINTS.roster.trainingCycle(teamId))
        .subscribe({
          next: (res) => {
            this.cycleAthletes.set(res?.data?.athletes ?? []);
            this.nextEvent.set(res?.data?.nextTeamEvent ?? null);
          },
          error: () => this.cycleAthletes.set([]),
        });
    }
  }

  initials(name: string): string {
    return name
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  acwrBand(r: number | null): { label: string; cls: string } | null {
    if (r == null) return null;
    const v = r.toFixed(2);
    if (r > 1.5) return { label: v, cls: "danger" };
    if (r > 1.3 || r < 0.8) return { label: v, cls: "caution" };
    return { label: v, cls: "good" };
  }

  readyBand(s: number | null): { label: string; cls: string } | null {
    if (s == null) return null;
    const v = Math.round(s);
    const cls = v < 55 ? "danger" : v <= 75 ? "caution" : "good";
    return { label: String(v), cls };
  }

  gradeBand(grade: string): string {
    return GRADE_CLS[grade] ?? "neutral";
  }

  gradeLabel(row: InjuryRow): string {
    if (row.status === "self_report") return `Soreness ${row.todaySoreness}/10`;
    return row.grade ?? "—";
  }

  focusBand(focus: string | null): string {
    if (!focus) return "neutral";
    return FOCUS_CLS[focus.toLowerCase()] ?? "neutral";
  }

  barHeight(score: number): string {
    return `${Math.max(3, Math.round((score / 100) * 24))}px`;
  }

  barColor(score: number): string {
    if (score < 55) return "var(--danger)";
    if (score <= 75) return "var(--caution)";
    return "var(--accent)";
  }
}
