/**
 * Roster Player Form Dialog Component
 * Add/Edit player dialog
 *
 * Enhanced with Form Error Summary (WCAG 2.1 AA)
 */
import {
  Component,
  input,
  output,
  inject,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  computed,
} from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { PrimeTemplate } from "primeng/api";
import { Dialog } from "primeng/dialog";
import { InputText } from "primeng/inputtext";
import { Select } from "primeng/select";
import { InputNumber } from "primeng/inputnumber";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import {
  FormErrorSummaryComponent,
  FormError,
} from "../../../shared/components/form-error-summary/form-error-summary.component";
import { FormErrorService } from "../../../core/services/form-error.service";
import { Player, POSITION_OPTIONS, STATUS_OPTIONS } from "../roster.models";

export interface PlayerFormData {
  name: string;
  position: string;
  jersey: string;
  country: string;
  age: number | null;
  height: string;
  weight: string;
  email: string;
  phone: string;
  status: "active" | "injured" | "inactive";
}

@Component({
  selector: "app-roster-player-form-dialog",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    Dialog,
    PrimeTemplate,
    PrimeTemplate,
    InputText,
    Select,
    InputNumber,

    ButtonComponent,
    FormErrorSummaryComponent,
  ],
  template: `
    <p-dialog
      [visible]="visible()"
      (visibleChange)="visibleChange.emit($event)"
      [modal]="true"
      [header]="editingPlayer() ? 'Edit Player' : 'Add New Player'"
      [style]="{ width: '550px' }"
      [closable]="true"
    >
      <!-- Form Error Summary (WCAG 2.1 AA) -->
      <app-form-error-summary
        [errors]="formErrors()"
        (scrollToField)="scrollToField($event)"
      />

      <form [formGroup]="playerForm" class="player-form">
        <div class="form-field">
          <label for="roster-player-name">Full Name *</label>
          <input
            pInputText
            id="roster-player-name"
            name="name"
            formControlName="name"
            placeholder="e.g., John Smith"
            class="w-full"
            autocomplete="name"
          />
          <small class="field-hint">First and last name</small>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label for="roster-player-position">Position *</label>
            <p-select
              inputId="roster-player-position"
              formControlName="position"
              [options]="positionOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select primary position"
              styleClass="w-full"
            ></p-select>
          </div>

          <div class="form-field">
            <label for="roster-player-jersey">Jersey # *</label>
            <input
              pInputText
              id="roster-player-jersey"
              name="jersey"
              formControlName="jersey"
              placeholder="00-99"
              class="w-full"
              autocomplete="off"
            />
            <small class="field-hint">Number between 0-99</small>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label for="roster-player-country">Country</label>
            <input
              pInputText
              id="roster-player-country"
              name="country"
              formControlName="country"
              placeholder="e.g., United States"
              class="w-full"
              autocomplete="country-name"
            />
          </div>

          <div class="form-field">
            <label for="roster-player-age">Age</label>
            <p-inputNumber
              inputId="roster-player-age"
              formControlName="age"
              [min]="16"
              [max]="60"
              placeholder="16-60"
              styleClass="w-full"
            ></p-inputNumber>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label for="roster-player-height">Height</label>
            <input
              pInputText
              id="roster-player-height"
              name="height"
              formControlName="height"
              placeholder="e.g., 6'2&quot; or 188cm"
              class="w-full"
              autocomplete="off"
            />
            <small class="field-hint">Format: 6'2" or 188cm</small>
          </div>

          <div class="form-field">
            <label for="roster-player-weight">Weight</label>
            <input
              pInputText
              id="roster-player-weight"
              name="weight"
              formControlName="weight"
              placeholder="e.g., 210 lbs or 95kg"
              class="w-full"
              autocomplete="off"
            />
            <small class="field-hint">Format: 210 lbs or 95kg</small>
          </div>
        </div>

        @if (showContactFields()) {
          <div class="form-row">
            <div class="form-field">
              <label for="roster-player-email">Email</label>
              <input
                pInputText
                id="roster-player-email"
                name="email"
                formControlName="email"
                placeholder="player@example.com"
                class="w-full"
                autocomplete="email"
              />
              <small class="field-hint">Must be a valid email address</small>
            </div>

            <div class="form-field">
              <label for="roster-player-phone">Phone</label>
              <input
                pInputText
                id="roster-player-phone"
                name="phone"
                formControlName="phone"
                placeholder="+1 234-567-8900"
                class="w-full"
                autocomplete="tel"
              />
            </div>
          </div>

          <div class="form-field">
            <label for="roster-player-status">Status</label>
            <p-select
              inputId="roster-player-status"
              formControlName="status"
              [options]="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select status"
              styleClass="w-full"
            ></p-select>
          </div>
        }
      </form>

      <ng-template pTemplate="footer">
        <app-button
          variant="text"
          iconLeft="pi-times"
          (clicked)="visibleChange.emit(false)"
          >Cancel</app-button
        >
        <app-button
          iconLeft="pi-check"
          [loading]="isSaving()"
          [disabled]="!playerForm.valid || isSaving()"
          (clicked)="onSave()"
          >{{ editingPlayer() ? 'Save Changes' : 'Add Player' }}</app-button
        >
      </ng-template>
    </p-dialog>
  `,
  styleUrl: "./roster-player-form-dialog.component.scss",
})
export class RosterPlayerFormDialogComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private formErrorService = inject(FormErrorService);

  // Inputs
  visible = input<boolean>(false);
  editingPlayer = input<Player | null>(null);
  isSaving = input<boolean>(false);
  showContactFields = input<boolean>(true);

  // Outputs
  visibleChange = output<boolean>();
  save = output<PlayerFormData>();

  // Form
  playerForm: FormGroup = this.fb.group({
    name: ["", [Validators.required, Validators.minLength(2)]],
    position: ["", Validators.required],
    jersey: ["", Validators.required],
    country: [""],
    age: [null],
    height: [""],
    weight: [""],
    email: ["", Validators.email],
    phone: [""],
    status: ["active"],
  });

  // Options
  positionOptions = POSITION_OPTIONS;
  statusOptions = STATUS_OPTIONS;

  // Computed: Form errors for error summary
  formErrors = computed<FormError[]>(() => {
    const errors: FormError[] = [];
    const form = this.playerForm;

    // Only show errors after form is touched/submitted
    if (!form.touched && !form.dirty) {
      return errors;
    }

    // Name validation
    const nameControl = form.get("name");
    if (nameControl?.invalid && (nameControl.dirty || nameControl.touched)) {
      if (nameControl.errors?.["required"]) {
        errors.push({
          field: "roster-player-name",
          fieldLabel: "Full Name",
          message: "Player name is required",
          suggestion: "Enter the player's full name (first and last)",
        });
      } else if (nameControl.errors?.["minlength"]) {
        errors.push({
          field: "roster-player-name",
          fieldLabel: "Full Name",
          message: "Name must be at least 2 characters",
        });
      }
    }

    // Position validation
    const positionControl = form.get("position");
    if (
      positionControl?.invalid &&
      (positionControl.dirty || positionControl.touched)
    ) {
      errors.push({
        field: "roster-player-position",
        fieldLabel: "Position",
        message: "Position is required",
        suggestion: "Select the player's primary position on the field",
      });
    }

    // Jersey validation
    const jerseyControl = form.get("jersey");
    if (
      jerseyControl?.invalid &&
      (jerseyControl.dirty || jerseyControl.touched)
    ) {
      errors.push({
        field: "roster-player-jersey",
        fieldLabel: "Jersey Number",
        message: "Jersey number is required",
        suggestion: "Enter a number between 0-99",
      });
    }

    // Email validation
    const emailControl = form.get("email");
    if (
      emailControl?.invalid &&
      emailControl.value &&
      (emailControl.dirty || emailControl.touched)
    ) {
      errors.push({
        field: "roster-player-email",
        fieldLabel: "Email Address",
        message: "Enter a valid email address",
        suggestion: "Format: player@example.com",
      });
    }

    return errors;
  });

  /**
   * Scroll to field with error
   */
  scrollToField(fieldId: string): void {
    this.formErrorService.scrollToField(fieldId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["editingPlayer"] || changes["visible"]) {
      const player = this.editingPlayer();
      if (player && this.visible()) {
        this.playerForm.patchValue({
          name: player.name,
          position: player.position,
          jersey: player.jersey,
          country: player.country,
          age: player.age,
          height: player.height,
          weight: player.weight,
          email: player.email || "",
          phone: player.phone || "",
          status: player.status,
        });
      } else if (this.visible() && !player) {
        this.playerForm.reset({ status: "active" });
      }
    }
  }

  onSave(): void {
    if (this.playerForm.valid) {
      this.save.emit(this.playerForm.value as PlayerFormData);
    } else {
      // Mark all fields as touched to trigger error display
      Object.keys(this.playerForm.controls).forEach((key) => {
        this.playerForm.get(key)?.markAsTouched();
      });
    }
  }
}
