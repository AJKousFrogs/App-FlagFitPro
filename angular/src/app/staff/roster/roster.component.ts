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

interface Player {
  id?: string;
  user_id?: string;
  name?: string;
  position?: string;
  jerseyNumber?: number | null;
  jersey_number?: number | null;
}

const LANE_LABEL: Record<string, string> = {
  coach: "Coach", physio: "Physio", nutrition: "Nutrition", psych: "Psychology",
};

/**
 * Roster — the shared staff entry. Lists the team's athletes (GET /api/roster/players).
 * Tapping a row opens the role-aware athlete detail. Per-athlete metrics are
 * consent-gated and shown there, not in the list.
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
  readonly roleLabel = computed(() => LANE_LABEL[staffLaneFor(this.membership.role()) ?? ""] ?? "Staff");
  readonly players = signal<Player[] | null>(null);

  constructor() {
    const teamId = this.membership.teamId();
    const url = teamId ? `/api/roster/players?teamId=${teamId}` : "/api/roster/players";
    this.api.get<{ players?: Player[] } | Player[]>(url).subscribe({
      next: (res) => {
        const d = res?.data as { players?: Player[] } | Player[] | undefined;
        this.players.set(Array.isArray(d) ? d : (d?.players ?? []));
      },
      error: () => this.players.set([]),
    });
  }

  pid(p: Player): string {
    return (p.id ?? p.user_id ?? "") as string;
  }
  jersey(p: Player): number | null {
    return p.jerseyNumber ?? p.jersey_number ?? null;
  }
  initials(p: Player): string {
    return (p.name ?? "?")
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
}
