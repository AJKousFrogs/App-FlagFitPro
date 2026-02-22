import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { GOALS } from "../constants/onboarding-options";
import { OnboardingStateService } from "../services/onboarding-state.service";

@Component({
  selector: "app-onboarding-step-goals",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="step-content animate-fade-in">
      <div class="step-header">
        <i class="pi pi-flag step-icon"></i>
        <div>
          <h3>Training Goals</h3>
          <p class="step-description">
            What do you want to achieve? (select all that apply)
          </p>
        </div>
      </div>

      <div
        class="goals-grid"
        role="group"
        aria-label="Training goals"
      >
        @for (goal of goals; track goal.id) {
          <button
            type="button"
            role="checkbox"
            class="goal-card"
            [class.selected]="state.formData.goals.includes(goal.id)"
            [attr.aria-checked]="state.formData.goals.includes(goal.id)"
            [attr.data-cy]="'goal-' + goal.id"
            (click)="state.toggleGoal(goal.id)"
            (keydown.enter)="state.toggleGoal(goal.id)"
            (keydown.space)="
              state.toggleGoal(goal.id); $event.preventDefault()
            "
          >
            <span class="goal-check">
              @if (state.formData.goals.includes(goal.id)) {
                <i class="pi pi-check"></i>
              }
            </span>
            <i [class]="goal.icon" class="goal-icon"></i>
            <span class="goal-label">{{ goal.label }}</span>
          </button>
        }
      </div>
    </div>
  `,
})
export class OnboardingStepGoalsComponent {
  readonly state = inject(OnboardingStateService);
  readonly goals = GOALS;
}
