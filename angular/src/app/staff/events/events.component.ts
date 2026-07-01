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
import { googleMapsSearchUrl } from "../../core/utils/map-link.util";
import { CompetitionKind, EventImportance } from "../../core/models/schedule.models";

interface EventRow {
  id: string;
  name: string;
  startsAt: string;
  games: number | null;
  minutesPerGame: number | null;
  hotelName: string | null;
  hotelAddress: string | null;
}

interface HotelDraft {
  name: string;
  address: string;
}

const FORMATS = [
  { label: "2 × 12 min", min: 24 },
  { label: "2 × 20 min", min: 40 },
  { label: "2 × 40 min", min: 80 },
] as const;

const KINDS: { key: CompetitionKind; label: string }[] = [
  { key: "league", label: "League" },
  { key: "cup", label: "Cup" },
  { key: "tournament", label: "Tournament" },
  { key: "friendly", label: "Friendly" },
];

const IMPORTANCES: { key: EventImportance; label: string }[] = [
  { key: "regular", label: "Regular" },
  { key: "high", label: "High" },
  { key: "peak", label: "Peak" },
];

/**
 * Coach event editor. Sets each upcoming event's per-game format
 * (competition_events.minutes_per_game + game_format) so competition LOAD is
 * honest team-wide — a 2×40 World-champs scores its true spike, not a flat 40-min
 * default. Also the only in-app way to create a competition_events row (find-or-
 * create the parent competitions row) and to record hotel/lodging info for away
 * tournaments, which players then see on Schedule and Today. Direct Supabase
 * writes throughout; RLS (competitions_insert/update, competition_events_*)
 * enforces staff-only access — no backend endpoint needed.
 */
@Component({
  selector: "app-staff-events",
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./events.component.html",
  styles: [
    `
      .lbl { font-size: var(--fs-sm); color: var(--text-muted); font-weight: var(--fw-semi); }
      .chiprow { display: flex; flex-wrap: wrap; gap: 6px; }
      .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--s-3); }
      .input { width: 100%; }
    `,
  ],
})
export class StaffEventsComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly membership = inject(TeamMembershipService);
  private readonly logger = inject(LoggerService);

  readonly formats = FORMATS;
  readonly kinds = KINDS;
  readonly importances = IMPORTANCES;
  readonly events = signal<EventRow[] | null>(null);
  readonly saved = signal<Set<string>>(new Set());
  readonly formatError = signal<string | null>(null);

  // ── hotel info (inline edit per existing event) ──
  readonly hotelDrafts = signal<Record<string, HotelDraft>>({});
  readonly hotelSaved = signal<Set<string>>(new Set());
  readonly hotelError = signal<string | null>(null);

  // ── create-event form ──
  readonly mode = signal<"list" | "form">("list");
  readonly creating = signal(false);
  readonly createError = signal<string | null>(null);
  readonly fTitle = signal("");
  readonly fKind = signal<CompetitionKind>("tournament");
  readonly fStartDate = signal("");
  readonly fStartTime = signal("09:00");
  readonly fEndDate = signal("");
  readonly fGames = signal(1);
  readonly fImportance = signal<EventImportance>("high");
  readonly fLocation = signal("");
  readonly fVenue = signal("");
  readonly fHotelName = signal("");
  readonly fHotelAddress = signal("");

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const teamId = this.membership.teamId();
      let q = this.supabase.client
        .from("competition_events")
        .select(
          "id, label, starts_at, expected_game_count, minutes_per_game, hotel_name, hotel_address, competitions(name, short_name)",
        )
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true });
      if (teamId) q = q.eq("team_id", teamId);
      const { data } = await q;
      const rows = (data ?? []).map((r: Record<string, unknown>) => {
        const comp = (r["competitions"] ?? {}) as { name?: string; short_name?: string };
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
      this.events.set(rows);
      this.hotelDrafts.set(
        Object.fromEntries(
          rows.map((r) => [r.id, { name: r.hotelName ?? "", address: r.hotelAddress ?? "" }]),
        ),
      );
    } catch {
      this.events.set([]);
    }
  }

  date(iso: string): string {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  mapUrl(address: string): string {
    return googleMapsSearchUrl(address);
  }

  async setFormat(ev: EventRow, min: number, label: string): Promise<void> {
    const prevMin = ev.minutesPerGame; // for rollback if the write is rejected
    this.events.update((list) =>
      (list ?? []).map((e) => (e.id === ev.id ? { ...e, minutesPerGame: min } : e)),
    );
    const { error } = await this.supabase.client
      .from("competition_events")
      .update({ minutes_per_game: min, game_format: label.replace(/\s/g, "") })
      .eq("id", ev.id);
    if (error) {
      // Direct client write under RLS — if it's rejected (e.g. not team staff), roll
      // the optimistic chip back so the UI doesn't show a format that never saved.
      this.events.update((list) =>
        (list ?? []).map((e) => (e.id === ev.id ? { ...e, minutesPerGame: prevMin } : e)),
      );
      this.formatError.set("Couldn't save the format — try again.");
      this.logger.error("event_format_save_failed", error);
    } else {
      this.formatError.set(null);
      this.saved.update((s) => new Set(s).add(ev.id));
    }
  }

  updateHotelDraft(id: string, field: "name" | "address", e: Event): void {
    const value = (e.target as HTMLInputElement).value;
    this.hotelDrafts.update((m) => ({ ...m, [id]: { ...m[id], [field]: value } }));
  }

  async saveHotel(ev: EventRow): Promise<void> {
    const draft = this.hotelDrafts()[ev.id];
    if (!draft) return;
    const hotelName = draft.name.trim() || null;
    const hotelAddress = draft.address.trim() || null;
    const prev = { hotelName: ev.hotelName, hotelAddress: ev.hotelAddress };
    this.events.update((list) =>
      (list ?? []).map((e) => (e.id === ev.id ? { ...e, hotelName, hotelAddress } : e)),
    );
    const { error } = await this.supabase.client
      .from("competition_events")
      .update({ hotel_name: hotelName, hotel_address: hotelAddress })
      .eq("id", ev.id);
    if (error) {
      this.events.update((list) =>
        (list ?? []).map((e) => (e.id === ev.id ? { ...e, ...prev } : e)),
      );
      this.hotelError.set("Couldn't save hotel info — try again.");
      this.logger.error("event_hotel_save_failed", error);
    } else {
      this.hotelError.set(null);
      this.hotelSaved.update((s) => new Set(s).add(ev.id));
    }
  }

  // ── event-target helpers (no two-way ngModel in this codebase) ──
  val(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }
  num(e: Event): number {
    const n = Number.parseInt((e.target as HTMLInputElement).value, 10);
    return Number.isFinite(n) ? n : 0;
  }

  openCreate(): void {
    this.resetForm();
    this.mode.set("form");
  }

  cancelCreate(): void {
    this.mode.set("list");
    this.createError.set(null);
  }

  private resetForm(): void {
    this.fTitle.set("");
    this.fKind.set("tournament");
    this.fStartDate.set("");
    this.fStartTime.set("09:00");
    this.fEndDate.set("");
    this.fGames.set(1);
    this.fImportance.set("high");
    this.fLocation.set("");
    this.fVenue.set("");
    this.fHotelName.set("");
    this.fHotelAddress.set("");
    this.createError.set(null);
  }

  async createEvent(): Promise<void> {
    if (this.creating()) return;
    const title = this.fTitle().trim();
    if (!title) {
      this.createError.set("Give the event a name (e.g. opponent or tournament).");
      return;
    }
    if (!this.fStartDate()) {
      this.createError.set("Pick a start date.");
      return;
    }
    const teamId = this.membership.teamId();
    if (!teamId) {
      this.createError.set("No team found for your account.");
      return;
    }
    const userId = this.supabase.userId();
    const startsAt = this.combine(this.fStartDate(), this.fStartTime() || "09:00");
    const endsAt = this.fEndDate() ? this.combine(this.fEndDate(), "23:59") : null;
    if (endsAt && new Date(endsAt) < new Date(startsAt)) {
      this.createError.set("End date can't be before the start date.");
      return;
    }

    this.creating.set(true);
    this.createError.set(null);
    try {
      const seasonYear = new Date(this.fStartDate()).getFullYear();
      const { data: existingComp, error: findErr } = await this.supabase.client
        .from("competitions")
        .select("id")
        .eq("name", title)
        .eq("season_year", seasonYear)
        .maybeSingle();
      if (findErr) throw findErr;

      let competitionId = existingComp?.id as string | undefined;
      if (!competitionId) {
        const { data: newComp, error: compErr } = await this.supabase.client
          .from("competitions")
          .insert({
            name: title,
            kind: this.fKind(),
            season_year: seasonYear,
            created_by: userId,
          })
          .select("id")
          .single();
        if (compErr || !newComp) throw compErr ?? new Error("Could not create competition");
        competitionId = newComp.id as string;
      }

      const { error: insertErr } = await this.supabase.client
        .from("competition_events")
        .insert({
          competition_id: competitionId,
          team_id: teamId,
          starts_at: startsAt,
          ends_at: endsAt,
          expected_game_count: this.fGames(),
          importance: this.fImportance(),
          location: this.fLocation().trim() || null,
          venue: this.fVenue().trim() || null,
          hotel_name: this.fHotelName().trim() || null,
          hotel_address: this.fHotelAddress().trim() || null,
          created_by: userId,
        });
      if (insertErr) throw insertErr;

      await this.load();
      this.mode.set("list");
    } catch (err) {
      this.createError.set(
        err instanceof Error ? err.message : "Could not create the event — try again.",
      );
      this.logger.error("event_create_failed", err);
    } finally {
      this.creating.set(false);
    }
  }

  private combine(dateStr: string, timeStr: string): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    const [hh, mm] = timeStr.split(":").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0).toISOString();
  }
}
