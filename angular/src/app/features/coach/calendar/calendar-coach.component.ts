/**
 * Team Calendar Component (Coach View)
 *
 * Create and manage team events (practices, games, tournaments),
 * track RSVPs, handle logistics, and coordinate with team.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
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
import { DatePickerComponent } from "../../../shared/components/date-picker/date-picker.component";
import { FormInputComponent } from "../../../shared/components/form-input/form-input.component";
import { SelectComponent } from "../../../shared/components/select/select.component";
import { TextareaComponent } from "../../../shared/components/textarea/textarea.component";
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
    FormsModule,
    CardShellComponent,
    DatePickerComponent,
    FormInputComponent,
    SelectComponent,
    TextareaComponent,

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
  templateUrl: "./calendar-coach.component.html",
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

  onEventDateChange(value: Date | Date[] | null | undefined): void {
    const d = Array.isArray(value) ? value[0] ?? null : value ?? null;
    this.eventForm = { ...this.eventForm, date: d };
  }

  onEventTextInput(field: "title" | "description", value: string): void {
    this.onEventTextFieldChange(field, value);
  }

  onEventTextSelect(
    field: "startTime" | "endTime" | "location",
    value: unknown,
  ): void {
    let str = "";
    if (value == null) {
      str = "";
    } else if (typeof value === "object" && value !== null && "id" in value) {
      str = String((value as { id: string }).id);
    } else {
      str = String(value);
    }
    this.onEventTextFieldChange(field, str);
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
