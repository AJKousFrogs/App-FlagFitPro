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

import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  input,
  output,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";

// PrimeNG
import { DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";
import { Slider } from "primeng/slider";
import { InputNumberModule } from "primeng/inputnumber";
import { CheckboxModule } from "primeng/checkbox";
import { TagModule } from "primeng/tag";
import { ProgressBarModule } from "primeng/progressbar";
import { Chip } from "primeng/chip";

// Services
import { ToastService } from "../../../core/services/toast.service";
import { LoggerService } from "../../../core/services/logger.service";
import { TrainingDataService } from "../../../core/services/training-data.service";
import { RecoveryService } from "../../../core/services/recovery.service";

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
    DialogModule,
    ButtonModule,
    Slider,
    InputNumberModule,
    CheckboxModule,
    TagModule,
    ProgressBarModule,
    Chip,
  ],
  template: `
    <p-dialog
      [(visible)]="isVisible"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '500px', maxWidth: '95vw' }"
      [showHeader]="false"
      styleClass="post-training-dialog"
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
          <div class="step" [class.active]="currentStep() >= 1" [class.completed]="currentStep() > 1">
            <span class="step-number">1</span>
            <span class="step-label">RPE</span>
          </div>
          <div class="step-line" [class.active]="currentStep() > 1"></div>
          <div class="step" [class.active]="currentStep() >= 2" [class.completed]="currentStep() > 2">
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
                  styleClass="duration-number"
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
                inputId="noSoreness"
                (onChange)="onNoSorenessChange()"
              ></p-checkbox>
              <label for="noSoreness">No new soreness - feeling good! 💪</label>
            </div>
          </div>
        }

        <!-- Step 3: Recovery Recommendations -->
        @if (currentStep() === 3) {
          <div class="step-content animate-fade-in">
            <h3>Your Recovery Plan</h3>
            <p class="step-description">Based on your session and current state</p>

            <div class="recommendations-list">
              @for (rec of recoveryRecommendations(); track rec.title) {
                <div class="recommendation-card" [class]="'priority-' + rec.priority">
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
                  <p-tag
                    [value]="rec.priority"
                    [severity]="getPrioritySeverity(rec.priority)"
                    size="small"
                  ></p-tag>
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
            <p-button
              label="Back"
              icon="pi pi-arrow-left"
              [text]="true"
              (onClick)="previousStep()"
            ></p-button>
          }

          <div class="action-spacer"></div>

          @if (currentStep() < 3) {
            <p-button
              label="Next"
              icon="pi pi-arrow-right"
              iconPos="right"
              [disabled]="!canProceed()"
              (onClick)="nextStep()"
            ></p-button>
          } @else {
            <p-button
              label="Save & View Recovery"
              icon="pi pi-check"
              [loading]="isSaving()"
              (onClick)="saveAndClose()"
            ></p-button>
          }
        </div>

        <!-- Skip Option -->
        <button class="skip-btn" (click)="skipAndClose()">
          Skip for now
        </button>
      </div>
    </p-dialog>
  `,
  styles: [
    `
      :host ::ng-deep .post-training-dialog .p-dialog-content {
        padding: 0;
        border-radius: 16px;
        overflow: hidden;
      }

      .post-training-content {
        padding: var(--space-6);
      }

      .dialog-header {
        text-align: center;
        margin-bottom: var(--space-6);
      }

      .header-icon {
        width: 64px;
        height: 64px;
        background: var(--p-green-100);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto var(--space-4);
      }

      .header-icon i {
        font-size: 2rem;
        color: var(--p-green-600);
      }

      .dialog-header h2 {
        margin: 0 0 var(--space-2) 0;
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .dialog-header p {
        margin: 0;
        color: var(--text-secondary);
      }

      /* Step Indicator */
      .step-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        margin-bottom: var(--space-6);
      }

      .step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-1);
      }

      .step-number {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--p-surface-200);
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.875rem;
        transition: all 0.3s;
      }

      .step.active .step-number {
        background: var(--color-brand-primary);
        color: white;
      }

      .step.completed .step-number {
        background: var(--p-green-500);
        color: white;
      }

      .step-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .step.active .step-label {
        color: var(--color-brand-primary);
        font-weight: 600;
      }

      .step-line {
        width: 40px;
        height: 2px;
        background: var(--p-surface-200);
        margin-bottom: 20px;
        transition: background 0.3s;
      }

      .step-line.active {
        background: var(--color-brand-primary);
      }

      /* Step Content */
      .step-content {
        margin-bottom: var(--space-6);
      }

      .step-content h3 {
        margin: 0 0 var(--space-2) 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-primary);
        text-align: center;
      }

      .step-description {
        text-align: center;
        color: var(--text-secondary);
        margin: 0 0 var(--space-5) 0;
      }

      .animate-fade-in {
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* RPE Scale */
      .rpe-scale {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: var(--space-2);
        margin-bottom: var(--space-5);
      }

      .rpe-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-1);
        padding: var(--space-3);
        border: 2px solid var(--p-surface-200);
        border-radius: 12px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
      }

      .rpe-button:hover {
        border-color: var(--rpe-color, var(--p-surface-300));
        background: var(--p-surface-50);
      }

      .rpe-button.selected {
        border-color: var(--rpe-color, var(--color-brand-primary));
        background: color-mix(in srgb, var(--rpe-color, var(--color-brand-primary)) 10%, white);
      }

      .rpe-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--rpe-color, var(--text-primary));
      }

      .rpe-label {
        font-size: 0.625rem;
        color: var(--text-secondary);
        text-align: center;
      }

      .duration-input {
        background: var(--p-surface-50);
        padding: var(--space-4);
        border-radius: 12px;
      }

      .duration-input label {
        display: block;
        font-weight: 500;
        margin-bottom: var(--space-2);
        color: var(--text-primary);
      }

      .input-row {
        display: flex;
        align-items: center;
        gap: var(--space-4);
      }

      :host ::ng-deep .duration-number {
        width: 140px;
      }

      .load-preview {
        font-weight: 600;
        color: var(--color-brand-primary);
        opacity: 0;
        transition: opacity 0.3s;
      }

      .load-preview.visible {
        opacity: 1;
      }

      /* Soreness Grid */
      .soreness-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--space-2);
        margin-bottom: var(--space-4);
      }

      .soreness-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-3);
        border: 2px solid var(--p-surface-200);
        border-radius: 12px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
        min-height: 70px;
      }

      .soreness-button:hover {
        border-color: var(--p-surface-300);
        background: var(--p-surface-50);
      }

      .soreness-button.selected {
        border-color: var(--p-orange-400);
        background: var(--p-orange-50);
      }

      .area-label {
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-primary);
        text-align: center;
      }

      .severity-dots {
        display: flex;
        gap: var(--space-1);
      }

      .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--p-surface-200);
        cursor: pointer;
        transition: background 0.2s;
      }

      .dot.active {
        background: var(--p-orange-500);
      }

      .no-soreness-option {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-3);
        background: var(--p-green-50);
        border-radius: 8px;
      }

      .no-soreness-option label {
        font-size: 0.875rem;
        color: var(--p-green-700);
        cursor: pointer;
      }

      /* Recommendations */
      .recommendations-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        margin-bottom: var(--space-4);
      }

      .recommendation-card {
        display: flex;
        align-items: flex-start;
        gap: var(--space-3);
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-radius: 12px;
        border-left: 4px solid var(--p-surface-300);
      }

      .recommendation-card.priority-high {
        border-left-color: var(--p-red-400);
        background: var(--p-red-50);
      }

      .recommendation-card.priority-medium {
        border-left-color: var(--p-orange-400);
        background: var(--p-orange-50);
      }

      .recommendation-card.priority-low {
        border-left-color: var(--p-green-400);
        background: var(--p-green-50);
      }

      .rec-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .rec-icon i {
        font-size: 1.25rem;
        color: var(--color-brand-primary);
      }

      .rec-content {
        flex: 1;
      }

      .rec-content h4 {
        margin: 0 0 var(--space-1) 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .rec-content p {
        margin: 0;
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .rec-duration {
        display: inline-block;
        margin-top: var(--space-2);
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--color-brand-primary);
      }

      .hydration-reminder {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-3);
        background: var(--p-blue-50);
        border-radius: 8px;
        color: var(--p-blue-700);
        font-size: 0.875rem;
      }

      /* Actions */
      .dialog-actions {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding-top: var(--space-4);
        border-top: 1px solid var(--p-surface-200);
      }

      .action-spacer {
        flex: 1;
      }

      .skip-btn {
        display: block;
        width: 100%;
        margin-top: var(--space-4);
        padding: var(--space-2);
        background: transparent;
        border: none;
        color: var(--text-secondary);
        font-size: 0.875rem;
        cursor: pointer;
        text-align: center;
      }

      .skip-btn:hover {
        color: var(--text-primary);
        text-decoration: underline;
      }

      /* Responsive */
      @media (max-width: 480px) {
        .rpe-scale {
          grid-template-columns: repeat(5, 1fr);
          gap: var(--space-1);
        }

        .rpe-button {
          padding: var(--space-2);
        }

        .rpe-label {
          display: none;
        }

        .soreness-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `,
  ],
})
export class PostTrainingRecoveryComponent implements OnInit {
  private router = inject(Router);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);
  private trainingDataService = inject(TrainingDataService);
  private recoveryService = inject(RecoveryService);

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
    { value: 1, label: "Very Easy", color: "#22c55e" },
    { value: 3, label: "Easy", color: "#84cc16" },
    { value: 5, label: "Moderate", color: "#eab308" },
    { value: 7, label: "Hard", color: "#f97316" },
    { value: 9, label: "Max", color: "#ef4444" },
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
    priority: string
  ): "success" | "info" | "warn" | "danger" {
    switch (priority) {
      case "high":
        return "danger";
      case "medium":
        return "warn";
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

      // Save to training data service
      await this.trainingDataService.logSession({
        rpe: sessionData.rpe,
        duration_minutes: sessionData.duration,
        load: sessionData.load,
        notes: sessionData.soreness.length > 0
          ? `Soreness: ${sessionData.soreness.map((s) => s.label).join(", ")}`
          : undefined,
      });

      this.saved.emit(sessionData);
      this.toastService.success("Session logged! Check your recovery plan 💪");
      this.isVisible = false;

      // Navigate to wellness/recovery
      this.router.navigate(["/wellness"]);
    } catch (error) {
      this.logger.error("Error saving post-training data:", error);
      this.toastService.error("Failed to save session data");
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
