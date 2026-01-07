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
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";

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

interface CalendarDateMarker {
  date: Date;
  status: "scheduled" | "completed" | "missed" | "in_progress";
  sessionType: string;
  tooltip: string;
}

interface MonthlyStats {
  totalSessions: number;
  completedSessions: number;
  missedSessions: number;
  totalDuration: number;
  completionRate: number;
}

@Component({
  selector: "app-training-schedule",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CommonModule,
    DatePicker,
    TagModule,
    SkeletonModule,
    ToastModule,
    TooltipModule,
    CheckboxModule,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    CardShellComponent,
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
          <app-button iconLeft="pi-plus" (clicked)="createNewSession()"
            >New Session</app-button
          >
        </app-page-header>

        <div class="schedule-content">
          <!-- STEP 2: Calendar Card with inline DatePicker and showWeek -->
          <app-card-shell title="Training Calendar" headerIcon="pi-calendar">
            <p-datepicker
              [ngModel]="selectedDate()"
              (ngModelChange)="onDateSelect($event)"
              [inline]="true"
              [showWeek]="showWeekNumbers()"
              [touchUI]="false"
              [disabled]="false"
              [selectOtherMonths]="true"
              [showOtherMonths]="true"
              aria-label="Training calendar date picker"
            ></p-datepicker>

            <!-- Calendar Legend (informational only) -->
            <div class="calendar-legend">
              <!-- Today indicator -->
              <p class="legend-today">
                <i class="pi pi-circle legend-today-icon"></i>
                Today: {{ today | date: "MMM d" }}
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

              <!-- View Mode Toggle -->
              <div class="view-toggle">
                <app-button
                  [variant]="viewMode() === 'week' ? 'primary' : 'outlined'"
                  size="sm"
                  (clicked)="viewMode.set('week'); loadSessions()"
                  >Week</app-button
                >
                <app-button
                  [variant]="viewMode() === 'month' ? 'primary' : 'outlined'"
                  size="sm"
                  (clicked)="viewMode.set('month'); loadSessions()"
                  >Month</app-button
                >
              </div>
            </div>
          </app-card-shell>

          <!-- Monthly Statistics Summary -->
          @if (viewMode() === "month" && monthlyStats().totalSessions > 0) {
            <app-card-shell title="Monthly Summary" headerIcon="pi-chart-bar">
              <div class="monthly-stats">
                <div class="stat-item">
                  <span class="stat-value">{{
                    monthlyStats().totalSessions
                  }}</span>
                  <span class="stat-label">Total Sessions</span>
                </div>
                <div class="stat-item completed">
                  <span class="stat-value">{{
                    monthlyStats().completedSessions
                  }}</span>
                  <span class="stat-label">Completed</span>
                </div>
                <div class="stat-item missed">
                  <span class="stat-value">{{
                    monthlyStats().missedSessions
                  }}</span>
                  <span class="stat-label">Missed</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value"
                    >{{ monthlyStats().totalDuration }}m</span
                  >
                  <span class="stat-label">Total Duration</span>
                </div>
                <div class="stat-item completion">
                  <span class="stat-value"
                    >{{ monthlyStats().completionRate }}%</span
                  >
                  <span class="stat-label">Completion Rate</span>
                </div>
              </div>
            </app-card-shell>
          }

          <!-- STEP 3: Sessions List Card -->
          <app-card-shell title="Upcoming Sessions" headerIcon="pi-clipboard">
            <div class="sessions-list">
              <!-- STEP 4: Error State with p-message and retry -->
              @if (hasError()) {
                <div class="error-state">
                  <i
                    class="pi pi-calendar-times error-icon"
                    aria-hidden="true"
                  ></i>
                  <div class="error-text">
                    <strong>Unable to load sessions</strong>
                    <p>{{ errorMessage() }}</p>
                  </div>
                  <app-button
                    variant="outlined"
                    iconLeft="pi-refresh"
                    (clicked)="loadSessions()"
                    >Try Again</app-button
                  >
                </div>
              } @else if (isLoading()) {
                <!-- STEP 4: Loading State with p-skeleton -->
                @for (i of [1, 2, 3]; track i) {
                  <div class="session-item session-item-skeleton">
                    <div class="session-info">
                      <p-skeleton width="60%" height="1.25rem"></p-skeleton>
                      <p-skeleton
                        width="80%"
                        height="0.875rem"
                        class="skeleton-date"
                      ></p-skeleton>
                      <p-skeleton
                        width="40%"
                        height="0.75rem"
                        class="skeleton-duration"
                      ></p-skeleton>
                    </div>
                    <div class="session-actions">
                      <p-skeleton
                        width="5rem"
                        height="1.5rem"
                        borderRadius="1rem"
                      ></p-skeleton>
                    </div>
                  </div>
                }
              } @else if (filteredSessions().length === 0) {
                <!-- STEP 4: Empty State - Icon + message centered -->
                <div class="card-empty-state">
                  <div class="card-empty-state__icon">
                    <i class="pi pi-calendar" aria-hidden="true"></i>
                  </div>
                  <div class="card-empty-state__content">
                    <p class="card-empty-state__title">No sessions scheduled</p>
                    <p class="card-empty-state__text">
                      Click "New Session" to add one.
                    </p>
                  </div>
                </div>
              } @else {
                <!-- STEP 3: Session rows as card-like items -->
                @for (session of filteredSessions(); track session.id) {
                  <div
                    class="session-item"
                    [style.border-left-color]="
                      getSessionTypeColor(session.type)
                    "
                    (click)="viewSession(session)"
                    (keydown.enter)="viewSession(session)"
                    (keydown.space)="viewSession(session)"
                    tabindex="0"
                    role="button"
                    [attr.aria-label]="
                      session.type +
                      ' on ' +
                      (session.date | date: 'MMMM d, y') +
                      ', ' +
                      session.status
                    "
                  >
                    <div class="session-info">
                      <!-- Session type color indicator -->
                      <span
                        class="session-type-indicator"
                        [style.background-color]="
                          getSessionTypeColor(session.type)
                        "
                      ></span>
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
                      @if (
                        session.status === "scheduled" && !session.isTemplate
                      ) {
                        <app-button
                          variant="text"
                          size="sm"
                          iconLeft="pi-check"
                          (clicked)="markComplete($event, session)"
                          >Mark session as complete</app-button
                        >
                      }
                      <!-- Start session button: for template sessions -->
                      @if (session.isTemplate) {
                        <app-button
                          variant="text"
                          size="sm"
                          iconLeft="pi-play"
                          (clicked)="startTemplateSession($event, session)"
                          >Start this training session</app-button
                        >
                      }
                    </div>
                  </div>
                }
              }
            </div>
          </app-card-shell>
        </div>
      </div>
    </app-main-layout>
  `,
  styleUrl: "./training-schedule.component.scss",
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

  // Calendar date markers for visual indicators
  dateMarkers = signal<CalendarDateMarker[]>([]);

  // View mode: week or month
  viewMode = signal<"week" | "month">("week");

  // Monthly statistics
  monthlyStats = signal<MonthlyStats>({
    totalSessions: 0,
    completedSessions: 0,
    missedSessions: 0,
    totalDuration: 0,
    completionRate: 0,
  });

  // Runtime guard signals - prevent white screen crashes
  hasError = signal<boolean>(false);
  errorMessage = signal<string>(
    "Failed to load training sessions. Please try again.",
  );

  // Sessions filtered by view mode (week or extended)
  filteredSessions = computed(() => {
    const allSessions = this.sessions();
    const mode = this.viewMode();
    const selected = this.selectedDate();

    console.warn("🔍 Filtering sessions:", {
      totalSessions: allSessions.length,
      mode,
      selectedDate: selected.toISOString().split('T')[0],
      firstSessionDate: allSessions[0]?.date?.toISOString?.() || 'none'
    });

    if (mode === 'week') {
      // Show only sessions in the selected week
      const weekStart = new Date(selected);
      weekStart.setDate(selected.getDate() - selected.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      console.warn("📆 Week range:", {
        start: weekStart.toISOString().split('T')[0],
        end: weekEnd.toISOString().split('T')[0],
        startTime: weekStart.getTime(),
        endTime: weekEnd.getTime()
      });

      const filtered = allSessions.filter(session => {
        // Normalize ALL dates to midnight by comparing just the date strings
        const sessionDateStr = session.date.toISOString().split('T')[0];
        const weekStartStr = weekStart.toISOString().split('T')[0];
        const weekEndStr = weekEnd.toISOString().split('T')[0];
        
        const isInRange = sessionDateStr >= weekStartStr && sessionDateStr <= weekEndStr;
        
        if (!isInRange) {
          console.warn(`❌ Session "${session.type}" on ${sessionDateStr} is OUTSIDE week range ${weekStartStr} to ${weekEndStr}`);
        }
        return isInRange;
      });

      console.warn(`✅ Filtered to ${filtered.length} sessions for this week`);
      return filtered;
    } else {
      // Month view - show all sessions in the selected month
      const monthStart = new Date(selected.getFullYear(), selected.getMonth(), 1);
      const monthEnd = new Date(selected.getFullYear(), selected.getMonth() + 1, 0, 23, 59, 59, 999);

      return allSessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= monthStart && sessionDate <= monthEnd;
      });
    }
  });

  // Computed: Get session type color for calendar markers
  getSessionTypeColor(type: string): string {
    const typeColors: Record<string, string> = {
      Strength: "var(--primitive-blue-500)",
      Conditioning: "var(--primitive-success-500)",
      Skills: "var(--primitive-warning-500)",
      Recovery: "var(--primitive-purple-500)",
      Game: "var(--primitive-error-500)",
      Practice: "var(--ds-primary-green)",
      Training: "var(--p-primary-500)",
    };
    // Find partial match
    for (const [key, color] of Object.entries(typeColors)) {
      if (type.toLowerCase().includes(key.toLowerCase())) {
        return color;
      }
    }
    return "var(--p-primary-500)";
  }

  // Check if a date has sessions (for calendar highlighting)
  getDateMarker(date: Date): CalendarDateMarker | undefined {
    const dateStr = date.toISOString().split("T")[0];
    return this.dateMarkers().find(
      (m) => m.date.toISOString().split("T")[0] === dateStr,
    );
  }

  ngOnInit(): void {
    this.loadSessions();
    this.loadMonthlyStats();
    this.loadDateMarkers();
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

      // Calculate date range based on view mode
      const selected = this.selectedDate();
      let startDate: Date;
      let endDate: Date;

      if (this.viewMode() === "month") {
        // Month view: show entire month
        startDate = new Date(selected.getFullYear(), selected.getMonth(), 1);
        endDate = new Date(selected.getFullYear(), selected.getMonth() + 1, 0);
      } else {
        // Week view: show selected week
        startDate = new Date(selected);
        startDate.setDate(selected.getDate() - selected.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
      }

      // Alias for backward compatibility
      const startOfWeek = startDate;
      const endOfWeek = endDate;

      // 1. Fetch actual training sessions (logged/completed sessions)
      const { data: actualSessions, error: sessionsError } =
        await this.supabaseService.client
          .from("training_sessions")
          .select(
            `
          id,
          session_date,
          start_time,
          session_type,
          training_type,
          duration_minutes,
          duration,
          status,
          notes
        `,
          )
          .eq("user_id", user.id)
          .gte("session_date", startOfWeek.toISOString().split("T")[0])
          .lte("session_date", endOfWeek.toISOString().split("T")[0])
          .order("session_date", { ascending: true });

      if (sessionsError) {
        throw new Error(sessionsError.message);
      }

      // 2. Fetch scheduled sessions from training templates (52-week program)
      // Find weeks that contain any day in our selected week range
      const { data: scheduledTemplates, error: templatesError } =
        await this.supabaseService.client
          .from("training_session_templates")
          .select(
            `
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
        `,
          )
          .lte(
            "training_weeks.start_date",
            endOfWeek.toISOString().split("T")[0],
          )
          .gte(
            "training_weeks.end_date",
            startOfWeek.toISOString().split("T")[0],
          );

      // Map actual sessions
      const mappedActualSessions: TrainingSession[] = (
        actualSessions || []
      ).map((session) => ({
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
        console.warn("🔍 TEMPLATES FOUND:", scheduledTemplates.length);
        this.logger.debug("Found scheduled templates", { count: scheduledTemplates.length });
        mappedScheduledSessions = scheduledTemplates
          .filter((template) => {
            // training_weeks is an array from the join - ensure it has data
            const weeks = template.training_weeks as Array<{
              start_date: string;
              week_number: number;
            }>;
            return weeks && weeks.length > 0;
          })
          .map((template) => {
            // Get the first (and should be only) week from the join
            const weeks = template.training_weeks as Array<{
              start_date: string;
              week_number: number;
            }>;
            const weekData = weeks[0];
            
            // Parse date string as local date to avoid timezone issues
            // If start_date is "2026-01-03", parse as local midnight
            const dateStr = weekData.start_date.split('T')[0]; // Get just YYYY-MM-DD
            const [year, month, day] = dateStr.split('-').map(Number);
            const weekStart = new Date(year, month - 1, day, 0, 0, 0, 0);
            
            const sessionDate = new Date(weekStart);
            sessionDate.setDate(weekStart.getDate() + (template.day_of_week || 0));

            return {
              id: template.id,
              date: sessionDate,
              type:
                template.session_name || template.session_type || "Training",
              duration: template.duration_minutes || 60,
              status: "scheduled" as const,
              isTemplate: true,
            };
          });
        this.logger.debug("Mapped scheduled sessions", { count: mappedScheduledSessions.length });
      } else if (templatesError) {
        console.error("❌ TEMPLATE ERROR:", templatesError);
        this.logger.error("Error loading templates", templatesError);
      } else {
        console.warn("⚠️ NO TEMPLATES FOUND for this week");
        this.logger.debug("No scheduled templates found for week range");
      }

      // Combine both sources, but prioritize templates over test data
      const actualDates = new Set(
        mappedActualSessions.map(
          (s) => `${s.date.toISOString().split("T")[0]}-${s.type}`,
        ),
      );

      const uniqueScheduled = mappedScheduledSessions.filter(
        (s) =>
          !actualDates.has(`${s.date.toISOString().split("T")[0]}-${s.type}`),
      );

      // If we have scheduled templates, show ONLY those + completed/in-progress actual sessions
      // This prevents generic test sessions from overriding the 52-week program
      let allSessions: TrainingSession[];
      if (mappedScheduledSessions.length > 0) {
        // Use templates ONLY - don't mix with test data for now
        allSessions = mappedScheduledSessions.sort(
          (a, b) => a.date.getTime() - b.date.getTime(),
        );
        console.warn("🎯 Using ONLY templates (no test data)", {
          templateCount: mappedScheduledSessions.length
        });
        this.logger.debug("Using scheduled templates as primary source", {
          templateCount: mappedScheduledSessions.length,
          activeSessionCount: 0
        });
      } else {
        // No templates found, fallback to actual sessions
        allSessions = [...mappedActualSessions, ...uniqueScheduled].sort(
          (a, b) => a.date.getTime() - b.date.getTime(),
        );
        this.logger.debug("No templates found, using actual sessions");
      }

      this.sessions.set(allSessions);
    } catch (error) {
      this.logger.error("Error loading sessions:", error);
      this.hasError.set(true);

      if (error instanceof Error) {
        if (
          error.message.includes("network") ||
          error.message.includes("fetch")
        ) {
          this.errorMessage.set(
            "Unable to connect to the server. Please check your internet connection.",
          );
        } else if (
          error.message.includes("permission") ||
          error.message.includes("denied")
        ) {
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
    this.logger.debug("Date selected", { date });

    // Check if the week changed
    const prevWeekStart = new Date(previousDate);
    prevWeekStart.setDate(previousDate.getDate() - previousDate.getDay());
    prevWeekStart.setHours(0, 0, 0, 0);

    const newWeekStart = new Date(date);
    newWeekStart.setDate(date.getDate() - date.getDay());
    newWeekStart.setHours(0, 0, 0, 0);

    // Update the selected date
    this.selectedDate.set(date);

    // Always reload sessions when date changes (not just week)
    // This allows filtering by specific dates
    const weekChanged = prevWeekStart.getTime() !== newWeekStart.getTime();
    this.logger.debug("Week changed check", { weekChanged });
    
    // Reload if week changed OR if in month view (to show relevant sessions)
    if (weekChanged || this.viewMode() === 'month') {
      this.loadSessions();
    } else {
      // In week view, just update the filter without reloading
      // The filtered sessions will automatically update based on selectedDate
      this.logger.debug("Same week, sessions already loaded");
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
  async startTemplateSession(
    event: Event,
    session: TrainingSession,
  ): Promise<void> {
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
            ? {
                ...s,
                id: data.id,
                status: "in_progress" as const,
                isTemplate: false,
              }
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

  /**
   * Toggle between week and month view
   */
  toggleViewMode(): void {
    const newMode = this.viewMode() === "week" ? "month" : "week";
    this.viewMode.set(newMode);
    this.loadSessions();
  }

  /**
   * Load date markers for the entire visible month (for calendar highlighting)
   */
  async loadDateMarkers(): Promise<void> {
    try {
      const user = this.authService.getUser();
      if (!user?.id) return;

      const selected = this.selectedDate();
      const startOfMonth = new Date(
        selected.getFullYear(),
        selected.getMonth(),
        1,
      );
      const endOfMonth = new Date(
        selected.getFullYear(),
        selected.getMonth() + 1,
        0,
      );

      const { data: sessions, error } = await this.supabaseService.client
        .from("training_sessions")
        .select("session_date, session_type, training_type, status")
        .eq("user_id", user.id)
        .gte("session_date", startOfMonth.toISOString().split("T")[0])
        .lte("session_date", endOfMonth.toISOString().split("T")[0]);

      if (error) {
        this.logger.warn("Failed to load date markers:", error);
        return;
      }

      const markers: CalendarDateMarker[] = (sessions || []).map((s) => ({
        date: new Date(s.session_date),
        status: this.mapDbStatusToUiStatus(s.status),
        sessionType: s.session_type || s.training_type || "Training",
        tooltip: `${s.session_type || s.training_type || "Training"} - ${this.mapDbStatusToUiStatus(s.status)}`,
      }));

      this.dateMarkers.set(markers);
    } catch (error) {
      this.logger.error("Error loading date markers:", error);
    }
  }

  /**
   * Load monthly statistics for the summary card
   */
  async loadMonthlyStats(): Promise<void> {
    try {
      const user = this.authService.getUser();
      if (!user?.id) return;

      const selected = this.selectedDate();
      const startOfMonth = new Date(
        selected.getFullYear(),
        selected.getMonth(),
        1,
      );
      const endOfMonth = new Date(
        selected.getFullYear(),
        selected.getMonth() + 1,
        0,
      );

      const { data: sessions, error } = await this.supabaseService.client
        .from("training_sessions")
        .select("status, duration_minutes, duration")
        .eq("user_id", user.id)
        .gte("session_date", startOfMonth.toISOString().split("T")[0])
        .lte("session_date", endOfMonth.toISOString().split("T")[0]);

      if (error) {
        this.logger.warn("Failed to load monthly stats:", error);
        return;
      }

      const total = sessions?.length || 0;
      const completed =
        sessions?.filter((s) => s.status === "completed").length || 0;
      const missed =
        sessions?.filter((s) => s.status === "cancelled").length || 0;
      const totalDuration =
        sessions?.reduce(
          (sum, s) => sum + (s.duration_minutes || s.duration || 0),
          0,
        ) || 0;

      this.monthlyStats.set({
        totalSessions: total,
        completedSessions: completed,
        missedSessions: missed,
        totalDuration,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      });
    } catch (error) {
      this.logger.error("Error loading monthly stats:", error);
    }
  }

  /**
   * Get status color for calendar date cell
   */
  getStatusColor(status: string): string {
    switch (status) {
      case "completed":
        return "var(--primitive-success-500)";
      case "missed":
        return "var(--primitive-error-500)";
      case "in_progress":
        return "var(--primitive-warning-500)";
      default:
        return "var(--primitive-blue-500)";
    }
  }
}
