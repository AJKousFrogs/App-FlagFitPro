import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { LucideAngularModule } from "lucide-angular";

import { SkeletonComponent } from "../shared/skeleton.component";
import { AthleteEvent } from "../core/models/athlete-event.models";
import { whenLabel } from "./schedule-date.util";
import {
  importanceClass,
  kindLabel,
  tierLabel,
} from "./schedule-event.options";

/**
 * "Your events" — the athlete's own entries, with edit/delete affordances.
 * Presentational: it renders what it is given and reports intent upward.
 */
@Component({
  selector: "app-schedule-event-list",
  imports: [LucideAngularModule, SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="section-h"><h2>Your events</h2></div>
    @if (loading() && events().length === 0) {
      <!-- skeleton only on first load — a mutation re-runs load() but the
           existing list should stay visible, not flash back to a skeleton -->
      <app-skeleton variant="rows" [rows]="3" label="your events" />
    } @else if (events().length === 0) {
      <div class="empty">
        <p style="margin:0 0 var(--s-3)">
          No events yet. Add your next camp, tournament or gameday.
        </p>
        <button class="btn primary" type="button" (click)="add.emit()">
          <lucide-icon name="calendar-plus" /> Add your first event
        </button>
      </div>
    } @else {
      @for (ev of events(); track ev.id) {
        <div class="card">
          <div class="row" style="align-items:flex-start">
            <div class="stack" style="gap: var(--s-1)">
              <div class="inline">
                <span class="band {{ importanceClass(ev.importance) }}">{{
                  tierLabel(ev)
                }}</span>
                <b>{{ ev.title }}</b>
              </div>
              <small class="muted"
                >{{ whenLabel(ev.startsAt, ev.endsAt) }} ·
                {{ kindLabel(ev.kind) }}</small
              >
              @if (ev.location) {
                <small class="muted inline"
                  ><lucide-icon name="map-pin" /> {{ ev.location }}</small
                >
              }
            </div>
            <div class="inline" style="gap:var(--s-1)">
              <button
                class="icon-btn"
                type="button"
                aria-label="Edit"
                (click)="edit.emit(ev)"
              >
                <lucide-icon name="pencil" />
              </button>
              <button
                class="icon-btn"
                type="button"
                aria-label="Delete"
                (click)="remove.emit(ev)"
              >
                <lucide-icon name="trash-2" />
              </button>
            </div>
          </div>
        </div>
      }
    }
  `,
})
export class ScheduleEventListComponent {
  readonly events = input.required<readonly AthleteEvent[]>();
  readonly loading = input(false);

  readonly add = output<void>();
  readonly edit = output<AthleteEvent>();
  readonly remove = output<AthleteEvent>();

  protected readonly whenLabel = whenLabel;
  protected readonly tierLabel = tierLabel;
  protected readonly kindLabel = kindLabel;
  protected readonly importanceClass = importanceClass;
}
