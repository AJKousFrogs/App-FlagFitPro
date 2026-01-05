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
import { COLORS } from "../../../core/constants/app.constants";

// PrimeNG
import { ButtonComponent } from "../button/button.component";
import { IconButtonComponent } from "../button/icon-button.component";
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
    StepsModule,
    ProgressBarModule,
    CardModule,
    ButtonComponent,
    IconButtonComponent,
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
              <app-icon-button
                icon="pi-arrow-right"
                (clicked)="executeAction()"
                ariaLabel="arrow-right"
              />
            </div>
          }
        </div>

        <!-- Navigation -->
        <div class="navigation-section">
          <app-button variant="text" (clicked)="skipTour()"
            >Skip Tour</app-button
          >

          <div class="nav-buttons">
            @if (currentStepIndex() > 0) {
              <app-button
                variant="outlined"
                iconLeft="pi-arrow-left"
                (clicked)="previousStep()"
                >Back</app-button
              >
            }

            @if (currentStepIndex() < steps.length - 1) {
              <app-button iconLeft="pi-arrow-right" (clicked)="nextStep()"
                >Next</app-button
              >
            } @else {
              <app-button iconLeft="pi-check" (clicked)="completeTour()"
                >Get Started!</app-button
              >
            }
          </div>
        </div>
      </div>
    </p-dialog>
  `,
  styleUrl: "./feature-walkthrough.component.scss",
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
      iconColor: COLORS.AMBER,
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
      iconColor: COLORS.ERROR,
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
      iconColor: COLORS.SUCCESS,
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
      iconColor: COLORS.ORANGE,
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
      iconColor: COLORS.PURPLE_LIGHT,
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
      iconColor: COLORS.GREEN,
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
