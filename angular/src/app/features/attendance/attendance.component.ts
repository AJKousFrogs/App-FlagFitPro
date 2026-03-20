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
import { Avatar } from "primeng/avatar";
import { InputText } from "primeng/inputtext";
import { ProgressBar } from "primeng/progressbar";
import { Select } from "primeng/select";
import { Textarea } from "primeng/textarea";

import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { TOAST } from "../../core/constants/toast-messages.constants";
import {
  AttendanceRecord,
  AttendanceService,
  PlayerAttendanceStats,
  TeamEvent,
} from "../../core/services/attendance.service";
import { AuthService } from "../../core/services/auth.service";
import { TeamMembershipService } from "../../core/services/team-membership.service";
import { ToastService } from "../../core/services/toast.service";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
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
    InputText,
    Textarea,
    Select,
    ProgressBar,
    Avatar,
    MainLayoutComponent,
    PageHeaderComponent,
    DatePipe,
    ButtonComponent,
    CardShellComponent,
    IconButtonComponent,
    EmptyStateComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
  ],
  template: `
    <app-main-layout>
      <div class="attendance-page ui-page-shell ui-page-shell--wide ui-page-stack">
        <app-page-header
          title="Practice Attendance"
          subtitle="Track and manage team attendance"
        >
          <div class="header-actions">
            @if (isCoach()) {
              <app-button iconLeft="pi-plus" (clicked)="openCreateEventDialog()"
                >Create Event</app-button
              >
            }
          </div>
        </app-page-header>

        <div class="attendance-content ui-page-stack">
          <!-- Stats Overview -->
          <div class="stats-grid">
            <app-card-shell class="stat-card">
              <div class="stat-content">
                <i class="pi pi-calendar stat-icon"></i>
                <div class="stat-info stat-block__content">
                  <span class="stat-block__value">{{
                    upcomingEvents().length
                  }}</span>
                  <span class="stat-block__label">Upcoming Events</span>
                </div>
              </div>
            </app-card-shell>

            <app-card-shell class="stat-card">
              <div class="stat-content">
                <i class="pi pi-check-circle stat-icon success"></i>
                <div class="stat-info stat-block__content">
                  <span class="stat-block__value"
                    >{{ teamAttendanceRate() }}%</span
                  >
                  <span class="stat-block__label">Team Attendance Rate</span>
                </div>
              </div>
            </app-card-shell>

            <app-card-shell class="stat-card">
              <div class="stat-content">
                <i class="pi pi-users stat-icon"></i>
                <div class="stat-info stat-block__content">
                  <span class="stat-block__value">{{
                    playerStats().length
                  }}</span>
                  <span class="stat-block__label">Players Tracked</span>
                </div>
              </div>
            </app-card-shell>
          </div>

          <!-- Upcoming Events -->
          <app-card-shell class="events-card" title="Upcoming Events">
            <div header-actions class="filter-actions">
              <p-select
                [options]="eventTypeOptions"
                (onChange)="onSelectedEventTypeChange($event.value)"
                placeholder="All Types"
                [showClear]="true"
                class="attendance-filter-select"
              ></p-select>
            </div>

            @if (filteredEvents().length === 0) {
              <app-empty-state
                icon="pi-calendar-times"
                heading="No upcoming events scheduled"
                description="Events will appear here when practices, games, or meetings are scheduled."
              />
            } @else {
              <div class="events-list">
                @for (event of filteredEvents(); track event.id) {
                  <div class="event-item" (click)="selectEvent(event)">
                    <div class="event-icon">
                      <i [class]="getEventIcon(event.event_type)"></i>
                    </div>
                    <div class="event-details">
                      <div class="event-title">{{ event.title }}</div>
                      <div class="event-meta">
                        <span>
                          <i class="pi pi-clock"></i>
                          {{ event.start_time | date: "MMM d, h:mm a" }}
                        </span>
                        @if (event.location) {
                          <span>
                            <i class="pi pi-map-marker"></i>
                            {{ event.location }}
                          </span>
                        }
                      </div>
                    </div>
                    <div class="event-actions">
                      <app-status-tag
                        [value]="event.is_mandatory ? 'Mandatory' : 'Optional'"
                        [severity]="event.is_mandatory ? 'danger' : 'info'"
                        size="sm"
                      />
                      @if (isCoach()) {
                        <app-icon-button
                          icon="pi-users"
                          variant="text"
                          (clicked)="
                            openAttendanceDialog(event);
                            $event.stopPropagation()
                          "
                          ariaLabel="Manage event attendance"
                          tooltip="Attendance"
                        />
                      } @else {
                        <app-icon-button
                          icon="pi-check"
                          variant="text"
                          (clicked)="
                            quickCheckIn(event); $event.stopPropagation()
                          "
                          ariaLabel="Quick check-in"
                          tooltip="Check in"
                        />
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </app-card-shell>

          <!-- Player Attendance Stats (Coach View) -->
          @if (isCoach()) {
            <app-card-shell class="stats-card" title="Player Attendance Statistics">
              <div class="attendance-stats-table-wrapper">
                <table class="attendance-stats-table">
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Attended</th>
                      <th>Missed</th>
                      <th>Excused</th>
                      <th>Late</th>
                      <th>Rate</th>
                      <th>Streak</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (stat of paginatedPlayerStats(); track stat.player_id) {
                      <tr>
                        <td>
                          <div class="player-cell">
                            <p-avatar
                              [label]="getInitialsStr(stat.player_name || 'U')"
                              shape="circle"
                              size="normal"
                            ></p-avatar>
                            <span>{{ stat.player_name || "Unknown" }}</span>
                          </div>
                        </td>
                        <td>
                          <span class="stat-badge success">{{
                            stat.events_attended
                          }}</span>
                        </td>
                        <td>
                          <span class="stat-badge danger">{{
                            stat.events_missed
                          }}</span>
                        </td>
                        <td>
                          <span class="stat-badge info">{{
                            stat.events_excused
                          }}</span>
                        </td>
                        <td>
                          <span class="stat-badge warning">{{
                            stat.events_late
                          }}</span>
                        </td>
                        <td>
                          <div class="rate-cell">
                            <p-progressBar
                              [value]="stat.attendance_rate"
                              [showValue]="false"
                              class="rate-bar"
                            ></p-progressBar>
                            <span>{{ stat.attendance_rate }}%</span>
                          </div>
                        </td>
                        <td>
                          <span
                            class="streak-badge"
                            [class.active]="stat.current_streak > 0"
                          >
                            🔥 {{ stat.current_streak }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              @if (playerStatsPageCount() > 1) {
                <div class="attendance-stats-pagination">
                  <span class="attendance-stats-page-label">
                    {{ playerStatsPageRangeLabel() }}
                  </span>

                  <div class="attendance-stats-page-actions">
                    <app-button
                      variant="text"
                      size="sm"
                      iconLeft="pi-chevron-left"
                      [disabled]="currentPlayerStatsPage() === 1"
                      (clicked)="goToPreviousPlayerStatsPage()"
                      >Previous</app-button
                    >
                    <app-button
                      variant="text"
                      size="sm"
                      iconLeft="pi-chevron-right"
                      [disabled]="currentPlayerStatsPage() === playerStatsPageCount()"
                      (clicked)="goToNextPlayerStatsPage()"
                      >Next</app-button
                    >
                  </div>
                </div>
              }
            </app-card-shell>
          }
        </div>

        <!-- Create Event Dialog -->
        <app-dialog
          [(visible)]="showCreateEventDialog"
          [modal]="true"
          styleClass="attendance-create-dialog"
          [blockScroll]="true"
          [draggable]="false"
          [breakpoints]="{ '960px': '92vw', '640px': '96vw' }"
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
              <label for="eventTitle">Title *</label>
              <input
                id="eventTitle"
                type="text"
                pInputText
                [value]="newEvent.title"
                (input)="onNewEventTitleChange(getInputValue($event))"
                placeholder="e.g., Team Practice"
              />
            </div>

            <div class="form-field">
              <label for="eventType">Type *</label>
              <p-select
                id="eventType"
                [options]="eventTypeOptions"
                (onChange)="onNewEventTypeChange($event.value)"
                placeholder="Select type"
                class="w-full"
              ></p-select>
            </div>

            <div class="form-row two-col">
              <div class="form-field">
                <label for="startTime">Start Time *</label>
                <input
                  id="startTime"
                  type="datetime-local"
                  [value]="getNewEventDateTimeInputValue(newEvent.start_time)"
                  (input)="onNewEventStartTimeInput(getInputValue($event))"
                  class="w-full"
                />
              </div>

              <div class="form-field">
                <label for="endTime">End Time</label>
                <input
                  id="endTime"
                  type="datetime-local"
                  [value]="getNewEventDateTimeInputValue(newEvent.end_time)"
                  (input)="onNewEventEndTimeInput(getInputValue($event))"
                  class="w-full"
                />
              </div>
            </div>

            <div class="form-field">
              <label for="location">Location</label>
              <input
                id="location"
                type="text"
                pInputText
                [value]="newEvent.location"
                (input)="onNewEventLocationChange(getInputValue($event))"
                placeholder="e.g., Main Field"
              />
            </div>

            <div class="form-field">
              <label for="description">Description</label>
              <textarea
                id="description"
                pInputTextarea
                [value]="newEvent.description"
                (input)="onNewEventDescriptionChange(getInputValue($event))"
                rows="3"
                placeholder="Optional details..."
              ></textarea>
            </div>

            <div class="form-field checkbox-field">
              <input
                type="checkbox"
                id="mandatory"
                [checked]="newEvent.is_mandatory"
                (change)="onNewEventMandatoryChange(isChecked($event))"
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

        <!-- Take Attendance Dialog -->
        <app-dialog
          [(visible)]="showAttendanceDialog"
          [modal]="true"
          styleClass="attendance-take-dialog"
          [blockScroll]="true"
          [draggable]="false"
          [breakpoints]="{ '960px': '92vw', '640px': '96vw' }"
          ariaLabel="Take attendance"
        >
          <app-dialog-header
            icon="users"
            title="Take Attendance"
            subtitle="Mark each player present, late, excused, or absent for this event."
            (close)="showAttendanceDialog = false"
          />
          @if (selectedEvent()) {
            <div class="attendance-dialog">
              <div class="event-summary">
                <h4>{{ selectedEvent()!.title }}</h4>
                <p>
                  {{
                    selectedEvent()!.start_time
                      | date: "EEEE, MMM d, y - h:mm a"
                  }}
                </p>
              </div>

              <div class="attendance-list">
                @for (record of attendanceRecords(); track record.player_id) {
                  <div class="attendance-row">
                    <div class="player-info">
                      <p-avatar
                        [label]="getInitialsStr(record.player_name || 'U')"
                        shape="circle"
                      ></p-avatar>
                      <span>{{ record.player_name || "Unknown" }}</span>
                    </div>
                    <div class="status-buttons">
                      @for (status of attendanceStatuses; track status.value) {
                        <app-button
                          size="sm"
                          (clicked)="
                            updateAttendanceStatus(record, status.value)
                          "
                        ></app-button>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <app-dialog-footer
            dialogFooter
            cancelLabel="Close"
            primaryLabel="Save All"
            primaryIcon="check"
            (cancel)="showAttendanceDialog = false"
            (primary)="saveAttendance()"
          />
        </app-dialog>
      </div>
    </app-main-layout>
  `,
  styleUrl: "./attendance.component.scss",
})
export class AttendanceComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private authService = inject(AuthService);
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
    const teamId = this.authService.getUser()?.user_metadata?.team_id;
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
    const teamId = this.authService.getUser()?.user_metadata?.team_id;
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

  onSelectedEventTypeChange(value: EventType | null): void {
    this.selectedEventType = value;
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

  onNewEventTypeChange(value: EventType | null): void {
    this.newEvent = { ...this.newEvent, event_type: value ?? "practice" };
  }

  onNewEventStartTimeChange(value: Date | null): void {
    this.newEvent = { ...this.newEvent, start_time: value };
  }

  onNewEventStartTimeInput(value: string): void {
    this.onNewEventStartTimeChange(this.parseDateTimeInputValue(value));
  }

  onNewEventEndTimeChange(value: Date | null): void {
    this.newEvent = { ...this.newEvent, end_time: value };
  }

  onNewEventEndTimeInput(value: string): void {
    this.onNewEventEndTimeChange(this.parseDateTimeInputValue(value));
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

  getInputValue(event: Event): string {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return target.value;
    }
    return "";
  }

  isChecked(event: Event): boolean {
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
    const teamId = this.authService.getUser()?.user_metadata?.team_id;
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
