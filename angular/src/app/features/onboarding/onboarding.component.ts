import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from "@angular/core";

import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { AvatarModule } from "primeng/avatar";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { CheckboxModule } from "primeng/checkbox";
import { Chip } from "primeng/chip";
import { DatePicker } from "primeng/datepicker";
import { FileUploadModule } from "primeng/fileupload";
import { InputTextModule } from "primeng/inputtext";
import { ProgressBarModule } from "primeng/progressbar";
import { Select } from "primeng/select";
import { StepsModule } from "primeng/steps";
import { ToastModule } from "primeng/toast";
import { Subject, debounceTime } from "rxjs";
import { AuthService } from "../../core/services/auth.service";
import { LoggerService } from "../../core/services/logger.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { ToastService } from "../../core/services/toast.service";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";

interface OnboardingStep {
  label: string;
  icon: string;
  completed: boolean;
}

interface InjuryEntry {
  area: string;
  severity: 'minor' | 'moderate' | 'severe';
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
    ButtonModule,
    InputTextModule,
    Select,
    StepsModule,
    ToastModule,
    DatePicker,
    CheckboxModule,
    FileUploadModule,
    AvatarModule,
    Chip,
    ProgressBarModule,
    MainLayoutComponent,
    PageHeaderComponent,
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
            <p-progressBar [value]="progress()" [showValue]="false" styleClass="onboarding-progress"></p-progressBar>
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

          <p-steps [model]="steps()" [activeIndex]="currentStep()" [readonly]="false"></p-steps>

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
                    <label for="onboarding-name">Full Name <span class="required">*</span></label>
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
                    <label for="onboarding-dob">Date of Birth <span class="required">*</span></label>
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
                      <small class="age-hint">Age: {{ calculatedAge() }} years ({{ getAgeGroup() }})</small>
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
                    <label for="onboarding-country">Country <span class="required">*</span></label>
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
                    <label for="onboarding-phone">Phone Number <small>(optional)</small></label>
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
                </div>
              </div>
            } @else if (currentStep() === 1) {
              <!-- Step 2: Team & Position -->
              <div class="step-content animate-fade-in">
                <div class="step-header">
                  <i class="pi pi-users step-icon"></i>
                  <div>
                    <h3>Team & Position</h3>
                    <p class="step-description">Tell us about your role on the field</p>
                  </div>
                </div>
                
                <div class="form-grid">
                  <div class="form-group">
                    <label for="onboarding-team">Team <span class="required">*</span></label>
                    <p-select
                      inputId="onboarding-team"
                      [options]="teams"
                      [(ngModel)]="onboardingData.team"
                      placeholder="Select your team"
                      [showClear]="true"
                      class="w-full"
                    ></p-select>
                  </div>
                  
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
                    <label for="onboarding-position">Primary Position <span class="required">*</span></label>
                    <p-select
                      inputId="onboarding-position"
                      [options]="positions"
                      [(ngModel)]="onboardingData.position"
                      placeholder="Select position"
                      class="w-full"
                    ></p-select>
                  </div>
                  
                  <div class="form-group">
                    <label for="onboarding-secondaryPosition">Secondary Position</label>
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
                      <label for="throwingArm">Throwing Arm <span class="required">*</span></label>
                      <div class="arm-toggle">
                        @for (arm of throwingArmOptions; track arm.value) {
                          <div 
                            class="arm-option"
                            [class.selected]="onboardingData.throwingArm === arm.value"
                            (click)="onboardingData.throwingArm = arm.value"
                          >
                            @if (onboardingData.throwingArm === arm.value) {
                              <i class="pi pi-check"></i>
                            }
                            {{ arm.label }}
                          </div>
                        }
                      </div>
                    </div>
                  }
                  
                  <div class="form-group span-2">
                    <label for="onboarding-experience">Experience Level <span class="required">*</span></label>
                    <p-select
                      inputId="onboarding-experience"
                      [options]="experienceLevels"
                      [(ngModel)]="onboardingData.experience"
                      placeholder="Select your experience"
                      class="w-full"
                    ></p-select>
                  </div>
                </div>
              </div>
            } @else if (currentStep() === 2) {
              <!-- Step 3: Physical Measurements -->
              <div class="step-content animate-fade-in">
                <div class="step-header">
                  <i class="pi pi-heart step-icon"></i>
                  <div>
                    <h3>Physical Measurements</h3>
                    <p class="step-description">Used for load calculations and benchmarks</p>
                  </div>
                </div>
                
                <div class="form-group">
                  <label>Preferred Units</label>
                  <div class="unit-toggle">
                    <div 
                      class="unit-option" 
                      [class.selected]="onboardingData.unitSystem === 'metric'"
                      (click)="onboardingData.unitSystem = 'metric'"
                    >
                      <i class="pi pi-globe"></i>
                      <span>Metric</span>
                      <small>cm / kg</small>
                    </div>
                    <div 
                      class="unit-option" 
                      [class.selected]="onboardingData.unitSystem === 'imperial'"
                      (click)="onboardingData.unitSystem = 'imperial'"
                    >
                      <i class="pi pi-flag"></i>
                      <span>Imperial</span>
                      <small>ft-in / lbs</small>
                    </div>
                  </div>
                </div>
                
                @if (onboardingData.unitSystem === 'metric') {
                  <div class="form-grid">
                    <div class="form-group">
                      <label for="onboarding-height">Height (cm) <span class="required">*</span></label>
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
                      <label for="onboarding-weight">Weight (kg) <span class="required">*</span></label>
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
                      <label for="onboarding-weightLbs">Weight (lbs) <span class="required">*</span></label>
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
                  <span>Your measurements help us calculate appropriate training loads and provide position-specific benchmarks.</span>
                </div>
              </div>
            } @else if (currentStep() === 3) {
              <!-- Step 4: Health & Injuries -->
              <div class="step-content animate-fade-in">
                <div class="step-header">
                  <i class="pi pi-shield step-icon"></i>
                  <div>
                    <h3>Health & Injury History</h3>
                    <p class="step-description">Helps us avoid recommending harmful exercises</p>
                  </div>
                </div>
                
                <div class="form-group">
                  <label>Current Injuries or Pain Areas</label>
                  <p class="field-hint">Add any areas where you're currently experiencing pain or recovering from injury</p>
                  
                  <div class="injury-input-row">
                    <p-select
                      [options]="injuryAreas"
                      [(ngModel)]="newInjury.area"
                      placeholder="Select area"
                      class="injury-area-select"
                    ></p-select>
                    <p-select
                      [options]="[{label:'Minor',value:'minor'},{label:'Moderate',value:'moderate'},{label:'Severe',value:'severe'}]"
                      [(ngModel)]="newInjury.severity"
                      placeholder="Severity"
                      class="injury-severity-select"
                    ></p-select>
                    <p-button 
                      icon="pi pi-plus" 
                      [rounded]="true"
                      [disabled]="!newInjury.area"
                      (onClick)="addCurrentInjury()"
                    ></p-button>
                  </div>
                  
                  @if (onboardingData.currentInjuries.length > 0) {
                    <div class="injury-list">
                      @for (injury of onboardingData.currentInjuries; track $index) {
                        <div class="injury-chip" [class]="'severity-' + injury.severity">
                          <span>{{ injury.area }} ({{ injury.severity }})</span>
                          <i class="pi pi-times" (click)="removeCurrentInjury($index)"></i>
                        </div>
                      }
                    </div>
                  }
                </div>
                
                <div class="form-group">
                  <label>Injury History</label>
                  <p class="field-hint">Select any significant past injuries (select all that apply)</p>
                  <div class="checkbox-grid">
                    @for (injury of injuryHistoryOptions; track injury.value) {
                      <div
                        class="checkbox-card"
                        [class.selected]="onboardingData.injuryHistory.includes(injury.value)"
                        [class.none-selected]="injury.value === 'none'"
                        (click)="toggleInjuryHistory(injury.value)"
                      >
                        <i [class]="injury.icon"></i>
                        <span>{{ injury.label }}</span>
                      </div>
                    }
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="medicalNotes">Additional Medical Notes <small>(optional)</small></label>
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
            } @else if (currentStep() === 4) {
              <!-- Step 5: Equipment -->
              <div class="step-content animate-fade-in">
                <div class="step-header">
                  <i class="pi pi-box step-icon"></i>
                  <div>
                    <h3>Available Equipment</h3>
                    <p class="step-description">What do you have access to for training?</p>
                  </div>
                </div>
                
                <div class="equipment-grid">
                  @for (item of equipmentOptions; track item.value) {
                    <div
                      class="equipment-card"
                      [class.selected]="onboardingData.equipmentAvailable.includes(item.value)"
                      [class.none-card]="item.value === 'none'"
                      (click)="toggleEquipment(item.value)"
                    >
                      <i [class]="item.icon"></i>
                      <span>{{ item.label }}</span>
                      @if (onboardingData.equipmentAvailable.includes(item.value)) {
                        <i class="pi pi-check check-icon"></i>
                      }
                    </div>
                  }
                </div>
                
                <div class="info-box success">
                  <i class="pi pi-lightbulb"></i>
                  <span>We'll recommend exercises based on what you have available. Bodyweight exercises are always an option!</span>
                </div>
              </div>
            } @else if (currentStep() === 5) {
              <!-- Step 6: Goals -->
              <div class="step-content animate-fade-in">
                <div class="step-header">
                  <i class="pi pi-flag step-icon"></i>
                  <div>
                    <h3>Training Goals</h3>
                    <p class="step-description">What do you want to achieve? (select all that apply)</p>
                  </div>
                </div>
                
                <div class="goals-grid">
                  @for (goal of goals; track goal.id) {
                    <div
                      class="goal-card"
                      [class.selected]="onboardingData.goals.includes(goal.id)"
                      (click)="toggleGoal(goal.id)"
                    >
                      <i [class]="goal.icon"></i>
                      <span>{{ goal.label }}</span>
                      @if (onboardingData.goals.includes(goal.id)) {
                        <i class="pi pi-check check-badge"></i>
                      }
                    </div>
                  }
                </div>
              </div>
            } @else if (currentStep() === 6) {
              <!-- Step 7: Schedule -->
              <div class="step-content animate-fade-in">
                <div class="step-header">
                  <i class="pi pi-calendar step-icon"></i>
                  <div>
                    <h3>Your Schedule</h3>
                    <p class="step-description">Help us recommend the best training times</p>
                  </div>
                </div>
                
                <div class="form-grid">
                  <div class="form-group span-2">
                    <label for="scheduleType">Work Schedule Type <span class="required">*</span></label>
                    <p-select
                      id="scheduleType"
                      [options]="scheduleTypes"
                      [(ngModel)]="onboardingData.scheduleType"
                      placeholder="Select your schedule type"
                      class="w-full"
                    ></p-select>
                  </div>
                  
                  <div class="form-group span-2">
                    <label for="practicesPerWeek">Team Practices Per Week</label>
                    <p-select
                      id="practicesPerWeek"
                      [options]="practiceFrequencies"
                      [(ngModel)]="onboardingData.practicesPerWeek"
                      placeholder="How many team practices?"
                      class="w-full"
                    ></p-select>
                  </div>
                  
                  <div class="form-group span-2">
                    <label>Practice Days</label>
                    <div class="days-grid">
                      @for (day of weekDays; track day.value) {
                        <div
                          class="day-chip"
                          [class.selected]="onboardingData.practiceDays.includes(day.value)"
                          (click)="togglePracticeDay(day.value)"
                        >
                          {{ day.label }}
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </div>
            } @else if (currentStep() === 7) {
              <!-- Step 8: Mobility & Recovery -->
              <div class="step-content animate-fade-in">
                <div class="step-header">
                  <i class="pi pi-refresh step-icon"></i>
                  <div>
                    <h3>Mobility & Recovery</h3>
                    <p class="step-description">Set up your daily recovery routine</p>
                  </div>
                </div>
                
                <div class="form-group">
                  <label>Morning Mobility <small>(10 min wake-up routine)</small></label>
                  <div class="preference-options compact">
                    @for (option of mobilityTimeOptions; track option.value) {
                      <div
                        class="preference-card"
                        [class.selected]="onboardingData.morningMobility === option.value"
                        (click)="onboardingData.morningMobility = option.value"
                      >
                        <i [class]="option.icon"></i>
                        <span class="preference-label">{{ option.label }}</span>
                      </div>
                    }
                  </div>
                </div>
                
                <div class="form-group">
                  <label>Evening Mobility <small>(15 min before bed)</small></label>
                  <div class="preference-options compact">
                    @for (option of mobilityTimeOptions; track option.value) {
                      <div
                        class="preference-card"
                        [class.selected]="onboardingData.eveningMobility === option.value"
                        (click)="onboardingData.eveningMobility = option.value"
                      >
                        <i [class]="option.icon"></i>
                        <span class="preference-label">{{ option.label }}</span>
                      </div>
                    }
                  </div>
                </div>
                
                <div class="form-group">
                  <label>Foam Rolling Preference</label>
                  <div class="preference-options compact">
                    @for (option of foamRollingOptions; track option.value) {
                      <div
                        class="preference-card"
                        [class.selected]="onboardingData.foamRollingTime === option.value"
                        (click)="onboardingData.foamRollingTime = option.value"
                      >
                        <i [class]="option.icon"></i>
                        <span class="preference-label">{{ option.label }}</span>
                      </div>
                    }
                  </div>
                </div>
                
                <div class="form-group">
                  <label>Rest Day Recovery</label>
                  <div class="preference-options">
                    @for (option of restDayOptions; track option.value) {
                      <div
                        class="preference-card"
                        [class.selected]="onboardingData.restDayPreference === option.value"
                        (click)="onboardingData.restDayPreference = option.value"
                      >
                        <i [class]="option.icon"></i>
                        <span class="preference-label">{{ option.label }}</span>
                        <span class="preference-desc">{{ option.description }}</span>
                      </div>
                    }
                  </div>
                </div>
              </div>
            } @else if (currentStep() === 8) {
              <!-- Step 9: Summary -->
              <div class="step-content animate-fade-in">
                <div class="step-header">
                  <i class="pi pi-check-circle step-icon success"></i>
                  <div>
                    <h3>You're All Set!</h3>
                    <p class="step-description">Review your profile and start training</p>
                  </div>
                </div>
                
                <div class="summary-grid">
                  <!-- Profile Card -->
                  <div class="summary-card">
                    <h4><i class="pi pi-user"></i> Profile</h4>
                    <div class="summary-content">
                      <div class="summary-row">
                        <span class="label">Name</span>
                        <span class="value">{{ onboardingData.name || 'Not set' }}</span>
                      </div>
                      <div class="summary-row">
                        <span class="label">Age</span>
                        <span class="value">{{ calculatedAge() || '?' }} years ({{ getAgeGroup() }})</span>
                      </div>
                      <div class="summary-row">
                        <span class="label">Gender</span>
                        <span class="value">{{ getGenderLabel(onboardingData.gender) }}</span>
                      </div>
                      <div class="summary-row">
                        <span class="label">Country</span>
                        <span class="value">{{ onboardingData.country || 'Not selected' }}</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Team Card -->
                  <div class="summary-card">
                    <h4><i class="pi pi-users"></i> Team</h4>
                    <div class="summary-content">
                      <div class="summary-row">
                        <span class="label">Team</span>
                        <span class="value">{{ getTeamLabel(onboardingData.team) }}</span>
                      </div>
                      <div class="summary-row">
                        <span class="label">Jersey</span>
                        <span class="value jersey-badge">#{{ onboardingData.jerseyNumber || '?' }}</span>
                      </div>
                      <div class="summary-row">
                        <span class="label">Position</span>
                        <span class="value">{{ getPositionLabel(onboardingData.position) }}</span>
                      </div>
                      @if (isQBSelected()) {
                        <div class="summary-row">
                          <span class="label">Throwing Arm</span>
                          <span class="value">{{ getThrowingArmLabel(onboardingData.throwingArm) }}</span>
                        </div>
                      }
                    </div>
                  </div>
                  
                  <!-- Physical Card -->
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
                        <span class="value">{{ getExperienceLabel(onboardingData.experience) }}</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Health Card -->
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
                          @if (onboardingData.injuryHistory.includes('none') || onboardingData.injuryHistory.length === 0) {
                            None 👍
                          } @else {
                            {{ onboardingData.injuryHistory.length }} past injury(s)
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Schedule Card -->
                  <div class="summary-card">
                    <h4><i class="pi pi-calendar"></i> Schedule</h4>
                    <div class="summary-content">
                      <div class="summary-row">
                        <span class="label">Schedule Type</span>
                        <span class="value">{{ getScheduleLabel(onboardingData.scheduleType) }}</span>
                      </div>
                      <div class="summary-row">
                        <span class="label">Practices/Week</span>
                        <span class="value">{{ onboardingData.practicesPerWeek || 0 }}</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Recovery Card -->
                  <div class="summary-card">
                    <h4><i class="pi pi-refresh"></i> Recovery</h4>
                    <div class="summary-content">
                      <div class="summary-row">
                        <span class="label">Morning Mobility</span>
                        <span class="value">{{ getMobilityLabel(onboardingData.morningMobility) }}</span>
                      </div>
                      <div class="summary-row">
                        <span class="label">Foam Rolling</span>
                        <span class="value">{{ getFoamRollingLabel(onboardingData.foamRollingTime) }}</span>
                      </div>
                      <div class="summary-row">
                        <span class="label">Rest Days</span>
                        <span class="value">{{ getRestDayOptionLabel(onboardingData.restDayPreference) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="summary-note success">
                  <i class="pi pi-check-circle"></i>
                  <span>Your personalized training plan is ready! You can update these settings anytime in your profile.</span>
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
  styleUrls: ["./onboarding.component.scss"],
})
export class OnboardingComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private toastService = inject(ToastService);
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);

  currentStep = signal(0);
  isCompleting = signal(false);
  isLoading = signal(true);
  lastSaved = signal<Date | null>(null);
  isSaving = signal(false);

  // Auto-save subject
  private autoSaveSubject = new Subject<void>();
  private autoSaveSubscription: any;
  private readonly STORAGE_KEY = "flagfit_onboarding_draft";

  // Team options
  teams = [
    { label: "Ljubljana Frogs - International", value: "ljubljana_frogs_international" },
    { label: "Ljubljana Frogs - Domestic", value: "ljubljana_frogs_domestic" },
    { label: "American Samoa National Team - Men", value: "american_samoa_men" },
    { label: "American Samoa National Team - Women", value: "american_samoa_women" },
  ];

  // Position options - updated for flag football
  positions = [
    { label: "Quarterback (QB)", value: "QB" },
    { label: "Wide Receiver (WR)", value: "WR" },
    { label: "Center", value: "Center" },
    { label: "Defensive Back (DB)", value: "DB" },
    { label: "Rusher", value: "Rusher" },
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
      description: "Recommended for best results"
    },
    { 
      label: "Most Days", 
      value: "most_days", 
      icon: "pi pi-clock",
      description: "5-6 days per week"
    },
    { 
      label: "When I Can", 
      value: "flexible", 
      icon: "pi pi-calendar",
      description: "Flexible schedule"
    },
    { 
      label: "Skip This", 
      value: "skip", 
      icon: "pi pi-times",
      description: "Not for me right now"
    },
  ];

  // Foam rolling preferences
  foamRollingOptions = [
    { 
      label: "After Practice", 
      value: "after_practice", 
      icon: "pi pi-flag",
      description: "Best for recovery"
    },
    { 
      label: "Before Bed", 
      value: "before_bed", 
      icon: "pi pi-moon",
      description: "Helps with sleep"
    },
    { 
      label: "Both", 
      value: "both", 
      icon: "pi pi-check-circle",
      description: "Maximum recovery"
    },
    { 
      label: "When Sore", 
      value: "when_needed", 
      icon: "pi pi-exclamation-circle",
      description: "As needed basis"
    },
  ];

  // Rest day preferences
  restDayOptions = [
    { 
      label: "Full Recovery", 
      value: "full", 
      icon: "pi pi-heart",
      description: "Stretching + Foam Rolling (35 min)"
    },
    { 
      label: "Light Stretching", 
      value: "light", 
      icon: "pi pi-minus",
      description: "Just stretching (20 min)"
    },
    { 
      label: "Active Recovery", 
      value: "active", 
      icon: "pi pi-refresh",
      description: "Morning + Stretching + Evening (45 min)"
    },
    { 
      label: "Complete Rest", 
      value: "none", 
      icon: "pi pi-stop",
      description: "No structured routine"
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
    { label: "🇻🇨 Saint Vincent and the Grenadines", value: "Saint Vincent and the Grenadines" },
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
    { label: "Hamstring Strain", value: "hamstring_strain", icon: "pi pi-exclamation-circle" },
    { label: "Ankle Sprain", value: "ankle_sprain", icon: "pi pi-exclamation-circle" },
    { label: "Shoulder Injury", value: "shoulder", icon: "pi pi-exclamation-circle" },
    { label: "Concussion", value: "concussion", icon: "pi pi-exclamation-triangle" },
    { label: "Back Injury", value: "back", icon: "pi pi-exclamation-circle" },
    { label: "Knee Injury (other)", value: "knee_other", icon: "pi pi-exclamation-circle" },
    { label: "Muscle Tear", value: "muscle_tear", icon: "pi pi-exclamation-triangle" },
    { label: "Stress Fracture", value: "stress_fracture", icon: "pi pi-exclamation-triangle" },
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
    { label: "Agility Ladder", value: "agility_ladder", icon: "pi pi-th-large" },
    { label: "Cones / Markers", value: "cones", icon: "pi pi-map-marker" },
    { label: "Medicine Ball", value: "medicine_ball", icon: "pi pi-circle-fill" },
    { label: "Football", value: "football", icon: "pi pi-star" },
    { label: "Gym Access", value: "gym", icon: "pi pi-building" },
    { label: "None / Bodyweight Only", value: "none", icon: "pi pi-user" },
  ];

  // Notification preferences
  notificationOptions = [
    { label: "Training Reminders", value: "training", icon: "pi pi-calendar" },
    { label: "Recovery Alerts", value: "recovery", icon: "pi pi-heart" },
    { label: "Team Updates", value: "team", icon: "pi pi-users" },
    { label: "Performance Insights", value: "insights", icon: "pi pi-chart-line" },
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
    
    // Step 2: Team & Position
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
  };

  steps = signal<OnboardingStep[]>([
    { label: "Personal", icon: "pi pi-user", completed: false },
    { label: "Team", icon: "pi pi-users", completed: false },
    { label: "Physical", icon: "pi pi-heart", completed: false },
    { label: "Health", icon: "pi pi-shield", completed: false },
    { label: "Equipment", icon: "pi pi-box", completed: false },
    { label: "Goals", icon: "pi pi-flag", completed: false },
    { label: "Schedule", icon: "pi pi-calendar", completed: false },
    { label: "Recovery", icon: "pi pi-refresh", completed: false },
    { label: "Summary", icon: "pi pi-check", completed: false },
  ]);

  // Computed progress percentage
  progress = computed(() => {
    const completed = this.steps().filter(s => s.completed).length;
    return Math.round((completed / this.steps().length) * 100);
  });

  // Computed age from DOB
  calculatedAge = computed(() => {
    if (!this.onboardingData.dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(this.onboardingData.dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  });

  // Check if QB position is selected
  isQBSelected = computed(() => {
    return this.onboardingData.position === "QB" || 
           this.onboardingData.secondaryPosition === "QB";
  });

  async ngOnInit(): Promise<void> {
    // Set up auto-save with debounce
    this.autoSaveSubscription = this.autoSaveSubject
      .pipe(debounceTime(2000)) // Save after 2 seconds of no changes
      .subscribe(() => {
        this.saveDraft();
      });

    // Load saved draft first
    this.loadDraft();
    
    // Then load user profile
    await this.loadUserProfile();
  }

  ngOnDestroy(): void {
    // Save draft when leaving
    this.saveDraft();
    
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
          this.onboardingData.dateOfBirth = new Date(this.onboardingData.dateOfBirth);
        }
        
        this.lastSaved.set(new Date(draft.savedAt));
        this.toastService.info("Your previous progress has been restored", "Welcome back!");
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
        this.onboardingData.name = data.full_name || `${data.first_name || ""} ${data.last_name || ""}`.trim();
        this.onboardingData.position = data.position;
        this.onboardingData.experience = data.experience_level;
      }
    } catch (error) {
      this.logger.error("Failed to load user profile:", error);
    } finally {
      this.isLoading.set(false);
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
        const noneIndex = this.onboardingData.equipmentAvailable.indexOf("none");
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
    return this.genderOptions.find(g => g.value === value)?.label || "Not selected";
  }

  getThrowingArmLabel(value: string | null): string {
    return this.throwingArmOptions.find(a => a.value === value)?.label || "Not selected";
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
        return { valid: true };
        
      case 1: // Team & Position
        if (!this.onboardingData.team) {
          return { valid: false, message: "Please select your team" };
        }
        if (!this.onboardingData.position) {
          return { valid: false, message: "Please select your primary position" };
        }
        if (!this.onboardingData.experience) {
          return { valid: false, message: "Please select your experience level" };
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
          return { valid: false, message: "Please select at least one training goal" };
        }
        return { valid: true };
        
      case 6: // Schedule
        if (!this.onboardingData.scheduleType) {
          return { valid: false, message: "Please select your schedule type" };
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
      this.toastService.warn(validation.message || "Please complete all required fields");
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

  // Helper methods for summary display
  getTeamLabel(value: string | null): string {
    return this.teams.find(t => t.value === value)?.label || "Not selected";
  }

  getPositionLabel(value: string | null): string {
    return this.positions.find(p => p.value === value)?.label || "Not selected";
  }

  getExperienceLabel(value: string | null): string {
    return this.experienceLevels.find(e => e.value === value)?.label || "Not selected";
  }

  getScheduleLabel(value: string | null): string {
    return this.scheduleTypes.find(s => s.value === value)?.label || "Not selected";
  }

  getMobilityLabel(value: string): string {
    return this.mobilityTimeOptions.find(o => o.value === value)?.label || value;
  }

  getFoamRollingLabel(value: string): string {
    return this.foamRollingOptions.find(o => o.value === value)?.label || value;
  }

  getRestDayLabel(value: string): string {
    const option = this.restDayOptions.find(o => o.value === value);
    return option ? `${option.label} - ${option.description}` : value;
  }

  getRestDayOptionLabel(value: string): string {
    const option = this.restDayOptions.find(o => o.value === value);
    return option?.label || value;
  }

  getHeightDisplay(): string {
    if (this.onboardingData.unitSystem === "metric") {
      return this.onboardingData.heightCm ? `${this.onboardingData.heightCm} cm` : "?";
    } else {
      if (this.onboardingData.heightFt || this.onboardingData.heightIn) {
        return `${this.onboardingData.heightFt || 0}'${this.onboardingData.heightIn || 0}"`;
      }
      return "?";
    }
  }

  getWeightDisplay(): string {
    if (this.onboardingData.unitSystem === "metric") {
      return this.onboardingData.weightKg ? `${this.onboardingData.weightKg} kg` : "?";
    } else {
      return this.onboardingData.weightLbs ? `${this.onboardingData.weightLbs} lbs` : "?";
    }
  }

  // Convert imperial to metric for storage (database always stores metric)
  private getHeightInCm(): number | null {
    if (this.onboardingData.unitSystem === "metric") {
      return this.onboardingData.heightCm;
    } else {
      if (this.onboardingData.heightFt || this.onboardingData.heightIn) {
        const totalInches = (this.onboardingData.heightFt || 0) * 12 + (this.onboardingData.heightIn || 0);
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

      // Convert to metric for storage (database always stores in metric)
      const heightCm = this.getHeightInCm();
      const weightKg = this.getWeightInKg();

      // Prepare user profile data
      const profileData = {
        full_name: this.onboardingData.name,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: this.onboardingData.dateOfBirth?.toISOString().split('T')[0],
        gender: this.onboardingData.gender,
        country: this.onboardingData.country,
        phone: this.onboardingData.phone || null,
        position: this.onboardingData.position,
        secondary_position: this.onboardingData.secondaryPosition,
        throwing_arm: this.onboardingData.throwingArm,
        experience_level: this.onboardingData.experience,
        team: this.onboardingData.team,
        jersey_number: this.onboardingData.jerseyNumber,
        height_cm: heightCm,
        weight_kg: weightKg,
        preferred_units: this.onboardingData.unitSystem,
        updated_at: new Date().toISOString(),
      };

      // Update user profile
      const { error: updateError } = await this.supabaseService.client
        .from("users")
        .update(profileData)
        .eq("email", user.email);

      if (updateError) {
        const { error: insertError } = await this.supabaseService.client
          .from("users")
          .insert({
            email: user.email,
            ...profileData,
            is_active: true,
            email_verified: true,
          });

        if (insertError) {
          throw new Error(`Failed to save profile: ${insertError.message}`);
        }
      }

      // Save training preferences (schedule, mobility, recovery)
      await this.saveTrainingPreferences(user.email!);

      // Clear the draft after successful completion
      this.clearDraft();
      
      this.toastService.success("Your profile and training preferences have been set up!", "Welcome to FlagFit Pro!");

      setTimeout(() => {
        // Check for post-onboarding redirect (e.g., team invitation)
        const postOnboardingRedirect = sessionStorage.getItem("postOnboardingRedirect");
        if (postOnboardingRedirect) {
          sessionStorage.removeItem("postOnboardingRedirect");
          this.router.navigateByUrl(postOnboardingRedirect);
        } else {
          this.router.navigate(["/dashboard"]);
        }
      }, 1000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to complete setup. Please try again.";
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
        updated_at: new Date().toISOString(),
      };

      const { error } = await this.supabaseService.client
        .from("user_preferences")
        .upsert(preferences, { onConflict: "email" });

      if (error) {
        this.logger.info("Saving preferences to localStorage:", error.message);
        localStorage.setItem("flagfit_preferences", JSON.stringify(preferences));
      }
    } catch (e) {
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
}
