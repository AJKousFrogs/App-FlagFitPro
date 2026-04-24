/**
 * Training Log Component
 *
 * Allows athletes to log their training sessions with:
 * - Session type selection
 * - Duration and RPE input
 * - Movement volume tracking (sprints, cuts, throws)
 * - Equipment used
 * - Weather conditions
 *
 * This component is CRITICAL for athlete safety as it feeds into:
 * - ACWR calculations
 * - Training load monitoring
 * - Injury prevention alerts
 */

import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  DestroyRef,
  OnInit,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { firstValueFrom } from "rxjs";
import {
  NonNullableFormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { AlertComponent } from "../../../shared/components/alert/alert.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { Slider } from "primeng/slider";
import { InputNumber } from "primeng/inputnumber";
import { TextareaComponent } from "../../../shared/components/textarea/textarea.component";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { ToastService } from "../../../core/services/toast.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { TrainingDataService } from "../../../core/services/training-data.service";
import { AcwrService } from "../../../core/services/acwr.service";
import { LoggerService } from "../../../core/services/logger.service";
import { OfflineQueueService } from "../../../core/services/offline-queue.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { HomeRouteService } from "../../../core/services/home-route.service";
import { SessionType as AcwrSessionType } from "../../../core/models/acwr.models";

interface SessionType {
  label: string;
  value: string;
  icon: string;
  description: string;
}

interface ExistingTrainingSession {
  id?: string | null;
  session_date?: string | null;
  session_type?: string | null;
  duration_minutes?: number | null;
  rpe?: number | null;
  notes?: string | null;
  session_metrics?: Record<string, unknown> | null;
}

@Component({
  selector: "app-training-log",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Slider,
    InputNumber,
    TextareaComponent,

    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    AlertComponent,
    CardShellComponent,
  ],
  templateUrl: "./training-log.component.html",
  styleUrl: "./training-log.component.scss",
})
export class TrainingLogComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly supabase = inject(SupabaseService);
  private readonly trainingDataService = inject(TrainingDataService);
  private readonly acwrService = inject(AcwrService);
  private readonly toastService = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly offlineQueue = inject(OfflineQueueService);
  private readonly homeRouteService = inject(HomeRouteService);

  readonly isSubmitting = signal(false);
  readonly showDetails = signal(false);
  readonly isReadOnly = signal(false);
  readonly overrideMessage = signal<string | null>(null);
  private activeSessionId: string | null = null;

  readonly sessionTypes: SessionType[] = [
    {
      label: "Practice",
      value: "practice",
      icon: "pi-flag",
      description: "Team practice session",
    },
    {
      label: "Game",
      value: "game",
      icon: "pi-trophy",
      description: "Competitive game",
    },
    {
      label: "Strength",
      value: "strength",
      icon: "pi-heart",
      description: "Gym/weight training",
    },
    {
      label: "Speed",
      value: "speed",
      icon: "pi-bolt",
      description: "Sprint/agility work",
    },
    {
      label: "Recovery",
      value: "recovery",
      icon: "pi-sun",
      description: "Light recovery session",
    },
    {
      label: "Skills",
      value: "skills",
      icon: "pi-bullseye",
      description: "Position-specific drills",
    },
  ];

  readonly today = new Date().toISOString().split("T")[0];

  readonly sessionForm: FormGroup = this.fb.group({
    sessionType: ["practice", Validators.required],
    sessionDate: [this.today, Validators.required],
    durationMinutes: [
      60,
      [Validators.required, Validators.min(1), Validators.max(300)],
    ],
    rpe: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
    sprintReps: [0],
    cuttingMovements: [0],
    throwCount: [0],
    jumpCount: [0],
    notes: [""],
  });

  readonly calculatedLoad = computed(() => {
    const duration = this.sessionForm.get("durationMinutes")?.value || 0;
    const rpe = this.sessionForm.get("rpe")?.value || 0;
    return duration * rpe;
  });

  // Late logging and conflict detection
  readonly logStatus = signal<"on_time" | "late" | "retroactive">("on_time");
  readonly requiresApproval = signal(false);
  readonly hoursDelayed = signal<number | null>(null);
  readonly conflicts = signal<
    {
      type: string;
      message: string;
      playerValue?: string;
      coachValue?: string;
    }[]
  >([]);

  readonly hasLateLogWarning = computed(() => this.logStatus() !== "on_time");
  readonly hasConflicts = computed(() => this.conflicts().length > 0);

  // Phase 2.2: ACWR before/after calculation
  readonly getAcwrBefore = computed(() => {
    // Get current ACWR from service
    return this.acwrService.acwrRatio() || 0;
  });

  readonly getAcwrAfter = computed(() => {
    // Estimate ACWR after this session is logged
    const currentACWR = this.getAcwrBefore();
    const sessionLoad = this.calculatedLoad();

    // Rough estimate: add session load to acute (7-day) window
    // This is a simplified calculation for display purposes
    const estimatedIncrease = sessionLoad / 1000; // Rough scaling factor
    return currentACWR + estimatedIncrease;
  });

  constructor() {
    // Watch for form changes - late logging detection can be added later
    // this.sessionForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
    //   this.detectLateLoggingAndConflicts();
    // });
  }

  ngOnInit(): void {
    const user = this.supabase.currentUser();
    if (!user) {
      void this.router.navigate(["/login"]);
      return;
    }

    this.observeRouteContext();

    this.sessionForm
      .get("sessionDate")
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.updateOverrideMessage());
    void this.updateOverrideMessage();
  }

  toggleDetails(): void {
    this.showDetails.update((value) => !value);
  }

  private observeRouteContext(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => {
        void this.applyRouteContext(query);
      });
  }

  private async applyRouteContext(query: ParamMap): Promise<void> {
    const sessionId = query.get("sessionId");
    const type = query.get("type");
    const duration = query.get("duration");
    const date = query.get("date");
    const viewMode = query.get("view") === "true";

    if (type) {
      this.sessionForm.patchValue({ sessionType: type });
    }

    if (duration && !isNaN(Number(duration))) {
      this.sessionForm.patchValue({ durationMinutes: Number(duration) });
    }

    if (date) {
      this.sessionForm.patchValue({ sessionDate: date });
    }

    this.setReadOnlyState(viewMode);

    if (sessionId && sessionId !== this.activeSessionId) {
      await this.loadExistingSession(sessionId);
    }
  }

  private async loadExistingSession(sessionId: string): Promise<void> {
    try {
      const session = await firstValueFrom(
        this.trainingDataService.getTrainingSession(sessionId),
      );
      if (!session) return;

      this.activeSessionId = session.id || null;
      this.applyExistingSession(session);
      await this.updateOverrideMessage();
    } catch (error) {
      this.logger.error("Failed to load existing training session", error);
      this.toastService.warn("Could not load your previous session — starting fresh.");
    }
  }

  selectSessionType(value: string): void {
    if (this.isReadOnly()) return;
    this.sessionForm.patchValue({ sessionType: value });
  }

  getRpeDescription(rpe: number): string {
    const descriptions: Record<number, string> = {
      1: "Rest",
      2: "Very Light",
      3: "Light",
      4: "Moderate",
      5: "Somewhat Hard",
      6: "Hard",
      7: "Very Hard",
      8: "Very Very Hard",
      9: "Near Max",
      10: "Maximum Effort",
    };
    return descriptions[rpe] || "";
  }

  async submitSession(): Promise<void> {
    if (this.isReadOnly()) {
      return;
    }
    if (this.sessionForm.invalid) {
      this.sessionForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    try {
      const sessionData = this.buildSessionData();
      const existingSessionId =
        this.activeSessionId ||
        (await this.findExistingSessionId(sessionData.session_date));

      await this.persistSession(sessionData, existingSessionId);
      this.handleSuccessfulSubmit(sessionData);
    } catch (error) {
      this.logger.error("Failed to log training session", error);

      // Check if we should queue this action for offline sync
      if (this.offlineQueue.shouldQueue(error)) {
        this.queueOfflineSubmission();
      } else {
        this.toastService.error(TOAST.ERROR.SESSION_LOG_FAILED);
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  cancel(): void {
    this.navigateToDashboard();
  }

  private buildSessionData(): {
    user_id: string;
    session_type: string;
    session_date: string;
    duration_minutes: number;
    rpe: number;
    training_load: number;
    session_metrics: {
      sprint_reps: number;
      cutting_movements: number;
      throw_count: number;
      jump_count: number;
    };
    notes: string;
  } {
    const formValue = this.sessionForm.getRawValue();
    const userId = this.supabase.userId() ?? "";
    const sessionDate = formValue.sessionDate || this.today;
    const duration = formValue.durationMinutes ?? 0;
    const rpe = formValue.rpe ?? 0;

    return {
      user_id: userId,
      session_type: formValue.sessionType,
      session_date: sessionDate,
      duration_minutes: duration,
      rpe,
      training_load: duration * rpe,
      session_metrics: {
        sprint_reps: formValue.sprintReps || 0,
        cutting_movements: formValue.cuttingMovements || 0,
        throw_count: formValue.throwCount || 0,
        jump_count: formValue.jumpCount || 0,
      },
      notes: formValue.notes,
    };
  }

  private async persistSession(
    sessionData: ReturnType<TrainingLogComponent["buildSessionData"]>,
    existingSessionId: string | null,
  ): Promise<void> {
    const completedAt = new Date().toISOString();

    if (existingSessionId) {
      await firstValueFrom(
        this.trainingDataService.updateTrainingSession(existingSessionId, {
          session_date: sessionData.session_date,
          session_type: sessionData.session_type,
          duration_minutes: sessionData.duration_minutes,
          rpe: sessionData.rpe,
          notes: sessionData.notes,
          session_metrics: sessionData.session_metrics,
          status: "completed",
          completed_at: completedAt,
        }),
      );
      return;
    }

    await firstValueFrom(
      this.trainingDataService.createTrainingSession({
        user_id: sessionData.user_id,
        session_date: sessionData.session_date,
        session_type: sessionData.session_type,
        duration_minutes: sessionData.duration_minutes,
        rpe: sessionData.rpe,
        notes: sessionData.notes,
        status: "completed",
        completed_at: completedAt,
        session_metrics: sessionData.session_metrics,
      }),
    );
  }

  private handleSuccessfulSubmit(
    sessionData: ReturnType<TrainingLogComponent["buildSessionData"]>,
  ): void {
    if (this.requiresApproval()) {
      this.toastService.warn(TOAST.WARN.RETROACTIVE_LOGGING_WARNING);
    }

    this.acwrService.addSession({
      playerId: sessionData.user_id,
      date: new Date(sessionData.session_date),
      sessionType: this.mapSessionType(sessionData.session_type),
      metrics: {
        type: "internal",
        internal: {
          sessionRPE: sessionData.rpe,
          duration: sessionData.duration_minutes,
          workload: sessionData.training_load,
        },
        calculatedLoad: sessionData.training_load,
      },
      load: sessionData.training_load,
      completed: true,
    });

    this.toastService.success(TOAST.SUCCESS.SESSION_LOGGED_SUCCESS);
    this.navigateToDashboard();
  }

  private queueOfflineSubmission(): void {
    const sessionData = this.buildSessionData();
    const offlinePayload = {
      session_type: sessionData.session_type,
      session_date: sessionData.session_date,
      duration_minutes: sessionData.duration_minutes,
      rpe: sessionData.rpe,
      notes: sessionData.notes,
      session_metrics: sessionData.session_metrics,
      status: "completed",
    };

    if (this.activeSessionId) {
      this.offlineQueue.queueGenericRequest(
        "/.netlify/functions/training-sessions",
        "PUT",
        { sessionId: this.activeSessionId, ...offlinePayload },
        "high",
      );
    } else {
      this.offlineQueue.queueAction("training_log", offlinePayload, "high");
    }

    this.toastService.info(
      "You're offline. Session queued for sync when connection is restored.",
    );
    this.navigateToDashboard();
  }

  private setReadOnlyState(readOnly: boolean): void {
    this.isReadOnly.set(readOnly);
    if (readOnly) {
      this.sessionForm.disable({ emitEvent: false });
      return;
    }

    this.sessionForm.enable({ emitEvent: false });
  }

  private applyExistingSession(
    session: ExistingTrainingSession,
  ): void {
    const sessionDate = session.session_date || this.today;
    this.sessionForm.patchValue({
      sessionType: session.session_type || "practice",
      sessionDate,
      durationMinutes: session.duration_minutes ?? 60,
      rpe: session.rpe ?? 5,
      notes: session.notes || "",
    });

    const metrics = (session.session_metrics || {}) as Record<string, unknown>;
    const hasMetrics = Object.keys(metrics).length > 0;
    this.showDetails.set(hasMetrics);

    if (!hasMetrics) {
      return;
    }

    this.sessionForm.patchValue({
      sprintReps: metrics.sprint_reps ?? 0,
      cuttingMovements: metrics.cutting_movements ?? 0,
      throwCount: metrics.throw_count ?? 0,
      jumpCount: metrics.jump_count ?? 0,
    });
  }

  private navigateToDashboard(): void {
    this.router.navigateByUrl(this.homeRouteService.getHomeRoute());
  }

  /**
   * Map form session type to ACWR SessionType
   */
  private mapSessionType(type: string): AcwrSessionType {
    const mapping: Record<string, AcwrSessionType> = {
      practice: "technical",
      game: "game",
      strength: "strength",
      speed: "sprint",
      recovery: "recovery",
      skills: "technical",
    };
    return mapping[type] || "technical";
  }

  private async findExistingSessionId(
    sessionDate: string,
  ): Promise<string | null> {
    try {
      const sessions = await firstValueFrom(
        this.trainingDataService.getTrainingSessions({
          startDate: sessionDate,
          endDate: sessionDate,
          includeUpcoming: true,
          limit: 10,
        }),
      );

      const match = sessions.find((session) => {
        const date = session.session_date;
        const status = session.status || "";
        return (
          date === sessionDate &&
          ["planned", "scheduled", "in_progress"].includes(status)
        );
      });

      return match?.id || null;
    } catch (error) {
      this.logger.error("Failed to resolve existing session", error);
      return null;
    }
  }

  private async updateOverrideMessage(): Promise<void> {
    if (this.isReadOnly()) {
      this.overrideMessage.set(null);
      return;
    }

    const formDate = this.sessionForm.get("sessionDate")?.value || this.today;
    const existing = this.activeSessionId
      ? this.activeSessionId
      : await this.findExistingSessionId(formDate);

    const dateLabel = formDate === this.today ? "today's" : "this";

    if (existing) {
      this.overrideMessage.set(
        `This log will replace ${dateLabel} planned session and count toward ACWR.`,
      );
    } else {
      this.overrideMessage.set(
        "This log will create a new session and count toward ACWR.",
      );
    }
  }

  /**
   * Get the label for the currently selected session type
   */
  getSelectedSessionTypeLabel(): string {
    const selectedValue = this.sessionForm.get("sessionType")?.value;
    const found = this.sessionTypes.find((t) => t.value === selectedValue);
    return found?.label || "";
  }

  /**
   * Get the message for what happens next after submit
   */
  getSubmitNextStepMessage(): string {
    if (this.requiresApproval()) {
      return "You'll be redirected to dashboard. Coach will review and approve, then ACWR will update.";
    }
    return "You'll be redirected to dashboard. ACWR will update immediately.";
  }
}
