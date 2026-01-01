/**
 * Feature Walkthrough Component
 *
 * Interactive tour after onboarding to teach athletes:
 * - Daily wellness check-in importance
 * - How ACWR works
 * - Game day preparation
 * - Recovery protocols
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from "@angular/core";
import { Router, RouterModule } from "@angular/router";

// PrimeNG
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { DialogModule } from "primeng/dialog";
import { ProgressBarModule } from "primeng/progressbar";
import { StepsModule } from "primeng/steps";

// Services
import { LoggerService } from "../../../core/services/logger.service";

interface WalkthroughStep {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconColor: string;
  content: string;
  benefits: string[];
  action?: {
    label: string;
    route?: string;
    callback?: () => void;
  };
  tip?: string;
}

@Component({
  selector: "app-feature-walkthrough",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    DialogModule,
    ButtonModule,
    StepsModule,
    ProgressBarModule,
    CardModule,
  ],
  template: `
    <p-dialog
      [(visible)]="isVisible"
      [modal]="true"
      [closable]="false"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '520px', maxWidth: '95vw' }"
      [showHeader]="false"
      styleClass="walkthrough-dialog"
    >
      <div class="walkthrough-content">
        <!-- Progress -->
        <div class="progress-section">
          <div class="progress-dots">
            @for (step of steps; track step.id; let i = $index) {
              <div
                class="progress-dot"
                [class.active]="i === currentStepIndex()"
                [class.completed]="i < currentStepIndex()"
              ></div>
            }
          </div>
          <span class="progress-text">
            {{ currentStepIndex() + 1 }} of {{ steps.length }}
          </span>
        </div>

        <!-- Current Step Content -->
        <div
          class="step-content animate-fade-in"
          [attr.data-step]="currentStep().id"
        >
          <!-- Icon -->
          <div
            class="step-icon"
            [style.background]="currentStep().iconColor + '20'"
            [style.color]="currentStep().iconColor"
          >
            <i [class]="'pi ' + currentStep().icon"></i>
          </div>

          <!-- Title -->
          <h2 class="step-title">{{ currentStep().title }}</h2>
          <p class="step-subtitle">{{ currentStep().subtitle }}</p>

          <!-- Main Content -->
          <div class="step-main-content">
            <p class="content-text">{{ currentStep().content }}</p>

            <!-- Benefits -->
            <div class="benefits-list">
              @for (benefit of currentStep().benefits; track benefit) {
                <div class="benefit-item">
                  <i class="pi pi-check-circle"></i>
                  <span>{{ benefit }}</span>
                </div>
              }
            </div>

            <!-- Tip -->
            @if (currentStep().tip) {
              <div class="tip-box">
                <i class="pi pi-lightbulb"></i>
                <span>{{ currentStep().tip }}</span>
              </div>
            }
          </div>

          <!-- Interactive Action -->
          @if (currentStep().action) {
            <div class="action-section">
              <p-button
                [label]="currentStep().action!.label"
                icon="pi pi-arrow-right"
                iconPos="right"
                styleClass="action-btn"
                (onClick)="executeAction()"
              ></p-button>
            </div>
          }
        </div>

        <!-- Navigation -->
        <div class="navigation-section">
          <p-button
            label="Skip Tour"
            [text]="true"
            styleClass="skip-btn"
            (onClick)="skipTour()"
          ></p-button>

          <div class="nav-buttons">
            @if (currentStepIndex() > 0) {
              <p-button
                label="Back"
                icon="pi pi-arrow-left"
                [outlined]="true"
                (onClick)="previousStep()"
              ></p-button>
            }

            @if (currentStepIndex() < steps.length - 1) {
              <p-button
                label="Next"
                icon="pi pi-arrow-right"
                iconPos="right"
                (onClick)="nextStep()"
              ></p-button>
            } @else {
              <p-button
                label="Get Started!"
                icon="pi pi-check"
                styleClass="p-button-success"
                (onClick)="completeTour()"
              ></p-button>
            }
          </div>
        </div>
      </div>
    </p-dialog>
  `,
  styles: [
    `
      :host ::ng-deep .walkthrough-dialog .p-dialog-content {
        padding: 0;
        border-radius: 20px;
        overflow: hidden;
      }

      .walkthrough-content {
        padding: var(--space-6);
      }

      /* Progress */
      .progress-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-6);
      }

      .progress-dots {
        display: flex;
        gap: var(--space-2);
      }

      .progress-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--p-surface-200);
        transition: all 0.3s;
      }

      .progress-dot.active {
        background: var(--color-brand-primary);
        transform: scale(1.2);
      }

      .progress-dot.completed {
        background: var(--p-green-500);
      }

      .progress-text {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      /* Step Content */
      .step-content {
        text-align: center;
      }

      .animate-fade-in {
        animation: fadeIn 0.4s ease;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .step-icon {
        width: 80px;
        height: 80px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto var(--space-5);
      }

      .step-icon i {
        font-size: 2.5rem;
      }

      .step-title {
        margin: 0 0 var(--space-2) 0;
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .step-subtitle {
        margin: 0 0 var(--space-5) 0;
        font-size: 1rem;
        color: var(--text-secondary);
      }

      .step-main-content {
        text-align: left;
        background: var(--p-surface-50);
        border-radius: 16px;
        padding: var(--space-5);
        margin-bottom: var(--space-5);
      }

      .content-text {
        margin: 0 0 var(--space-4) 0;
        font-size: 0.9375rem;
        color: var(--text-primary);
        line-height: 1.6;
      }

      .benefits-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .benefit-item {
        display: flex;
        align-items: flex-start;
        gap: var(--space-2);
      }

      .benefit-item i {
        color: var(--p-green-500);
        font-size: 1rem;
        margin-top: 2px;
      }

      .benefit-item span {
        font-size: 0.875rem;
        color: var(--text-primary);
      }

      .tip-box {
        display: flex;
        align-items: flex-start;
        gap: var(--space-2);
        margin-top: var(--space-4);
        padding: var(--space-3);
        background: var(--p-yellow-50);
        border-radius: 8px;
        border-left: 4px solid var(--p-yellow-400);
      }

      .tip-box i {
        color: var(--p-yellow-600);
        font-size: 1rem;
      }

      .tip-box span {
        font-size: 0.8125rem;
        color: var(--p-yellow-800);
      }

      /* Action Section */
      .action-section {
        margin-bottom: var(--space-5);
      }

      :host ::ng-deep .action-btn {
        width: 100%;
        justify-content: center;
        border-radius: 50px !important;
      }

      /* Navigation */
      .navigation-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: var(--space-4);
        border-top: 1px solid var(--p-surface-200);
      }

      :host ::ng-deep .skip-btn {
        color: var(--color-status-error);
        font-weight: 600;
      }

      :host ::ng-deep .skip-btn:hover {
        background: rgba(239, 68, 68, 0.1) !important;
      }

      .nav-buttons {
        display: flex;
        gap: var(--space-3);
      }

      /* Rounded buttons for navigation */
      :host ::ng-deep .nav-buttons .p-button {
        border-radius: 50px !important;
        padding: 0.75rem 1.5rem !important;
        font-weight: 600 !important;
      }

      :host ::ng-deep .nav-buttons .p-button-outlined {
        border-width: 2px !important;
      }

      /* Primary button (Next) */
      :host
        ::ng-deep
        .nav-buttons
        .p-button:not(.p-button-outlined):not(.p-button-success) {
        background: linear-gradient(
          135deg,
          var(--ds-primary-green-light, #0ab85a) 0%,
          var(--ds-primary-green, #089949) 100%
        ) !important;
        border: none !important;
        color: #ffffff !important;
        box-shadow: 0 4px 12px rgba(8, 153, 73, 0.3);
      }

      :host
        ::ng-deep
        .nav-buttons
        .p-button:not(.p-button-outlined):not(.p-button-success):hover {
        box-shadow: 0 6px 16px rgba(8, 153, 73, 0.4);
        transform: translateY(-1px);
      }

      /* Success button (Get Started) */
      :host ::ng-deep .nav-buttons .p-button-success {
        background: linear-gradient(
          135deg,
          var(--ds-primary-green-light, #0ab85a) 0%,
          var(--ds-primary-green, #089949) 100%
        ) !important;
        border: none !important;
        color: #ffffff !important;
        box-shadow: 0 4px 12px rgba(8, 153, 73, 0.3);
      }

      :host ::ng-deep .nav-buttons .p-button-success:hover {
        box-shadow: 0 6px 16px rgba(8, 153, 73, 0.4);
        transform: translateY(-1px);
      }

      /* Outlined button (Back) */
      :host ::ng-deep .nav-buttons .p-button-outlined {
        border-color: var(--ds-primary-green, #089949) !important;
        color: var(--ds-primary-green, #089949) !important;
        background: transparent !important;
      }

      :host ::ng-deep .nav-buttons .p-button-outlined:hover {
        background: rgba(8, 153, 73, 0.08) !important;
      }

      /* Responsive */
      @media (max-width: 480px) {
        .walkthrough-content {
          padding: var(--space-4);
        }

        .step-icon {
          width: 64px;
          height: 64px;
        }

        .step-icon i {
          font-size: 2rem;
        }

        .step-title {
          font-size: 1.25rem;
        }

        .nav-buttons {
          flex-direction: column;
          width: 100%;
        }

        .navigation-section {
          flex-direction: column;
          gap: var(--space-3);
        }
      }
    `,
  ],
})
export class FeatureWalkthroughComponent {
  private router = inject(Router);
  private logger = inject(LoggerService);

  // Outputs
  completed = output<void>();
  skipped = output<void>();

  // State
  isVisible = true;
  currentStepIndex = signal(0);

  // Walkthrough steps
  steps: WalkthroughStep[] = [
    {
      id: "welcome",
      title: "Welcome to FlagFit Pro! 🏈",
      subtitle: "Your path to LA28 and Brisbane 2032",
      icon: "pi-trophy",
      iconColor: "#f59e0b",
      content:
        "FlagFit Pro is designed specifically for elite flag football athletes like you. Let's take a quick tour of the key features that will help you train smarter and perform better.",
      benefits: [
        "Evidence-based training load management",
        "Personalized recovery protocols",
        "Game day preparation tools",
        "Olympic-focused periodization",
      ],
      tip: "This tour takes about 2 minutes and will help you get the most out of the app.",
    },
    {
      id: "wellness",
      title: "Daily Wellness Check-in",
      subtitle: "The foundation of smart training",
      icon: "pi-heart",
      iconColor: "#ef4444",
      content:
        "Your daily wellness check-in takes just 30 seconds but provides critical data. Sleep, energy, and soreness directly impact your training recommendations and injury risk.",
      benefits: [
        "Optimizes your daily training load",
        "Prevents overtraining injuries",
        "Tracks recovery trends over time",
        "Alerts coaches to potential issues",
      ],
      action: {
        label: "Try a Quick Check-in",
        route: "/wellness",
      },
      tip: "Pro tip: Check in first thing in the morning for the most accurate data!",
    },
    {
      id: "acwr",
      title: "ACWR: Your Training Guardian",
      subtitle: "Acute:Chronic Workload Ratio explained",
      icon: "pi-chart-line",
      iconColor: "#10b981",
      content:
        "ACWR compares your recent training (acute) to your long-term average (chronic). The sweet spot is 0.8-1.3. Too low means you're detraining; too high increases injury risk.",
      benefits: [
        "Scientifically proven injury predictor",
        "Real-time training load feedback",
        "Automatic intensity recommendations",
        "Color-coded risk indicators",
      ],
      tip: "You need about 4 weeks of data for accurate ACWR calculations. Keep logging!",
    },
    {
      id: "gameday",
      title: "Game Day Preparation",
      subtitle: "Be ready when it counts",
      icon: "pi-flag",
      iconColor: "#f97316",
      content:
        "Game Day Readiness and Tournament Nutrition features help you prepare for competition. From pre-game check-ins to hydration tracking during tournaments.",
      benefits: [
        "Pre-competition readiness assessment",
        "Nutrition timing for multi-game days",
        "Hydration tracking and reminders",
        "Travel and jet lag protocols",
      ],
      action: {
        label: "Explore Game Day Features",
        route: "/game/readiness",
      },
      tip: "For tournaments, activate Tournament Mode to track hydration and nutrition across all games!",
    },
    {
      id: "recovery",
      title: "Recovery is Training",
      subtitle: "Optimize your time between sessions",
      icon: "pi-moon",
      iconColor: "#6366f1",
      content:
        "Elite athletes know that recovery is when adaptation happens. Our recovery tools include evidence-based protocols, travel recovery for away games, and sleep tracking.",
      benefits: [
        "Post-training recovery prompts",
        "Jet lag management for travel",
        "Compression and massage protocols",
        "Sleep debt tracking",
      ],
      action: {
        label: "View Recovery Options",
        route: "/travel/recovery",
      },
    },
    {
      id: "ready",
      title: "You're All Set! 🎉",
      subtitle: "Let's start your Olympic journey",
      icon: "pi-check-circle",
      iconColor: "#22c55e",
      content:
        "You now know the key features of FlagFit Pro. Remember: consistency is key. Daily check-ins and regular training logs will unlock the full power of the app.",
      benefits: [
        "Complete your first wellness check-in",
        "Log your next training session",
        "Explore the training video library",
        "Connect with your team",
      ],
      tip: "Questions? Check the help section or reach out to your coach!",
    },
  ];

  currentStep = computed(() => this.steps[this.currentStepIndex()]);

  nextStep(): void {
    if (this.currentStepIndex() < this.steps.length - 1) {
      this.currentStepIndex.update((i) => i + 1);
    }
  }

  previousStep(): void {
    if (this.currentStepIndex() > 0) {
      this.currentStepIndex.update((i) => i - 1);
    }
  }

  executeAction(): void {
    const action = this.currentStep().action;
    if (!action) return;

    if (action.callback) {
      action.callback();
    }

    if (action.route) {
      // Mark as seen and navigate
      this.markTourAsSeen();
      this.isVisible = false;
      this.router.navigate([action.route]);
    }
  }

  skipTour(): void {
    this.markTourAsSeen();
    this.isVisible = false;
    this.skipped.emit();
  }

  completeTour(): void {
    this.markTourAsSeen();
    this.isVisible = false;
    this.completed.emit();
    this.router.navigate(["/dashboard"]);
  }

  private markTourAsSeen(): void {
    localStorage.setItem("feature-walkthrough-completed", "true");
    localStorage.setItem("feature-walkthrough-date", new Date().toISOString());
    this.logger.info("Feature walkthrough completed");
  }

  /**
   * Check if user has already seen the walkthrough
   */
  static hasCompletedWalkthrough(): boolean {
    return localStorage.getItem("feature-walkthrough-completed") === "true";
  }
}
