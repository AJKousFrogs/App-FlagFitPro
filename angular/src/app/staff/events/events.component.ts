import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { LucideAngularModule } from "lucide-angular";

import { SupabaseService } from "../../core/services/supabase.service";
import { TeamMembershipService } from "../../core/services/team-membership.service";
import { LoggerService } from "../../core/services/logger.service";

interface EventRow {
  id: string;
  name: string;
  startsAt: string;
  games: number | null;
  minutesPerGame: number | null;
}

const FORMATS = [
  { label: "2 × 12 min", min: 24 },
  { label: "2 × 20 min", min: 40 },
  { label: "2 × 40 min", min: 80 },
] as const;

/**
 * Coach event-format editor. Sets each upcoming event's per-game format
 * (competition_events.minutes_per_game + game_format) so competition LOAD is
 * honest team-wide — a 2×40 World-champs scores its true spike, not a flat 40-min
 * default. Direct Supabase update; RLS (competition_events_update) enforces staff.
 */
@Component({
  selector: "app-staff-events",
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./events.component.html",
})
export class StaffEventsComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly membership = inject(TeamMembershipService);
  private readonly logger = inject(LoggerService);

  readonly formats = FORMATS;
  readonly events = signal<EventRow[] | null>(null);
  readonly saved = signal<Set<string>>(new Set());

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const teamId = this.membership.teamId();
      let q = this.supabase.client
        .from("competition_events")
        .select("id, label, starts_at, expected_game_count, minutes_per_game, competitions(name, short_name)")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true });
      if (teamId) q = q.eq("team_id", teamId);
      const { data } = await q;
      this.events.set(
        (data ?? []).map((r: Record<string, unknown>) => {
          const comp = (r["competitions"] ?? {}) as { name?: string; short_name?: string };
          return {
            id: String(r["id"]),
            name: comp.short_name || comp.name || (r["label"] as string) || "Event",
            startsAt: String(r["starts_at"]),
            games: (r["expected_game_count"] as number) ?? null,
            minutesPerGame: (r["minutes_per_game"] as number) ?? null,
          };
        }),
      );
    } catch {
      this.events.set([]);
    }
  }

  date(iso: string): string {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  async setFormat(ev: EventRow, min: number, label: string): Promise<void> {
    this.events.update((list) =>
      (list ?? []).map((e) => (e.id === ev.id ? { ...e, minutesPerGame: min } : e)),
    );
    const { error } = await this.supabase.client
      .from("competition_events")
      .update({ minutes_per_game: min, game_format: label.replace(/\s/g, "") })
      .eq("id", ev.id);
    if (error) {
      this.logger.error("event_format_save_failed", error);
    } else {
      this.saved.update((s) => new Set(s).add(ev.id));
    }
  }
}
