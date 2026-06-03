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
import { TeamMembershipService } from "../core/services/team-membership.service";
import { SupabaseService } from "../core/services/supabase.service";
import { extractApiPayload } from "../core/utils/api-response-mapper";

interface RosterPlayer {
  id: string;
  name?: string;
  position?: string;
  jerseyNumber?: number | null;
  jersey_number?: number | null;
}
interface Mate {
  id: string;
  name: string;
  position: string;
  jersey: number | null;
  me: boolean;
}

/**
 * Roster (athlete) — your squad. GET /api/roster/players returns teammates'
 * name / jersey / position only (no health or performance data — that stays
 * behind the staff/consent walls). Sorted by jersey; you're highlighted. Honest
 * empty state when you're not on a team yet.
 */
@Component({
  selector: "app-roster",
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./roster.component.html",
  styles: [
    `
      .mate { display: flex; align-items: center; gap: 12px; padding: 10px 0; }
      .ava { width: 38px; height: 38px; border-radius: var(--r-pill); flex: 0 0 auto; display: grid;
        place-items: center; background: var(--surface-2); color: var(--text-faint); font-size: 13px; font-weight: var(--fw-bold); }
      .mate.me .ava { background: var(--accent); color: var(--on-accent); }
      .jersey { margin-left: auto; font-family: var(--font-display); font-weight: var(--fw-bold); color: var(--text-muted); }
    `,
  ],
})
export class RosterComponent {
  private readonly api = inject(ApiService);
  private readonly membership = inject(TeamMembershipService);
  private readonly supabase = inject(SupabaseService);

  readonly teamName = this.membership.teamName;
  readonly loaded = signal(false);
  readonly mates = signal<Mate[]>([]);
  readonly count = computed(() => this.mates().length);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      await this.membership.loadMembership().catch(() => null);
      const teamId = this.membership.teamId();
      const url = teamId ? `/api/roster/players?teamId=${teamId}` : "/api/roster/players";
      const myId = this.supabase.currentUser()?.id ?? null;
      this.api.get<{ players?: RosterPlayer[] } | RosterPlayer[]>(url).subscribe({
        next: (res) => {
          const payload = extractApiPayload<{ players?: RosterPlayer[] } | RosterPlayer[]>(res);
          const list = Array.isArray(payload) ? payload : (payload?.players ?? []);
          this.mates.set(
            list
              .filter((p) => !!p.id)
              .map((p) => ({
                id: p.id,
                name: p.name ?? "Athlete",
                position: p.position ?? "",
                jersey: p.jerseyNumber ?? p.jersey_number ?? null,
                me: !!myId && p.id === myId,
              }))
              .sort((a, b) => (a.jersey ?? 999) - (b.jersey ?? 999)),
          );
          this.loaded.set(true);
        },
        error: () => this.loaded.set(true),
      });
    } catch {
      this.loaded.set(true);
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
}
