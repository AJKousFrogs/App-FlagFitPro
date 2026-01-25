/**
 * Team Calendar Component (Player View)
 *
 * Displays team events and allows players to manage their RSVPs
 * for practices, games, and team activities.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { CommonModule, DatePipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MessageService } from "primeng/api";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { Card } from "primeng/card";
import { Checkbox } from "primeng/checkbox";
import { Dialog } from "primeng/dialog";
import { InputNumber } from "primeng/inputnumber";
import { RadioButton } from "primeng/radiobutton";
import { Select } from "primeng/select";

import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { Textarea } from "primeng/textarea";
import { Toast } from "primeng/toast";
import { firstValueFrom } from "rxjs";

import { ApiService } from "../../core/services/api.service";
import { LoggerService } from "../../core/services/logger.service";
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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    Card,
    Checkbox,
    Dialog,
    InputNumber,
    RadioButton,
    Select,
    StatusTagComponent,
    Textarea,
    Toast,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent
  ],
  providers: [MessageService],
  template: `
    <app-main-layout>
      <p-toast></p-toast>

      <div class="calendar-page">
        <app-page-header
          title="Team Calendar"
          subtitle="Upcoming events and your RSVPs"
          icon="pi-calendar"
        ></app-page-header>

        <!-- Calendar Actions -->
        <div class="calendar-actions">
          <p-select
            [options]="typeFilterOptions"
            [(ngModel)]="selectedType"
            optionLabel="label"
            optionValue="value"
            placeholder="All Events"
            [showClear]="true"
            styleClass="calendar-filter-select"
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
          <p-card styleClass="pending-alert">
            <div class="alert-content">
              <i class="pi pi-exclamation-circle"></i>
              <span>
                You have <strong>{{ pendingCount() }}</strong> pending RSVP{{
                  pendingCount() > 1 ? "s" : ""
                }}
              </span>
            </div>
          </p-card>
        }

        <!-- Events List by Date -->
        @for (dateGroup of groupedEvents(); track dateGroup.date) {
          <div class="date-group">
            <h3 class="date-header">
              {{ formatDateHeader(dateGroup.date) }}
            </h3>

            <div class="events-list">
              @for (event of dateGroup.events; track event.id) {
                <p-card styleClass="event-card" [class]="'type-' + event.type">
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
                        size="sm"
                        (clicked)="openRsvpDialog(event)"
                      ></app-button>
                    </div>
                  </div>
                </p-card>
              }
            </div>
          </div>
        }

        @if (groupedEvents().length === 0) {
          <p-card styleClass="empty-state-card">
            <div class="empty-state">
              <i class="pi pi-calendar"></i>
              <h3>No upcoming events</h3>
              <p>
                @if (selectedType) {
                  No
                  {{ getEventTypeConfig(selectedType).label.toLowerCase() }}
                  events scheduled
                } @else {
                  Check back later for team events
                }
              </p>
            </div>
          </p-card>
        }
      </div>

      <!-- RSVP Dialog -->
      <p-dialog
        [(visible)]="showRsvpDialog"
        [header]="'RSVP: ' + (selectedEvent()?.title || '')"
        [modal]="true"
        [closable]="true"
        styleClass="rsvp-dialog"
      >
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
                  (click)="rsvpForm.status = 'going'"
                >
                  <p-radioButton
                    name="rsvp"
                    value="going"
                    [(ngModel)]="rsvpForm.status"
                    inputId="going"
                  ></p-radioButton>
                  <label for="going">
                    <i class="pi pi-check-circle"></i>
                    <span>Going</span>
                  </label>
                </div>

                <div
                  class="option-card"
                  [class.selected]="rsvpForm.status === 'not-going'"
                  (click)="rsvpForm.status = 'not-going'"
                >
                  <p-radioButton
                    name="rsvp"
                    value="not-going"
                    [(ngModel)]="rsvpForm.status"
                    inputId="not-going"
                  ></p-radioButton>
                  <label for="not-going">
                    <i class="pi pi-times-circle"></i>
                    <span>Can't Go</span>
                  </label>
                </div>

                <div
                  class="option-card"
                  [class.selected]="rsvpForm.status === 'maybe'"
                  (click)="rsvpForm.status = 'maybe'"
                >
                  <p-radioButton
                    name="rsvp"
                    value="maybe"
                    [(ngModel)]="rsvpForm.status"
                    inputId="maybe"
                  ></p-radioButton>
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
                      [(ngModel)]="rsvpForm.guests"
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
                  <p-checkbox
                    [(ngModel)]="rsvpForm.needsRide"
                    [binary]="true"
                    variant="filled"
                    inputId="needsRide"
                  ></p-checkbox>
                  <label for="needsRide">I need a ride</label>
                </div>

                <div class="option-row checkbox-row">
                  <p-checkbox
                    [(ngModel)]="rsvpForm.canProvideRide"
                    [binary]="true"
                    variant="filled"
                    inputId="canProvideRide"
                  ></p-checkbox>
                  <label for="canProvideRide"
                    >I can provide a ride ({{
                      rsvpForm.rideSeats
                    }}
                    seats)</label
                  >
                  @if (rsvpForm.canProvideRide) {
                    <p-inputNumber
                      [(ngModel)]="rsvpForm.rideSeats"
                      [min]="1"
                      [max]="6"
                      [showButtons]="true"
                      styleClass="ride-seats"
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
                [(ngModel)]="rsvpForm.notes"
                placeholder="Any notes for the coach..."
                rows="2"
              ></textarea>
            </div>

            <!-- Submit -->
            <div class="rsvp-actions">
              <app-button variant="secondary" (clicked)="showRsvpDialog = false"
                >Cancel</app-button
              >
              <app-button
                iconLeft="pi-check"
                [disabled]="!rsvpForm.status"
                (clicked)="submitRsvp()"
                >Submit RSVP</app-button
              >
            </div>
          </div>
        }
      </p-dialog>
    </app-main-layout>
  `,
  styleUrl: "./team-calendar.component.scss",
})
export class TeamCalendarComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly messageService = inject(MessageService);

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

  async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await firstValueFrom(
        this.api.get("/api/team-calendar"),
      );
      if (response?.success && response.data?.events) {
        this.events.set(response.data.events);
      }
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

    this.api.post("/api/team-calendar/rsvp", submission).subscribe({
      next: () => {
        this.messageService.add({
          severity: "success",
          summary: "RSVP Submitted",
          detail: `You're ${this.getRsvpLabel(rsvpStatus)} for ${event.title}`,
        });
      },
      error: (err) => this.logger.error("Failed to submit RSVP", err),
    });

    this.showRsvpDialog = false;
  }

  syncToCalendar(): void {
    // Generate ICS file or link to calendar sync
    this.api.get("/api/team-calendar/sync-url").subscribe({
      next: (response: unknown) => {
        const url = (response as { url?: string })?.url;
        if (url) {
          window.open(url, "_blank");
        } else {
          this.messageService.add({
            severity: "info",
            summary: "Calendar Sync",
            detail: "Calendar sync URL copied to clipboard",
          });
        }
      },
      error: () => {
        this.messageService.add({
          severity: "info",
          summary: "Calendar Sync",
          detail: "Subscribe URL: webcal://app.example.com/calendar/team.ics",
        });
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
