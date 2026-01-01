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
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { Router } from "@angular/router";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { Slider } from "primeng/slider";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { Textarea } from "primeng/textarea";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { ToastService } from "../../../core/services/toast.service";
import { AuthService } from "../../../core/services/auth.service";
import { TrainingDataService } from "../../../core/services/training-data.service";
import { AcwrService } from "../../../core/services/acwr.service";
import { LoggerService } from "../../../core/services/logger.service";
import { SessionType as AcwrSessionType } from "../../../core/models/acwr.models";

interface SessionType {
  label: string;
  value: string;
  icon: string;
  description: string;
}

@Component({
  selector: "app-training-log",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    Slider,
    InputNumberModule,
    InputTextModule,
    Textarea,
    TagModule,
    ToastModule,
    MainLayoutComponent,
    PageHeaderComponent,
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
          <p-button
            label="Cancel"
            icon="pi pi-times"
            [outlined]="true"
            (onClick)="cancel()"
          ></p-button>
        </app-page-header>

        <form [formGroup]="sessionForm" (ngSubmit)="submitSession()">
          <!-- Session Type Selection -->
          <p-card class="form-section">
            <ng-template pTemplate="header">
              <div class="section-header">
                <i class="pi pi-tag"></i>
                <h3>Session Type</h3>
              </div>
            </ng-template>

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
          </p-card>

          <!-- Duration and Intensity -->
          <p-card class="form-section">
            <ng-template pTemplate="header">
              <div class="section-header">
                <i class="pi pi-clock"></i>
                <h3>Duration & Intensity</h3>
              </div>
            </ng-template>

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
            </div>
          </p-card>

          <!-- Movement Volume (Position-Specific) -->
          <p-card class="form-section">
            <ng-template pTemplate="header">
              <div class="section-header">
                <i class="pi pi-bolt"></i>
                <h3>Movement Volume (Optional)</h3>
              </div>
            </ng-template>

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
          </p-card>

          <!-- Notes -->
          <p-card class="form-section">
            <ng-template pTemplate="header">
              <div class="section-header">
                <i class="pi pi-pencil"></i>
                <h3>Notes</h3>
              </div>
            </ng-template>

            <div class="form-field">
              <textarea
                pTextarea
                formControlName="notes"
                [rows]="4"
                placeholder="Add any notes about this session (injuries, fatigue, weather, etc.)"
              ></textarea>
            </div>
          </p-card>

          <!-- Submit Button -->
          <div class="form-actions">
            <p-button
              type="submit"
              label="Log Session"
              icon="pi pi-check"
              [loading]="isSubmitting()"
              [disabled]="sessionForm.invalid"
            ></p-button>
          </div>
        </form>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .training-log-page {
        padding: var(--space-6);
        max-width: 900px;
        margin: 0 auto;
      }

      .form-section {
        margin-bottom: var(--space-6);
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .section-header i {
        font-size: var(--icon-xl);
        color: var(--color-brand-primary);
      }

      .section-header h3 {
        font-size: var(--font-heading-sm);
        font-weight: var(--font-weight-semibold);
        margin: 0;
        color: var(--text-primary);
      }

      .session-types-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: var(--space-4);
      }

      .session-type-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: var(--space-4);
        border: 2px solid var(--p-surface-200);
        border-radius: var(--radius-lg);
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: center;
      }

      .session-type-card:hover {
        border-color: var(--color-brand-primary);
        background: var(--p-surface-50);
      }

      .session-type-card.selected {
        border-color: var(--color-brand-primary);
        background: var(--color-brand-primary-subtle);
      }

      .type-icon {
        font-size: 2rem;
        margin-bottom: var(--space-2);
      }

      .type-label {
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
        margin-bottom: var(--space-1);
      }

      .type-description {
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .form-field label {
        font-weight: var(--font-weight-medium);
        color: var(--text-primary);
      }

      .form-field small {
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
      }

      .rpe-help {
        font-weight: normal;
        color: var(--color-brand-primary);
      }

      .rpe-scale {
        display: flex;
        justify-content: space-between;
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
        margin-top: var(--space-1);
      }

      .calculated-load {
        margin-top: var(--space-6);
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-radius: var(--radius-lg);
        text-align: center;
      }

      .load-label {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        margin-bottom: var(--space-2);
      }

      .load-value {
        font-size: var(--font-display-lg);
        font-weight: var(--font-weight-bold);
        color: var(--color-brand-primary);
      }

      .load-formula {
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
        margin-top: var(--space-1);
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-4);
        margin-top: var(--space-6);
      }

      @media (max-width: 768px) {
        .session-types-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .form-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class TrainingLogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private trainingDataService = inject(TrainingDataService);
  private acwrService = inject(AcwrService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);

  isSubmitting = signal(false);

  sessionTypes: SessionType[] = [
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

  sessionForm: FormGroup = this.fb.group({
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

  calculatedLoad = computed(() => {
    const duration = this.sessionForm.get("durationMinutes")?.value || 0;
    const rpe = this.sessionForm.get("rpe")?.value || 0;
    return duration * rpe;
  });

  ngOnInit(): void {
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

      const sessionData = {
        athlete_id: user?.id,
        session_type: formValue.sessionType,
        duration_minutes: formValue.durationMinutes,
        rpe: formValue.rpe,
        training_load: formValue.durationMinutes * formValue.rpe,
        sprint_reps: formValue.sprintReps || 0,
        cutting_movements: formValue.cuttingMovements || 0,
        throw_count: formValue.throwCount || 0,
        jump_count: formValue.jumpCount || 0,
        notes: formValue.notes,
        session_date: new Date().toISOString(),
      };

      // Save to database via service
      await this.trainingDataService
        .createTrainingSession({
          user_id: user?.id || "",
          session_date: sessionData.session_date,
          session_type: sessionData.session_type,
          duration_minutes: sessionData.duration_minutes,
          rpe: sessionData.rpe,
          notes: sessionData.notes,
        })
        .toPromise();

      // Update ACWR calculations
      this.acwrService.addSession({
        playerId: user?.id || "",
        date: new Date(),
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

      this.toastService.success("Training session logged successfully!");
      this.router.navigate(["/dashboard"]);
    } catch (error) {
      this.logger.error("Failed to log training session", error);
      this.toastService.error("Failed to log session. Please try again.");
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
}
