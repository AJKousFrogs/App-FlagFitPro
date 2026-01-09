import {
    ChangeDetectionStrategy,
    Component,
    OnDestroy,
    OnInit,
    computed,
    inject,
    signal,
} from "@angular/core";

import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { AutoCompleteModule } from "primeng/autocomplete";
import { AvatarModule } from "primeng/avatar";
import { CardModule } from "primeng/card";
import { CheckboxModule } from "primeng/checkbox";
import { DatePicker } from "primeng/datepicker";
import { FileUploadModule } from "primeng/fileupload";
import { InputTextModule } from "primeng/inputtext";
import { ProgressBarModule } from "primeng/progressbar";
import { Select } from "primeng/select";
import { StepperModule } from "primeng/stepper";
import { ToastModule } from "primeng/toast";
import { Subject, Subscription, debounceTime } from "rxjs";
import { UI_LIMITS } from "../../core/constants/app.constants";
import { TOAST } from "../../core/constants/toast-messages.constants";
import { AuthService } from "../../core/services/auth.service";
import { LoggerService, toLogContext } from "../../core/services/logger.service";
import {
    PlayerProgramService,
    getProgramIdForPosition,
    normalizePositionForModifiers,
} from "../../core/services/player-program.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { ToastService } from "../../core/services/toast.service";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";

interface OnboardingStep {
  label: string;
  icon: string;
  completed: boolean;
}

interface InjuryEntry {
  area: string;
  severity: "minor" | "moderate" | "severe";
  notes: string;
}

@Component({
  selector: "app-onboarding",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CardModule,
    InputTextModule,
    Select,
    AutoCompleteModule,
    StepperModule,
    ToastModule,
    DatePicker,
    CheckboxModule,
    FileUploadModule,
    AvatarModule,
    ProgressBarModule,
    MainLayoutComponent,
    PageHeaderComponent,

    ButtonComponent,
    IconButtonComponent,
  ],
  template: `
    <p-toast></p-toast>
    <app-main-layout>
      <div class="onboarding-page">
        <app-page-header
          title="Welcome to FlagFit Pro"
          subtitle="Let's set up your profile and training preferences"
          icon="pi-user-plus"
        ></app-page-header>

        <p-card class="onboarding-card">
          <!-- Progress bar -->
          <div class="progress-section">
            <p-progressBar
              [value]="progress()"
              [showValue]="false"
              styleClass="onboarding-progress"
            ></p-progressBar>
            <div class="progress-info">
              <span class="progress-text">{{ progress() }}% complete</span>
              @if (lastSaved()) {
                <span class="auto-save-indicator" [class.saving]="isSaving()">
                  @if (isSaving()) {
                    <i class="pi pi-spin pi-spinner"></i> Saving...
                  } @else {
                    <i class="pi pi-check-circle"></i> Draft saved
                  }
                </span>
              }
            </div>
          </div>

          <p-stepper
            [value]="currentStep()"
            (valueChange)="goToStep($event)"
            [linear]="false"
          >
            <p-step-list>
              @for (step of steps(); track $index) {
                <p-step [value]="$index">
                  <ng-template pTemplate="content">
                    <div class="step-with-icon">
                      <i [class]="'pi ' + step.icon"></i>
                      <span>{{ step.label }}</span>
                    </div>
                  </ng-template>
                </p-step>
              }
            </p-step-list>
          </p-stepper>

          <div class="onboarding-content">
            @if (currentStep() === 0) {
              <!-- Step 1: Personal Info -->
              <div class="step-content animate-fade-in">
                <div class="step-header">
                  <i class="pi pi-user step-icon"></i>
                  <div>
                    <h3>Personal Information</h3>
                    <p class="step-description">Let's start with the basics</p>
                  </div>
                </div>

                <div class="form-grid">
                  <div class="form-group span-2">
                    <label for="onboarding-name"
                      >Full Name <span class="required">*</span></label
                    >
                    <input
                      id="onboarding-name"
                      name="name"
                      type="text"
                      pInputText
                      [(ngModel)]="onboardingData.name"
                      placeholder="Enter your full name"
                      class="w-full"
                      autocomplete="name"
                    />
                  </div>

                  <div class="form-group">
                    <label for="onboarding-dob"
                      >Date of Birth <span class="required">*</span></label
                    >
                    <p-datepicker
                      inputId="onboarding-dob"
                      [(ngModel)]="onboardingData.dateOfBirth"
                      [maxDate]="maxDate"
                      [minDate]="minDate"
                      dateFormat="dd/mm/yy"
                      placeholder="Select date"
                      [showIcon]="true"
                      styleClass="w-full"
                    ></p-datepicker>
                    @if (calculatedAge()) {
                      <small class="age-hint"
                        >Age: {{ calculatedAge() }} years ({{
                          getAgeGroup()
                        }})</small
                      >
                    }
                  </div>

                  <div class="form-group">
                    <label for="onboarding-gender">Gender</label>
                    <p-select
                      inputId="onboarding-gender"
                      [options]="genderOptions"
                      [(ngModel)]="onboardingData.gender"
                      placeholder="Select gender"
                      class="w-full"
                    ></p-select>
                  </div>

                  <div class="form-group">
                    <label for="onboarding-country"
                      >Country <span class="required">*</span></label
                    >
                    <p-select
                      inputId="onboarding-country"
                      [options]="countryOptions"
                      [(ngModel)]="onboardingData.country"
                      placeholder="Select your country"
                      [filter]="true"
                      filterPlaceholder="Search countries..."
                      class="w-full"
                    ></p-select>
                  </div>

                  <div class="form-group">
                    <label for="onboarding-phone"
                      >Phone Number <small>(optional)</small></label
                    >
                    <input
                      id="onboarding-phone"
                      name="phone"
                      type="tel"
                      pInputText
                      [(ngModel)]="onboardingData.phone"
                      placeholder="+1 234 567 8900"
                      class="w-full"
                      autocomplete="tel"
                    />
                  </div>

                  <!-- Email Verification Status -->
                  <div class="form-group span-2">
                    @if (isEmailVerified()) {
                      <div class="email-verification-banner verified">
                        <i class="pi pi-check-circle"></i>
                        <span>Email verified! You can proceed to the next step.</span>
                      </div>
                    } @else {
                      <div class="email-verification-banner pending">
                        <i class="pi pi-envelope"></i>
                        <div class="verification-content">
                          <span class="verification-message">
                            Please verify your email to continue. Check your inbox for a verification link.
                          </span>
                          <div class="verification-actions">
                            <app-button
                              variant="outlined"
                              size="sm"
                              iconLeft="pi-refresh"
                              [loading]="isResendingVerification()"
                              (clicked)="resendVerificationEmail()"
                            >Resend Email</app-button>
                            <app-button
                              variant="text"
                              size="sm"
                              iconLeft="pi-sync"
                              (clicked)="refreshVerificationStatus()"
                            >I've Verified</app-button>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            } @else if (currentStep() === 1) {
              <!-- Step 2: User Type & Role -->
              <div class="step-content animate-fade-in">
                <div class="step-header">
                  <i class="pi pi-users step-icon"></i>
                  <div>
                    <h3>Your Role</h3>
                    <p class="step-description">
                      Tell us how you'll be using FlagFit Pro
                    </p>
                  </div>
                </div>

                <div class="form-grid">
                  <!-- User Type Selection -->
                  <div class="form-group span-2">
                    <label id="userType-label"
                      >I am a... <span class="required">*</span></label
                    >
                    <div
                      class="user-type-toggle"
                      role="radiogroup"
                      aria-labelledby="userType-label"
                    >
                      @for (type of userTypeOptions; track type.value) {
                        <button
                          type="button"
                          role="radio"
                          class="user-type-option"
                          [class.selected]="
                            onboardingData.userType === type.value
                          "
                          [attr.aria-checked]="
                            onboardingData.userType === type.value
                          "
                          [attr.data-cy]="'user-type-' + type.value"
                          (click)="selectUserType(type.value)"
                          (keydown.enter)="selectUserType(type.value)"
                          (keydown.space)="
                            selectUserType(type.value); $event.preventDefault()
                          "
                        >
                          <span class="type-radio">
                            @if (onboardingData.userType === type.value) {
                              <i class="pi pi-check"></i>
                            }
                          </span>
                          <i [class]="type.icon" class="type-icon"></i>
                          <div class="type-content">
                            <span class="type-label">{{ type.label }}</span>
                            <span class="type-description">{{
                              type.description
                            }}</span>
                          </div>
                        </button>
                      }
                    </div>
                  </div>

                  <!-- Staff Role Selection (only shown if coaching staff) -->
                  @if (onboardingData.userType === "staff") {
                    <div class="form-group span-2">
                      <label for="onboarding-staffRole"
                        >Staff Role <span class="required">*</span></label
                      >
                      <p-select
                        inputId="onboarding-staffRole"
                        [options]="staffRoleOptions"
                        [(ngModel)]="onboardingData.staffRole"
                        placeholder="Select your role"
                        class="w-full"
                      ></p-select>
                    </div>

                    <!-- Staff Visibility Options -->
                    <div class="form-group span-2">
                      <label id="staffVisibility-label"
                        >App Sections to Access</label
                      >
                      <p class="field-hint">
                        Select which parts of the app you need access to
                      </p>
                      <div
                        class="checkbox-grid staff-visibility"
                        role="group"
                        aria-labelledby="staffVisibility-label"
                      >
                        @for (
                          option of staffVisibilityOptions;
                          track option.value
                        ) {
                          <button
                            type="button"
                            role="checkbox"
                            class="checkbox-card"
                            [class.selected]="
                              onboardingData.staffVisibility.includes(
                                option.value
                              )
                            "
                            [attr.aria-checked]="
                              onboardingData.staffVisibility.includes(
                                option.value
                              )
                            "
                            [attr.data-cy]="'visibility-' + option.value"
                            (click)="toggleStaffVisibility(option.value)"
                            (keydown.enter)="
                              toggleStaffVisibility(option.value)
                            "
                            (keydown.space)="
                              toggleStaffVisibility(option.value);
                              $event.preventDefault()
                            "
                          >
                            <span class="checkbox-indicator">
                              @if (
                                onboardingData.staffVisibility.includes(
                                  option.value
                                )
                              ) {
                                <i class="pi pi-check"></i>
                              }
                            </span>
                            <i [class]="option.icon" class="checkbox-icon"></i>
                            <span class="checkbox-label">{{
                              option.label
                            }}</span>
                          </button>
                        }
                      </div>
                    </div>
                  }

                  <!-- Team Selection (for both players and staff) -->
                  <div class="form-group">
                    <label for="onboarding-team"
                      >Team <span class="required">*</span></label
                    >
                    <p-autoComplete
                      inputId="onboarding-team"
                      [(ngModel)]="onboardingData.team"
                      [suggestions]="teamSuggestions()"
                      (completeMethod)="searchTeams($event)"
                      (onSelect)="onTeamSelect($event)"
                      (onClear)="onboardingData.team = null"
                      placeholder="Search for your team or enter name..."
                      [minLength]="0"
                      [forceSelection]="false"
                      [dropdown]="true"
                      field="label"
                      class="w-full"
                      [inputStyle]="{ width: '100%' }"
                    >
                      <ng-template let-team pTemplate="item">
                        <div class="team-suggestion">
                          <i class="pi pi-users"></i>
                          <span>{{ team.label }}</span>
                        </div>
                      </ng-template>
                    </p-autoComplete>
                    <small class="field-hint"
                      >You can search existing teams or enter a new team
                      name</small
                    >
                  </div>

                  <!-- Player-specific fields -->
                  @if (onboardingData.userType === "player") {
                    <div class="form-group jersey-input">
                      <label for="onboarding-jerseyNumber">Jersey #</label>
                      <input
                        id="onboarding-jerseyNumber"
                        name="jerseyNumber"
                        type="number"
                        pInputText
                        [(ngModel)]="onboardingData.jerseyNumber"
                        placeholder="#"
                        min="0"
                        max="99"
                        class="w-full jersey-field"
                        autocomplete="off"
                      />
                    </div>

                    <div class="form-group">
                      <label for="onboarding-position"
                        >Primary Position <span class="required">*</span></label
                      >
                      <p-select
                        inputId="onboarding-position"
                        [options]="positions"
                        [(ngModel)]="onboardingData.position"
                        placeholder="Select position"
                        class="w-full"
                      ></p-select>
                    </div>

                    <div class="form-group">
                      <label for="onboarding-secondaryPosition"
                        >Secondary Position</label
                      >
                      <p-select
                        inputId="onboarding-secondaryPosition"
                        [options]="positions"
                        [(ngModel)]="onboardingData.secondaryPosition"
                        placeholder="Optional"
                        [showClear]="true"
                        class="w-full"
                      ></p-select>
                    </div>

                    @if (isQBSelected()) {
                      <div class="form-group span-2">
                        <label id="throwingArm-label"
                          >Throwing Arm <span class="required">*</span></label
                        >
                        <div
                          class="arm-toggle"
                          role="radiogroup"
                          aria-labelledby="throwingArm-label"
                        >
                          @for (arm of throwingArmOptions; track arm.value) {
                            <button
                              type="button"
                              role="radio"
                              class="arm-option"
                              [class.selected]="
                                onboardingData.throwingArm === arm.value
                              "
                              [attr.aria-checked]="
                                onboardingData.throwingArm === arm.value
                              "
                              [attr.data-cy]="'throwing-arm-' + arm.value"
                              (click)="onboardingData.throwingArm = arm.value"
                              (keydown.enter)="
                                onboardingData.throwingArm = arm.value
                              "
                              (keydown.space)="
                                onboardingData.throwingArm = arm.value;
                                $event.preventDefault()
                              "
                            >
                              <span class="arm-radio">
                                @if (onboardingData.throwingArm === arm.value) {
                                  <i class="pi pi-check"></i>
                                }
                              </span>
                              <span class="arm-label">{{ arm.label }}</span>
                            </button>
                          }
                        </div>
                      </div>
                    }

                    <div class="form-group span-2">
                      <label for="onboarding-experience"
                        >Experience Level <span class="required">*</span></label
                      >
                      <p-select
                        inputId="onboarding-experience"
                        [options]="experienceLevels"
                        [(ngModel)]="onboardingData.experience"
                        placeholder="Select your experience"
                        class="w-full"
                      ></p-select>
                    </div>
                  }
                </div>
              </div>
            } @else if (currentStep() === 2 && isPlayer()) {
              <!-- Step 3: Physical Measurements (Players only) -->
              <div class="step-content animate-fade-in">
                <div class="step-header">
                  <i class="pi pi-heart step-icon"></i>
                  <div>
                    <h3>Physical Measurements</h3>
                    <p class="step-description">
                      Used for load calculations and benchmarks
                    </p>
                  </div>
                </div>

                <div class="form-group">
                  <label id="unit-system-label">Preferred Units</label>
                  <div
                    class="unit-toggle"
                    role="radiogroup"
                    aria-labelledby="unit-system-label"
                  >
                    <button
                      type="button"
                      role="radio"
                      class="unit-option"
                      [class.selected]="onboardingData.unitSystem === 'metric'"
                      [attr.aria-checked]="
                        onboardingData.unitSystem === 'metric'
                      "
                      data-cy="unit-metric"
                      (click)="onboardingData.unitSystem = 'metric'"
                      (keydown.enter)="onboardingData.unitSystem = 'metric'"
                      (keydown.space)="
                        onboardingData.unitSystem = 'metric';
                        $event.preventDefault()
                      "
                    >
                      <span class="unit-radio">
                        @if (onboardingData.unitSystem === "metric") {
                          <i class="pi pi-check"></i>
                        }
                      </span>
                      <span class="unit-content">
                        <i class="pi pi-globe"></i>
                        <span>Metric</span>
                        <small>cm / kg</small>
                      </span>
                    </button>
                    <button
                      type="button"
                      role="radio"
                      class="unit-option"
                      [class.selected]="
                        onboardingData.unitSystem === 'imperial'
                      "
                      [attr.aria-checked]="
                        onboardingData.unitSystem === 'imperial'
                      "
                      data-cy="unit-imperial"
                      (click)="onboardingData.unitSystem = 'imperial'"
                      (keydown.enter)="onboardingData.unitSystem = 'imperial'"
                      (keydown.space)="
                        onboardingData.unitSystem = 'imperial';
                        $event.preventDefault()
                      "
                    >
                      <span class="unit-radio">
                        @if (onboardingData.unitSystem === "imperial") {
                          <i class="pi pi-check"></i>
                        }
                      </span>
                      <span class="unit-content">
                        <i class="pi pi-flag"></i>
                        <span>Imperial</span>
                        <small>ft-in / lbs</small>
                      </span>
                    </button>
                  </div>
                </div>

                @if (onboardingData.unitSystem === "metric") {
                  <div class="form-grid">
                    <div class="form-group">
                      <label for="onboarding-height"
                        >Height (cm) <span class="required">*</span></label
                      >
                      <input
                        id="onboarding-height"
                        name="height"
                        type="number"
                        pInputText
                        [(ngModel)]="onboardingData.heightCm"
                        placeholder="e.g. 180"
                        min="100"
                        max="250"
                        class="w-full"
                        autocomplete="off"
                      />
                    </div>
                    <div class="form-group">
                      <label for="onboarding-weight"
                        >Weight (kg) <span class="required">*</span></label
                      >
                      <input
                        id="onboarding-weight"
                        name="weight"
                        type="number"
                        pInputText
                        [(ngModel)]="onboardingData.weightKg"
                        placeholder="e.g. 75"
                        min="30"
                        max="200"
                        class="w-full"
                        autocomplete="off"
                      />
                    </div>
                  </div>
                } @else {
                  <div class="form-grid imperial-grid">
                    <div class="form-group">
                      <label for="onboarding-heightFt">Height (ft)</label>
                      <input
                        id="onboarding-heightFt"
                        name="heightFt"
                        type="number"
                        pInputText
                        [(ngModel)]="onboardingData.heightFt"
                        placeholder="5"
                        min="3"
                        max="8"
                        class="w-full"
                        autocomplete="off"
                      />
                    </div>
                    <div class="form-group">
                      <label for="onboarding-heightIn">Inches</label>
                      <input
                        id="onboarding-heightIn"
                        name="heightIn"
                        type="number"
                        pInputText
                        [(ngModel)]="onboardingData.heightIn"
                        placeholder="10"
                        min="0"
                        max="11"
                        class="w-full"
                        autocomplete="off"
                      />
                    </div>
                    <div class="form-group">
                      <label for="onboarding-weightLbs"
                        >Weight (lbs) <span class="required">*</span></label
                      >
                      <input
                        id="onboarding-weightLbs"
                        name="weightLbs"
                        type="number"
                        pInputText
                        [(ngModel)]="onboardingData.weightLbs"
                        placeholder="e.g. 165"
                        min="66"
                        max="440"
                        class="w-full"
                        autocomplete="off"
                      />
                    </div>
                  </div>
                }

                <div class="info-box">
                  <i class="pi pi-info-circle"></i>
                  <span
                    >Your measurements help us calculate appropriate training
                    loads and provide position-specific benchmarks.</span
                  >
                </div>
              </div>
            } @else if (currentStep() === 3 && isPlayer()) {
              <!-- Step 4: Health & Injuries (Players only) -->
              <div class="step-content animate-fade-in">
                <div class="step-header">
                  <i class="pi pi-shield step-icon"></i>
                  <div>
                    <h3>Health & Injury History</h3>
                    <p class="step-description">
                      Helps us avoid recommending harmful exercises
                    </p>
                  </div>
                </div>

                <div class="form-group">
                  <label>Current Injuries or Pain Areas</label>
                  <p class="field-hint">
                    Add any areas where you're currently experiencing pain or
                    recovering from injury
                  </p>

                  <div class="injury-input-row">
                    <p-select
                      [options]="injuryAreas"
                      [(ngModel)]="newInjury.area"
                      placeholder="Select area"
                      class="injury-area-select"
                    ></p-select>
                    <p-select
                      [options]="[
                        { label: 'Minor', value: 'minor' },
                        { label: 'Moderate', value: 'moderate' },
                        { label: 'Severe', value: 'severe' },
                      ]"
                      [(ngModel)]="newInjury.severity"
                      placeholder="Severity"
                      class="injury-severity-select"
                    ></p-select>
                    <app-icon-button
                      icon="pi-plus"
                      [disabled]="!newInjury.area"
                      (clicked)="addCurrentInjury()"
                      ariaLabel="plus"
                    />
                  </div>

                  @if (onboardingData.currentInjuries.length > 0) {
                    <div class="injury-list">
                      @for (
                        injury of onboardingData.currentInjuries;
                        track $index
                      ) {
                        <div
                          class="injury-chip"
                          [class]="'severity-' + injury.severity"
                        >
                          <span>{{ injury.area }} ({{ injury.severity }})</span>
                          <i
                            class="pi pi-times"
                            (click)="removeCurrentInjury($index)"
                          ></i>
                        </div>
                      }
                    </div>
                  }
                </div>

                <div class="form-group">
                  <label id="injury-history-label">Injury History</label>
                  <p class="field-hint">
                    Select any significant past injuries (select all that apply)
                  </p>
                  <div
                    class="checkbox-grid"
                    role="group"
                    aria-labelledby="injury-history-label"
                  >
                    @for (injury of injuryHistoryOptions; track injury.value) {
                      <button
                        type="button"
                        role="checkbox"
                        class="checkbox-card"
                        [class.selected]="
                          onboardingData.injuryHistory.includes(injury.value)
                        "
                        [class.none-selected]="injury.value === 'none'"
                        [attr.aria-checked]="
                          onboardingData.injuryHistory.includes(injury.value)
                        "
                        [attr.data-cy]="'injury-' + injury.value"
                        (click)="toggleInjuryHistory(injury.value)"
                        (keydown.enter)="toggleInjuryHistory(injury.value)"
                        (keydown.space)="
                          toggleInjuryHistory(injury.value);
                          $event.preventDefault()
                        "
                      >
                        <span class="checkbox-indicator">
                          @if (
                            onboardingData.injuryHistory.includes(injury.value)
                          ) {
                            <i class="pi pi-check"></i>
                          }
                        </span>
                        <i [class]="injury.icon" class="checkbox-icon"></i>
                        <span class="checkbox-label">{{ injury.label }}</span>
                      </button>
                    }
                  </div>
                </div>

                <div class="form-group">
                  <label for="medicalNotes"
                    >Additional Medical Notes <small>(optional)</small></label
                  >
                  <textarea
                    id="medicalNotes"
                    pInputText
                    [(ngModel)]="onboardingData.medicalNotes"
                    placeholder="Any other health conditions, allergies, or notes..."
                    rows="3"
                    class="w-full"
                  ></textarea>
                </div>
              </div>
            } @else if (currentStep() === 4 && isPlayer()) {
              <!-- Step 5: Equipment (Players only) -->
              <div class="step-content animate-fade-in">
                <div class="step-header">
                  <i class="pi pi-box step-icon"></i>
                  <div>
                    <h3>Available Equipment</h3>
                    <p class="step-description">
                      What do you have access to for training?
                    </p>
                  </div>
                </div>

                <div
                  class="equipment-grid"
                  role="group"
                  aria-label="Available equipment"
                >
                  @for (item of equipmentOptions; track item.value) {
                    <button
                      type="button"
                      role="checkbox"
                      class="equipment-card"
                      [class.selected]="
                        onboardingData.equipmentAvailable.includes(item.value)
                      "
                      [class.none-card]="item.value === 'none'"
                      [attr.aria-checked]="
                        onboardingData.equipmentAvailable.includes(item.value)
                      "
                      [attr.data-cy]="'equipment-' + item.value"
                      (click)="toggleEquipment(item.value)"
                      (keydown.enter)="toggleEquipment(item.value)"
                      (keydown.space)="
                        toggleEquipment(item.value); $event.preventDefault()
                      "
                    >
                      <span class="equipment-check">
                        @if (
                          onboardingData.equipmentAvailable.includes(item.value)
                        ) {
                          <i class="pi pi-check"></i>
                        }
                      </span>
                      <i [class]="item.icon" class="equipment-icon"></i>
                      <span class="equipment-label">{{ item.label }}</span>
                    </button>
                  }
                </div>

                <div class="info-box success">
                  <i class="pi pi-lightbulb"></i>
                  <span
                    >We'll recommend exercises based on what you have available.
                    Bodyweight exercises are always an option!</span
                  >
                </div>
              </div>
            } @else if (currentStep() === 5 && isPlayer()) {
              <!-- Step 6: Goals (Players only) -->
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
                      [class.selected]="onboardingData.goals.includes(goal.id)"
                      [attr.aria-checked]="
                        onboardingData.goals.includes(goal.id)
                      "
                      [attr.data-cy]="'goal-' + goal.id"
                      (click)="toggleGoal(goal.id)"
                      (keydown.enter)="toggleGoal(goal.id)"
                      (keydown.space)="
                        toggleGoal(goal.id); $event.preventDefault()
                      "
                    >
                      <span class="goal-check">
                        @if (onboardingData.goals.includes(goal.id)) {
                          <i class="pi pi-check"></i>
                        }
                      </span>
                      <i [class]="goal.icon" class="goal-icon"></i>
                      <span class="goal-label">{{ goal.label }}</span>
                    </button>
                  }
                </div>
              </div>
            } @else if (currentStep() === 6 && isPlayer()) {
              <!-- Step 7: Schedule (Players only) -->
              <div class="step-content animate-fade-in">
                <div class="step-header">
                  <i class="pi pi-calendar step-icon"></i>
                  <div>
                    <h3>Your Schedule</h3>
                    <p class="step-description">
                      Help us recommend the best training times
                    </p>
                  </div>
                </div>

                <div class="form-grid">
                  <div class="form-group span-2">
                    <label for="scheduleType"
                      >Work Schedule Type <span class="required">*</span></label
                    >
                    <p-select
                      id="scheduleType"
                      [options]="scheduleTypes"
                      [(ngModel)]="onboardingData.scheduleType"
                      placeholder="Select your schedule type"
                      class="w-full"
                    ></p-select>
                  </div>

                  <div class="form-group span-2">
                    <label for="practicesPerWeek"
                      >Team Practices Per Week</label
                    >
                    <p-select
                      id="practicesPerWeek"
                      [options]="practiceFrequencies"
                      [(ngModel)]="onboardingData.practicesPerWeek"
                      placeholder="How many team practices?"
                      class="w-full"
                    ></p-select>
                  </div>

                  <div class="form-group span-2">
                    <label id="practice-days-label">Practice Days</label>
                    <div
                      class="days-grid"
                      role="group"
                      aria-labelledby="practice-days-label"
                    >
                      @for (day of weekDays; track day.value) {
                        <button
                          type="button"
                          role="checkbox"
                          class="day-chip"
                          [class.selected]="
                            onboardingData.practiceDays.includes(day.value)
                          "
                          [attr.aria-checked]="
                            onboardingData.practiceDays.includes(day.value)
                          "
                          [attr.aria-label]="day.value"
                          [attr.data-cy]="'day-' + day.value.toLowerCase()"
                          (click)="togglePracticeDay(day.value)"
                          (keydown.enter)="togglePracticeDay(day.value)"
                          (keydown.space)="
                            togglePracticeDay(day.value);
                            $event.preventDefault()
                          "
                        >
                          <span class="day-label">{{ day.label }}</span>
                          @if (
                            onboardingData.practiceDays.includes(day.value)
                          ) {
                            <span class="day-check"
                              ><i class="pi pi-check"></i
                            ></span>
                          }
                        </button>
                      }
                    </div>
                  </div>
                </div>
              </div>
            } @else if (currentStep() === 7 && isPlayer()) {
              <!-- Step 8: Mobility & Recovery (Players only) -->
              <div class="step-content animate-fade-in">
                <div class="step-header">
                  <i class="pi pi-refresh step-icon"></i>
                  <div>
                    <h3>Mobility & Recovery</h3>
                    <p class="step-description">
                      Set up your daily recovery routine
                    </p>
                  </div>
                </div>

                <div class="form-group">
                  <label id="morning-mobility-label"
                    >Morning Mobility
                    <small>(10 min wake-up routine)</small></label
                  >
                  <div
                    class="preference-options compact"
                    role="radiogroup"
                    aria-labelledby="morning-mobility-label"
                  >
                    @for (option of mobilityTimeOptions; track option.value) {
                      <button
                        type="button"
                        role="radio"
                        class="preference-card"
                        [class.selected]="
                          onboardingData.morningMobility === option.value
                        "
                        [attr.aria-checked]="
                          onboardingData.morningMobility === option.value
                        "
                        [attr.data-cy]="'morning-mobility-' + option.value"
                        (click)="onboardingData.morningMobility = option.value"
                        (keydown.enter)="
                          onboardingData.morningMobility = option.value
                        "
                        (keydown.space)="
                          onboardingData.morningMobility = option.value;
                          $event.preventDefault()
                        "
                      >
                        <span class="preference-radio">
                          @if (
                            onboardingData.morningMobility === option.value
                          ) {
                            <i class="pi pi-check"></i>
                          }
                        </span>
                        <i [class]="option.icon" class="preference-icon"></i>
                        <span class="preference-label">{{ option.label }}</span>
                      </button>
                    }
                  </div>
                </div>

                <div class="form-group">
                  <label id="evening-mobility-label"
                    >Evening Mobility <small>(15 min before bed)</small></label
                  >
                  <div
                    class="preference-options compact"
                    role="radiogroup"
                    aria-labelledby="evening-mobility-label"
                  >
                    @for (option of mobilityTimeOptions; track option.value) {
                      <button
                        type="button"
                        role="radio"
                        class="preference-card"
                        [class.selected]="
                          onboardingData.eveningMobility === option.value
                        "
                        [attr.aria-checked]="
                          onboardingData.eveningMobility === option.value
                        "
                        [attr.data-cy]="'evening-mobility-' + option.value"
                        (click)="onboardingData.eveningMobility = option.value"
                        (keydown.enter)="
                          onboardingData.eveningMobility = option.value
                        "
                        (keydown.space)="
                          onboardingData.eveningMobility = option.value;
                          $event.preventDefault()
                        "
                      >
                        <span class="preference-radio">
                          @if (
                            onboardingData.eveningMobility === option.value
                          ) {
                            <i class="pi pi-check"></i>
                          }
                        </span>
                        <i [class]="option.icon" class="preference-icon"></i>
                        <span class="preference-label">{{ option.label }}</span>
                      </button>
                    }
                  </div>
                </div>

                <div class="form-group">
                  <label id="foam-rolling-label">Foam Rolling Preference</label>
                  <div
                    class="preference-options compact"
                    role="radiogroup"
                    aria-labelledby="foam-rolling-label"
                  >
                    @for (option of foamRollingOptions; track option.value) {
                      <button
                        type="button"
                        role="radio"
                        class="preference-card"
                        [class.selected]="
                          onboardingData.foamRollingTime === option.value
                        "
                        [attr.aria-checked]="
                          onboardingData.foamRollingTime === option.value
                        "
                        [attr.data-cy]="'foam-rolling-' + option.value"
                        (click)="onboardingData.foamRollingTime = option.value"
                        (keydown.enter)="
                          onboardingData.foamRollingTime = option.value
                        "
                        (keydown.space)="
                          onboardingData.foamRollingTime = option.value;
                          $event.preventDefault()
                        "
                      >
                        <span class="preference-radio">
                          @if (
                            onboardingData.foamRollingTime === option.value
                          ) {
                            <i class="pi pi-check"></i>
                          }
                        </span>
                        <i [class]="option.icon" class="preference-icon"></i>
                        <span class="preference-label">{{ option.label }}</span>
                      </button>
                    }
                  </div>
                </div>

                <div class="form-group">
                  <label id="rest-day-label">Rest Day Recovery</label>
                  <div
                    class="preference-options"
                    role="radiogroup"
                    aria-labelledby="rest-day-label"
                  >
                    @for (option of restDayOptions; track option.value) {
                      <button
                        type="button"
                        role="radio"
                        class="preference-card with-description"
                        [class.selected]="
                          onboardingData.restDayPreference === option.value
                        "
                        [attr.aria-checked]="
                          onboardingData.restDayPreference === option.value
                        "
                        [attr.data-cy]="'rest-day-' + option.value"
                        (click)="
                          onboardingData.restDayPreference = option.value
                        "
                        (keydown.enter)="
                          onboardingData.restDayPreference = option.value
                        "
                        (keydown.space)="
                          onboardingData.restDayPreference = option.value;
                          $event.preventDefault()
                        "
                      >
                        <span class="preference-radio">
                          @if (
                            onboardingData.restDayPreference === option.value
                          ) {
                            <i class="pi pi-check"></i>
                          }
                        </span>
                        <div class="preference-content">
                          <i [class]="option.icon" class="preference-icon"></i>
                          <span class="preference-label">{{
                            option.label
                          }}</span>
                          <span class="preference-desc">{{
                            option.description
                          }}</span>
                        </div>
                      </button>
                    }
                  </div>
                </div>
              </div>
            } @else if (isSummaryStep()) {
              <!-- Summary Step (varies by user type) -->
              <div class="step-content animate-fade-in">
                <div class="step-header">
                  <i class="pi pi-check-circle step-icon success"></i>
                  <div>
                    <h3>You're All Set!</h3>
                    <p class="step-description">
                      @if (isStaff()) {
                        Review your profile and get started with your team
                      } @else {
                        Review your profile and start training
                      }
                    </p>
                  </div>
                </div>

                <div class="summary-grid">
                  <!-- Profile Card (shown for both players and staff) -->
                  <div class="summary-card">
                    <h4><i class="pi pi-user"></i> Profile</h4>
                    <div class="summary-content">
                      <div class="summary-row">
                        <span class="label">Name</span>
                        <span class="value">{{
                          onboardingData.name || "Not set"
                        }}</span>
                      </div>
                      <div class="summary-row">
                        <span class="label">Age</span>
                        <span class="value"
                          >{{ calculatedAge() || "?" }} years ({{
                            getAgeGroup()
                          }})</span
                        >
                      </div>
                      <div class="summary-row">
                        <span class="label">Gender</span>
                        <span class="value">{{
                          getGenderLabel(onboardingData.gender)
                        }}</span>
                      </div>
                      <div class="summary-row">
                        <span class="label">Country</span>
                        <span class="value">{{
                          onboardingData.country || "Not selected"
                        }}</span>
                      </div>
                    </div>
                  </div>

                  @if (isStaff()) {
                    <!-- Staff Role Card (staff only) -->
                    <div class="summary-card">
                      <h4><i class="pi pi-briefcase"></i> Role</h4>
                      <div class="summary-content">
                        <div class="summary-row">
                          <span class="label">Team</span>
                          <span class="value">{{
                            getTeamLabel(onboardingData.team)
                          }}</span>
                        </div>
                        <div class="summary-row">
                          <span class="label">Staff Role</span>
                          <span class="value">{{
                            getStaffRoleLabel(onboardingData.staffRole)
                          }}</span>
                        </div>
                        <div class="summary-row">
                          <span class="label">App Access</span>
                          <span class="value">{{
                            onboardingData.staffVisibility.length
                          }} section(s)</span>
                        </div>
                      </div>
                    </div>
                  }

                  @if (isPlayer()) {
                    <!-- Team Card (players only) -->
                    <div class="summary-card">
                      <h4><i class="pi pi-users"></i> Team</h4>
                      <div class="summary-content">
                        <div class="summary-row">
                          <span class="label">Team</span>
                          <span class="value">{{
                            getTeamLabel(onboardingData.team)
                          }}</span>
                        </div>
                        <div class="summary-row">
                          <span class="label">Jersey</span>
                          <span class="value jersey-badge"
                            >#{{ onboardingData.jerseyNumber || "?" }}</span
                          >
                        </div>
                        <div class="summary-row">
                          <span class="label">Position</span>
                          <span class="value">{{
                            getPositionLabel(onboardingData.position)
                          }}</span>
                        </div>
                        @if (isQBSelected()) {
                          <div class="summary-row">
                            <span class="label">Throwing Arm</span>
                            <span class="value">{{
                              getThrowingArmLabel(onboardingData.throwingArm)
                            }}</span>
                          </div>
                        }
                      </div>
                    </div>

                    <!-- Physical Card (players only) -->
                    <div class="summary-card">
                      <h4><i class="pi pi-heart"></i> Physical</h4>
                      <div class="summary-content">
                        <div class="summary-row">
                          <span class="label">Height</span>
                          <span class="value">{{ getHeightDisplay() }}</span>
                        </div>
                        <div class="summary-row">
                          <span class="label">Weight</span>
                          <span class="value">{{ getWeightDisplay() }}</span>
                        </div>
                        <div class="summary-row">
                          <span class="label">Experience</span>
                          <span class="value">{{
                            getExperienceLabel(onboardingData.experience)
                          }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Health Card (players only) -->
                    <div class="summary-card">
                      <h4><i class="pi pi-shield"></i> Health</h4>
                      <div class="summary-content">
                        <div class="summary-row">
                          <span class="label">Current Injuries</span>
                          <span class="value">
                            @if (onboardingData.currentInjuries.length === 0) {
                              None 👍
                            } @else {
                              {{ onboardingData.currentInjuries.length }} area(s)
                            }
                          </span>
                        </div>
                        <div class="summary-row">
                          <span class="label">Injury History</span>
                          <span class="value">
                            @if (
                              onboardingData.injuryHistory.includes("none") ||
                              onboardingData.injuryHistory.length === 0
                            ) {
                              None 👍
                            } @else {
                              {{ onboardingData.injuryHistory.length }} past
                              injury(s)
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- Schedule Card (players only) -->
                    <div class="summary-card">
                      <h4><i class="pi pi-calendar"></i> Schedule</h4>
                      <div class="summary-content">
                        <div class="summary-row">
                          <span class="label">Schedule Type</span>
                          <span class="value">{{
                            getScheduleLabel(onboardingData.scheduleType)
                          }}</span>
                        </div>
                        <div class="summary-row">
                          <span class="label">Practices/Week</span>
                          <span class="value">{{
                            onboardingData.practicesPerWeek || 0
                          }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Recovery Card (players only) -->
                    <div class="summary-card">
                      <h4><i class="pi pi-refresh"></i> Recovery</h4>
                      <div class="summary-content">
                        <div class="summary-row">
                          <span class="label">Morning Mobility</span>
                          <span class="value">{{
                            getMobilityLabel(onboardingData.morningMobility)
                          }}</span>
                        </div>
                        <div class="summary-row">
                          <span class="label">Foam Rolling</span>
                          <span class="value">{{
                            getFoamRollingLabel(onboardingData.foamRollingTime)
                          }}</span>
                        </div>
                        <div class="summary-row">
                          <span class="label">Rest Days</span>
                          <span class="value">{{
                            getRestDayOptionLabel(
                              onboardingData.restDayPreference
                            )
                          }}</span>
                        </div>
                      </div>
                    </div>
                  }
                </div>

                <!-- Consent Section -->
                <div class="consent-section">
                  <h4 class="consent-title">
                    <i class="pi pi-shield"></i> Review & Consent
                  </h4>
                  <p class="consent-description">
                    Please review and accept the following to complete your
                    setup:
                  </p>

                  <div class="consent-list">
                    <!-- Required Consents -->
                    <div class="consent-item required">
                      <div class="consent-checkbox-wrapper">
                        <p-checkbox
                          [(ngModel)]="onboardingData.consentTermsOfService"
                          [binary]="true"
                          variant="filled"
                          inputId="consent-terms"
                          name="consentTermsOfService"
                          (onChange)="
                            onConsentChange('Terms of Service', $event)
                          "
                        />
                        <label for="consent-terms" class="consent-label">
                          I accept the
                          <a
                            [routerLink]="['/terms']"
                            target="_blank"
                            class="consent-link"
                            (click)="$event.stopPropagation()"
                            >Terms of Service</a
                          >
                          <span class="required-indicator">*</span>
                        </label>
                      </div>
                    </div>

                    <div class="consent-item required">
                      <div class="consent-checkbox-wrapper">
                        <p-checkbox
                          [(ngModel)]="onboardingData.consentPrivacyPolicy"
                          [binary]="true"
                          variant="filled"
                          inputId="consent-privacy"
                          name="consentPrivacyPolicy"
                          (onChange)="onConsentChange('Privacy Policy', $event)"
                        />
                        <label for="consent-privacy" class="consent-label">
                          I accept the
                          <a
                            [routerLink]="['/privacy']"
                            target="_blank"
                            class="consent-link"
                            (click)="$event.stopPropagation()"
                            >Privacy Policy</a
                          >
                          <span class="required-indicator">*</span>
                        </label>
                      </div>
                    </div>

                    <div class="consent-item required">
                      <div class="consent-checkbox-wrapper">
                        <p-checkbox
                          [(ngModel)]="onboardingData.consentDataUsage"
                          [binary]="true"
                          variant="filled"
                          inputId="consent-data"
                          name="consentDataUsage"
                          (onChange)="onConsentChange('Data Usage', $event)"
                        />
                        <label for="consent-data" class="consent-label">
                          I consent to my data being used to personalize my
                          training experience
                          <span class="consent-hint"
                            >(required for app functionality)</span
                          >
                          <span class="required-indicator">*</span>
                        </label>
                      </div>
                    </div>

                    <!-- Optional Consents -->
                    <div class="consent-item optional">
                      <div class="consent-checkbox-wrapper">
                        <p-checkbox
                          [(ngModel)]="onboardingData.consentAICoach"
                          [binary]="true"
                          variant="filled"
                          inputId="consent-ai"
                          name="consentAICoach"
                          (onChange)="onConsentChange('AI Coach', $event)"
                        />
                        <label for="consent-ai" class="consent-label">
                          I consent to AI Coach (Merlin) providing personalized
                          advice based on my training and wellness data
                          <span class="consent-hint">(optional)</span>
                        </label>
                      </div>
                    </div>

                    <div class="consent-item optional">
                      <div class="consent-checkbox-wrapper">
                        <p-checkbox
                          [(ngModel)]="onboardingData.consentEmailUpdates"
                          [binary]="true"
                          variant="filled"
                          inputId="consent-email"
                          name="consentEmailUpdates"
                          (onChange)="onConsentChange('Email Updates', $event)"
                        />
                        <label for="consent-email" class="consent-label">
                          I want to receive email updates about new features and
                          tips
                          <span class="consent-hint">(optional)</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  @if (
                    !onboardingData.consentTermsOfService ||
                    !onboardingData.consentPrivacyPolicy ||
                    !onboardingData.consentDataUsage
                  ) {
                    <div class="consent-error">
                      <i class="pi pi-exclamation-triangle"></i>
                      <span
                        >Please accept all required consents to continue</span
                      >
                    </div>
                  }
                </div>

                <div class="summary-note success">
                  <i class="pi pi-check-circle"></i>
                  @if (isStaff()) {
                    <span
                      >You're ready to manage your team! You can update your
                      settings anytime in your profile.</span
                    >
                  } @else {
                    <span
                      >Your personalized training plan is ready! You can update
                      these settings anytime in your profile.</span
                    >
                  }
                </div>
              </div>
            }

            <div class="onboarding-actions">
              @if (currentStep() > 0) {
                <app-button
                  variant="outlined"
                  iconLeft="pi-arrow-left"
                  (clicked)="previousStep()"
                  >Back</app-button
                >
              }
              @if (currentStep() < steps().length - 1) {
                <app-button iconLeft="pi-arrow-right" (clicked)="nextStep()"
                  >Next</app-button
                >
              } @else {
                <app-button
                  iconLeft="pi-check"
                  [loading]="isCompleting()"
                  [disabled]="!canCompleteOnboarding()"
                  (clicked)="completeOnboarding()"
                  >Complete Setup</app-button
                >
              }
            </div>
          </div>
        </p-card>
      </div>
    </app-main-layout>
  `,
  styleUrls: ["./onboarding.component.scss"],
})
export class OnboardingComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private toastService = inject(ToastService);
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);
  private playerProgramService = inject(PlayerProgramService);

  currentStep = signal(0);
  isCompleting = signal(false);
  isLoading = signal(true);
  lastSaved = signal<Date | null>(null);
  isSaving = signal(false);
  isEmailVerified = signal(false);
  isResendingVerification = signal(false);

  // Auto-save subject
  private autoSaveSubject = new Subject<void>();
  private autoSaveSubscription: Subscription | null = null;
  private readonly STORAGE_KEY = "flagfit_onboarding_draft";

  // Team options - loaded from database with fallback
  teams = signal<Array<{ label: string; value: string }>>([
    {
      label: "Ljubljana Frogs - International",
      value: "ljubljana_frogs_international",
    },
    { label: "Ljubljana Frogs - Domestic", value: "ljubljana_frogs_domestic" },
    {
      label: "American Samoa National Team - Men",
      value: "american_samoa_men",
    },
    {
      label: "American Samoa National Team - Women",
      value: "american_samoa_women",
    },
  ]);
  teamSuggestions = signal<Array<{ label: string; value: string }>>([]);
  teamSearchQuery = signal<string>("");

  // Position options - updated for flag football
  positions = [
    { label: "Quarterback (QB)", value: "QB" },
    { label: "Wide Receiver (WR)", value: "WR" },
    { label: "Center", value: "Center" },
    { label: "Defensive Back (DB)", value: "DB" },
    { label: "Rusher / Blitzer", value: "Rusher" },
    { label: "Linebacker (LB)", value: "LB" },
    { label: "Hybrid (Multiple Positions)", value: "Hybrid" },
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
    { label: "Beginner (0-1 years)", value: "beginner" },
    { label: "Intermediate (1-3 years)", value: "intermediate" },
    { label: "Advanced (3-5 years)", value: "advanced" },
    { label: "Professional (5+ years)", value: "professional" },
  ];

  // Schedule types based on work schedule
  scheduleTypes = [
    { label: "Early Bird - Work starts ~6am", value: "early_bird" },
    { label: "Standard - Work starts ~9am", value: "standard" },
    { label: "Late Starter - Work starts afternoon", value: "late_starter" },
    { label: "Shift Worker - Variable shifts", value: "shift_worker" },
    { label: "Student - Flexible schedule", value: "student" },
    { label: "Remote Worker - Work from home", value: "remote_worker" },
  ];

  practiceFrequencies = [
    { label: "1 practice per week", value: 1 },
    { label: "2 practices per week", value: 2 },
    { label: "3 practices per week", value: 3 },
    { label: "4+ practices per week", value: 4 },
  ];

  weekDays = [
    { label: "Mon", value: "Monday" },
    { label: "Tue", value: "Tuesday" },
    { label: "Wed", value: "Wednesday" },
    { label: "Thu", value: "Thursday" },
    { label: "Fri", value: "Friday" },
    { label: "Sat", value: "Saturday" },
    { label: "Sun", value: "Sunday" },
  ];

  // Mobility time preferences
  mobilityTimeOptions = [
    {
      label: "Every Day",
      value: "daily",
      icon: "pi pi-check-circle",
      description: "Recommended for best results",
    },
    {
      label: "Most Days",
      value: "most_days",
      icon: "pi pi-clock",
      description: "5-6 days per week",
    },
    {
      label: "When I Can",
      value: "flexible",
      icon: "pi pi-calendar",
      description: "Flexible schedule",
    },
    {
      label: "Skip This",
      value: "skip",
      icon: "pi pi-times",
      description: "Not for me right now",
    },
  ];

  // Foam rolling preferences
  foamRollingOptions = [
    {
      label: "After Practice",
      value: "after_practice",
      icon: "pi pi-flag",
      description: "Best for recovery",
    },
    {
      label: "Before Bed",
      value: "before_bed",
      icon: "pi pi-moon",
      description: "Helps with sleep",
    },
    {
      label: "Both",
      value: "both",
      icon: "pi pi-check-circle",
      description: "Maximum recovery",
    },
    {
      label: "When Sore",
      value: "when_needed",
      icon: "pi pi-exclamation-circle",
      description: "As needed basis",
    },
  ];

  // Rest day preferences
  restDayOptions = [
    {
      label: "Full Recovery",
      value: "full",
      icon: "pi pi-heart",
      description: "Stretching + Foam Rolling (35 min)",
    },
    {
      label: "Light Stretching",
      value: "light",
      icon: "pi pi-minus",
      description: "Just stretching (20 min)",
    },
    {
      label: "Active Recovery",
      value: "active",
      icon: "pi pi-refresh",
      description: "Morning + Stretching + Evening (45 min)",
    },
    {
      label: "Complete Rest",
      value: "none",
      icon: "pi pi-stop",
      description: "No structured routine",
    },
  ];

  // Gender options
  genderOptions = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Other", value: "other" },
    { label: "Prefer not to say", value: "undisclosed" },
  ];

  // Country options - comprehensive list with common flag football countries first
  countryOptions = [
    // Popular flag football countries first
    { label: "🇺🇸 United States", value: "United States" },
    { label: "🇲🇽 Mexico", value: "Mexico" },
    { label: "🇨🇦 Canada", value: "Canada" },
    { label: "🇩🇪 Germany", value: "Germany" },
    { label: "🇦🇹 Austria", value: "Austria" },
    { label: "🇮🇹 Italy", value: "Italy" },
    { label: "🇫🇷 France", value: "France" },
    { label: "🇬🇧 United Kingdom", value: "United Kingdom" },
    { label: "🇪🇸 Spain", value: "Spain" },
    { label: "🇯🇵 Japan", value: "Japan" },
    { label: "🇧🇷 Brazil", value: "Brazil" },
    { label: "🇵🇱 Poland", value: "Poland" },
    { label: "🇸🇮 Slovenia", value: "Slovenia" },
    { label: "🇭🇷 Croatia", value: "Croatia" },
    { label: "🇷🇸 Serbia", value: "Serbia" },
    { label: "🇭🇺 Hungary", value: "Hungary" },
    { label: "🇨🇿 Czech Republic", value: "Czech Republic" },
    { label: "🇸🇰 Slovakia", value: "Slovakia" },
    { label: "🇩🇰 Denmark", value: "Denmark" },
    { label: "🇸🇪 Sweden", value: "Sweden" },
    { label: "🇳🇴 Norway", value: "Norway" },
    { label: "🇫🇮 Finland", value: "Finland" },
    { label: "🇳🇱 Netherlands", value: "Netherlands" },
    { label: "🇧🇪 Belgium", value: "Belgium" },
    { label: "🇨🇭 Switzerland", value: "Switzerland" },
    { label: "🇵🇹 Portugal", value: "Portugal" },
    { label: "🇬🇷 Greece", value: "Greece" },
    { label: "🇮🇱 Israel", value: "Israel" },
    { label: "🇦🇺 Australia", value: "Australia" },
    { label: "🇳🇿 New Zealand", value: "New Zealand" },
    { label: "🇰🇷 South Korea", value: "South Korea" },
    { label: "🇨🇳 China", value: "China" },
    { label: "🇵🇭 Philippines", value: "Philippines" },
    { label: "🇮🇳 India", value: "India" },
    { label: "🇦🇷 Argentina", value: "Argentina" },
    { label: "🇨🇴 Colombia", value: "Colombia" },
    { label: "🇵🇦 Panama", value: "Panama" },
    { label: "🇬🇹 Guatemala", value: "Guatemala" },
    { label: "🇨🇷 Costa Rica", value: "Costa Rica" },
    { label: "🇵🇷 Puerto Rico", value: "Puerto Rico" },
    { label: "🇦🇸 American Samoa", value: "American Samoa" },
    // Additional countries alphabetically
    { label: "🇦🇫 Afghanistan", value: "Afghanistan" },
    { label: "🇦🇱 Albania", value: "Albania" },
    { label: "🇩🇿 Algeria", value: "Algeria" },
    { label: "🇦🇩 Andorra", value: "Andorra" },
    { label: "🇦🇴 Angola", value: "Angola" },
    { label: "🇦🇲 Armenia", value: "Armenia" },
    { label: "🇦🇿 Azerbaijan", value: "Azerbaijan" },
    { label: "🇧🇸 Bahamas", value: "Bahamas" },
    { label: "🇧🇭 Bahrain", value: "Bahrain" },
    { label: "🇧🇩 Bangladesh", value: "Bangladesh" },
    { label: "🇧🇧 Barbados", value: "Barbados" },
    { label: "🇧🇾 Belarus", value: "Belarus" },
    { label: "🇧🇿 Belize", value: "Belize" },
    { label: "🇧🇯 Benin", value: "Benin" },
    { label: "🇧🇹 Bhutan", value: "Bhutan" },
    { label: "🇧🇴 Bolivia", value: "Bolivia" },
    { label: "🇧🇦 Bosnia and Herzegovina", value: "Bosnia and Herzegovina" },
    { label: "🇧🇼 Botswana", value: "Botswana" },
    { label: "🇧🇳 Brunei", value: "Brunei" },
    { label: "🇧🇬 Bulgaria", value: "Bulgaria" },
    { label: "🇧🇫 Burkina Faso", value: "Burkina Faso" },
    { label: "🇧🇮 Burundi", value: "Burundi" },
    { label: "🇰🇭 Cambodia", value: "Cambodia" },
    { label: "🇨🇲 Cameroon", value: "Cameroon" },
    { label: "🇨🇻 Cape Verde", value: "Cape Verde" },
    { label: "🇨🇫 Central African Republic", value: "Central African Republic" },
    { label: "🇹🇩 Chad", value: "Chad" },
    { label: "🇨🇱 Chile", value: "Chile" },
    { label: "🇨🇺 Cuba", value: "Cuba" },
    { label: "🇨🇾 Cyprus", value: "Cyprus" },
    { label: "🇨🇩 DR Congo", value: "DR Congo" },
    { label: "🇩🇯 Djibouti", value: "Djibouti" },
    { label: "🇩🇲 Dominica", value: "Dominica" },
    { label: "🇩🇴 Dominican Republic", value: "Dominican Republic" },
    { label: "🇪🇨 Ecuador", value: "Ecuador" },
    { label: "🇪🇬 Egypt", value: "Egypt" },
    { label: "🇸🇻 El Salvador", value: "El Salvador" },
    { label: "🇬🇶 Equatorial Guinea", value: "Equatorial Guinea" },
    { label: "🇪🇷 Eritrea", value: "Eritrea" },
    { label: "🇪🇪 Estonia", value: "Estonia" },
    { label: "🇸🇿 Eswatini", value: "Eswatini" },
    { label: "🇪🇹 Ethiopia", value: "Ethiopia" },
    { label: "🇫🇯 Fiji", value: "Fiji" },
    { label: "🇬🇦 Gabon", value: "Gabon" },
    { label: "🇬🇲 Gambia", value: "Gambia" },
    { label: "🇬🇪 Georgia", value: "Georgia" },
    { label: "🇬🇭 Ghana", value: "Ghana" },
    { label: "🇬🇩 Grenada", value: "Grenada" },
    { label: "🇬🇳 Guinea", value: "Guinea" },
    { label: "🇬🇼 Guinea-Bissau", value: "Guinea-Bissau" },
    { label: "🇬🇾 Guyana", value: "Guyana" },
    { label: "🇭🇹 Haiti", value: "Haiti" },
    { label: "🇭🇳 Honduras", value: "Honduras" },
    { label: "🇮🇸 Iceland", value: "Iceland" },
    { label: "🇮🇩 Indonesia", value: "Indonesia" },
    { label: "🇮🇷 Iran", value: "Iran" },
    { label: "🇮🇶 Iraq", value: "Iraq" },
    { label: "🇮🇪 Ireland", value: "Ireland" },
    { label: "🇯🇲 Jamaica", value: "Jamaica" },
    { label: "🇯🇴 Jordan", value: "Jordan" },
    { label: "🇰🇿 Kazakhstan", value: "Kazakhstan" },
    { label: "🇰🇪 Kenya", value: "Kenya" },
    { label: "🇰🇮 Kiribati", value: "Kiribati" },
    { label: "🇽🇰 Kosovo", value: "Kosovo" },
    { label: "🇰🇼 Kuwait", value: "Kuwait" },
    { label: "🇰🇬 Kyrgyzstan", value: "Kyrgyzstan" },
    { label: "🇱🇦 Laos", value: "Laos" },
    { label: "🇱🇻 Latvia", value: "Latvia" },
    { label: "🇱🇧 Lebanon", value: "Lebanon" },
    { label: "🇱🇸 Lesotho", value: "Lesotho" },
    { label: "🇱🇷 Liberia", value: "Liberia" },
    { label: "🇱🇾 Libya", value: "Libya" },
    { label: "🇱🇮 Liechtenstein", value: "Liechtenstein" },
    { label: "🇱🇹 Lithuania", value: "Lithuania" },
    { label: "🇱🇺 Luxembourg", value: "Luxembourg" },
    { label: "🇲🇬 Madagascar", value: "Madagascar" },
    { label: "🇲🇼 Malawi", value: "Malawi" },
    { label: "🇲🇾 Malaysia", value: "Malaysia" },
    { label: "🇲🇻 Maldives", value: "Maldives" },
    { label: "🇲🇱 Mali", value: "Mali" },
    { label: "🇲🇹 Malta", value: "Malta" },
    { label: "🇲🇭 Marshall Islands", value: "Marshall Islands" },
    { label: "🇲🇷 Mauritania", value: "Mauritania" },
    { label: "🇲🇺 Mauritius", value: "Mauritius" },
    { label: "🇫🇲 Micronesia", value: "Micronesia" },
    { label: "🇲🇩 Moldova", value: "Moldova" },
    { label: "🇲🇨 Monaco", value: "Monaco" },
    { label: "🇲🇳 Mongolia", value: "Mongolia" },
    { label: "🇲🇪 Montenegro", value: "Montenegro" },
    { label: "🇲🇦 Morocco", value: "Morocco" },
    { label: "🇲🇿 Mozambique", value: "Mozambique" },
    { label: "🇲🇲 Myanmar", value: "Myanmar" },
    { label: "🇳🇦 Namibia", value: "Namibia" },
    { label: "🇳🇷 Nauru", value: "Nauru" },
    { label: "🇳🇵 Nepal", value: "Nepal" },
    { label: "🇳🇮 Nicaragua", value: "Nicaragua" },
    { label: "🇳🇪 Niger", value: "Niger" },
    { label: "🇳🇬 Nigeria", value: "Nigeria" },
    { label: "🇰🇵 North Korea", value: "North Korea" },
    { label: "🇲🇰 North Macedonia", value: "North Macedonia" },
    { label: "🇴🇲 Oman", value: "Oman" },
    { label: "🇵🇰 Pakistan", value: "Pakistan" },
    { label: "🇵🇼 Palau", value: "Palau" },
    { label: "🇵🇸 Palestine", value: "Palestine" },
    { label: "🇵🇬 Papua New Guinea", value: "Papua New Guinea" },
    { label: "🇵🇾 Paraguay", value: "Paraguay" },
    { label: "🇵🇪 Peru", value: "Peru" },
    { label: "🇶🇦 Qatar", value: "Qatar" },
    { label: "🇷🇴 Romania", value: "Romania" },
    { label: "🇷🇺 Russia", value: "Russia" },
    { label: "🇷🇼 Rwanda", value: "Rwanda" },
    { label: "🇰🇳 Saint Kitts and Nevis", value: "Saint Kitts and Nevis" },
    { label: "🇱🇨 Saint Lucia", value: "Saint Lucia" },
    {
      label: "🇻🇨 Saint Vincent and the Grenadines",
      value: "Saint Vincent and the Grenadines",
    },
    { label: "🇼🇸 Samoa", value: "Samoa" },
    { label: "🇸🇲 San Marino", value: "San Marino" },
    { label: "🇸🇹 São Tomé and Príncipe", value: "São Tomé and Príncipe" },
    { label: "🇸🇦 Saudi Arabia", value: "Saudi Arabia" },
    { label: "🇸🇳 Senegal", value: "Senegal" },
    { label: "🇸🇨 Seychelles", value: "Seychelles" },
    { label: "🇸🇱 Sierra Leone", value: "Sierra Leone" },
    { label: "🇸🇬 Singapore", value: "Singapore" },
    { label: "🇸🇧 Solomon Islands", value: "Solomon Islands" },
    { label: "🇸🇴 Somalia", value: "Somalia" },
    { label: "🇿🇦 South Africa", value: "South Africa" },
    { label: "🇸🇸 South Sudan", value: "South Sudan" },
    { label: "🇱🇰 Sri Lanka", value: "Sri Lanka" },
    { label: "🇸🇩 Sudan", value: "Sudan" },
    { label: "🇸🇷 Suriname", value: "Suriname" },
    { label: "🇸🇾 Syria", value: "Syria" },
    { label: "🇹🇼 Taiwan", value: "Taiwan" },
    { label: "🇹🇯 Tajikistan", value: "Tajikistan" },
    { label: "🇹🇿 Tanzania", value: "Tanzania" },
    { label: "🇹🇭 Thailand", value: "Thailand" },
    { label: "🇹🇱 Timor-Leste", value: "Timor-Leste" },
    { label: "🇹🇬 Togo", value: "Togo" },
    { label: "🇹🇴 Tonga", value: "Tonga" },
    { label: "🇹🇹 Trinidad and Tobago", value: "Trinidad and Tobago" },
    { label: "🇹🇳 Tunisia", value: "Tunisia" },
    { label: "🇹🇷 Turkey", value: "Turkey" },
    { label: "🇹🇲 Turkmenistan", value: "Turkmenistan" },
    { label: "🇹🇻 Tuvalu", value: "Tuvalu" },
    { label: "🇺🇬 Uganda", value: "Uganda" },
    { label: "🇺🇦 Ukraine", value: "Ukraine" },
    { label: "🇦🇪 United Arab Emirates", value: "United Arab Emirates" },
    { label: "🇺🇾 Uruguay", value: "Uruguay" },
    { label: "🇺🇿 Uzbekistan", value: "Uzbekistan" },
    { label: "🇻🇺 Vanuatu", value: "Vanuatu" },
    { label: "🇻🇦 Vatican City", value: "Vatican City" },
    { label: "🇻🇪 Venezuela", value: "Venezuela" },
    { label: "🇻🇳 Vietnam", value: "Vietnam" },
    { label: "🇾🇪 Yemen", value: "Yemen" },
    { label: "🇿🇲 Zambia", value: "Zambia" },
    { label: "🇿🇼 Zimbabwe", value: "Zimbabwe" },
  ];

  // Throwing arm options (for QBs)
  throwingArmOptions = [
    { label: "Right", value: "right" },
    { label: "Left", value: "left" },
    { label: "Ambidextrous", value: "both" },
  ];

  // User type options
  userTypeOptions: {
    label: string;
    value: "player" | "staff";
    icon: string;
    description: string;
  }[] = [
    {
      label: "Player",
      value: "player",
      icon: "pi pi-user",
      description: "I play on the team and want to track my training",
    },
    {
      label: "Coaching Staff",
      value: "staff",
      icon: "pi pi-briefcase",
      description: "I'm part of the coaching or support staff",
    },
  ];

  // Staff role options
  staffRoleOptions = [
    { label: "Head Coach", value: "head_coach" },
    { label: "Assistant Coach", value: "assistant_coach" },
    { label: "Offensive Coordinator", value: "offensive_coordinator" },
    { label: "Defensive Coordinator", value: "defensive_coordinator" },
    { label: "Strength & Conditioning Coach", value: "strength_coach" },
    { label: "Athletic Trainer", value: "athletic_trainer" },
    { label: "Physiotherapist", value: "physiotherapist" },
    { label: "Nutritionist / Dietitian", value: "nutritionist" },
    { label: "Sports Psychologist", value: "sports_psychologist" },
    { label: "Team Manager", value: "team_manager" },
    { label: "Video Analyst", value: "video_analyst" },
    { label: "Equipment Manager", value: "equipment_manager" },
    { label: "Other Staff", value: "other_staff" },
  ];

  // Staff visibility options - what parts of the app they can access
  staffVisibilityOptions = [
    { label: "Team Roster", value: "roster", icon: "pi pi-users" },
    { label: "Training Programs", value: "training", icon: "pi pi-calendar" },
    { label: "Player Analytics", value: "analytics", icon: "pi pi-chart-line" },
    { label: "Injury Management", value: "injuries", icon: "pi pi-heart" },
    { label: "Nutrition Data", value: "nutrition", icon: "pi pi-apple" },
    { label: "Game Statistics", value: "game_stats", icon: "pi pi-flag" },
    { label: "Playbook", value: "playbook", icon: "pi pi-book" },
    { label: "Film Room", value: "film", icon: "pi pi-video" },
    { label: "Team Chat", value: "chat", icon: "pi pi-comments" },
    { label: "Wellness Data", value: "wellness", icon: "pi pi-sun" },
  ];

  // Injury areas
  injuryAreas = [
    { label: "Hamstring", value: "hamstring" },
    { label: "Quadriceps", value: "quadriceps" },
    { label: "Knee", value: "knee" },
    { label: "Ankle", value: "ankle" },
    { label: "Calf / Achilles", value: "calf_achilles" },
    { label: "Hip Flexor", value: "hip_flexor" },
    { label: "Groin", value: "groin" },
    { label: "Lower Back", value: "lower_back" },
    { label: "Shoulder", value: "shoulder" },
    { label: "Elbow", value: "elbow" },
    { label: "Wrist / Hand", value: "wrist_hand" },
    { label: "Neck", value: "neck" },
    { label: "Other", value: "other" },
  ];

  // Injury history options
  injuryHistoryOptions = [
    { label: "ACL Tear", value: "acl", icon: "pi pi-exclamation-triangle" },
    {
      label: "Hamstring Strain",
      value: "hamstring_strain",
      icon: "pi pi-exclamation-circle",
    },
    {
      label: "Ankle Sprain",
      value: "ankle_sprain",
      icon: "pi pi-exclamation-circle",
    },
    {
      label: "Shoulder Injury",
      value: "shoulder",
      icon: "pi pi-exclamation-circle",
    },
    {
      label: "Concussion",
      value: "concussion",
      icon: "pi pi-exclamation-triangle",
    },
    { label: "Back Injury", value: "back", icon: "pi pi-exclamation-circle" },
    {
      label: "Knee Injury (other)",
      value: "knee_other",
      icon: "pi pi-exclamation-circle",
    },
    {
      label: "Muscle Tear",
      value: "muscle_tear",
      icon: "pi pi-exclamation-triangle",
    },
    {
      label: "Stress Fracture",
      value: "stress_fracture",
      icon: "pi pi-exclamation-triangle",
    },
    { label: "None", value: "none", icon: "pi pi-check-circle" },
  ];

  // Equipment options
  equipmentOptions = [
    { label: "Foam Roller", value: "foam_roller", icon: "pi pi-circle" },
    { label: "Resistance Bands", value: "bands", icon: "pi pi-link" },
    { label: "Dumbbells", value: "dumbbells", icon: "pi pi-box" },
    { label: "Kettlebell", value: "kettlebell", icon: "pi pi-box" },
    { label: "Pull-up Bar", value: "pullup_bar", icon: "pi pi-minus" },
    { label: "Jump Rope", value: "jump_rope", icon: "pi pi-sync" },
    { label: "Yoga Mat", value: "yoga_mat", icon: "pi pi-stop" },
    {
      label: "Agility Ladder",
      value: "agility_ladder",
      icon: "pi pi-th-large",
    },
    { label: "Cones / Markers", value: "cones", icon: "pi pi-map-marker" },
    {
      label: "Medicine Ball",
      value: "medicine_ball",
      icon: "pi pi-circle-fill",
    },
    { label: "Football", value: "football", icon: "pi pi-star" },
    { label: "Gym Access", value: "gym", icon: "pi pi-building" },
    { label: "None / Bodyweight Only", value: "none", icon: "pi pi-user" },
  ];

  // Notification preferences
  notificationOptions = [
    { label: "Training Reminders", value: "training", icon: "pi pi-calendar" },
    { label: "Recovery Alerts", value: "recovery", icon: "pi pi-heart" },
    { label: "Team Updates", value: "team", icon: "pi pi-users" },
    {
      label: "Performance Insights",
      value: "insights",
      icon: "pi pi-chart-line",
    },
  ];

  // Current injury being added
  newInjury: InjuryEntry = { area: "", severity: "minor", notes: "" };

  // Max date for DOB (must be at least 13 years old)
  maxDate = new Date(new Date().setFullYear(new Date().getFullYear() - 13));
  minDate = new Date(new Date().setFullYear(new Date().getFullYear() - 80));

  onboardingData = {
    // Step 1: Personal Info
    name: "",
    dateOfBirth: null as Date | null,
    gender: null as string | null,
    country: null as string | null,
    phone: "",
    profilePhotoUrl: null as string | null,

    // Step 2: User Type & Role
    userType: "player" as "player" | "staff",
    staffRole: null as string | null,
    staffVisibility: [] as string[],

    // Step 2: Team & Position (for players)
    jerseyNumber: null as number | null,
    team: null as string | null,
    position: null as string | null,
    secondaryPosition: null as string | null,
    throwingArm: null as string | null, // For QBs
    experience: null as string | null,

    // Step 3: Physical
    unitSystem: "metric" as "metric" | "imperial",
    heightCm: null as number | null,
    weightKg: null as number | null,
    heightFt: null as number | null,
    heightIn: null as number | null,
    weightLbs: null as number | null,

    // Step 4: Health & Injuries
    currentInjuries: [] as InjuryEntry[],
    injuryHistory: [] as string[],
    medicalNotes: "",

    // Step 5: Equipment
    equipmentAvailable: [] as string[],

    // Step 6: Goals
    goals: [] as string[],

    // Step 7: Schedule
    scheduleType: null as string | null,
    practicesPerWeek: null as number | null,
    practiceDays: [] as string[],

    // Step 8: Mobility & Recovery
    morningMobility: "daily" as string,
    eveningMobility: "daily" as string,
    foamRollingTime: "after_practice" as string,
    restDayPreference: "full" as string,

    // Step 9: Notifications
    enableReminders: true,
    reminderTime: "08:00" as string,
    notificationPreferences: ["training", "recovery"] as string[],

    // Step 9: Consent & Legal
    consentTermsOfService: false,
    consentPrivacyPolicy: false,
    consentDataUsage: false, // Required for app functionality
    consentAICoach: false, // Optional
    consentEmailUpdates: false, // Optional
  };

  // Player steps (full onboarding)
  private playerSteps: OnboardingStep[] = [
    { label: "1 · Personal", icon: "pi pi-user", completed: false },
    { label: "2 · Team", icon: "pi pi-users", completed: false },
    { label: "3 · Physical", icon: "pi pi-heart", completed: false },
    { label: "4 · Health", icon: "pi pi-shield", completed: false },
    { label: "5 · Equipment", icon: "pi pi-box", completed: false },
    { label: "6 · Goals", icon: "pi pi-flag", completed: false },
    { label: "7 · Schedule", icon: "pi pi-calendar", completed: false },
    { label: "8 · Recovery", icon: "pi pi-refresh", completed: false },
    { label: "9 · Summary", icon: "pi pi-check", completed: false },
  ];

  // Staff steps (simplified onboarding - no physical/health/equipment/goals/schedule/recovery)
  private staffSteps: OnboardingStep[] = [
    { label: "1 · Personal", icon: "pi pi-user", completed: false },
    { label: "2 · Role", icon: "pi pi-briefcase", completed: false },
    { label: "3 · Summary", icon: "pi pi-check", completed: false },
  ];

  // Current steps based on user type
  steps = signal<OnboardingStep[]>(this.playerSteps);

  // Computed progress percentage
  progress = computed(() => {
    const completed = this.steps().filter((s) => s.completed).length;
    return Math.round((completed / this.steps().length) * 100);
  });

  // Computed age from DOB
  calculatedAge = computed(() => {
    if (!this.onboardingData.dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(this.onboardingData.dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  });

  // Check if QB position is selected
  isQBSelected = computed(() => {
    return (
      this.onboardingData.position === "QB" ||
      this.onboardingData.secondaryPosition === "QB"
    );
  });

  // Check if current step is the summary step (last step)
  isSummaryStep(): boolean {
    return this.currentStep() === this.steps().length - 1;
  }

  // Check if current user is a player (for conditional UI rendering)
  isPlayer(): boolean {
    return this.onboardingData.userType === "player";
  }

  // Check if current user is staff
  isStaff(): boolean {
    return this.onboardingData.userType === "staff";
  }

  async ngOnInit(): Promise<void> {
    // Set up auto-save with debounce
    this.autoSaveSubscription = this.autoSaveSubject
      .pipe(debounceTime(2000)) // Save after 2 seconds of no changes
      .subscribe(() => {
        this.saveDraft();
      });

    // Load saved draft first
    this.loadDraft();

    // Check email verification status
    await this.checkEmailVerification();

    // Set up listeners for email verification from other tabs
    this.setupEmailVerificationListeners();

    // Load teams from database
    await this.loadTeams();

    // Then load user profile
    await this.loadUserProfile();
  }

  /**
   * Check if current user's email is verified
   */
  async checkEmailVerification(): Promise<void> {
    try {
      // Refresh session to get latest verification status
      const { data, error } = await this.supabaseService.client.auth.getUser();

      if (error) {
        this.logger.error("[Onboarding] Error checking email verification:", error);
        return;
      }

      const isVerified = !!data.user?.email_confirmed_at;
      this.isEmailVerified.set(isVerified);

      if (isVerified) {
        this.logger.info("[Onboarding] Email is verified");
      } else {
        this.logger.info("[Onboarding] Email not yet verified");
      }
    } catch (error) {
      this.logger.error("[Onboarding] Error checking email verification:", error);
    }
  }

  /**
   * Resend verification email to the user
   */
  async resendVerificationEmail(): Promise<void> {
    this.isResendingVerification.set(true);
    try {
      const user = this.supabaseService.currentUser();
      if (!user?.email) {
        this.toastService.error("No email address found. Please try logging in again.");
        return;
      }

      const { error } = await this.supabaseService.client.auth.resend({
        type: "signup",
        email: user.email,
      });

      if (error) {
        throw error;
      }

      this.toastService.success(
        "Verification email sent! Please check your inbox.",
        "Email Sent",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to resend verification email";
      this.toastService.error(message);
    } finally {
      this.isResendingVerification.set(false);
    }
  }

  /**
   * Refresh email verification status (user can click after verifying)
   */
  async refreshVerificationStatus(): Promise<void> {
    await this.checkEmailVerification();
    if (this.isEmailVerified()) {
      this.toastService.success("Email verified! You can now continue.", "Verified");
    } else {
      this.toastService.info("Email not yet verified. Please check your inbox and click the verification link.");
    }
  }

  // BroadcastChannel for cross-tab communication
  private authChannel: BroadcastChannel | null = null;
  private storageListener: ((event: StorageEvent) => void) | null = null;

  /**
   * Set up listeners for email verification from other tabs
   */
  private setupEmailVerificationListeners(): void {
    // Listen via BroadcastChannel API
    try {
      this.authChannel = new BroadcastChannel("flagfit-auth");
      this.authChannel.onmessage = async (event) => {
        if (event.data?.type === "EMAIL_VERIFIED") {
          this.logger.info("[Onboarding] Received email verification broadcast");
          await this.checkEmailVerification();
          if (this.isEmailVerified()) {
            this.toastService.success("Email verified! You can now continue.", "Verified");
          }
        }
      };
    } catch {
      this.logger.debug("[Onboarding] BroadcastChannel not supported");
    }

    // Also listen to localStorage changes as fallback
    this.storageListener = async (event: StorageEvent) => {
      if (event.key === "flagfit_email_verified" && event.newValue) {
        this.logger.info("[Onboarding] Detected email verification via storage");
        await this.checkEmailVerification();
        if (this.isEmailVerified()) {
          this.toastService.success("Email verified! You can now continue.", "Verified");
        }
        // Clear the flag
        localStorage.removeItem("flagfit_email_verified");
      }
    };
    window.addEventListener("storage", this.storageListener);
  }

  /**
   * Clean up email verification listeners
   */
  private cleanupEmailVerificationListeners(): void {
    if (this.authChannel) {
      this.authChannel.close();
      this.authChannel = null;
    }
    if (this.storageListener) {
      window.removeEventListener("storage", this.storageListener);
      this.storageListener = null;
    }
  }

  ngOnDestroy(): void {
    // Save draft when leaving
    this.saveDraft();

    // Clean up listeners
    this.cleanupEmailVerificationListeners();

    if (this.autoSaveSubscription) {
      this.autoSaveSubscription.unsubscribe();
    }
  }

  // Trigger auto-save when data changes
  triggerAutoSave(): void {
    this.autoSaveSubject.next();
  }

  // Save draft to localStorage
  private saveDraft(): void {
    try {
      this.isSaving.set(true);
      const draft = {
        currentStep: this.currentStep(),
        data: this.onboardingData,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(draft));
      this.lastSaved.set(new Date());
      this.isSaving.set(false);
    } catch (error) {
      this.logger.error("Failed to save draft:", error);
      this.isSaving.set(false);
    }
  }

  // Load draft from localStorage
  private loadDraft(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const draft = JSON.parse(saved);

        // Restore data
        Object.assign(this.onboardingData, draft.data);

        // Restore current step
        if (draft.currentStep !== undefined) {
          this.currentStep.set(draft.currentStep);

          // Mark previous steps as completed
          const steps = this.steps();
          for (let i = 0; i < draft.currentStep; i++) {
            steps[i].completed = true;
          }
          this.steps.set([...steps]);
        }

        // Convert date strings back to Date objects
        if (this.onboardingData.dateOfBirth) {
          this.onboardingData.dateOfBirth = new Date(
            this.onboardingData.dateOfBirth,
          );
        }

        this.lastSaved.set(new Date(draft.savedAt));
        this.toastService.info(
          "Your previous progress has been restored",
          "Welcome back!",
        );
      }
    } catch (error) {
      this.logger.error("Failed to load draft:", error);
    }
  }

  // Clear draft after successful completion
  private clearDraft(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private async loadUserProfile(): Promise<void> {
    this.isLoading.set(true);
    try {
      const user = this.supabaseService.currentUser();
      if (!user) {
        this.router.navigate(["/login"]);
        return;
      }

      const { data, error } = await this.supabaseService.client
        .from("users")
        .select("full_name, first_name, last_name, position, experience_level")
        .eq("email", user.email)
        .single();

      if (data && !error) {
        this.onboardingData.name =
          data.full_name ||
          `${data.first_name || ""} ${data.last_name || ""}`.trim();
        this.onboardingData.position = data.position;
        this.onboardingData.experience = data.experience_level;
      }
    } catch (error) {
      this.logger.error("Failed to load user profile:", error);
    } finally {
      this.isLoading.set(false);
    }
  }

  selectUserType(type: "player" | "staff"): void {
    const previousType = this.onboardingData.userType;
    this.onboardingData.userType = type;

    // Reset staff-specific fields when switching to player
    if (type === "player") {
      this.onboardingData.staffRole = null;
      this.onboardingData.staffVisibility = [];
    }
    // Set default visibility for staff based on their role
    if (type === "staff") {
      this.onboardingData.staffVisibility = ["roster", "chat"];
    }

    // Update steps based on user type if it changed
    if (previousType !== type) {
      this.updateStepsForUserType(type);
    }
  }

  /**
   * Update the onboarding steps based on user type
   * Staff have a simplified flow, players have the full flow
   */
  private updateStepsForUserType(userType: "player" | "staff"): void {
    if (userType === "staff") {
      // Reset steps to staff version (preserving completion state for shared steps)
      const currentPersonalCompleted = this.steps()[0]?.completed || false;
      this.staffSteps[0].completed = currentPersonalCompleted;
      this.staffSteps[1].completed = false;
      this.staffSteps[2].completed = false;
      this.steps.set([...this.staffSteps]);
      this.logger.info("[Onboarding] Switched to staff onboarding flow");
    } else {
      // Reset steps to player version (preserving completion state for shared steps)
      const currentPersonalCompleted = this.steps()[0]?.completed || false;
      this.playerSteps[0].completed = currentPersonalCompleted;
      for (let i = 1; i < this.playerSteps.length; i++) {
        this.playerSteps[i].completed = false;
      }
      this.steps.set([...this.playerSteps]);
      this.logger.info("[Onboarding] Switched to player onboarding flow");
    }
  }

  toggleStaffVisibility(option: string): void {
    const index = this.onboardingData.staffVisibility.indexOf(option);
    if (index > -1) {
      this.onboardingData.staffVisibility.splice(index, 1);
    } else {
      this.onboardingData.staffVisibility.push(option);
    }
  }

  toggleGoal(goalId: string): void {
    const index = this.onboardingData.goals.indexOf(goalId);
    if (index > -1) {
      this.onboardingData.goals.splice(index, 1);
    } else {
      this.onboardingData.goals.push(goalId);
    }
  }

  togglePracticeDay(day: string): void {
    const index = this.onboardingData.practiceDays.indexOf(day);
    if (index > -1) {
      this.onboardingData.practiceDays.splice(index, 1);
    } else {
      this.onboardingData.practiceDays.push(day);
    }
  }

  toggleEquipment(equipment: string): void {
    const index = this.onboardingData.equipmentAvailable.indexOf(equipment);
    if (index > -1) {
      this.onboardingData.equipmentAvailable.splice(index, 1);
    } else {
      // If selecting "none", clear others
      if (equipment === "none") {
        this.onboardingData.equipmentAvailable = ["none"];
      } else {
        // Remove "none" if selecting other equipment
        const noneIndex =
          this.onboardingData.equipmentAvailable.indexOf("none");
        if (noneIndex > -1) {
          this.onboardingData.equipmentAvailable.splice(noneIndex, 1);
        }
        this.onboardingData.equipmentAvailable.push(equipment);
      }
    }
  }

  toggleInjuryHistory(injury: string): void {
    const index = this.onboardingData.injuryHistory.indexOf(injury);
    if (index > -1) {
      this.onboardingData.injuryHistory.splice(index, 1);
    } else {
      // If selecting "none", clear others
      if (injury === "none") {
        this.onboardingData.injuryHistory = ["none"];
      } else {
        const noneIndex = this.onboardingData.injuryHistory.indexOf("none");
        if (noneIndex > -1) {
          this.onboardingData.injuryHistory.splice(noneIndex, 1);
        }
        this.onboardingData.injuryHistory.push(injury);
      }
    }
  }

  toggleNotification(notif: string): void {
    const index = this.onboardingData.notificationPreferences.indexOf(notif);
    if (index > -1) {
      this.onboardingData.notificationPreferences.splice(index, 1);
    } else {
      this.onboardingData.notificationPreferences.push(notif);
    }
  }

  addCurrentInjury(): void {
    if (this.newInjury.area) {
      this.onboardingData.currentInjuries.push({ ...this.newInjury });
      this.newInjury = { area: "", severity: "minor", notes: "" };
    }
  }

  removeCurrentInjury(index: number): void {
    this.onboardingData.currentInjuries.splice(index, 1);
  }

  getGenderLabel(value: string | null): string {
    return (
      this.genderOptions.find((g) => g.value === value)?.label || "Not selected"
    );
  }

  getThrowingArmLabel(value: string | null): string {
    return (
      this.throwingArmOptions.find((a) => a.value === value)?.label ||
      "Not selected"
    );
  }

  getAgeGroup(): string {
    const age = this.calculatedAge();
    if (!age) return "Unknown";
    if (age < 18) return "Youth";
    if (age < 35) return "Adult";
    if (age < 50) return "Masters";
    return "Senior";
  }

  /**
   * Validate current step before advancing
   */
  /**
   * Check if onboarding can be completed (all required consents accepted)
   */
  canCompleteOnboarding(): boolean {
    // Must be on the summary step (last step for both player and staff)
    if (!this.isSummaryStep()) {
      return false;
    }

    // All required consents must be accepted
    return (
      this.onboardingData.consentTermsOfService &&
      this.onboardingData.consentPrivacyPolicy &&
      this.onboardingData.consentDataUsage
    );
  }

  validateCurrentStep(): { valid: boolean; message?: string } {
    const step = this.currentStep();

    switch (step) {
      case 0: // Personal Info
        if (!this.onboardingData.name?.trim()) {
          return { valid: false, message: "Please enter your full name" };
        }
        if (!this.onboardingData.dateOfBirth) {
          return { valid: false, message: "Please select your date of birth" };
        }
        if (!this.onboardingData.country) {
          return { valid: false, message: "Please select your country" };
        }
        // Check email verification before allowing to proceed
        if (!this.isEmailVerified()) {
          return {
            valid: false,
            message: "Please verify your email address before continuing. Check your inbox for a verification link.",
          };
        }
        return { valid: true };

      case 1: // User Type & Role
        if (!this.onboardingData.team) {
          return { valid: false, message: "Please select your team" };
        }
        // Staff validation
        if (this.onboardingData.userType === "staff") {
          if (!this.onboardingData.staffRole) {
            return { valid: false, message: "Please select your staff role" };
          }
          return { valid: true };
        }
        // Player validation
        if (!this.onboardingData.position) {
          return {
            valid: false,
            message: "Please select your primary position",
          };
        }
        if (!this.onboardingData.experience) {
          return {
            valid: false,
            message: "Please select your experience level",
          };
        }
        if (this.isQBSelected() && !this.onboardingData.throwingArm) {
          return { valid: false, message: "Please select your throwing arm" };
        }
        return { valid: true };

      case 2: // Physical Measurements
        if (this.onboardingData.unitSystem === "metric") {
          if (!this.onboardingData.heightCm) {
            return { valid: false, message: "Please enter your height" };
          }
          if (!this.onboardingData.weightKg) {
            return { valid: false, message: "Please enter your weight" };
          }
        } else {
          if (!this.onboardingData.heightFt && !this.onboardingData.heightIn) {
            return { valid: false, message: "Please enter your height" };
          }
          if (!this.onboardingData.weightLbs) {
            return { valid: false, message: "Please enter your weight" };
          }
        }
        return { valid: true };

      case 5: // Goals
        if (this.onboardingData.goals.length === 0) {
          return {
            valid: false,
            message: "Please select at least one training goal",
          };
        }
        return { valid: true };

      case 6: // Schedule
        if (!this.onboardingData.scheduleType) {
          return { valid: false, message: "Please select your schedule type" };
        }
        return { valid: true };

      case 8: // Summary & Consent
        if (!this.onboardingData.consentTermsOfService) {
          return {
            valid: false,
            message: "Please accept the Terms of Service",
          };
        }
        if (!this.onboardingData.consentPrivacyPolicy) {
          return {
            valid: false,
            message: "Please accept the Privacy Policy",
          };
        }
        if (!this.onboardingData.consentDataUsage) {
          return {
            valid: false,
            message: "Please consent to data usage for personalized training",
          };
        }
        return { valid: true };

      default:
        return { valid: true };
    }
  }

  nextStep(): void {
    // Validate current step before advancing
    const validation = this.validateCurrentStep();
    if (!validation.valid) {
      this.toastService.warn(
        validation.message || "Please complete all required fields",
      );
      return;
    }

    if (this.currentStep() < this.steps().length - 1) {
      const steps = this.steps();
      steps[this.currentStep()].completed = true;
      this.steps.set([...steps]);
      this.currentStep.set(this.currentStep() + 1);

      // Auto-save on step change
      this.saveDraft();
    }
  }

  previousStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.set(this.currentStep() - 1);

      // Auto-save on step change
      this.saveDraft();
    }
  }

  /**
   * Debug method to track checkbox changes
   */
  onConsentChange(consentType: string, event: { checked?: boolean }): void {
    const isChecked = event.checked ?? false;
    this.logger.debug(`Consent ${consentType} changed`, { checked: isChecked });

    // Manually update the value to ensure it's set
    switch (consentType) {
      case "Terms of Service":
        this.onboardingData.consentTermsOfService = isChecked;
        break;
      case "Privacy Policy":
        this.onboardingData.consentPrivacyPolicy = isChecked;
        break;
      case "Data Usage":
        this.onboardingData.consentDataUsage = isChecked;
        break;
      case "AI Coach":
        this.onboardingData.consentAICoach = isChecked;
        break;
      case "Email Updates":
        this.onboardingData.consentEmailUpdates = isChecked;
        break;
    }
    // Signal-based components don't need manual change detection
    this.saveDraft();
  }

  /**
   * Navigate to a specific step when user clicks on a step number
   * Only allows navigation to completed steps or the next step
   */
  goToStep(event: number | undefined): void {
    if (event === undefined) return;
    const targetIndex = event;
    const currentIndex = this.currentStep();

    // Allow navigation to any previous step or the immediate next step
    if (targetIndex <= currentIndex + 1) {
      this.currentStep.set(targetIndex);
      this.saveDraft();
    } else {
      this.toastService.info(TOAST.INFO.COMPLETE_CURRENT_STEP);
    }
  }

  // Helper methods for summary display
  /**
   * Load teams from database, with fallback to predefined list
   */
  private async loadTeams(): Promise<void> {
    try {
      const { data: teamsData, error } = await this.supabaseService.client
        .from("teams")
        .select("id, name")
        .eq("approval_status", "approved")
        .order("name");

      if (!error && teamsData && teamsData.length > 0) {
        // Convert database teams to options format
        const teamOptions = teamsData.map((team) => ({
          label: team.name,
          value: team.id,
        }));
        this.teams.set(teamOptions);
        // Initialize suggestions immediately so dropdown doesn't show loading spinner
        this.teamSuggestions.set(teamOptions);
        this.logger.info(
          `[Onboarding] Loaded ${teamOptions.length} teams from database`,
        );
      } else {
        // Keep predefined teams as fallback
        // Initialize suggestions with fallback teams
        this.teamSuggestions.set(this.teams());
        this.logger.info(
          "[Onboarding] Using predefined teams (database query failed or empty)",
        );
      }
    } catch (error) {
      this.logger.warn(
        "[Onboarding] Failed to load teams from database:",
        error,
      );
      // Keep predefined teams as fallback
      this.teamSuggestions.set(this.teams());
    }
  }

  /**
   * Search teams for autocomplete
   */
  searchTeams(event: { query: string }): void {
    const query = event.query.toLowerCase();
    const allTeams = this.teams();

    if (!query) {
      this.teamSuggestions.set(allTeams);
      return;
    }

    // Filter teams by name
    const filtered = allTeams.filter((team) =>
      team.label.toLowerCase().includes(query),
    );

    // If no matches and user typed something, allow free text entry
    // The autocomplete will show the typed text as an option
    this.teamSuggestions.set(filtered);
  }

  /**
   * Handle team selection - allows free text entry
   */
  onTeamSelect(event: string | { value: string } | null): void {
    // If user selected from dropdown, use the value
    // If user typed free text, use the typed value directly
    if (event && typeof event === "object" && event.value) {
      this.onboardingData.team = event.value;
    } else if (typeof event === "string") {
      // Free text entry - store as-is
      this.onboardingData.team = event;
    }
  }

  getTeamLabel(value: string | null): string {
    if (!value) return "Not selected";
    // Check if it's a team ID from database
    const team = this.teams().find((t) => t.value === value);
    if (team) return team.label;
    // Otherwise it's free text entry, return as-is
    return value;
  }

  getPositionLabel(value: string | null): string {
    return (
      this.positions.find((p) => p.value === value)?.label || "Not selected"
    );
  }

  getStaffRoleLabel(value: string | null): string {
    return (
      this.staffRoleOptions.find((r) => r.value === value)?.label ||
      "Not selected"
    );
  }

  getExperienceLabel(value: string | null): string {
    return (
      this.experienceLevels.find((e) => e.value === value)?.label ||
      "Not selected"
    );
  }

  getScheduleLabel(value: string | null): string {
    return (
      this.scheduleTypes.find((s) => s.value === value)?.label || "Not selected"
    );
  }

  getMobilityLabel(value: string): string {
    return (
      this.mobilityTimeOptions.find((o) => o.value === value)?.label || value
    );
  }

  getFoamRollingLabel(value: string): string {
    return (
      this.foamRollingOptions.find((o) => o.value === value)?.label || value
    );
  }

  getRestDayLabel(value: string): string {
    const option = this.restDayOptions.find((o) => o.value === value);
    return option ? `${option.label} - ${option.description}` : value;
  }

  getRestDayOptionLabel(value: string): string {
    const option = this.restDayOptions.find((o) => o.value === value);
    return option?.label || value;
  }

  getHeightDisplay(): string {
    if (this.onboardingData.unitSystem === "metric") {
      return this.onboardingData.heightCm
        ? `${this.onboardingData.heightCm} cm`
        : "?";
    } else {
      if (this.onboardingData.heightFt || this.onboardingData.heightIn) {
        return `${this.onboardingData.heightFt || 0}'${this.onboardingData.heightIn || 0}"`;
      }
      return "?";
    }
  }

  getWeightDisplay(): string {
    if (this.onboardingData.unitSystem === "metric") {
      return this.onboardingData.weightKg
        ? `${this.onboardingData.weightKg} kg`
        : "?";
    } else {
      return this.onboardingData.weightLbs
        ? `${this.onboardingData.weightLbs} lbs`
        : "?";
    }
  }

  // Convert imperial to metric for storage (database always stores metric)
  private getHeightInCm(): number | null {
    if (this.onboardingData.unitSystem === "metric") {
      return this.onboardingData.heightCm;
    } else {
      if (this.onboardingData.heightFt || this.onboardingData.heightIn) {
        const totalInches =
          (this.onboardingData.heightFt || 0) * 12 +
          (this.onboardingData.heightIn || 0);
        return Math.round(totalInches * 2.54);
      }
      return null;
    }
  }

  private getWeightInKg(): number | null {
    if (this.onboardingData.unitSystem === "metric") {
      return this.onboardingData.weightKg;
    } else {
      if (this.onboardingData.weightLbs) {
        return Math.round(this.onboardingData.weightLbs * 0.453592 * 10) / 10;
      }
      return null;
    }
  }

  async completeOnboarding(): Promise<void> {
    this.isCompleting.set(true);

    try {
      const user = this.supabaseService.currentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const nameParts = this.onboardingData.name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // For staff, don't save player-specific data
      const isStaffUser = this.isStaff();

      // Convert to metric for storage (database always stores in metric)
      const heightCm = isStaffUser ? null : this.getHeightInCm();
      const weightKg = isStaffUser ? null : this.getWeightInKg();

      // Prepare user profile data - different for staff vs players
      const profileData = {
        full_name: this.onboardingData.name,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: this.onboardingData.dateOfBirth
          ?.toISOString()
          .split("T")[0],
        gender: this.onboardingData.gender,
        country: this.onboardingData.country,
        phone: this.onboardingData.phone || null,
        team: this.onboardingData.team,
        // Staff-specific fields
        user_type: this.onboardingData.userType,
        staff_role: isStaffUser ? this.onboardingData.staffRole : null,
        staff_visibility: isStaffUser ? this.onboardingData.staffVisibility : null,
        // Player-specific fields (null for staff)
        position: isStaffUser ? null : this.onboardingData.position,
        secondary_position: isStaffUser ? null : this.onboardingData.secondaryPosition,
        throwing_arm: isStaffUser ? null : this.onboardingData.throwingArm,
        experience_level: isStaffUser ? null : this.onboardingData.experience,
        jersey_number: isStaffUser ? null : this.onboardingData.jerseyNumber,
        height_cm: heightCm,
        weight_kg: weightKg,
        preferred_units: isStaffUser ? null : this.onboardingData.unitSystem,
        updated_at: new Date().toISOString(),
      };

      // Update user profile with onboarding_completed flag
      const profileDataWithOnboarding = {
        ...profileData,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      };

      const { error: updateError } = await this.supabaseService.client
        .from("users")
        .update(profileDataWithOnboarding)
        .eq("email", user.email);

      if (updateError) {
        const { error: insertError } = await this.supabaseService.client
          .from("users")
          .insert({
            email: user.email,
            ...profileDataWithOnboarding,
            is_active: true,
            email_verified: true,
          });

        if (insertError) {
          throw new Error(`Failed to save profile: ${insertError.message}`);
        }
      }

      // Update auth user_metadata with role for dashboard routing
      // Map user_type to appropriate role for auth metadata
      const authRole = isStaffUser
        ? this.onboardingData.staffRole === "head_coach"
          ? "coach"
          : this.onboardingData.staffRole === "assistant_coach"
            ? "assistant_coach"
            : this.onboardingData.staffRole || "coach"
        : "player";

      await this.supabaseService.updateUser({
        data: {
          role: authRole,
          user_type: this.onboardingData.userType,
          full_name: this.onboardingData.name,
        },
      });

      // Player-only: Save training preferences and assign program
      if (!isStaffUser) {
        // Save training preferences (schedule, mobility, recovery)
        await this.saveTrainingPreferences(user.email ?? "");

        // Save current injuries to wellness_checkins table
        await this.saveCurrentInjuries(user.id);

        // Create athlete_training_config for daily-protocol position modifiers
        // This maps UI position values to normalized database keys
        await this.createAthleteTrainingConfig(user.id);

        // BLOCKER B ENFORCEMENT: Assign training program based on position
        // This is now MANDATORY - every athlete must have a real plan
        const assignmentResult = await this.assignTrainingProgram();

        if (!assignmentResult) {
          this.logger.error(
            "[Onboarding] Program assignment FAILED - this is a critical error",
          );

          // Show user a warning but allow completion
          // They can still access the app and admin can assign program later
          this.toastService.warn(
            "Training program assignment is pending. You can still access the app, but your personalized plan may not be ready yet. Please contact support if this persists.",
            "Setup Incomplete",
          );

          // Set flag for dashboard to show program assignment prompt
          sessionStorage.setItem("programAssignmentPending", "true");

          // Log error details for debugging but don't block onboarding
          this.logger.error(
            "[Onboarding] Allowing user to proceed without program assignment",
            { position: this.onboardingData.position },
          );
        }

        // Add player to team roster
        if (this.onboardingData.team) {
          await this.addPlayerToTeamRoster(user.id);
        }

        // Always set flag to refresh program assignment on dashboard
        // This ensures the dashboard checks for the program even if assignment had issues
        sessionStorage.setItem("refreshProgramAssignment", "true");
      } else {
        // Staff-only: Add staff member to team roster with appropriate role
        if (this.onboardingData.team) {
          await this.addStaffToTeamRoster(user.id);
        }
      }

      // Clear the draft after successful completion
      this.clearDraft();

      const successMessage = isStaffUser
        ? "Your staff profile has been set up!"
        : "Your profile and training preferences have been set up!";

      this.toastService.success(
        successMessage,
        "Welcome to FlagFit Pro!",
      );

      setTimeout(() => {
        // Check for post-onboarding redirect (e.g., team invitation)
        const postOnboardingRedirect = sessionStorage.getItem(
          "postOnboardingRedirect",
        );
        if (postOnboardingRedirect) {
          sessionStorage.removeItem("postOnboardingRedirect");
          this.router.navigateByUrl(postOnboardingRedirect);
        } else {
          // Redirect based on user type
          if (isStaffUser) {
            this.router.navigate(["/coach/team"]);
          } else {
            this.router.navigate(["/dashboard"]);
          }
        }
      }, 1000);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to complete setup. Please try again.";
      this.toastService.error(message);
    } finally {
      this.isCompleting.set(false);
    }
  }

  private async saveTrainingPreferences(email: string): Promise<void> {
    try {
      const preferences = {
        email: email,
        schedule_type: this.onboardingData.scheduleType,
        practices_per_week: this.onboardingData.practicesPerWeek,
        practice_days: this.onboardingData.practiceDays,
        morning_mobility: this.onboardingData.morningMobility,
        evening_mobility: this.onboardingData.eveningMobility,
        foam_rolling_time: this.onboardingData.foamRollingTime,
        rest_day_preference: this.onboardingData.restDayPreference,
        training_goals: this.onboardingData.goals,
        equipment_available: this.onboardingData.equipmentAvailable,
        current_injuries: this.onboardingData.currentInjuries,
        injury_history: this.onboardingData.injuryHistory,
        medical_notes: this.onboardingData.medicalNotes || null,
        enable_reminders: this.onboardingData.enableReminders,
        reminder_time: this.onboardingData.reminderTime,
        notification_preferences: this.onboardingData.notificationPreferences,
        // Consent preferences
        consent_terms_of_service: this.onboardingData.consentTermsOfService,
        consent_privacy_policy: this.onboardingData.consentPrivacyPolicy,
        consent_data_usage: this.onboardingData.consentDataUsage,
        consent_ai_coach: this.onboardingData.consentAICoach,
        consent_email_updates: this.onboardingData.consentEmailUpdates,
        consent_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await this.supabaseService.client
        .from("user_preferences")
        .upsert(preferences, { onConflict: "email" });

      if (error) {
        this.logger.info("Saving preferences to localStorage:", toLogContext(error.message));
        localStorage.setItem(
          "flagfit_preferences",
          JSON.stringify(preferences),
        );
      }
    } catch (_e) {
      const preferences = {
        scheduleType: this.onboardingData.scheduleType,
        practicesPerWeek: this.onboardingData.practicesPerWeek,
        practiceDays: this.onboardingData.practiceDays,
        morningMobility: this.onboardingData.morningMobility,
        eveningMobility: this.onboardingData.eveningMobility,
        foamRollingTime: this.onboardingData.foamRollingTime,
        restDayPreference: this.onboardingData.restDayPreference,
        trainingGoals: this.onboardingData.goals,
        equipmentAvailable: this.onboardingData.equipmentAvailable,
        currentInjuries: this.onboardingData.currentInjuries,
        injuryHistory: this.onboardingData.injuryHistory,
      };
      localStorage.setItem("flagfit_preferences", JSON.stringify(preferences));
    }
  }

  /**
   * Create or update athlete_training_config record
   * This is used by daily-protocol.cjs to determine position-specific modifiers
   *
   * Maps UI position values to normalized database values:
   * - QB -> "quarterback"
   * - WR, DB, LB, Hybrid -> "wr_db"
   * - Center -> "center"
   * - Rusher -> "rusher" (also "blitzer" in Europe)
   */
  private async createAthleteTrainingConfig(userId: string): Promise<void> {
    try {
      const normalizedPosition = normalizePositionForModifiers(
        this.onboardingData.position || "WR",
      );

      // Availability schedule is set separately via player-settings API
      // Coaches schedule team activities via team_activities table (authority)

      const config = {
        user_id: userId,
        primary_position: normalizedPosition,
        secondary_position: this.onboardingData.secondaryPosition
          ? normalizePositionForModifiers(this.onboardingData.secondaryPosition)
          : null,
        birth_date:
          this.onboardingData.dateOfBirth?.toISOString().split("T")[0] || null,
        preferred_training_days: this.getPreferredTrainingDays(),
        max_sessions_per_week: this.onboardingData.practicesPerWeek || 3,
        available_equipment: this.onboardingData.equipmentAvailable || [],
        has_gym_access:
          this.onboardingData.equipmentAvailable?.includes("gym") || false,
        has_field_access:
          this.onboardingData.equipmentAvailable?.includes("field") || true,
        current_limitations:
          this.onboardingData.currentInjuries?.length > 0
            ? { injuries: this.onboardingData.currentInjuries }
            : null,
        // Default ACWR targets (can be adjusted by coach later)
        acwr_target_min: 0.8,
        acwr_target_max: 1.3,
        updated_at: new Date().toISOString(),
      };

      const { error } = await this.supabaseService.client
        .from("athlete_training_config")
        .upsert(config, { onConflict: "user_id" });

      if (error) {
        this.logger.warn(
          "[Onboarding] Failed to create athlete_training_config:",
          error.message,
        );
        // Non-blocking - continue with onboarding
      } else {
        this.logger.info(
          `[Onboarding] Created athlete_training_config for position: ${normalizedPosition}`,
        );
      }
    } catch (e) {
      this.logger.warn(
        "[Onboarding] Error creating athlete_training_config:",
        e,
      );
      // Non-blocking - continue with onboarding
    }
  }

  /**
   * Save current injuries to wellness_checkins table
   * This ensures injuries are properly tracked for training modifications
   */
  private async saveCurrentInjuries(userId: string): Promise<void> {
    try {
      // Only save if there are current injuries
      if (
        !this.onboardingData.currentInjuries ||
        this.onboardingData.currentInjuries.length === 0
      ) {
        return;
      }

      // Convert injury entries to soreness_areas format
      // soreness_areas is an array of strings in wellness_checkins table
      const sorenessAreas = this.onboardingData.currentInjuries.map(
        (injury: InjuryEntry) => {
          // Map injury area to soreness area format
          // e.g., "hamstring" -> "hamstring", "hip_flexor" -> "hip flexor"
          const area = injury.area.replace(/_/g, " ");
          return `${area} (${injury.severity})`;
        },
      );

      // Also save injury history as notes or in a separate field
      const injuryHistoryNotes =
        this.onboardingData.injuryHistory.length > 0
          ? `Past injuries: ${this.onboardingData.injuryHistory.join(", ")}`
          : null;

      // Create or update wellness checkin for today with current injuries
      const today = new Date().toISOString().split("T")[0];
      const { error } = await this.supabaseService.client
        .from("daily_wellness_checkin")
        .upsert(
          {
            user_id: userId,
            checkin_date: today,
            soreness_areas: sorenessAreas,
            notes: injuryHistoryNotes || null,
            // Set default values for other required fields if not set
            sleep_quality: 5,
            sleep_hours: 7,
            energy_level: 5,
            muscle_soreness:
              this.onboardingData.currentInjuries.length > 0 ? 5 : 0,
            stress_level: 5,
            readiness_score: 50, // Default readiness score
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,checkin_date" },
        );

      if (error) {
        this.logger.warn(
          "[Onboarding] Failed to save current injuries to wellness_checkin:",
          error.message,
        );
        // Non-blocking - continue with onboarding
      } else {
        this.logger.info(
          `[Onboarding] Saved ${this.onboardingData.currentInjuries.length} current injuries to wellness_checkin`,
        );
      }
    } catch (e) {
      this.logger.warn("[Onboarding] Error saving current injuries:", toLogContext(e));
      // Non-blocking - continue with onboarding
    }
  }

  /**
   * Add player to team roster (team_members and team_players tables)
   * This ensures the player appears on the Roster page
   */
  private async addPlayerToTeamRoster(userId: string): Promise<void> {
    try {
      const teamName = this.onboardingData.team;
      if (!teamName) {
        this.logger.warn(
          "[Onboarding] No team name provided, skipping roster addition",
        );
        return;
      }

      // 1. Find or create the team
      let teamId: string | null = null;

      // First, try to find existing team by name
      const { data: existingTeam } = await this.supabaseService.client
        .from("teams")
        .select("id")
        .ilike("name", teamName)
        .single();

      if (existingTeam) {
        teamId = existingTeam.id;
        this.logger.info(
          `[Onboarding] Found existing team: ${teamName} (${teamId})`,
        );
      } else {
        // Create new team
        const { data: newTeam, error: teamError } =
          await this.supabaseService.client
            .from("teams")
            .insert({
              name: teamName,
              created_by: userId,
            })
            .select()
            .single();

        if (teamError) {
          this.logger.warn(
            "[Onboarding] Failed to create team:",
            teamError.message,
          );
          return;
        }
        teamId = newTeam.id;
        this.logger.info(
          `[Onboarding] Created new team: ${teamName} (${teamId})`,
        );
      }

      if (!teamId) {
        this.logger.warn("[Onboarding] Could not determine team ID");
        return;
      }

      // 2. Add user to team_members with role='player'
      // Check if already a member
      const { data: existingMember } = await this.supabaseService.client
        .from("team_members")
        .select("id")
        .eq("team_id", teamId)
        .eq("user_id", userId)
        .single();

      if (!existingMember) {
        const { error: memberError } = await this.supabaseService.client
          .from("team_members")
          .insert({
            team_id: teamId,
            user_id: userId,
            role: "player",
          });

        if (memberError) {
          this.logger.warn(
            "[Onboarding] Failed to add team member:",
            memberError.message,
          );
        } else {
          this.logger.info(`[Onboarding] Added user to team_members as player`);
        }
      }

      // 3. Add player to team_players table with profile data
      // Calculate age from date of birth
      let age = 0;
      if (this.onboardingData.dateOfBirth) {
        const birthDate = new Date(this.onboardingData.dateOfBirth);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
      }

      const heightCm = this.getHeightInCm();
      const weightKg = this.getWeightInKg();

      // Check if player already exists in team_players
      const { data: existingPlayer } = await this.supabaseService.client
        .from("team_players")
        .select("id")
        .eq("team_id", teamId)
        .eq("user_id", userId)
        .single();

      if (!existingPlayer) {
        const { error: playerError } = await this.supabaseService.client
          .from("team_players")
          .insert({
            team_id: teamId,
            user_id: userId,
            name: this.onboardingData.name,
            position: this.onboardingData.position,
            jersey_number: this.onboardingData.jerseyNumber?.toString() || null,
            country: this.onboardingData.country,
            age,
            height: heightCm ? `${heightCm} cm` : null,
            weight: weightKg ? `${weightKg} kg` : null,
            status: "active",
            created_by: userId,
          });

        if (playerError) {
          this.logger.warn(
            "[Onboarding] Failed to add to team_players:",
            playerError.message,
          );
        } else {
          this.logger.info(
            `[Onboarding] Added player to team_players: ${this.onboardingData.name}`,
          );
        }
      }
    } catch (e) {
      this.logger.warn("[Onboarding] Error adding player to team roster:", toLogContext(e));
      // Non-blocking - continue with onboarding
    }
  }

  /**
   * Add staff member to team roster
   */
  private async addStaffToTeamRoster(userId: string): Promise<void> {
    try {
      const teamName = this.onboardingData.team;
      if (!teamName) {
        this.logger.warn(
          "[Onboarding] No team name provided, skipping staff roster addition",
        );
        return;
      }

      // 1. Find or create the team
      let teamId: string | null = null;

      // First, try to find existing team by name
      const { data: existingTeam } = await this.supabaseService.client
        .from("teams")
        .select("id")
        .ilike("name", teamName)
        .single();

      if (existingTeam) {
        teamId = existingTeam.id;
        this.logger.info(
          `[Onboarding] Found existing team for staff: ${teamName} (${teamId})`,
        );
      } else {
        // Create new team with staff member as creator
        const { data: newTeam, error: teamError } =
          await this.supabaseService.client
            .from("teams")
            .insert({
              name: teamName,
              created_by: userId,
            })
            .select()
            .single();

        if (teamError) {
          this.logger.warn(
            "[Onboarding] Failed to create team:",
            teamError.message,
          );
          return;
        }
        teamId = newTeam.id;
        this.logger.info(
          `[Onboarding] Created new team for staff: ${teamName} (${teamId})`,
        );
      }

      if (!teamId) {
        this.logger.warn("[Onboarding] Could not determine team ID for staff");
        return;
      }

      // 2. Add user to team_members with appropriate role based on staff role
      // Map staff role to team member role
      const staffRoleToMemberRole: Record<string, string> = {
        head_coach: "coach",
        assistant_coach: "coach",
        offensive_coordinator: "coach",
        defensive_coordinator: "coach",
        strength_coach: "staff",
        athletic_trainer: "staff",
        physiotherapist: "staff",
        nutritionist: "staff",
        sports_psychologist: "staff",
        team_manager: "manager",
        video_analyst: "staff",
        equipment_manager: "staff",
        other_staff: "staff",
      };

      const memberRole =
        staffRoleToMemberRole[this.onboardingData.staffRole || ""] || "staff";

      // Check if already a member
      const { data: existingMember } = await this.supabaseService.client
        .from("team_members")
        .select("id")
        .eq("team_id", teamId)
        .eq("user_id", userId)
        .single();

      if (!existingMember) {
        const { error: memberError } = await this.supabaseService.client
          .from("team_members")
          .insert({
            team_id: teamId,
            user_id: userId,
            role: memberRole,
          });

        if (memberError) {
          this.logger.warn(
            "[Onboarding] Failed to add staff member:",
            memberError.message,
          );
        } else {
          this.logger.info(
            `[Onboarding] Added staff to team_members as ${memberRole}`,
          );
        }
      }
    } catch (e) {
      this.logger.warn(
        "[Onboarding] Error adding staff to team roster:",
        toLogContext(e),
      );
      // Non-blocking - continue with onboarding
    }
  }

  /**
   * Convert day name to day number (0 = Sunday, 1 = Monday, etc.)
   */
  private getDayNumber(dayName: string): number {
    const days: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    return days[dayName.toLowerCase()] ?? 1;
  }

  /**
   * Get preferred training days based on practice schedule
   * Returns days that are NOT practice days (for strength training)
   */
  private getPreferredTrainingDays(): string[] {
    const allDays = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const practiceDays = this.onboardingData.practiceDays || [];
    // Prefer non-practice days for strength training
    const trainingDays = allDays.filter(
      (day) => !practiceDays.map((d: string) => d.toLowerCase()).includes(day),
    );
    // Return at least 3 days
    return trainingDays.length >= 3
      ? trainingDays.slice(0, UI_LIMITS.ONBOARDING_DAYS_PREVIEW)
      : allDays.slice(0, UI_LIMITS.ONBOARDING_DAYS_PREVIEW);
  }

  /**
   * Assign training program based on selected position
   *
   * Program mapping:
   * - QB -> Ljubljana Frogs QB Annual Program 2025-2026
   * - Everyone else (WR, DB, Center, Rusher, LB, Hybrid) -> Ljubljana Frogs WR/DB Annual Program 2025-2026
   *
   * This is idempotent: if user already has the same program assigned, it succeeds without duplicates.
   * If user has a different program, it will switch (force=true) to maintain consistency.
   *
   * Non-blocking: If this fails, user can still enter app and admin can assign later.
   */
  private async assignTrainingProgram(): Promise<boolean> {
    const position = this.onboardingData.position;

    if (!position) {
      // BLOCKER B: Position is mandatory for program assignment
      this.logger.error(
        "[Onboarding] No position selected - cannot assign program (CRITICAL)",
      );
      return false;
    }

    const programId = getProgramIdForPosition(position);
    this.logger.info(
      `[Onboarding] Assigning program for position "${position}" -> ${programId}`,
    );

    try {
      // Use firstValueFrom to convert Observable to Promise
      const { firstValueFrom } = await import("rxjs");

      const assignment = await firstValueFrom(
        this.playerProgramService.assignMyProgram(programId, { force: true }),
      );

      if (assignment) {
        this.logger.info(
          `[Onboarding] ✅ Successfully assigned program: ${assignment.program.name}`,
        );
        return true;
      } else {
        // Assignment returned null - this is now a CRITICAL failure
        this.logger.error(
          "[Onboarding] ❌ Program assignment returned null (CRITICAL - BLOCKER B)",
          {
            position: position,
            programId: programId,
            reason: "API returned null - possible causes: program not found in DB, RLS policy blocking, or API error",
          },
        );
        return false;
      }
    } catch (error) {
      // BLOCKER B: This is now a BLOCKING error - but we'll log details and allow completion
      this.logger.error(
        "[Onboarding] ❌ Failed to assign training program (CRITICAL - BLOCKER B):",
        {
          position: position,
          programId: programId,
          error: error,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorCode: typeof error === 'object' && error !== null && 'code' in error ? (error as { code: unknown }).code : undefined,
          errorDetails: typeof error === 'object' && error !== null && 'details' in error ? (error as { details: unknown }).details : undefined,
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
      return false;
    }
  }
}
