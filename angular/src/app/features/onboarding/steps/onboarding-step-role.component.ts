import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
} from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AutoComplete } from "primeng/autocomplete";
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
  imports: [ReactiveFormsModule, AutoComplete, SelectComponent],
  template: `
    <div class="ob-step">
      <div class="ob-hero-icon" aria-hidden="true">
        <i class="pi pi-users"></i>
      </div>

      <h2 class="ob-heading">I am a…</h2>
      <p class="ob-subtext">Tell us how you'll be using FlagFit Pro.</p>

      <!-- User type cards -->
      <div
        class="ob-card-grid ob-card-grid--2col"
        role="radiogroup"
        aria-label="User type"
        style="margin-bottom: var(--space-7);"
      >
        @for (type of userTypeOptions; track type.value) {
          <button
            type="button"
            role="radio"
            class="ob-card"
            [attr.aria-checked]="state.formData.userType === type.value"
            [attr.data-cy]="'user-type-' + type.value"
            (click)="state.selectUserType(type.value)"
            (keydown.enter)="state.selectUserType(type.value)"
            (keydown.space)="state.selectUserType(type.value); $event.preventDefault()"
          >
            <i [class]="type.icon" class="ob-card__icon"></i>
            <span class="ob-card__label">{{ type.label }}</span>
            <span class="ob-card__desc">{{ type.description }}</span>
            <span class="ob-card__check" aria-hidden="true">
              <i class="pi pi-check"></i>
            </span>
          </button>
        }
      </div>

      <!-- Staff role -->
      @if (state.formData.userType === 'staff') {
        <div class="ob-field">
          <label class="ob-label" for="ob-staff-role">
            Staff Role <span class="req" aria-hidden="true">*</span>
          </label>
          <app-select
            inputId="ob-staff-role"
            label=""
            [options]="staffRoleOptions"
            (change)="onStaffRoleSelect($event)"
            placeholder="Select your role"
            styleClass="ob-select-wrap"
          />
        </div>

        <div class="ob-field">
          <div class="ob-label" id="staff-vis-label">App Access</div>
          <p class="ob-field-hint">Select sections you need access to</p>
          <div
            class="ob-card-grid ob-card-grid--3col"
            role="group"
            aria-labelledby="staff-vis-label"
            style="margin-top: var(--space-2);"
          >
            @for (opt of staffVisibilityOptions; track opt.value) {
              <button
                type="button"
                role="checkbox"
                class="ob-card"
                [attr.aria-checked]="state.formData.staffVisibility.includes(opt.value)"
                [attr.data-cy]="'visibility-' + opt.value"
                (click)="state.toggleStaffVisibility(opt.value)"
                (keydown.enter)="state.toggleStaffVisibility(opt.value)"
                (keydown.space)="state.toggleStaffVisibility(opt.value); $event.preventDefault()"
              >
                <i [class]="opt.icon" class="ob-card__icon"></i>
                <span class="ob-card__label">{{ opt.label }}</span>
                <span class="ob-card__check" aria-hidden="true">
                  <i class="pi pi-check"></i>
                </span>
              </button>
            }
          </div>
        </div>
      }

      <!-- Team search -->
      <div class="ob-field ob-team-wrap">
        <label class="ob-label" for="ob-team">
          Team <span class="req" aria-hidden="true">*</span>
        </label>
        <p-autoComplete
          inputId="ob-team"
          [formControl]="teamControl"
          [suggestions]="state.teamSuggestions()"
          (completeMethod)="onCompleteMethod($event)"
          (onClear)="teamControl.setValue(null)"
          placeholder="Search or type your team name…"
          [minQueryLength]="0"
          [forceSelection]="false"
          [dropdown]="true"
          field="label"
          class="w-full"
        >
          <ng-template let-team #item>
            <div style="display:flex;align-items:center;gap:8px">
              <i class="pi pi-users" style="color:var(--ds-primary-green)"></i>
              <span>{{ team.label }}</span>
            </div>
          </ng-template>
        </p-autoComplete>
      </div>

      <!-- Player-specific fields -->
      @if (state.formData.userType === 'player') {
        <div class="ob-input-row">
          <div class="ob-field">
            <label class="ob-label" for="ob-position">
              Position <span class="req" aria-hidden="true">*</span>
            </label>
            <app-select
              inputId="ob-position"
              label=""
              [options]="positions"
              (change)="onPositionSelect($event)"
              placeholder="Select"
              styleClass="ob-select-wrap"
            />
          </div>
          <div class="ob-field">
            <label class="ob-label" for="ob-jersey">Jersey #</label>
            <input
              id="ob-jersey"
              type="number"
              class="ob-input"
              placeholder="#"
              [value]="state.formData.jerseyNumber ?? ''"
              (input)="onJerseyInput($event)"
            />
          </div>
        </div>

        <div class="ob-input-row">
          <div class="ob-field">
            <label class="ob-label" for="ob-secondary-position">
              Secondary Position
            </label>
            <app-select
              inputId="ob-secondary-position"
              label=""
              [options]="positions"
              (change)="onSecondaryPositionSelect($event)"
              placeholder="Optional"
              [showClear]="true"
              styleClass="ob-select-wrap"
            />
          </div>
          <div class="ob-field">
            <label class="ob-label" for="ob-experience">
              Experience <span class="req" aria-hidden="true">*</span>
            </label>
            <app-select
              inputId="ob-experience"
              label=""
              [options]="experienceLevels"
              (change)="onExperienceSelect($event)"
              placeholder="Select"
              styleClass="ob-select-wrap"
            />
          </div>
        </div>

        <!-- Throwing arm (QB only) -->
        @if (state.isQBSelected()) {
          <div class="ob-field">
            <div class="ob-label" id="ob-arm-label">
              Throwing Arm <span class="req" aria-hidden="true">*</span>
            </div>
            <div
              class="ob-seg-ctrl"
              role="radiogroup"
              aria-labelledby="ob-arm-label"
            >
              @for (arm of throwingArmOptions; track arm.value) {
                <button
                  type="button"
                  role="radio"
                  class="ob-seg-opt"
                  [class.ob-seg-opt--active]="state.formData.throwingArm === arm.value"
                  [attr.aria-checked]="state.formData.throwingArm === arm.value"
                  [attr.data-cy]="'arm-' + arm.value"
                  (click)="state.formData.throwingArm = arm.value"
                  (keydown.enter)="state.formData.throwingArm = arm.value"
                  (keydown.space)="state.formData.throwingArm = arm.value; $event.preventDefault()"
                >{{ arm.label }}</button>
              }
            </div>
          </div>
        }
      }
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
        if (!value) { this.state.formData.team = null; return; }
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

  onJerseyInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
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
