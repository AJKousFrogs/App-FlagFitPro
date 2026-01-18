import { CommonModule, DatePipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { Avatar } from "primeng/avatar";
import { Card } from "primeng/card";
import { Checkbox } from "primeng/checkbox";
import { DatePicker } from "primeng/datepicker";
import { Dialog } from "primeng/dialog";
import { PrimeTemplate } from "primeng/api";
import { InputText } from "primeng/inputtext";
import { ProgressBar } from "primeng/progressbar";
import { Select } from "primeng/select";
import { TableModule } from "primeng/table";
import { Textarea } from "primeng/textarea";

import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { TOAST } from "../../core/constants/toast-messages.constants";
import {
  AttendanceRecord,
  AttendanceService,
  PlayerAttendanceStats,
  TeamEvent
} from "../../core/services/attendance.service";
import { AuthService } from "../../core/services/auth.service";
import { TeamMembershipService } from "../../core/services/team-membership.service";
import { ToastService } from "../../core/services/toast.service";
import { DIALOG_STYLES } from "../../core/utils/design-tokens.util";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { getInitials } from "../../shared/utils/format.utils";

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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    Card,
    TableModule,
    StatusTagComponent,
    Dialog,
    PrimeTemplate,
    InputText,
    Textarea,
    Select,
    DatePicker,
    Checkbox,
    ProgressBar,
    Avatar,
    MainLayoutComponent,
    PageHeaderComponent,
    DatePipe,
    ButtonComponent,
    IconButtonComponent
  ],
  template: `
    <app-main-layout>
      <div class="attendance-page">
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

        <div class="attendance-content">
          <!-- Stats Overview -->
          <div class="stats-grid">
            <p-card styleClass="stat-card">
              <div class="stat-content">
                <i class="pi pi-calendar stat-icon"></i>
                <div class="stat-info stat-block__content">
                  <span class="stat-block__value">{{
                    upcomingEvents().length
                  }}</span>
                  <span class="stat-block__label">Upcoming Events</span>
                </div>
              </div>
            </p-card>

            <p-card styleClass="stat-card">
              <div class="stat-content">
                <i class="pi pi-check-circle stat-icon success"></i>
                <div class="stat-info stat-block__content">
                  <span class="stat-block__value">{{
                    teamAttendanceRate()
                  }}%</span>
                  <span class="stat-block__label">Team Attendance Rate</span>
                </div>
              </div>
            </p-card>

            <p-card styleClass="stat-card">
              <div class="stat-content">
                <i class="pi pi-users stat-icon"></i>
                <div class="stat-info stat-block__content">
                  <span class="stat-block__value">{{
                    playerStats().length
                  }}</span>
                  <span class="stat-block__label">Players Tracked</span>
                </div>
              </div>
            </p-card>
          </div>

          <!-- Upcoming Events -->
          <p-card styleClass="events-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <h3>Upcoming Events</h3>
                <div class="filter-actions">
                  <p-select
                    [options]="eventTypeOptions"
                    [(ngModel)]="selectedEventType"
                    placeholder="All Types"
                    [showClear]="true"
                    (onValueChange)="filterEvents()"
                  ></p-select>
                </div>
              </div>
            </ng-template>

            @if (filteredEvents().length === 0) {
              <div class="empty-state">
                <i class="pi pi-calendar-times"></i>
                <p>No upcoming events scheduled</p>
              </div>
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
          </p-card>

          <!-- Player Attendance Stats (Coach View) -->
          @if (isCoach()) {
            <p-card styleClass="stats-card">
              <ng-template pTemplate="header">
                <div class="card-header">
                  <h3>Player Attendance Statistics</h3>
                </div>
              </ng-template>

              <p-table
                [value]="playerStats()"
                [paginator]="true"
                [rows]="10"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} players"
                styleClass="p-datatable-sm"
              >
                <ng-template pTemplate="header">
                  <tr>
                    <th>Player</th>
                    <th>Attended</th>
                    <th>Missed</th>
                    <th>Excused</th>
                    <th>Late</th>
                    <th>Rate</th>
                    <th>Streak</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-stat>
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
                          styleClass="rate-bar"
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
                </ng-template>
              </p-table>
            </p-card>
          }
        </div>

        <!-- Create Event Dialog -->
        <p-dialog
          header="Create Event"
          [(visible)]="showCreateEventDialog"
          [modal]="true"
          [style]="dialogStyles.standard"
          [closable]="true"
        >
          <div class="dialog-form">
            <div class="form-field">
              <label for="eventTitle">Title *</label>
              <input
                id="eventTitle"
                type="text"
                pInputText
                [(ngModel)]="newEvent.title"
                placeholder="e.g., Team Practice"
              />
            </div>

            <div class="form-field">
              <label for="eventType">Type *</label>
              <p-select
                id="eventType"
                [options]="eventTypeOptions"
                [(ngModel)]="newEvent.event_type"
                placeholder="Select type"
                [style]="{ width: '100%' }"
              ></p-select>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label for="startTime">Start Time *</label>
                <p-datepicker
                  id="startTime"
                  [(ngModel)]="newEvent.start_time"
                  [showTime]="true"
                  dateFormat="mm/dd/yy"
                  [style]="{ width: '100%' }"
                ></p-datepicker>
              </div>

              <div class="form-field">
                <label for="endTime">End Time</label>
                <p-datepicker
                  id="endTime"
                  [(ngModel)]="newEvent.end_time"
                  [showTime]="true"
                  dateFormat="mm/dd/yy"
                  [style]="{ width: '100%' }"
                ></p-datepicker>
              </div>
            </div>

            <div class="form-field">
              <label for="location">Location</label>
              <input
                id="location"
                type="text"
                pInputText
                [(ngModel)]="newEvent.location"
                placeholder="e.g., Main Field"
              />
            </div>

            <div class="form-field">
              <label for="description">Description</label>
              <textarea
                id="description"
                pInputTextarea
                [(ngModel)]="newEvent.description"
                rows="3"
                placeholder="Optional details..."
              ></textarea>
            </div>

            <div class="form-field checkbox-field">
              <p-checkbox
                [(ngModel)]="newEvent.is_mandatory"
                [binary]="true"
                variant="filled"
                inputId="mandatory"
              ></p-checkbox>
              <label for="mandatory">Mandatory attendance</label>
            </div>
          </div>

          <ng-template pTemplate="footer">
            <app-button variant="text" (clicked)="showCreateEventDialog = false"
              >Cancel</app-button
            >
            <app-button
              iconLeft="pi-check"
              [disabled]="!canCreateEvent()"
              (clicked)="createEvent()"
              >Create Event</app-button
            >
          </ng-template>
        </p-dialog>

        <!-- Take Attendance Dialog -->
        <p-dialog
          header="Take Attendance"
          [(visible)]="showAttendanceDialog"
          [modal]="true"
          [style]="dialogStyles.complex"
          [closable]="true"
        >
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

          <ng-template pTemplate="footer">
            <app-button variant="text" (clicked)="showAttendanceDialog = false"
              >Close</app-button
            >
            <app-button iconLeft="pi-check" (clicked)="saveAttendance()"
              >Save All</app-button
            >
          </ng-template>
        </p-dialog>
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
  protected readonly dialogStyles = DIALOG_STYLES;

  // State
  events = signal<TeamEvent[]>([]);
  playerStats = signal<PlayerAttendanceStats[]>([]);
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
        next: (stats) => this.playerStats.set(stats),
        error: (_err) => this.toastService.error(TOAST.ERROR.LOAD_FAILED),
      });
  }

  filterEvents(): void {
    // Computed signal handles filtering
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
