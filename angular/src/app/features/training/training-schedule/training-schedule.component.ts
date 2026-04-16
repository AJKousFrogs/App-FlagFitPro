import { isPlatformBrowser } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  HostListener,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, ParamMap, Router, RouterModule } from "@angular/router";
import { type CheckboxChangeEvent } from "primeng/checkbox";
import { CheckboxComponent } from "../../../shared/components/checkbox/checkbox.component";
import { DatePicker } from "primeng/datepicker";
import { Skeleton } from "primeng/skeleton";

import { UI_LIMITS } from "../../../core/constants/app.constants";
import { LoggerService } from "../../../core/services/logger.service";
import { toLogContext } from "../../../core/services/logger.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { TrainingScheduleDataService } from "../services/training-schedule-data.service";
import { ToastService } from "../../../core/services/toast.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import {
  WeatherCancellationService,
  WeatherSensitiveSession,
} from "../../../core/services/weather-cancellation.service";
import { AlertComponent } from "../../../shared/components/alert/alert.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageErrorStateComponent } from "../../../shared/components/page-error-state/page-error-state.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { getStatusSeverity as getStatusSeverityValue } from "../../../shared/utils/status.utils";
import { mapProgramTemplatesToUserPracticeDays } from "../../../shared/utils/training-template.utils";

function toLocalDateKey(date: Date | null | undefined): string {
  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface TrainingSession {
  id: string;
  date: Date;
  type: string;
  duration: number;
  /** Maps DB status (planned/in_progress/completed/cancelled) to UI status */
  status: "scheduled" | "completed" | "missed" | "in_progress" | "replaced";
  /** Whether this is a template (from 52-week program) or actual logged session */
  isTemplate: boolean;
  /** Whether this is a team practice session */
  isTeamPractice?: boolean;
  /** Whether this session is outdoors and weather-sensitive */
  isOutdoor?: boolean;
  /** Whether weather alerts should be shown for this session */
  weatherSensitive?: boolean;
}

interface CalendarDateMarker {
  date: Date;
  status: "scheduled" | "completed" | "missed" | "in_progress" | "replaced";
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

interface TrainingEntryContext {
  title: string;
  message: string;
}

@Component({
  selector: "app-training-schedule",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DatePicker,
    Skeleton,
    CheckboxComponent,
    MainLayoutComponent,
    PageHeaderComponent,
    AlertComponent,
    ButtonComponent,
    CardShellComponent,
    EmptyStateComponent,
    PageErrorStateComponent,
    RouterModule,
  ],
  templateUrl: "./training-schedule.component.html",

  styleUrl: "./training-schedule.component.scss",
})
export class TrainingScheduleComponent implements OnInit {
  private trainingScheduleDataService = inject(TrainingScheduleDataService);
  private supabase = inject(SupabaseService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private logger = inject(LoggerService);
  private weatherCancellationService = inject(WeatherCancellationService);
  private destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  selectedDate = signal<Date>(new Date());
  sessions = signal<TrainingSession[]>([]);
  isLoading = signal<boolean>(false);
  showWeekNumbers = signal<boolean>(true);
  today = new Date();

  // Weather-related signals (delegate to service)
  readonly weatherAlert = this.weatherCancellationService.weatherAlert;
  readonly currentWeather = this.weatherCancellationService.currentWeather;
  readonly suggestedSubstitute =
    this.weatherCancellationService.suggestedSubstitute;
  readonly isGeneratingSubstitute =
    this.weatherCancellationService.isGeneratingSubstitute;

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
  entryContext = signal<TrainingEntryContext | null>(null);
  merlinSessionId = signal<string | null>(null);
  merlinReturnDraft = signal(
    "I reviewed the training schedule. Help me decide the next session or adjustment.",
  );

  /** Saved onboarding / Settings: team practice days (aligns program to these days). */
  readonly userPracticeDays = signal<string[]>([]);

  /** Weeks in the loaded range where program sessions exceeded selected practice days. */
  readonly scheduleTrimmedWeeksCount = signal<number>(0);

  readonly upcomingSessionsSubtitle = computed(() => {
    if (this.isLoading()) {
      return "";
    }
    const days = this.userPracticeDays();
    if (days.length > 0) {
      return `Program workouts are placed on your team practice days (${this.formatPracticeDaysShort(
        days,
      )}), in weekly order.`;
    }
    return "From your assigned program, scheduled on each week’s planned weekdays.";
  });

  readonly scheduleTrimNotice = computed(() => {
    if (this.isLoading()) {
      return null;
    }
    const n = this.scheduleTrimmedWeeksCount();
    if (n <= 0) {
      return null;
    }
    return n === 1
      ? "At least one week here has more programmed workouts than your selected practice days. Extra sessions are not listed."
      : `${n} weeks in this range have more programmed workouts than your selected practice days. Extra sessions are not listed.`;
  });

  private readonly currentUser = computed(() => this.supabase.currentUser());

  private readonly currentUserRole = computed(() => {
    const metadata = this.currentUser()?.user_metadata as
      | { role?: string }
      | undefined;
    return metadata?.role || "player";
  });

  readonly isCoach = computed(() => {
    const role = this.currentUserRole();
    return ["coach", "assistant_coach", "admin"].includes(role);
  });

  readonly primaryActionLabel = computed(() =>
    this.isCoach() ? "Create Session" : "Go to Today's Practice",
  );

  // Sessions filtered based on selected date
  filteredSessions = computed(() => {
    const allSessions = this.sessions();
    const selected = this.selectedDate();

    if (!selected) {
      return [];
    }

    // Get selected date string (YYYY-MM-DD)
    const selectedDateStr = toLocalDateKey(selected);

    // Filter sessions for the selected date
    const dateSessions = allSessions
      .filter((session) => {
        const sessionDateStr = toLocalDateKey(session.date);
        return sessionDateStr === selectedDateStr;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // If no sessions for selected date, show upcoming sessions from selected date onwards
    if (dateSessions.length === 0) {
      const upcomingSessions = allSessions
        .filter((session) => {
          const sessionDateStr = toLocalDateKey(session.date);
          return sessionDateStr >= selectedDateStr;
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, UI_LIMITS.UPCOMING_SESSIONS_COUNT);
      return upcomingSessions;
    }

    return dateSessions;
  });

  // Computed: Get session type color for calendar markers
  getSessionTypeColor(type: string): string {
    const typeColors: Record<string, string> = {
      Strength: "var(--primitive-blue-500)",
      Conditioning: "var(--color-status-success)",
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
    const dateStr = toLocalDateKey(date);
    return this.dateMarkers().find(
      (m) => toLocalDateKey(m.date) === dateStr,
    );
  }

  ngOnInit(): void {
    this.observeRouteState();

    this.loadSessions();
    this.loadMonthlyStats();
    this.loadDateMarkers();
    this.checkWeatherForTodaysSessions();
  }

  /**
   * Inline PrimeNG datepicker often handles wheel for month navigation, which
   * prevents the app shell scroll root from receiving scroll. Forward wheel
   * delta to the main scroll container when the pointer is over the calendar.
   */
  @HostListener("wheel", ["$event"])
  onWheelOverDatepicker(event: WheelEvent): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (!target?.closest("p-datepicker")) {
      return;
    }
    const root = document.querySelector(
      '[data-scroll-root="app-shell-main"]',
    ) as HTMLElement | null;
    if (!root) {
      return;
    }
    root.scrollTop += event.deltaY;
    event.preventDefault();
  }

  trackSession(session: TrainingSession): string {
    return `${session.id}-${session.date.getTime()}`;
  }

  private formatPracticeDaysShort(labels: string[]): string {
    const short: Record<string, string> = {
      monday: "Mon",
      tuesday: "Tue",
      wednesday: "Wed",
      thursday: "Thu",
      friday: "Fri",
      saturday: "Sat",
      sunday: "Sun",
    };
    return labels
      .map((l) => short[l.trim().toLowerCase()] ?? l.trim())
      .join(", ");
  }

  private observeRouteState(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryParams) => {
        void this.applyRouteState(queryParams);
      });
  }

  private async applyRouteState(queryParams: ParamMap): Promise<void> {
    let shouldReload = false;
    const source = queryParams.get("source");
    const focus = queryParams.get("focus");
    if (source === "merlin") {
      this.entryContext.set(this.buildEntryContext(source, focus));
      this.merlinSessionId.set(queryParams.get("session"));
      this.merlinReturnDraft.set(this.buildMerlinReturnDraft(focus));
      this.consumeMerlinRouteParams(["source", "focus", "session"]);
    }

    const dateParam = queryParams.get("date");
    if (dateParam) {
      try {
        const parsedDate = new Date(dateParam);
        if (isNaN(parsedDate.getTime())) {
          this.logger.warn("Invalid date query parameter", { date: dateParam });
        } else {
          const previousDate = toLocalDateKey(this.selectedDate());
          const nextDate = toLocalDateKey(parsedDate);
          if (previousDate !== nextDate) {
            this.selectedDate.set(parsedDate);
            shouldReload = true;
            this.logger.debug("Updated schedule date from query param", {
              date: dateParam,
            });
          }
        }
      } catch (_error) {
        this.logger.warn("Invalid date query parameter", { date: dateParam });
      }
    }

    const viewParam = queryParams.get("view");
    if (viewParam === "week" || viewParam === "month") {
      if (this.viewMode() !== viewParam) {
        this.viewMode.set(viewParam);
        shouldReload = true;
      }
    }

    if (shouldReload) {
      await this.loadSessions();
      await this.loadMonthlyStats();
      await this.loadDateMarkers();
      this.checkWeatherForTodaysSessions();
    }

    this.handleRouteFocus(queryParams.get("focus"));
  }

  private handleRouteFocus(focus: string | null): void {
    switch (focus) {
      case "create-session":
        break;
      case "today": {
        const todayKey = toLocalDateKey(this.today);
        const selectedKey = toLocalDateKey(this.selectedDate());
        if (todayKey !== selectedKey) {
          this.selectedDate.set(new Date(this.today));
          void this.loadSessions();
          void this.loadMonthlyStats();
          void this.loadDateMarkers();
          this.checkWeatherForTodaysSessions();
        }
        break;
      }
      default:
        break;
    }
  }

  private buildEntryContext(
    source: string | null,
    focus: string | null,
  ): TrainingEntryContext | null {
    if (source !== "merlin") {
      return null;
    }

    if (focus === "create-session") {
      return {
        title: "Merlin sent you here to build the next session",
        message:
          "Review the selected date, then use Create Session to turn the recommendation into a concrete practice or workout.",
      };
    }

    if (focus === "today") {
      return {
        title: "Merlin sent you here to review today’s training plan",
        message:
          "Check the current date, planned sessions, and any schedule adjustments before you train.",
      };
    }

    return {
      title: "Merlin sent you here for training follow-through",
      message:
        "Use this schedule to confirm timing, choose the right session, or create the next training block.",
    };
  }

  private buildMerlinReturnDraft(focus: string | null): string {
    if (focus === "create-session") {
      return "I’m in the training builder now. Help me shape the best session for this date and goal.";
    }

    if (focus === "today") {
      return "I reviewed today’s training schedule. What should I prioritize or adjust based on what’s planned?";
    }

    return "I reviewed the training schedule. Help me choose the next best training action.";
  }

  private consumeMerlinRouteParams(paramNames: string[]): void {
    const consumedParams = Object.fromEntries(
      paramNames.map((paramName) => [paramName, null]),
    );

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: consumedParams,
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  }

  dismissEntryContext(): void {
    this.entryContext.set(null);
  }

  /**
   * Check weather conditions for today's outdoor sessions
   */
  private checkWeatherForTodaysSessions(): void {
    // Only check weather if viewing today or a date in the next 24 hours
    const selected = this.selectedDate();
    const now = new Date();
    const hoursDiff = (selected.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > 24 || hoursDiff < -24) {
      return; // Don't check weather for dates far in the past/future
    }

    // Get today's weather-sensitive sessions and check weather
    this.weatherCancellationService
      .getTodaysWeatherSensitiveSessions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (weatherSessions) => {
          if (weatherSessions.length > 0) {
            // Check weather for the first outdoor session found
            const outdoorSession = weatherSessions.find((s) => s.isOutdoor);
            if (outdoorSession) {
              this.weatherCancellationService
                .checkWeatherForTraining(outdoorSession)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                  next: ({ weather: _weather, alert }) => {
                    if (alert) {
                      this.logger.info("Weather alert detected", {
                        severity: alert.severity,
                        reason: alert.reason,
                      });
                    }
                  },
                  error: (error) => {
                    this.logger.warn(
                      "Failed to check weather:",
                      toLogContext(error),
                    );
                  },
                });
            }
          }
        },
        error: (error) => {
          this.logger.warn(
            "Failed to load weather-sensitive sessions:",
            toLogContext(error),
          );
        },
      });
  }

  async loadSessions(): Promise<void> {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.userPracticeDays.set([]);
    this.scheduleTrimmedWeeksCount.set(0);

    try {
      const user = this.currentUser();
      if (!user?.id) {
        this.logger.warn("No user found, cannot load sessions");
        this.isLoading.set(false);
        return;
      }

      // Calculate date range based on selected date
      // If selected date is in the future, load from selected date to 2 weeks out
      // If selected date is today or in the past, load from selected date to 2 weeks out
      const selected = this.selectedDate();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Use selected date or default to tomorrow
      const startDate =
        selected && selected >= today ? new Date(selected) : new Date(today);
      startDate.setHours(0, 0, 0, 0);

      // If selected date is in the past, include it and load sessions around it
      if (selected && selected < today) {
        startDate.setTime(selected.getTime());
        startDate.setHours(0, 0, 0, 0);
      }

      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 14);

      // Alias for backward compatibility
      const startOfWeek = startDate;
      const endOfWeek = endDate;

      // 1–2. Actual sessions, program templates, and onboarding practice days
      const [
        { sessions: actualSessions, error: sessionsError },
        { templates: scheduledTemplates, error: templatesError },
        { practiceDays, error: prefsError },
      ] = await Promise.all([
        this.trainingScheduleDataService.fetchActualSessions({
          userId: user.id,
          startDate: toLocalDateKey(startOfWeek),
          endDate: toLocalDateKey(endOfWeek),
        }),
        this.trainingScheduleDataService.fetchScheduledTemplates({
          userId: user.id,
          startDate: toLocalDateKey(startOfWeek),
          endDate: toLocalDateKey(endOfWeek),
        }),
        this.trainingScheduleDataService.fetchPracticeDays(user.id),
      ]);

      if (prefsError) {
        this.logger.debug("Could not load practice days for schedule mapping", {
          message: prefsError.message,
        });
      }

      this.userPracticeDays.set(practiceDays);

      if (sessionsError) {
        throw new Error(sessionsError.message);
      }

      // Map actual sessions
      const mappedActualSessions: TrainingSession[] = (
        actualSessions || []
      ).map((session) => ({
        id: session.id,
        date: new Date(session.session_date),
        type: session.session_type || "Training",
        duration: session.duration_minutes || 60,
        status: this.mapDbStatusToUiStatus(session.status),
        isTemplate: false,
      }));

      // Map scheduled templates to sessions (if no template error)
      let mappedScheduledSessions: TrainingSession[] = [];
      if (!templatesError && scheduledTemplates) {
        this.logger.debug("Found scheduled templates", {
          count: scheduledTemplates.length,
        });

        const actualDates = new Set(
          mappedActualSessions.map((session) => toLocalDateKey(session.date)),
        );

        const withWeekData = scheduledTemplates.filter((template) => {
          const weeks = template.training_weeks;
          return Array.isArray(weeks)
            ? weeks.length > 0
            : !!(weeks && typeof weeks === "object" && "start_date" in weeks);
        });

        const mapped = mapProgramTemplatesToUserPracticeDays(
          withWeekData,
          practiceDays,
        );

        this.scheduleTrimmedWeeksCount.set(mapped.weeksWhereSessionsWereTrimmed);

        mappedScheduledSessions = mapped.placed.map(({ template, sessionDate }) => {
          const templateRecord = template as unknown as Record<string, unknown>;

          return {
            id: template.id,
            date: sessionDate,
            type:
              template.session_name || template.session_type || "Training",
            duration: template.duration_minutes || 60,
            status: actualDates.has(toLocalDateKey(sessionDate))
              ? "replaced"
              : ("scheduled" as const),
            isTemplate: true,
            isTeamPractice:
              (templateRecord.is_team_practice as boolean) || false,
            isOutdoor: (templateRecord.is_outdoor as boolean) || false,
            weatherSensitive:
              (templateRecord.weather_sensitive as boolean) || false,
          };
        });

        this.logger.debug("Mapped scheduled sessions", {
          count: mappedScheduledSessions.length,
        });
      } else if (templatesError) {
        this.logger.error("Error loading templates", templatesError);
      } else {
        this.logger.debug("No scheduled templates found for date range");
      }

      // Combine templates and actual sessions so overrides are visible
      const allSessions: TrainingSession[] = [
        ...mappedScheduledSessions,
        ...mappedActualSessions,
      ].sort((a, b) => {
        if (a.date.getTime() !== b.date.getTime()) {
          return a.date.getTime() - b.date.getTime();
        }
        if (a.isTemplate !== b.isTemplate) {
          return a.isTemplate ? 1 : -1;
        }
        return 0;
      });

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
    this.dismissEntryContext();

    const previousDate = this.selectedDate();
    this.logger.debug("Date selected", {
      date: toLocalDateKey(date),
      previousDate: toLocalDateKey(previousDate),
    });

    // Update the selected date
    this.selectedDate.set(date);

    // Check if date changed significantly (more than 7 days difference)
    const dateDiff = Math.abs(
      (date.getTime() - (previousDate?.getTime() || 0)) / (1000 * 60 * 60 * 24),
    );

    // Always reload sessions when date changes significantly or when in month view
    // This ensures we load sessions for the selected date range
    if (dateDiff > 7 || this.viewMode() === "month" || !previousDate) {
      this.logger.debug("Reloading sessions for new date range", { dateDiff });
      this.loadSessions();
    } else {
      // For small date changes in week view, sessions are already loaded
      // The filteredSessions computed will automatically filter to the selected date
      this.logger.debug("Small date change, using existing sessions");
    }
  }

  onShowWeekToggle(checked: boolean | undefined): void {
    this.dismissEntryContext();
    this.showWeekNumbers.set(!!checked);
  }

  onShowWeekToggleChange(event: CheckboxChangeEvent): void {
    this.onShowWeekToggle(event.checked);
  }

  setViewMode(mode: "week" | "month"): void {
    this.dismissEntryContext();
    this.viewMode.set(mode);
    this.loadSessions();
  }

  primaryAction(dismissContext = true): void {
    if (dismissContext) {
      this.dismissEntryContext();
    }
    if (!this.isCoach()) {
      this.router.navigate(["/todays-practice"]);
      return;
    }
    const selectedDateStr = toLocalDateKey(this.selectedDate());
    this.navigateToSmartForm(selectedDateStr ? { date: selectedDateStr } : {});
    this.logger.debug("Navigating to session creation form", {
      date: selectedDateStr,
    });
  }

  viewSession(session: TrainingSession): void {
    this.dismissEntryContext();
    // Navigate to session detail view for both templates and actual sessions
    this.router.navigate(["/training/session", session.id]);
  }

  async markComplete(event: Event, session: TrainingSession): Promise<void> {
    event.stopPropagation();
    this.dismissEntryContext();

    // Only allow marking complete for actual sessions (not templates)
    if (session.isTemplate) {
      this.toastService.warn(TOAST.WARN.START_SESSION_FIRST);
      return;
    }

    try {
      const { error } =
        await this.trainingScheduleDataService.markSessionComplete(session.id);

      if (error) {
        throw new Error(error.message);
      }

      // Update local state
      this.sessions.update((sessions) =>
        this.updateSessionStatus(sessions, session.id, "completed"),
      );

      this.toastService.success(TOAST.SUCCESS.SESSION_COMPLETED);
    } catch (error) {
      this.logger.error("Error marking session complete:", error);
      this.toastService.error(TOAST.ERROR.SESSION_UPDATE_FAILED);
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
    this.dismissEntryContext();

    const user = this.currentUser();
    if (!user?.id) {
      this.toastService.error(TOAST.ERROR.LOGIN_TO_START);
      return;
    }

    try {
      // Create a new training session from the template
      // Note: athlete_id is required by RLS policy, user_id is for backward compatibility
      const { sessionId, error } =
        await this.trainingScheduleDataService.startTemplateSession({
          userId: user.id,
          sessionDate: toLocalDateKey(session.date),
          sessionType: session.type,
          durationMinutes: session.duration,
        });

      if (error) {
        throw new Error(error.message);
      }

      // Update local state - replace template with actual session
      this.sessions.update((sessions) =>
        sessions.map((s) =>
          s.id === session.id
            ? {
                ...s,
                id: sessionId ?? session.id,
                status: "in_progress" as const,
                isTemplate: false,
              }
            : s,
        ),
      );

      this.toastService.success(TOAST.SUCCESS.SESSION_STARTED);

      // Navigate to the training log to complete the session
      // The training log allows logging RPE, duration, and completing the session
      this.navigateToTrainingLog({
        sessionId: sessionId ?? session.id,
        type: session.type,
        duration: session.duration,
      });
    } catch (error) {
      this.logger.error("Error starting session:", error);
      this.toastService.error(TOAST.ERROR.SESSION_START_FAILED);
    }
  }

  getStatusSeverity(
    status: string,
  ):
    | "success"
    | "info"
    | "warning"
    | "secondary"
    | "contrast"
    | "danger"
    | null
    | undefined {
    return getStatusSeverityValue(status);
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case "completed":
        return "pi pi-check-circle";
      case "missed":
        return "pi pi-times-circle";
      case "in_progress":
        return "pi pi-spin pi-spinner";
      case "replaced":
        return "pi pi-refresh";
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
      case "replaced":
        return "Replaced";
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
  ): "scheduled" | "completed" | "missed" | "in_progress" | "replaced" {
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
      const userId = this.getCurrentUserId();
      if (!userId) return;

      const { startDate, endDate } = this.getSelectedMonthRange();

      const { sessions, error } =
        await this.trainingScheduleDataService.fetchDateMarkers({
          userId,
          startDate,
          endDate,
        });

      if (error) {
        this.logger.warn("Failed to load date markers:", toLogContext(error));
        return;
      }

      const markers: CalendarDateMarker[] = (sessions || []).map((s) => ({
        date: new Date(s.session_date),
        status: this.mapDbStatusToUiStatus(s.status),
        sessionType: s.session_type || "Training",
        tooltip: `${s.session_type || "Training"} - ${this.mapDbStatusToUiStatus(s.status)}`,
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
      const userId = this.getCurrentUserId();
      if (!userId) return;

      const { startDate, endDate } = this.getSelectedMonthRange();

      const { sessions, error } =
        await this.trainingScheduleDataService.fetchMonthlyStats({
          userId,
          startDate,
          endDate,
        });

      if (error) {
        this.logger.warn("Failed to load monthly stats:", toLogContext(error));
        return;
      }

      const total = sessions?.length || 0;
      const completed =
        sessions?.filter((s) => s.status === "completed").length || 0;
      const missed =
        sessions?.filter((s) => s.status === "cancelled").length || 0;
      const totalDuration =
        sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;

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
        return "var(--color-status-success)";
      case "missed":
        return "var(--primitive-error-500)";
      case "in_progress":
        return "var(--primitive-warning-500)";
      default:
        return "var(--primitive-blue-500)";
    }
  }

  // ============================================================================
  // Weather Cancellation & Substitute Workout Methods
  // ============================================================================

  /**
   * Dismiss the weather alert
   */
  dismissWeatherAlert(): void {
    this.weatherCancellationService.clearWeatherAlert();
  }

  /**
   * Generate a substitute workout for the current weather alert
   */
  generateSubstituteWorkout(): void {
    // Find the first outdoor, weather-sensitive session for today
    const outdoorSession = this.filteredSessions().find(
      (s) => s.isOutdoor && s.weatherSensitive && s.isTemplate,
    );

    if (!outdoorSession) {
      this.toastService.warn(
        "No outdoor sessions found to generate substitute for",
      );
      return;
    }

    const weatherSensitiveSession: WeatherSensitiveSession = {
      id: outdoorSession.id,
      sessionName: outdoorSession.type,
      sessionType: outdoorSession.type,
      isOutdoor: true,
      isTeamPractice: outdoorSession.isTeamPractice || false,
      weatherSensitive: true,
      durationMinutes: outdoorSession.duration,
    };

    const weather = this.currentWeather();

    this.weatherCancellationService
      .generateSubstituteWorkout(weatherSensitiveSession, weather, "weather")
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (substitute) => {
          if (substitute) {
            this.toastService.success("Alternative workout generated!");
          } else {
            this.toastService.error("Failed to generate alternative workout");
          }
        },
        error: (error) => {
          this.logger.error("Error generating substitute:", error);
          this.toastService.error("Failed to generate alternative workout");
        },
      });
  }

  /**
   * Cancel a specific session due to weather and get substitute
   */
  cancelForWeather(event: Event, session: TrainingSession): void {
    event.stopPropagation();

    const weather = this.currentWeather();
    if (!weather) {
      this.toastService.warn("Weather data not available");
      return;
    }

    const weatherSensitiveSession: WeatherSensitiveSession = {
      id: session.id,
      sessionName: session.type,
      sessionType: session.type,
      isOutdoor: session.isOutdoor || true,
      isTeamPractice: session.isTeamPractice || false,
      weatherSensitive: true,
      durationMinutes: session.duration,
    };

    this.weatherCancellationService
      .cancelSessionForWeather(session.id, weatherSensitiveSession, weather)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (substitute) => {
          if (substitute) {
            this.toastService.success(
              "Session cancelled. Alternative workout ready!",
            );
            // Update the session in local state to show as cancelled
            this.sessions.update((sessions) =>
              this.updateSessionStatus(sessions, session.id, "missed"),
            );
          } else {
            this.toastService.error("Failed to cancel session");
          }
        },
        error: (error) => {
          this.logger.error("Error cancelling session:", error);
          this.toastService.error("Failed to cancel session");
        },
      });
  }

  /**
   * Accept the suggested substitute workout
   */
  acceptSubstituteWorkout(): void {
    const substitute = this.suggestedSubstitute();
    if (!substitute?.id) {
      // If no ID, the substitute wasn't saved yet - just navigate to start it
      this.toastService.success("Starting substitute workout...");
      this.navigateToSmartForm({
        substituteType: substitute?.workoutType,
        duration: substitute?.durationMinutes,
      });
      this.weatherCancellationService.clearSuggestedSubstitute();
      return;
    }

    this.weatherCancellationService
      .acceptSubstituteWorkout(substitute.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (success) => {
          if (success) {
            this.toastService.success("Workout accepted! Let's go!");
            // Navigate to workout execution page or show workout details
            this.navigateToSmartForm({
              substituteId: substitute.id,
              substituteType: substitute.workoutType,
            });
          } else {
            this.toastService.error("Failed to accept workout");
          }
        },
        error: () => {
          this.toastService.error("Failed to accept workout");
        },
      });
  }

  /**
   * Decline the suggested substitute workout
   */
  declineSubstituteWorkout(): void {
    const substitute = this.suggestedSubstitute();
    if (!substitute?.id) {
      this.weatherCancellationService.clearSuggestedSubstitute();
      this.toastService.info("Maybe next time!");
      return;
    }

    this.weatherCancellationService
      .declineSubstituteWorkout(substitute.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.info("Workout declined. Rest up!");
        },
        error: () => {
          // Still clear it locally even if the API call failed
          this.weatherCancellationService.clearSuggestedSubstitute();
        },
      });
  }

  /**
   * Get human-readable location label
   */
  getLocationLabel(locationType: string | undefined): string {
    switch (locationType) {
      case "home":
        return "At Home";
      case "gym":
        return "Gym";
      case "indoor_facility":
        return "Indoor Facility";
      default:
        return "Indoor";
    }
  }

  private getCurrentUserId(): string | null {
    return this.currentUser()?.id ?? null;
  }

  private getSelectedMonthRange(): {
    startDate: string;
    endDate: string;
  } {
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

    return {
      startDate: toLocalDateKey(startOfMonth),
      endDate: toLocalDateKey(endOfMonth),
    };
  }

  private navigateToSmartForm(
    queryParams: Record<string, string | number | undefined>,
  ): void {
    this.router.navigate(["/training/smart-form"], {
      queryParams,
    });
  }

  private navigateToTrainingLog(
    queryParams: Record<string, string | number | undefined>,
  ): void {
    this.router.navigate(["/training/log"], {
      queryParams,
    });
  }

  private updateSessionStatus(
    sessions: TrainingSession[],
    sessionId: string,
    status: TrainingSession["status"],
  ): TrainingSession[] {
    return sessions.map((session) =>
      session.id === sessionId ? { ...session, status } : session,
    );
  }

  /**
   * Get warm-up preview text (first line or truncated)
   */
  getWarmUpPreview(warmUp: string | undefined): string {
    if (!warmUp) return "Dynamic warm-up routine";
    const firstLine = warmUp.split("\n")[0];
    return firstLine.length > 100
      ? firstLine.substring(0, 100) + "..."
      : firstLine;
  }

  /**
   * Get cool-down preview text (first line or truncated)
   */
  getCoolDownPreview(coolDown: string | undefined): string {
    if (!coolDown) return "Static stretching and recovery";
    const firstLine = coolDown.split("\n")[0];
    return firstLine.length > 100
      ? firstLine.substring(0, 100) + "..."
      : firstLine;
  }

  /**
   * Format a session date, omitting time for midnight (template) sessions.
   */
  formatSessionDate(date: Date): string {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    const datePart = `${month} ${day}, ${year}`;
    if (hours === 0 && minutes === 0) {
      return datePart;
    }
    const h = hours % 12 || 12;
    const m = String(minutes).padStart(2, "0");
    const ampm = hours < 12 ? "AM" : "PM";
    return `${datePart} at ${h}:${m} ${ampm}`;
  }
}
