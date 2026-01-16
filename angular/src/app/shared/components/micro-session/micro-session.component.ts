/**
 * Micro-Session Component
 *
 * Phase 2: Interactive workout/activity session with tracking
 *
 * Features:
 * - Step-by-step guided session with timer
 * - Equipment checklist
 * - Progress tracking
 * - Completion button with follow-up prompt
 * - Visual feedback and animations
 */

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
  input,
  output,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Card } from "primeng/card";
import { Checkbox } from "primeng/checkbox";
import { Dialog } from "primeng/dialog";
import { ProgressBar } from "primeng/progressbar";
import { Slider } from "primeng/slider";
import { Textarea } from "primeng/textarea";
import { Tooltip } from "primeng/tooltip";
import { StatusTagComponent } from "../status-tag/status-tag.component";
import { firstValueFrom } from "rxjs";
import { ApiService } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { ButtonComponent } from "../button/button.component";
import { formatTimeMMSS } from "../../utils/format.utils";

export interface MicroSessionStep {
  order: number;
  instruction: string;
  duration_seconds: number;
}

export interface MicroSessionData {
  id?: string;
  title: string;
  description?: string;
  session_type: string;
  estimated_duration_minutes: number;
  equipment_needed: string[];
  intensity_level: string;
  position_relevance: string[];
  steps: MicroSessionStep[];
  coaching_cues: string[];
  safety_notes?: string | null;
  follow_up_prompt: string;
  source_message_id?: string;
}

type SessionStatus =
  | "ready"
  | "equipment_check"
  | "in_progress"
  | "paused"
  | "completed"
  | "follow_up";

@Component({
  selector: "app-micro-session",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    Card,
    Dialog,
    ProgressBar,
    Checkbox,
    Slider,
    Tooltip,
    Textarea,

    ButtonComponent,
    StatusTagComponent,
  ],
  template: `
    <!-- Session Card / Modal -->
    @if (mode() === "modal") {
      <p-dialog
        [header]="session().title"
        [(visible)]="dialogVisible"
        [modal]="true"
        [closable]="currentStatus() !== 'in_progress'"
        [dismissableMask]="currentStatus() !== 'in_progress'"
        [style]="{ width: '500px', maxWidth: '95vw' }"
        (onHide)="onDialogHide()"
      >
        <ng-container *ngTemplateOutlet="sessionContent"></ng-container>
      </p-dialog>
    } @else {
      <p-card class="micro-session-card">
        <ng-template pTemplate="header">
          <div class="card-header">
            <div class="header-info">
              <app-status-tag
                [value]="getSessionTypeLabel(session().session_type)"
                [severity]="getSessionTypeSeverity(session().session_type)"
                size="sm"
              />
              <span class="duration-badge">
                <i class="pi pi-clock"></i>
                {{ session().estimated_duration_minutes }} min
              </span>
            </div>
            <h3>{{ session().title }}</h3>
            @if (session().description) {
              <p class="description">{{ session().description }}</p>
            }
          </div>
        </ng-template>

        <ng-container *ngTemplateOutlet="sessionContent"></ng-container>
      </p-card>
    }

    <!-- Shared Session Content Template -->
    <ng-template #sessionContent>
      <div class="session-body">
        <!-- Ready State -->
        @if (currentStatus() === "ready") {
          <div class="ready-state">
            <!-- Equipment Check Button -->
            @if (
              session().equipment_needed.length > 0 && !hasRequiredEquipment()
            ) {
              <div class="equipment-needed">
                <h4>
                  <i class="pi pi-box"></i>
                  Equipment Needed
                </h4>
                <div class="equipment-list">
                  @for (item of session().equipment_needed; track item) {
                    <span class="equipment-item">{{ item }}</span>
                  }
                </div>
              </div>
            }

            <!-- Safety Notes -->
            @if (session().safety_notes) {
              <div class="safety-notes">
                <i class="pi pi-exclamation-triangle"></i>
                <span>{{ session().safety_notes }}</span>
              </div>
            }

            <!-- Coaching Cues -->
            @if (session().coaching_cues.length > 0) {
              <div class="coaching-cues">
                <h4>Key Points</h4>
                <ul>
                  @for (cue of session().coaching_cues; track cue) {
                    <li>{{ cue }}</li>
                  }
                </ul>
              </div>
            }

            <!-- Start Button -->
            <div class="action-buttons">
              <app-button iconLeft="pi-play" (clicked)="startSession()"
                >Start Session</app-button
              >
              <app-button variant="text" (clicked)="skipSession()"
                >Skip</app-button
              >
            </div>
          </div>
        }

        <!-- Equipment Check State -->
        @if (currentStatus() === "equipment_check") {
          <div class="equipment-check-state">
            <h4>Confirm Equipment</h4>
            <div class="equipment-checklist">
              @for (
                item of session().equipment_needed;
                track item;
                let i = $index
              ) {
                <div class="checklist-item">
                  <p-checkbox
                    [(ngModel)]="equipmentChecked[i]"
                    [binary]="true"
                    variant="filled"
                    [inputId]="'equipment-' + i"
                  ></p-checkbox>
                  <label [for]="'equipment-' + i">{{ item }}</label>
                </div>
              }
            </div>
            <div class="action-buttons">
              <app-button
                iconLeft="pi-arrow-right"
                [disabled]="!allEquipmentChecked()"
                (clicked)="confirmEquipment()"
                >Continue</app-button
              >
              <app-button variant="text" (clicked)="skipEquipmentCheck()"
                >Don't have equipment</app-button
              >
            </div>
          </div>
        }

        <!-- In Progress State -->
        @if (
          currentStatus() === "in_progress" || currentStatus() === "paused"
        ) {
          <div class="in-progress-state">
            <!-- Overall Progress -->
            <div class="overall-progress">
              <span
                >Step {{ currentStepIndex() + 1 }} of
                {{ session().steps.length }}</span
              >
              <p-progressBar
                [value]="overallProgress()"
                [showValue]="false"
                styleClass="overall-bar"
              ></p-progressBar>
            </div>

            <!-- Current Step -->
            <div
              class="current-step"
              [class.paused]="currentStatus() === 'paused'"
            >
              <div class="step-instruction">
                {{ currentStep().instruction }}
              </div>

              <!-- Step Timer -->
              <div class="step-timer">
                <div class="timer-circle" [class]="timerClass()">
                  <span class="timer-value">{{
                    formatTime(stepTimeRemaining())
                  }}</span>
                  <span class="timer-label">{{
                    currentStatus() === "paused" ? "PAUSED" : "remaining"
                  }}</span>
                </div>
              </div>

              <!-- Step Progress Bar -->
              <p-progressBar
                [value]="stepProgress()"
                [showValue]="false"
                styleClass="step-bar"
              ></p-progressBar>
            </div>

            <!-- Controls -->
            <div class="session-controls">
              @if (currentStatus() === "paused") {
                <app-button iconLeft="pi-play" (clicked)="resumeSession()"
                  >Resume</app-button
                >
              } @else {
                <app-button
                  variant="secondary"
                  iconLeft="pi-pause"
                  (clicked)="pauseSession()"
                  >Pause</app-button
                >
              }

              <app-button
                iconLeft="pi-forward"
                variant="secondary"
                [disabled]="currentStepIndex() >= session().steps.length - 1"
                (clicked)="nextStep()"
                >Next Step</app-button
              >

              <app-button
                variant="success"
                iconLeft="pi-check"
                (clicked)="completeSession()"
                >Complete</app-button
              >
            </div>

            <!-- Elapsed Time -->
            <div class="elapsed-time">
              Total time: {{ formatTime(totalElapsedTime()) }}
            </div>
          </div>
        }

        <!-- Completed State -->
        @if (currentStatus() === "completed") {
          <div class="completed-state">
            <div class="completion-icon">
              <i class="pi pi-check-circle"></i>
            </div>
            <h3>Great Work!</h3>
            <p>
              You completed the session in {{ formatTime(totalElapsedTime()) }}
            </p>

            <div class="completion-stats">
              <div class="stat">
                <span class="stat-block__value">{{ session().steps.length }}</span>
                <span class="stat-block__label">Steps</span>
              </div>
              <div class="stat">
                <span class="stat-block__value">{{
                  Math.round(totalElapsedTime() / 60)
                }}</span>
                <span class="stat-block__label">Minutes</span>
              </div>
            </div>

            <!-- Follow-up Prompt -->
            @if (session().follow_up_prompt && !followUpSubmitted()) {
              <div class="follow-up-section">
                <h4>{{ session().follow_up_prompt }}</h4>
                <div class="follow-up-slider">
                  <p-slider
                    [(ngModel)]="followUpRating"
                    [min]="0"
                    [max]="10"
                    [step]="1"
                  ></p-slider>
                  <div class="slider-value">{{ followUpRating }}/10</div>
                </div>
                <textarea
                  pInputTextarea
                  [(ngModel)]="followUpNotes"
                  placeholder="Any additional notes? (optional)"
                  [rows]="2"
                  class="follow-up-notes"
                ></textarea>
                <app-button
                  iconLeft="pi-send"
                  [loading]="submitting()"
                  (clicked)="submitFollowUp()"
                  >Submit Feedback</app-button
                >
              </div>
            } @else if (followUpSubmitted()) {
              <div class="follow-up-submitted">
                <i class="pi pi-check"></i>
                <span>Feedback submitted. Thanks!</span>
              </div>
            }

            <app-button variant="text" (clicked)="close()">Done</app-button>
          </div>
        }
      </div>
    </ng-template>
  `,
  styleUrl: "./micro-session.component.scss",
})
export class MicroSessionComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);

  readonly session = input<MicroSessionData>({
    title: "",
    session_type: "recovery",
    estimated_duration_minutes: 5,
    equipment_needed: [],
    intensity_level: "low",
    position_relevance: ["ALL"],
    steps: [],
    coaching_cues: [],
    follow_up_prompt: "How do you feel? (0-10)",
  });

  readonly mode = input<"modal" | "card">("card");
  readonly autoStart = input<boolean>(false);

  readonly sessionCompleted = output<{
    duration_minutes: number;
    follow_up_response?: { rating: number; notes: string };
  }>();
  readonly sessionSkipped = output<void>();
  readonly closed = output<void>();

  // State
  dialogVisible = false;
  currentStatus = signal<SessionStatus>("ready");
  currentStepIndex = signal(0);
  equipmentChecked: boolean[] = [];
  followUpRating = 5;
  followUpNotes = "";
  followUpSubmitted = signal(false);
  submitting = signal(false);
  savedSessionId = signal<string | null>(null);

  // Timer state
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  stepTimeRemaining = signal(0);
  totalElapsedTime = signal(0);
  private stepStartTime = 0;

  // Computed
  currentStep = computed(() => {
    const steps = this.session().steps;
    const index = this.currentStepIndex();
    return (
      steps[index] || {
        order: 1,
        instruction: "No steps defined",
        duration_seconds: 30,
      }
    );
  });

  overallProgress = computed(() => {
    const total = this.session().steps.length;
    if (total === 0) return 0;
    return Math.round((this.currentStepIndex() / total) * 100);
  });

  stepProgress = computed(() => {
    const step = this.currentStep();
    const remaining = this.stepTimeRemaining();
    if (step.duration_seconds === 0) return 100;
    return Math.round(
      ((step.duration_seconds - remaining) / step.duration_seconds) * 100,
    );
  });

  timerClass = computed(() => {
    const remaining = this.stepTimeRemaining();
    if (remaining <= 5) return "urgent";
    if (remaining <= 15) return "warning";
    return "plenty";
  });

  // Use Math in template
  Math = Math;

  ngOnInit(): void {
    // Initialize equipment checklist
    this.equipmentChecked = this.session().equipment_needed.map(() => false);

    if (this.autoStart()) {
      this.startSession();
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  // Public methods
  show(): void {
    this.dialogVisible = true;
  }

  hide(): void {
    this.dialogVisible = false;
  }

  hasRequiredEquipment(): boolean {
    return this.session().equipment_needed.length === 0;
  }

  allEquipmentChecked(): boolean {
    return this.equipmentChecked.every((c) => c);
  }

  startSession(): void {
    // Check if equipment check is needed
    if (
      this.session().equipment_needed.length > 0 &&
      !this.allEquipmentChecked()
    ) {
      this.currentStatus.set("equipment_check");
      return;
    }

    this.beginSession();
  }

  confirmEquipment(): void {
    this.beginSession();
  }

  skipEquipmentCheck(): void {
    this.beginSession();
  }

  private async beginSession(): Promise<void> {
    // Create the session in the database
    try {
      const response = await firstValueFrom(
        this.apiService.post<{ id: string }>("/api/micro-sessions", {
          ...this.session(),
          source_type: this.session().source_message_id
            ? "ai_suggestion"
            : "self_created",
          source_message_id: this.session().source_message_id || null,
        }),
      );

      if (response?.success && response.data?.id) {
        this.savedSessionId.set(response.data.id);

        // Mark as in_progress
        await firstValueFrom(
          this.apiService.patch(`/api/micro-sessions/${response.data.id}`, {
            status: "in_progress",
          }),
        );
      }
    } catch (error) {
      this.logger.error("Error creating micro-session:", error);
      // Continue anyway, just won't be tracked
    }

    this.currentStatus.set("in_progress");
    this.currentStepIndex.set(0);
    this.totalElapsedTime.set(0);
    this.startStepTimer();
  }

  pauseSession(): void {
    this.currentStatus.set("paused");
    this.stopTimer();
  }

  resumeSession(): void {
    this.currentStatus.set("in_progress");
    this.startStepTimer();
  }

  nextStep(): void {
    const nextIndex = this.currentStepIndex() + 1;
    if (nextIndex < this.session().steps.length) {
      this.currentStepIndex.set(nextIndex);
      this.startStepTimer();
    } else {
      this.completeSession();
    }
  }

  async completeSession(): Promise<void> {
    this.stopTimer();
    this.currentStatus.set("completed");

    // Update session status in database
    if (this.savedSessionId()) {
      try {
        await firstValueFrom(
          this.apiService.patch(
            `/api/micro-sessions/${this.savedSessionId()}`,
            {
              status: "completed",
              actual_duration_minutes: Math.round(this.totalElapsedTime() / 60),
            },
          ),
        );
      } catch (error) {
        this.logger.error("Error updating micro-session:", error);
      }
    }
  }

  async skipSession(): Promise<void> {
    if (this.savedSessionId()) {
      try {
        await firstValueFrom(
          this.apiService.patch(
            `/api/micro-sessions/${this.savedSessionId()}`,
            {
              status: "skipped",
            },
          ),
        );
      } catch (error) {
        this.logger.error("Error skipping micro-session:", error);
      }
    }

    this.sessionSkipped.emit();
    this.close();
  }

  async submitFollowUp(): Promise<void> {
    this.submitting.set(true);

    try {
      if (this.savedSessionId()) {
        await firstValueFrom(
          this.apiService.post(
            `/api/micro-sessions/${this.savedSessionId()}/follow-up`,
            {
              rating: this.followUpRating,
              notes: this.followUpNotes,
            },
          ),
        );
      }

      this.followUpSubmitted.set(true);
      this.toastService.success(TOAST.SUCCESS.FEEDBACK_SUBMITTED);

      this.sessionCompleted.emit({
        duration_minutes: Math.round(this.totalElapsedTime() / 60),
        follow_up_response: {
          rating: this.followUpRating,
          notes: this.followUpNotes,
        },
      });
    } catch (error) {
      this.logger.error("Error submitting follow-up:", error);
      this.toastService.error(TOAST.ERROR.FEEDBACK_SUBMIT_FAILED);
    } finally {
      this.submitting.set(false);
    }
  }

  close(): void {
    this.stopTimer();
    this.dialogVisible = false;
    this.closed.emit();
  }

  onDialogHide(): void {
    if (this.currentStatus() !== "in_progress") {
      this.closed.emit();
    }
  }

  // Timer methods
  private startStepTimer(): void {
    this.stopTimer();
    const step = this.currentStep();
    this.stepTimeRemaining.set(step.duration_seconds);
    this.stepStartTime = Date.now();

    this.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.stepStartTime) / 1000);
      const remaining = Math.max(0, step.duration_seconds - elapsed);
      this.stepTimeRemaining.set(remaining);
      this.totalElapsedTime.update((t) => t + 1);

      if (remaining === 0) {
        this.onStepComplete();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private onStepComplete(): void {
    this.stopTimer();

    // Auto-advance or complete
    const nextIndex = this.currentStepIndex() + 1;
    if (nextIndex < this.session().steps.length) {
      // Brief pause then advance
      setTimeout(() => {
        this.currentStepIndex.set(nextIndex);
        this.startStepTimer();
      }, 500);
    } else {
      this.completeSession();
    }
  }

  // Utility methods
  formatTime = formatTimeMMSS;

  getSessionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      recovery: "Recovery",
      technique: "Technique",
      mobility: "Mobility",
      mental: "Mental",
      strength: "Strength",
      warm_up: "Warm-Up",
    };
    return labels[type] || type;
  }

  getSessionTypeSeverity(
    type: string,
  ): "success" | "info" | "warning" | "danger" | "secondary" {
    const severities: Record<
      string,
      "success" | "info" | "warning" | "danger" | "secondary"
    > = {
      recovery: "success",
      technique: "info",
      mobility: "info",
      mental: "secondary",
      strength: "warning",
      warm_up: "success",
    };
    return severities[type] || "secondary";
  }
}
