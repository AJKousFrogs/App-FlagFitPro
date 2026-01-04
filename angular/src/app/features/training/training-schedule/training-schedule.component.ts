import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    OnInit,
    signal,
} from "@angular/core";

import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardModule } from "primeng/card";
import { CheckboxModule } from "primeng/checkbox";
import { DatePicker } from "primeng/datepicker";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";
import { AuthService } from "../../../core/services/auth.service";
import { LoggerService } from "../../../core/services/logger.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { ToastService } from "../../../core/services/toast.service";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";

interface TrainingSession {
  id: string;
  date: Date;
  type: string;
  duration: number;
  /** Maps DB status (planned/in_progress/completed/cancelled) to UI status */
  status: "scheduled" | "completed" | "missed" | "in_progress";
  /** Whether this is a template (from 52-week program) or actual logged session */
  isTemplate: boolean;
}

@Component({
  selector: "app-training-schedule",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CommonModule,
    CardModule,
    DatePicker,
    TagModule,
    SkeletonModule,
    ToastModule,
    TooltipModule,
    CheckboxModule,
    MainLayoutComponent,
    PageHeaderComponent,
  
    ButtonComponent,
  ],
  template: `
    <app-main-layout>
      <div class="training-schedule-page">
        <!-- STEP 1: Page Header - Title/subtitle left, New Session button right -->
        <app-page-header
          title="Training Schedule"
          subtitle="View and manage your training sessions"
          icon="pi-calendar"
        >
          <app-button iconLeft="pi-plus" (clicked)="createNewSession()">New Session</app-button>
        </app-page-header>

        <div class="schedule-content">
          <!-- STEP 2: Calendar Card with inline DatePicker and showWeek -->
          <p-card class="calendar-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <i class="pi pi-calendar"></i>
                <h3>Training Calendar</h3>
              </div>
            </ng-template>
            <p-datepicker
              [ngModel]="selectedDate()"
              (ngModelChange)="onDateSelect($event)"
              [inline]="true"
              [showWeek]="showWeekNumbers()"
              aria-label="Training calendar date picker"
            ></p-datepicker>

            <!-- Calendar Legend (informational only) -->
            <div class="calendar-legend">
              <!-- Today indicator -->
              <p class="legend-today">
                <i class="pi pi-circle legend-today-icon"></i>
                Today: {{ today | date: 'MMM d' }}
              </p>

              <!-- Legend section with label -->
              <div class="legend-section">
                <span class="legend-label">Legend:</span>
                <div class="legend-items">
                  <span class="legend-item">
                    <i class="pi pi-circle-fill legend-completed"></i>
                    Completed
                  </span>
                  <span class="legend-item">
                    <i class="pi pi-circle legend-scheduled"></i>
                    Scheduled
                  </span>
                  <span class="legend-item">
                    <i class="pi pi-circle-fill legend-in-progress"></i>
                    In Progress
                  </span>
                  <span class="legend-item">
                    <i class="pi pi-times-circle legend-missed"></i>
                    Missed
                  </span>
                </div>
              </div>

              <!-- Show Week Numbers Checkbox -->
              <div class="show-week-toggle">
                <p-checkbox
                  [ngModel]="showWeekNumbers()"
                  (ngModelChange)="onShowWeekToggle($event)"
                  [binary]="true"
                  inputId="showWeekNumbers"
                ></p-checkbox>
                <label for="showWeekNumbers">Show Week Numbers</label>
              </div>
            </div>
          </p-card>

          <!-- STEP 3: Sessions List Card -->
          <p-card class="sessions-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <i class="pi pi-clipboard"></i>
                <h3>Upcoming Sessions</h3>
              </div>
            </ng-template>
            <div class="sessions-list">
              <!-- STEP 4: Error State with p-message and retry -->
              @if (hasError()) {
                <div class="error-state">
                  <i class="pi pi-calendar-times error-icon" aria-hidden="true"></i>
                  <div class="error-text">
                    <strong>Unable to load sessions</strong>
                    <p>{{ errorMessage() }}</p>
                  </div>
                  <app-button variant="outlined" iconLeft="pi-refresh" (clicked)="loadSessions()">Try Again</app-button>
                </div>
              } @else if (isLoading()) {
                <!-- STEP 4: Loading State with p-skeleton -->
                @for (i of [1, 2, 3]; track i) {
                  <div class="session-item session-item-skeleton">
                    <div class="session-info">
                      <p-skeleton width="60%" height="1.25rem"></p-skeleton>
                      <p-skeleton width="80%" height="0.875rem" class="skeleton-date"></p-skeleton>
                      <p-skeleton width="40%" height="0.75rem" class="skeleton-duration"></p-skeleton>
                    </div>
                    <div class="session-actions">
                      <p-skeleton width="5rem" height="1.5rem" borderRadius="1rem"></p-skeleton>
                    </div>
                  </div>
                }
              } @else if (filteredSessions().length === 0) {
                <!-- STEP 4: Empty State - Icon + message centered -->
                <div class="empty-state">
                  <i class="pi pi-calendar empty-state-icon" aria-hidden="true"></i>
                  <h4 class="empty-state-title">No sessions scheduled</h4>
                  <p class="empty-state-message">
                    Click "New Session" to add one.
                  </p>
                </div>
              } @else {
                <!-- STEP 3: Session rows as card-like items -->
                @for (session of filteredSessions(); track session.id) {
                  <div
                    class="session-item"
                    (click)="viewSession(session)"
                    (keydown.enter)="viewSession(session)"
                    (keydown.space)="viewSession(session)"
                    tabindex="0"
                    role="button"
                    [attr.aria-label]="session.type + ' on ' + (session.date | date: 'MMMM d, y') + ', ' + session.status"
                  >
                    <div class="session-info">
                      <!-- Title visually dominant -->
                      <h4 class="session-title">{{ session.type }}</h4>
                      <!-- Date/time secondary -->
                      <p class="session-date">
                        {{ session.date | date: "MMM d, y 'at' h:mm a" }}
                      </p>
                      <!-- Duration tertiary -->
                      <p class="session-duration">
                        Duration: {{ session.duration }} min
                      </p>
                    </div>
                    <div class="session-actions">
                      <!-- Modern status pill -->
                      <span class="status-tag status-{{ session.status }}">
                        <i [class]="getStatusIcon(session.status)"></i>
                        {{ getStatusLabel(session.status) }}
                      </span>
                      <!-- Mark-complete button: only for actual sessions (not templates) -->
                      @if (session.status === "scheduled" && !session.isTemplate) {
                        <app-button variant="text" size="sm" iconLeft="pi-check" (clicked)="markComplete($event, session)">Mark session as complete</app-button>
                      }
                      <!-- Start session button: for template sessions -->
                      @if (session.isTemplate) {
                        <app-button variant="text" size="sm" iconLeft="pi-play" (clicked)="startTemplateSession($event, session)">Start this training session</app-button>
                      }
                    </div>
                  </div>
                }
              }
            </div>
          </p-card>
        </div>
      </div>
    </app-main-layout>
  `,
  styleUrl: './training-schedule.component.scss',
})
export class TrainingScheduleComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private logger = inject(LoggerService);

  selectedDate = signal<Date>(new Date());
  sessions = signal<TrainingSession[]>([]);
  isLoading = signal<boolean>(false);
  showWeekNumbers = signal<boolean>(true);
  today = new Date();

  // Runtime guard signals - prevent white screen crashes
  hasError = signal<boolean>(false);
  errorMessage = signal<string>(
    "Failed to load training sessions. Please try again.",
  );

  // Sessions are already filtered by week in loadSessions()
  filteredSessions = computed(() => {
    return this.sessions();
  });

  ngOnInit(): void {
    this.loadSessions();
  }

  async loadSessions(): Promise<void> {
    this.isLoading.set(true);
    this.hasError.set(false);

    try {
      const user = this.authService.getUser();
      if (!user?.id) {
        this.logger.warn("No user found, cannot load sessions");
        this.isLoading.set(false);
        return;
      }

      // Calculate date range for the query (selected week)
      const selected = this.selectedDate();
      const startOfWeek = new Date(selected);
      startOfWeek.setDate(selected.getDate() - selected.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      // 1. Fetch actual training sessions (logged/completed sessions)
      const { data: actualSessions, error: sessionsError } = await this.supabaseService.client
        .from("training_sessions")
        .select(`
          id,
          session_date,
          start_time,
          session_type,
          training_type,
          duration_minutes,
          duration,
          status,
          notes
        `)
        .eq("user_id", user.id)
        .gte("session_date", startOfWeek.toISOString().split('T')[0])
        .lte("session_date", endOfWeek.toISOString().split('T')[0])
        .order("session_date", { ascending: true });

      if (sessionsError) {
        throw new Error(sessionsError.message);
      }

      // 2. Fetch scheduled sessions from training templates (52-week program)
      // Find weeks that contain any day in our selected week range
      const { data: scheduledTemplates, error: templatesError } = await this.supabaseService.client
        .from("training_session_templates")
        .select(`
          id,
          session_name,
          session_type,
          day_of_week,
          duration_minutes,
          intensity_level,
          description,
          training_weeks!inner (
            id,
            week_number,
            start_date,
            end_date
          )
        `)
        .lte("training_weeks.start_date", endOfWeek.toISOString().split('T')[0])
        .gte("training_weeks.end_date", startOfWeek.toISOString().split('T')[0]);

      // Map actual sessions
      const mappedActualSessions: TrainingSession[] = (actualSessions || []).map((session) => ({
        id: session.id,
        date: session.start_time 
          ? new Date(session.start_time) 
          : new Date(session.session_date),
        type: session.session_type || session.training_type || "Training",
        duration: session.duration_minutes || session.duration || 60,
        status: this.mapDbStatusToUiStatus(session.status),
        isTemplate: false,
      }));

      // Map scheduled templates to sessions (if no template error)
      let mappedScheduledSessions: TrainingSession[] = [];
      if (!templatesError && scheduledTemplates) {
        mappedScheduledSessions = scheduledTemplates
          .filter((template) => {
            // training_weeks is an array from the join - ensure it has data
            const weeks = template.training_weeks as Array<{ start_date: string; week_number: number }>;
            return weeks && weeks.length > 0;
          })
          .map((template) => {
            // Get the first (and should be only) week from the join
            const weeks = template.training_weeks as Array<{ start_date: string; week_number: number }>;
            const weekData = weeks[0];
            const weekStart = new Date(weekData.start_date);
            const sessionDate = new Date(weekStart);
            sessionDate.setDate(weekStart.getDate() + (template.day_of_week || 0));
            
            return {
              id: template.id,
              date: sessionDate,
              type: template.session_name || template.session_type || "Training",
              duration: template.duration_minutes || 60,
              status: "scheduled" as const,
              isTemplate: true,
            };
          });
      }

      // Combine both sources, avoiding duplicates by checking if actual session exists for same date/type
      const actualDates = new Set(
        mappedActualSessions.map(s => `${s.date.toISOString().split('T')[0]}-${s.type}`)
      );
      
      const uniqueScheduled = mappedScheduledSessions.filter(
        s => !actualDates.has(`${s.date.toISOString().split('T')[0]}-${s.type}`)
      );

      const allSessions = [...mappedActualSessions, ...uniqueScheduled]
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      this.sessions.set(allSessions);
    } catch (error) {
      this.logger.error("Error loading sessions:", error);
      this.hasError.set(true);

      if (error instanceof Error) {
        if (error.message.includes("network") || error.message.includes("fetch")) {
          this.errorMessage.set(
            "Unable to connect to the server. Please check your internet connection.",
          );
        } else if (error.message.includes("permission") || error.message.includes("denied")) {
          this.errorMessage.set(
            "You don't have permission to view these sessions.",
          );
        } else {
          this.errorMessage.set(
            "Failed to load training sessions. Please try again.",
          );
        }
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  onDateSelect(date: Date): void {
    if (!date) return;
    
    const previousDate = this.selectedDate();
    
    // Check if the week changed
    const prevWeekStart = new Date(previousDate);
    prevWeekStart.setDate(previousDate.getDate() - previousDate.getDay());
    prevWeekStart.setHours(0, 0, 0, 0);
    
    const newWeekStart = new Date(date);
    newWeekStart.setDate(date.getDate() - date.getDay());
    newWeekStart.setHours(0, 0, 0, 0);
    
    // Update the selected date
    this.selectedDate.set(date);
    
    // Reload sessions if the week changed
    if (prevWeekStart.getTime() !== newWeekStart.getTime()) {
      this.loadSessions();
    }
  }

  onShowWeekToggle(checked: boolean): void {
    this.showWeekNumbers.set(checked);
  }

  createNewSession(): void {
    const selectedDateStr = this.selectedDate()?.toISOString().split("T")[0];
    this.router.navigate(["/training/smart-form"], {
      queryParams: selectedDateStr ? { date: selectedDateStr } : {},
    });
    this.logger.debug("Navigating to session creation form", {
      date: selectedDateStr,
    });
  }

  viewSession(session: TrainingSession): void {
    if (session.isTemplate) {
      // For templates, navigate to start a new session with pre-filled data
      this.router.navigate(["/training/smart-form"], {
        queryParams: {
          templateId: session.id,
          date: session.date.toISOString().split("T")[0],
          type: session.type,
          duration: session.duration,
        },
      });
    } else {
      // For actual sessions, navigate to session detail
      this.router.navigate(["/training/session", session.id]);
    }
  }

  async markComplete(event: Event, session: TrainingSession): Promise<void> {
    event.stopPropagation();

    // Only allow marking complete for actual sessions (not templates)
    if (session.isTemplate) {
      this.toastService.warn("Start the session first before marking complete");
      return;
    }

    try {
      const { error } = await this.supabaseService.client
        .from("training_sessions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", session.id);

      if (error) {
        throw new Error(error.message);
      }

      // Update local state
      this.sessions.update((sessions) =>
        sessions.map((s) =>
          s.id === session.id ? { ...s, status: "completed" as const } : s,
        ),
      );

      this.toastService.success("Session marked as complete!");
    } catch (error) {
      this.logger.error("Error marking session complete:", error);
      this.toastService.error("Failed to update session");
    }
  }

  /**
   * Start a template session - creates an actual training_session record
   * and navigates to the session form
   */
  async startTemplateSession(event: Event, session: TrainingSession): Promise<void> {
    event.stopPropagation();

    const user = this.authService.getUser();
    if (!user?.id) {
      this.toastService.error("Please log in to start a session");
      return;
    }

    try {
      // Create a new training session from the template
      const { data, error } = await this.supabaseService.client
        .from("training_sessions")
        .insert({
          user_id: user.id,
          athlete_id: user.id,
          session_date: session.date.toISOString().split("T")[0],
          start_time: new Date().toISOString(),
          session_type: session.type,
          duration_minutes: session.duration,
          status: "in_progress",
          template_id: session.id,
        })
        .select("id")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Update local state - replace template with actual session
      this.sessions.update((sessions) =>
        sessions.map((s) =>
          s.id === session.id
            ? { ...s, id: data.id, status: "in_progress" as const, isTemplate: false }
            : s,
        ),
      );

      this.toastService.success("Session started!");
      
      // Navigate to the session detail page
      this.router.navigate(["/training/session", data.id]);
    } catch (error) {
      this.logger.error("Error starting session:", error);
      this.toastService.error("Failed to start session");
    }
  }

  getStatusSeverity(
    status: string,
  ):
    | "success"
    | "info"
    | "warn"
    | "secondary"
    | "contrast"
    | "danger"
    | null
    | undefined {
    switch (status) {
      case "completed":
        return "success";
      case "missed":
        return "danger";
      case "in_progress":
        return "warn";
      default:
        return "info";
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case "completed":
        return "pi pi-check-circle";
      case "missed":
        return "pi pi-times-circle";
      case "in_progress":
        return "pi pi-spin pi-spinner";
      default:
        return "pi pi-clock";
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case "completed":
        return "Completed";
      case "missed":
        return "Missed";
      case "in_progress":
        return "In Progress";
      default:
        return "Scheduled";
    }
  }

  /**
   * Maps database status values to UI-friendly status values
   * DB enum: planned, in_progress, completed, cancelled, scheduled
   * UI expects: scheduled, completed, missed, in_progress
   */
  private mapDbStatusToUiStatus(
    dbStatus: string | null | undefined,
  ): "scheduled" | "completed" | "missed" | "in_progress" {
    switch (dbStatus) {
      case "completed":
        return "completed";
      case "cancelled":
        return "missed";
      case "in_progress":
        return "in_progress";
      case "planned":
      case "scheduled":
      default:
        return "scheduled";
    }
  }
}
