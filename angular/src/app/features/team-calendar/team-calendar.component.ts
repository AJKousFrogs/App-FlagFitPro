/**
 * Team Calendar Component (Player View)
 *
 * Displays team events and allows players to manage their RSVPs
 * for practices, games, and team activities.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { CommonModule, DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  DestroyRef,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ToastService } from "../../core/services/toast.service";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { AppDialogComponent } from "../../shared/components/dialog/dialog.component";
import { DialogFooterComponent } from "../../shared/components/dialog-footer/dialog-footer.component";
import { DialogHeaderComponent } from "../../shared/components/dialog-header/dialog-header.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";
import { InputNumber } from "primeng/inputnumber";
import { Select, type SelectChangeEvent } from "primeng/select";

import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { Textarea } from "primeng/textarea";
import { firstValueFrom } from "rxjs";

import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import { LoggerService } from "../../core/services/logger.service";
import { extractApiPayload } from "../../core/utils/api-response-mapper";
import { AlertComponent } from "../../shared/components/alert/alert.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";

// ===== Interfaces =====
interface TeamEvent {
  id: string;
  title: string;
  type: EventType;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description?: string;
  myRsvp: RsvpStatus;
  rsvpStats: RsvpStats;
  needsRide?: boolean;
  guestsAllowed: boolean;
}

interface RsvpStats {
  going: number;
  notGoing: number;
  maybe: number;
  pending: number;
}

interface RsvpSubmission {
  eventId: string;
  status: RsvpStatus;
  guests: number;
  needsRide: boolean;
  canProvideRide: boolean;
  notes: string;
}

type EventType = "practice" | "game" | "team-event" | "meeting" | "tournament";
type RsvpStatus = "going" | "not-going" | "maybe" | "pending";

// ===== Constants =====
const EVENT_TYPE_CONFIG: Record<
  EventType,
  {
    label: string;
    icon: string;
    severity: "success" | "info" | "warning" | "danger" | "secondary";
  }
> = {
  practice: { label: "Practice", icon: "pi-flag", severity: "success" },
  game: { label: "Game", icon: "pi-star", severity: "danger" },
  "team-event": { label: "Team Event", icon: "pi-users", severity: "info" },
  meeting: { label: "Meeting", icon: "pi-comments", severity: "warning" },
  tournament: { label: "Tournament", icon: "pi-trophy", severity: "danger" },
};

@Component({
  selector: "app-team-calendar",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    InputNumber,
    Select,
    StatusTagComponent,
    Textarea,

    MainLayoutComponent,
    PageHeaderComponent,
    AlertComponent,
    AppDialogComponent,
    ButtonComponent,
    DialogFooterComponent,
    DialogHeaderComponent,
    EmptyStateComponent,
    CardShellComponent,
  ],
  template: `
    <app-main-layout>
<div class="calendar-page ui-page-shell ui-page-shell--content-lg ui-page-stack">
        <app-page-header
          title="Team Calendar"
          subtitle="Upcoming events and your RSVPs"
          icon="pi-calendar"
        ></app-page-header>

        <!-- Calendar Actions -->
        <div class="calendar-actions ui-section-card ui-section-card--compact">
          <p-select
            [options]="typeFilterOptions"
            [ngModel]="selectedType"
            (onChange)="onSelectedTypeSelect($event)"
            optionLabel="label"
            optionValue="value"
            placeholder="All Events"
            [showClear]="true"
            class="calendar-filter-select"
          ></p-select>

          <app-button
            variant="secondary"
            iconLeft="pi-calendar-plus"
            (clicked)="syncToCalendar()"
            >Sync to Calendar</app-button
          >
        </div>

        <!-- Pending RSVPs Alert -->
        @if (pendingCount() > 0) {
          <app-alert
            variant="warning"
            density="compact"
            title="Pending RSVPs"
            [message]="
              'You have ' +
              pendingCount() +
              ' pending RSVP' +
              (pendingCount() > 1 ? 's' : '')
            "
            styleClass="pending-alert"
          />
        }

        <!-- Events List by Date -->
        @for (dateGroup of groupedEvents(); track dateGroup.date) {
          <div class="date-group ui-page-stack--tight">
            <h3 class="date-header">
              {{ formatDateHeader(dateGroup.date) }}
            </h3>

            <div class="events-list ui-page-stack--tight">
              @for (event of dateGroup.events; track event.id) {
                <app-card-shell class="event-card" [class]="'type-' + event.type">
                  <div class="event-content">
                    <div class="event-time">
                      <span class="item-time">{{ event.startTime }}</span>
                      <span class="duration">{{ event.endTime }}</span>
                    </div>

                    <div class="event-details">
                      <div class="event-header">
                        <h4>{{ event.title }}</h4>
                        <app-status-tag
                          [value]="getEventTypeConfig(event.type).label"
                          [severity]="getEventTypeConfig(event.type).severity"
                          size="sm"
                        />
                      </div>

                      <p class="event-location">
                        <i class="pi pi-map-marker"></i>
                        {{ event.location }}
                      </p>

                      @if (event.description) {
                        <p class="event-description">{{ event.description }}</p>
                      }

                      <!-- RSVP Stats -->
                      <div class="rsvp-stats">
                        <span class="stat going">
                          <i class="pi pi-check-circle"></i>
                          {{ event.rsvpStats.going }} going
                        </span>
                        <span class="stat not-going">
                          <i class="pi pi-times-circle"></i>
                          {{ event.rsvpStats.notGoing }} can't go
                        </span>
                        @if (event.rsvpStats.maybe > 0) {
                          <span class="stat maybe">
                            <i class="pi pi-question-circle"></i>
                            {{ event.rsvpStats.maybe }} maybe
                          </span>
                        }
                      </div>
                    </div>

                    <div class="event-actions">
                      <!-- Current RSVP Status -->
                      <div
                        class="current-rsvp"
                        [class]="'status-' + event.myRsvp"
                      >
                        @switch (event.myRsvp) {
                          @case ("going") {
                            <i class="pi pi-check-circle"></i>
                            <span>Going</span>
                          }
                          @case ("not-going") {
                            <i class="pi pi-times-circle"></i>
                            <span>Can't Go</span>
                          }
                          @case ("maybe") {
                            <i class="pi pi-question-circle"></i>
                            <span>Maybe</span>
                          }
                          @default {
                            <i class="pi pi-clock"></i>
                            <span>Pending</span>
                          }
                        }
                      </div>

                      <app-button
                        variant="secondary"
                        size="sm"
                        iconLeft="pi-user-edit"
                        (clicked)="openRsvpDialog(event)"
                        >Manage RSVP</app-button
                      >
                    </div>
                  </div>
                </app-card-shell>
              }
            </div>
          </div>
        }

        @if (groupedEvents().length === 0) {
          <app-empty-state
            [useCard]="true"
            icon="pi-calendar"
            heading="No upcoming events"
            [description]="selectedType ? 'No ' + getEventTypeConfig(selectedType).label.toLowerCase() + ' events scheduled' : 'Check back later for team events'"
          />
        }
      </div>

      <!-- RSVP Dialog -->
      <app-dialog
        [(visible)]="showRsvpDialog"
        [modal]="true"
        [closable]="false"
        [draggable]="false"
        [resizable]="false"
        [dismissableMask]="true"
        dialogSize="md"
      >
        @if (selectedEvent(); as event) {
          <app-dialog-header
            icon="calendar"
            [title]="'RSVP: ' + event.title"
            [subtitle]="(event.date | date: 'EEEE, MMMM d') || ''"
            (close)="showRsvpDialog = false"
          />
        }
        @if (selectedEvent(); as event) {
          <div class="rsvp-form">
            <!-- Event Summary -->
            <div class="event-summary">
              <p>
                <i class="pi pi-calendar"></i>
                {{ event.date | date: "EEEE, MMMM d" }}
              </p>
              <p>
                <i class="pi pi-clock"></i> {{ event.startTime }} -
                {{ event.endTime }}
              </p>
              <p><i class="pi pi-map-marker"></i> {{ event.location }}</p>
            </div>

            <!-- RSVP Options -->
            <div class="rsvp-options">
              <h4>Are you attending?</h4>
              <div class="options-group">
                <div
                  class="option-card"
                  [class.selected]="rsvpForm.status === 'going'"
                  (click)="onRsvpStatusChange('going')"
                >
                  <input
                    type="radio"
                    name="rsvp"
                    value="going"
                    id="going"
                    [checked]="rsvpForm.status === 'going'"
                    (change)="onRsvpStatusChange('going')"
                  />
                  <label for="going">
                    <i class="pi pi-check-circle"></i>
                    <span>Going</span>
                  </label>
                </div>

                <div
                  class="option-card"
                  [class.selected]="rsvpForm.status === 'not-going'"
                  (click)="onRsvpStatusChange('not-going')"
                >
                  <input
                    type="radio"
                    name="rsvp"
                    value="not-going"
                    id="not-going"
                    [checked]="rsvpForm.status === 'not-going'"
                    (change)="onRsvpStatusChange('not-going')"
                  />
                  <label for="not-going">
                    <i class="pi pi-times-circle"></i>
                    <span>Can't Go</span>
                  </label>
                </div>

                <div
                  class="option-card"
                  [class.selected]="rsvpForm.status === 'maybe'"
                  (click)="onRsvpStatusChange('maybe')"
                >
                  <input
                    type="radio"
                    name="rsvp"
                    value="maybe"
                    id="maybe"
                    [checked]="rsvpForm.status === 'maybe'"
                    (change)="onRsvpStatusChange('maybe')"
                  />
                  <label for="maybe">
                    <i class="pi pi-question-circle"></i>
                    <span>Maybe</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Additional Options (shown if going) -->
            @if (rsvpForm.status === "going") {
              <div class="additional-options">
                <!-- Guests -->
                @if (event.guestsAllowed) {
                  <div class="option-row">
                    <label>Bringing guests?</label>
                    <p-inputNumber
                      [ngModel]="rsvpForm.guests"
                      (ngModelChange)="onRsvpGuestsChange($event)"
                      [min]="0"
                      [max]="5"
                      [showButtons]="true"
                      buttonLayout="horizontal"
                      spinnerMode="horizontal"
                      incrementButtonIcon="pi pi-plus"
                      decrementButtonIcon="pi pi-minus"
                    ></p-inputNumber>
                  </div>
                }

                <!-- Ride Options -->
                <div class="option-row checkbox-row">
                  <input
                    type="checkbox"
                    id="needsRide"
                    [checked]="rsvpForm.needsRide"
                    (change)="onRsvpNeedsRideToggle($event)"
                  />
                  <label for="needsRide">I need a ride</label>
                </div>

                <div class="option-row checkbox-row">
                  <input
                    type="checkbox"
                    id="canProvideRide"
                    [checked]="rsvpForm.canProvideRide"
                    (change)="onRsvpCanProvideRideToggle($event)"
                  />
                  <label for="canProvideRide"
                    >I can provide a ride ({{
                      rsvpForm.rideSeats
                    }}
                    seats)</label
                  >
                  @if (rsvpForm.canProvideRide) {
                    <p-inputNumber
                      [ngModel]="rsvpForm.rideSeats"
                      (ngModelChange)="onRsvpRideSeatsChange($event)"
                      [min]="1"
                      [max]="6"
                      [showButtons]="true"
                      class="ride-seats"
                    ></p-inputNumber>
                  }
                </div>
              </div>
            }

            <!-- Notes -->
            <div class="notes-section">
              <label for="notes">Notes (optional)</label>
              <textarea
                pTextarea
                id="notes"
                [value]="rsvpForm.notes"
                (input)="onRsvpNotesInput($event)"
                placeholder="Any notes for the coach..."
                rows="2"
              ></textarea>
            </div>

          </div>
        }
        @if (selectedEvent()) {
          <app-dialog-footer
            cancelLabel="Cancel"
            primaryLabel="Submit RSVP"
            primaryIcon="check"
            [disabled]="!rsvpForm.status"
            (cancel)="showRsvpDialog = false"
            (primary)="submitRsvp()"
          />
        }
      </app-dialog>
    </app-main-layout>
  `,
  styleUrl: "./team-calendar.component.scss",
})
export class TeamCalendarComponent implements OnInit {
  private readonly api = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);

  // State
  readonly events = signal<TeamEvent[]>([]);
  readonly selectedEvent = signal<TeamEvent | null>(null);
  readonly isLoading = signal(true);

  // Filter state
  selectedType: EventType | null = null;

  // Dialog state
  showRsvpDialog = false;
  rsvpForm: {
    status: RsvpStatus | null;
    guests: number;
    needsRide: boolean;
    canProvideRide: boolean;
    rideSeats: number;
    notes: string;
  } = {
    status: null,
    guests: 0,
    needsRide: false,
    canProvideRide: false,
    rideSeats: 3,
    notes: "",
  };

  // Options
  readonly typeFilterOptions = Object.entries(EVENT_TYPE_CONFIG).map(
    ([value, config]) => ({
      label: config.label,
      value: value as EventType,
    }),
  );

  // Computed values
  readonly filteredEvents = computed(() => {
    let result = this.events();

    if (this.selectedType) {
      result = result.filter((e) => e.type === this.selectedType);
    }

    // Sort by date
    return result.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  });

  readonly groupedEvents = computed(() => {
    const events = this.filteredEvents();
    const groups: { date: string; events: TeamEvent[] }[] = [];

    events.forEach((event) => {
      const dateKey = event.date.split("T")[0];
      let group = groups.find((g) => g.date === dateKey);
      if (!group) {
        group = { date: dateKey, events: [] };
        groups.push(group);
      }
      group.events.push(event);
    });

    return groups;
  });

  readonly pendingCount = computed(
    () => this.events().filter((e) => e.myRsvp === "pending").length,
  );

  ngOnInit(): void {
    this.loadData();
  }

  onSelectedTypeChange(value: EventType | null): void {
    this.selectedType = value;
  }

  onSelectedTypeSelect(event: SelectChangeEvent): void {
    this.onSelectedTypeChange((event.value as EventType | null | undefined) ?? null);
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      const response = await firstValueFrom(
        this.api.get<{ events?: TeamEvent[] }>(API_ENDPOINTS.teamCalendar.list),
      );
      const payload = extractApiPayload<{ events?: TeamEvent[] }>(response);
      this.events.set(payload?.events ?? []);
    } catch (err) {
      this.logger.error("Failed to load calendar data", err);
      // No team events scheduled
      this.events.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  openRsvpDialog(event: TeamEvent): void {
    this.selectedEvent.set(event);
    this.rsvpForm = {
      status: event.myRsvp === "pending" ? null : event.myRsvp,
      guests: 0,
      needsRide: event.needsRide || false,
      canProvideRide: false,
      rideSeats: 3,
      notes: "",
    };
    this.showRsvpDialog = true;
  }

  onRsvpStatusChange(value: RsvpStatus | null): void {
    this.rsvpForm = { ...this.rsvpForm, status: value };
  }

  onRsvpGuestsChange(value: number | null): void {
    this.rsvpForm = { ...this.rsvpForm, guests: value ?? 0 };
  }

  onRsvpNeedsRideChange(value: boolean): void {
    this.rsvpForm = { ...this.rsvpForm, needsRide: value };
  }

  onRsvpNeedsRideToggle(event: Event): void {
    this.onRsvpNeedsRideChange(this.readChecked(event));
  }

  onRsvpCanProvideRideChange(value: boolean): void {
    this.rsvpForm = { ...this.rsvpForm, canProvideRide: value };
  }

  onRsvpCanProvideRideToggle(event: Event): void {
    this.onRsvpCanProvideRideChange(this.readChecked(event));
  }

  onRsvpRideSeatsChange(value: number | null): void {
    this.rsvpForm = { ...this.rsvpForm, rideSeats: value ?? 1 };
  }

  onRsvpNotesChange(value: string): void {
    this.rsvpForm = { ...this.rsvpForm, notes: value };
  }

  onRsvpNotesInput(event: Event): void {
    this.onRsvpNotesChange(this.readInputValue(event));
  }

  private readInputValue(event: Event): string {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return target.value;
    }
    return "";
  }

  private readChecked(event: Event): boolean {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      return target.checked;
    }
    return false;
  }

  submitRsvp(): void {
    const event = this.selectedEvent();
    if (!event || !this.rsvpForm.status) return;

    const submission: RsvpSubmission = {
      eventId: event.id,
      status: this.rsvpForm.status,
      guests: this.rsvpForm.guests,
      needsRide: this.rsvpForm.needsRide,
      canProvideRide: this.rsvpForm.canProvideRide,
      notes: this.rsvpForm.notes,
    };

    // Optimistically update local state
    const rsvpStatus = this.rsvpForm.status;
    if (!rsvpStatus) return;

    this.events.update((events) =>
      events.map((e) =>
        e.id === event.id
          ? {
              ...e,
              myRsvp: rsvpStatus,
              needsRide: this.rsvpForm.needsRide,
            }
          : e,
      ),
    );

    this.api.post(API_ENDPOINTS.teamCalendar.rsvp, submission).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toastService.success(
          `You're ${this.getRsvpLabel(rsvpStatus)} for ${event.title}`,
          "RSVP Submitted",
        );
      },
      error: (err) => this.logger.error("Failed to submit RSVP", err),
    });

    this.showRsvpDialog = false;
  }

  syncToCalendar(): void {
    // Generate ICS file or link to calendar sync
    this.api.get(API_ENDPOINTS.teamCalendar.syncUrl).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: unknown) => {
        const url = (response as { url?: string })?.url;
        if (url) {
          window.open(url, "_blank");
        } else {
          this.toastService.info(
            "Calendar sync URL copied to clipboard",
            "Calendar Sync",
          );
        }
      },
      error: () => {
        this.toastService.info(
          "Subscribe URL: webcal://app.example.com/calendar/team.ics",
          "Calendar Sync",
        );
      },
    });
  }

  formatDateHeader(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }

  getEventTypeConfig(type: EventType): (typeof EVENT_TYPE_CONFIG)[EventType] {
    return EVENT_TYPE_CONFIG[type];
  }

  getRsvpLabel(status: RsvpStatus): string {
    const labels: Record<RsvpStatus, string> = {
      going: "Going",
      "not-going": "not going",
      maybe: "Maybe",
      pending: "pending",
    };
    return labels[status];
  }
}
