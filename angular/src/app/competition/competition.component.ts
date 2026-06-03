import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { AvatarComponent } from "../shared/avatar.component";

import { ScheduleService } from "../core/services/schedule.service";
import { ApiService } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";
import { CompetitionEvent } from "../core/models/schedule.models";

interface PendingEvent {
  competition_event_id?: string;
  competitionEventId?: string;
  competition_name?: string;
  games_expected?: number;
  gamesExpected?: number;
}

/**
 * Competition — your events across all teams + RSVP + post-event actuals. Ported
 * 1:1 from redesign/ground-zero/02-hifi/competition.html. Events come from the
 * schedule spine (ScheduleService.upcoming); RSVP → POST /api/event-availability
 * (set_event_availability RPC); post-event → POST /api/event-participation (the
 * ACWR actuals feed). Server-canonical.
 */
@Component({
  selector: "app-competition",
  standalone: true,
  imports: [AvatarComponent, RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./competition.component.html",
})
export class CompetitionComponent {
  private readonly schedule = inject(ScheduleService);
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  readonly upcoming = this.schedule.upcoming;
  readonly nextEvent = this.schedule.nextEvent;
  readonly rest = computed(() => this.upcoming().slice(1));

  // post-event participation prompt
  readonly pending = signal<PendingEvent[]>([]);
  readonly games = signal(5);
  readonly avgRpe = signal(8);
  readonly logged = signal(false);

  // Game format → per-game minutes. This is what makes 2x12 vs 2x20 vs 2x40 load
  // honest (a flat 40-min/game otherwise mis-scores short and World-champ formats).
  readonly formats = [
    { label: "2 × 12 min", min: 24 },
    { label: "2 × 20 min", min: 40 },
    { label: "2 × 40 min", min: 80 },
  ] as const;
  readonly minutesPerGame = signal(40);

  constructor() {
    this.api.get<{ events?: PendingEvent[] } | PendingEvent[]>("/api/event-participation").subscribe({
      next: (res) => {
        const d = res?.data as { events?: PendingEvent[] } | PendingEvent[] | undefined;
        this.pending.set(Array.isArray(d) ? d : (d?.events ?? []));
      },
      error: () => this.pending.set([]),
    });
  }

  daysTo(ev: CompetitionEvent): number {
    const ms = new Date(ev.startsAt).getTime() - Date.now();
    return Math.max(0, Math.round(ms / 864e5));
  }

  // RSVP feedback: chosen status per event, which is in-flight, and which errored.
  readonly rsvpState = signal<Record<string, "declined" | "maybe" | "confirmed">>({});
  readonly rsvpBusy = signal<string | null>(null);
  readonly rsvpError = signal<string | null>(null);

  rsvp(ev: CompetitionEvent, status: "declined" | "maybe" | "confirmed"): void {
    if (this.rsvpBusy()) return;
    this.rsvpBusy.set(ev.id);
    this.rsvpError.set(null);
    this.api
      .post("/api/event-availability", { competitionEventId: ev.id, status })
      .subscribe({
        next: () => {
          this.rsvpState.update((m) => ({ ...m, [ev.id]: status }));
          this.rsvpBusy.set(null);
        },
        error: (e) => {
          this.logger.error("rsvp_failed", e);
          this.rsvpError.set(ev.id);
          this.rsvpBusy.set(null);
        },
      });
  }
  rsvpLabel(status: string): string {
    return status === "confirmed" ? "You're in" : status === "maybe" ? "Maybe" : "Can't make it";
  }

  logParticipation(): void {
    if (this.logged()) return;
    const p = this.pending()[0];
    const id = p?.competition_event_id ?? p?.competitionEventId;
    this.api
      .post("/api/event-participation", {
        competitionEventId: id,
        attended: true,
        gamesPlayed: this.games(),
        avgRpe: this.avgRpe(),
        // real minutes from the chosen format → correct competition load
        totalMinutes: this.games() * this.minutesPerGame(),
      })
      .subscribe({
        next: () => this.logged.set(true),
        error: (e) => this.logger.error("participation_failed", e),
      });
  }

  pendingGamesExpected(): number {
    const p = this.pending()[0];
    return p?.games_expected ?? p?.gamesExpected ?? 8;
  }
}
