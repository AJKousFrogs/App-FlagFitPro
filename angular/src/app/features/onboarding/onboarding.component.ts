import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
  OnInit,
} from "@angular/core";

import { Router, RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { Select } from "primeng/select";
import { StepsModule } from "primeng/steps";
import { MessageService } from "primeng/api";
import { ToastModule } from "primeng/toast";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";

interface OnboardingStep {
  label: string;
  completed: boolean;
}

@Component({
  selector: "app-onboarding",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    Select,
    StepsModule,
    ToastModule,
    MainLayoutComponent,
    PageHeaderComponent,
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <app-main-layout>
      <div class="onboarding-page">
        <app-page-header
          title="Welcome to FlagFit Pro"
          subtitle="Let's set up your profile"
          icon="pi-user-plus"
        ></app-page-header>

        <p-card class="onboarding-card">
          <p-steps [model]="steps()" [activeIndex]="currentStep()"></p-steps>

          <div class="onboarding-content">
            @if (currentStep() === 0) {
              <!-- Step 1: Basic Info -->
              <div class="step-content">
                <h3>Tell us about yourself</h3>
                <div class="form-group">
                  <label for="name">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    pInputText
                    [(ngModel)]="onboardingData.name"
                    placeholder="Enter your full name"
                    class="w-full"
                  />
                </div>
                <div class="form-group">
                  <label for="position">Position</label>
                  <p-select
                    id="position"
                    [options]="positions"
                    [(ngModel)]="onboardingData.position"
                    placeholder="Select your position"
                    [showClear]="true"
                    class="w-full"
                  ></p-select>
                </div>
              </div>
            } @else if (currentStep() === 1) {
              <!-- Step 2: Goals -->
              <div class="step-content">
                <h3>What are your goals?</h3>
                <div class="form-group">
                  <label
                    >Select your primary goals (select all that apply)</label
                  >
                  <div class="goals-grid">
                    @for (goal of goals; track goal.id) {
                      <div
                        class="goal-card"
                        [class.selected]="
                          onboardingData.goals.includes(goal.id)
                        "
                        (click)="toggleGoal(goal.id)"
                      >
                        <i [class]="goal.icon"></i>
                        <span>{{ goal.label }}</span>
                      </div>
                    }
                  </div>
                </div>
              </div>
            } @else if (currentStep() === 2) {
              <!-- Step 3: Experience -->
              <div class="step-content">
                <h3>What's your experience level?</h3>
                <div class="form-group">
                  <label for="experience">Experience Level</label>
                  <p-select
                    id="experience"
                    [options]="experienceLevels"
                    [(ngModel)]="onboardingData.experience"
                    placeholder="Select your experience level"
                    class="w-full"
                  ></p-select>
                </div>
              </div>
            }

            <div class="onboarding-actions">
              @if (currentStep() > 0) {
                <p-button
                  label="Back"
                  [outlined]="true"
                  (onClick)="previousStep()"
                  icon="pi pi-arrow-left"
                ></p-button>
              }
              @if (currentStep() < steps().length - 1) {
                <p-button
                  label="Next"
                  (onClick)="nextStep()"
                  icon="pi pi-arrow-right"
                  iconPos="right"
                ></p-button>
              } @else {
                <p-button
                  label="Complete Setup"
                  (onClick)="completeOnboarding()"
                  [loading]="isCompleting()"
                  icon="pi pi-check"
                ></p-button>
              }
            </div>
          </div>
        </p-card>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .onboarding-page {
        padding: var(--space-6);
      }

      .onboarding-card {
        margin-top: var(--space-6);
      }

      .onboarding-content {
        margin-top: var(--space-6);
        min-height: 400px;
      }

      .step-content h3 {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: var(--space-4);
        color: var(--text-primary);
      }

      .form-group {
        margin-bottom: var(--space-4);
      }

      .form-group label {
        display: block;
        margin-bottom: var(--space-2);
        font-weight: 500;
        color: var(--text-primary);
      }

      .goals-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: var(--space-3);
        margin-top: var(--space-3);
      }

      .goal-card {
        padding: var(--space-4);
        border: 2px solid var(--p-surface-200);
        border-radius: var(--p-border-radius);
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
      }

      .goal-card:hover {
        border-color: var(--color-brand-primary);
        background: var(--p-surface-50);
      }

      .goal-card.selected {
        border-color: var(--color-brand-primary);
        background: var(--color-brand-primary-light);
      }

      .goal-card i {
        font-size: 2rem;
        display: block;
        margin-bottom: var(--space-2);
        color: var(--color-brand-primary);
      }

      .onboarding-actions {
        display: flex;
        justify-content: space-between;
        margin-top: var(--space-6);
        padding-top: var(--space-4);
        border-top: 1px solid var(--p-surface-200);
      }
    `,
  ],
})
export class OnboardingComponent implements OnInit {
  private router = inject(Router);
  private messageService = inject(MessageService);

  currentStep = signal(0);
  isCompleting = signal(false);

  positions = [
    { label: "Quarterback (QB)", value: "QB" },
    { label: "Wide Receiver (WR)", value: "WR" },
    { label: "Running Back (RB)", value: "RB" },
    { label: "Tight End (TE)", value: "TE" },
    { label: "Defensive Back (DB)", value: "DB" },
    { label: "Linebacker (LB)", value: "LB" },
    { label: "Defensive Line (DL)", value: "DL" },
  ];

  goals = [
    { id: "speed", label: "Improve Speed", icon: "pi pi-bolt" },
    { id: "strength", label: "Build Strength", icon: "pi pi-chart-line" },
    { id: "agility", label: "Enhance Agility", icon: "pi pi-sync" },
    { id: "endurance", label: "Increase Endurance", icon: "pi pi-heart" },
    { id: "technique", label: "Perfect Technique", icon: "pi pi-star" },
    { id: "injury", label: "Prevent Injuries", icon: "pi pi-shield" },
  ];

  experienceLevels = [
    { label: "Beginner", value: "beginner" },
    { label: "Intermediate", value: "intermediate" },
    { label: "Advanced", value: "advanced" },
    { label: "Professional", value: "professional" },
  ];

  onboardingData = {
    name: "",
    position: null,
    goals: [] as string[],
    experience: null,
  };

  steps = signal<OnboardingStep[]>([
    { label: "Basic Info", completed: false },
    { label: "Goals", completed: false },
    { label: "Experience", completed: false },
  ]);

  ngOnInit(): void {
    // Load existing user data if available
  }

  toggleGoal(goalId: string): void {
    const index = this.onboardingData.goals.indexOf(goalId);
    if (index > -1) {
      this.onboardingData.goals.splice(index, 1);
    } else {
      this.onboardingData.goals.push(goalId);
    }
  }

  nextStep(): void {
    if (this.currentStep() < this.steps().length - 1) {
      const steps = this.steps();
      steps[this.currentStep()].completed = true;
      this.steps.set([...steps]);
      this.currentStep.set(this.currentStep() + 1);
    }
  }

  previousStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  async completeOnboarding(): Promise<void> {
    this.isCompleting.set(true);

    try {
      // See issue #5 - Implement onboarding data persistence API
      // await this.apiService.completeOnboarding(this.onboardingData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.messageService.add({
        severity: "success",
        summary: "Welcome!",
        detail: "Your profile has been set up successfully.",
      });

      // Redirect to dashboard
      setTimeout(() => {
        this.router.navigate(["/dashboard"]);
      }, 1000);
    } catch (error) {
      this.messageService.add({
        severity: "error",
        summary: "Error",
        detail: error.message || "Failed to complete setup. Please try again.",
      });
    } finally {
      this.isCompleting.set(false);
    }
  }
}
