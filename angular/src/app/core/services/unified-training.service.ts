import {
    DestroyRef,
    Injectable,
    computed,
    effect,
    inject,
    signal,
} from "@angular/core";
import { Observable, catchError, combineLatest, finalize, firstValueFrom, from, map, of, shareReplay } from "rxjs";

import {
    DailyRoutineSlot,
    SmartRecommendationsResponse,
    TodayScheduleItem,
    TrainingSessionRecord,
} from "../models/api.models";
import type { ApiResponse } from "../models/common.models";
import type { SupplementEntry } from "../models/supplement.models";
import {
  extractApiPayload,
  isSuccessfulApiResponse,
} from "../utils/api-response-mapper";
import {
    Achievement,
    ReadinessStatus,
    TrainingDataResult,
    TrainingStatCard,
    WeeklyScheduleDay,
    WellnessAlert,
    Workout,
} from "../models/training.models";
import { AcwrService } from "./acwr.service";
import { ApiService, API_ENDPOINTS } from "./api.service";
import { AuthService } from "./auth.service";
import { LoggerService, toLogContext } from "./logger.service";
import {
    PerformanceDataService,
    PhysicalMeasurement,
} from "./performance-data.service";
import {
  type ProtocolMetricsSnapshot,
} from "../utils/protocol-metrics-presentation";
import {
  calculateReadinessScoreFromWellness,
  calculateTrainingStreak,
  calculateTrainingStatsFromSessions,
  generateTrainingInsight,
  generateWellnessAlertFromStatus,
  getReadinessStatusFromScore,
  loadAchievementsForProgress,
  type WellnessCheckinRecord,
} from "../utils/unified-training-presenters";
import {
  loadDailyProtocolSnapshot,
  loadTrainingRecommendationsSnapshot,
} from "../utils/unified-training-loaders";
import {
  getUnifiedTrainingFallbackData,
  loadUnifiedTrainingData,
} from "../utils/unified-training-data";
import {
  markWorkoutCompleteSnapshot,
  postponeWorkoutSnapshot,
} from "../utils/unified-training-mutations";
import {
  loadAvailableWorkoutsSnapshot,
  loadTrainingSessionsSnapshot,
  loadWeeklyScheduleSnapshot,
} from "../utils/unified-training-schedule";
import {
  getStartOfTrainingWeek,
  isDateInCurrentTrainingWeek,
  transformSessionRecordToWorkout,
} from "../utils/unified-training-transforms";
import {
    PlayerProgramService,
    ProgramAssignment,
} from "./player-program.service";
import { ReadinessService } from "./readiness.service";
import { SupabaseService } from "./supabase.service";
import { TrainingDataService } from "./training-data.service";
import { WellnessService } from "./wellness.service";
// Note: WellnessCheckinData is defined locally below

/**
 * Today overview data structure
 */
interface TodayOverviewData {
  protocol?: { data?: ProtocolMetricsSnapshot | null };
  readiness?: unknown;
  recommendations?: { data?: SmartRecommendationsResponse };
  trainingData?: TrainingDataResult;
}

const DEFAULT_DAILY_ROUTINE: DailyRoutineSlot[] = [
  { id: "wake", label: "Wake Up", time: "07:00", icon: "pi-sun" },
  { id: "breakfast", label: "Breakfast", time: "08:15", icon: "pi-apple" },
  {
    id: "work_start",
    label: "Work/Study Start",
    time: "09:00",
    icon: "pi-briefcase",
  },
  { id: "lunch", label: "Lunch", time: "12:30", icon: "pi-utensils" },
  {
    id: "work_end",
    label: "Work/Study End",
    time: "17:00",
    icon: "pi-home",
  },
  {
    id: "training",
    label: "Daily Training",
    time: "18:00",
    icon: "pi-bolt",
  },
  {
    id: "shower",
    label: "Shower (Hot)",
    time: "20:00",
    icon: "pi-info-circle",
  },
  { id: "sleep", label: "Sleep", time: "22:30", icon: "pi-moon" },
];

@Injectable({
  providedIn: "root",
})
export class UnifiedTrainingService {
  private acwrService = inject(AcwrService);
  private readinessService = inject(ReadinessService);
  private trainingDataService = inject(TrainingDataService);
  private performanceDataService = inject(PerformanceDataService);
  private wellnessService = inject(WellnessService);
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);
  private playerProgramService = inject(PlayerProgramService);
  private supabase = inject(SupabaseService);
  private _destroyRef = inject(DestroyRef);
  private overviewRequest$: Observable<unknown> | null = null;
  private lastOverviewRequestKey: string | null = null;
  private authFailureCooldownUntil = 0;
  private readonly _dailyRoutine = signal<DailyRoutineSlot[]>(
    this.cloneDefaultDailyRoutine(),
  );

  private isExpectedApiClientError(error: unknown): boolean {
    if (!error || typeof error !== "object") return false;
    const e = error as {
      status?: unknown;
      url?: unknown;
      isExpectedApiFailure?: unknown;
    };
    if (e.isExpectedApiFailure === true) return true;
    const status = typeof e.status === "number" ? e.status : undefined;
    if (!status || ![400, 401, 403, 404].includes(status)) return false;
    const url = typeof e.url === "string" ? e.url : "";
    return url.includes("/api/") || url === "";
  }

  // Program assignment state
  private _programAssignment = signal<ProgramAssignment | null>(null);
  private _hasProgramAssignment = signal<boolean | null>(null); // null = not checked yet

  /**
   * Current program assignment for the user
   * Returns null if no program assigned
   */
  readonly programAssignment = this._programAssignment.asReadonly();

  /**
   * Whether user has an active program assigned
   * null = not checked yet, true = has program, false = no program
   */
  readonly hasProgramAssignment = this._hasProgramAssignment.asReadonly();

  // ============================================================================
  // CORE REACTIVE STATE (Signals)
  // ============================================================================

  // Per audit: use currentUser() signal for reactivity, not getUser() method
  private userId = computed(() => this.authService.currentUser()?.id);

  // Expose key metrics as signals (facade pattern)
  readonly acwrRatio = this.acwrService.acwrRatio;
  readonly acuteLoad = this.acwrService.acuteLoad;
  readonly chronicLoad = this.acwrService.chronicLoad;
  readonly weeklyProgression = this.acwrService.weeklyProgression;
  readonly acwrRiskZone = this.acwrService.riskZone;

  /**
   * Get recommended training modification using evidence-based thresholds
   */
  getTrainingModification() {
    return this.acwrService.getTrainingModification();
  }

  /**
   * Get raw ACWR data for deep dives
   */
  acwrData() {
    return this.acwrService.acwrData();
  }

  // CRITICAL: Return null when no data, not a fake default
  // UI should handle null by showing "No data" or prompting for check-in
  readonly readinessScore = computed(
    () => this.readinessService.current()?.score ?? null,
  );
  readonly readinessLevel = computed(
    () => this.readinessService.current()?.level ?? null,
  );

  /**
   * Get severity color for PrimeNG Tag
   */
  getReadinessSeverity(level: string): "success" | "warning" | "danger" {
    if (level === "high") return "success";
    if (level === "moderate") return "warning";
    return "danger";
  }

  readonly hasCheckedInToday = computed(() => {
    const current = this.readinessService.current();
    if (!current) return false;
    return (current.wellnessIndex?.completeness || 0) > 0;
  });

  // Body Composition Facade
  readonly latestMeasurement = this.performanceDataService.latestMeasurement;
  readonly recentMeasurements = this.performanceDataService.recentMeasurements;

  // Hydration Facade
  readonly latestWellness = this.wellnessService.latestWellnessEntry;
  readonly hydrationLevel = computed(
    () => this.latestWellness()?.hydration || 0,
  );

  // Training specific state moved from TrainingStateService
  private readonly _userName = signal<string>("");
  readonly userName = this._userName.asReadonly();

  private readonly _userPosition = signal<string>("");
  readonly userPosition = this._userPosition.asReadonly();
  readonly dailyRoutine = this._dailyRoutine.asReadonly();

  private readonly _trainingStats = signal<TrainingStatCard[]>([]);
  readonly trainingStats = this._trainingStats.asReadonly();

  private readonly _weeklySchedule = signal<WeeklyScheduleDay[]>([]);
  readonly weeklySchedule = this._weeklySchedule.asReadonly();

  readonly todaysScheduleItems = computed((): TodayScheduleItem[] => {
    const weekly = this._weeklySchedule();
    const today = weekly.find((day) => day.isToday);
    const sessions = today?.sessions || [];
    const userRoutine = this._dailyRoutine();

    const todaysSupplements =
      this.performanceDataService.todaysSupplements() as SupplementEntry[];

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const getStatus = (
      itemTime: string,
    ): "completed" | "in-progress" | "upcoming" => {
      const [h, m] = itemTime.split(":").map(Number);
      if (currentHour > h || (currentHour === h && currentMinute >= m + 30))
        return "completed";
      if (currentHour === h || (currentHour === h - 1 && currentMinute >= 45))
        return "in-progress";
      return "upcoming";
    };

    const getItemType = (slotId: string): TodayScheduleItem["type"] => {
      if (slotId === "breakfast" || slotId === "lunch") return "nutrition";
      if (slotId === "wake" || slotId === "sleep") return "wellness";
      return "recovery";
    };

    const items: TodayScheduleItem[] = [];

    // 1. Add User Routine Items
    userRoutine.forEach((slot: DailyRoutineSlot) => {
      // Skip the 'training' slot from routine if we have actual sessions to add later
      if (slot.id === "training" && sessions.length > 0) return;

      const item: TodayScheduleItem = {
        id: `routine-${slot.id}`,
        time: slot.time,
        title: slot.label,
        type: getItemType(slot.id),
        duration: slot.id === "work_start" ? 480 : 30,
        status: getStatus(slot.time),
        description:
          slot.id === "breakfast" ? "Include supplements" : slot.label,
        icon: slot.icon,
        supplements:
          slot.id === "breakfast" && todaysSupplements.length > 0
            ? todaysSupplements.filter((s) => s.timeOfDay === "morning")
            : undefined,
      };

      items.push(item);
    });

    // 2. Add Actual Training Sessions
    sessions.forEach((s, idx) => {
      const time = s.time && s.time !== "TBD" ? s.time : "18:00";
      items.push({
        id: `session-${idx}`,
        time: time,
        title: s.title || "Daily Training",
        type: s.type === "game" ? "game" : "training",
        status: getStatus(time),
        duration: s.duration || 90,
        description: s.description || "Main session of the day",
      });
    });

    // Sort all items by time
    return items.sort((a, b) => a.time.localeCompare(b.time));
  });

  /**
   * Get tomorrow's schedule items (for preview on dashboard)
   */
  readonly tomorrowScheduleItems = computed((): TodayScheduleItem[] => {
    const weekly = this._weeklySchedule();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const _tomorrowStr = tomorrow.toISOString().split("T")[0]; // Reserved for future API calls
    const tomorrowDayOfWeek = tomorrow.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Find tomorrow in weekly schedule (convert Sunday=0 to Monday=0 format)
    const scheduleDayIndex =
      tomorrowDayOfWeek === 0 ? 6 : tomorrowDayOfWeek - 1;
    const tomorrowSchedule = weekly[scheduleDayIndex];

    if (
      !tomorrowSchedule ||
      !tomorrowSchedule.sessions ||
      tomorrowSchedule.sessions.length === 0
    ) {
      return [];
    }

    const sessions = tomorrowSchedule.sessions;
    const userRoutine = this._dailyRoutine();

    const getItemType = (slotId: string): TodayScheduleItem["type"] => {
      if (slotId === "breakfast" || slotId === "lunch") return "nutrition";
      if (slotId === "wake" || slotId === "sleep") return "wellness";
      return "recovery";
    };

    const items: TodayScheduleItem[] = [];

    // Add routine items (excluding training if we have sessions)
    userRoutine.forEach((slot: DailyRoutineSlot) => {
      if (slot.id === "training" && sessions.length > 0) return;

      const item: TodayScheduleItem = {
        id: `routine-${slot.id}`,
        time: slot.time,
        title: slot.label,
        type: getItemType(slot.id),
        duration: slot.id === "work_start" ? 480 : 30,
        status: "upcoming", // All tomorrow items are upcoming
        description:
          slot.id === "breakfast" ? "Include supplements" : slot.label,
        icon: slot.icon,
      };

      items.push(item);
    });

    // Add training sessions
    sessions.forEach((s, idx) => {
      const time = s.time && s.time !== "TBD" ? s.time : "18:00";
      items.push({
        id: `session-${idx}`,
        time: time,
        title: s.title || "Daily Training",
        type: s.type === "game" ? "game" : "training",
        status: "upcoming",
        duration: s.duration || 90,
        description: s.description || "Main session of the day",
      });
    });

    // Sort all items by time
    return items.sort((a, b) => a.time.localeCompare(b.time));
  });

  private readonly _workouts = signal<Workout[]>([]);
  readonly workouts = this._workouts.asReadonly();

  private readonly _achievements = signal<Achievement[]>([]);
  readonly achievements = this._achievements.asReadonly();

  constructor() {
    effect(() => {
      const currentUserId = this.userId();
      if (!currentUserId) {
        this._dailyRoutine.set(this.cloneDefaultDailyRoutine());
        return;
      }

      void this.loadPlayerSettingsRoutine();
    });
  }

  private readonly _todayProtocol = signal<ProtocolMetricsSnapshot | null>(null);
  readonly todayProtocol = this._todayProtocol.asReadonly();

  private readonly _wellnessAlert = signal<WellnessAlert | null>(null);
  readonly wellnessAlert = this._wellnessAlert.asReadonly();

  private readonly _isRefreshing = signal(false);
  readonly isRefreshing = this._isRefreshing.asReadonly();

  private readonly _aiInsight = signal<string>("");
  readonly aiInsight = this._aiInsight.asReadonly();

  // ============================================================================
  // MAIN DATA ORCHESTRATION
  // ============================================================================

  /**
   * Get everything needed for the "Today" view in one coordinated call
   * This now also populates the internal signals for global consistency
   *
   * Uses direct Supabase for protocol data when API is not available
   */
  getTodayOverview(date?: string) {
    const context = this.getTodayOverviewContext(date);
    if (!context) {
      return of(null);
    }

    if (
      this.overviewRequest$ &&
      this.lastOverviewRequestKey === context.requestKey
    ) {
      return this.overviewRequest$;
    }

    this._isRefreshing.set(true);

    const request$ = this.createTodayOverviewRequest(
      context.userId,
      context.targetDate,
    );

    this.overviewRequest$ = request$;
    this.lastOverviewRequestKey = context.requestKey;
    return request$;
  }

  private getTodayOverviewContext(date?: string): {
    userId: string;
    targetDate: string;
    requestKey: string;
  } | null {
    const now = Date.now();
    if (now < this.authFailureCooldownUntil) {
      this._todayProtocol.set(null);
      return null;
    }

    if (!this.authService.isAuthenticated()) {
      this._todayProtocol.set(null);
      return null;
    }

    const session = this.supabase.session();
    if (!session?.access_token) {
      this._todayProtocol.set(null);
      return null;
    }

    const userId = this.userId();
    if (!userId) {
      this._todayProtocol.set(null);
      return null;
    }

    const targetDate = date || new Date().toISOString().split("T")[0];
    return {
      userId,
      targetDate,
      requestKey: `${userId}:${targetDate}`,
    };
  }

  private createTodayOverviewRequest(userId: string, targetDate: string) {
    return combineLatest({
      protocol: from(
        loadDailyProtocolSnapshot({
          userId,
          date: targetDate,
          api: this.api,
          supabase: this.supabase,
          logger: this.logger,
          isExpectedApiClientError: (error) =>
            this.isExpectedApiClientError(error),
        }),
      ),
      readiness: this.readinessService.calculateToday(userId).pipe(
        catchError((err) => {
          if (!this.isExpectedApiClientError(err)) {
            this.logger.warn("[UnifiedTraining] Readiness unavailable", err);
          }
          return of(null);
        }),
      ),
      recommendations: from(
        loadTrainingRecommendationsSnapshot({
          userId,
          supabase: this.supabase,
          logger: this.logger,
        }),
      ),
      trainingData: from(this.loadAllTrainingData()),
    }).pipe(
      map((data) => this.handleTodayOverviewSuccess(data)),
      catchError((err) => this.handleTodayOverviewFailure(err)),
      finalize(() => this.resetTodayOverviewRequest()),
      shareReplay(1),
    );
  }

  private handleTodayOverviewSuccess(data: {
    protocol: { data: ProtocolMetricsSnapshot | null };
    readiness: unknown;
    recommendations: { data: SmartRecommendationsResponse | null };
    trainingData: TrainingDataResult;
  }) {
    this._todayProtocol.set(data.protocol?.data ?? null);
    const insight = this.generateAiInsight(data as unknown as TodayOverviewData);
    this._aiInsight.set(insight);
    return {
      ...data,
      aiInsight: insight,
    };
  }

  private handleTodayOverviewFailure(err: unknown) {
    this._todayProtocol.set(null);
    if (this.isExpectedApiClientError(err)) {
      this.authFailureCooldownUntil = Date.now() + 15_000;
    } else {
      this.logger.error("Error in getTodayOverview", err);
    }
    return of(null);
  }

  private resetTodayOverviewRequest() {
    this._isRefreshing.set(false);
    this.overviewRequest$ = null;
    this.lastOverviewRequestKey = null;
  }

  /**
   * Generate a daily protocol for a specific date
   * This creates the exercises with videos for the protocol blocks
   */
  generateDailyProtocol<T = unknown>(date?: string): Observable<ApiResponse<T>> {
    const targetDate = date || new Date().toISOString().split("T")[0];
    return this.api.post<T>(API_ENDPOINTS.dailyProtocol.generate, { date: targetDate });
  }

  /**
   * Get protocol for a specific date (for viewing tomorrow's training)
   */
  getProtocolForDate<T = unknown>(date: string): Observable<ApiResponse<T>> {
    return this.api.get<T>(API_ENDPOINTS.dailyProtocol.byDate(date));
  }

  /**
   * Load all training data (from TrainingDataLoader logic)
   */
  private async loadAllTrainingData(): Promise<TrainingDataResult> {
    const userId = this.userId();
    if (!userId) return getUnifiedTrainingFallbackData();

    try {
      const result = await loadUnifiedTrainingData({
        userId,
        loadProgramAssignment: () => this.loadProgramAssignment(),
        loadTrainingSessions: (currentUserId) =>
          this.loadTrainingSessions(currentUserId),
        loadWeeklySchedule: (currentUserId) =>
          this.loadWeeklySchedule(currentUserId),
        loadAvailableWorkouts: () => this.loadAvailableWorkouts(),
        checkWellnessForTraining: (currentUserId) =>
          this.checkWellnessForTraining(currentUserId),
        calculateTrainingStats: (sessions) =>
          this.calculateTrainingStats(sessions),
        calculateTrainingStreak: (sessions) =>
          calculateTrainingStreak(sessions),
        loadAchievements: (currentUserId, streak, total) =>
          this.loadAchievements(currentUserId, streak, total),
        getUserDisplayName: (currentUserId) =>
          this.getUserDisplayName(currentUserId),
      });

      this.applyTrainingDataResult(result);
      return result;
    } catch (error) {
      this.logger.error("Error loading all training data", error);
      return getUnifiedTrainingFallbackData();
    }
  }

  private applyTrainingDataResult(result: TrainingDataResult): void {
    this._userName.set(result.userName || "Athlete");
    this._trainingStats.set(result.stats);
    this._weeklySchedule.set(result.schedule);
    this._workouts.set(result.workouts);
    this._achievements.set(result.achievements);
    this._wellnessAlert.set(result.wellnessData.alert);
  }

  /**
   * Load user's program assignment from the API
   * Updates _programAssignment and _hasProgramAssignment signals
   */
  loadProgramAssignment(): void {
    // Only attempt to load if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.logger.info(
        "[UnifiedTrainingService] Skipping program load - user not authenticated",
      );
      this._programAssignment.set(null);
      this._hasProgramAssignment.set(false);
      return;
    }

    this.playerProgramService.getMyProgramAssignment().subscribe({
      next: (assignment) => {
        this._programAssignment.set(assignment);
        this._hasProgramAssignment.set(assignment !== null);

        if (assignment) {
          this.logger.info(
            `[UnifiedTrainingService] Program loaded: ${assignment.program.name}`,
          );
        } else {
          this.logger.info(
            "[UnifiedTrainingService] No active program assigned",
          );
        }
      },
      error: (error) => {
        this.logger.error(
          "[UnifiedTrainingService] Error loading program assignment:",
          error,
        );
        this._programAssignment.set(null);
        this._hasProgramAssignment.set(false);
      },
    });
  }

  /**
   * Check if user needs to be assigned a program
   * Returns true if user has no active program
   */
  needsProgramAssignment(): boolean {
    return this._hasProgramAssignment() === false;
  }

  // ============================================================================
  // UNIFIED LOGGING ACTIONS
  // ============================================================================

  /**
   * Unified logging - handles all downstream updates automatically
   */
  async logTrainingSession(sessionData: Record<string, unknown>) {
    this.logger.info("Logging training session via Unified Service");
    const result = await firstValueFrom(
      this.trainingDataService.createTrainingSession(
        sessionData as Parameters<
          typeof this.trainingDataService.createTrainingSession
        >[0],
      ),
    );

    this.refreshAfterMutation({ refreshReadiness: true });

    return result;
  }

  /**
   * Unified wellness submission
   */
  async submitWellness(data: Record<string, unknown>) {
    const result = await firstValueFrom(
      this.wellnessService.logWellness(
        data as Parameters<typeof this.wellnessService.logWellness>[0],
      ),
    );
    this.refreshAfterMutation({ refreshReadiness: true });
    return result;
  }

  applyPlayerSettingsSnapshot(settings: {
    dailyRoutine?: DailyRoutineSlot[] | null;
  }): void {
    if (!settings.dailyRoutine) {
      return;
    }

    this._dailyRoutine.set(this.normalizeDailyRoutine(settings.dailyRoutine));
  }

  async refreshPlayerSettings(): Promise<void> {
    await this.loadPlayerSettingsRoutine();
  }

  /**
   * Quick update for hydration
   * @param amountMl Amount in milliliters (converted to glasses, 1 glass = 250ml)
   */
  async addHydration(amountMl: number) {
    const current = this.latestWellness();
    const currentLevel =
      (current as { hydration?: number } | null)?.hydration || 0;

    // Database stores hydration in glasses (not ml)
    // Convert ml to glasses: 1 glass ≈ 250ml
    const glassesToAdd = Math.round(amountMl / 250);
    const newLevel = currentLevel + glassesToAdd;

    return this.submitWellness({
      ...((current as unknown as Record<string, unknown>) ?? {}),
      hydration: newLevel,
      date: new Date().toISOString().split("T")[0],
    });
  }

  /**
   * Log supplement intake
   */
  logSupplement(supplement: {
    name: string;
    taken: boolean;
    timeOfDay:
      | "morning"
      | "afternoon"
      | "evening"
      | "pre-workout"
      | "post-workout";
    date: string;
  }) {
    return this.performanceDataService.logSupplement(supplement);
  }

  /**
   * Log body composition measurement
   */
  async logBodyComp(measurement: Partial<PhysicalMeasurement>) {
    const result = await firstValueFrom(
      this.performanceDataService.logMeasurement(measurement),
    );
    if (isSuccessfulApiResponse(result)) {
      this.refreshAfterMutation();
    }
    return result;
  }

  /**
   * Get wellness for a specific day
   */
  getWellnessForDay<T = unknown>(date: string) {
    return this.api.get<T>(`/api/wellness/checkin?date=${date}`);
  }

  // ============================================================================
  // INTERNAL CALCULATORS & TRANSFORMERS (Ported from Loader)
  // ============================================================================

  private async loadTrainingSessions(
    userId: string,
  ): Promise<TrainingSessionRecord[]> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const start = ninetyDaysAgo.toISOString().split("T")[0]; // YYYY-MM-DD for DATE column

    return loadTrainingSessionsSnapshot({
      supabaseClient: this.supabase.client,
      userId,
      startDate: start,
      onError: (message, error) => {
        const queryError = error as { message?: string; code?: string };
        this.logger.error(
          `[UnifiedTrainingService] ${message}`,
          toLogContext({
            userId,
            dateRange: { start },
            error: queryError.message,
            code: queryError.code,
          }),
        );
      },
    });
  }

  private async loadWeeklySchedule(
    userId: string,
  ): Promise<WeeklyScheduleDay[]> {
    const today = new Date().toISOString().split("T")[0];
    const weekStart = getStartOfTrainingWeek();

    return loadWeeklyScheduleSnapshot({
      supabaseClient: this.supabase.client,
      userId,
      today,
      weekStart,
      onInfo: (message) =>
        this.logger.info(`[UnifiedTrainingService] ${message}`),
      onError: (message, error) =>
        this.logger.error(`[UnifiedTrainingService] ${message}:`, error),
    });
  }

  private async loadAvailableWorkouts(): Promise<Workout[]> {
    const userId = this.userId();
    // Return empty array if no user - don't show fake workouts
    if (!userId) {
      this.logger.info(
        "[UnifiedTrainingService] No user ID - returning empty workouts",
      );
      return [];
    }

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD for DATE column
    return loadAvailableWorkoutsSnapshot({
      supabaseClient: this.supabase.client,
      userId,
      today,
      toWorkout: (workout) => transformSessionRecordToWorkout(workout),
      onInfo: (message) =>
        this.logger.info(`[UnifiedTrainingService] ${message}`),
      onError: (message, error) => {
        const queryError = error as { message?: string; code?: string };
        this.logger.error(
          `[UnifiedTrainingService] ${message}`,
          toLogContext({
            userId,
            today,
            error: queryError.message,
            code: queryError.code,
          }),
        );
      },
    });
  }

  private async checkWellnessForTraining(_userId: string) {
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await firstValueFrom(
        this.api.get<{
          sleepQuality?: number;
          energyLevel?: number;
          stressLevel?: number;
          muscleSoreness?: number;
          readinessScore?: number;
        }>(`/api/wellness/checkin?date=${today}`),
      );
      const payload = extractApiPayload<{
        sleepQuality?: number;
        energyLevel?: number;
        stressLevel?: number;
        muscleSoreness?: number;
        readinessScore?: number;
      }>(response);

      if (!payload) {
        return {
          alert: null,
          readinessScore: null,
          readinessStatus: "unknown" as ReadinessStatus,
        };
      }

      // Map API response to expected format
      const wellnessData: WellnessCheckinRecord = {
        sleep_quality: payload.sleepQuality,
        energy_level: payload.energyLevel,
        stress_level: payload.stressLevel,
        soreness_level: payload.muscleSoreness,
      };

      const score = calculateReadinessScoreFromWellness(wellnessData);

      // If no score could be calculated (missing required data), return with null score
      if (score === null) {
        this.logger.warn(
          "[UnifiedTrainingService] Cannot calculate readiness: missing required fields (sleep and/or energy)",
        );
        return {
          alert: null,
          readinessScore: null,
          readinessStatus: "unknown" as ReadinessStatus,
        };
      }

      const status = getReadinessStatusFromScore(score);
      return {
        alert: generateWellnessAlertFromStatus(status),
        readinessScore: score,
        readinessStatus: status,
      };
    } catch (error) {
      if (!this.isExpectedApiClientError(error)) {
        this.logger.error(
          "[Training] Failed to get wellness for training:",
          toLogContext(error),
        );
      }
      return {
        alert: null,
        readinessScore: null,
        readinessStatus: "unknown" as ReadinessStatus,
      };
    }
  }

  private calculateTrainingStats(
    sessions: TrainingSessionRecord[],
  ): TrainingStatCard[] {
    return calculateTrainingStatsFromSessions(sessions, (date) =>
      isDateInCurrentTrainingWeek(date),
    );
  }

  private loadAchievements(
    _userId: string,
    streak: number,
    total: number,
  ): Achievement[] {
    return loadAchievementsForProgress(streak, total);
  }

  private async getUserDisplayName(userId: string): Promise<string> {
    // Per audit: use maybeSingle() to gracefully handle user not found (avoids 406)
    const { data } = await this.supabase.client
      .from("users")
      .select("first_name")
      .eq("id", userId)
      .maybeSingle();
    return (data as { first_name?: string } | null)?.first_name || "Athlete";
  }

  private generateAiInsight(data: TodayOverviewData): string {
    const recommendations = data.recommendations?.data as
      | SmartRecommendationsResponse
      | undefined;
    const protocolData = data.protocol?.data;
    const streak = this.trainingStats().find(
      (s) => s.label === "Current Streak",
    )?.value;

    return generateTrainingInsight({
      recommendations,
      acwr: this.acwrRatio(),
      readiness: this.readinessScore(),
      hydration: this.hydrationLevel(),
      userName: this.userName(),
      aiRationale: protocolData?.aiRationale || null,
      streakValue: streak || null,
    });
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Mark workout as complete
   */
  async markWorkoutComplete(workout: Workout): Promise<boolean> {
    try {
      const userId = this.userId();
      if (!userId) return false;

      const result = await markWorkoutCompleteSnapshot(
        this.supabase.client,
        userId,
        workout,
      );

      if (!result.success) {
        const error = result.error as { message?: string; code?: string };
        this.logger.error(
          "[UnifiedTrainingService] Failed to mark workout complete",
          toLogContext({
            userId,
            workoutId: workout.id,
            workoutType: workout.type,
            error: error.message,
            code: error.code,
          }),
        );
        return false;
      }

      await this.refreshOverviewAfterWorkoutMutation();
      return true;
    } catch (error) {
      this.logger.error(
        "[UnifiedTrainingService] Exception in markWorkoutComplete",
        toLogContext({ error }),
      );
      return false;
    }
  }

  /**
   * Postpone workout to later
   */
  async postponeWorkout(workout: Workout): Promise<boolean> {
    try {
      if (!workout.id) return false;

      const result = await postponeWorkoutSnapshot(
        this.supabase.client,
        workout.id,
      );

      if (!result.success) {
        const error = result.error as { message?: string; code?: string };
        this.logger.error(
          "[UnifiedTrainingService] Failed to postpone workout",
          toLogContext({
            workoutId: workout.id,
            newDate: result.tomorrowDate,
            error: error.message,
            code: error.code,
          }),
        );
        return false;
      }

      await this.refreshOverviewAfterWorkoutMutation();
      return true;
    } catch (error) {
      this.logger.error(
        "[UnifiedTrainingService] Exception in postponeWorkout",
        toLogContext({ error }),
      );
      return false;
    }
  }

  /**
   * Dismiss wellness alert locally
   */
  dismissWellnessAlert() {
    this._wellnessAlert.set(null);
  }

  /**
   * Remove a workout from the local list
   */
  removeWorkout(workoutTitle: string) {
    this._workouts.update((list) =>
      list.filter((w) => w.title !== workoutTitle),
    );
  }

  private refreshAfterMutation(options?: { refreshReadiness?: boolean }) {
    const currentUserId = this.userId();
    if (!currentUserId) return;

    if (options?.refreshReadiness) {
      this.readinessService.calculateToday(currentUserId).subscribe();
    }

    void this.loadPlayerSettingsRoutine();
    void this.loadAllTrainingData();
  }

  private async refreshOverviewAfterWorkoutMutation(): Promise<void> {
    await firstValueFrom(this.getTodayOverview());
  }

  private async loadPlayerSettingsRoutine(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.api.get<{ dailyRoutine?: DailyRoutineSlot[] }>(
          API_ENDPOINTS.playerSettings.get,
        ),
      );
      const payload = extractApiPayload<{ dailyRoutine?: DailyRoutineSlot[] }>(
        response,
      );
      this._dailyRoutine.set(
        this.normalizeDailyRoutine(payload?.dailyRoutine ?? null),
      );
    } catch (error) {
      if (!this.isExpectedApiClientError(error)) {
        this.logger.warn(
          "[UnifiedTrainingService] Could not load player settings routine",
          toLogContext(error),
        );
      }
      this._dailyRoutine.set(this.cloneDefaultDailyRoutine());
    }
  }

  private normalizeDailyRoutine(
    value: DailyRoutineSlot[] | null | undefined,
  ): DailyRoutineSlot[] {
    if (!Array.isArray(value) || value.length === 0) {
      return this.cloneDefaultDailyRoutine();
    }

    const normalized = value
      .filter(
        (slot): slot is DailyRoutineSlot =>
          !!slot &&
          typeof slot.id === "string" &&
          typeof slot.label === "string" &&
          typeof slot.time === "string",
      )
      .map((slot) => ({
        id: slot.id,
        label: slot.label,
        time: slot.time,
        ...(slot.icon ? { icon: slot.icon } : {}),
      }));

    return normalized.length > 0
      ? normalized
      : this.cloneDefaultDailyRoutine();
  }

  private cloneDefaultDailyRoutine(): DailyRoutineSlot[] {
    return DEFAULT_DAILY_ROUTINE.map((slot) => ({ ...slot }));
  }

}
