import { ChangeDetectionStrategy, Component, inject, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { CheckboxModule } from "primeng/checkbox";
import { FormsModule } from "@angular/forms";
import { OnboardingStateService } from "../services/onboarding-state.service";

@Component({
  selector: "app-onboarding-step-summary",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, CheckboxModule, FormsModule],
  template: `
    <div class="step-content animate-fade-in">
      <div class="step-header">
        <i class="pi pi-check-circle step-icon success"></i>
        <div>
          <h3>Final Review</h3>
          <p class="step-description">
            @if (state.isStaff()) {
              Confirm your details, then finish setup to start managing your team
            } @else {
              Confirm your details, then finish setup to start your training plan
            }
          </p>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <h4><i class="pi pi-user"></i> Profile</h4>
          <div class="summary-content">
            <div class="summary-row">
              <span class="label">Name</span>
              <span class="value">{{ state.formData.name || "Not set" }}</span>
            </div>
            <div class="summary-row">
              <span class="label">Age</span>
              <span class="value">{{ state.calculatedAge() || "?" }} years ({{ state.getAgeGroup() }})</span>
            </div>
            <div class="summary-row">
              <span class="label">Gender</span>
              <span class="value">{{ state.getGenderLabel(state.formData.gender) }}</span>
            </div>
            <div class="summary-row">
              <span class="label">Country</span>
              <span class="value">{{ state.formData.country || "Not selected" }}</span>
            </div>
          </div>
        </div>

        @if (state.isStaff()) {
          <div class="summary-card">
            <h4><i class="pi pi-briefcase"></i> Role</h4>
            <div class="summary-content">
              <div class="summary-row">
                <span class="label">Team</span>
                <span class="value">{{ state.getTeamLabel(state.formData.team) }}</span>
              </div>
              <div class="summary-row">
                <span class="label">Staff Role</span>
                <span class="value">{{ state.getStaffRoleLabel(state.formData.staffRole) }}</span>
              </div>
              <div class="summary-row">
                <span class="label">App Access</span>
                <span class="value">{{ state.formData.staffVisibility.length }} section(s)</span>
              </div>
            </div>
          </div>
        }

        @if (state.isPlayer()) {
          <div class="summary-card">
            <h4><i class="pi pi-users"></i> Team</h4>
            <div class="summary-content">
              <div class="summary-row">
                <span class="label">Team</span>
                <span class="value">{{ state.getTeamLabel(state.formData.team) }}</span>
              </div>
              <div class="summary-row">
                <span class="label">Jersey</span>
                <span class="value jersey-badge">#{{ state.formData.jerseyNumber || "?" }}</span>
              </div>
              <div class="summary-row">
                <span class="label">Position</span>
                <span class="value">{{ state.getPositionLabel(state.formData.position) }}</span>
              </div>
              @if (state.isQBSelected()) {
                <div class="summary-row">
                  <span class="label">Throwing Arm</span>
                  <span class="value">{{ state.getThrowingArmLabel(state.formData.throwingArm) }}</span>
                </div>
              }
            </div>
          </div>

          <div class="summary-card">
            <h4><i class="pi pi-heart"></i> Physical</h4>
            <div class="summary-content">
              <div class="summary-row">
                <span class="label">Height</span>
                <span class="value">{{ state.getHeightDisplay() }}</span>
              </div>
              <div class="summary-row">
                <span class="label">Weight</span>
                <span class="value">{{ state.getWeightDisplay() }}</span>
              </div>
              <div class="summary-row">
                <span class="label">Experience</span>
                <span class="value">{{ state.getExperienceLabel(state.formData.experience) }}</span>
              </div>
            </div>
          </div>

          <div class="summary-card">
            <h4><i class="pi pi-shield"></i> Health</h4>
            <div class="summary-content">
              <div class="summary-row">
                <span class="label">Current Injuries</span>
                <span class="value">
                  @if (state.formData.currentInjuries.length === 0) { None 👍 }
                  @else { {{ state.formData.currentInjuries.length }} area(s) }
                </span>
              </div>
              <div class="summary-row">
                <span class="label">Injury History</span>
                <span class="value">
                  @if (state.formData.injuryHistory.includes("none") || state.formData.injuryHistory.length === 0) {
                    None 👍
                  } @else {
                    {{ state.formData.injuryHistory.length }} past injury(s)
                  }
                </span>
              </div>
            </div>
          </div>

          <div class="summary-card">
            <h4><i class="pi pi-calendar"></i> Schedule</h4>
            <div class="summary-content">
              <div class="summary-row">
                <span class="label">Schedule Type</span>
                <span class="value">{{ state.getScheduleLabel(state.formData.scheduleType) }}</span>
              </div>
              <div class="summary-row">
                <span class="label">Practices/Week</span>
                <span class="value">{{ state.formData.practicesPerWeek || 0 }}</span>
              </div>
            </div>
          </div>

          <div class="summary-card">
            <h4><i class="pi pi-refresh"></i> Recovery</h4>
            <div class="summary-content">
              <div class="summary-row">
                <span class="label">Morning Mobility</span>
                <span class="value">{{ state.getMobilityLabel(state.formData.morningMobility) }}</span>
              </div>
              <div class="summary-row">
                <span class="label">Foam Rolling</span>
                <span class="value">{{ state.getFoamRollingLabel(state.formData.foamRollingTime) }}</span>
              </div>
              <div class="summary-row">
                <span class="label">Rest Days</span>
                <span class="value">{{ state.getRestDayOptionLabel(state.formData.restDayPreference) }}</span>
              </div>
            </div>
          </div>
        }
      </div>

      <div class="consent-section">
        <h4 class="consent-title"><i class="pi pi-shield"></i> Required Consents</h4>
        <p class="consent-description">To finish onboarding, accept the required policies. Optional choices can be changed anytime.</p>

        <div class="consent-list">
          <div class="consent-item required">
            <div class="consent-checkbox-wrapper">
              <p-checkbox [value]="state.formData.consentTermsOfService" [binary]="true" variant="filled"
                inputId="consent-terms" name="consentTermsOfService"
                (onChange)="onConsentTermsChange($event.checked)" />
              <label for="consent-terms" class="consent-label">
                I accept the <a [routerLink]="['/terms']" target="_blank" class="consent-link" (click)="$event.stopPropagation()">Terms of Service</a>
                <span class="required-indicator">*</span>
              </label>
            </div>
          </div>

          <div class="consent-item required">
            <div class="consent-checkbox-wrapper">
              <p-checkbox [value]="state.formData.consentPrivacyPolicy" [binary]="true" variant="filled"
                inputId="consent-privacy" name="consentPrivacyPolicy"
                (onChange)="onConsentPrivacyChange($event.checked)" />
              <label for="consent-privacy" class="consent-label">
                I accept the <a [routerLink]="['/privacy']" target="_blank" class="consent-link" (click)="$event.stopPropagation()">Privacy Policy</a>
                <span class="required-indicator">*</span>
              </label>
            </div>
          </div>

          <div class="consent-item required">
            <div class="consent-checkbox-wrapper">
              <p-checkbox [value]="state.formData.consentDataUsage" [binary]="true" variant="filled"
                inputId="consent-data" name="consentDataUsage"
                (onChange)="onConsentDataUsageChange($event.checked)" />
              <label for="consent-data" class="consent-label">
                I consent to my data being used to personalize my training experience
                <span class="consent-hint">(required for app functionality)</span>
                <span class="required-indicator">*</span>
              </label>
            </div>
          </div>

          <div class="consent-item optional">
            <div class="consent-checkbox-wrapper">
              <p-checkbox [value]="state.formData.consentAICoach" [binary]="true" variant="filled"
                inputId="consent-ai" name="consentAICoach"
                (onChange)="onConsentAiCoachChange($event.checked)" />
              <label for="consent-ai" class="consent-label">
                I consent to Merlin AI providing personalized advice based on my training and wellness data
                <span class="consent-hint">(optional)</span>
              </label>
            </div>
          </div>

          <div class="consent-item optional">
            <div class="consent-checkbox-wrapper">
              <p-checkbox [value]="state.formData.consentEmailUpdates" [binary]="true" variant="filled"
                inputId="consent-email" name="consentEmailUpdates"
                (onChange)="onConsentEmailUpdatesChange($event.checked)" />
              <label for="consent-email" class="consent-label">
                I want to receive email updates about new features and tips
                <span class="consent-hint">(optional)</span>
              </label>
            </div>
          </div>
        </div>

        @if (!state.formData.consentTermsOfService || !state.formData.consentPrivacyPolicy || !state.formData.consentDataUsage) {
          <div class="consent-error">
            <i class="pi pi-exclamation-triangle"></i>
            <span>Please accept all 3 required consents to finish onboarding.</span>
          </div>
        }
      </div>

      <div class="summary-note success">
        <i class="pi pi-check-circle"></i>
        @if (state.isStaff()) {
          <span>You're ready to manage your team. You can update these settings anytime in your profile.</span>
        } @else {
          <span>Your personalized training plan is ready. You can update these settings anytime in your profile.</span>
        }
      </div>
    </div>
  `,
})
export class OnboardingStepSummaryComponent {
  readonly state = inject(OnboardingStateService);
  readonly consentChange = output<{ type: string; checked: boolean }>();

  onConsentTermsChange(checked: boolean | undefined): void {
    const nextValue = !!checked;
    this.state.formData.consentTermsOfService = nextValue;
    this.consentChange.emit({ type: "Terms of Service", checked: nextValue });
  }

  onConsentPrivacyChange(checked: boolean | undefined): void {
    const nextValue = !!checked;
    this.state.formData.consentPrivacyPolicy = nextValue;
    this.consentChange.emit({ type: "Privacy Policy", checked: nextValue });
  }

  onConsentDataUsageChange(checked: boolean | undefined): void {
    const nextValue = !!checked;
    this.state.formData.consentDataUsage = nextValue;
    this.consentChange.emit({ type: "Data Usage", checked: nextValue });
  }

  onConsentAiCoachChange(checked: boolean | undefined): void {
    const nextValue = !!checked;
    this.state.formData.consentAICoach = nextValue;
    this.consentChange.emit({ type: "Merlin AI", checked: nextValue });
  }

  onConsentEmailUpdatesChange(checked: boolean | undefined): void {
    const nextValue = !!checked;
    this.state.formData.consentEmailUpdates = nextValue;
    this.consentChange.emit({ type: "Email Updates", checked: nextValue });
  }
}
