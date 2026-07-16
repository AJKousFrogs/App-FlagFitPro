import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { LucideAngularModule } from "lucide-angular";

import { AthleteEventsService } from "../core/services/athlete-events.service";
import { ScheduleService } from "../core/services/schedule.service";
import { AthleteEvent } from "../core/models/athlete-event.models";
import { CompetitionEvent } from "../core/models/schedule.models";
import { ScheduleEventFormComponent } from "./schedule-event-form.component";
import { ScheduleEventListComponent } from "./schedule-event-list.component";
import { ScheduleTeamEventsComponent } from "./schedule-team-events.component";

/**
 * Schedule — the athlete's calendar.
 *
 * Athletes enter their own events (personal sessions, domestic league gamedays,
 * national-team camps & tournaments). These merge into the schedule snapshot so
 * the periodization engine tapers before and recovers after them — which is what
 * stops Today from prescribing the same generic session every day. Team
 * competition events also show here (read-only).
 *
 * This is the shell: it owns the list/form mode and the data sources, and hands
 * each section to its own component.
 */
type Mode = "list" | "form";

@Component({
  selector: "app-schedule",
  imports: [
    LucideAngularModule,
    ScheduleEventFormComponent,
    ScheduleEventListComponent,
    ScheduleTeamEventsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topbar">
      <div>
        <div class="eyebrow">Your calendar</div>
        <h1>Schedule</h1>
      </div>
      @if (mode() === "list") {
        <button class="btn primary sm" type="button" (click)="openAdd()">
          <lucide-icon name="calendar-plus" /> Add event
        </button>
      }
    </header>

    <main class="screen">
      @if (mode() === "form") {
        <app-schedule-event-form
          [event]="editing()"
          (saved)="onSaved()"
          (cancelled)="cancel()"
        />
      } @else {
        <p class="muted" style="margin:0">
          Add your camps, tournaments and gamedays so your plan tapers before
          them and builds recovery after — instead of prescribing the same
          session every day.
        </p>

        @if (listError(); as e) {
          <p class="note" style="color:var(--danger)">{{ e }}</p>
        }

        <app-schedule-event-list
          [events]="myEvents()"
          [loading]="loading()"
          (add)="openAdd()"
          (edit)="openEdit($event)"
          (remove)="remove($event)"
        />

        <app-schedule-team-events [events]="teamEvents()" />
      }
    </main>
  `,
})
export class ScheduleComponent implements OnInit {
  private readonly athleteEvents = inject(AthleteEventsService);
  private readonly scheduleSvc = inject(ScheduleService);

  readonly mode = signal<Mode>("list");
  /** The event the form is editing; `null` means the form is in "add" mode. */
  readonly editing = signal<AthleteEvent | null>(null);
  readonly listError = signal<string | null>(null);

  readonly myEvents = this.athleteEvents.upcoming;
  /** "Your events" list loading state (athlete-entered events fetch). */
  readonly loading = this.athleteEvents.loading;
  readonly teamEvents = computed<CompetitionEvent[]>(() =>
    this.scheduleSvc.upcoming().filter((e) => e.source === "team"),
  );

  ngOnInit(): void {
    void this.athleteEvents.load();
  }

  openAdd(): void {
    this.editing.set(null);
    this.listError.set(null);
    this.mode.set("form");
  }

  openEdit(ev: AthleteEvent): void {
    this.editing.set(ev);
    this.listError.set(null);
    this.mode.set("form");
  }

  cancel(): void {
    this.mode.set("list");
  }

  onSaved(): void {
    this.mode.set("list");
  }

  async remove(ev: AthleteEvent): Promise<void> {
    if (!confirm(`Delete "${ev.title}"?`)) return;
    this.listError.set(null);
    try {
      await this.athleteEvents.remove(ev.id);
    } catch {
      this.listError.set("Could not delete the event.");
    }
  }
}
