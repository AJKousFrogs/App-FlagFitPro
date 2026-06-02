import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";

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
  imports: [RouterLink, LucideAngularModule],
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

  rsvp(ev: CompetitionEvent, status: "declined" | "maybe" | "confirmed"): void {
    this.api
      .post("/api/event-availability", { competitionEventId: ev.id, status })
      .subscribe({ error: (e) => this.logger.error("rsvp_failed", e) });
  }

  logParticipation(): void {
    const p = this.pending()[0];
    const id = p?.competition_event_id ?? p?.competitionEventId;
    this.logged.set(true);
    this.api
      .post("/api/event-participation", {
        competitionEventId: id,
        attended: true,
        gamesPlayed: this.games(),
        avgRpe: this.avgRpe(),
      })
      .subscribe({ error: (e) => this.logger.error("participation_failed", e) });
  }

  pendingGamesExpected(): number {
    const p = this.pending()[0];
    return p?.games_expected ?? p?.gamesExpected ?? 8;
  }
}
