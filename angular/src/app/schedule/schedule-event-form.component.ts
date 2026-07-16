import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { LucideAngularModule } from "lucide-angular";

import { AthleteEventsService } from "../core/services/athlete-events.service";
import {
  AthleteEvent,
  AthleteEventCategory,
  AthleteEventImportance,
  AthleteEventKind,
  AthleteEventTier,
} from "../core/models/athlete-event.models";
import { eventValue, eventNumber } from "../shared/utils/event.utils";
import { combineLocal, toDateInput, toTimeInput } from "./schedule-date.util";
import {
  EVENT_CATEGORIES,
  EVENT_IMPORTANCES,
  EVENT_KINDS,
  EVENT_TIERS,
  KIND_DEFAULT_IMPORTANCE,
} from "./schedule-event.options";

/**
 * Add / edit an athlete event.
 *
 * Owns the whole form: field state, validation and the create/update call. The
 * parent mounts it behind an `@if`, so a fresh instance seeds itself from
 * `event` on init — `null` means "add".
 */
@Component({
  selector: "app-schedule-event-form",
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card stack">
      <div class="row">
        <h2>{{ event() ? "Edit event" : "Add event" }}</h2>
        <button
          class="icon-btn"
          type="button"
          aria-label="Cancel"
          (click)="cancelled.emit()"
        >
          <lucide-icon name="x" />
        </button>
      </div>

      <label class="lbl" for="sch-title">Title</label>
      <input
        id="sch-title"
        class="input"
        type="text"
        placeholder="e.g. National team camp"
        [value]="fTitle()"
        (input)="fTitle.set(val($event))"
      />

      <p class="lbl" style="margin:0">Level</p>
      <div class="chiprow">
        @for (c of categories; track c.key) {
          <button
            type="button"
            class="chip"
            [class.sel]="fCategory() === c.key"
            (click)="fCategory.set(c.key)"
          >
            {{ c.label }}
          </button>
        }
      </div>

      @if (fCategory() === "national") {
        <p class="lbl" style="margin:0">
          Competition tier
          <span class="muted"
            >(a Continental/World/Olympic commitment tapers deeper than a
            routine camp)</span
          >
        </p>
        <div class="chiprow">
          @for (t of tiers; track t.key ?? "none") {
            <button
              type="button"
              class="chip"
              [class.sel]="fTier() === t.key"
              (click)="fTier.set(t.key)"
            >
              {{ t.label }}
            </button>
          }
        </div>
      }

      <p class="lbl" style="margin:0">Type</p>
      <div class="chiprow">
        @for (k of kinds; track k.key) {
          <button
            type="button"
            class="chip"
            [class.sel]="fKind() === k.key"
            (click)="onKind(k.key)"
          >
            {{ k.label }}
          </button>
        }
      </div>

      <div class="grid2">
        <div>
          <label class="lbl" for="sch-start-date">Start date</label>
          <input
            id="sch-start-date"
            class="input"
            type="date"
            [value]="fStartDate()"
            (change)="fStartDate.set(val($event))"
          />
        </div>
        <div>
          <label class="lbl" for="sch-start-time">Time</label>
          <input
            id="sch-start-time"
            class="input"
            type="time"
            [value]="fStartTime()"
            (change)="fStartTime.set(val($event))"
          />
        </div>
      </div>

      <label class="lbl" for="sch-end-date"
        >End date
        <span class="muted"
          >(optional — for camps / multi-day tournaments)</span
        ></label
      >
      <input
        id="sch-end-date"
        class="input"
        type="date"
        [value]="fEndDate()"
        (change)="fEndDate.set(val($event))"
      />

      <div class="grid2">
        <div>
          <label class="lbl" for="sch-games">Expected games</label>
          <input
            id="sch-games"
            class="input"
            type="number"
            min="0"
            max="50"
            [value]="fGames()"
            (input)="fGames.set(num($event))"
          />
        </div>
        <div>
          <p class="lbl" style="margin:0">Importance</p>
          <div class="chiprow">
            @for (i of importances; track i.key) {
              <button
                type="button"
                class="chip"
                [class.sel]="fImportance() === i.key"
                (click)="fImportance.set(i.key)"
              >
                {{ i.label }}
              </button>
            }
          </div>
        </div>
      </div>

      <label class="lbl" for="sch-location"
        >Location <span class="muted">(optional)</span></label
      >
      <input
        id="sch-location"
        class="input"
        type="text"
        placeholder="City / venue"
        [value]="fLocation()"
        (input)="fLocation.set(val($event))"
      />

      <label class="lbl" for="sch-notes"
        >Notes <span class="muted">(optional)</span></label
      >
      <input
        id="sch-notes"
        class="input"
        type="text"
        placeholder="Anything worth remembering"
        [value]="fNotes()"
        (input)="fNotes.set(val($event))"
      />

      @if (formError(); as e) {
        <p class="note" style="color:var(--danger)">{{ e }}</p>
      }

      <div class="row" style="justify-content:flex-end;gap:var(--s-2)">
        <button class="btn ghost" type="button" (click)="cancelled.emit()">
          Cancel
        </button>
        <button
          class="btn primary"
          type="button"
          [attr.aria-disabled]="saving()"
          (click)="save()"
        >
          {{ saving() ? "Saving…" : event() ? "Save changes" : "Add event" }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .lbl {
        font-size: var(--fs-sm);
        color: var(--text-muted);
        font-weight: var(--fw-semi);
      }
      .chiprow {
        display: flex;
        flex-wrap: wrap;
        gap: var(--s-2);
      }
      .grid2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--s-3);
      }
      .input {
        width: 100%;
      }
    `,
  ],
})
export class ScheduleEventFormComponent implements OnInit {
  private readonly athleteEvents = inject(AthleteEventsService);

  /** The event being edited; `null` puts the form in "add" mode. */
  readonly event = input<AthleteEvent | null>(null);

  /** Emitted once a create/update lands, so the parent can return to the list. */
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  readonly fTitle = signal("");
  readonly fCategory = signal<AthleteEventCategory>("personal");
  readonly fKind = signal<AthleteEventKind>("gameday");
  readonly fStartDate = signal("");
  readonly fStartTime = signal("18:00");
  readonly fEndDate = signal("");
  readonly fGames = signal(1);
  readonly fImportance = signal<AthleteEventImportance>("high");
  readonly fTier = signal<AthleteEventTier>(null);
  readonly fLocation = signal("");
  readonly fNotes = signal("");

  readonly categories = EVENT_CATEGORIES;
  readonly kinds = EVENT_KINDS;
  readonly importances = EVENT_IMPORTANCES;
  readonly tiers = EVENT_TIERS;

  // event-target helpers — shared typed accessors (no two-way ngModel here)
  protected readonly val = eventValue;
  protected readonly num = eventNumber;

  ngOnInit(): void {
    const ev = this.event();
    if (!ev) return;
    this.fTitle.set(ev.title);
    this.fCategory.set(ev.category);
    this.fKind.set(ev.kind);
    this.fStartDate.set(toDateInput(ev.startsAt));
    this.fStartTime.set(toTimeInput(ev.startsAt));
    this.fEndDate.set(ev.endsAt ? toDateInput(ev.endsAt) : "");
    this.fGames.set(ev.expectedGameCount);
    this.fImportance.set(ev.importance);
    this.fTier.set(ev.tier ?? null);
    this.fLocation.set(ev.location ?? "");
    this.fNotes.set(ev.notes ?? "");
  }

  onKind(k: AthleteEventKind): void {
    this.fKind.set(k);
    // suggest an importance for the kind; the athlete can still override
    this.fImportance.set(KIND_DEFAULT_IMPORTANCE[k]);
  }

  async save(): Promise<void> {
    if (this.saving()) return;
    const title = this.fTitle().trim();
    if (!title) {
      this.formError.set("Give the event a title.");
      return;
    }
    if (!this.fStartDate()) {
      this.formError.set("Pick a start date.");
      return;
    }
    const startsAt = combineLocal(
      this.fStartDate(),
      this.fStartTime() || "18:00",
    );
    const endsAt = this.fEndDate()
      ? combineLocal(this.fEndDate(), "23:59")
      : null;
    if (endsAt && new Date(endsAt) < new Date(startsAt)) {
      this.formError.set("End date can't be before the start date.");
      return;
    }

    const input = {
      category: this.fCategory(),
      kind: this.fKind(),
      title,
      startsAt,
      endsAt,
      expectedGameCount: this.fGames(),
      importance: this.fImportance(),
      // Tier only means something for a national-team commitment — clear it
      // if the athlete switches category away from "national" without
      // remembering to reset the chip.
      tier: this.fCategory() === "national" ? this.fTier() : null,
      location: this.fLocation().trim() || null,
      notes: this.fNotes().trim() || null,
    };

    this.saving.set(true);
    this.formError.set(null);
    try {
      const existing = this.event();
      if (existing) {
        await this.athleteEvents.update(existing.id, input);
      } else {
        await this.athleteEvents.create(input);
      }
      this.saved.emit();
    } catch (err) {
      this.formError.set(
        err instanceof Error ? err.message : "Could not save the event.",
      );
    } finally {
      this.saving.set(false);
    }
  }
}
