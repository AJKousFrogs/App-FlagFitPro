import { ChangeDetectionStrategy, Component, output } from "@angular/core";

@Component({
  selector: "app-onboarding-step-welcome",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="ob-welcome">
      <div class="ob-welcome__body">
        <div class="ob-welcome__icon-wrap" aria-hidden="true">
          <i class="pi pi-flag ob-welcome__emoji" aria-hidden="true"></i>
        </div>

        <h1 class="ob-welcome__title">Welcome to<br>FlagFit Pro</h1>
        <p class="ob-welcome__subtitle">
          Set up your training profile and get to today's plan.<br>
          Takes about 3 minutes.
        </p>

        <div class="ob-welcome__accent" aria-hidden="true"></div>

        <ul class="ob-welcome__features" aria-label="What you will set up">
          <li class="ob-welcome__feature">
            <span class="ob-welcome__feature-dot" aria-hidden="true"></span>
            Your position &amp; team
          </li>
          <li class="ob-welcome__feature">
            <span class="ob-welcome__feature-dot" aria-hidden="true"></span>
            Training goals
          </li>
          <li class="ob-welcome__feature">
            <span class="ob-welcome__feature-dot" aria-hidden="true"></span>
            Weekly schedule
          </li>
        </ul>
      </div>

      <div class="ob-welcome__footer">
        <button
          class="ob-welcome__cta"
          type="button"
          (click)="getStarted.emit()"
          aria-label="Get started with profile setup"
        >
          Get Started
          <i class="pi pi-arrow-right" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  `,
})
export class OnboardingStepWelcomeComponent {
  readonly getStarted = output<void>();
}
