import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AutoComplete } from "primeng/autocomplete";
import { FormInputComponent } from "../../../shared/components/form-input/form-input.component";
import { SelectComponent } from "../../../shared/components/select/select.component";
import {
  USER_TYPE_OPTIONS,
  STAFF_ROLE_OPTIONS,
  STAFF_VISIBILITY_OPTIONS,
  POSITIONS,
  THROWING_ARM_OPTIONS,
  EXPERIENCE_LEVELS,
} from "../constants/onboarding-options";
import { OnboardingStateService } from "../services/onboarding-state.service";

@Component({
  selector: "app-onboarding-step-role",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, AutoComplete, FormInputComponent, SelectComponent],
  template: `
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
                [class.selected]="state.formData.userType === type.value"
                [attr.aria-checked]="state.formData.userType === type.value"
                [attr.data-cy]="'user-type-' + type.value"
                (click)="state.selectUserType(type.value)"
                (keydown.enter)="state.selectUserType(type.value)"
                (keydown.space)="state.selectUserType(type.value); $event.preventDefault()"
              >
                <span class="type-radio">
                  @if (state.formData.userType === type.value) {
                    <i class="pi pi-check"></i>
                  }
                </span>
                <i [class]="type.icon" class="type-icon"></i>
                <div class="type-content">
                  <span class="type-label">{{ type.label }}</span>
                  <span class="type-description">{{ type.description }}</span>
                </div>
              </button>
            }
          </div>
        </div>

        <!-- Staff Role Selection -->
        @if (state.formData.userType === "staff") {
          <div class="form-group span-2">
            <app-select
              label="Staff Role *"
              [options]="staffRoleOptions"
              (change)="onStaffRoleSelect($event)"
              placeholder="Select your role"
              styleClass="w-full"
            />
          </div>

          <div class="form-group span-2">
            <label id="staffVisibility-label">App Sections to Access</label>
            <p class="field-hint">
              Select which parts of the app you need access to
            </p>
            <div
              class="checkbox-grid staff-visibility"
              role="group"
              aria-labelledby="staffVisibility-label"
            >
              @for (option of staffVisibilityOptions; track option.value) {
                <button
                  type="button"
                  role="checkbox"
                  class="checkbox-card"
                  [class.selected]="
                    state.formData.staffVisibility.includes(option.value)
                  "
                  [attr.aria-checked]="
                    state.formData.staffVisibility.includes(option.value)
                  "
                  [attr.data-cy]="'visibility-' + option.value"
                  (click)="state.toggleStaffVisibility(option.value)"
                  (keydown.enter)="state.toggleStaffVisibility(option.value)"
                  (keydown.space)="
                    state.toggleStaffVisibility(option.value);
                    $event.preventDefault()
                  "
                >
                  <span class="checkbox-indicator">
                    @if (state.formData.staffVisibility.includes(option.value)) {
                      <i class="pi pi-check"></i>
                    }
                  </span>
                  <i [class]="option.icon" class="checkbox-icon"></i>
                  <span class="checkbox-label">{{ option.label }}</span>
                </button>
              }
            </div>
          </div>
        }

        <!-- Team Selection -->
        <div class="form-group">
          <label for="onboarding-team"
            >Team <span class="required">*</span></label
          >
          <p-autoComplete
            inputId="onboarding-team"
            [formControl]="teamControl"
            [suggestions]="state.teamSuggestions()"
            (completeMethod)="onCompleteMethod($event)"
            (onClear)="teamControl.setValue(null)"
            placeholder="Search for your team or enter name..."
            [minQueryLength]="0"
            [forceSelection]="false"
            [dropdown]="true"
            field="label"
            class="w-full"
          >
            <ng-template let-team #item>
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

        @if (state.formData.userType === "player") {
          <div class="form-group jersey-input">
            <app-form-input
              label="Jersey #"
              [value]="state.formData.jerseyNumber?.toString() ?? ''"
              (valueChange)="onJerseyNumberInput($event)"
              placeholder="#"
              styleClass="w-full jersey-field"
            />
          </div>

          <div class="form-group">
            <app-select
              label="Primary Position *"
              [options]="positions"
              (change)="onPositionSelect($event)"
              placeholder="Select position"
              styleClass="w-full"
            />
          </div>

          <div class="form-group">
            <app-select
              label="Secondary Position"
              [options]="positions"
              (change)="onSecondaryPositionSelect($event)"
              placeholder="Optional"
              [showClear]="true"
              styleClass="w-full"
            />
          </div>

          @if (state.isQBSelected()) {
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
                    [class.selected]="state.formData.throwingArm === arm.value"
                    [attr.aria-checked]="
                      state.formData.throwingArm === arm.value
                    "
                    [attr.data-cy]="'throwing-arm-' + arm.value"
                    (click)="state.formData.throwingArm = arm.value"
                    (keydown.enter)="state.formData.throwingArm = arm.value"
                    (keydown.space)="
                      state.formData.throwingArm = arm.value;
                      $event.preventDefault()
                    "
                  >
                    <span class="arm-radio">
                      @if (state.formData.throwingArm === arm.value) {
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
            <app-select
              label="Experience Level *"
              [options]="experienceLevels"
              (change)="onExperienceSelect($event)"
              placeholder="Select your experience"
              styleClass="w-full"
            />
          </div>
        }
      </div>
    </div>
  `,
})
export class OnboardingStepRoleComponent {
  readonly state = inject(OnboardingStateService);
  private readonly destroyRef = inject(DestroyRef);
  readonly teamControl = new FormControl<
    string | { value: string; label?: string } | null
  >(this.state.formData.team);

  readonly userTypeOptions = USER_TYPE_OPTIONS;
  readonly staffRoleOptions = STAFF_ROLE_OPTIONS;
  readonly staffVisibilityOptions = STAFF_VISIBILITY_OPTIONS;
  readonly positions = POSITIONS;
  readonly throwingArmOptions = THROWING_ARM_OPTIONS;
  readonly experienceLevels = EXPERIENCE_LEVELS;

  constructor() {
    this.teamControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (!value) {
          this.state.formData.team = null;
          return;
        }
        this.state.onTeamSelect(value);
      });
  }

  onCompleteMethod(event: { query?: string } | Event): void {
    const query = "query" in event ? (event.query ?? "") : "";
    this.state.searchTeams(query);
  }

  onStaffRoleSelect(value: string | null | undefined): void {
    this.state.formData.staffRole = typeof value === "string" ? value : null;
  }

  onJerseyNumberInput(raw: string): void {
    this.state.formData.jerseyNumber =
      raw === "" ? null : Number.isFinite(Number(raw)) ? Number(raw) : null;
  }

  onPositionSelect(value: string | null | undefined): void {
    this.state.formData.position = typeof value === "string" ? value : null;
  }

  onSecondaryPositionSelect(value: string | null | undefined): void {
    this.state.formData.secondaryPosition = typeof value === "string" ? value : null;
  }

  onExperienceSelect(value: string | null | undefined): void {
    this.state.formData.experience = typeof value === "string" ? value : null;
  }
}
