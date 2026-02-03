import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  DestroyRef,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { Checkbox } from "primeng/checkbox";
import { DatePicker } from "primeng/datepicker";
import { Skeleton } from "primeng/skeleton";

import { UI_LIMITS } from "../../../core/constants/app.constants";
import { AuthService } from "../../../core/services/auth.service";
import { LoggerService } from "../../../core/services/logger.service";
import { toLogContext } from "../../../core/services/logger.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { ToastService } from "../../../core/services/toast.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import {
  WeatherCancellationService,
  WeatherSensitiveSession,
} from "../../../core/services/weather-cancellation.service";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { getStatusSeverity as getStatusSeverityValue } from "../../../shared/utils/status.utils";

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

@Component({
  selector: "app-training-schedule",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CommonModule,
    DatePicker,
    Skeleton,
    Checkbox,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    CardShellComponent,
    RouterModule,
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

        <app-card-shell title="Training Hub" headerIcon="pi-compass">
          <div class="training-hub-grid">
            <a routerLink="/training/log" class="training-hub-link">
              <span class="training-hub-icon">📓</span>
              <span class="training-hub-title">Training Log</span>
              <span class="training-hub-subtitle">History and notes</span>
            </a>
            <a routerLink="/training/builder" class="training-hub-link">
              <span class="training-hub-icon">🛠️</span>
              <span class="training-hub-title">Session Builder</span>
              <span class="training-hub-subtitle">Custom workouts</span>
            </a>
            <a routerLink="/training/advanced" class="training-hub-link">
              <span class="training-hub-icon">🧠</span>
              <span class="training-hub-title">Advanced Tools</span>
              <span class="training-hub-subtitle">Periodization & AI</span>
            </a>
            <a routerLink="/training/smart-form" class="training-hub-link">
              <span class="training-hub-icon">⚡</span>
              <span class="training-hub-title">Smart Form</span>
              <span class="training-hub-subtitle">Quick logging</span>
            </a>
            <a routerLink="/workout" class="training-hub-link">
              <span class="training-hub-icon">🏋️</span>
              <span class="training-hub-title">Workouts</span>
              <span class="training-hub-subtitle">Ready-made plans</span>
            </a>
            <a routerLink="/training/videos" class="training-hub-link">
              <span class="training-hub-icon">🎥</span>
              <span class="training-hub-title">Video Feed</span>
              <span class="training-hub-subtitle">Technique library</span>
            </a>
          </div>
        </app-card-shell>

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
                  <span class="legend-item">
                    <i class="pi pi-refresh legend-replaced"></i>
                    Replaced
                  </span>
                </div>
              </div>

              <!-- Show Week Numbers Checkbox -->
              <div class="show-week-toggle">
                <p-checkbox
                  [ngModel]="showWeekNumbers()"
                  (ngModelChange)="onShowWeekToggle($event)"
                  [binary]="true"
                  variant="filled"
                  inputId="showWeekNumbers"
                ></p-checkbox>
                <label
                  for="showWeekNumbers"
                  [attr.aria-label]="'Toggle week numbers display on calendar'"
                >
                  Show Week Numbers
                </label>
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

          <!-- Weather Alert Card -->
          @if (weatherAlert()) {
            <div
              class="weather-alert"
              [class.weather-alert--danger]="
                weatherAlert()?.severity === 'danger'
              "
              [class.weather-alert--warning]="
                weatherAlert()?.severity === 'warning'
              "
            >
              <div class="weather-alert__icon">
                <i
                  class="pi"
                  [class.pi-exclamation-triangle]="
                    weatherAlert()?.severity === 'danger'
                  "
                  [class.pi-info-circle]="
                    weatherAlert()?.severity === 'warning'
                  "
                ></i>
              </div>
              <div class="weather-alert__content">
                <h4 class="weather-alert__title">
                  @if (weatherAlert()?.severity === "danger") {
                    Weather Advisory
                  } @else {
                    Weather Notice
                  }
                </h4>
                <p class="weather-alert__reason">
                  {{ weatherAlert()?.reason }}
                </p>
                <p class="weather-alert__recommendation">
                  {{ weatherAlert()?.recommendation }}
                </p>
                @if (currentWeather()) {
                  <p class="weather-alert__conditions">
                    <i class="pi pi-cloud"></i>
                    Current: {{ currentWeather()?.temp }}°F,
                    {{ currentWeather()?.condition }}
                    @if (currentWeather()?.windSpeed) {
                      <span class="weather-wind">
                        <i class="pi pi-arrows-h"></i>
                        {{ currentWeather()?.windSpeed }} mph wind
                      </span>
                    }
                  </p>
                }
              </div>
              <div class="weather-alert__actions">
                @if (!weatherAlert()?.canProceed) {
                  <app-button
                    variant="primary"
                    size="sm"
                    iconLeft="pi-home"
                    (clicked)="generateSubstituteWorkout()"
                    [loading]="isGeneratingSubstitute()"
                  >
                    Get Indoor Alternative
                  </app-button>
                }
                <app-button
                  variant="text"
                  size="sm"
                  (clicked)="dismissWeatherAlert()"
                >
                  Dismiss
                </app-button>
              </div>
            </div>
          }

          <!-- Substitute Workout Card -->
          @if (suggestedSubstitute()) {
            <app-card-shell
              title="Substitute Workout Available"
              headerIcon="pi-bolt"
              class="substitute-workout-card"
            >
              <div class="substitute-workout">
                <div class="substitute-workout__header">
                  <h3 class="substitute-workout__name">
                    {{ suggestedSubstitute()?.workoutName }}
                  </h3>
                  <div class="substitute-workout__badges">
                    <span class="badge badge--info">
                      <i class="pi pi-map-marker"></i>
                      {{
                        getLocationLabel(suggestedSubstitute()?.locationType)
                      }}
                    </span>
                    <span class="badge badge--secondary">
                      <i class="pi pi-clock"></i>
                      {{ suggestedSubstitute()?.durationMinutes }} min
                    </span>
                    <span class="badge badge--secondary">
                      {{ suggestedSubstitute()?.intensityLevel | titlecase }}
                      intensity
                    </span>
                  </div>
                </div>

                <p class="substitute-workout__description">
                  {{ suggestedSubstitute()?.description }}
                </p>

                <!-- Equipment Needed -->
                @if (suggestedSubstitute()?.equipmentNeeded?.length) {
                  <div class="substitute-workout__equipment">
                    <h4><i class="pi pi-box"></i> Equipment Needed</h4>
                    <div class="equipment-list">
                      @for (
                        item of suggestedSubstitute()?.equipmentNeeded;
                        track item
                      ) {
                        <span class="equipment-item">{{ item }}</span>
                      }
                    </div>
                  </div>
                }

                <!-- Workout Structure Preview -->
                <div class="substitute-workout__preview">
                  <div class="workout-phase">
                    <h4><i class="pi pi-play"></i> Warm-Up</h4>
                    <p>{{ getWarmUpPreview(suggestedSubstitute()?.warmUp) }}</p>
                  </div>

                  <div class="workout-phase">
                    <h4>
                      <i class="pi pi-bolt"></i> Main Workout ({{
                        suggestedSubstitute()?.mainWorkout?.length
                      }}
                      exercises)
                    </h4>
                    <ul class="exercise-preview-list">
                      @for (
                        exercise of suggestedSubstitute()?.mainWorkout?.slice(
                          0,
                          3
                        );
                        track exercise.name
                      ) {
                        <li>
                          <strong>{{ exercise.name }}</strong>
                          @if (exercise.sets && exercise.reps) {
                            - {{ exercise.sets }} × {{ exercise.reps }}
                          } @else if (exercise.durationSeconds) {
                            - {{ exercise.durationSeconds }}s
                          }
                        </li>
                      }
                      @if (
                        (suggestedSubstitute()?.mainWorkout?.length || 0) > 3
                      ) {
                        <li class="more-exercises">
                          +
                          {{
                            (suggestedSubstitute()?.mainWorkout?.length || 0) -
                              3
                          }}
                          more exercises...
                        </li>
                      }
                    </ul>
                  </div>

                  <div class="workout-phase">
                    <h4><i class="pi pi-stop"></i> Cool-Down</h4>
                    <p>
                      {{ getCoolDownPreview(suggestedSubstitute()?.coolDown) }}
                    </p>
                  </div>
                </div>

                <!-- Training Goals -->
                @if (suggestedSubstitute()?.trainingGoals?.length) {
                  <div class="substitute-workout__goals">
                    <h4><i class="pi pi-flag"></i> Training Goals</h4>
                    <div class="goals-list">
                      @for (
                        goal of suggestedSubstitute()?.trainingGoals;
                        track goal
                      ) {
                        <span class="goal-tag">{{ goal }}</span>
                      }
                    </div>
                  </div>
                }

                <!-- Action Buttons -->
                <div class="substitute-workout__actions">
                  <app-button
                    variant="primary"
                    iconLeft="pi-check"
                    (clicked)="acceptSubstituteWorkout()"
                  >
                    Start This Workout
                  </app-button>
                  <app-button
                    variant="outlined"
                    iconLeft="pi-refresh"
                    (clicked)="generateSubstituteWorkout()"
                    [loading]="isGeneratingSubstitute()"
                  >
                    Generate Different
                  </app-button>
                  <app-button
                    variant="text"
                    (clicked)="declineSubstituteWorkout()"
                  >
                    Not Today
                  </app-button>
                </div>
              </div>
            </app-card-shell>
          }

          <!-- Monthly Statistics Summary -->
          @if (viewMode() === "month" && monthlyStats().totalSessions > 0) {
            <app-card-shell title="Monthly Summary" headerIcon="pi-chart-bar">
              <div class="monthly-stats">
                <div class="stat-item stat-block stat-block--large">
                  <div class="stat-block__content">
                    <span class="stat-block__value">{{
                      monthlyStats().totalSessions
                    }}</span>
                    <span class="stat-block__label">Total Sessions</span>
                  </div>
                </div>
                <div class="stat-item completed stat-block stat-block--large">
                  <div class="stat-block__content">
                    <span class="stat-block__value">{{
                      monthlyStats().completedSessions
                    }}</span>
                    <span class="stat-block__label">Completed</span>
                  </div>
                </div>
                <div class="stat-item missed stat-block stat-block--large">
                  <div class="stat-block__content">
                    <span class="stat-block__value">{{
                      monthlyStats().missedSessions
                    }}</span>
                    <span class="stat-block__label">Missed</span>
                  </div>
                </div>
                <div class="stat-item stat-block stat-block--large">
                  <div class="stat-block__content">
                    <span class="stat-block__value"
                      >{{ monthlyStats().totalDuration }}m</span
                    >
                    <span class="stat-block__label">Total Duration</span>
                  </div>
                </div>
                <div class="stat-item completion stat-block stat-block--large">
                  <div class="stat-block__content">
                    <span class="stat-block__value"
                      >{{ monthlyStats().completionRate }}%</span
                    >
                    <span class="stat-block__label">Completion Rate</span>
                  </div>
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
                    [attr.title]="
                      session.status === 'replaced'
                        ? 'Planned session replaced by a logged workout'
                        : null
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
                      <h4 class="session-title">
                        {{ session.type }}
                        @if (session.status === "replaced") {
                          <span class="status-pill status-pill--replaced">
                            <i class="pi pi-refresh"></i>
                            Replaced
                          </span>
                        }
                        @if (
                          !session.isTemplate && session.status === "completed"
                        ) {
                          <span class="status-pill status-pill--logged">
                            <i class="pi pi-check"></i>
                            Logged
                          </span>
                        }
                        @if (session.isTeamPractice) {
                          <span class="team-badge">
                            <i class="pi pi-users"></i> Team
                          </span>
                        }
                        @if (session.isOutdoor && session.weatherSensitive) {
                          <span
                            class="outdoor-badge"
                            [title]="'Weather-sensitive outdoor session'"
                          >
                            <i class="pi pi-sun"></i>
                          </span>
                        }
                      </h4>
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
                        <span
                          [attr.title]="
                            session.status === 'replaced'
                              ? 'Planned session replaced by a logged workout'
                              : null
                          "
                        >
                          {{ getStatusLabel(session.status) }}
                        </span>
                      </span>
                      <!-- Weather cancel button for outdoor sessions -->
                      @if (
                        session.isOutdoor &&
                        session.weatherSensitive &&
                        session.isTemplate &&
                        weatherAlert()?.severity === "danger"
                      ) {
                        <app-button
                          variant="outlined"
                          size="sm"
                          iconLeft="pi-cloud"
                          severity="warning"
                          (clicked)="cancelForWeather($event, session)"
                        >
                          Cancel &amp; Get Alternative
                        </app-button>
                      }
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
                      @if (
                        session.isTemplate && session.status !== "replaced"
                      ) {
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
  private route = inject(ActivatedRoute);
  private logger = inject(LoggerService);
  private weatherCancellationService = inject(WeatherCancellationService);
  private destroyRef = inject(DestroyRef);

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

  // Sessions filtered based on selected date
  filteredSessions = computed(() => {
    const allSessions = this.sessions();
    const selected = this.selectedDate();

    if (!selected) {
      return [];
    }

    // Get selected date string (YYYY-MM-DD)
    const selectedDateStr = selected.toISOString().split("T")[0];

    // Filter sessions for the selected date
    const dateSessions = allSessions
      .filter((session) => {
        const sessionDateStr = session.date.toISOString().split("T")[0];
        return sessionDateStr === selectedDateStr;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // If no sessions for selected date, show upcoming sessions from selected date onwards
    if (dateSessions.length === 0) {
      const upcomingSessions = allSessions
        .filter((session) => {
          const sessionDateStr = session.date.toISOString().split("T")[0];
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
    // Check for date query parameter
    const dateParam = this.route.snapshot.queryParams["date"];
    if (dateParam) {
      try {
        const parsedDate = new Date(dateParam);
        if (!isNaN(parsedDate.getTime())) {
          this.selectedDate.set(parsedDate);
          this.logger.debug("Initialized with date from query param", {
            date: dateParam,
          });
        }
      } catch (_error) {
        this.logger.warn("Invalid date query parameter", { date: dateParam });
      }
    }

    this.loadSessions();
    this.loadMonthlyStats();
    this.loadDateMarkers();
    this.checkWeatherForTodaysSessions();
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

    try {
      const user = this.authService.getUser();
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

      // 1. Fetch actual training sessions (logged/completed sessions)
      const { data: actualSessions, error: sessionsError } =
        await this.supabaseService.client
          .from("training_sessions")
          .select(
            `
          id,
          session_date,
          session_type,
          duration_minutes,
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
          is_team_practice,
          is_outdoor,
          weather_sensitive,
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
          mappedActualSessions.map(
            (session) => session.date.toISOString().split("T")[0],
          ),
        );

        mappedScheduledSessions = scheduledTemplates
          .filter((template) => {
            // training_weeks can be an array or single object from Supabase join
            const weeks = template.training_weeks;
            // Check if it's an array with data OR a single object with start_date
            const hasWeekData = Array.isArray(weeks)
              ? weeks.length > 0
              : weeks && typeof weeks === "object" && "start_date" in weeks;
            return hasWeekData;
          })
          .map((template) => {
            // Handle both array and single object response from Supabase
            const weeks = template.training_weeks;
            const weekData = Array.isArray(weeks)
              ? (weeks[0] as { start_date: string; week_number: number })
              : (weeks as { start_date: string; week_number: number });

            // Parse date string as local date to avoid timezone issues
            const dateStr = weekData.start_date.split("T")[0]; // Get just YYYY-MM-DD
            const [year, month, day] = dateStr.split("-").map(Number);
            const weekStart = new Date(year, month - 1, day, 0, 0, 0, 0);

            const sessionDate = new Date(weekStart);
            sessionDate.setDate(
              weekStart.getDate() + (template.day_of_week || 0),
            );

            return {
              id: template.id,
              date: sessionDate,
              type:
                template.session_name || template.session_type || "Training",
              duration: template.duration_minutes || 60,
              status: actualDates.has(sessionDate.toISOString().split("T")[0])
                ? "replaced"
                : ("scheduled" as const),
              isTemplate: true,
              isTeamPractice:
                ((template as Record<string, unknown>)
                  .is_team_practice as boolean) || false,
              isOutdoor:
                ((template as Record<string, unknown>).is_outdoor as boolean) ||
                false,
              weatherSensitive:
                ((template as Record<string, unknown>)
                  .weather_sensitive as boolean) || false,
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

    const previousDate = this.selectedDate();
    this.logger.debug("Date selected", {
      date: date.toISOString().split("T")[0],
      previousDate: previousDate?.toISOString().split("T")[0],
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
    // Navigate to session detail view for both templates and actual sessions
    this.router.navigate(["/training/session", session.id]);
  }

  async markComplete(event: Event, session: TrainingSession): Promise<void> {
    event.stopPropagation();

    // Only allow marking complete for actual sessions (not templates)
    if (session.isTemplate) {
      this.toastService.warn(TOAST.WARN.START_SESSION_FIRST);
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

    const user = this.authService.getUser();
    if (!user?.id) {
      this.toastService.error(TOAST.ERROR.LOGIN_TO_START);
      return;
    }

    try {
      // Create a new training session from the template
      // Note: athlete_id is required by RLS policy, user_id is for backward compatibility
      const { data, error } = await this.supabaseService.client
        .from("training_sessions")
        .insert({
          athlete_id: user.id,
          user_id: user.id,
          session_date: session.date.toISOString().split("T")[0],
          session_type: session.type,
          duration_minutes: session.duration,
          status: "in_progress",
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

      this.toastService.success(TOAST.SUCCESS.SESSION_STARTED);

      // Navigate to the training log to complete the session
      // The training log allows logging RPE, duration, and completing the session
      this.router.navigate(["/training/log"], {
        queryParams: {
          sessionId: data.id,
          type: session.type,
          duration: session.duration,
        },
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
        .select("session_date, session_type, status")
        .eq("user_id", user.id)
        .gte("session_date", startOfMonth.toISOString().split("T")[0])
        .lte("session_date", endOfMonth.toISOString().split("T")[0]);

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
        .select("status, duration_minutes")
        .eq("user_id", user.id)
        .gte("session_date", startOfMonth.toISOString().split("T")[0])
        .lte("session_date", endOfMonth.toISOString().split("T")[0]);

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
        return "var(--primitive-success-500)";
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
              sessions.map((s) =>
                s.id === session.id ? { ...s, status: "missed" as const } : s,
              ),
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
      this.router.navigate(["/training/smart-form"], {
        queryParams: {
          substituteType: substitute?.workoutType,
          duration: substitute?.durationMinutes,
        },
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
            this.router.navigate(["/training/smart-form"], {
              queryParams: {
                substituteId: substitute.id,
                substituteType: substitute.workoutType,
              },
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
}
