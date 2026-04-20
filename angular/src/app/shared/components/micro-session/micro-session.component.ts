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
import { FormsModule } from "@angular/forms";
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
import { CheckboxComponent } from "../checkbox/checkbox.component";

import { StatusTagComponent } from "../status-tag/status-tag.component";
import { firstValueFrom } from "rxjs";
import { ApiService } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import {
  extractApiPayload,
  isSuccessfulApiResponse,
} from "../../../core/utils/api-response-mapper";
import { ButtonComponent } from "../button/button.component";
import { formatTimeMMSS } from "../../utils/format.utils";
import {
  MicroSessionData,
  SessionStatus,
} from "./micro-session.models";
import { MicroSessionActiveSectionComponent } from "./micro-session-active-section.component";
import { AppDialogComponent } from "../dialog/dialog.component";
import { DialogHeaderComponent } from "../dialog-header/dialog-header.component";
import { CardShellComponent } from "../card-shell/card-shell.component";

@Component({
  selector: "app-micro-session",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CheckboxComponent,
    ButtonComponent,
    StatusTagComponent,
    MicroSessionActiveSectionComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    CardShellComponent,
  ],
  templateUrl: "./micro-session.component.html",
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

  onEquipmentCheckChange(index: number, checked: boolean | undefined): void {
    this.equipmentChecked[index] = !!checked;
  }

  onFollowUpRatingChange(value: number | null | undefined): void {
    this.followUpRating = value ?? 0;
  }

  onFollowUpNotesInput(value: string): void {
    this.followUpNotes = value;
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
      const payload = extractApiPayload<{ id?: string }>(response);

      if (isSuccessfulApiResponse(response) && payload?.id) {
        this.savedSessionId.set(payload.id);

        // Mark as in_progress
        await firstValueFrom(
          this.apiService.patch(`/api/micro-sessions/${payload.id}`, {
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
