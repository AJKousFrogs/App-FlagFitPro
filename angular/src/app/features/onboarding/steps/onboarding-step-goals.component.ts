import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { GOALS } from "../constants/onboarding-options";
import { OnboardingStateService } from "../services/onboarding-state.service";

@Component({
  selector: "app-onboarding-step-goals",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="ob-step">
      <div class="ob-hero-icon" aria-hidden="true">
        <i class="pi pi-flag"></i>
      </div>

      <h2 class="ob-heading">What are your goals?</h2>
      <p class="ob-subtext">Pick all that apply. We'll tailor your plan around these.</p>

      <div
        class="ob-card-grid ob-card-grid--3col"
        role="group"
        aria-label="Training goals"
      >
        @for (goal of goals; track goal.id) {
          <button
            type="button"
            role="checkbox"
            class="ob-card"
            [attr.aria-checked]="state.formData.goals.includes(goal.id)"
            [attr.data-cy]="'goal-' + goal.id"
            (click)="state.toggleGoal(goal.id)"
            (keydown.enter)="state.toggleGoal(goal.id)"
            (keydown.space)="state.toggleGoal(goal.id); $event.preventDefault()"
          >
            <i [class]="goal.icon" class="ob-card__icon" aria-hidden="true"></i>
            <span class="ob-card__label">{{ goal.label }}</span>
            <span class="ob-card__check" aria-hidden="true">
              <i class="pi pi-check"></i>
            </span>
          </button>
        }
      </div>

      @if (state.formData.goals.length === 0) {
        <p class="ob-field-hint" style="text-align:center;margin-top:var(--space-3)">
          Select at least one goal to continue.
        </p>
      }
    </div>
  `,
})
export class OnboardingStepGoalsComponent {
  readonly state = inject(OnboardingStateService);
  readonly goals = GOALS;
}
