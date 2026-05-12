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
import { LoggerService, toLogContext } from "../../../core/services/logger.service";
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
import { TrainingScheduleStateService } from "./training-schedule-state.service";
import type {
  CalendarDateMarker,
  TrainingEntryContext,
  TrainingSession,
} from "./training-schedule.types";

function toLocalDateKey(date: Date | null | undefined): string {
  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

@Component({
  selector: "app-training-schedule",
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TrainingScheduleStateService],
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
  private readonly scheduleState = inject(TrainingScheduleStateService);
  private readonly trainingScheduleDataService = inject(TrainingScheduleDataService);
  private readonly supabase = inject(SupabaseService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly logger = inject(LoggerService);
  private readonly weatherCancellationService = inject(WeatherCancellationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  selectedDate = signal<Date>(new Date());
  showWeekNumbers = signal<boolean>(true);
  today = new Date();

  // Data state delegated to component-scoped service
  readonly sessions = this.scheduleState.sessions;
  readonly isLoading = this.scheduleState.isLoading;
  readonly hasError = this.scheduleState.hasError;
  readonly errorMessage = this.scheduleState.errorMessage;
  readonly userPracticeDays = this.scheduleState.userPracticeDays;
  readonly scheduleTrimmedWeeksCount = this.scheduleState.scheduleTrimmedWeeksCount;
  readonly dateMarkers = this.scheduleState.dateMarkers;
  readonly monthlyStats = this.scheduleState.monthlyStats;

  // Weather-related signals (delegate to service)
  readonly weatherAlert = this.weatherCancellationService.weatherAlert;
  readonly currentWeather = this.weatherCancellationService.currentWeather;
  readonly suggestedSubstitute = this.weatherCancellationService.suggestedSubstitute;
  readonly isGeneratingSubstitute = this.weatherCancellationService.isGeneratingSubstitute;

  // View mode: week or month
  viewMode = signal<"week" | "month">("week");

  // Runtime guard signals - prevent white screen crashes
  entryContext = signal<TrainingEntryContext | null>(null);
  merlinSessionId = signal<string | null>(null);
  merlinReturnDraft = signal(
    "I reviewed the training schedule. Help me decide the next session or adjustment.",
  );

  private readonly currentUser = computed(() => this.supabase.currentUser());

  private readonly currentUserRole = computed(() => {
    const metadata = this.currentUser()?.user_metadata as { role?: string } | undefined;
    return metadata?.role || "player";
  });

  readonly isCoach = computed(() => {
    const role = this.currentUserRole();
    return ["coach", "assistant_coach", "admin"].includes(role);
  });

  readonly primaryActionLabel = computed(() =>
    this.isCoach() ? "Create Session" : "Go to Today's Practice",
  );

  readonly upcomingSessionsSubtitle = computed(() => {
    if (this.scheduleState.isLoading()) {
      return "";
    }
    const days = this.scheduleState.userPracticeDays();
    if (days.length > 0) {
      return `Program workouts are placed on your team practice days (${this.formatPracticeDaysShort(days)}), in weekly order.`;
    }
    return "From your assigned program, scheduled on each week's planned weekdays.";
  });

  readonly scheduleTrimNotice = computed(() => {
    if (this.scheduleState.isLoading()) {
      return null;
    }
    const n = this.scheduleState.scheduleTrimmedWeeksCount();
    if (n <= 0) {
      return null;
    }
    return n === 1
      ? "At least one week here has more programmed workouts than your selected practice days. Extra sessions are not listed."
      : `${n} weeks in this range have more programmed workouts than your selected practice days. Extra sessions are not listed.`;
  });

  filteredSessions = computed(() => {
    const allSessions = this.scheduleState.sessions();
    const selected = this.selectedDate();

    if (!selected) {
      return [];
    }

    const selectedDateStr = toLocalDateKey(selected);

    const dateSessions = allSessions
      .filter((session) => toLocalDateKey(session.date) === selectedDateStr)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (dateSessions.length === 0) {
      return allSessions
        .filter((session) => toLocalDateKey(session.date) >= selectedDateStr)
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, UI_LIMITS.UPCOMING_SESSIONS_COUNT);
    }

    return dateSessions;
  });

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
    for (const [key, color] of Object.entries(typeColors)) {
      if (type.toLowerCase().includes(key.toLowerCase())) {
        return color;
      }
    }
    return "var(--p-primary-500)";
  }

  getDateMarker(date: Date): CalendarDateMarker | undefined {
    const dateStr = toLocalDateKey(date);
    return this.scheduleState.dateMarkers().find((m) => toLocalDateKey(m.date) === dateStr);
  }

  ngOnInit(): void {
    this.observeRouteState();
    this.reloadSchedule();
    this.checkWeatherForTodaysSessions();
  }

  @HostListener("wheel", ["$event"])
  onWheelOverDatepicker(event: WheelEvent): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (!target?.closest("p-datepicker")) {
      return;
    }
    const root = document.querySelector('[data-scroll-root="app-shell-main"]') as HTMLElement | null;
    if (!root) {
      return;
    }
    root.scrollTop += event.deltaY;
    event.preventDefault();
  }

  trackSession(session: TrainingSession): string {
    return `${session.id}-${session.date.getTime()}`;
  }

  loadSessions(): void {
    this.reloadSchedule();
  }

  private reloadSchedule(): void {
    const userId = this.currentUser()?.id;
    if (!userId) return;
    void this.scheduleState.loadAll(this.selectedDate(), userId);
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
            this.logger.debug("Updated schedule date from query param", { date: dateParam });
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
      const userId = this.currentUser()?.id;
      if (userId) await this.scheduleState.loadAll(this.selectedDate(), userId);
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
          this.reloadSchedule();
          this.checkWeatherForTodaysSessions();
        }
        break;
      }
      default:
        break;
    }
  }

  private buildEntryContext(source: string | null, focus: string | null): TrainingEntryContext | null {
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
        title: "Merlin sent you here to review today's training plan",
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
      return "I'm in the training builder now. Help me shape the best session for this date and goal.";
    }

    if (focus === "today") {
      return "I reviewed today's training schedule. What should I prioritize or adjust based on what's planned?";
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

  private checkWeatherForTodaysSessions(): void {
    const selected = this.selectedDate();
    const now = new Date();
    const hoursDiff = (selected.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > 24 || hoursDiff < -24) {
      return;
    }

    this.weatherCancellationService
      .getTodaysWeatherSensitiveSessions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (weatherSessions) => {
          if (weatherSessions.length > 0) {
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
                    this.logger.warn("Failed to check weather:", toLogContext(error));
                  },
                });
            }
          }
        },
        error: (error) => {
          this.logger.warn("Failed to load weather-sensitive sessions:", toLogContext(error));
        },
      });
  }

  onDateSelect(date: Date): void {
    if (!date) return;
    this.dismissEntryContext();

    const previousDate = this.selectedDate();
    this.logger.debug("Date selected", {
      date: toLocalDateKey(date),
      previousDate: toLocalDateKey(previousDate),
    });

    this.selectedDate.set(date);

    const dateDiff = Math.abs(
      (date.getTime() - (previousDate?.getTime() || 0)) / (1000 * 60 * 60 * 24),
    );

    if (dateDiff > 7 || this.viewMode() === "month" || !previousDate) {
      this.logger.debug("Reloading sessions for new date range", { dateDiff });
      this.reloadSchedule();
    } else {
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
    this.reloadSchedule();
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
    this.logger.debug("Navigating to session creation form", { date: selectedDateStr });
  }

  viewSession(session: TrainingSession): void {
    this.dismissEntryContext();
    this.router.navigate(["/training/session", session.id]);
  }

  async markComplete(event: Event, session: TrainingSession): Promise<void> {
    event.stopPropagation();
    this.dismissEntryContext();

    if (session.isTemplate) {
      this.toastService.warn(TOAST.WARN.START_SESSION_FIRST);
      return;
    }

    try {
      const { error } = await this.trainingScheduleDataService.markSessionComplete(session.id);

      if (error) {
        throw new Error(error.message);
      }

      this.scheduleState.updateSessionStatus(session.id, "completed");
      this.toastService.success(TOAST.SUCCESS.SESSION_COMPLETED);
    } catch (error) {
      this.logger.error("Error marking session complete:", error);
      this.toastService.error(TOAST.ERROR.SESSION_UPDATE_FAILED);
    }
  }

  async startTemplateSession(event: Event, session: TrainingSession): Promise<void> {
    event.stopPropagation();
    this.dismissEntryContext();

    const user = this.currentUser();
    if (!user?.id) {
      this.toastService.error(TOAST.ERROR.LOGIN_TO_START);
      return;
    }

    try {
      const { sessionId, error } = await this.trainingScheduleDataService.startTemplateSession({
        userId: user.id,
        sessionDate: toLocalDateKey(session.date),
        sessionType: session.type,
        durationMinutes: session.duration,
      });

      if (error) {
        throw new Error(error.message);
      }

      this.scheduleState.replaceTemplateWithActual(session.id, sessionId ?? session.id);
      this.toastService.success(TOAST.SUCCESS.SESSION_STARTED);

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
  ): "success" | "info" | "warning" | "secondary" | "contrast" | "danger" | null | undefined {
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

  toggleViewMode(): void {
    const newMode = this.viewMode() === "week" ? "month" : "week";
    this.viewMode.set(newMode);
    this.reloadSchedule();
  }

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

  dismissWeatherAlert(): void {
    this.weatherCancellationService.clearWeatherAlert();
  }

  generateSubstituteWorkout(): void {
    const outdoorSession = this.filteredSessions().find(
      (s) => s.isOutdoor && s.weatherSensitive && s.isTemplate,
    );

    if (!outdoorSession) {
      this.toastService.warn("No outdoor sessions found to generate substitute for");
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
            this.toastService.success("Session cancelled. Alternative workout ready!");
            this.scheduleState.updateSessionStatus(session.id, "missed");
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

  acceptSubstituteWorkout(): void {
    const substitute = this.suggestedSubstitute();
    if (!substitute?.id) {
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
          this.weatherCancellationService.clearSuggestedSubstitute();
        },
      });
  }

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

  private navigateToSmartForm(queryParams: Record<string, string | number | undefined>): void {
    this.router.navigate(["/training/smart-form"], { queryParams });
  }

  private navigateToTrainingLog(queryParams: Record<string, string | number | undefined>): void {
    this.router.navigate(["/training/log"], { queryParams });
  }

  getWarmUpPreview(warmUp: string | undefined): string {
    if (!warmUp) return "Dynamic warm-up routine";
    const firstLine = warmUp.split("\n")[0];
    return firstLine.length > 100 ? firstLine.substring(0, 100) + "..." : firstLine;
  }

  getCoolDownPreview(coolDown: string | undefined): string {
    if (!coolDown) return "Static stretching and recovery";
    const firstLine = coolDown.split("\n")[0];
    return firstLine.length > 100 ? firstLine.substring(0, 100) + "..." : firstLine;
  }

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
