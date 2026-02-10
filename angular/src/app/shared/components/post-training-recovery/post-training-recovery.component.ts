/**
 * Post-Training Recovery Component
 *
 * Prompts athletes to log session data after training:
 * - RPE (Rate of Perceived Exertion)
 * - Session duration
 * - Soreness areas
 * - Recovery recommendations
 *
 * Bridges the gap between training and recovery tracking
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { COLORS } from "../../../core/constants/app.constants";

// PrimeNG
import { Checkbox } from "primeng/checkbox";
import { Dialog } from "primeng/dialog";
import { InputNumber } from "primeng/inputnumber";

import { StatusTagComponent } from "../status-tag/status-tag.component";
import { ButtonComponent } from "../button/button.component";
// Services
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { LoggerService } from "../../../core/services/logger.service";
import { RecoveryService } from "../../../core/services/recovery.service";
import { ToastService } from "../../../core/services/toast.service";
import { UnifiedTrainingService } from "../../../core/services/unified-training.service";

interface SorenessArea {
  id: string;
  label: string;
  selected: boolean;
  severity: number;
}

interface RecoveryRecommendation {
  icon: string;
  title: string;
  description: string;
  duration?: string;
  priority: "high" | "medium" | "low";
}

@Component({
  selector: "app-post-training-recovery",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    Dialog,
    InputNumber,
    Checkbox,
    StatusTagComponent,
    ButtonComponent,
  ],
  template: `
    <p-dialog
      [(visible)]="isVisible"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      [showHeader]="false"
      class="post-training-dialog dialog-w-xl dialog-max-w-lg"
      (onHide)="onClose()"
    >
      <div class="post-training-content">
        <!-- Header -->
        <div class="dialog-header">
          <div class="header-icon">
            <i class="pi pi-check-circle"></i>
          </div>
          <h2>Session Complete! 🎯</h2>
          <p>{{ sessionName() || "Training Session" }} finished</p>
        </div>

        <!-- Step Indicator -->
        <div class="step-indicator">
          <div
            class="step"
            [class.active]="currentStep() >= 1"
            [class.completed]="currentStep() > 1"
          >
            <span class="step-number">1</span>
            <span class="step-label">RPE</span>
          </div>
          <div class="step-line" [class.active]="currentStep() > 1"></div>
          <div
            class="step"
            [class.active]="currentStep() >= 2"
            [class.completed]="currentStep() > 2"
          >
            <span class="step-number">2</span>
            <span class="step-label">Soreness</span>
          </div>
          <div class="step-line" [class.active]="currentStep() > 2"></div>
          <div class="step" [class.active]="currentStep() >= 3">
            <span class="step-number">3</span>
            <span class="step-label">Recovery</span>
          </div>
        </div>

        <!-- Step 1: RPE Rating -->
        @if (currentStep() === 1) {
          <div class="step-content animate-fade-in">
            <h3>How hard was that session?</h3>
            <p class="step-description">Rate your perceived exertion (RPE)</p>

            <div class="rpe-scale">
              @for (level of rpeScale; track level.value) {
                <button
                  class="rpe-button"
                  [class.selected]="rpeRating() === level.value"
                  [style.--rpe-color]="level.color"
                  (click)="setRPE(level.value)"
                >
                  <span class="rpe-value">{{ level.value }}</span>
                  <span class="rpe-label">{{ level.label }}</span>
                </button>
              }
            </div>

            <div class="duration-input">
              <label>Session Duration</label>
              <div class="input-row">
                <p-inputNumber
                  [(ngModel)]="sessionDuration"
                  [min]="1"
                  [max]="300"
                  [showButtons]="true"
                  suffix=" min"
                  class="duration-number"
                ></p-inputNumber>
                <span class="load-preview" [class.visible]="rpeRating() > 0">
                  Load: {{ calculateLoad() }} AU
                </span>
              </div>
            </div>
          </div>
        }

        <!-- Step 2: Soreness Check -->
        @if (currentStep() === 2) {
          <div class="step-content animate-fade-in">
            <h3>Any new soreness?</h3>
            <p class="step-description">Tap areas that feel sore or tight</p>

            <div class="soreness-grid">
              @for (area of sorenessAreas; track area.id) {
                <button
                  class="soreness-button"
                  [class.selected]="area.selected"
                  (click)="toggleSoreness(area)"
                >
                  <span class="area-label">{{ area.label }}</span>
                  @if (area.selected) {
                    <div class="severity-dots">
                      @for (dot of [1, 2, 3]; track dot) {
                        <span
                          class="dot"
                          [class.active]="area.severity >= dot"
                          (click)="setSeverity(area, dot, $event)"
                        ></span>
                      }
                    </div>
                  }
                </button>
              }
            </div>

            <div class="no-soreness-option">
              <p-checkbox
                [(ngModel)]="noSoreness"
                [binary]="true"
                variant="filled"
                inputId="noSoreness"
                (onValueChange)="onNoSorenessChange()"
              ></p-checkbox>
              <label for="noSoreness">No new soreness - feeling good! 💪</label>
            </div>
          </div>
        }

        <!-- Step 3: Recovery Recommendations -->
        @if (currentStep() === 3) {
          <div class="step-content animate-fade-in">
            <h3>Your Recovery Plan</h3>
            <p class="step-description">
              Based on your session and current state
            </p>

            <div class="recommendations-list">
              @for (rec of recoveryRecommendations(); track rec.title) {
                <div
                  class="recommendation-card"
                  [class]="'priority-' + rec.priority"
                >
                  <div class="rec-icon">
                    <i [class]="'pi ' + rec.icon"></i>
                  </div>
                  <div class="rec-content">
                    <h4>{{ rec.title }}</h4>
                    <p>{{ rec.description }}</p>
                    @if (rec.duration) {
                      <span class="rec-duration">{{ rec.duration }}</span>
                    }
                  </div>
                  <app-status-tag
                    [value]="rec.priority"
                    [severity]="getPrioritySeverity(rec.priority)"
                    size="sm"
                  />
                </div>
              }
            </div>

            <div class="hydration-reminder">
              <i class="pi pi-info-circle"></i>
              <span>Drink at least 500ml of water in the next 30 minutes</span>
            </div>
          </div>
        }

        <!-- Navigation Buttons -->
        <div class="dialog-actions">
          @if (currentStep() > 1) {
            <app-button
              variant="text"
              iconLeft="pi-arrow-left"
              (clicked)="previousStep()"
              >Back</app-button
            >
          }

          <div class="action-spacer"></div>

          @if (currentStep() < 3) {
            <app-button
              iconLeft="pi-arrow-right"
              [disabled]="!canProceed()"
              (clicked)="nextStep()"
              >Next</app-button
            >
          } @else {
            <app-button
              iconLeft="pi-check"
              [loading]="isSaving()"
              (clicked)="saveAndClose()"
              >Save & View Recovery</app-button
            >
          }
        </div>

        <!-- Skip Option -->
        <button class="skip-btn" (click)="skipAndClose()">Skip for now</button>
      </div>
    </p-dialog>
  `,
  styleUrl: "./post-training-recovery.component.scss",
})
export class PostTrainingRecoveryComponent implements OnInit {
  private router = inject(Router);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);
  private recoveryService = inject(RecoveryService);
  private unifiedTrainingService = inject(UnifiedTrainingService);

  // Inputs
  sessionName = input<string>("");
  sessionId = input<string>("");
  defaultDuration = input<number>(60);

  // Outputs
  saved = output<{
    rpe: number;
    duration: number;
    soreness: SorenessArea[];
    load: number;
  }>();
  closed = output<void>();

  // State
  isVisible = true;
  currentStep = signal(1);
  isSaving = signal(false);
  rpeRating = signal(0);
  sessionDuration = 60;
  noSoreness = false;

  // RPE Scale with Borg CR-10
  rpeScale = [
    { value: 1, label: "Very Easy", color: COLORS.GREEN },
    { value: 3, label: "Easy", color: COLORS.LIME },
    { value: 5, label: "Moderate", color: COLORS.YELLOW },
    { value: 7, label: "Hard", color: COLORS.ORANGE },
    { value: 9, label: "Max", color: COLORS.ERROR },
  ];

  // Soreness areas
  sorenessAreas: SorenessArea[] = [
    { id: "quads", label: "Quads", selected: false, severity: 0 },
    { id: "hamstrings", label: "Hamstrings", selected: false, severity: 0 },
    { id: "calves", label: "Calves", selected: false, severity: 0 },
    { id: "glutes", label: "Glutes", selected: false, severity: 0 },
    { id: "lower-back", label: "Lower Back", selected: false, severity: 0 },
    { id: "shoulders", label: "Shoulders", selected: false, severity: 0 },
    { id: "knees", label: "Knees", selected: false, severity: 0 },
    { id: "ankles", label: "Ankles", selected: false, severity: 0 },
    { id: "other", label: "Other", selected: false, severity: 0 },
  ];

  // Computed recovery recommendations
  recoveryRecommendations = computed<RecoveryRecommendation[]>(() => {
    const rpe = this.rpeRating();
    const soreness = this.sorenessAreas.filter((a) => a.selected);
    const recommendations: RecoveryRecommendation[] = [];

    // Always recommend hydration first
    recommendations.push({
      icon: "pi-tint",
      title: "Hydrate Now",
      description: "Drink 500ml water in the next 30 minutes",
      duration: "Immediate",
      priority: "high",
    });

    // High intensity session
    if (rpe >= 7) {
      recommendations.push({
        icon: "pi-clock",
        title: "Active Recovery",
        description: "Light walking or stretching to promote blood flow",
        duration: "10-15 min",
        priority: "high",
      });
    }

    // If soreness reported
    if (soreness.length > 0) {
      const highSeverity = soreness.some((s) => s.severity >= 2);
      recommendations.push({
        icon: "pi-heart",
        title: highSeverity ? "Foam Rolling" : "Light Stretching",
        description: highSeverity
          ? "Focus on sore areas with foam roller or massage gun"
          : "Gentle stretching for affected muscle groups",
        duration: highSeverity ? "15-20 min" : "5-10 min",
        priority: highSeverity ? "high" : "medium",
      });
    }

    // Nutrition
    recommendations.push({
      icon: "pi-apple",
      title: "Protein Intake",
      description: "Consume 20-30g protein within 45 minutes",
      duration: "Within 45 min",
      priority: rpe >= 5 ? "high" : "medium",
    });

    // Sleep if late session
    const hour = new Date().getHours();
    if (hour >= 18) {
      recommendations.push({
        icon: "pi-moon",
        title: "Wind Down",
        description: "Avoid screens and prepare for quality sleep",
        duration: "1-2 hours before bed",
        priority: "medium",
      });
    }

    return recommendations;
  });

  ngOnInit(): void {
    this.sessionDuration = this.defaultDuration() || 60;
  }

  setRPE(value: number): void {
    this.rpeRating.set(value);
  }

  calculateLoad(): number {
    return this.rpeRating() * this.sessionDuration;
  }

  toggleSoreness(area: SorenessArea): void {
    area.selected = !area.selected;
    if (area.selected) {
      area.severity = 1;
      this.noSoreness = false;
    } else {
      area.severity = 0;
    }
  }

  setSeverity(area: SorenessArea, severity: number, event: Event): void {
    event.stopPropagation();
    area.severity = severity;
  }

  onNoSorenessChange(): void {
    if (this.noSoreness) {
      this.sorenessAreas.forEach((area) => {
        area.selected = false;
        area.severity = 0;
      });
    }
  }

  canProceed(): boolean {
    if (this.currentStep() === 1) {
      return this.rpeRating() > 0 && this.sessionDuration > 0;
    }
    return true;
  }

  nextStep(): void {
    if (this.currentStep() < 3) {
      this.currentStep.update((s) => s + 1);
    }
  }

  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update((s) => s - 1);
    }
  }

  getPrioritySeverity(
    priority: string,
  ): "success" | "info" | "warning" | "danger" {
    switch (priority) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      default:
        return "info";
    }
  }

  async saveAndClose(): Promise<void> {
    this.isSaving.set(true);

    try {
      const sessionData = {
        rpe: this.rpeRating(),
        duration: this.sessionDuration,
        soreness: this.sorenessAreas.filter((a) => a.selected),
        load: this.calculateLoad(),
        timestamp: new Date().toISOString(),
      };

      // Save to training data service via unified service
      await this.unifiedTrainingService.logTrainingSession({
        rpe: sessionData.rpe,
        duration_minutes: sessionData.duration,
        load: sessionData.load,
        session_date: new Date().toISOString().split("T")[0],
        notes:
          sessionData.soreness.length > 0
            ? `Soreness: ${sessionData.soreness.map((s: { label: string }) => s.label).join(", ")}`
            : undefined,
      });

      this.saved.emit(sessionData);
      this.toastService.success(TOAST.SUCCESS.SESSION_SAVED);
      this.isVisible = false;

      // Navigate to wellness/recovery
      this.router.navigate(["/wellness"]);
    } catch (error) {
      this.logger.error("Error saving post-training data:", error);
      this.toastService.error(TOAST.ERROR.SAVE_FAILED);
    } finally {
      this.isSaving.set(false);
    }
  }

  skipAndClose(): void {
    this.isVisible = false;
    this.closed.emit();
  }

  onClose(): void {
    this.closed.emit();
  }
}
