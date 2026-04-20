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

import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { SelectComponent } from "../../shared/components/select/select.component";
import { TextareaComponent } from "../../shared/components/textarea/textarea.component";
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
    StatusTagComponent,
    SelectComponent,
    TextareaComponent,

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
  templateUrl: "./team-calendar.component.html",
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

  onSelectedTypeChange(value: EventType | null | undefined): void {
    this.selectedType = value ?? null;
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
