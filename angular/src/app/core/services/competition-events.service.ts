import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import {
  CompetitionKind,
  CompetitionLevel,
  EventImportance,
} from "../models/schedule.models";

export interface CompetitionEventRow {
  id: string;
  name: string;
  startsAt: string;
  games: number | null;
  minutesPerGame: number | null;
  hotelName: string | null;
  hotelAddress: string | null;
}

export interface CreateEventInput {
  title: string;
  kind: CompetitionKind;
  level: CompetitionLevel;
  importance: EventImportance;
  startsAt: string;
  endsAt: string | null;
  games: number;
  location: string | null;
  venue: string | null;
  hotelName: string | null;
  hotelAddress: string | null;
  teamId: string;
  userId: string | null;
}

/**
 * Coach-side data access for `competition_events` (per-event game format,
 * hotel/lodging, and creation). Direct Supabase reads/writes; RLS
 * (`competitions_insert/update`, `competition_events_*`) enforces that only
 * staff of the event's team can mutate it — no backend endpoint needed.
 */
@Injectable({ providedIn: "root" })
export class CompetitionEventsService {
  private readonly supabase = inject(SupabaseService);

  /** Upcoming events (optionally scoped to a team), soonest first. */
  async loadUpcoming(teamId: string | null): Promise<CompetitionEventRow[]> {
    let q = this.supabase.client
      .from("competition_events")
      .select(
        "id, label, starts_at, expected_game_count, minutes_per_game, hotel_name, hotel_address, competitions(name, short_name)",
      )
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true });
    if (teamId) q = q.eq("team_id", teamId);

    const { data } = await q;
    return (data ?? []).map((r: Record<string, unknown>) => {
      const comp = (r["competitions"] ?? {}) as {
        name?: string;
        short_name?: string;
      };
      return {
        id: String(r["id"]),
        name: comp.short_name || comp.name || (r["label"] as string) || "Event",
        startsAt: String(r["starts_at"]),
        games: (r["expected_game_count"] as number) ?? null,
        minutesPerGame: (r["minutes_per_game"] as number) ?? null,
        hotelName: (r["hotel_name"] as string) ?? null,
        hotelAddress: (r["hotel_address"] as string) ?? null,
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

  /** Save hotel/lodging info for an away event (null clears it). */
  async saveHotel(
    eventId: string,
    hotelName: string | null,
    hotelAddress: string | null,
  ): Promise<{ error: unknown }> {
    const { error } = await this.supabase.client
      .from("competition_events")
      .update({ hotel_name: hotelName, hotel_address: hotelAddress })
      .eq("id", eventId);
    return { error };
  }

  /**
   * Create a competition_events row, find-or-creating its parent competitions
   * row (keyed by name + season_year). Returns an error to surface, or null.
   */
  async createEvent(input: CreateEventInput): Promise<{ error: unknown }> {
    try {
      const seasonYear = new Date(input.startsAt).getFullYear();
      const { data: existingComp, error: findErr } = await this.supabase.client
        .from("competitions")
        .select("id")
        .eq("name", input.title)
        .eq("season_year", seasonYear)
        .maybeSingle();
      if (findErr) throw findErr;

      let competitionId = existingComp?.id as string | undefined;
      if (!competitionId) {
        const { data: newComp, error: compErr } = await this.supabase.client
          .from("competitions")
          .insert({
            name: input.title,
            kind: input.kind,
            level: input.level,
            season_year: seasonYear,
            created_by: input.userId,
          })
          .select("id")
          .single();
        if (compErr || !newComp) {
          throw compErr ?? new Error("Could not create competition");
        }
        competitionId = newComp.id as string;
      }

      const { error: insertErr } = await this.supabase.client
        .from("competition_events")
        .insert({
          competition_id: competitionId,
          team_id: input.teamId,
          starts_at: input.startsAt,
          ends_at: input.endsAt,
          expected_game_count: input.games,
          importance: input.importance,
          location: input.location,
          venue: input.venue,
          hotel_name: input.hotelName,
          hotel_address: input.hotelAddress,
          created_by: input.userId,
        });
      if (insertErr) throw insertErr;
      return { error: null };
    } catch (error) {
      return { error };
    }
  }
}
