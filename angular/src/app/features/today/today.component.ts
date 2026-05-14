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
import { mapToDailyProtocol } from "./utils/protocol-api-mapper";

// Services
import { DataSourceService } from "../../core/services/data-source.service";
import { HeaderService } from "../../core/services/header.service";
import { LoggerService } from "../../core/services/logger.service";
import { PeriodizationService } from "../../core/services/periodization.service";
import { ScheduleService } from "../../core/services/schedule.service";
import { ScreenReaderAnnouncerService } from "../../core/services/screen-reader-announcer.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { UnifiedTrainingService } from "../../core/services/unified-training.service";
import {
  ContinuityEvent,
  ContinuityIndicatorsService,
} from "../../core/services/continuity-indicators.service";

// Environment

// Utils
import { extractApiPayload } from "../../core/utils/api-response-mapper";
import { getDateKey, getTodayISO } from "../../shared/utils/date.utils";
import {
  ExactTrainingSummary,
  TodayProtocolFacade,
} from "./today-protocol.facade";
import { TodaySummaryHeaderComponent } from "./components/today-summary-header.component";
import { TodayQuickCheckinDialogComponent } from "./components/today-quick-checkin-dialog.component";
import { TodayPrescriptionCardComponent } from "./components/today-prescription-card.component";
import { TodayProtocolSectionComponent } from "./components/today-protocol-section.component";
import { TodayScheduleBannerComponent } from "./components/today-schedule-banner.component";
import { TodayStatusStackComponent } from "./components/today-status-stack.component";
import { TodayCoachMessagesService } from "./services/today-coach-messages.service";
import { TodayProtocolStateService } from "./services/today-protocol-state.service";
import { PageHeroComponent } from "../../shared/components/page-hero/page-hero.component";
import { KpiStripComponent, type KpiItem } from "../../shared/components/kpi-strip/kpi-strip.component";

// Constants
import { ROUTES, TIMEOUTS, TRAINING } from "../../core/constants/app.constants";
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

interface TodayEntryContext {
  title: string;
  message: string;
}


// Quick Check-in Types
interface QuickMood {
  value: number;
  /** PrimeIcons suffix, e.g. `pi-star-fill` → `class="pi pi-star-fill"` */
  icon: string;
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
  providers: [TodayProtocolStateService],
  imports: [
    RouterModule,
    SkeletonLoaderComponent,
    PageErrorStateComponent,
    ButtonComponent,
    MainLayoutComponent,
    TodayScheduleBannerComponent,
    TodayPrescriptionCardComponent,
    TodaySummaryHeaderComponent,
    TodayQuickCheckinDialogComponent,
    TodayProtocolSectionComponent,
    TodayStatusStackComponent,
    PageHeroComponent,
    KpiStripComponent,
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
  private readonly screenReaderAnnouncer = inject(ScreenReaderAnnouncerService);
  private readonly todayProtocolFacade = inject(TodayProtocolFacade);
  readonly protocolState = inject(TodayProtocolStateService);
  private readonly continuityIndicators = inject(ContinuityIndicatorsService);
  private readonly coachMessages = inject(TodayCoachMessagesService);
  protected readonly schedule = inject(ScheduleService);
  protected readonly periodization = inject(PeriodizationService);

  // Angular 21: viewChild signals for DOM element references
  private readonly protocolBlocks = viewChild<ElementRef>("protocolBlocks");
  private readonly celebrationOverlay = viewChild<ElementRef<HTMLDivElement>>(
    "celebrationOverlay",
  );

  // Guard to prevent duplicate initial loads
  private _initialLoadDone = false;

  // Computed userId from auth service - uses signal for reactivity
  // Per audit: use currentUser() signal, not getUser() method
  private readonly userId = computed(() => this.supabase.userId());

  // ============================================================================
  // STATE SIGNALS
  // ============================================================================
  readonly protocol = signal<Partial<DailyProtocol> | null>(null);
  readonly protocolJson = this.protocolState.protocolJson;
  readonly todayViewModel = signal<TodayViewModel | null>(null); // Resolved state
  readonly continuityEvents = signal<ContinuityEvent[]>([]);
  readonly error = this.protocolState.error;
  readonly isGeneratingProtocol = this.protocolState.isGenerating;
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
  readonly entryContext = signal<TodayEntryContext | null>(null);
  readonly merlinSessionId = signal<string | null>(null);
  readonly merlinReturnDraft = signal(
    "I reviewed today’s plan. Help me decide what to focus on next.",
  );

  // Quick Check-in Options
  readonly quickMoods: QuickMood[] = [
    { value: 1, icon: "pi-times", label: "Rough" },
    { value: 2, icon: "pi-minus", label: "Okay" },
    { value: 3, icon: "pi-circle", label: "Good" },
    { value: 4, icon: "pi-check-circle", label: "Great" },
    { value: 5, icon: "pi-star-fill", label: "Amazing" },
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
      .filter((block): block is ProtocolBlock => Boolean(block))
      .filter((block) => block.totalCount > 0);
  });

  /**
   * When the backend sets recovery focus (low readiness or high ACWR) or ACWR
   * is in a high-risk band, explain why today is mobility / light work.
   */
  readonly practiceDayCallout = computed(() => {
    const pj = this.protocolJson();
    const focus =
      pj?.training_focus ??
      (this.protocol()?.trainingFocus as string | undefined);
    const acwrLevel = pj?.acwr_presentation?.level;

    if (focus === "recovery") {
      const rationale =
        typeof pj?.ai_rationale === "string" ? pj.ai_rationale.trim() : "";
      return {
        variant: "recovery" as const,
        title: "Recovery day",
        body:
          rationale ||
          "Today emphasizes mobility and light work because readiness is low or workload (ACWR) is high. Skip heavy training.",
      };
    }

    if (acwrLevel === "elevated-risk" || acwrLevel === "danger-zone") {
      return {
        variant: "acwr-rest" as const,
        title: "Recovery emphasis",
        body:
          pj?.acwr_presentation?.text ??
          "Your workload ratio is elevated. Prioritize easy movement and recovery today.",
      };
    }

    return null;
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
      this.protocolState.load(getTodayISO(), (uid) => { void this.loadContinuityEvents(uid); }, id);
      void this.loadContinuityEvents(id);
    });

    // React to protocol state changes and resolve view model
    effect(() => {
      const protocolJson = this.protocolState.protocolJson();
      if (protocolJson) {
        this.resolveAndUpdateViewModel(protocolJson);
      } else if (this.protocolState.error()) {
        this.todayViewModel.set(resolveTodayState(null, this.currentTime()));
        this.protocol.set(null);
      }
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

    // Focus the celebration overlay when it opens so the (keydown) Escape
    // handler can actually fire. Without this, keyboard focus stays on
    // whatever element the user pressed (or no element at all) and the
    // Escape key never reaches the dialog (FIFTY_BAD_THINGS item 20).
    effect(() => {
      if (this.showCelebration()) {
        queueMicrotask(() => {
          this.celebrationOverlay()?.nativeElement.focus();
        });
      }
    });

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.pendingFocus.set(params.get("focus"));
        if (params.get("source") === "merlin") {
          this.merlinSessionId.set(params.get("session"));
          this.merlinReturnDraft.set(
            this.buildMerlinReturnDraft(params.get("focus")),
          );
          this.entryContext.set(
            this.buildEntryContext(params.get("source"), params.get("focus")),
          );
          this.consumeMerlinRouteParams(["source", "focus", "session"]);
        }
      });

    effect(() => {
      const focus = this.pendingFocus();
      if (!focus || this.isLoading() || this.isGeneratingProtocol()) {
        return;
      }

      queueMicrotask(() => {
        this.scrollToFirstBlock(false);
        if (!this.entryContext()) {
          this.toastService.info(
            `Opening today's plan for ${this.formatFocusLabel(focus)}`,
            "Workout Focus",
          );
        }
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { focus: null },
          queryParamsHandling: "merge",
          replaceUrl: true,
        });
      });
    });
  }

  private resolveAndUpdateViewModel(protocolJson: ProtocolJson): void {
    this.todayViewModel.set(resolveTodayState(protocolJson, this.currentTime()));
    const full = this.protocolState.fullProtocolData;
    if (full) {
      this.protocol.set(mapToDailyProtocol(full));
    } else if (protocolJson.blocks) {
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
    this.protocolState.load(getTodayISO());
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
    this.dismissEntryContext();
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
    this.dismissEntryContext();
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

  onCelebrationBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.dismissCelebration();
    }
  }

  onCelebrationKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      event.preventDefault();
      this.dismissCelebration();
    }
  }

  // ============================================================================
  // PROTOCOL GENERATION
  // ============================================================================
  private readonly _isGeneratingLegacy = signal(false);

  generateProtocol(): void {
    this._isGeneratingLegacy.set(true);
    // Announce loading state to screen readers
    this.screenReaderAnnouncer.announceLoading("training protocol");
    this.trainingService.generateDailyProtocol<Partial<DailyProtocol>>()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const payload = extractApiPayload<Partial<DailyProtocol>>(response);
          if (payload) {
            this.protocol.set(payload);
            this.toastService.success("Your personalized training plan is ready!", "Protocol Generated");
            this.screenReaderAnnouncer.announceSuccess("Your personalized training plan is ready!");
          }
          this._isGeneratingLegacy.set(false);
        },
        error: (err) => {
          this.logger.error("Protocol request failed", err);
          this.toastService.error("Request failed. Please try again.");
          this.screenReaderAnnouncer.announceAssertive("Error: Request failed. Please try again.");
          this._isGeneratingLegacy.set(false);
        },
      });
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================
  navigateToAcwr(): void {
    this.router.navigate([ROUTES.ACWR]);
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
    this.router.navigate(["/training"]);
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
    this.dismissEntryContext();
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
        this.coachMessages.showAlert(this.protocolJson());
        break;

      case "acknowledge_coach_alert":
        this.acknowledgeCoachAlert();
        break;

      case "view_coach_note":
        this.coachMessages.showNote(this.protocolJson());
        break;

      default:
        this.logger.warn(`Unknown CTA action: ${actionId}`);
        this.toastService.warn("This action is not yet implemented", "Action Not Available");
    }
  }

  private scrollToFirstBlock(dismissContext = true): void {
    if (dismissContext) {
      this.dismissEntryContext();
    }
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

  private acknowledgeCoachAlert(): void {
    const protocol = this.protocolJson();

    if (!protocol || !protocol.id) {
      this.toastService.error("Unable to acknowledge alert. Please refresh the page.");
      return;
    }

    this.coachMessages
      .acknowledge(protocol.id, this.coachMessages.resolveSessionDate(protocol))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          if (result.ok) {
            this.toastService.success(
              "You can now proceed with training",
              "Alert Acknowledged",
            );
            // Refresh protocol to update state
            this.protocolState.load(getTodayISO());
          } else {
            this.toastService.error(result.message ?? "Failed to acknowledge alert");
          }
        },
        error: (err) => {
          this.logger.error("Failed to acknowledge coach alert", err);
          this.toastService.error("Failed to acknowledge alert. Please try again.");
        },
      });
  }

  private formatFocusLabel(focus: string): string {
    return focus
      .split("-")
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  }

  private buildEntryContext(
    source: string | null,
    focus: string | null,
  ): TodayEntryContext | null {
    if (source !== "merlin") {
      return null;
    }

    if (focus === "protocol") {
      return {
        title: "Merlin sent you here to review today’s plan",
        message:
          "Check today’s protocol, current readiness, and any coaching updates before you start training.",
      };
    }

    if (focus === "checkin") {
      return {
        title: "Merlin sent you here to complete today’s check-in",
        message:
          "Update your readiness first so today’s protocol and recovery decisions stay grounded in current data.",
      };
    }

    return {
      title: "Merlin sent you here for daily follow-through",
      message:
        "Use Today to confirm what you should do next, review the current protocol, and stay aligned with your readiness state.",
    };
  }

  private buildMerlinReturnDraft(focus: string | null): string {
    if (focus === "protocol") {
      return "I reviewed today’s protocol. Based on the current plan, what should I focus on or watch out for?";
    }

    if (focus === "checkin") {
      return "I’m back from Today. Use my current readiness and protocol to tell me the next best action.";
    }

    return "I reviewed today’s plan. Help me decide the next best step.";
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
  // PHASE 3a — PAGE HERO KPIs
  // ============================================================================
  readonly heroEyebrow = computed(() => this.todayDateLabel().toUpperCase());

  readonly heroSubtitle = computed(() => {
    const p = this.protocol();
    if (!p) return "Your training plan is ready.";
    const total = p.totalExercises ?? 0;
    const done = p.completedExercises ?? 0;
    if (total === 0) return "Your training plan is ready.";
    if (done >= total) return "Today's training is complete — nice work.";
    return `${total - done} of ${total} exercises remaining today.`;
  });

  readonly kpiItems = computed<readonly KpiItem[]>(() => {
    const p = this.protocol();
    const stats = this.weekStats();
    const readiness = this.readinessScore();

    const exercisesValue = p
      ? `${p.completedExercises ?? 0}/${p.totalExercises ?? 0}`
      : "0/0";

    return [
      { value: exercisesValue,                label: "Exercises" },
      { value: String(stats.currentStreak),   label: "Day streak" },
      { value: readiness != null ? String(readiness) : "—", label: "Readiness" },
      {
        value: stats.weeklyLoadAu != null ? String(stats.weeklyLoadAu) : "—",
        label: "Load (AU)",
      },
    ];
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

  /** Format coach modification timestamp. Delegated to the coach-messages service. */
  formatCoachTimestamp(timestamp: string): string {
    return this.coachMessages.formatTimestamp(timestamp);
  }
}
