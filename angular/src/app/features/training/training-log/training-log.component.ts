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
} from "@angular/core";
import { firstValueFrom } from "rxjs";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { Slider } from "primeng/slider";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { Textarea } from "primeng/textarea";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { Message } from "primeng/message";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { ToastService } from "../../../core/services/toast.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { AuthService } from "../../../core/services/auth.service";
import { TrainingDataService } from "../../../core/services/training-data.service";
import { AcwrService } from "../../../core/services/acwr.service";
import { LoggerService } from "../../../core/services/logger.service";
import { OfflineQueueService } from "../../../core/services/offline-queue.service";
import { SessionType as AcwrSessionType } from "../../../core/models/acwr.models";

interface SessionType {
  label: string;
  value: string;
  icon: string;
  description: string;
}

@Component({
  selector: "app-training-log",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Slider,
    InputNumberModule,
    InputTextModule,
    Textarea,
    TagModule,
    ToastModule,
    Message,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    CardShellComponent,
  ],
  template: `
    <p-toast></p-toast>
    <app-main-layout>
      <div class="training-log-page">
        <app-page-header
          title="Log Training Session"
          subtitle="Record your training to track load and prevent injuries"
          icon="pi-plus-circle"
        >
          <app-button
            variant="outlined"
            iconLeft="pi-times"
            (clicked)="cancel()"
            >Cancel</app-button
          >
        </app-page-header>

        <form [formGroup]="sessionForm" (ngSubmit)="submitSession()">
          <!-- Session Type Selection -->
          <app-card-shell title="Session Type" headerIcon="pi-tag">
            <div class="session-types-grid">
              @for (type of sessionTypes; track type.value) {
                <div
                  class="session-type-card"
                  [class.selected]="
                    sessionForm.get('sessionType')?.value === type.value
                  "
                  (click)="selectSessionType(type.value)"
                >
                  <i class="type-icon pi" [ngClass]="type.icon"></i>
                  <span class="type-label">{{ type.label }}</span>
                  <span class="type-description">{{ type.description }}</span>
                </div>
              }
            </div>
            @if (sessionForm.get("sessionType")?.value) {
              <small class="state-narration">
                <strong>What changed:</strong> Session type set to
                {{ getSelectedSessionTypeLabel() }}. <strong>Why:</strong> You
                selected this session type. <strong>What it means:</strong> This
                determines how your training load is categorized for ACWR
                calculations. <strong>Who:</strong> You control this selection.
                <strong>What next:</strong> Continue filling out duration, RPE,
                and other details below.
              </small>
            }
          </app-card-shell>

          <!-- Session Date -->
          <app-card-shell title="Session Date" headerIcon="pi-calendar">
            <div class="form-field">
              <label for="sessionDate">When did this session occur?</label>
              <input
                type="date"
                id="sessionDate"
                formControlName="sessionDate"
                class="date-input"
                [max]="today"
              />
              <small>Select the date when this session actually occurred</small>
            </div>
          </app-card-shell>

          <!-- Duration and Intensity -->
          <app-card-shell title="Duration & Intensity" headerIcon="pi-clock">
            <div class="form-grid">
              <div class="form-field">
                <label for="duration">Duration (minutes)</label>
                <p-inputNumber
                  id="duration"
                  formControlName="durationMinutes"
                  [min]="1"
                  [max]="300"
                  [showButtons]="true"
                  placeholder="Enter duration"
                ></p-inputNumber>
                @if (sessionForm.get("durationMinutes")?.value) {
                  <small class="state-narration">
                    <strong>What changed:</strong> Duration set to
                    {{ sessionForm.get("durationMinutes")?.value }} minutes.
                    <strong>Why:</strong> Based on your input.
                    <strong>What it means:</strong> Duration is multiplied by
                    RPE to calculate training load ({{ calculatedLoad() }} AU).
                    <strong>Who:</strong> You control this value.
                    <strong>What next:</strong> Training load updates
                    automatically below as you change duration or RPE.
                  </small>
                }
              </div>

              <div class="form-field">
                <label for="rpe">
                  Session RPE (1-10)
                  <span class="rpe-help">
                    @if (sessionForm.get("rpe")?.value) {
                      - {{ getRpeDescription(sessionForm.get("rpe")?.value) }}
                    }
                  </span>
                </label>
                <p-slider
                  id="rpe"
                  formControlName="rpe"
                  [min]="1"
                  [max]="10"
                  [step]="1"
                ></p-slider>
                <div class="rpe-scale">
                  <span>1 (Rest)</span>
                  <span>5 (Hard)</span>
                  <span>10 (Max)</span>
                </div>
                @if (sessionForm.get("rpe")?.value) {
                  <small class="state-narration">
                    <strong>What changed:</strong> RPE set to
                    {{ sessionForm.get("rpe")?.value }}/10 ({{
                      getRpeDescription(sessionForm.get("rpe")?.value)
                    }}). <strong>Why:</strong> Based on your input.
                    <strong>What it means:</strong> RPE measures perceived
                    exertion. It's multiplied by duration to calculate training
                    load ({{ calculatedLoad() }} AU), which affects your ACWR.
                    <strong>Who:</strong> You control this value.
                    <strong>What next:</strong> Training load updates
                    automatically below. This load will be added to your ACWR
                    calculations.
                  </small>
                }
              </div>
            </div>

            <!-- Calculated Load Display -->
            <div class="calculated-load">
              <div class="load-label">Estimated Training Load</div>
              <div class="load-value">{{ calculatedLoad() }} AU</div>
              <div class="load-formula">
                {{ sessionForm.get("durationMinutes")?.value || 0 }} min ×
                {{ sessionForm.get("rpe")?.value || 0 }} RPE
              </div>
              <small
                class="state-narration"
                style="margin-top: var(--space-3); display: block;"
              >
                <strong>What changed:</strong> Training load calculated as
                {{ calculatedLoad() }} AU. <strong>Why:</strong> System
                automatically calculates: Duration ({{
                  sessionForm.get("durationMinutes")?.value || 0
                }}
                min) × RPE ({{ sessionForm.get("rpe")?.value || 0 }}) =
                {{ calculatedLoad() }} AU. <strong>What it means:</strong> This
                load will be added to your 7-day acute workload for ACWR
                calculations.
                {{
                  calculatedLoad() > 500
                    ? "High load - may increase injury risk if ACWR exceeds 1.5."
                    : calculatedLoad() > 300
                      ? "Moderate load."
                      : "Low load - good for recovery days."
                }}
                <strong>Who:</strong> System calculates this automatically from
                your inputs. <strong>What next:</strong>
                {{
                  hasLateLogWarning()
                    ? "See timing notice below for ACWR impact."
                    : "When you submit, this load will update your ACWR ratio."
                }}
              </small>
            </div>
          </app-card-shell>

          <!-- Movement Volume (Position-Specific) -->
          <app-card-shell
            title="Movement Volume (Optional)"
            headerIcon="pi-bolt"
          >
            <div class="form-grid">
              <div class="form-field">
                <label for="sprints">Sprint Repetitions</label>
                <p-inputNumber
                  id="sprints"
                  formControlName="sprintReps"
                  [min]="0"
                  [max]="100"
                  [showButtons]="true"
                  placeholder="0"
                ></p-inputNumber>
                <small>Max recommended: 30/session</small>
              </div>

              <div class="form-field">
                <label for="cuts">Cutting Movements</label>
                <p-inputNumber
                  id="cuts"
                  formControlName="cuttingMovements"
                  [min]="0"
                  [max]="200"
                  [showButtons]="true"
                  placeholder="0"
                ></p-inputNumber>
                <small>Max recommended: 50/session</small>
              </div>

              <div class="form-field">
                <label for="throws">Throws (QB only)</label>
                <p-inputNumber
                  id="throws"
                  formControlName="throwCount"
                  [min]="0"
                  [max]="150"
                  [showButtons]="true"
                  placeholder="0"
                ></p-inputNumber>
                <small>Max recommended: 60/session</small>
              </div>

              <div class="form-field">
                <label for="jumps">Jump/Plyo Count</label>
                <p-inputNumber
                  id="jumps"
                  formControlName="jumpCount"
                  [min]="0"
                  [max]="100"
                  [showButtons]="true"
                  placeholder="0"
                ></p-inputNumber>
                <small>Max recommended: 40/session</small>
              </div>
            </div>
          </app-card-shell>

          <!-- Notes -->
          <app-card-shell title="Notes" headerIcon="pi-pencil">
            <div class="form-field">
              <textarea
                pTextarea
                formControlName="notes"
                [rows]="4"
                placeholder="Add any notes about this session (injuries, fatigue, weather, etc.)"
              ></textarea>
            </div>
          </app-card-shell>

          <!-- Phase 2.2: Late Log Framing - Neutral tone with ACWR impact -->
          @if (hasLateLogWarning()) {
            <app-card-shell
              title="Session Timing Notice"
              headerIcon="pi-info-circle"
            >
              <div class="late-log-notice">
                @if (logStatus() === "retroactive") {
                  <div class="notice-content notice-retroactive">
                    <div class="notice-header">
                      <i class="pi pi-calendar-clock"></i>
                      <div class="notice-title-section">
                        <strong
                          >Logged {{ hoursDelayed() }} hours after
                          session</strong
                        >
                        <span class="notice-subtitle"
                          >Flagged for accuracy review</span
                        >
                      </div>
                    </div>

                    <!-- Phase 2.2: ACWR Impact Display -->
                    <div class="acwr-impact-section">
                      <strong>ACWR Impact:</strong>
                      <div class="impact-comparison">
                        <div class="impact-item">
                          <span class="impact-label">Before this log:</span>
                          <span class="impact-value">{{
                            getAcwrBefore() | number: "1.2-2"
                          }}</span>
                        </div>
                        <div class="impact-arrow">→</div>
                        <div class="impact-item">
                          <span class="impact-label">After this log:</span>
                          <span class="impact-value">{{
                            getAcwrAfter() | number: "1.2-2"
                          }}</span>
                        </div>
                      </div>
                      <p class="impact-note">
                        ACWR will update once this session is approved.
                      </p>
                    </div>
                    <small
                      class="state-narration"
                      style="margin-top: var(--space-2); display: block;"
                    >
                      <strong>What changed:</strong> Logging
                      {{ hoursDelayed() }} hours after session completion.
                      <strong>Why:</strong> You're entering this session
                      retroactively (more than 24 hours late).
                      <strong>What it means:</strong> ACWR will change from
                      {{ getAcwrBefore() | number: "1.2-2" }} to approximately
                      {{ getAcwrAfter() | number: "1.2-2" }} after approval.
                      Retroactive logs require coach review for accuracy.
                      <strong>Who:</strong> Your coach will review and approve
                      this entry. <strong>What next:</strong> Coach has been
                      notified. You'll be notified when approved. ACWR updates
                      after approval.
                    </small>

                    <!-- Phase 2.2: Approval Status Visibility -->
                    <div class="approval-status-section">
                      <div class="status-badge pending">
                        <i class="pi pi-clock"></i>
                        <span>Status: Pending coach review</span>
                      </div>
                      <p class="status-note">
                        Your coach has been notified and will review this entry.
                        You'll be notified when it's approved.
                      </p>
                    </div>
                  </div>
                } @else if (logStatus() === "late") {
                  <div class="notice-content notice-late">
                    <div class="notice-header">
                      <i class="pi pi-clock"></i>
                      <div class="notice-title-section">
                        <strong
                          >Logged {{ hoursDelayed() }} hours after
                          session</strong
                        >
                        <span class="notice-subtitle"
                          >Flagged for accuracy</span
                        >
                      </div>
                    </div>

                    <!-- Phase 2.2: ACWR Impact Display -->
                    <div class="acwr-impact-section">
                      <strong>ACWR Impact:</strong>
                      <div class="impact-comparison">
                        <div class="impact-item">
                          <span class="impact-label">Before this log:</span>
                          <span class="impact-value">{{
                            getAcwrBefore() | number: "1.2-2"
                          }}</span>
                        </div>
                        <div class="impact-arrow">→</div>
                        <div class="impact-item">
                          <span class="impact-label">After this log:</span>
                          <span class="impact-value">{{
                            getAcwrAfter() | number: "1.2-2"
                          }}</span>
                        </div>
                      </div>
                      <p class="impact-note">
                        ACWR updated automatically. No approval needed.
                      </p>
                    </div>
                    <small
                      class="state-narration"
                      style="margin-top: var(--space-2); display: block;"
                    >
                      <strong>What changed:</strong> Logging
                      {{ hoursDelayed() }} hours after session completion.
                      <strong>Why:</strong> You're entering this session late
                      (within 24 hours but after completion).
                      <strong>What it means:</strong> ACWR will update
                      automatically from
                      {{ getAcwrBefore() | number: "1.2-2" }} to approximately
                      {{ getAcwrAfter() | number: "1.2-2" }}. No coach approval
                      needed. <strong>Who:</strong> System will update ACWR
                      automatically when you submit.
                      <strong>What next:</strong> Submit your log to update ACWR
                      immediately.
                    </small>
                  </div>
                }
              </div>
            </app-card-shell>
          }

          <!-- Conflict Warning -->
          @if (hasConflicts()) {
            <app-card-shell
              title="Data Conflict Detected"
              headerIcon="pi-exclamation-circle"
            >
              <div class="conflict-warning">
                @for (conflict of conflicts(); track conflict.type) {
                  <p-message severity="warn">
                    <div class="warning-content">
                      <i class="pi pi-info-circle"></i>
                      <div>
                        <strong>Conflict: {{ conflict.type }}</strong>
                        <p>{{ conflict.message }}</p>
                        <p class="conflict-detail">
                          RPE: {{ conflict.playerValue }} vs Session Type:
                          {{ conflict.coachValue }}
                        </p>
                      </div>
                    </div>
                  </p-message>
                }
                <small
                  class="state-narration"
                  style="margin-top: var(--space-3); display: block;"
                >
                  <strong>What changed:</strong> Conflict detected between your
                  RPE input and expected session type intensity.
                  <strong>Why:</strong> Your RPE ({{
                    conflicts()[0]?.playerValue
                  }}) doesn't match the typical intensity for this session type
                  ({{ conflicts()[0]?.coachValue }}).
                  <strong>What it means:</strong> This may indicate the session
                  was harder/easier than expected, or there's a data entry
                  issue. Your log will still be saved.
                  <strong>Who:</strong> System detected this automatically. You
                  can adjust RPE if needed, or proceed as-is.
                  <strong>What next:</strong> Review your RPE value. If correct,
                  proceed with submission. Coach may follow up if needed.
                </small>
              </div>
            </app-card-shell>
          }

          <!-- Submit Button -->
          <div class="form-actions">
            <app-button
              iconLeft="pi-check"
              [loading]="isSubmitting()"
              [disabled]="sessionForm.invalid"
              >Log Session</app-button
            >
            @if (isSubmitting()) {
              <div
                class="submit-narration"
                style="width: 100%; margin-top: var(--space-2); padding: var(--space-2); background: var(--surface-secondary); border-radius: var(--radius-md);"
              >
                <small class="state-narration">
                  <strong>What changed:</strong> Session is being saved.
                  <strong>Why:</strong> You clicked "Log Session".
                  <strong>What it means:</strong> Your training session ({{
                    getSelectedSessionTypeLabel()
                  }}, {{ calculatedLoad() }} AU load) is being recorded.
                  <strong>Who:</strong> System is processing your submission{{
                    requiresApproval()
                      ? ". Coach will review for approval."
                      : "."
                  }}
                  <strong>What next:</strong> {{ getSubmitNextStepMessage() }}
                </small>
              </div>
            }
          </div>
        </form>
      </div>
    </app-main-layout>
  `,
  styleUrl: "./training-log.component.scss",
})
export class TrainingLogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly trainingDataService = inject(TrainingDataService);
  private readonly acwrService = inject(AcwrService);
  private readonly toastService = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly offlineQueue = inject(OfflineQueueService);

  readonly isSubmitting = signal(false);

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

  readonly sessionForm: FormGroup = this.fb.group({
    sessionType: ["practice", Validators.required],
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
    Array<{
      type: string;
      message: string;
      playerValue?: string;
      coachValue?: string;
    }>
  >([]);

  readonly hasLateLogWarning = computed(() => this.logStatus() !== "on_time");
  readonly hasConflicts = computed(() => this.conflicts().length > 0);
  readonly today = new Date().toISOString().split("T")[0];

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
    // this.sessionForm.valueChanges.subscribe(() => {
    //   this.detectLateLoggingAndConflicts();
    // });

    // Pre-fill athlete ID if available
    const user = this.authService.getUser();
    if (!user) {
      this.router.navigate(["/login"]);
    }
  }

  selectSessionType(value: string): void {
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
    if (this.sessionForm.invalid) {
      this.sessionForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    try {
      const formValue = this.sessionForm.value;
      const user = this.authService.getUser();
      const sessionDate =
        formValue.sessionDate || new Date().toISOString().split("T")[0];

      const sessionData = {
        athlete_id: user?.id,
        session_type: formValue.sessionType,
        session_date: sessionDate,
        duration_minutes: formValue.durationMinutes,
        rpe: formValue.rpe,
        training_load: formValue.durationMinutes * formValue.rpe,
        sprint_reps: formValue.sprintReps || 0,
        cutting_movements: formValue.cuttingMovements || 0,
        throw_count: formValue.throwCount || 0,
        jump_count: formValue.jumpCount || 0,
        notes: formValue.notes,
      };

      // Save to database via service (includes late logging and conflict detection)
      await firstValueFrom(
        this.trainingDataService.createTrainingSession({
          user_id: user?.id || "",
          session_date: sessionData.session_date,
          session_type: sessionData.session_type,
          duration_minutes: sessionData.duration_minutes,
          rpe: sessionData.rpe,
          notes: sessionData.notes,
        }),
      );

      // Show warning if retroactive approval required
      if (this.requiresApproval()) {
        this.toastService.warn(TOAST.WARN.RETROACTIVE_LOGGING_WARNING);
      }

      // Update ACWR calculations
      this.acwrService.addSession({
        playerId: user?.id || "",
        date: new Date(sessionDate),
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
      this.router.navigate(["/dashboard"]);
    } catch (error) {
      this.logger.error("Failed to log training session", error);

      // Check if we should queue this action for offline sync
      if (this.offlineQueue.shouldQueue(error)) {
        const formValue = this.sessionForm.value;
        const user = this.authService.getUser();
        const sessionData = {
          athlete_id: user?.id,
          session_type: formValue.sessionType,
          session_date:
            formValue.sessionDate || new Date().toISOString().split("T")[0],
          duration_minutes: formValue.durationMinutes,
          rpe: formValue.rpe,
          training_load: formValue.durationMinutes * formValue.rpe,
          notes: formValue.notes,
        };

        this.offlineQueue.queueAction("training_log", sessionData, "high");
        this.toastService.info(
          "You're offline. Session queued for sync when connection is restored.",
        );
        this.router.navigate(["/dashboard"]);
      } else {
        this.toastService.error(TOAST.ERROR.SESSION_LOG_FAILED);
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  cancel(): void {
    this.router.navigate(["/dashboard"]);
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
