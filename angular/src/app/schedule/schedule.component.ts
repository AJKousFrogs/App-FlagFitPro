import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { LucideAngularModule } from "lucide-angular";

import { SkeletonComponent } from "../shared/skeleton.component";
import { AthleteEventsService } from "../core/services/athlete-events.service";
import { ScheduleService } from "../core/services/schedule.service";
import {
  AthleteEvent,
  AthleteEventCategory,
  AthleteEventImportance,
  AthleteEventKind,
  AthleteEventTier,
  ATHLETE_EVENT_CATEGORY_LABEL,
  ATHLETE_EVENT_KIND_LABEL,
  ATHLETE_EVENT_TIER_LABEL,
} from "../core/models/athlete-event.models";
import { CompetitionEvent } from "../core/models/schedule.models";
import { googleMapsSearchUrl } from "../core/utils/map-link.util";

/**
 * Schedule — the athlete's calendar.
 *
 * Athletes enter their own events (personal sessions, domestic league gamedays,
 * national-team camps & tournaments). These merge into the schedule snapshot so
 * the periodization engine tapers before and recovers after them — which is what
 * stops Today from prescribing the same generic session every day. Team
 * competition events also show here (read-only).
 */
type Mode = "list" | "form";

const KIND_DEFAULT_IMPORTANCE: Record<
  AthleteEventKind,
  AthleteEventImportance
> = {
  gameday: "high",
  tournament: "peak",
  camp: "regular",
  friendly: "regular",
  training: "regular",
  other: "regular",
};

@Component({
  selector: "app-schedule",
  standalone: true,
  imports: [LucideAngularModule, SkeletonComponent],
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
        <!-- ───────── add / edit form ───────── -->
        <div class="card stack">
          <div class="row">
            <h2>{{ editingId() ? "Edit event" : "Add event" }}</h2>
            <button
              class="icon-btn"
              type="button"
              aria-label="Cancel"
              (click)="cancel()"
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
            <button class="btn ghost" type="button" (click)="cancel()">
              Cancel
            </button>
            <button
              class="btn primary"
              type="button"
              [attr.aria-disabled]="saving()"
              (click)="save()"
            >
              {{
                saving()
                  ? "Saving…"
                  : editingId()
                    ? "Save changes"
                    : "Add event"
              }}
            </button>
          </div>
        </div>
      } @else {
        <!-- ───────── list ───────── -->
        <p class="muted" style="margin:0">
          Add your camps, tournaments and gamedays so your plan tapers before
          them and builds recovery after — instead of prescribing the same
          session every day.
        </p>

        <div class="section-h"><h2>Your events</h2></div>
        @if (loading() && myEvents().length === 0) {
          <!-- skeleton only on first load — a mutation re-runs load() but the
               existing list should stay visible, not flash back to a skeleton -->
          <app-skeleton variant="rows" [rows]="3" label="your events" />
        } @else if (myEvents().length === 0) {
          <div class="empty">
            <p style="margin:0 0 var(--s-3)">
              No events yet. Add your next camp, tournament or gameday.
            </p>
            <button class="btn primary" type="button" (click)="openAdd()">
              <lucide-icon name="calendar-plus" /> Add your first event
            </button>
          </div>
        } @else {
          @for (ev of myEvents(); track ev.id) {
            <div class="card">
              <div class="row" style="align-items:flex-start">
                <div class="stack" style="gap:4px">
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
                    (click)="openEdit(ev)"
                  >
                    <lucide-icon name="pencil" />
                  </button>
                  <button
                    class="icon-btn"
                    type="button"
                    aria-label="Delete"
                    (click)="remove(ev)"
                  >
                    <lucide-icon name="trash-2" />
                  </button>
                </div>
              </div>
            </div>
          }
        }

        @if (teamEvents().length > 0) {
          <div class="section-h"><h2>Team competitions</h2></div>
          @for (ev of teamEvents(); track ev.id) {
            <div class="card flat">
              <div class="row">
                <div class="stack" style="gap:4px">
                  <b>{{ ev.competitionShortName || ev.competitionName }}</b>
                  <small class="muted">{{
                    whenLabel(ev.startsAt, ev.endsAt)
                  }}</small>
                  @if (ev.hotelName || ev.hotelAddress) {
                    <small class="muted inline">
                      <lucide-icon name="bed" />
                      {{ ev.hotelName || "Team hotel" }}
                      @if (ev.hotelAddress) {
                        ·
                        <a
                          [href]="mapUrl(ev.hotelAddress)"
                          target="_blank"
                          rel="noopener"
                          >map</a
                        >
                      }
                    </small>
                  }
                </div>
                <span class="band neutral">Team</span>
              </div>
            </div>
          }
        }
      }
    </main>
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
export class ScheduleComponent implements OnInit {
  private readonly athleteEvents = inject(AthleteEventsService);
  private readonly scheduleSvc = inject(ScheduleService);

  readonly mode = signal<Mode>("list");
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  // form fields
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

  readonly categories: { key: AthleteEventCategory; label: string }[] = [
    { key: "personal", label: "Personal" },
    { key: "domestic", label: "Domestic" },
    { key: "national", label: "National team" },
  ];
  readonly kinds: { key: AthleteEventKind; label: string }[] = [
    { key: "gameday", label: "Gameday" },
    { key: "tournament", label: "Tournament" },
    { key: "camp", label: "Camp" },
    { key: "friendly", label: "Friendly" },
    { key: "training", label: "Team training" },
    { key: "other", label: "Other" },
  ];
  readonly importances: { key: AthleteEventImportance; label: string }[] = [
    { key: "regular", label: "Regular" },
    { key: "high", label: "High" },
    { key: "peak", label: "Peak" },
  ];
  readonly tiers: { key: AthleteEventTier; label: string }[] = [
    { key: null, label: "Camp / not applicable" },
    { key: "continental", label: ATHLETE_EVENT_TIER_LABEL.continental },
    { key: "world", label: ATHLETE_EVENT_TIER_LABEL.world },
    { key: "olympic", label: ATHLETE_EVENT_TIER_LABEL.olympic },
  ];

  readonly myEvents = this.athleteEvents.upcoming;
  /** "Your events" list loading state (athlete-entered events fetch). */
  readonly loading = this.athleteEvents.loading;
  readonly teamEvents = computed<CompetitionEvent[]>(() =>
    this.scheduleSvc.upcoming().filter((e) => e.source === "team"),
  );

  ngOnInit(): void {
    void this.athleteEvents.load();
  }

  // event-target helpers (no two-way ngModel in this codebase)
  val(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }
  num(e: Event): number {
    const n = Number.parseInt((e.target as HTMLInputElement).value, 10);
    return Number.isFinite(n) ? n : 0;
  }

  catLabel(c: AthleteEventCategory): string {
    return ATHLETE_EVENT_CATEGORY_LABEL[c];
  }
  /** Prefer the specific tier ("World Championship") over the generic
   *  category label ("National team") when one is set. */
  tierLabel(ev: AthleteEvent): string {
    return ev.tier
      ? ATHLETE_EVENT_TIER_LABEL[ev.tier]
      : this.catLabel(ev.category);
  }
  kindLabel(k: AthleteEventKind): string {
    return ATHLETE_EVENT_KIND_LABEL[k];
  }
  importanceClass(i: AthleteEventImportance): string {
    return i === "peak" ? "danger" : i === "high" ? "caution" : "info";
  }

  mapUrl(address: string): string {
    return googleMapsSearchUrl(address);
  }

  whenLabel(startsAt: string, endsAt: string | null): string {
    const fmt = (iso: string) =>
      new Date(iso).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    const time = new Date(startsAt).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (endsAt && fmt(endsAt) !== fmt(startsAt)) {
      return `${fmt(startsAt)} → ${fmt(endsAt)}`;
    }
    return `${fmt(startsAt)} · ${time}`;
  }

  onKind(k: AthleteEventKind): void {
    this.fKind.set(k);
    // suggest an importance for the kind; the athlete can still override
    this.fImportance.set(KIND_DEFAULT_IMPORTANCE[k]);
  }

  openAdd(): void {
    this.resetForm();
    this.editingId.set(null);
    this.mode.set("form");
  }

  openEdit(ev: AthleteEvent): void {
    this.editingId.set(ev.id);
    this.fTitle.set(ev.title);
    this.fCategory.set(ev.category);
    this.fKind.set(ev.kind);
    this.fStartDate.set(this.toDateInput(ev.startsAt));
    this.fStartTime.set(this.toTimeInput(ev.startsAt));
    this.fEndDate.set(ev.endsAt ? this.toDateInput(ev.endsAt) : "");
    this.fGames.set(ev.expectedGameCount);
    this.fImportance.set(ev.importance);
    this.fTier.set(ev.tier ?? null);
    this.fLocation.set(ev.location ?? "");
    this.fNotes.set(ev.notes ?? "");
    this.formError.set(null);
    this.mode.set("form");
  }

  cancel(): void {
    this.mode.set("list");
    this.formError.set(null);
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
    const startsAt = this.combine(
      this.fStartDate(),
      this.fStartTime() || "18:00",
    );
    const endsAt = this.fEndDate()
      ? this.combine(this.fEndDate(), "23:59")
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
      const id = this.editingId();
      if (id) {
        await this.athleteEvents.update(id, input);
      } else {
        await this.athleteEvents.create(input);
      }
      this.mode.set("list");
    } catch (err) {
      this.formError.set(
        err instanceof Error ? err.message : "Could not save the event.",
      );
    } finally {
      this.saving.set(false);
    }
  }

  async remove(ev: AthleteEvent): Promise<void> {
    if (!confirm(`Delete "${ev.title}"?`)) return;
    try {
      await this.athleteEvents.remove(ev.id);
    } catch {
      // surface inline next render; keep it simple for now
      this.formError.set("Could not delete the event.");
    }
  }

  private resetForm(): void {
    this.fTitle.set("");
    this.fCategory.set("personal");
    this.fKind.set("gameday");
    this.fStartDate.set("");
    this.fStartTime.set("18:00");
    this.fEndDate.set("");
    this.fGames.set(1);
    this.fImportance.set("high");
    this.fTier.set(null);
    this.fLocation.set("");
    this.fNotes.set("");
    this.formError.set(null);
  }

  // ── date helpers (local-time <-> ISO) ──
  private combine(dateStr: string, timeStr: string): string {
    // dateStr YYYY-MM-DD, timeStr HH:mm — interpret in the athlete's local tz
    const [y, m, d] = dateStr.split("-").map(Number);
    const [hh, mm] = timeStr.split(":").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0).toISOString();
  }
  private toDateInput(iso: string): string {
    const dt = new Date(iso);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  private toTimeInput(iso: string): string {
    const dt = new Date(iso);
    return `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
  }
}
