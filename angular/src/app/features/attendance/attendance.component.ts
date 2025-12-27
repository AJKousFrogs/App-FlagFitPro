import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  DestroyRef,
} from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { Textarea } from "primeng/textarea";
import { Select } from "primeng/select";
import { DatePicker } from "primeng/datepicker";
import { CheckboxModule } from "primeng/checkbox";
import { ProgressBarModule } from "primeng/progressbar";
import { TooltipModule } from "primeng/tooltip";
import { AvatarModule } from "primeng/avatar";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import {
  AttendanceService,
  TeamEvent,
  AttendanceRecord,
  PlayerAttendanceStats,
} from "../../core/services/attendance.service";
import { AuthService } from "../../core/services/auth.service";
import { ToastService } from "../../core/services/toast.service";

type EventType = "practice" | "game" | "meeting" | "film_session" | "conditioning" | "other";
type AttendanceStatus = "present" | "absent" | "late" | "excused";

@Component({
  selector: "app-attendance",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    DialogModule,
    InputTextModule,
    Textarea,
    Select,
    DatePicker,
    CheckboxModule,
    ProgressBarModule,
    TooltipModule,
    AvatarModule,
    MainLayoutComponent,
    PageHeaderComponent,
    DatePipe,
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
              <p-button
                label="Create Event"
                icon="pi pi-plus"
                (onClick)="openCreateEventDialog()"
              ></p-button>
            }
          </div>
        </app-page-header>

        <div class="attendance-content">
          <!-- Stats Overview -->
          <div class="stats-grid">
            <p-card styleClass="stat-card">
              <div class="stat-content">
                <i class="pi pi-calendar stat-icon"></i>
                <div class="stat-info">
                  <span class="stat-value">{{ upcomingEvents().length }}</span>
                  <span class="stat-label">Upcoming Events</span>
                </div>
              </div>
            </p-card>

            <p-card styleClass="stat-card">
              <div class="stat-content">
                <i class="pi pi-check-circle stat-icon success"></i>
                <div class="stat-info">
                  <span class="stat-value">{{ teamAttendanceRate() }}%</span>
                  <span class="stat-label">Team Attendance Rate</span>
                </div>
              </div>
            </p-card>

            <p-card styleClass="stat-card">
              <div class="stat-content">
                <i class="pi pi-users stat-icon"></i>
                <div class="stat-info">
                  <span class="stat-value">{{ playerStats().length }}</span>
                  <span class="stat-label">Players Tracked</span>
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
                  <p-dropdown
                    [options]="eventTypeOptions"
                    [(ngModel)]="selectedEventType"
                    placeholder="All Types"
                    [showClear]="true"
                    (onChange)="filterEvents()"
                  ></p-dropdown>
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
                          {{ event.start_time | date: 'MMM d, h:mm a' }}
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
                      <p-tag
                        [value]="event.is_mandatory ? 'Mandatory' : 'Optional'"
                        [severity]="event.is_mandatory ? 'danger' : 'info'"
                      ></p-tag>
                      @if (isCoach()) {
                        <p-button
                          icon="pi pi-users"
                          [text]="true"
                          pTooltip="Take Attendance"
                          (onClick)="openAttendanceDialog(event); $event.stopPropagation()"
                        ></p-button>
                      } @else {
                        <p-button
                          icon="pi pi-check"
                          [text]="true"
                          pTooltip="Check In"
                          (onClick)="quickCheckIn(event); $event.stopPropagation()"
                        ></p-button>
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
                          [label]="getInitials(stat.player_name || 'U')"
                          shape="circle"
                          size="normal"
                        ></p-avatar>
                        <span>{{ stat.player_name || 'Unknown' }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="stat-badge success">{{ stat.events_attended }}</span>
                    </td>
                    <td>
                      <span class="stat-badge danger">{{ stat.events_missed }}</span>
                    </td>
                    <td>
                      <span class="stat-badge info">{{ stat.events_excused }}</span>
                    </td>
                    <td>
                      <span class="stat-badge warning">{{ stat.events_late }}</span>
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
                      <span class="streak-badge" [class.active]="stat.current_streak > 0">
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
          [style]="{ width: '500px' }"
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
              <p-dropdown
                id="eventType"
                [options]="eventTypeOptions"
                [(ngModel)]="newEvent.event_type"
                placeholder="Select type"
                [style]="{ width: '100%' }"
              ></p-dropdown>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label for="startTime">Start Time *</label>
                <p-calendar
                  id="startTime"
                  [(ngModel)]="newEvent.start_time"
                  [showTime]="true"
                  dateFormat="mm/dd/yy"
                  [style]="{ width: '100%' }"
                ></p-calendar>
              </div>

              <div class="form-field">
                <label for="endTime">End Time</label>
                <p-calendar
                  id="endTime"
                  [(ngModel)]="newEvent.end_time"
                  [showTime]="true"
                  dateFormat="mm/dd/yy"
                  [style]="{ width: '100%' }"
                ></p-calendar>
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
                inputId="mandatory"
              ></p-checkbox>
              <label for="mandatory">Mandatory attendance</label>
            </div>
          </div>

          <ng-template pTemplate="footer">
            <p-button
              label="Cancel"
              [text]="true"
              (onClick)="showCreateEventDialog = false"
            ></p-button>
            <p-button
              label="Create Event"
              icon="pi pi-check"
              (onClick)="createEvent()"
              [disabled]="!canCreateEvent()"
            ></p-button>
          </ng-template>
        </p-dialog>

        <!-- Take Attendance Dialog -->
        <p-dialog
          header="Take Attendance"
          [(visible)]="showAttendanceDialog"
          [modal]="true"
          [style]="{ width: '600px' }"
          [closable]="true"
        >
          @if (selectedEvent()) {
            <div class="attendance-dialog">
              <div class="event-summary">
                <h4>{{ selectedEvent()!.title }}</h4>
                <p>{{ selectedEvent()!.start_time | date: 'EEEE, MMM d, y - h:mm a' }}</p>
              </div>

              <div class="attendance-list">
                @for (record of attendanceRecords(); track record.player_id) {
                  <div class="attendance-row">
                    <div class="player-info">
                      <p-avatar
                        [label]="getInitials(record.player_name || 'U')"
                        shape="circle"
                      ></p-avatar>
                      <span>{{ record.player_name || 'Unknown' }}</span>
                    </div>
                    <div class="status-buttons">
                      @for (status of attendanceStatuses; track status.value) {
                        <p-button
                          [label]="status.label"
                          [severity]="record.status === status.value ? status.severity : 'secondary'"
                          [outlined]="record.status !== status.value"
                          size="small"
                          (onClick)="updateAttendanceStatus(record, status.value)"
                        ></p-button>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <ng-template pTemplate="footer">
            <p-button
              label="Close"
              [text]="true"
              (onClick)="showAttendanceDialog = false"
            ></p-button>
            <p-button
              label="Save All"
              icon="pi pi-check"
              (onClick)="saveAttendance()"
            ></p-button>
          </ng-template>
        </p-dialog>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .attendance-page {
        padding: var(--space-6);
      }

      .header-actions {
        display: flex;
        gap: var(--space-3);
      }

      .attendance-content {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
      }

      .stat-content {
        display: flex;
        align-items: center;
        gap: var(--space-4);
      }

      .stat-icon {
        font-size: 2rem;
        color: var(--primary-color);

        &.success {
          color: var(--green-500);
        }
      }

      .stat-info {
        display: flex;
        flex-direction: column;
      }

      .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-color);
      }

      .stat-label {
        font-size: 0.875rem;
        color: var(--text-color-secondary);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4);
        border-bottom: 1px solid var(--surface-border);

        h3 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
        }
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-8);
        color: var(--text-color-secondary);

        i {
          font-size: 3rem;
          margin-bottom: var(--space-4);
        }
      }

      .events-list {
        display: flex;
        flex-direction: column;
      }

      .event-item {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-4);
        border-bottom: 1px solid var(--surface-border);
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover {
          background-color: var(--surface-hover);
        }

        &:last-child {
          border-bottom: none;
        }
      }

      .event-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--primary-100);
        border-radius: var(--border-radius);
        color: var(--primary-color);
        font-size: 1.25rem;
      }

      .event-details {
        flex: 1;
      }

      .event-title {
        font-weight: 600;
        margin-bottom: var(--space-1);
      }

      .event-meta {
        display: flex;
        gap: var(--space-4);
        font-size: 0.875rem;
        color: var(--text-color-secondary);

        span {
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }
      }

      .event-actions {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .player-cell {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .stat-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 28px;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;

        &.success {
          background-color: var(--green-100);
          color: var(--green-700);
        }

        &.danger {
          background-color: var(--red-100);
          color: var(--red-700);
        }

        &.warning {
          background-color: var(--yellow-100);
          color: var(--yellow-700);
        }

        &.info {
          background-color: var(--blue-100);
          color: var(--blue-700);
        }
      }

      .rate-cell {
        display: flex;
        align-items: center;
        gap: var(--space-2);

        .rate-bar {
          width: 80px;
          height: 8px;
        }
      }

      .streak-badge {
        padding: 4px 8px;
        border-radius: 12px;
        background-color: var(--surface-100);
        font-size: 0.875rem;

        &.active {
          background-color: var(--orange-100);
          color: var(--orange-700);
        }
      }

      .dialog-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);

        label {
          font-weight: 500;
          font-size: 0.875rem;
        }

        &.checkbox-field {
          flex-direction: row;
          align-items: center;
        }
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-4);
      }

      .attendance-dialog {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .event-summary {
        padding: var(--space-4);
        background-color: var(--surface-100);
        border-radius: var(--border-radius);

        h4 {
          margin: 0 0 var(--space-1) 0;
        }

        p {
          margin: 0;
          color: var(--text-color-secondary);
          font-size: 0.875rem;
        }
      }

      .attendance-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        max-height: 400px;
        overflow-y: auto;
      }

      .attendance-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-3);
        background-color: var(--surface-50);
        border-radius: var(--border-radius);
      }

      .player-info {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .status-buttons {
        display: flex;
        gap: var(--space-2);
      }
    `,
  ],
})
export class AttendanceComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

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

  attendanceStatuses: Array<{ value: AttendanceStatus; label: string; severity: "success" | "danger" | "warning" | "info" }> = [
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

  isCoach(): boolean {
    const user = this.authService.getUser();
    return user?.user_metadata?.role === "coach" || user?.user_metadata?.role === "admin";
  }

  loadEvents(): void {
    const teamId = this.authService.getUser()?.user_metadata?.team_id;
    if (!teamId) return;

    this.attendanceService
      .getTeamEvents(teamId, { limit: 50 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (events) => this.events.set(events),
        error: (err) => this.toastService.error("Failed to load events"),
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
        error: (err) => this.toastService.error("Failed to load attendance stats"),
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

  getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
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
    return !!(this.newEvent.title && this.newEvent.event_type && this.newEvent.start_time);
  }

  createEvent(): void {
    const teamId = this.authService.getUser()?.user_metadata?.team_id;
    if (!teamId || !this.canCreateEvent()) return;

    this.attendanceService
      .createEvent({
        team_id: teamId,
        title: this.newEvent.title,
        event_type: this.newEvent.event_type,
        start_time: this.newEvent.start_time!.toISOString(),
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
            this.toastService.success("Event created successfully");
            this.showCreateEventDialog = false;
          }
        },
        error: () => this.toastService.error("Failed to create event"),
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
        error: () => this.toastService.error("Failed to load attendance records"),
      });
  }

  updateAttendanceStatus(record: AttendanceRecord, status: AttendanceStatus): void {
    this.attendanceRecords.update((records) =>
      records.map((r) => (r.player_id === record.player_id ? { ...r, status } : r))
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
          this.toastService.success("Attendance saved successfully");
          this.showAttendanceDialog = false;
          this.loadPlayerStats();
        },
        error: () => this.toastService.error("Failed to save attendance"),
      });
  }

  quickCheckIn(event: TeamEvent): void {
    this.attendanceService
      .quickCheckIn(event.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (record) => {
          if (record) {
            this.toastService.success("Checked in successfully!");
          }
        },
        error: () => this.toastService.error("Failed to check in"),
      });
  }
}
