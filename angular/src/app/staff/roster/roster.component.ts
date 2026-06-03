import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";

import { ApiService } from "../../core/services/api.service";
import { TeamMembershipService } from "../../core/services/team-membership.service";
import { staffLaneFor } from "../../core/guards/staff.guard";

interface CoachMember {
  user_id?: string;
  full_name?: string;
  position?: string;
  acwr?: number | null;
  readiness?: number | null;
  workload?: number | null;
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

const LANE_LABEL: Record<string, string> = {
  coach: "Coach", physio: "Physio", nutrition: "Nutrition", psych: "Psychology",
};

/**
 * Roster — the shared staff entry. For COACHES it's the rich dashboard
 * (GET /api/coach/team → each athlete's ACWR + readiness, consent-blocked athletes
 * shown as "not shared"). For physio/nutrition/psychologist it lists names
 * (GET /api/roster/players); the consent-gated health data lives in the detail.
 */
@Component({
  selector: "app-roster",
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./roster.component.html",
})
export class RosterComponent {
  private readonly api = inject(ApiService);
  private readonly membership = inject(TeamMembershipService);

  readonly teamName = this.membership.teamName;
  readonly lane = computed(() => staffLaneFor(this.membership.role()));
  readonly isCoach = computed(() => this.lane() === "coach");
  readonly roleLabel = computed(() => LANE_LABEL[this.lane() ?? ""] ?? "Staff");
  readonly rows = signal<Row[] | null>(null);

  constructor() {
    if (staffLaneFor(this.membership.role()) === "coach") {
      this.api.get<{ members?: CoachMember[]; consentInfo?: { blockedPlayerIds?: string[] } }>(
        "/api/coach/team",
      ).subscribe({
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
              shared: !blocked.has(m.user_id ?? "") && (m.dataState ?? "") !== "NO_DATA",
            })),
          );
        },
        error: () => this.rows.set([]),
      });
    } else {
      const teamId = this.membership.teamId();
      const url = teamId ? `/api/roster/players?teamId=${teamId}` : "/api/roster/players";
      this.api.get<{ players?: Player[] } | Player[]>(url).subscribe({
        next: (res) => {
          const raw = res?.data as { players?: Player[] } | Player[] | undefined;
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

  initials(name: string): string {
    return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
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
    const cls = v < 55 ? "danger" : v <= 75 ? "info" : "good";
    return { label: String(v), cls };
  }
}
