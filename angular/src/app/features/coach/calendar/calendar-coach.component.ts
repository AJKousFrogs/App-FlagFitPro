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
import { Router } from "@angular/router";
import { ToastService } from "../../../core/services/toast.service";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { DatePicker } from "primeng/datepicker";
import { InputText } from "primeng/inputtext";

import { Select, type SelectChangeEvent } from "primeng/select";
import { Textarea } from "primeng/textarea";
import { firstValueFrom } from "rxjs";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { AppLoadingComponent } from "../../../shared/components/loading/loading.component";
import { PageErrorStateComponent } from "../../../shared/components/page-error-state/page-error-state.component";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";

import { UI_LIMITS } from "../../../core/constants/app.constants";
import { ApiService, API_ENDPOINTS } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import {
  extractApiPayload,
  isSuccessfulApiResponse,
} from "../../../core/utils/api-response-mapper";
import { DialogService } from "../../../core/ui/dialog.service";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import {
  AppDialogComponent,
  DialogFooterComponent,
  DialogHeaderComponent,
} from "../../../shared/components/ui-components";

// ===== Interfaces =====
interface TeamEvent {
  id: string;
  title: string;
  type: EventType;
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

interface EventForm {
  type: EventType;
  title: string;
  date: Date | null;
  startTime: string;
  endTime: string;
  isMultiDay: boolean;
  location: string;
  description: string;
  requireRsvp: boolean;
  sendReminder: boolean;
  recurring: string;
  notifyPlayers: boolean;
  notifyParents: boolean;
}

type EventType =
  | "practice"
  | "game"
  | "tournament"
  | "meeting"
  | "social"
  | "debrief";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CardShellComponent,
    DatePicker,
    InputText,
    Select,
    Textarea,

    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    EmptyStateComponent,
    AppLoadingComponent,
    PageErrorStateComponent,
    StatusTagComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
  ],
  template: `
    <app-main-layout>
<div class="calendar-coach-page ui-page-shell ui-page-shell--wide ui-page-stack">
        <app-page-header
          title="Team Calendar"
          subtitle="Manage team schedule and RSVPs"
          icon="pi-calendar"
        >
          <app-button iconLeft="pi-plus" (clicked)="openCreateDialog()"
            >Create Event</app-button
          >
        </app-page-header>

        @if (isLoading()) {
          <app-loading message="Loading calendar..." />
        } @else if (loadError()) {
          <app-page-error-state
            title="Unable to load calendar"
            [message]="loadError()!"
            (retry)="retryLoadData()"
          />
        } @else {
        <!-- Calendar View -->
        <app-card-shell class="calendar-card">
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
                            <i [class]="'pi ' + getEventIcon(event.type)" aria-hidden="true"></i>
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
                ><span class="legend-icon"><i class="pi pi-bolt" aria-hidden="true"></i></span> Practice</span
              >
              <span class="legend-item"
                ><span class="legend-icon"><i class="pi pi-flag" aria-hidden="true"></i></span> Game</span
              >
              <span class="legend-item"
                ><span class="legend-icon"><i class="pi pi-trophy" aria-hidden="true"></i></span> Tournament</span
              >
              <span class="legend-item"
                ><span class="legend-icon"><i class="pi pi-list" aria-hidden="true"></i></span> Meeting</span
              >
              <span class="legend-item"
                ><span class="legend-icon"><i class="pi pi-circle-fill" aria-hidden="true"></i></span> Today</span
              >
            </div>
          }
        </app-card-shell>

        <!-- Upcoming Events -->
        <div class="section">
          <h3 class="section-title">Upcoming Events</h3>
          <div class="events-list">
            @for (event of upcomingEvents(); track event.id) {
              <div class="event-card" [class]="'type-' + event.type">
                <div class="event-header">
                  <div class="event-title">
                    <span class="event-icon"><i [class]="'pi ' + getEventIcon(event.type)" aria-hidden="true"></i></span>
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
                    {{ event.location }} • {{ event.startTime }} -
                    {{ event.endTime }}
                  </p>
                </div>

                <div class="event-rsvp">
                  <span class="rsvp-item going"
                    >{{ event.rsvpSummary.going }} going</span
                  >
                  <span class="rsvp-item cant-go"
                    >{{ event.rsvpSummary.cantGo }} can't</span
                  >
                  <span class="rsvp-item pending"
                    >{{ event.rsvpSummary.pending }} pending</span
                  >
                </div>

                @if (event.rsvpDeadline) {
                  <div class="event-deadline">
                    <span>RSVP Deadline: {{ event.rsvpDeadline }}</span>
                    @if (event.rsvpSummary.pending > 0) {
                      <app-status-tag
                        value="Pending RSVPs"
                        severity="warning"
                        size="sm"
                      />
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
                    (clicked)="viewEvent(event)"
                    >View Details</app-button
                  >
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
              <app-empty-state
                icon="pi-calendar"
                heading="No upcoming events"
                actionLabel="Create Event"
                actionIcon="pi-plus"
                [actionHandler]="openCreateDialogHandler"
              />
            }
          </div>
        </div>
        }
      </div>

      <!-- Create Event Dialog -->
      <app-dialog
        [(visible)]="showCreateDialog"
        [modal]="true"
        dialogSize="xl"
        [blockScroll]="true"
        [draggable]="false"
        [ariaLabel]="isEditing() ? 'Edit event' : 'Create event'"
      >
        <app-dialog-header
          icon="calendar-plus"
          [title]="isEditing() ? 'Edit Event' : 'Create Event'"
          subtitle="Create practices, games, tournaments, and team events with RSVP settings."
          (close)="closeCreateDialog()"
        />
        <div class="event-form">
          <div class="form-field">
            <label>Event Type</label>
            <div class="radio-group">
              @for (type of eventTypes; track type.value) {
                <div class="radio-option">
                  <input
                    type="radio"
                    name="eventType"
                    [value]="type.value"
                    [id]="'type-' + type.value"
                    [checked]="eventForm.type === type.value"
                    (change)="onEventTypeOptionChange(type.value)"
                  />
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
              [value]="eventForm.title"
              (input)="onEventTextInput('title', $event)"
              placeholder="Tuesday Practice"
            />
          </div>

          <div class="form-row">
            <div class="form-field">
              <label>Date</label>
              <p-datepicker
                (onSelect)="onEventDateChange($event)"
                [showIcon]="true"
                class="w-full"
              ></p-datepicker>
            </div>
            <div class="form-field">
              <label>Start Time</label>
              <p-select
                [options]="timeOptions"
                (onChange)="onEventTextSelect('startTime', $event)"
                optionLabel="label"
                optionValue="value"
                placeholder="Select time"
                class="w-full"
              ></p-select>
            </div>
            <div class="form-field">
              <label>End Time</label>
              <p-select
                [options]="timeOptions"
                (onChange)="onEventTextSelect('endTime', $event)"
                optionLabel="label"
                optionValue="value"
                placeholder="Select time"
                class="w-full"
              ></p-select>
            </div>
          </div>

          <div class="checkbox-option">
            <input
              id="multiDay"
              type="checkbox"
              [checked]="eventForm.isMultiDay"
              (change)="onEventToggle('isMultiDay', $event)"
            />
            <label for="multiDay">Multi-day event (e.g., tournament)</label>
          </div>

          <div class="form-field">
            <label>Location</label>
            <p-select
              [options]="locations"
              (onChange)="onEventTextSelect('location', $event)"
              optionLabel="name"
              optionValue="id"
              placeholder="Select location"
              class="w-full"
            ></p-select>
          </div>

          <div class="form-field">
            <label>Description / Notes</label>
            <textarea
              pTextarea
              [value]="eventForm.description"
              (input)="onEventTextInput('description', $event)"
              rows="3"
              placeholder="Regular practice. Focus on red zone offense..."
            ></textarea>
          </div>

          <div class="form-section">
            <h5>RSVP Settings</h5>
            <div class="checkbox-option">
              <input
                id="requireRsvp"
                type="checkbox"
                [checked]="eventForm.requireRsvp"
                (change)="onEventToggle('requireRsvp', $event)"
              />
              <label for="requireRsvp">Require RSVP</label>
            </div>
            <div class="checkbox-option">
              <input
                id="sendReminder"
                type="checkbox"
                [checked]="eventForm.sendReminder"
                (change)="onEventToggle('sendReminder', $event)"
              />
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
                  <input
                    type="radio"
                    name="recurring"
                    [value]="opt.value"
                    [id]="'rec-' + opt.value"
                    [checked]="eventForm.recurring === opt.value"
                    (change)="onEventRecurringChange(opt.value)"
                  />
                  <label [for]="'rec-' + opt.value">{{ opt.label }}</label>
                </div>
              }
            </div>
          </div>

          <div class="form-section">
            <h5>Notify</h5>
            <div class="checkbox-option">
              <input
                id="notifyPlayers"
                type="checkbox"
                [checked]="eventForm.notifyPlayers"
                (change)="onEventToggle('notifyPlayers', $event)"
              />
              <label for="notifyPlayers"
                >Send notification to all players</label
              >
            </div>
            <div class="checkbox-option">
              <input
                id="notifyParents"
                type="checkbox"
                [checked]="eventForm.notifyParents"
                (change)="onEventToggle('notifyParents', $event)"
              />
              <label for="notifyParents">Include parents/guardians</label>
            </div>
          </div>
        </div>

        <app-dialog-footer
          dialogFooter
          cancelLabel="Cancel"
          primaryLabel="Save Event"
          primaryIcon="check"
          (cancel)="closeCreateDialog()"
          (primary)="saveEvent()"
        />
      </app-dialog>

      <!-- RSVP Management Dialog -->
      <app-dialog
        [(visible)]="showRsvpDialog"
        [modal]="true"
        dialogSize="xl"
        [blockScroll]="true"
        [draggable]="false"
        [ariaLabel]="'RSVP management for ' + (selectedEvent()?.title || 'event')"
      >
        <app-dialog-header
          icon="users"
          [title]="'RSVP Management: ' + (selectedEvent()?.title || '')"
          subtitle="Review who is going, who declined, and who still needs a reminder."
          (close)="closeRsvpDialog()"
        />
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
              <app-button (clicked)="closeRsvpDialog()">Close</app-button>
            </div>
          </div>
        }
      </app-dialog>

      <!-- Event Details Dialog -->
      <app-dialog
        [(visible)]="showEventDetailDialog"
        [modal]="true"
        styleClass="coach-calendar-event-detail-dialog"
        [blockScroll]="true"
        [draggable]="false"
        [ariaLabel]="'Event details for ' + (selectedEvent()?.title || 'event')"
      >
        <app-dialog-header
          icon="calendar"
          [title]="selectedEvent()?.title || 'Event Details'"
          subtitle="Review event logistics, RSVP summary, and next actions."
          (close)="closeEventDetailDialog()"
        />
        @if (selectedEvent()) {
          <div class="event-detail-content">
            <div class="event-detail-grid">
              <div class="event-detail-row">
                <span class="event-detail-label">Type</span>
                <span class="event-detail-value">{{
                  selectedEvent()?.type | titlecase
                }}</span>
              </div>
              <div class="event-detail-row">
                <span class="event-detail-label">Date</span>
                <span class="event-detail-value">{{ selectedEvent()?.date }}</span>
              </div>
              <div class="event-detail-row">
                <span class="event-detail-label">Time</span>
                <span class="event-detail-value"
                  >{{ selectedEvent()?.startTime }} -
                  {{ selectedEvent()?.endTime }}</span
                >
              </div>
              <div class="event-detail-row">
                <span class="event-detail-label">Location</span>
                <span class="event-detail-value">{{
                  selectedEvent()?.location
                }}</span>
              </div>
              @if (selectedEvent()?.description) {
                <div class="event-detail-row event-detail-row--stacked">
                  <span class="event-detail-label">Description</span>
                  <span class="event-detail-value">{{
                    selectedEvent()?.description
                  }}</span>
                </div>
              }
            </div>

            <div class="event-detail-summary">
              <h4>RSVP Summary</h4>
              <div class="event-rsvp">
                <span class="rsvp-item going"
                  >{{ selectedEvent()?.rsvpSummary?.going || 0 }} going</span
                >
                <span class="rsvp-item cant-go"
                  >{{ selectedEvent()?.rsvpSummary?.cantGo || 0 }} can't</span
                >
                <span class="rsvp-item pending"
                  >{{ selectedEvent()?.rsvpSummary?.pending || 0 }} pending</span
                >
              </div>
              @if (selectedEvent()?.rsvpDeadline) {
                <p class="event-detail-note">
                  RSVP deadline: {{ selectedEvent()?.rsvpDeadline }}
                </p>
              }
              @if (selectedEvent()?.ridesNeeded || selectedEvent()?.ridesOffered) {
                <p class="event-detail-note">
                  Ride coordination:
                  {{ selectedEvent()?.ridesNeeded || 0 }} need rides,
                  {{ selectedEvent()?.ridesOffered || 0 }} can offer rides
                </p>
              }
              @if (selectedEvent()?.paymentInfo) {
                <p class="event-detail-note">
                  Payment progress:
                  \${{ selectedEvent()?.paymentInfo?.collected }} / \${{
                    selectedEvent()?.paymentInfo?.total
                  }}
                </p>
              }
            </div>

            <div class="event-detail-actions">
              <app-button
                variant="secondary"
                (clicked)="openRsvpDialogFromDetails()"
                >View RSVPs</app-button
              >
              <app-button
                variant="secondary"
                (clicked)="editSelectedEvent()"
                >Edit Event</app-button
              >
              <app-button
                variant="text"
                (clicked)="closeEventDetailDialog()"
                >Close</app-button
              >
            </div>
          </div>
        }
      </app-dialog>
    </app-main-layout>
  `,
  styleUrl: "./calendar-coach.component.scss",
})
export class CalendarCoachComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly dialogService = inject(DialogService);

  // Constants exposed to template
  protected readonly UI_LIMITS = UI_LIMITS;

  // State
  readonly events = signal<TeamEvent[]>([]);
  readonly rsvps = signal<EventRsvp[]>([]);
  readonly currentMonth = signal(new Date());
  readonly viewMode = signal<"month" | "list" | "agenda">("month");
  readonly selectedEvent = signal<TeamEvent | null>(null);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly isEditing = signal(false);

  // Dialog state
  showCreateDialog = false;
  showRsvpDialog = false;
  showEventDetailDialog = false;

  // Form
  eventForm: EventForm = this.getEmptyEventForm();

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
    this.loadError.set(null);

    try {
      const response = await firstValueFrom(
        this.api.get<{ events?: TeamEvent[] }>(API_ENDPOINTS.coachCalendar.list),
      );
      const payload = extractApiPayload<{ events?: TeamEvent[] }>(response);
      this.events.set(payload?.events ?? []);
    } catch (err) {
      this.logger.error("Failed to load calendar data", err);
      this.events.set([]);
      this.rsvps.set([]);
      this.loadError.set(
        "We couldn't load the team calendar. Please try again.",
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  retryLoadData(): void {
    void this.loadData();
  }

  private getEmptyEventForm(): EventForm {
    return {
      type: "practice",
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

  onEventTypeChange(value: EventForm["type"] | null | undefined): void {
    this.eventForm = { ...this.eventForm, type: value ?? "practice" };
  }

  onEventTypeOptionChange(value: string): void {
    this.onEventTypeChange(value as EventForm["type"]);
  }

  onEventDateChange(value: Date | null | undefined): void {
    this.eventForm = { ...this.eventForm, date: value ?? null };
  }

  onEventTextInput(
    field: "title" | "description",
    event: Event,
  ): void {
    this.onEventTextFieldChange(field, this.readInputValue(event));
  }

  onEventTextSelect(
    field: "startTime" | "endTime" | "location",
    event: SelectChangeEvent,
  ): void {
    this.onEventTextFieldChange(
      field,
      typeof event.value === "string" ? event.value : "",
    );
  }

  onEventTextFieldChange(
    field: "title" | "startTime" | "endTime" | "location" | "description",
    value: string | null | undefined,
  ): void {
    this.eventForm = { ...this.eventForm, [field]: value ?? "" };
  }

  onEventToggle(
    field:
      | "isMultiDay"
      | "requireRsvp"
      | "sendReminder"
      | "notifyPlayers"
      | "notifyParents",
    event: Event,
  ): void {
    this.onEventToggleChange(field, this.readChecked(event));
  }

  onEventToggleChange(
    field:
      | "isMultiDay"
      | "requireRsvp"
      | "sendReminder"
      | "notifyPlayers"
      | "notifyParents",
    value: boolean | null | undefined,
  ): void {
    this.eventForm = { ...this.eventForm, [field]: value ?? false };
  }

  onEventRecurringChange(value: string | null | undefined): void {
    this.eventForm = { ...this.eventForm, recurring: value ?? "none" };
  }

  private readInputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement | null)
      ?.value ?? "";
  }

  private readChecked(event: Event): boolean {
    return (event.target as HTMLInputElement | null)?.checked ?? false;
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
  closeCreateDialog(): void {
    this.showCreateDialog = false;
    this.isEditing.set(false);
    this.eventForm = this.getEmptyEventForm();
  }

  closeRsvpDialog(): void {
    this.showRsvpDialog = false;
  }

  closeEventDetailDialog(): void {
    this.showEventDetailDialog = false;
  }

  private refreshCalendarData(): Promise<void> {
    return this.loadData();
  }

  private showEventDetail(event: TeamEvent): void {
    this.closeEventDetailDialog();
    this.selectedEvent.set(event);
    this.showEventDetailDialog = true;
  }

  private showRsvpManagement(event: TeamEvent): void {
    this.closeEventDetailDialog();
    this.closeRsvpDialog();
    this.selectedEvent.set(event);
    this.rsvps.set([]);
    this.showRsvpDialog = true;
  }

  openCreateDialog(): void {
    this.closeCreateDialog();
    this.showCreateDialog = true;
  }

  readonly openCreateDialogHandler = (): void => this.openCreateDialog();

  editEvent(event: TeamEvent): void {
    this.closeCreateDialog();
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
      this.toastService.warn(
        "Please fill in all required fields",
        "Validation Error",
      );
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
        rsvpDeadline: null, // RSVP deadline - extend form when backend supports it
        recurring: this.eventForm.recurring,
        notifyPlayers: this.eventForm.notifyPlayers,
        notifyParents: this.eventForm.notifyParents,
      };

      if (this.isEditing() && this.selectedEvent()) {
        // Update existing event
        const selectedEventId = this.selectedEvent()?.id;
        const response = await firstValueFrom(
          this.api.put(API_ENDPOINTS.coachCalendar.update(selectedEventId || ""), eventData),
        );
        if (isSuccessfulApiResponse(response)) {
          this.toastService.success(
            `${this.eventForm.title} has been updated`,
            "Event Updated",
          );
          await this.refreshCalendarData();
        }
      } else {
        // Create new event
        const response = await firstValueFrom(
          this.api.post(API_ENDPOINTS.coachCalendar.create, eventData),
        );
        if (isSuccessfulApiResponse(response)) {
          this.toastService.success(
            `${this.eventForm.title} has been created`,
            "Event Created",
          );
          await this.refreshCalendarData();
        }
      }
      this.closeCreateDialog();
    } catch (err) {
      this.logger.error("Failed to save event", err);
      this.toastService.error("Failed to save event. Please try again.");
    }
  }

  viewEvent(event: TeamEvent): void {
    this.showEventDetail(event);
  }

  async viewRsvps(event: TeamEvent): Promise<void> {
    this.showRsvpManagement(event);
  }

  openRsvpDialogFromDetails(): void {
    const event = this.selectedEvent();
    if (!event) {
      return;
    }
    void this.viewRsvps(event);
  }

  editSelectedEvent(): void {
    const event = this.selectedEvent();
    if (!event) {
      return;
    }
    this.closeEventDetailDialog();
    this.editEvent(event);
  }

  setLineup(event: TeamEvent): void {
    this.closeEventDetailDialog();
    void this.router.navigate(["/coach/tournaments"], {
      queryParams: { event: event.id, focus: "lineup" },
    });
  }

  async cancelEvent(event: TeamEvent): Promise<void> {
    const confirmed = await this.dialogService.confirm(
      `Are you sure you want to cancel ${event.title}?`,
      "Cancel Event",
    );
    if (!confirmed) {
      return;
    }

    try {
      const response = await firstValueFrom(
        this.api.delete(API_ENDPOINTS.coachCalendar.delete(event.id)),
      );
      if (isSuccessfulApiResponse(response)) {
        this.toastService.success(
          `${event.title} has been cancelled`,
          "Event Cancelled",
        );
        await this.refreshCalendarData();
      }
    } catch (err) {
      this.logger.error("Failed to cancel event", err);
      this.toastService.error("Failed to cancel event. Please try again.");
    }
  }

  sendRsvpReminder(): void {
    const event = this.selectedEvent();
    const pendingCount = this.pendingCount();
    if (!event || pendingCount === 0) {
      this.toastService.info("No pending RSVPs need a reminder.");
      return;
    }

    const draft = `Reminder: ${pendingCount} RSVP responses are still pending for ${event.title} on ${event.date}. Please update your availability.`;
    this.closeRsvpDialog();
    void this.router.navigate(["/team-chat"], {
      queryParams: {
        source: "calendar",
        event: event.id,
        group: "pending",
        draft,
      },
    });
    this.toastService.success(
      "Reminder draft opened in team chat.",
      "Reminder Draft",
    );
  }

  messageAll(group: string): void {
    const eventId = this.selectedEvent()?.id;
    this.closeRsvpDialog();
    void this.router.navigate(["/team-chat"], {
      queryParams: {
        source: "calendar",
        event: eventId || null,
        group,
      },
    });
  }

  exportRsvpList(): void {
    const event = this.selectedEvent();
    if (!event) {
      this.toastService.warn("Open an event before exporting RSVPs.");
      return;
    }

    const rows = [
      ["Player", "Status", "Arrival Time", "Needs Ride", "Offers Ride", "Notes"],
      ...this.rsvps().map((rsvp) => [
        rsvp.playerName,
        rsvp.status,
        rsvp.arrivalTime || "",
        rsvp.needsRide ? "yes" : "no",
        rsvp.offersRide ? "yes" : "no",
        rsvp.notes || "",
      ]),
    ];
    const content = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${event.title.toLowerCase().replace(/\s+/g, "-")}-rsvps.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    this.toastService.success("RSVP export downloaded.", "Export Ready");
  }

  // Helpers
  getEventIcon(type: string): string {
    const icons: Record<string, string> = {
      practice: "pi-bolt",
      game: "pi-flag",
      tournament: "pi-trophy",
      meeting: "pi-list",
      social: "pi-star",
      debrief: "pi-chart-bar",
    };
    return icons[type] || "pi-calendar";
  }

  getPaymentPercent(event: TeamEvent): number {
    if (!event.paymentInfo || event.paymentInfo.total === 0) return 0;
    return Math.round(
      (event.paymentInfo.collected / event.paymentInfo.total) * 100,
    );
  }
}
