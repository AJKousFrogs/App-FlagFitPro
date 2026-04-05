import { CommonModule, DatePipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AvatarComponent } from "../../shared/components/avatar/avatar.component";
import { FormInputComponent } from "../../shared/components/form-input/form-input.component";
import { SelectComponent } from "../../shared/components/select/select.component";
import { TextareaComponent } from "../../shared/components/textarea/textarea.component";
import { TableModule } from "primeng/table";

import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { TOAST } from "../../core/constants/toast-messages.constants";
import {
  AttendanceRecord,
  AttendanceService,
  PlayerAttendanceStats,
  TeamEvent,
} from "../../core/services/attendance.service";
import { TeamMembershipService } from "../../core/services/team-membership.service";
import { ToastService } from "../../core/services/toast.service";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { getInitials } from "../../shared/utils/format.utils";
import {
  AppDialogComponent,
  DialogFooterComponent,
  DialogHeaderComponent,
} from "../../shared/components/ui-components";

type EventType =
  | "practice"
  | "game"
  | "meeting"
  | "film_session"
  | "conditioning"
  | "other";
type AttendanceStatus = "present" | "absent" | "late" | "excused";

@Component({
  selector: "app-attendance",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    StatusTagComponent,
    FormInputComponent,
    TextareaComponent,
    SelectComponent,
    AvatarComponent,
    MainLayoutComponent,
    PageHeaderComponent,
    DatePipe,
    ButtonComponent,
    EmptyStateComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
    TableModule
  ],
  template: `
    <app-main-layout>
      <div class="attendance-page bento-grid ui-page-shell">
        <!-- Header (Full Width) -->
        <div class="bento-item full-width no-padding header-bento">
          <app-page-header title="Attendance" subtitle="Practice and game participation — tracked." eyebrow="ATTENDANCE" icon="pi-calendar">
            <div class="header-actions">
              @if (isCoach()) {
                <app-button iconLeft="pi-plus" (clicked)="openCreateEventDialog()" size="sm">Create Event</app-button>
              }
            </div>
          </app-page-header>
        </div>

        <!-- Quick Stats (Full Width) -->
        <div class="bento-item full-width stats-bento">
          <div class="stats-inner-grid">
            <div class="stat-box">
              <span class="lbl">Upcoming Events</span>
              <span class="val">{{ upcomingEvents().length }}</span>
            </div>
            <div class="stat-box highlight">
              <span class="lbl">Team Attendance</span>
              <span class="val">{{ teamAttendanceRate() }}%</span>
            </div>
            <div class="stat-box">
              <span class="lbl">Players Tracked</span>
              <span class="val">{{ playerStats().length }}</span>
            </div>
          </div>
        </div>

        <!-- Upcoming Events (Span 1) -->
        <div class="bento-item events-bento">
          <div class="bento-header-row">
            <h3 class="bento-title"><i class="pi pi-calendar"></i> Schedule</h3>
            <app-select [options]="eventTypeOptions" (change)="onSelectedEventTypeChange($event)" placeholder="Type" styleClass="mini-select" />
          </div>
          
          <div class="events-list">
            @if (filteredEvents().length === 0) {
              <app-empty-state icon="pi-calendar-times" title="No events" message="Check back later" />
            } @else {
              @for (event of filteredEvents().slice(0, 5); track event.id) {
                <div class="event-item-bento" (click)="selectEvent(event)">
                  <div class="event-date">
                    <span class="m">{{ event.start_time | date: 'MMM' }}</span>
                    <span class="d">{{ event.start_time | date: 'dd' }}</span>
                  </div>
                  <div class="event-info">
                    <span class="title">{{ event.title }}</span>
                    <span class="time">{{ event.start_time | date: 'h:mm a' }}</span>
                  </div>
                  <i class="pi pi-chevron-right"></i>
                </div>
              }
            }
          </div>
        </div>

        <!-- Player Attendance List (Span 2) -->
        <div class="bento-item span-2 players-bento no-padding">
          <div class="bento-header-row p-5">
            <h3 class="bento-title"><i class="pi pi-users"></i> Attendance</h3>
          </div>

          <p-table [value]="playerStats().slice(0, 10)" class="attendance-table">
            <ng-template #header>
              <tr>
                <th>Player</th>
                <th>Rate</th>
                <th>Streak</th>
                <th>Status</th>
              </tr>
            </ng-template>
            <ng-template #body let-stat>
              <tr>
                <td>
                  <div class="player-cell">
                    <app-avatar [label]="getInitialsStr(stat.player_name || 'U')" shape="circle" />
                    <span>{{ stat.player_name || "Unknown" }}</span>
                  </div>
                </td>
                <td>{{ stat.attendance_rate }}%</td>
                <td
                  ><span class="streak-tag"
                    ><i class="pi pi-bolt" aria-hidden="true"></i>
                    {{ stat.current_streak }}</span
                  ></td>
                <td><app-status-tag [value]="stat.attendance_rate > 80 ? 'Reliable' : 'At Risk'" [severity]="stat.attendance_rate > 80 ? 'success' : 'warning'" size="sm" /></td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>

      <!-- Create Event Dialog -->
      <app-dialog
        [(visible)]="showCreateEventDialog"
        [modal]="true"
        dialogSize="md"
        [blockScroll]="true"
        [draggable]="false"
        ariaLabel="Create event"
      >
        <app-dialog-header
          icon="calendar-plus"
          title="Create Event"
          subtitle="Schedule a new practice, game, meeting, or conditioning session."
          (close)="showCreateEventDialog = false"
        />
        <div class="attendance-dialog-form">
          <div class="form-field">
            <app-form-input
              label="Title *"
              [value]="newEvent.title"
              (valueChange)="onNewEventTitleChange($event)"
              placeholder="e.g., Team Practice"
            />
          </div>

          <div class="form-field">
            <app-select
              label="Type *"
              [options]="eventTypeOptions"
              (change)="onNewEventTypeChange($event)"
              placeholder="Select type"
            />
          </div>

          <div class="form-row two-col">
            <div class="form-field">
              <label for="startTime">Start Time *</label>
              <input
                id="startTime"
                type="datetime-local"
                [value]="getNewEventDateTimeInputValue(newEvent.start_time)"
                (input)="onNewEventStartTimeInputEvent($event)"
                class="w-full"
              />
            </div>

            <div class="form-field">
              <label for="endTime">End Time</label>
              <input
                id="endTime"
                type="datetime-local"
                [value]="getNewEventDateTimeInputValue(newEvent.end_time)"
                (input)="onNewEventEndTimeInputEvent($event)"
                class="w-full"
              />
            </div>
          </div>

          <div class="form-field">
            <app-form-input
              label="Location"
              [value]="newEvent.location"
              (valueChange)="onNewEventLocationChange($event)"
              placeholder="e.g., Main Field"
            />
          </div>

          <div class="form-field">
            <app-textarea
              label="Description"
              [value]="newEvent.description"
              (valueChange)="onNewEventDescriptionChange($event)"
              [rows]="3"
              placeholder="Optional details..."
            />
          </div>

          <div class="form-field checkbox-field">
            <input
              type="checkbox"
              id="mandatory"
              [checked]="newEvent.is_mandatory"
              (change)="onNewEventMandatoryToggle($event)"
            />
            <label for="mandatory">Mandatory attendance</label>
          </div>
        </div>

        <app-dialog-footer
          dialogFooter
          cancelLabel="Cancel"
          primaryLabel="Create Event"
          primaryIcon="check"
          [disabled]="!canCreateEvent()"
          (cancel)="showCreateEventDialog = false"
          (primary)="createEvent()"
        />
      </app-dialog>
    </app-main-layout>
  `,
  styleUrl: "./attendance.component.scss",
})
export class AttendanceComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private teamMembershipService = inject(TeamMembershipService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  // Design system tokens
  // State
  events = signal<TeamEvent[]>([]);
  playerStats = signal<PlayerAttendanceStats[]>([]);
  currentPlayerStatsPage = signal(1);
  attendanceRecords = signal<AttendanceRecord[]>([]);
  selectedEvent = signal<TeamEvent | null>(null);
  selectedEventType: EventType | null = null;

  // Dialogs
  showCreateEventDialog = false;
  showAttendanceDialog = false;

  // New event form
  newEvent = {
    title: "",
    event_type: "practice" as EventType,
    start_time: null as Date | null,
    end_time: null as Date | null,
    location: "",
    description: "",
    is_mandatory: true,
  };

  // Options
  readonly playerStatsPageSize = 10;
  eventTypeOptions = [
    { label: "Practice", value: "practice" },
    { label: "Game", value: "game" },
    { label: "Meeting", value: "meeting" },
    { label: "Film Session", value: "film_session" },
    { label: "Conditioning", value: "conditioning" },
    { label: "Other", value: "other" },
  ];

  attendanceStatuses: Array<{
    value: AttendanceStatus;
    label: string;
    severity: "success" | "danger" | "warning" | "info";
  }> = [
    { value: "present", label: "Present", severity: "success" },
    { value: "late", label: "Late", severity: "warning" },
    { value: "excused", label: "Excused", severity: "info" },
    { value: "absent", label: "Absent", severity: "danger" },
  ];

  // Computed
  upcomingEvents = computed(() => {
    const now = new Date();
    return this.events().filter((e) => new Date(e.start_time) >= now);
  });

  filteredEvents = computed(() => {
    let events = this.upcomingEvents();
    if (this.selectedEventType) {
      events = events.filter((e) => e.event_type === this.selectedEventType);
    }
    return events.slice(0, 10);
  });

  teamAttendanceRate = computed(() => {
    const stats = this.playerStats();
    if (stats.length === 0) return 0;
    const totalRate = stats.reduce((sum, s) => sum + s.attendance_rate, 0);
    return Math.round(totalRate / stats.length);
  });
  playerStatsPageCount = computed(() =>
    Math.max(1, Math.ceil(this.playerStats().length / this.playerStatsPageSize)),
  );
  paginatedPlayerStats = computed(() => {
    const start = (this.currentPlayerStatsPage() - 1) * this.playerStatsPageSize;
    return this.playerStats().slice(start, start + this.playerStatsPageSize);
  });
  playerStatsPageRangeLabel = computed(() => {
    const total = this.playerStats().length;
    if (total === 0) {
      return "No players tracked";
    }

    const start = (this.currentPlayerStatsPage() - 1) * this.playerStatsPageSize + 1;
    const end = Math.min(total, start + this.playerStatsPageSize - 1);
    return `Showing ${start}-${end} of ${total} players`;
  });

  ngOnInit(): void {
    this.loadEvents();
    if (this.isCoach()) {
      this.loadPlayerStats();
    }
  }

  /**
   * Check if user is a coach - uses TeamMembershipService as single source of truth
   */
  isCoach(): boolean {
    return this.teamMembershipService.canManageRoster();
  }

  loadEvents(): void {
    const teamId = this.teamMembershipService.teamId();
    if (!teamId) return;

    this.attendanceService
      .getTeamEvents(teamId, { limit: 50 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (events) => this.events.set(events),
        error: (_err) => this.toastService.error(TOAST.ERROR.LOAD_FAILED),
      });
  }

  loadPlayerStats(): void {
    const teamId = this.teamMembershipService.teamId();
    if (!teamId) return;

    this.attendanceService
      .getTeamAttendanceStats(teamId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats) => {
          this.playerStats.set(stats);
          this.currentPlayerStatsPage.set(1);
        },
        error: (_err) => this.toastService.error(TOAST.ERROR.LOAD_FAILED),
      });
  }

  filterEvents(): void {
    // Computed signal handles filtering
  }

  onSelectedEventTypeChange(value: unknown): void {
    this.selectedEventType = (value as EventType | null | undefined) ?? null;
    this.filterEvents();
  }

  goToPreviousPlayerStatsPage(): void {
    this.currentPlayerStatsPage.update((page) => Math.max(1, page - 1));
  }

  goToNextPlayerStatsPage(): void {
    this.currentPlayerStatsPage.update((page) =>
      Math.min(this.playerStatsPageCount(), page + 1),
    );
  }

  selectEvent(event: TeamEvent): void {
    this.selectedEvent.set(event);
  }

  getEventIcon(type: string): string {
    const icons: Record<string, string> = {
      practice: "pi pi-users",
      game: "pi pi-flag",
      meeting: "pi pi-comments",
      film_session: "pi pi-video",
      conditioning: "pi pi-heart",
      other: "pi pi-calendar",
    };
    return icons[type] || "pi pi-calendar";
  }

  /**
   * Get initials from name using centralized utility
   */
  getInitialsStr(name: string): string {
    return getInitials(name);
  }

  openCreateEventDialog(): void {
    this.newEvent = {
      title: "",
      event_type: "practice",
      start_time: null,
      end_time: null,
      location: "",
      description: "",
      is_mandatory: true,
    };
    this.showCreateEventDialog = true;
  }

  onNewEventTitleChange(value: string): void {
    this.newEvent = { ...this.newEvent, title: value };
  }

  onNewEventTypeChange(value: unknown): void {
    this.newEvent = { ...this.newEvent, event_type: (value as EventType | null | undefined) ?? "practice" };
  }

  onNewEventStartTimeChange(value: Date | null): void {
    this.newEvent = { ...this.newEvent, start_time: value };
  }

  onNewEventStartTimeInput(value: string): void {
    this.onNewEventStartTimeChange(this.parseDateTimeInputValue(value));
  }

  onNewEventStartTimeInputEvent(event: Event): void {
    this.onNewEventStartTimeInput(this.readInputValue(event));
  }

  onNewEventEndTimeChange(value: Date | null): void {
    this.newEvent = { ...this.newEvent, end_time: value };
  }

  onNewEventEndTimeInput(value: string): void {
    this.onNewEventEndTimeChange(this.parseDateTimeInputValue(value));
  }

  onNewEventEndTimeInputEvent(event: Event): void {
    this.onNewEventEndTimeInput(this.readInputValue(event));
  }

  onNewEventLocationChange(value: string): void {
    this.newEvent = { ...this.newEvent, location: value };
  }

  onNewEventDescriptionChange(value: string): void {
    this.newEvent = { ...this.newEvent, description: value };
  }

  onNewEventMandatoryChange(value: boolean): void {
    this.newEvent = { ...this.newEvent, is_mandatory: value };
  }

  onNewEventMandatoryToggle(event: Event): void {
    this.onNewEventMandatoryChange(this.readChecked(event));
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

  getNewEventDateTimeInputValue(value: Date | null): string {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      return "";
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    const hours = String(value.getHours()).padStart(2, "0");
    const minutes = String(value.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  parseDateTimeInputValue(value: string): Date | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  canCreateEvent(): boolean {
    return !!(
      this.newEvent.title &&
      this.newEvent.event_type &&
      this.newEvent.start_time
    );
  }

  createEvent(): void {
    const teamId = this.teamMembershipService.teamId();
    if (!teamId || !this.canCreateEvent()) return;

    this.attendanceService
      .createEvent({
        team_id: teamId,
        title: this.newEvent.title,
        event_type: this.newEvent.event_type,
        start_time:
          this.newEvent.start_time?.toISOString() ?? new Date().toISOString(),
        end_time: this.newEvent.end_time?.toISOString(),
        location: this.newEvent.location || undefined,
        description: this.newEvent.description || undefined,
        is_mandatory: this.newEvent.is_mandatory,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => {
          if (event) {
            this.events.update((events) => [event, ...events]);
            this.toastService.success(TOAST.SUCCESS.EVENT_CREATED_SUCCESS);
            this.showCreateEventDialog = false;
          }
        },
        error: () => this.toastService.error(TOAST.ERROR.CREATE_FAILED),
      });
  }

  openAttendanceDialog(event: TeamEvent): void {
    this.selectedEvent.set(event);
    this.loadEventAttendance(event.id);
    this.showAttendanceDialog = true;
  }

  loadEventAttendance(eventId: string): void {
    this.attendanceService
      .getEventAttendance(eventId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (records) => this.attendanceRecords.set(records),
        error: () => this.toastService.error(TOAST.ERROR.LOAD_FAILED),
      });
  }

  updateAttendanceStatus(
    record: AttendanceRecord,
    status: AttendanceStatus,
  ): void {
    this.attendanceRecords.update((records) =>
      records.map((r) =>
        r.player_id === record.player_id ? { ...r, status } : r,
      ),
    );
  }

  saveAttendance(): void {
    const event = this.selectedEvent();
    if (!event) return;

    const records = this.attendanceRecords().map((r) => ({
      player_id: r.player_id,
      status: r.status,
    }));

    this.attendanceService
      .bulkRecordAttendance(event.id, records)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success(TOAST.SUCCESS.ATTENDANCE_SAVED_SUCCESS);
          this.showAttendanceDialog = false;
          this.loadPlayerStats();
        },
        error: () => this.toastService.error(TOAST.ERROR.SAVE_FAILED),
      });
  }

  quickCheckIn(event: TeamEvent): void {
    this.attendanceService
      .quickCheckIn(event.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (record) => {
          if (record) {
            this.toastService.success(TOAST.SUCCESS.CHECKIN_SUCCESS);
          }
        },
        error: () => this.toastService.error(TOAST.ERROR.CHECKIN_FAILED),
      });
  }
}
