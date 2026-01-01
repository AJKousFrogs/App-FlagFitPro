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

import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  signal,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { DialogModule } from "primeng/dialog";
import { ProgressBarModule } from "primeng/progressbar";
import { CheckboxModule } from "primeng/checkbox";
import { SliderModule } from "primeng/slider";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { TextareaModule } from "primeng/textarea";
import { ApiService } from "../../../core/services/api.service";
import { ToastService } from "../../../core/services/toast.service";
import { LoggerService } from "../../../core/services/logger.service";

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
    ButtonModule,
    CardModule,
    DialogModule,
    ProgressBarModule,
    CheckboxModule,
    SliderModule,
    TagModule,
    TooltipModule,
    TextareaModule,
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
              <p-tag
                [value]="getSessionTypeLabel(session().session_type)"
                [severity]="getSessionTypeSeverity(session().session_type)"
                [rounded]="true"
              ></p-tag>
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
              <p-button
                label="Start Session"
                icon="pi pi-play"
                (onClick)="startSession()"
                styleClass="start-button"
              ></p-button>
              <p-button
                label="Skip"
                [text]="true"
                severity="secondary"
                (onClick)="skipSession()"
              ></p-button>
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
                    [inputId]="'equipment-' + i"
                  ></p-checkbox>
                  <label [for]="'equipment-' + i">{{ item }}</label>
                </div>
              }
            </div>
            <div class="action-buttons">
              <p-button
                label="Continue"
                icon="pi pi-arrow-right"
                (onClick)="confirmEquipment()"
                [disabled]="!allEquipmentChecked()"
              ></p-button>
              <p-button
                label="Don't have equipment"
                [text]="true"
                severity="secondary"
                (onClick)="skipEquipmentCheck()"
              ></p-button>
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
                <p-button
                  icon="pi pi-play"
                  label="Resume"
                  (onClick)="resumeSession()"
                ></p-button>
              } @else {
                <p-button
                  icon="pi pi-pause"
                  label="Pause"
                  severity="secondary"
                  (onClick)="pauseSession()"
                ></p-button>
              }

              <p-button
                icon="pi pi-forward"
                label="Next Step"
                severity="secondary"
                [disabled]="currentStepIndex() >= session().steps.length - 1"
                (onClick)="nextStep()"
              ></p-button>

              <p-button
                icon="pi pi-check"
                label="Complete"
                severity="success"
                (onClick)="completeSession()"
              ></p-button>
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
                <span class="stat-value">{{ session().steps.length }}</span>
                <span class="stat-label">Steps</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{
                  Math.round(totalElapsedTime() / 60)
                }}</span>
                <span class="stat-label">Minutes</span>
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
                <p-button
                  label="Submit Feedback"
                  icon="pi pi-send"
                  (onClick)="submitFollowUp()"
                  [loading]="submitting()"
                ></p-button>
              </div>
            } @else if (followUpSubmitted()) {
              <div class="follow-up-submitted">
                <i class="pi pi-check"></i>
                <span>Feedback submitted. Thanks!</span>
              </div>
            }

            <p-button label="Done" [text]="true" (onClick)="close()"></p-button>
          </div>
        }
      </div>
    </ng-template>
  `,
  styles: [
    `
      .micro-session-card {
        max-width: 500px;
      }

      .card-header {
        padding: var(--space-4);
      }

      .header-info {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin-bottom: var(--space-2);
      }

      .duration-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: var(--text-xs);
        color: var(--color-text-secondary);
      }

      .card-header h3 {
        margin: 0 0 var(--space-1) 0;
        font-size: var(--text-lg);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .description {
        margin: 0;
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
      }

      .session-body {
        padding: var(--space-4);
      }

      /* Ready State */
      .ready-state {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .equipment-needed {
        background: var(--surface-50);
        border-radius: var(--radius-lg);
        padding: var(--space-4);
      }

      .equipment-needed h4 {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin: 0 0 var(--space-3) 0;
        font-size: var(--text-sm);
        font-weight: var(--font-weight-semibold);
      }

      .equipment-list {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
      }

      .equipment-item {
        display: inline-flex;
        padding: 4px 12px;
        background: var(--surface-card);
        border: 1px solid var(--surface-border);
        border-radius: var(--radius-full);
        font-size: var(--text-sm);
      }

      .safety-notes {
        display: flex;
        align-items: flex-start;
        gap: var(--space-3);
        padding: var(--space-3);
        background: rgba(245, 158, 11, 0.1);
        border-radius: var(--radius-lg);
        font-size: var(--text-sm);
        color: #b45309;
      }

      .safety-notes i {
        color: #f59e0b;
        margin-top: 2px;
      }

      .coaching-cues {
        background: rgba(8, 153, 73, 0.05);
        border-radius: var(--radius-lg);
        padding: var(--space-4);
      }

      .coaching-cues h4 {
        margin: 0 0 var(--space-2) 0;
        font-size: var(--text-sm);
        font-weight: var(--font-weight-semibold);
        color: #089949;
      }

      .coaching-cues ul {
        margin: 0;
        padding-left: var(--space-5);
      }

      .coaching-cues li {
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
        margin-bottom: var(--space-1);
      }

      .action-buttons {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-3);
        margin-top: var(--space-2);
      }

      :host ::ng-deep .start-button {
        background: linear-gradient(135deg, #089949 0%, #0ab85a 100%);
        border: none;
      }

      /* Equipment Check State */
      .equipment-check-state h4 {
        margin: 0 0 var(--space-4) 0;
        text-align: center;
      }

      .equipment-checklist {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        margin-bottom: var(--space-4);
      }

      .checklist-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .checklist-item label {
        font-size: var(--text-sm);
      }

      /* In Progress State */
      .in-progress-state {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .overall-progress {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .overall-progress span {
        font-size: var(--text-xs);
        color: var(--color-text-secondary);
      }

      :host ::ng-deep .overall-bar .p-progressbar {
        height: 4px;
        border-radius: 2px;
      }

      :host ::ng-deep .overall-bar .p-progressbar-value {
        background: var(--ds-primary-green, #089949);
      }

      .current-step {
        text-align: center;
        padding: var(--space-6);
        background: var(--surface-50);
        border-radius: var(--radius-xl);
        transition: all 0.3s;
      }

      .current-step.paused {
        opacity: 0.7;
      }

      .step-instruction {
        font-size: var(--text-lg);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-primary);
        margin-bottom: var(--space-4);
      }

      .step-timer {
        display: flex;
        justify-content: center;
        margin-bottom: var(--space-4);
      }

      .timer-circle {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border: 4px solid;
        transition: border-color 0.3s;
      }

      .timer-circle.plenty {
        border-color: #089949;
      }

      .timer-circle.warning {
        border-color: #f59e0b;
      }

      .timer-circle.urgent {
        border-color: #ef4444;
        animation: pulse 1s infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.05);
        }
      }

      .timer-value {
        font-size: var(--text-2xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
      }

      .timer-label {
        font-size: var(--text-xs);
        color: var(--color-text-secondary);
        text-transform: uppercase;
      }

      :host ::ng-deep .step-bar .p-progressbar {
        height: 6px;
        border-radius: 3px;
      }

      :host ::ng-deep .step-bar .p-progressbar-value {
        background: linear-gradient(90deg, #089949, #0ab85a);
      }

      .session-controls {
        display: flex;
        justify-content: center;
        gap: var(--space-3);
        flex-wrap: wrap;
      }

      .elapsed-time {
        text-align: center;
        font-size: var(--text-xs);
        color: var(--color-text-muted);
      }

      /* Completed State */
      .completed-state {
        text-align: center;
        padding: var(--space-4);
      }

      .completion-icon {
        font-size: 4rem;
        color: #089949;
        margin-bottom: var(--space-4);
      }

      .completed-state h3 {
        margin: 0 0 var(--space-2) 0;
        color: #089949;
      }

      .completed-state > p {
        margin: 0 0 var(--space-4) 0;
        color: var(--color-text-secondary);
      }

      .completion-stats {
        display: flex;
        justify-content: center;
        gap: var(--space-8);
        margin-bottom: var(--space-6);
      }

      .stat {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .stat-value {
        font-size: var(--text-2xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
      }

      .stat-label {
        font-size: var(--text-xs);
        color: var(--color-text-secondary);
      }

      .follow-up-section {
        background: var(--surface-50);
        border-radius: var(--radius-lg);
        padding: var(--space-4);
        margin-bottom: var(--space-4);
      }

      .follow-up-section h4 {
        margin: 0 0 var(--space-4) 0;
        font-size: var(--text-sm);
      }

      .follow-up-slider {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        margin-bottom: var(--space-3);
      }

      .follow-up-slider p-slider {
        flex: 1;
      }

      .slider-value {
        font-size: var(--text-lg);
        font-weight: var(--font-weight-semibold);
        min-width: 50px;
        text-align: right;
      }

      .follow-up-notes {
        width: 100%;
        margin-bottom: var(--space-3);
      }

      .follow-up-submitted {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        padding: var(--space-3);
        background: rgba(8, 153, 73, 0.1);
        border-radius: var(--radius-lg);
        color: #089949;
        margin-bottom: var(--space-4);
      }

      :host ::ng-deep .p-slider .p-slider-range {
        background: var(--ds-primary-green, #089949);
      }

      :host ::ng-deep .p-slider .p-slider-handle {
        border-color: var(--ds-primary-green, #089949);
      }
    `,
  ],
})
export class MicroSessionComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);

  @Input() session = signal<MicroSessionData>({
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

  @Input() mode = signal<"modal" | "card">("card");
  @Input() autoStart = false;

  @Output() sessionCompleted = new EventEmitter<{
    duration_minutes: number;
    follow_up_response?: { rating: number; notes: string };
  }>();
  @Output() sessionSkipped = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

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

    if (this.autoStart) {
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
      const response = await this.apiService
        .post<{ id: string }>("/api/micro-sessions", {
          ...this.session(),
          source_type: this.session().source_message_id
            ? "ai_suggestion"
            : "self_created",
          source_message_id: this.session().source_message_id || null,
        })
        .toPromise();

      if (response?.success && response.data?.id) {
        this.savedSessionId.set(response.data.id);

        // Mark as in_progress
        await this.apiService
          .patch(`/api/micro-sessions/${response.data.id}`, {
            status: "in_progress",
          })
          .toPromise();
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
        await this.apiService
          .patch(`/api/micro-sessions/${this.savedSessionId()}`, {
            status: "completed",
            actual_duration_minutes: Math.round(this.totalElapsedTime() / 60),
          })
          .toPromise();
      } catch (error) {
        this.logger.error("Error updating micro-session:", error);
      }
    }
  }

  async skipSession(): Promise<void> {
    if (this.savedSessionId()) {
      try {
        await this.apiService
          .patch(`/api/micro-sessions/${this.savedSessionId()}`, {
            status: "skipped",
          })
          .toPromise();
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
        await this.apiService
          .post(`/api/micro-sessions/${this.savedSessionId()}/follow-up`, {
            rating: this.followUpRating,
            notes: this.followUpNotes,
          })
          .toPromise();
      }

      this.followUpSubmitted.set(true);
      this.toastService.success("Feedback submitted!");

      this.sessionCompleted.emit({
        duration_minutes: Math.round(this.totalElapsedTime() / 60),
        follow_up_response: {
          rating: this.followUpRating,
          notes: this.followUpNotes,
        },
      });
    } catch (error) {
      this.logger.error("Error submitting follow-up:", error);
      this.toastService.error("Failed to submit feedback");
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
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

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
  ): "success" | "info" | "warn" | "danger" | "secondary" {
    const severities: Record<
      string,
      "success" | "info" | "warn" | "danger" | "secondary"
    > = {
      recovery: "success",
      technique: "info",
      mobility: "info",
      mental: "secondary",
      strength: "warn",
      warm_up: "success",
    };
    return severities[type] || "secondary";
  }
}
