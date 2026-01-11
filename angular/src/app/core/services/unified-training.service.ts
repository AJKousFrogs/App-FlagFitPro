import {
    DestroyRef,
    Injectable,
    computed,
    inject,
    signal,
} from "@angular/core";
import { Observable, combineLatest, firstValueFrom, from, of } from "rxjs";
import { catchError, map, shareReplay, tap } from "rxjs/operators";

import { COLORS } from "../constants/app.constants";
import { WELLNESS } from "../constants/wellness.constants";
import {
    DailyProtocolResponse,
    DailyRoutineSlot,
    SmartRecommendationsResponse,
    SupplementEntry,
    TodayScheduleItem,
    TrainingRecommendation,
    TrainingSessionRecord,
    UserMetadata,
} from "../models/api.models";
import {
    Achievement,
    ReadinessStatus,
    SessionType,
    TrainingDataResult,
    TrainingStatCard,
    WeeklyScheduleDay,
    WellnessAlert,
    Workout,
} from "../models/training.models";
import { AcwrService } from "./acwr.service";
import { ApiService } from "./api.service";
import { AuthService } from "./auth.service";
import { LoggerService, toLogContext } from "./logger.service";
import {
    PerformanceDataService,
    PhysicalMeasurement,
} from "./performance-data.service";
import {
    PlayerProgramService,
    ProgramAssignment,
} from "./player-program.service";
import { ReadinessService } from "./readiness.service";
import { SupabaseService } from "./supabase.service";
import { TrainingDataService } from "./training-data.service";
import { WellnessService } from "./wellness.service";
// Note: WellnessCheckinData and ApiResponseWrapper are defined locally below

/**
 * Wellness checkin record from database
 */
interface WellnessCheckinRecord {
  sleep_quality?: number;
  sleep?: number;
  energy_level?: number;
  energy?: number;
  stress_level?: number;
  stress?: number;
  soreness_level?: number;
  soreness?: number;
  motivation_level?: number;
  motivation?: number;
}

/**
 * Today overview data structure
 */
interface TodayOverviewData {
  protocol?: { data?: DailyProtocolResponse };
  readiness?: unknown;
  recommendations?: { data?: SmartRecommendationsResponse };
  trainingData?: TrainingDataResult;
}

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

  private userId = computed(() => this.authService.getUser()?.id);

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

  readonly readinessScore = computed(
    () => this.readinessService.current()?.score || 0,
  );
  readonly readinessLevel = computed(
    () => this.readinessService.current()?.level || "moderate",
  );

  /**
   * Get severity color for PrimeNG Tag
   */
  getReadinessSeverity(level: string): "success" | "warn" | "danger" {
    if (level === "high") return "success";
    if (level === "moderate") return "warn";
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

  private readonly _trainingStats = signal<TrainingStatCard[]>([]);
  readonly trainingStats = this._trainingStats.asReadonly();

  private readonly _weeklySchedule = signal<WeeklyScheduleDay[]>([]);
  readonly weeklySchedule = this._weeklySchedule.asReadonly();

  readonly todaysScheduleItems = computed((): TodayScheduleItem[] => {
    const weekly = this._weeklySchedule();
    const today = weekly.find((day) => day.isToday);
    const sessions = today?.sessions || [];

    // Attempt to get user routine from settings
    const user = this.authService.getUser();
    const metadata = (user?.user_metadata || {}) as UserMetadata;

    const defaultRoutine: DailyRoutineSlot[] = [
      { id: "wake", label: "Wake Up", time: "07:00", icon: "pi-sun" },
      { id: "breakfast", label: "Breakfast", time: "08:15", icon: "pi-apple" },
      {
        id: "mobility",
        label: "Daily Mobility Routine",
        time: "07:10",
        icon: "pi-bolt",
      },
      {
        id: "rolling",
        label: "Morning Foam Rolling",
        time: "07:30",
        icon: "pi-refresh",
      },
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

    const userRoutine: DailyRoutineSlot[] =
      metadata.dailyRoutine || defaultRoutine;

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
    // User metadata not available from performance data service
    const metadata = null;

    // Get user routine for tomorrow (same routine applies daily)
    const defaultRoutine: DailyRoutineSlot[] = [
      { id: "wake", label: "Wake Up", time: "07:00", icon: "pi-refresh" },
      {
        id: "breakfast",
        label: "Breakfast",
        time: "07:30",
        icon: "pi-refresh",
      },
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

    const userRoutine: DailyRoutineSlot[] =
      (metadata as { dailyRoutine?: DailyRoutineSlot[] } | null)
        ?.dailyRoutine || defaultRoutine;

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
    const id = this.userId();
    if (!id) return of(null);

    this._isRefreshing.set(true);
    const targetDate = date || new Date().toISOString().split("T")[0];

    // Use direct Supabase queries instead of API calls for better reliability
    return combineLatest({
      protocol: from(this.loadDailyProtocolDirect(id, targetDate)),
      readiness: this.readinessService.calculateToday(id),
      recommendations: from(this.loadRecommendationsDirect(id)),
      trainingData: from(this.loadAllTrainingData()),
    }).pipe(
      map((data) => {
        const insight = this.generateAiInsight(
          data as unknown as TodayOverviewData,
        );
        this._aiInsight.set(insight);
        return {
          ...data,
          aiInsight: insight,
        };
      }),
      tap(() => this._isRefreshing.set(false)),
      catchError((err) => {
        this.logger.error("Error in getTodayOverview", err);
        this._isRefreshing.set(false);
        return of(null);
      }),
      shareReplay(1),
    );
  }

  /**
   * Load daily protocol directly from Supabase
   */
  private async loadDailyProtocolDirect(
    userId: string,
    date: string,
  ): Promise<{ data: DailyProtocolResponse | null }> {
    try {
      const { data, error } = await this.supabase.client
        .from("daily_protocols")
        .select(
          `
          *,
          protocol_exercises (*)
        `,
        )
        .eq("user_id", userId)
        .eq("protocol_date", date)
        .maybeSingle();

      if (error) {
        this.logger.warn(
          "[UnifiedTraining] Error loading daily protocol:",
          error,
        );
        return { data: null };
      }

      return { data: data as DailyProtocolResponse };
    } catch (err) {
      this.logger.warn("[UnifiedTraining] Failed to load daily protocol:", toLogContext(err));
      return { data: null };
    }
  }

  /**
   * Load training recommendations directly from Supabase
   */
  private async loadRecommendationsDirect(
    userId: string,
  ): Promise<{ data: SmartRecommendationsResponse | null }> {
    try {
      // Get latest training suggestions for user
      const { data, error } = await this.supabase.client
        .from("ai_training_suggestions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        this.logger.warn(
          "[UnifiedTraining] Error loading recommendations:",
          error,
        );
        return { data: null };
      }

      // Transform to expected SmartRecommendationsResponse format
      // Note: ai_training_suggestions has: id, user_id, suggestion_type, title, description, priority, confidence_score, data_sources, status, expires_at, created_at
      const recommendations: SmartRecommendationsResponse = {
        athleteId: userId,
        date: new Date().toISOString().split("T")[0],
        overallStatus: "optimal",
        recommendations:
          data?.map((s) => ({
            type:
              (s.suggestion_type as TrainingRecommendation["type"]) || "focus",
            priority:
              (s.priority as TrainingRecommendation["priority"]) || "medium",
            message: s.description || s.title || "Training suggestion",
            action: undefined, // Column doesn't exist in table
            reasoning: undefined, // Column doesn't exist in table
          })) || [],
        warnings: [],
        suggestions:
          (data
            ?.map((s) => s.title || s.description)
            .filter(Boolean) as string[]) || [],
        metrics: {
          acwr: 1.0, // Will be overridden by actual ACWR service
          readiness: 75,
          fatigue: 3,
          injuryRisk: 0.1,
        },
      };

      return { data: recommendations };
    } catch (err) {
      this.logger.warn(
        "[UnifiedTraining] Failed to load recommendations:",
        err,
      );
      return { data: null };
    }
  }

  /**
   * Generate a daily protocol for a specific date
   * This creates the exercises with videos for the protocol blocks
   */
  generateDailyProtocol(date?: string): Observable<unknown> {
    const targetDate = date || new Date().toISOString().split("T")[0];
    return this.api.post("/api/daily-protocol/generate", { date: targetDate });
  }

  /**
   * Get protocol for a specific date (for viewing tomorrow's training)
   */
  getProtocolForDate(date: string): Observable<unknown> {
    return this.api.get(`/api/daily-protocol?date=${date}`);
  }

  /**
   * Load all training data (from TrainingDataLoader logic)
   */
  private async loadAllTrainingData(): Promise<TrainingDataResult> {
    const userId = this.userId();
    if (!userId) return this.getFallbackData();

    try {
      // Load program assignment first (non-blocking for other data)
      this.loadProgramAssignment();

      const [sessions, schedule, workouts, wellnessData] = await Promise.all([
        this.loadTrainingSessions(userId),
        this.loadWeeklySchedule(userId),
        this.loadAvailableWorkouts(),
        this.checkWellnessForTraining(userId),
      ]);

      const stats = this.calculateTrainingStats(sessions);
      const streak = this.calculateStreak(sessions);
      const achievements = this.loadAchievements(
        userId,
        streak,
        sessions.length,
      );
      const userName = await this.getUserDisplayName(userId);

      // Update Signals
      this._userName.set(userName);
      this._trainingStats.set(stats);
      this._weeklySchedule.set(schedule);
      this._workouts.set(workouts);
      this._achievements.set(achievements);
      this._wellnessAlert.set(wellnessData.alert);

      return {
        stats,
        schedule,
        workouts,
        achievements,
        wellnessData,
        userName,
        lastRefresh: new Date(),
      };
    } catch (error) {
      this.logger.error("Error loading all training data", error);
      return this.getFallbackData();
    }
  }

  /**
   * Load user's program assignment from the API
   * Updates _programAssignment and _hasProgramAssignment signals
   */
  loadProgramAssignment(): void {
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

    // Trigger updates
    const currentUserId = this.userId();
    if (currentUserId) {
      this.readinessService.calculateToday(currentUserId).subscribe();
      this.loadAllTrainingData(); // Refresh signals
    }

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
    const currentUserId = this.userId();
    if (currentUserId) {
      this.readinessService.calculateToday(currentUserId).subscribe();
      this.loadAllTrainingData(); // Refresh signals
    }
    return result;
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
    if (result && result.success) {
      this.loadAllTrainingData();
    }
    return result;
  }

  /**
   * Get wellness for a specific day
   */
  getWellnessForDay(date: string) {
    return this.api.get(`/api/wellness-checkin?date=${date}`);
  }

  // ============================================================================
  // INTERNAL CALCULATORS & TRANSFORMERS (Ported from Loader)
  // ============================================================================

  private async loadTrainingSessions(
    userId: string,
  ): Promise<TrainingSessionRecord[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const start = thirtyDaysAgo.toISOString().split("T")[0]; // YYYY-MM-DD for DATE column

    const { data, error } = await this.supabase.client
      .from("training_sessions")
      .select("*")
      .eq("user_id", userId)
      .gte("session_date", start)
      .order("session_date", { ascending: false });

    if (error) {
      this.logger.error(
        "[UnifiedTrainingService] Failed to load training sessions",
        toLogContext({
          userId,
          dateRange: { start },
          error: error.message,
          code: error.code,
        }),
      );
      return [];
    }

    return (data as TrainingSessionRecord[]) || [];
  }

  private async loadWeeklySchedule(
    userId: string,
  ): Promise<WeeklyScheduleDay[]> {
    try {
      // 1. Get user's assigned program
      const { data: playerProgram } = await this.supabase.client
        .from("player_programs")
        .select("*, training_programs (id, name)")
        .eq("player_id", userId)
        .eq("status", "active")
        .single();

      if (!playerProgram) {
        this.logger.info(
          "[UnifiedTrainingService] No active program assigned, returning empty schedule",
        );
        return this.getEmptyWeekSchedule();
      }

      const programId = playerProgram.program_id;

      // 2. Get current week based on today's date
      const today = new Date().toISOString().split("T")[0];
      const startOfWeek = this.getStartOfWeek();
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      // Get phase for current date
      const { data: currentPhase } = await this.supabase.client
        .from("training_phases")
        .select("*")
        .eq("program_id", programId)
        .lte("start_date", today)
        .gte("end_date", today)
        .single();

      if (!currentPhase) {
        this.logger.info(
          "[UnifiedTrainingService] No active phase found for current date",
        );
        return this.getEmptyWeekSchedule();
      }

      // Get week for current date
      const { data: currentWeek } = await this.supabase.client
        .from("training_weeks")
        .select("*")
        .eq("phase_id", currentPhase.id)
        .lte("start_date", today)
        .gte("end_date", today)
        .single();

      if (!currentWeek) {
        this.logger.info(
          "[UnifiedTrainingService] No active week found for current date",
        );
        return this.getEmptyWeekSchedule();
      }

      // 3. Get scheduled sessions for the week from training_sessions
      const { data: sessionTemplates } = await this.supabase.client
        .from("training_sessions")
        .select("*")
        .eq("week_id", currentWeek.id)
        .order("day_of_week", { ascending: true })
        .order("session_order", { ascending: true });

      if (!sessionTemplates || sessionTemplates.length === 0) {
        this.logger.info(
          "[UnifiedTrainingService] No session templates found for current week",
        );
        return this.getEmptyWeekSchedule();
      }

      // 4. Transform to WeeklyScheduleDay format
      return this.transformSessionTemplatesToWeeklySchedule(
        sessionTemplates,
        startOfWeek,
      );
    } catch (error) {
      this.logger.error(
        "[UnifiedTrainingService] Error loading weekly schedule:",
        error,
      );
      return this.getEmptyWeekSchedule();
    }
  }

  private getEmptyWeekSchedule(): WeeklyScheduleDay[] {
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const start = this.getStartOfWeek();
    return days.map((name, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return {
        name,
        date: d,
        sessions: [],
        isToday: d.toDateString() === new Date().toDateString(),
      };
    });
  }

  private transformSessionTemplatesToWeeklySchedule(
    templates: Array<{
      id: string;
      day_of_week: number;
      session_name: string;
      session_type?: string;
      duration_minutes?: number;
      notes?: string;
      warm_up_protocol?: string;
      session_order?: number;
    }>,
    weekStart: Date,
  ): WeeklyScheduleDay[] {
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    return days.map((name, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      // day_of_week in DB: 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
      // days array index: 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
      const daySessions = templates.filter((t) => t.day_of_week === i);

      return {
        name,
        date: d,
        sessions: daySessions.map((s) => ({
          time: "TBD", // training_sessions doesn't have scheduled_time, use TBD
          title: s.session_name || "Training Session",
          type: this.mapSessionTypeToScheduleType(s.session_type || "training"),
          duration: s.duration_minutes || 60,
          description: s.notes || s.warm_up_protocol || "",
        })),
        isToday: d.toDateString() === new Date().toDateString(),
      };
    });
  }

  private mapSessionTypeToScheduleType(
    sessionType: string,
  ): SessionType | undefined {
    const lower = sessionType.toLowerCase();
    if (lower.includes("recovery") || lower.includes("rest")) return "recovery";
    if (lower.includes("game") || lower.includes("match")) return "game";
    if (lower.includes("speed")) return "speed";
    if (lower.includes("strength")) return "strength";
    if (lower.includes("skills")) return "skills";
    if (lower.includes("conditioning")) return "conditioning";
    if (lower.includes("technique")) return "technique";
    if (lower.includes("team_practice") || lower.includes("team practice"))
      return "team_practice";
    if (lower.includes("scrimmage")) return "scrimmage";
    if (lower.includes("mixed")) return "mixed";
    // For generic "training", return undefined since type is optional
    return undefined;
  }

  private async loadAvailableWorkouts(): Promise<Workout[]> {
    const userId = this.userId();
    if (!userId) return this.getDefaultWorkouts();

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD for DATE column
    const { data, error } = await this.supabase.client
      .from("training_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("session_date", today)
      .eq("status", "scheduled")
      .order("created_at", { ascending: true }); // Order by creation time since start_time doesn't exist

    if (error) {
      this.logger.error(
        "[UnifiedTrainingService] Failed to load available workouts",
        toLogContext({
          userId,
          today,
          error: error.message,
          code: error.code,
        }),
      );
      return this.getDefaultWorkouts();
    }

    if (!data || data.length === 0) return this.getDefaultWorkouts();
    return data.map((w) => this.transformToWorkout(w));
  }

  private async checkWellnessForTraining(userId: string) {
    const { data } = await this.supabase.client
      .from("wellness_entries")
      .select("*")
      .eq("athlete_id", userId)
      .order("date", { ascending: false })
      .limit(1)
      .single();

    if (!data)
      return {
        alert: null,
        readinessScore: 0,
        readinessStatus: "good" as ReadinessStatus,
      };

    const wellnessData = data as WellnessCheckinRecord;
    const score = this.calculateReadinessScore(wellnessData);
    const status = this.getReadinessStatus(score);
    return {
      alert: this.generateWellnessAlert(score, status),
      readinessScore: score,
      readinessStatus: status,
    };
  }

  private calculateReadinessScore(wellness: WellnessCheckinRecord): number {
    const sleep = wellness.sleep_quality ?? wellness.sleep ?? 0;
    const energy = wellness.energy_level ?? wellness.energy ?? 0;
    const stress = wellness.stress_level ?? wellness.stress ?? 10;
    const soreness = wellness.soreness_level ?? wellness.soreness ?? 10;
    const motivation = wellness.motivation_level ?? wellness.motivation ?? 0;

    const score =
      (sleep * 2 +
        energy * 2 +
        (10 - stress) * 1.5 +
        (10 - soreness) * 1.5 +
        motivation * 1) /
      8;
    return Math.round(score * 10);
  }

  private getReadinessStatus(score: number): ReadinessStatus {
    if (score >= WELLNESS.READINESS_EXCELLENT) return "excellent";
    if (score >= WELLNESS.READINESS_GOOD) return "good";
    if (score >= WELLNESS.READINESS_MODERATE) return "caution";
    return "rest";
  }

  private generateWellnessAlert(
    score: number,
    status: ReadinessStatus,
  ): WellnessAlert | null {
    if (status === "rest")
      return {
        severity: "critical",
        message: "Your body needs rest. Consider light recovery work today.",
        recommendations: [
          "Focus on sleep",
          "Light stretching",
          "Proper hydration",
        ],
        icon: "pi-exclamation-triangle",
      };
    if (status === "caution")
      return {
        severity: "warning",
        message: "Signs of fatigue detected. Train with caution.",
        recommendations: ["Reduce intensity 20%", "Extra warm-up"],
        icon: "pi-info-circle",
      };
    return null;
  }

  private calculateTrainingStats(
    sessions: TrainingSessionRecord[],
  ): TrainingStatCard[] {
    const thisWeek = sessions.filter((s) => this.isThisWeek(new Date(s.date)));
    const totalDuration = thisWeek.reduce(
      (sum, s) => sum + (s.duration ?? 0),
      0,
    );
    const streak = this.calculateStreak(sessions);

    return [
      {
        label: "This Week",
        value: `${thisWeek.length} sessions`,
        icon: "pi-calendar",
        color: COLORS.BLUE,
        trend: "Active",
        trendType: "neutral",
      },
      {
        label: "Total Duration",
        value: `${totalDuration} min`,
        icon: "pi-clock",
        color: COLORS.SUCCESS,
        trend: "This week",
        trendType: "neutral",
      },
      {
        label: "Current Streak",
        value: `${streak} days`,
        icon: "pi-bolt",
        color: COLORS.ERROR,
        trend: "Keep it up!",
        trendType: "positive",
      },
    ];
  }

  private calculateStreak(sessions: TrainingSessionRecord[]): number {
    if (sessions.length === 0) return 0;
    const uniqueDates = [
      ...new Set(
        sessions.map((s) => new Date(s.date).toISOString().split("T")[0]),
      ),
    ]
      .sort()
      .reverse();
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];

    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;

    let streak = 0;
    for (let i = 0; i < uniqueDates.length; i++) {
      const expected = new Date();
      expected.setDate(expected.getDate() - i);
      if (uniqueDates[i] === expected.toISOString().split("T")[0]) streak++;
      else break;
    }
    return streak;
  }

  private loadAchievements(
    _userId: string,
    streak: number,
    total: number,
  ): Achievement[] {
    const list: Achievement[] = [];
    if (streak >= 7)
      list.push({
        icon: "pi-bolt",
        title: "7-Day Streak",
        date: new Date().toISOString(),
        level: "bronze",
      });
    if (total >= 10)
      list.push({
        icon: "pi-check-circle",
        title: "10 Sessions",
        date: new Date().toISOString(),
        level: "bronze",
      });
    return list;
  }

  private async getUserDisplayName(userId: string): Promise<string> {
    const { data } = await this.supabase.client
      .from("users")
      .select("first_name")
      .eq("id", userId)
      .single();
    return (data as { first_name?: string } | null)?.first_name || "Athlete";
  }

  private generateAiInsight(data: TodayOverviewData): string {
    const recommendations = data.recommendations?.data as
      | SmartRecommendationsResponse
      | undefined;
    const acwr = this.acwrRatio();
    const readiness = this.readinessScore();
    const hydration = this.hydrationLevel();
    const userName = this.userName();

    // 1. Critical Performance/Safety Insights (from Smart Recommendations)
    if (recommendations) {
      if (recommendations.overallStatus === "injured") {
        return `Hey ${userName}, let's take it easy. ${recommendations.warnings[0] || "Focus on recovery exercises today."}`;
      }
      if (recommendations.overallStatus === "caution") {
        return `Watch out, ${userName}! ${recommendations.warnings[0] || "Your training load is high. Reduce intensity to stay safe."}`;
      }
      if (recommendations.overallStatus === "taper") {
        return `Tournament mode on! ${recommendations.suggestions[0] || "Keep intensity high but volume low."}`;
      }
    }

    // 2. High Priority Rule-Based Insights
    if (acwr > 1.5)
      return `Your injury risk is very high (ACWR: ${acwr.toFixed(2)}). Merlin recommends immediate rest today.`;
    if (readiness < 40)
      return `Readiness is low (${readiness}%). Focus heavily on recovery and extra sleep tonight.`;
    if (hydration < 5 && hydration > 0)
      return "You're a bit dehydrated. Drink 500ml of water before you start your session.";

    // 3. Protocol-Specific Insights
    const protocolData = data.protocol?.data as
      | DailyProtocolResponse
      | undefined;
    if (protocolData?.aiRationale) {
      return protocolData.aiRationale;
    }

    // 4. Achievement/Streak Insights
    const streak = this.trainingStats().find(
      (s) => s.label === "Current Streak",
    )?.value;
    if (streak && parseInt(streak) >= 3) {
      return `${streak} streak! You're building amazing momentum, ${userName}. Keep it rolling!`;
    }

    // 5. General Performance Insights
    if (readiness > 80 && acwr < 1.3)
      return "Physiological green light! You're perfectly primed for a high-intensity session.";

    return "Consistency is your superpower. Follow today's protocol to stay on track.";
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private getStartOfWeek(): Date {
    const now = new Date();
    const diff = now.getDay() === 0 ? -6 : 1 - now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  private isThisWeek(date: Date): boolean {
    const start = this.getStartOfWeek();
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return date >= start && date <= end;
  }

  private transformToWeeklySchedule(
    sessions: TrainingSessionRecord[],
  ): WeeklyScheduleDay[] {
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const start = this.getStartOfWeek();
    return days.map((name, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const daySessions = sessions.filter(
        (s) => new Date(s.date).toDateString() === d.toDateString(),
      );
      return {
        name,
        date: d,
        sessions: daySessions.map((s) => ({
          time: s.scheduled_time || "TBD",
          title: s.title || "Session",
          type: s.session_type as WeeklyScheduleDay["sessions"][0]["type"],
        })),
        isToday: d.toDateString() === new Date().toDateString(),
      };
    });
  }

  private transformToWorkout(w: TrainingSessionRecord): Workout {
    return {
      id: w.id,
      type: w.session_type || "training",
      title: w.title || "Workout",
      description: w.description || "",
      duration: `${w.duration ?? 60} min`,
      intensity:
        (w.intensity ?? 5) > 6
          ? "high"
          : (w.intensity ?? 5) > 3
            ? "medium"
            : "low",
      location: w.location || "Gym",
      icon: "pi-bolt",
      iconBg: COLORS.ERROR,
    };
  }

  private getDefaultWorkouts(): Workout[] {
    return [
      {
        type: "speed",
        title: "Speed Work",
        description: "Acceleration focus",
        duration: "45 min",
        intensity: "high",
        location: "Track",
        icon: "pi-bolt",
        iconBg: COLORS.ERROR,
      },
      {
        type: "strength",
        title: "Strength",
        description: "Power focus",
        duration: "60 min",
        intensity: "medium",
        location: "Gym",
        icon: "pi-shield",
        iconBg: COLORS.BLUE,
      },
    ];
  }

  /**
   * Mark workout as complete
   */
  async markWorkoutComplete(workout: Workout): Promise<boolean> {
    try {
      const userId = this.userId();
      if (!userId) return false;

      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD for DATE column
      const { error } = await this.supabase.client
        .from("training_sessions")
        .insert({
          user_id: userId,
          session_date: today,
          session_type: workout.type,
          duration_minutes: parseInt(workout.duration) || 60,
          intensity_level:
            workout.intensity === "high"
              ? 9
              : workout.intensity === "medium"
                ? 6
                : 3,
          status: "completed",
          notes: `Completed: ${workout.title}`,
        });

      if (error) {
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

      // Refresh state
      await firstValueFrom(this.getTodayOverview());
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

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD for DATE column

      const { error } = await this.supabase.client
        .from("training_sessions")
        .update({
          session_date: tomorrowDate,
          notes: "[Postponed]",
        })
        .eq("id", workout.id);

      if (error) {
        this.logger.error(
          "[UnifiedTrainingService] Failed to postpone workout",
          toLogContext({
            workoutId: workout.id,
            newDate: tomorrowDate,
            error: error.message,
            code: error.code,
          }),
        );
        return false;
      }

      // Refresh state
      await firstValueFrom(this.getTodayOverview());
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

  private getFallbackData(): TrainingDataResult {
    return {
      stats: [],
      schedule: [],
      workouts: this.getDefaultWorkouts(),
      achievements: [],
      wellnessData: { alert: null, readinessScore: 0, readinessStatus: "good" },
      userName: "Athlete",
      lastRefresh: new Date(),
    };
  }
}
