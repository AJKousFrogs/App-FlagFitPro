import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "./supabase.service";

export interface CompetitionEventRow {
  id: string;
  name: string;
  startsAt: string;
  games: number | null;
  minutesPerGame: number | null;
}

/**
 * Coach-side data access for `competition_events` (per-event game format).
 * Direct Supabase reads/writes; RLS (`competition_events_update`) enforces
 * that only staff of the event's team can update its format.
 */
@Injectable({ providedIn: "root" })
export class CompetitionEventsService {
  private readonly supabase = inject(SupabaseService);

  /** Upcoming events (optionally scoped to a team), soonest first. */
  async loadUpcoming(teamId: string | null): Promise<CompetitionEventRow[]> {
    let q = this.supabase.client
      .from("competition_events")
      .select("id, label, starts_at, expected_game_count, minutes_per_game, competitions(name, short_name)")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true });
    if (teamId) q = q.eq("team_id", teamId);

    const { data } = await q;
    return (data ?? []).map((r: Record<string, unknown>) => {
      const comp = (r["competitions"] ?? {}) as { name?: string; short_name?: string };
      return {
        id: String(r["id"]),
        name: comp.short_name || comp.name || (r["label"] as string) || "Event",
        startsAt: String(r["starts_at"]),
        games: (r["expected_game_count"] as number) ?? null,
        minutesPerGame: (r["minutes_per_game"] as number) ?? null,
      };
    });
  }

  /** Set an event's per-game format (minutes + label). */
  async setFormat(
    eventId: string,
    minutesPerGame: number,
    gameFormatLabel: string,
  ): Promise<{ error: unknown }> {
    const { error } = await this.supabase.client
      .from("competition_events")
      .update({
        minutes_per_game: minutesPerGame,
        game_format: gameFormatLabel.replace(/\s/g, ""),
      })
      .eq("id", eventId);
    return { error };
  }
}
