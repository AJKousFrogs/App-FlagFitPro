/**
 * Team Calendar Component (Coach View)
 *
 * Create and manage team events (practices, games, tournaments),
 * track RSVPs, handle logistics, and coordinate with team.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MessageService } from "primeng/api";
import { CardModule } from "primeng/card";
import { Checkbox } from "primeng/checkbox";
import { DatePicker } from "primeng/datepicker";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { ProgressBarModule } from "primeng/progressbar";
import { RadioButton } from "primeng/radiobutton";
import { Select } from "primeng/select";
import { TagModule } from "primeng/tag";
import { Textarea } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { firstValueFrom } from "rxjs";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";

import { UI_LIMITS } from "../../../core/constants/app.constants";
import { ApiService } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";

// ===== Interfaces =====
interface TeamEvent {
  id: string;
  title: string;
  type: "practice" | "game" | "tournament" | "meeting" | "social";
  date: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  location: string;
  description?: string;
  rsvpSummary: { going: number; cantGo: number; pending: number };
  ridesNeeded?: number;
  ridesOffered?: number;
  paymentInfo?: { collected: number; total: number };
  rsvpDeadline?: string;
}

interface EventRsvp {
  id: string;
  playerName: string;
  status: "going" | "cant-go" | "pending";
  arrivalTime?: string;
  notes?: string;
  needsRide?: boolean;
  offersRide?: boolean;
  rideSeats?: number;
}

interface CalendarDay {
  date: number;
  events: TeamEvent[];
  isToday: boolean;
  isCurrentMonth: boolean;
}

// ===== Constants =====
const EVENT_TYPES = [
  { label: "Practice", value: "practice" },
  { label: "Game", value: "game" },
  { label: "Tournament", value: "tournament" },
  { label: "Team Meeting", value: "meeting" },
  { label: "Team Event / Social", value: "social" },
  { label: "Post-Game Debrief", value: "debrief" },
];

const LOCATIONS = [
  { id: "1", name: "Central Park Field" },
  { id: "2", name: "North Field" },
  { id: "3", name: "City Sports Complex" },
  { id: "4", name: "Indoor Facility" },
];

const RECURRING_OPTIONS = [
  { label: "One-time event", value: "none" },
  { label: "Weekly", value: "weekly" },
  { label: "Bi-weekly", value: "biweekly" },
  { label: "Monthly", value: "monthly" },
];

@Component({
  selector: "app-calendar-coach",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    Checkbox,
    DatePicker,
    DialogModule,
    InputTextModule,
    ProgressBarModule,
    RadioButton,
    Select,
    TagModule,
    Textarea,
    ToastModule,
    MainLayoutComponent,
    PageHeaderComponent,

    ButtonComponent,
    IconButtonComponent,
  ],
  providers: [MessageService],
  template: `
    <app-main-layout>
      <p-toast></p-toast>

      <div class="calendar-coach-page">
        <app-page-header
          title="Team Calendar"
          subtitle="Manage team schedule and RSVPs"
          icon="pi-calendar"
        >
          <app-button iconLeft="pi-plus" (clicked)="openCreateDialog()"
            >Create Event</app-button
          >
        </app-page-header>

        <!-- Calendar View -->
        <p-card styleClass="calendar-card">
          <div class="calendar-header">
            <div class="calendar-nav">
              <app-button
                variant="text"
                iconLeft="pi-chevron-left"
                (clicked)="previousMonth()"
                >Previous month</app-button
              >
              <h3>{{ currentMonthLabel() }}</h3>
              <app-button
                variant="text"
                iconLeft="pi-chevron-right"
                (clicked)="nextMonth()"
                >Next month</app-button
              >
            </div>
            <div class="calendar-view-toggle">
              <app-button size="sm" (clicked)="viewMode.set('month')"
                >Month</app-button
              >
              <app-button size="sm" (clicked)="viewMode.set('list')"
                >List</app-button
              >
              <app-button size="sm" (clicked)="viewMode.set('agenda')"
                >Agenda</app-button
              >
            </div>
          </div>

          @if (viewMode() === "month") {
            <div class="calendar-grid">
              <div class="calendar-weekdays">
                @for (day of weekDays; track day) {
                  <div class="weekday">{{ day }}</div>
                }
              </div>
              <div class="calendar-days">
                @for (day of calendarDays(); track day.date) {
                  <div
                    class="calendar-day"
                    [class.today]="day.isToday"
                    [class.other-month]="!day.isCurrentMonth"
                  >
                    <span class="day-number">{{ day.date }}</span>
                    @if (day.events.length > 0) {
                      <div class="day-events">
                        @for (
                          event of day.events.slice(
                            0,
                            UI_LIMITS.CALENDAR_EVENTS_PER_DAY
                          );
                          track event.id
                        ) {
                          <div
                            class="event-dot"
                            [class]="'type-' + event.type"
                            (click)="viewEvent(event)"
                          >
                            {{ getEventIcon(event.type) }}
                            <span class="rsvp-count"
                              >{{ event.rsvpSummary.going }}/{{
                                event.rsvpSummary.going +
                                  event.rsvpSummary.cantGo +
                                  event.rsvpSummary.pending
                              }}</span
                            >
                          </div>
                        }
                        @if (day.events.length > 2) {
                          <div class="more-events">
                            +{{ day.events.length - 2 }} more
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

            <div class="calendar-legend">
              <span class="legend-item"
                ><span class="legend-icon">🏋️</span> Practice</span
              >
              <span class="legend-item"
                ><span class="legend-icon">🏈</span> Game</span
              >
              <span class="legend-item"
                ><span class="legend-icon">🏆</span> Tournament</span
              >
              <span class="legend-item"
                ><span class="legend-icon">📋</span> Meeting</span
              >
              <span class="legend-item"
                ><span class="legend-icon">●</span> Today</span
              >
            </div>
          }
        </p-card>

        <!-- Upcoming Events -->
        <div class="section">
          <h3 class="section-title">Upcoming Events</h3>
          <div class="events-list">
            @for (event of upcomingEvents(); track event.id) {
              <div class="event-card" [class]="'type-' + event.type">
                <div class="event-header">
                  <div class="event-title">
                    <span class="event-icon">{{
                      getEventIcon(event.type)
                    }}</span>
                    <h4>{{ event.title }}</h4>
                  </div>
                  <div class="event-date">{{ event.date }}</div>
                  <div class="event-actions-header">
                    <app-button
                      variant="text"
                      size="sm"
                      iconLeft="pi-pencil"
                      (clicked)="editEvent(event)"
                      >Edit</app-button
                    >
                    <app-button
                      variant="text"
                      size="sm"
                      iconLeft="pi-ellipsis-v"
                      >More options</app-button
                    >
                  </div>
                </div>

                <div class="event-details">
                  <p>
                    📍 {{ event.location }} • ⏰ {{ event.startTime }} -
                    {{ event.endTime }}
                  </p>
                </div>

                <div class="event-rsvp">
                  <span class="rsvp-item going"
                    >✅ {{ event.rsvpSummary.going }} going</span
                  >
                  <span class="rsvp-item cant-go"
                    >❌ {{ event.rsvpSummary.cantGo }} can't</span
                  >
                  <span class="rsvp-item pending"
                    >❓ {{ event.rsvpSummary.pending }} pending</span
                  >
                </div>

                @if (event.rsvpDeadline) {
                  <div class="event-deadline">
                    <span>RSVP Deadline: {{ event.rsvpDeadline }}</span>
                    @if (event.rsvpSummary.pending > 0) {
                      <p-tag value="Pending RSVPs" severity="warn"></p-tag>
                    }
                  </div>
                }

                @if (event.ridesNeeded && event.ridesOffered) {
                  <div class="event-rides">
                    🚗 Rides: {{ event.ridesNeeded }} need,
                    {{ event.ridesOffered }} offered
                  </div>
                }

                @if (event.paymentInfo) {
                  <div class="event-payment">
                    💰 Payments: \${{ event.paymentInfo.collected }} / \${{
                      event.paymentInfo.total
                    }}
                    ({{ getPaymentPercent(event) }}%)
                  </div>
                }

                <div class="event-actions">
                  <app-button
                    variant="secondary"
                    size="sm"
                    (clicked)="viewRsvps(event)"
                    >View RSVPs</app-button
                  >
                  <app-button
                    variant="secondary"
                    size="sm"
                    (clicked)="editEvent(event)"
                    >Edit Event</app-button
                  >
                  @if (event.type === "tournament") {
                    <app-button
                      variant="text"
                      size="sm"
                      (clicked)="setLineup(event)"
                      >Set Lineup</app-button
                    >
                  }
                  <app-button
                    variant="text"
                    size="sm"
                    (clicked)="cancelEvent(event)"
                    >Cancel Event</app-button
                  >
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                <i class="pi pi-calendar"></i>
                <p>No upcoming events</p>
                <app-button iconLeft="pi-plus" (clicked)="openCreateDialog()"
                  >Create Event</app-button
                >
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Create Event Dialog -->
      <p-dialog
        [(visible)]="showCreateDialog"
        [header]="isEditing() ? 'Edit Event' : 'Create Event'"
        [modal]="true"
        [style]="{ width: '95vw', maxWidth: '600px' }"
      >
        <div class="event-form">
          <div class="form-field">
            <label>Event Type</label>
            <div class="radio-group">
              @for (type of eventTypes; track type.value) {
                <div class="radio-option">
                  <p-radioButton
                    name="eventType"
                    [value]="type.value"
                    [(ngModel)]="eventForm.type"
                    [inputId]="'type-' + type.value"
                  ></p-radioButton>
                  <label [for]="'type-' + type.value">{{ type.label }}</label>
                </div>
              }
            </div>
          </div>

          <div class="form-field">
            <label>Event Title</label>
            <input
              type="text"
              pInputText
              [(ngModel)]="eventForm.title"
              placeholder="Tuesday Practice"
            />
          </div>

          <div class="form-row">
            <div class="form-field">
              <label>Date</label>
              <p-datepicker
                [(ngModel)]="eventForm.date"
                [showIcon]="true"
                styleClass="w-full"
              ></p-datepicker>
            </div>
            <div class="form-field">
              <label>Start Time</label>
              <p-select
                [options]="timeOptions"
                [(ngModel)]="eventForm.startTime"
                optionLabel="label"
                optionValue="value"
                placeholder="Select time"
                styleClass="w-full"
              ></p-select>
            </div>
            <div class="form-field">
              <label>End Time</label>
              <p-select
                [options]="timeOptions"
                [(ngModel)]="eventForm.endTime"
                optionLabel="label"
                optionValue="value"
                placeholder="Select time"
                styleClass="w-full"
              ></p-select>
            </div>
          </div>

          <div class="checkbox-option">
            <p-checkbox
              [(ngModel)]="eventForm.isMultiDay"
              [binary]="true"
              inputId="multiDay"
            ></p-checkbox>
            <label for="multiDay">Multi-day event (e.g., tournament)</label>
          </div>

          <div class="form-field">
            <label>Location</label>
            <p-select
              [options]="locations"
              [(ngModel)]="eventForm.location"
              optionLabel="name"
              optionValue="id"
              placeholder="Select location"
              styleClass="w-full"
            ></p-select>
          </div>

          <div class="form-field">
            <label>Description / Notes</label>
            <textarea
              pTextarea
              [(ngModel)]="eventForm.description"
              rows="3"
              placeholder="Regular practice. Focus on red zone offense..."
            ></textarea>
          </div>

          <div class="form-section">
            <h5>RSVP Settings</h5>
            <div class="checkbox-option">
              <p-checkbox
                [(ngModel)]="eventForm.requireRsvp"
                [binary]="true"
                inputId="requireRsvp"
              ></p-checkbox>
              <label for="requireRsvp">Require RSVP</label>
            </div>
            <div class="checkbox-option">
              <p-checkbox
                [(ngModel)]="eventForm.sendReminder"
                [binary]="true"
                inputId="sendReminder"
              ></p-checkbox>
              <label for="sendReminder"
                >Send automatic reminder 24h before</label
              >
            </div>
          </div>

          <div class="form-section">
            <h5>Recurring</h5>
            <div class="radio-group">
              @for (opt of recurringOptions; track opt.value) {
                <div class="radio-option">
                  <p-radioButton
                    name="recurring"
                    [value]="opt.value"
                    [(ngModel)]="eventForm.recurring"
                    [inputId]="'rec-' + opt.value"
                  ></p-radioButton>
                  <label [for]="'rec-' + opt.value">{{ opt.label }}</label>
                </div>
              }
            </div>
          </div>

          <div class="form-section">
            <h5>Notify</h5>
            <div class="checkbox-option">
              <p-checkbox
                [(ngModel)]="eventForm.notifyPlayers"
                [binary]="true"
                inputId="notifyPlayers"
              ></p-checkbox>
              <label for="notifyPlayers"
                >Send notification to all players</label
              >
            </div>
            <div class="checkbox-option">
              <p-checkbox
                [(ngModel)]="eventForm.notifyParents"
                [binary]="true"
                inputId="notifyParents"
              ></p-checkbox>
              <label for="notifyParents">Include parents/guardians</label>
            </div>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <app-button variant="secondary" (clicked)="showCreateDialog = false"
            >Cancel</app-button
          >
          <app-icon-button
            icon="pi-check"
            (clicked)="saveEvent()"
            ariaLabel="check"
          />
        </ng-template>
      </p-dialog>

      <!-- RSVP Management Dialog -->
      <p-dialog
        [(visible)]="showRsvpDialog"
        [header]="'RSVP Management: ' + (selectedEvent()?.title || '')"
        [modal]="true"
        [style]="{ width: '95vw', maxWidth: '600px' }"
      >
        @if (selectedEvent()) {
          <div class="rsvp-content">
            <div class="rsvp-header-info">
              <p>
                {{ selectedEvent()?.date }} • {{ selectedEvent()?.startTime }} -
                {{ selectedEvent()?.endTime }} • {{ selectedEvent()?.location }}
              </p>
              <p class="rsvp-totals">
                Total: {{ totalRsvpCount() }} players
                <span class="going">✅ {{ goingCount() }} going</span>
                <span class="cant-go">❌ {{ cantGoCount() }} can't</span>
                <span class="pending">❓ {{ pendingCount() }} pending</span>
              </p>
            </div>

            <div class="rsvp-section">
              <div class="section-header">
                <h4>Going ({{ goingCount() }})</h4>
                <app-button
                  variant="text"
                  size="sm"
                  (clicked)="messageAll('going')"
                  >Message All</app-button
                >
              </div>
              <div class="rsvp-list">
                @for (rsvp of goingRsvps(); track rsvp.id) {
                  <div class="rsvp-row">
                    <span class="rsvp-status">✅</span>
                    <span class="rsvp-name">{{ rsvp.playerName }}</span>
                    @if (rsvp.arrivalTime) {
                      <span class="rsvp-arrival"
                        >Arriving: {{ rsvp.arrivalTime }}</span
                      >
                    }
                    @if (rsvp.notes) {
                      <span class="rsvp-notes">{{ rsvp.notes }}</span>
                    }
                  </div>
                }
              </div>
            </div>

            @if (cantGoRsvps().length > 0) {
              <div class="rsvp-section">
                <h4>Can't Go ({{ cantGoCount() }})</h4>
                <div class="rsvp-list">
                  @for (rsvp of cantGoRsvps(); track rsvp.id) {
                    <div class="rsvp-row cant-go">
                      <span class="rsvp-status">❌</span>
                      <span class="rsvp-name">{{ rsvp.playerName }}</span>
                      @if (rsvp.notes) {
                        <span class="rsvp-notes">Reason: {{ rsvp.notes }}</span>
                      }
                    </div>
                  }
                </div>
              </div>
            }

            @if (pendingRsvps().length > 0) {
              <div class="rsvp-section">
                <div class="section-header">
                  <h4>Pending ({{ pendingCount() }})</h4>
                  <app-button size="sm" (clicked)="sendRsvpReminder()"
                    >Send Reminder</app-button
                  >
                </div>
                <div class="rsvp-list">
                  @for (rsvp of pendingRsvps(); track rsvp.id) {
                    <div class="rsvp-row pending">
                      <span class="rsvp-status">❓</span>
                      <span class="rsvp-name">{{ rsvp.playerName }}</span>
                      <span class="rsvp-notes">No response yet</span>
                    </div>
                  }
                </div>
              </div>
            }

            <div class="rsvp-actions">
              <app-button
                variant="secondary"
                iconLeft="pi-download"
                (clicked)="exportRsvpList()"
                >Export List</app-button
              >
              <app-button (clicked)="showRsvpDialog = false">Close</app-button>
            </div>
          </div>
        }
      </p-dialog>
    </app-main-layout>
  `,
  styleUrl: "./calendar-coach.component.scss",
})
export class CalendarCoachComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly messageService = inject(MessageService);

  // Constants exposed to template
  protected readonly UI_LIMITS = UI_LIMITS;

  // State
  readonly events = signal<TeamEvent[]>([]);
  readonly rsvps = signal<EventRsvp[]>([]);
  readonly currentMonth = signal(new Date());
  readonly viewMode = signal<"month" | "list" | "agenda">("month");
  readonly selectedEvent = signal<TeamEvent | null>(null);
  readonly isLoading = signal(true);
  readonly isEditing = signal(false);

  // Dialog state
  showCreateDialog = false;
  showRsvpDialog = false;

  // Form
  eventForm = this.getEmptyEventForm();

  // Options
  readonly eventTypes = EVENT_TYPES;
  readonly locations = LOCATIONS;
  readonly recurringOptions = RECURRING_OPTIONS;
  readonly weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  readonly timeOptions = this.generateTimeOptions();

  // Computed
  readonly currentMonthLabel = computed(() => {
    const date = this.currentMonth();
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  });

  readonly calendarDays = computed((): CalendarDay[] => {
    const date = this.currentMonth();
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: CalendarDay[] = [];
    const today = new Date();

    // Get starting day (Monday = 0)
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    // Previous month days
    const prevMonth = new Date(year, month, 0);
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: prevMonth.getDate() - i,
        events: [],
        isToday: false,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const isToday =
        d === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear();
      const dayEvents = this.events().filter((e) => {
        const eventDate = new Date(e.date);
        return (
          eventDate.getDate() === d &&
          eventDate.getMonth() === month &&
          eventDate.getFullYear() === year
        );
      });
      days.push({
        date: d,
        events: dayEvents,
        isToday,
        isCurrentMonth: true,
      });
    }

    // Fill remaining days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: i,
        events: [],
        isToday: false,
        isCurrentMonth: false,
      });
    }

    return days;
  });

  readonly upcomingEvents = computed(() =>
    this.events()
      .filter((e) => new Date(e.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, UI_LIMITS.UPCOMING_SESSIONS_COUNT),
  );

  readonly goingRsvps = computed(() =>
    this.rsvps().filter((r) => r.status === "going"),
  );
  readonly cantGoRsvps = computed(() =>
    this.rsvps().filter((r) => r.status === "cant-go"),
  );
  readonly pendingRsvps = computed(() =>
    this.rsvps().filter((r) => r.status === "pending"),
  );
  readonly totalRsvpCount = computed(() => this.rsvps().length);
  readonly goingCount = computed(() => this.goingRsvps().length);
  readonly cantGoCount = computed(() => this.cantGoRsvps().length);
  readonly pendingCount = computed(() => this.pendingRsvps().length);

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await firstValueFrom(
        this.api.get("/api/coach/calendar"),
      );
      if (response?.success && response.data) {
        this.events.set(response.data.events || []);
      }
    } catch (err) {
      this.logger.error("Failed to load calendar data", err);
      this.events.set([]);
      this.rsvps.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private getEmptyEventForm() {
    return {
      type: "practice" as
        | "practice"
        | "game"
        | "tournament"
        | "meeting"
        | "social",
      title: "",
      date: null as Date | null,
      startTime: "6:00 PM",
      endTime: "8:00 PM",
      isMultiDay: false,
      location: "",
      description: "",
      requireRsvp: true,
      sendReminder: true,
      recurring: "none",
      notifyPlayers: true,
      notifyParents: false,
    };
  }

  private generateTimeOptions(): { label: string; value: string }[] {
    const times: { label: string; value: string }[] = [];
    for (let h = 6; h <= 22; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
        const ampm = h >= 12 ? "PM" : "AM";
        const min = m.toString().padStart(2, "0");
        const label = `${hour}:${min} ${ampm}`;
        times.push({ label, value: label });
      }
    }
    return times;
  }

  // Navigation
  previousMonth(): void {
    const current = this.currentMonth();
    this.currentMonth.set(
      new Date(current.getFullYear(), current.getMonth() - 1, 1),
    );
  }

  nextMonth(): void {
    const current = this.currentMonth();
    this.currentMonth.set(
      new Date(current.getFullYear(), current.getMonth() + 1, 1),
    );
  }

  // Actions
  openCreateDialog(): void {
    this.isEditing.set(false);
    this.eventForm = this.getEmptyEventForm();
    this.showCreateDialog = true;
  }

  editEvent(event: TeamEvent): void {
    this.isEditing.set(true);
    this.eventForm = {
      ...this.getEmptyEventForm(),
      type: event.type,
      title: event.title,
      location: event.location,
      description: event.description || "",
      startTime: event.startTime,
      endTime: event.endTime,
    };
    this.showCreateDialog = true;
  }

  async saveEvent(): Promise<void> {
    if (!this.eventForm.title || !this.eventForm.date) {
      this.messageService.add({
        severity: "warn",
        summary: "Validation Error",
        detail: "Please fill in all required fields",
      });
      return;
    }

    try {
      const eventData = {
        type: this.eventForm.type,
        title: this.eventForm.title,
        date: this.eventForm.date.toISOString().split("T")[0],
        startTime: this.eventForm.startTime,
        endTime: this.eventForm.endTime,
        location: this.eventForm.location,
        description: this.eventForm.description,
        requireRsvp: this.eventForm.requireRsvp,
        rsvpDeadline: null, // TODO: Add RSVP deadline field
        recurring: this.eventForm.recurring,
        notifyPlayers: this.eventForm.notifyPlayers,
        notifyParents: this.eventForm.notifyParents,
      };

      if (this.isEditing() && this.selectedEvent()) {
        // Update existing event
        const selectedEventId = this.selectedEvent()?.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: any = await firstValueFrom(
          this.api.put(`/api/coach/calendar?id=${selectedEventId}`, eventData),
        );
        if (response?.success) {
          this.messageService.add({
            severity: "success",
            summary: "Event Updated",
            detail: `${this.eventForm.title} has been updated`,
          });
          await this.loadData();
        }
      } else {
        // Create new event
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: any = await firstValueFrom(
          this.api.post("/api/coach/calendar", eventData),
        );
        if (response?.success) {
          this.messageService.add({
            severity: "success",
            summary: "Event Created",
            detail: `${this.eventForm.title} has been created`,
          });
          await this.loadData();
        }
      }
      this.showCreateDialog = false;
    } catch (err) {
      this.logger.error("Failed to save event", err);
      this.messageService.add({
        severity: "error",
        summary: "Error",
        detail: "Failed to save event. Please try again.",
      });
    }
  }

  viewEvent(event: TeamEvent): void {
    this.selectedEvent.set(event);
    this.messageService.add({
      severity: "info",
      summary: "Event Details",
      detail: event.title,
    });
  }

  async viewRsvps(event: TeamEvent): Promise<void> {
    this.selectedEvent.set(event);
    // TODO: Load RSVPs from backend
    // For now, using empty array
    this.rsvps.set([]);
    this.showRsvpDialog = true;
  }

  setLineup(event: TeamEvent): void {
    this.messageService.add({
      severity: "info",
      summary: "Set Lineup",
      detail: `Opening lineup editor for ${event.title}`,
    });
  }

  async cancelEvent(event: TeamEvent): Promise<void> {
    if (!confirm(`Are you sure you want to cancel ${event.title}?`)) {
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await firstValueFrom(
        this.api.delete(`/api/coach/calendar?id=${event.id}`),
      );
      if (response?.success) {
        this.messageService.add({
          severity: "success",
          summary: "Event Cancelled",
          detail: `${event.title} has been cancelled`,
        });
        await this.loadData();
      }
    } catch (err) {
      this.logger.error("Failed to cancel event", err);
      this.messageService.add({
        severity: "error",
        summary: "Error",
        detail: "Failed to cancel event. Please try again.",
      });
    }
  }

  sendRsvpReminder(): void {
    this.messageService.add({
      severity: "success",
      summary: "Reminders Sent",
      detail: `Reminders sent to ${this.pendingCount()} players`,
    });
  }

  messageAll(group: string): void {
    this.messageService.add({
      severity: "info",
      summary: "Message",
      detail: `Opening message composer for ${group} group`,
    });
  }

  exportRsvpList(): void {
    this.messageService.add({
      severity: "success",
      summary: "Export Started",
      detail: "RSVP list is being exported",
    });
  }

  // Helpers
  getEventIcon(type: string): string {
    const icons: Record<string, string> = {
      practice: "🏋️",
      game: "🏈",
      tournament: "🏆",
      meeting: "📋",
      social: "🎉",
      debrief: "📊",
    };
    return icons[type] || "📅";
  }

  getPaymentPercent(event: TeamEvent): number {
    if (!event.paymentInfo || event.paymentInfo.total === 0) return 0;
    return Math.round(
      (event.paymentInfo.collected / event.paymentInfo.total) * 100,
    );
  }
}
