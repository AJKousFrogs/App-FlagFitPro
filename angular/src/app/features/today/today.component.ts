/** Daily practice hub: protocol, schedule, metrics. */

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { ToastService } from "../../core/services/toast.service";

import { SkeletonLoaderComponent } from "../../shared/components/skeleton-loader/skeleton-loader.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";


import { from } from "rxjs";
import { ButtonComponent } from "../../shared/components/button/button.component";

// Layout & Components
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import {
  ProtocolJson,
  TodayViewModel,
  resolveTodayState,
} from "./resolution/today-state.resolver";
import { WeekDay } from "../training/daily-protocol/components/week-progress-strip.component";
import {
  DailyProtocol,
  ProtocolBlock,
} from "../training/daily-protocol/daily-protocol.models";
import {
  mapToDailyProtocol,
  type ProtocolApiResponse,
} from "./utils/protocol-api-mapper";

// Services
import { ApiService } from "../../core/services/api.service";
import { DataSourceService } from "../../core/services/data-source.service";
import { HeaderService } from "../../core/services/header.service";
import { LoggerService } from "../../core/services/logger.service";
import { ScreenReaderAnnouncerService } from "../../core/services/screen-reader-announcer.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { UnifiedTrainingService } from "../../core/services/unified-training.service";
import {
  ContinuityEvent,
  ContinuityIndicatorsService,
} from "../../core/services/continuity-indicators.service";

// Environment

// Utils
import {
  extractApiPayload,
  isSuccessfulApiResponse,
  mapDailyProtocolResponse,
} from "../../core/utils/api-response-mapper";
import { getDateKey, getTodayISO } from "../../shared/utils/date.utils";
import {
  ExactTrainingSummary,
  TodayProtocolFacade,
} from "./today-protocol.facade";
import { TodaySummaryHeaderComponent } from "./components/today-summary-header.component";
import { TodayQuickCheckinDialogComponent } from "./components/today-quick-checkin-dialog.component";
import { TodayProtocolSectionComponent } from "./components/today-protocol-section.component";
import { TodayStatusStackComponent } from "./components/today-status-stack.component";

// Constants
import { TIMEOUTS, TRAINING } from "../../core/constants/app.constants";
import {
  WELLNESS,
  computeQuickReadiness,
} from "../../core/constants/wellness.constants";

// Types
type DayPhase = "morning" | "midday" | "evening";
type ActiveFocus = "checkin" | "protocol" | "wrapup";
type TagSeverity =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "secondary"
  | "contrast";


// Quick Check-in Types
interface QuickMood {
  value: number;
  emoji: string;
  label: string;
}

interface QuickEnergyLevel {
  value: number;
  label: string;
}

interface QuickFormData {
  overallFeeling: number | null;
  energyLevel: number | null;
  hasSoreness: boolean | null;
  sleepHours: number | null;
  sorenessLevel: number | null;
  stressLevel: number | null;
  sorenessAreas: string[];
}

@Component({
  selector: "app-today",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    SkeletonLoaderComponent,
    PageErrorStateComponent,
    ButtonComponent,
    MainLayoutComponent,
    TodaySummaryHeaderComponent,
    TodayQuickCheckinDialogComponent,
    TodayProtocolSectionComponent,
    TodayStatusStackComponent,
  ],
  templateUrl: "./today.component.html",
  styleUrl: "./today.component.scss",
})
export class TodayComponent {
  // Dependency Injection (Angular 21 pattern)
  private readonly router = inject(Router);
  private readonly supabase = inject(SupabaseService);
  private readonly trainingService = inject(UnifiedTrainingService);
  private readonly headerService = inject(HeaderService);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly dataSourceService = inject(DataSourceService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(ApiService);
  private readonly screenReaderAnnouncer = inject(ScreenReaderAnnouncerService);
  private readonly todayProtocolFacade = inject(TodayProtocolFacade);
  private readonly continuityIndicators = inject(ContinuityIndicatorsService);

  // Angular 21: viewChild signals for DOM element references
  private readonly protocolBlocks = viewChild<ElementRef>("protocolBlocks");

  // Guard to prevent duplicate initial loads
  private _initialLoadDone = false;

  // Guard to prevent multiple protocol generation attempts (race condition fix)
  private readonly _generationAttempted = signal(false);

  // Computed userId from auth service - uses signal for reactivity
  // Per audit: use currentUser() signal, not getUser() method
  private readonly userId = computed(() => this.supabase.userId());

  // ============================================================================
  // STATE SIGNALS
  // ============================================================================
  readonly protocol = signal<Partial<DailyProtocol> | null>(null);
  readonly protocolJson = signal<ProtocolJson | null>(null); // Raw JSON from API
  readonly todayViewModel = signal<TodayViewModel | null>(null); // Resolved state
  readonly continuityEvents = signal<ContinuityEvent[]>([]);
  private fullProtocolData: ProtocolApiResponse | null = null; // Store full API response with blocks for UI rendering
  readonly error = signal<string | null>(null);
  readonly currentTime = signal(new Date());

  // Quick Check-in State
  readonly showQuickCheckin = signal(false);
  readonly isSavingQuickCheckin = signal(false);
  readonly quickFormData = signal<QuickFormData>({
    overallFeeling: null,
    energyLevel: null,
    hasSoreness: null,
    sleepHours: null,
    sorenessLevel: null,
    stressLevel: null,
    sorenessAreas: [],
  });

  // Celebration State
  readonly showCelebration = signal(false);
  private celebrationShownForSession = false;

  // Protocol Generation State
  readonly isGeneratingProtocol = signal(false);
  // Quick Check-in Options
  readonly quickMoods: QuickMood[] = [
    { value: 1, emoji: "😫", label: "Rough" },
    { value: 2, emoji: "😐", label: "Okay" },
    { value: 3, emoji: "🙂", label: "Good" },
    { value: 4, emoji: "😊", label: "Great" },
    { value: 5, emoji: "🤩", label: "Amazing" },
  ];

  readonly quickEnergyLevels: QuickEnergyLevel[] = [
    { value: 1, label: "Low" },
    { value: 2, label: "Moderate" },
    { value: 3, label: "Normal" },
    { value: 4, label: "High" },
    { value: 5, label: "Peak" },
  ];

  // ============================================================================
  // DERIVED STATE FROM SERVICES
  // ============================================================================
  readonly userName = this.trainingService.userName;
  readonly acwrValue = this.trainingService.acwrRatio;
  readonly acwrRiskZone = this.trainingService.acwrRiskZone;
  readonly readinessScore = this.trainingService.readinessScore;
  readonly readinessLevel = this.trainingService.readinessLevel;
  readonly aiInsight = this.trainingService.aiInsight;
  readonly isLoading = this.trainingService.isRefreshing;
  readonly hasCheckedInToday = this.trainingService.hasCheckedInToday;

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  readonly isFirstTimeUser = computed(() =>
    this.dataSourceService.isFirstTimeUser(),
  );

  readonly dayPhase = computed<DayPhase>(() => {
    const hour = this.currentTime().getHours();
    if (hour < 11) return "morning";
    if (hour < 17) return "midday";
    return "evening";
  });

  readonly greetingPrefix = computed(() => {
    const greetings: Record<DayPhase, string> = {
      morning: "Good Morning,",
      midday: "Time to Train,",
      evening: "Good Evening,",
    };
    return greetings[this.dayPhase()];
  });

  readonly dayPhaseMessage = computed(() => {
    if (!this.hasCheckedInToday())
      return "Let's start with your readiness check.";
    if (this.dayPhase() === "evening") return "Time to review and recover.";
    return "Follow your personalized protocol below.";
  });

  readonly activeFocus = computed<ActiveFocus>(() => {
    if (!this.hasCheckedInToday()) return "checkin";
    if (this.dayPhase() === "evening") return "wrapup";
    return "protocol";
  });

  readonly weekDays = computed<WeekDay[]>(() => {
    const schedule = this.trainingService.weeklySchedule();
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return dayNames.map((dayName, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = getDateKey(date);
      const isToday = dateStr === getTodayISO();

      const daySchedule = schedule.find(
        (s) => s.date && getDateKey(s.date) === dateStr,
      );

      let status: WeekDay["status"] = "empty";
      if (daySchedule) {
        status = daySchedule.sessions.length > 0 ? "planned" : "rest";
      }

      return {
        date: dateStr,
        dayName,
        dayNumber: date.getDate(),
        status,
        isToday,
      };
    });
  });

  readonly weekStats = computed(() => {
    const stats = this.trainingService.trainingStats();
    const streak =
      stats.find((s) => s.label === "Current Streak")?.value || "0";
    const compliance = stats.find((s) => s.label === "This Week")?.value || "0";
    const weeklyLoad = this.trainingService.weeklyProgression().currentWeek;

    return {
      completedDays: parseInt(compliance, 10),
      totalTrainingDays: 7,
      weeklyLoadAu: weeklyLoad,
      targetLoadAu: TRAINING.TARGET_LOAD_AU,
      currentStreak: parseInt(streak, 10),
    };
  });

  // ============================================================================
  // COMPUTED STATUS HELPERS
  // ============================================================================
  readonly acwrStatusLabel = computed(
    () =>
      this.protocolJson()?.acwr_presentation?.label ||
      this.acwrRiskZone()?.label ||
      "Unknown",
  );

  readonly acwrSeverity = computed<TagSeverity>(() => {
    const level =
      this.protocolJson()?.acwr_presentation?.level ??
      this.acwrRiskZone()?.level;
    const severityMap: Record<string, TagSeverity> = {
      "sweet-spot": "success",
      "under-training": "warning",
      "elevated-risk": "warning",
      "danger-zone": "danger",
      "no-data": "secondary",
    };
    return severityMap[level ?? ""] ?? "secondary";
  });

  readonly acwrClass = computed(() => {
    const level =
      this.protocolJson()?.acwr_presentation?.level ??
      this.acwrRiskZone()?.level;
    const classMap: Record<string, string> = {
      "sweet-spot": "optimal",
      "under-training": "moderate",
      "elevated-risk": "moderate",
      "danger-zone": "risk",
    };
    return classMap[level ?? ""] ?? "";
  });

  readonly readinessStatusLabel = computed(() => {
    const level = this.readinessLevel();
    if (level === null) return "Unknown";

    const labelMap: Record<string, string> = {
      high: "Great",
      moderate: "Good",
      low: "Low",
    };
    return labelMap[level] ?? "Unknown";
  });

  readonly readinessSeverity = computed<TagSeverity>(() => {
    const level = this.readinessLevel();
    if (level === null) return "secondary";

    const severityMap: Record<string, TagSeverity> = {
      high: "success",
      moderate: "warning",
      low: "danger",
    };
    return severityMap[level] ?? "secondary";
  });

  // Computed signals for template use
  readonly blockingCoachAlertBanner = computed<
    TodayViewModel["banners"][number] | null
  >(() => {
    const vm = this.todayViewModel();
    if (!vm || vm.trainingAllowed) {
      return null;
    }

    return (
      vm.banners.find(
        (b) =>
          b.type === "alert" && b.text.includes("Acknowledgment required"),
      ) ?? null
    );
  });

  readonly blockingCoachAlertPrimaryCta = computed(() => {
    const vm = this.todayViewModel();
    const banner = this.blockingCoachAlertBanner();

    if (vm?.primaryCta) {
      return {
        label: vm.primaryCta.label,
        action: vm.primaryCta.action,
        variant: "primary" as const,
      };
    }

    return banner?.ctas?.[0] ?? null;
  });

  readonly blockingCoachAlertSecondaryCta = computed(() => {
    const vm = this.todayViewModel();
    const banner = this.blockingCoachAlertBanner();

    if (vm?.primaryCta && banner?.ctas?.[0]) {
      return {
        label: banner.ctas[0].label,
        action: banner.ctas[0].action,
        variant: "secondary" as const,
      };
    }

    return banner?.ctas?.[1] ?? null;
  });

  readonly visibleBanners = computed(() => {
    const banners = this.todayViewModel()?.banners ?? [];
    const blockingBanner = this.blockingCoachAlertBanner();

    return banners.filter((banner) => banner !== blockingBanner);
  });

  readonly coachModifiedTime = computed(() => {
    const modifiedAt = this.protocolJson()?.modified_at;
    return modifiedAt ? this.formatCoachTimestamp(modifiedAt) : null;
  });

  readonly exactTrainingSummary = computed<ExactTrainingSummary | null>(() => {
    return this.todayProtocolFacade.buildExactTrainingSummary({
      todayViewModel: this.todayViewModel(),
      protocol: this.protocol(),
      protocolJson: this.protocolJson(),
      metrics: {
        readinessScore: this.readinessScore(),
        acwrValue: this.acwrValue(),
        acwrRiskLevel: this.acwrRiskZone()?.level ?? null,
        hasCheckedInToday: this.hasCheckedInToday(),
      },
    });
  });

  readonly protocolDisplayBlocks = computed<ProtocolBlock[]>(() => {
    const vm = this.todayViewModel();
    const protocol = this.protocol();

    if (!vm || !protocol) {
      return [];
    }

    return vm.blocksDisplayed
      .map((blockType) => this.getBlockByType(protocol, blockType))
      .filter((block): block is ProtocolBlock => Boolean(block));
  });

  // ============================================================================
  // COMPUTED - Quick Check-in
  // ============================================================================
  readonly quickReadinessScore = computed(() => {
    const data = this.quickFormData();
    if (
      data.overallFeeling === null ||
      data.energyLevel === null ||
      data.hasSoreness === null
    ) {
      return 0;
    }

    // Use centralized readiness calculation from wellness constants
    return computeQuickReadiness(
      data.overallFeeling,
      data.energyLevel,
      data.hasSoreness,
    );
  });

  readonly isQuickFormValid = computed(() => {
    const data = this.quickFormData();
    return (
      data.overallFeeling !== null &&
      data.energyLevel !== null &&
      data.hasSoreness !== null
    );
  });

  private readonly pendingFocus = signal<string | null>(null);
  private readonly defaultQuickFormData: QuickFormData = {
    overallFeeling: null,
    energyLevel: null,
    hasSoreness: null,
    sleepHours: null,
    sorenessLevel: null,
    stressLevel: null,
    sorenessAreas: [],
  };

  // ============================================================================
  // CONSTRUCTOR
  // ============================================================================
  constructor() {
    this.headerService.setDashboardHeader();

    // CRITICAL: Wait for auth to be ready before loading protected data
    // This prevents 401 errors from firing API calls before token exists
    effect(() => {
      const id = this.userId();
      if (!id) return; // Auth not ready yet

      if (this._initialLoadDone) return; // Already loaded
      this._initialLoadDone = true;

      this.logger.info(
        "[TodayComponent] Auth ready, loading data for user:",
        id,
      );
      this.loadTodayData();
      void this.loadContinuityEvents(id);
    });

    // Update time every minute
    const interval = setInterval(
      () => this.currentTime.set(new Date()),
      TIMEOUTS.TIME_UPDATE_INTERVAL,
    );
    this.destroyRef.onDestroy(() => clearInterval(interval));

    // Watch for protocol completion to trigger celebration
    effect(() => {
      const p = this.protocol();
      if (
        p?.overallProgress === 100 &&
        !this.celebrationShownForSession &&
        this.hasCheckedInToday()
      ) {
        this.celebrationShownForSession = true;
        this.showCelebration.set(true);
      }
    });

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.pendingFocus.set(params.get("focus"));
      });

    effect(() => {
      const focus = this.pendingFocus();
      if (!focus || this.isLoading() || this.isGeneratingProtocol()) {
        return;
      }

      queueMicrotask(() => {
        this.scrollToFirstBlock();
        this.toastService.info(
          `Opening today's plan for ${this.formatFocusLabel(focus)}`,
          "Workout Focus",
        );
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { focus: null },
          queryParamsHandling: "merge",
          replaceUrl: true,
        });
      });
    });
  }

  // ============================================================================
  // DATA LOADING (Contract-Compliant)
  // ============================================================================
  /**
   * Load TODAY data per contract:
   * 1. Call GET /api/daily-protocol?date=today
   * 2. If not found, call POST /api/daily-protocol/generate once, then GET again
   * 3. Resolve state using deterministic resolver
   * 4. Do NOT generate multiple times
   * 5. Do NOT fabricate fallback UI if generation fails
   */
  private loadTodayData(): void {
    const today = getTodayISO();

    // Step 1: Try GET first (via Netlify Functions)
    this.api
      .get<ProtocolJson>(`/api/daily-protocol?date=${today}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const payload = extractApiPayload<ProtocolJson>(response);
          if (payload) {
            // Store full protocol data for UI rendering (includes blocks with exercises)
            this.fullProtocolData = payload as unknown as ProtocolApiResponse;

            // Protocol found, resolve state
            // Map API response (camelCase) to resolver format (snake_case)
            const protocolData = this.mapApiProtocolResponse(payload);
            this.protocolJson.set(protocolData);
            this.resolveAndUpdateViewModel(protocolData);
            this.error.set(null);
            const userId = this.userId();
            if (userId) {
              void this.loadContinuityEvents(userId);
            }
            // Reset generation flag on successful load
            this._generationAttempted.set(false);
          } else if (!this._generationAttempted()) {
            // Protocol not found, generate once (using component-level signal)
            this._generationAttempted.set(true);
            this.generateAndLoadProtocol(today);
          } else {
            // Generation already attempted, show error
            this.error.set(
              "Unable to generate your training plan. Please contact support.",
            );
            this.protocolJson.set(null);
            this.fullProtocolData = null;
            this.todayViewModel.set(
              resolveTodayState(null, this.currentTime()),
            );
          }
        },
        error: (err) => {
          this.logger.error("Failed to load today data", err);
          if (!this._generationAttempted()) {
            this._generationAttempted.set(true);
            this.generateAndLoadProtocol(today);
          } else {
            this.error.set(
              "Failed to load your training data. Please try again.",
            );
            this.protocolJson.set(null);
            this.fullProtocolData = null;
            this.todayViewModel.set(
              resolveTodayState(null, this.currentTime()),
            );
          }
        },
      });
  }

  /**
   * Map API response (camelCase) to ProtocolJson format (snake_case)
   * Handles field name mismatches between backend and frontend
   */
  private mapApiProtocolResponse(data: unknown): ProtocolJson {
    return mapDailyProtocolResponse(data) as ProtocolJson;
  }

  /**
   * Generate protocol and then reload
   */
  private generateAndLoadProtocol(date: string): void {
    this.isGeneratingProtocol.set(true);

    this.api
      .post<ProtocolJson>("/api/daily-protocol/generate", { date })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isGeneratingProtocol.set(false);
          if (isSuccessfulApiResponse(response)) {
            const payload = extractApiPayload<ProtocolJson>(response);
            if (payload) {
              this.fullProtocolData = payload as unknown as ProtocolApiResponse;
              const protocolData = this.mapApiProtocolResponse(payload);
              this.protocolJson.set(protocolData);
              this.resolveAndUpdateViewModel(protocolData);
              this.error.set(null);
              return;
            }

            // Generation succeeded without inline payload, reload via GET
            this.loadTodayData();
          } else {
            // Generation failed, show explicit error
            this.error.set(
              "Unable to generate your training plan. Please contact support.",
            );
            this.protocolJson.set(null);
            this.fullProtocolData = null;
            this.todayViewModel.set(
              resolveTodayState(null, this.currentTime()),
            );
          }
        },
        error: (err) => {
          this.logger.error("Failed to generate protocol", err);
          this.isGeneratingProtocol.set(false);
          this.error.set(
            "Failed to generate your training plan. Please contact support.",
          );
          this.protocolJson.set(null);
          this.fullProtocolData = null;
          this.todayViewModel.set(resolveTodayState(null, this.currentTime()));
        },
      });
  }

  /**
   * Resolve protocol JSON to TodayViewModel and update signals
   */
  private resolveAndUpdateViewModel(protocolJson: ProtocolJson): void {
    const viewModel = resolveTodayState(protocolJson, this.currentTime());
    this.todayViewModel.set(viewModel);

    // Also update protocol signal for backward compatibility
    // We need to keep the full blocks data for UI rendering
    if (this.fullProtocolData) {
      this.protocol.set(mapToDailyProtocol(this.fullProtocolData));
    } else if (protocolJson.blocks) {
      // Fallback: create minimal structure
      this.protocol.set({
        id: protocolJson.id,
        protocolDate: protocolJson.protocol_date,
        readinessScore: protocolJson.readiness_score ?? undefined,
        acwrValue: protocolJson.acwr_value ?? undefined,
      } as Partial<DailyProtocol>);
    }
  }

  trackByBanner(
    index: number,
    banner: { type: string; text: string },
  ): string {
    return `${index}-${banner.type}-${banner.text.slice(0, 30)}`;
  }

  refreshProtocol(): void {
    this.loadTodayData();
  }

  private async loadContinuityEvents(userId: string): Promise<void> {
    try {
      const events = await this.continuityIndicators.getPlayerContinuity(userId);
      this.continuityEvents.set(events);
    } catch (error) {
      this.logger.warn("today_continuity_events_failed", {
        error,
      });
      this.continuityEvents.set([]);
    }
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  onWellnessComplete(result: { readinessScore: number }): void {
    this.handleWellnessSaved(
      result.readinessScore,
      "Wellness Logged",
      `Readiness: ${result.readinessScore}%. Let's optimize your session.`,
    );
  }

  scrollToProtocolBlocks(): void {
    const blocksContainer = this.protocolBlocks();
    blocksContainer?.nativeElement?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  // ============================================================================
  // QUICK CHECK-IN METHODS
  // ============================================================================
  openQuickCheckin(): void {
    this.resetQuickCheckinForm();
    this.showQuickCheckin.set(true);
  }

  closeQuickCheckin(): void {
    this.showQuickCheckin.set(false);
    this.resetQuickCheckinForm();
  }

  setQuickField<K extends keyof QuickFormData>(
    field: K,
    value: QuickFormData[K],
  ): void {
    this.quickFormData.set({
      ...this.quickFormData(),
      [field]: value,
    });
  }

  getQuickReadinessClass(): string {
    const score = this.quickReadinessScore();
    if (score >= WELLNESS.READINESS_THRESHOLD_HIGH) return "high";
    if (score >= WELLNESS.READINESS_MODERATE) return "moderate";
    return "low";
  }

  submitQuickCheckin(): void {
    if (!this.isQuickFormValid()) {
      this.logger.warn("Quick checkin form is invalid");
      return;
    }

    this.logger.info("Starting quick checkin submission...");
    this.isSavingQuickCheckin.set(true);

    const data = this.quickFormData();
    const targetDate = getTodayISO();
    const readiness = this.quickReadinessScore();

    this.logger.info("Quick checkin data:", {
      data,
      targetDate,
      readiness,
    });

    // Map quick form to full wellness data
    // IMPORTANT: Do NOT use hardcoded defaults for wellness metrics
    // Missing data should be null to ensure accurate calculations and
    // proper data quality indicators in ACWR/readiness scoring
    const wellnessData = {
      date: targetDate,
      sleepQuality: data.overallFeeling ?? null, // No default - require explicit input
      sleepHours: data.sleepHours ?? null, // No hardcoded default - affects calculations
      energyLevel: data.energyLevel ?? null, // No default - require explicit input
      muscleSoreness:
        data.hasSoreness !== undefined
          ? data.hasSoreness
            ? (data.sorenessLevel ?? null)
            : null
          : null,
      stressLevel: data.stressLevel ?? null, // No default - require explicit input
      sorenessAreas: data.sorenessAreas ?? [],
      readinessScore: readiness, // Calculated from actual inputs, not defaults
    };

    from(this.trainingService.submitWellness(wellnessData))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (response: unknown) => {
        this.logger.info("Quick checkin response:", response);
        const typedResponse = response as { success?: boolean };

        if (typedResponse?.success) {
          this.closeQuickCheckin();
          this.handleWellnessSaved(
            readiness,
            "Quick Check-in Complete",
            `Readiness: ${readiness}%. Ready to train!`,
          );
        } else {
          this.toastService.error("Failed to save check-in. Please try again.");
          // Announce error to screen readers
          this.screenReaderAnnouncer.announceAssertive(
            "Error: Failed to save check-in. Please try again.",
          );
        }
        this.isSavingQuickCheckin.set(false);
      },
      error: (err: unknown) => {
        this.logger.error("Failed to save quick checkin", err);
        this.toastService.error("Failed to save check-in. Please try again.");
        this.isSavingQuickCheckin.set(false);
      },
    });
  }

  private resetQuickCheckinForm(): void {
    this.quickFormData.set({
      ...this.defaultQuickFormData,
      sorenessAreas: [...this.defaultQuickFormData.sorenessAreas],
    });
  }

  private handleWellnessSaved(
    readiness: number,
    title: string,
    message: string,
  ): void {
    this.toastService.success(message, title);
    this.screenReaderAnnouncer.announceSuccess(
      `Quick check-in saved. Your readiness is ${readiness} percent.`,
    );
    this.refreshProtocol();
  }

  // ============================================================================
  // CELEBRATION METHODS
  // ============================================================================
  dismissCelebration(): void {
    this.showCelebration.set(false);
  }

  // ============================================================================
  // PROTOCOL GENERATION
  // ============================================================================
  generateProtocol(): void {
    this.isGeneratingProtocol.set(true);
    // Announce loading state to screen readers
    this.screenReaderAnnouncer.announceLoading("training protocol");
    this.handleProtocolRequest(
      this.trainingService.generateDailyProtocol(),
      this.protocol,
      this.isGeneratingProtocol,
      {
        success: "Protocol Generated",
        detail: "Your personalized training plan is ready!",
      },
    );
  }

  private handleProtocolRequest(
    request: ReturnType<
      typeof this.trainingService.generateDailyProtocol<Partial<DailyProtocol>>
    >,
    targetSignal: typeof this.protocol,
    loadingSignal: typeof this.isGeneratingProtocol,
    toast?: { success: string; detail: string },
  ): void {
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        const payload = extractApiPayload<Partial<DailyProtocol>>(response);
        if (payload) {
          targetSignal.set(payload);
          if (toast) {
            this.toastService.success(toast.detail, toast.success);
            // Announce success to screen readers
            this.screenReaderAnnouncer.announceSuccess(toast.detail);
          }
        }
        loadingSignal.set(false);
      },
      error: (err) => {
        if (toast) {
          this.logger.error("Protocol request failed", err);
          this.toastService.error("Request failed. Please try again.");
          // Announce error to screen readers
          this.screenReaderAnnouncer.announceAssertive(
            "Error: Request failed. Please try again.",
          );
        }
        loadingSignal.set(false);
      },
    });
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================
  navigateToAcwr(): void {
    this.router.navigate(["/performance/load"]);
  }

  navigateToWellness(): void {
    this.router.navigate(["/wellness"]);
  }

  private navigateToTodayTraining(): void {
    this.router.navigate(["/training"], {
      queryParams: { date: this.todayDate() },
    });
  }

  private navigateToTodayTrainingLog(): void {
    this.router.navigate(["/training/log"], {
      queryParams: { date: this.todayDate() },
    });
  }

  private navigateToTrainingWorkspace(): void {
    this.router.navigate(["/training/workspace"]);
  }

  private navigateToTeamChat(): void {
    this.router.navigate(["/team-chat"]);
  }

  // ============================================================================
  // CTA HANDLERS (Contract-Compliant)
  // ============================================================================
  /**
   * Handle CTA actions from TodayViewModel banners and CTAs
   * Maps action IDs to component methods
   */
  handleCta(actionId: string): void {
    switch (actionId) {
      case "open_checkin":
      case "start_checkin":
      case "update_checkin":
        // Open the Quick Check-in dialog (not scroll to wellness section)
        this.openQuickCheckin();
        break;

      case "start_training":
      case "start_training_anyway":
      case "continue_anyway":
        // Scroll to first block or start first block
        this.scrollToFirstBlock();
        break;

      case "view_practice_details":
        this.navigateToTodayTraining();
        break;

      case "view_film_room_details":
        this.navigateToTrainingWorkspace();
        break;

      case "view_rehab":
      case "view_rehab_details":
        this.router.navigate(["/return-to-play"]);
        break;

      case "contact_coach":
      case "contact_physio":
        this.navigateToTeamChat();
        break;

      case "view_taper":
      case "view_taper_plan":
        this.navigateToTrainingWorkspace();
        break;

      case "log_session":
      case "log_workout":
        this.navigateToTodayTrainingLog();
        break;

      case "read_coach_alert":
        // Show coach alert modal/dialog
        this.showCoachAlertDialog();
        break;

      case "acknowledge_coach_alert":
        this.acknowledgeCoachAlert();
        break;

      case "view_coach_note":
        // Show coach note modal
        this.showCoachNoteDialog();
        break;

      default:
        this.logger.warn(`Unknown CTA action: ${actionId}`);
        this.toastService.warn("This action is not yet implemented", "Action Not Available");
    }
  }

  private scrollToFirstBlock(): void {
    const blocksContainer = this.protocolBlocks();
    if (blocksContainer?.nativeElement) {
      // Query within the component's scoped element for the first block
      const firstBlock =
        blocksContainer.nativeElement.querySelector("[data-block-type]");
      if (firstBlock) {
        firstBlock.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  private todayDate(): string {
    return getTodayISO();
  }

  private showCoachAlertDialog(): void {
    const protocol = this.protocolJson();

    if (!protocol) {
      return;
    }

    // Show coach alert message in a dialog or toast
    const alertMessage =
      protocol.coach_alert_message || "Coach has updated your plan.";
    const coachName = this.getCoachMessageAuthor();

    this.showCoachMessage(alertMessage, `Coach Alert from ${coachName}`);

    // If there's a coach note, show that too
    if (protocol.coach_note?.content) {
      const noteContent = protocol.coach_note.content;
      setTimeout(() => {
        this.showCoachMessage(noteContent, `Coach Note from ${coachName}`);
      }, 500);
    }
  }

  private acknowledgeCoachAlert(): void {
    const protocol = this.protocolJson();

    if (!protocol || !protocol.id) {
      this.toastService.error("Unable to acknowledge alert. Please refresh the page.");
      return;
    }

    const alertId = protocol.id;
    const sessionDate = protocol.protocol_date || getTodayISO();

    // Call backend endpoint to acknowledge coach alert
    this.api
      .post<{
        success: boolean;
        data?: unknown;
        error?: string;
        code?: string;
      }>(`/api/coach-alerts/${alertId}/acknowledge`, { sessionDate })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const payload = extractApiPayload<{ error?: string }>(response);
          if (isSuccessfulApiResponse(response)) {
            this.toastService.success("You can now proceed with training", "Alert Acknowledged");
            // Refresh protocol to update state
            this.loadTodayData();
          } else {
            this.toastService.error(payload?.error || "Failed to acknowledge alert");
          }
        },
        error: (err) => {
          this.logger.error("Failed to acknowledge coach alert", err);
          this.toastService.error("Failed to acknowledge alert. Please try again.");
        },
      });
  }

  private showCoachNoteDialog(): void {
    const noteContent = this.protocolJson()?.coach_note?.content?.trim();
    const coachName = this.getCoachMessageAuthor();

    if (!noteContent) {
      this.toastService.info("No coach note is attached to today's plan.", "Coach Note");
      return;
    }

    this.showCoachMessage(noteContent, `Coach Note from ${coachName}`);
  }

  private getCoachMessageAuthor(): string {
    return this.protocolJson()?.modified_by_coach_name || "Your coach";
  }

  private showCoachMessage(message: string, title: string): void {
    this.toastService.info(message, title, 10000);
  }

  private formatFocusLabel(focus: string): string {
    return focus
      .split("-")
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  }

  // ============================================================================
  // COMPUTED HELPERS FOR TEMPLATE
  // ============================================================================
  readonly todayDateLabel = computed(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  });

  readonly readinessDisplay = computed(() => {
    return this.todayProtocolFacade.buildReadinessDisplay(this.protocolJson(), {
      readinessScore: this.readinessScore(),
      acwrValue: this.acwrValue(),
      acwrRiskLevel: this.acwrRiskZone()?.level ?? null,
      hasCheckedInToday: this.hasCheckedInToday(),
    });
  });

  // ============================================================================
  // TEMPLATE HELPERS
  // ============================================================================
  /**
   * Get block by type from DailyProtocol
   * Returns null if block doesn't exist or has no exercises
   */
  getBlockByType(
    protocol: Partial<DailyProtocol>,
    blockType: string,
  ): ProtocolBlock | null {
    return this.todayProtocolFacade.getBlockByType(protocol, blockType);
  }

  /**
   * Format coach modification timestamp
   */
  formatCoachTimestamp(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 24) {
        const hours = Math.floor(diffHours);
        if (hours === 0) {
          const minutes = Math.floor(diffMs / (1000 * 60));
          return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
        }
        return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
      }

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return timestamp;
    }
  }
}
