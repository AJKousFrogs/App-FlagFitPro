import { ChangeDetectionStrategy, Component, inject, output } from "@angular/core";
import { RouterLink } from "@angular/router";
import { type CheckboxChangeEvent } from "primeng/checkbox";
import { OnboardingStateService } from "../services/onboarding-state.service";

@Component({
  selector: "app-onboarding-step-summary",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="ob-step">
      <!-- Success callout -->
      <div class="ob-success-note">
        <i class="pi pi-check-circle" aria-hidden="true"></i>
        <span>
          @if (state.isStaff()) {
            You're ready to manage your team. Review your details below.
          } @else {
            Your training profile is ready. Review your details below.
          }
        </span>
      </div>

      <!-- Profile block -->
      <div class="ob-review-block">
        <div class="ob-review-block-title">
          <i class="pi pi-user" aria-hidden="true"></i> Profile
        </div>
        <div class="ob-review-row">
          <i class="pi pi-id-card ob-review-icon" aria-hidden="true"></i>
          <div>
            <span class="ob-review-value">{{ state.formData.name || 'Not set' }}</span>
            <span class="ob-review-label">Full name</span>
          </div>
        </div>
        <div class="ob-review-row">
          <i class="pi pi-calendar ob-review-icon" aria-hidden="true"></i>
          <div>
            <span class="ob-review-value">
              {{ state.calculatedAge() || '?' }} yrs · {{ state.getAgeGroup() }}
            </span>
            <span class="ob-review-label">Age</span>
          </div>
        </div>
        @if (state.formData.gender) {
          <div class="ob-review-row">
            <i class="pi pi-user ob-review-icon" aria-hidden="true"></i>
            <div>
              <span class="ob-review-value">
                {{ state.getGenderLabel(state.formData.gender) }}
              </span>
              <span class="ob-review-label">Gender</span>
            </div>
          </div>
        }
        <div class="ob-review-row">
          <i class="pi pi-map-marker ob-review-icon" aria-hidden="true"></i>
          <div>
            <span class="ob-review-value">{{ state.formData.country || 'Not selected' }}</span>
            <span class="ob-review-label">Country</span>
          </div>
        </div>
      </div>

      <!-- Role / Team block -->
      @if (state.isStaff()) {
        <div class="ob-review-block">
          <div class="ob-review-block-title">
            <i class="pi pi-briefcase" aria-hidden="true"></i> Role
          </div>
          <div class="ob-review-row">
            <i class="pi pi-users ob-review-icon" aria-hidden="true"></i>
            <div>
              <span class="ob-review-value">{{ state.getTeamLabel(state.formData.team) }}</span>
              <span class="ob-review-label">Team</span>
            </div>
          </div>
          <div class="ob-review-row">
            <i class="pi pi-briefcase ob-review-icon" aria-hidden="true"></i>
            <div>
              <span class="ob-review-value">
                {{ state.getStaffRoleLabel(state.formData.staffRole) }}
              </span>
              <span class="ob-review-label">Staff role</span>
            </div>
          </div>
          <div class="ob-review-row">
            <i class="pi pi-lock ob-review-icon" aria-hidden="true"></i>
            <div>
              <span class="ob-review-value">
                {{ state.formData.staffVisibility.length }} section(s)
              </span>
              <span class="ob-review-label">App access</span>
            </div>
          </div>
        </div>
      }

      @if (state.isPlayer()) {
        <!-- Team block -->
        <div class="ob-review-block">
          <div class="ob-review-block-title">
            <i class="pi pi-users" aria-hidden="true"></i> Team
          </div>
          <div class="ob-review-row">
            <i class="pi pi-shield ob-review-icon" aria-hidden="true"></i>
            <div>
              <span class="ob-review-value">{{ state.getTeamLabel(state.formData.team) }}</span>
              <span class="ob-review-label">Team</span>
            </div>
          </div>
          <div class="ob-review-row">
            <i class="pi pi-star ob-review-icon" aria-hidden="true"></i>
            <div>
              <span class="ob-review-value">
                {{ state.getPositionLabel(state.formData.position) }}
                @if (state.formData.jerseyNumber) { · #{{ state.formData.jerseyNumber }} }
              </span>
              <span class="ob-review-label">Position</span>
            </div>
          </div>
          <div class="ob-review-row">
            <i class="pi pi-chart-line ob-review-icon" aria-hidden="true"></i>
            <div>
              <span class="ob-review-value">
                {{ state.getExperienceLabel(state.formData.experience) }}
              </span>
              <span class="ob-review-label">Experience</span>
            </div>
          </div>
        </div>

        <!-- Physical block -->
        <div class="ob-review-block">
          <div class="ob-review-block-title">
            <i class="pi pi-heart" aria-hidden="true"></i> Physical
          </div>
          <div class="ob-review-row">
            <i class="pi pi-arrows-v ob-review-icon" aria-hidden="true"></i>
            <div>
              <span class="ob-review-value">{{ state.getHeightDisplay() }}</span>
              <span class="ob-review-label">Height</span>
            </div>
          </div>
          <div class="ob-review-row">
            <i class="pi pi-box ob-review-icon" aria-hidden="true"></i>
            <div>
              <span class="ob-review-value">{{ state.getWeightDisplay() }}</span>
              <span class="ob-review-label">Weight</span>
            </div>
          </div>
        </div>

        <!-- Goals + Schedule block -->
        <div class="ob-review-block">
          <div class="ob-review-block-title">
            <i class="pi pi-flag" aria-hidden="true"></i> Training
          </div>
          @if (state.formData.goals.length > 0) {
            <div class="ob-review-row">
              <i class="pi pi-bolt ob-review-icon" aria-hidden="true"></i>
              <div>
                <span class="ob-review-value">{{ state.formData.goals.length }} goal(s) selected</span>
                <span class="ob-review-label">Training goals</span>
              </div>
            </div>
          }
          @if (state.formData.scheduleType) {
            <div class="ob-review-row">
              <i class="pi pi-calendar ob-review-icon" aria-hidden="true"></i>
              <div>
                <span class="ob-review-value">
                  {{ state.getScheduleLabel(state.formData.scheduleType) }}
                  @if (state.formData.practicesPerWeek) {
                    · {{ state.formData.practicesPerWeek }}×/week
                  }
                </span>
                <span class="ob-review-label">Schedule</span>
              </div>
            </div>
          }
          @if (state.formData.currentInjuries.length > 0) {
            <div class="ob-review-row">
              <i class="pi pi-shield ob-review-icon" aria-hidden="true"></i>
              <div>
                <span class="ob-review-value">
                  {{ state.formData.currentInjuries.length }} area(s) noted
                </span>
                <span class="ob-review-label">Current injuries</span>
              </div>
            </div>
          }
        </div>
      }

      <!-- Required consents -->
      <div
        class="ob-consent-section"
        role="group"
        aria-labelledby="ob-consent-heading"
      >
        <h3 class="ob-consent-title" id="ob-consent-heading">
          <i class="pi pi-shield" aria-hidden="true"></i>
          Required consents
        </h3>

        <!-- Terms -->
        <div class="ob-consent-item">
          <button
            type="button"
            class="ob-consent-checkbox"
            [class.ob-consent-checkbox--checked]="state.formData.consentTermsOfService"
            role="checkbox"
            [attr.aria-checked]="state.formData.consentTermsOfService"
            aria-label="Accept Terms of Service"
            (click)="toggleConsent('terms')"
            (keydown.space)="toggleConsent('terms'); $event.preventDefault()"
          >
            <i class="pi pi-check" aria-hidden="true"></i>
          </button>
          <span class="ob-consent-text">
            I accept the
            <a [routerLink]="['/terms']" target="_blank" class="ob-consent-link"
               (click)="$event.stopPropagation()">Terms of Service</a>
            <span class="ob-req" aria-hidden="true"> *</span>
          </span>
        </div>

        <!-- Privacy -->
        <div class="ob-consent-item">
          <button
            type="button"
            class="ob-consent-checkbox"
            [class.ob-consent-checkbox--checked]="state.formData.consentPrivacyPolicy"
            role="checkbox"
            [attr.aria-checked]="state.formData.consentPrivacyPolicy"
            aria-label="Accept Privacy Policy"
            (click)="toggleConsent('privacy')"
            (keydown.space)="toggleConsent('privacy'); $event.preventDefault()"
          >
            <i class="pi pi-check" aria-hidden="true"></i>
          </button>
          <span class="ob-consent-text">
            I accept the
            <a [routerLink]="['/privacy']" target="_blank" class="ob-consent-link"
               (click)="$event.stopPropagation()">Privacy Policy</a>
            <span class="ob-req" aria-hidden="true"> *</span>
          </span>
        </div>

        <!-- Data usage -->
        <div class="ob-consent-item">
          <button
            type="button"
            class="ob-consent-checkbox"
            [class.ob-consent-checkbox--checked]="state.formData.consentDataUsage"
            role="checkbox"
            [attr.aria-checked]="state.formData.consentDataUsage"
            aria-label="Consent to data usage"
            (click)="toggleConsent('data')"
            (keydown.space)="toggleConsent('data'); $event.preventDefault()"
          >
            <i class="pi pi-check" aria-hidden="true"></i>
          </button>
          <span class="ob-consent-text">
            I consent to my data being used to personalise my training
            <span class="ob-consent-hint">(required for app functionality)</span>
            <span class="ob-req" aria-hidden="true"> *</span>
          </span>
        </div>

        <!-- Merlin AI (optional) -->
        <div class="ob-consent-item">
          <button
            type="button"
            class="ob-consent-checkbox"
            [class.ob-consent-checkbox--checked]="state.formData.consentAICoach"
            role="checkbox"
            [attr.aria-checked]="state.formData.consentAICoach"
            aria-label="Consent to Merlin AI coaching"
            (click)="toggleConsent('ai')"
            (keydown.space)="toggleConsent('ai'); $event.preventDefault()"
          >
            <i class="pi pi-check" aria-hidden="true"></i>
          </button>
          <span class="ob-consent-text">
            Merlin AI may use my training data to provide personalised advice
            <span class="ob-consent-hint">(optional)</span>
          </span>
        </div>

        <!-- Email updates (optional) -->
        <div class="ob-consent-item">
          <button
            type="button"
            class="ob-consent-checkbox"
            [class.ob-consent-checkbox--checked]="state.formData.consentEmailUpdates"
            role="checkbox"
            [attr.aria-checked]="state.formData.consentEmailUpdates"
            aria-label="Receive email updates"
            (click)="toggleConsent('email')"
            (keydown.space)="toggleConsent('email'); $event.preventDefault()"
          >
            <i class="pi pi-check" aria-hidden="true"></i>
          </button>
          <span class="ob-consent-text">
            Send me email updates about new features and tips
            <span class="ob-consent-hint">(optional)</span>
          </span>
        </div>

        @if (!state.formData.consentTermsOfService || !state.formData.consentPrivacyPolicy || !state.formData.consentDataUsage) {
          <div class="ob-consent-error" role="alert">
            <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
            <span>Please accept all 3 required consents to finish.</span>
          </div>
        }
      </div>
    </div>
  `,
})
export class OnboardingStepSummaryComponent {
  readonly state = inject(OnboardingStateService);
  readonly consentChange = output<{ type: string; checked: boolean }>();

  toggleConsent(type: "terms" | "privacy" | "data" | "ai" | "email"): void {
    switch (type) {
      case "terms":
        this.state.formData.consentTermsOfService = !this.state.formData.consentTermsOfService;
        this.consentChange.emit({ type: "Terms of Service", checked: this.state.formData.consentTermsOfService });
        break;
      case "privacy":
        this.state.formData.consentPrivacyPolicy = !this.state.formData.consentPrivacyPolicy;
        this.consentChange.emit({ type: "Privacy Policy", checked: this.state.formData.consentPrivacyPolicy });
        break;
      case "data":
        this.state.formData.consentDataUsage = !this.state.formData.consentDataUsage;
        this.consentChange.emit({ type: "Data Usage", checked: this.state.formData.consentDataUsage });
        break;
      case "ai":
        this.state.formData.consentAICoach = !this.state.formData.consentAICoach;
        this.consentChange.emit({ type: "Merlin AI", checked: this.state.formData.consentAICoach });
        break;
      case "email":
        this.state.formData.consentEmailUpdates = !this.state.formData.consentEmailUpdates;
        this.consentChange.emit({ type: "Email Updates", checked: this.state.formData.consentEmailUpdates });
        break;
    }
    this.state.saveDraft();
  }

  // Legacy handler kept for compatibility with onboarding.component.ts onSummaryConsentChange
  onConsentTermsChange(event: CheckboxChangeEvent): void {
    const checked = Boolean(event.checked);
    this.state.formData.consentTermsOfService = checked;
    this.consentChange.emit({ type: "Terms of Service", checked });
  }

  onConsentPrivacyChange(event: CheckboxChangeEvent): void {
    const checked = Boolean(event.checked);
    this.state.formData.consentPrivacyPolicy = checked;
    this.consentChange.emit({ type: "Privacy Policy", checked });
  }

  onConsentDataUsageChange(event: CheckboxChangeEvent): void {
    const checked = Boolean(event.checked);
    this.state.formData.consentDataUsage = checked;
    this.consentChange.emit({ type: "Data Usage", checked });
  }

  onConsentAiCoachChange(event: CheckboxChangeEvent): void {
    const checked = Boolean(event.checked);
    this.state.formData.consentAICoach = checked;
    this.consentChange.emit({ type: "Merlin AI", checked });
  }

  onConsentEmailUpdatesChange(event: CheckboxChangeEvent): void {
    const checked = Boolean(event.checked);
    this.state.formData.consentEmailUpdates = checked;
    this.consentChange.emit({ type: "Email Updates", checked });
  }
}
