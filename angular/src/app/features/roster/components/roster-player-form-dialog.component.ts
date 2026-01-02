/**
 * Roster Player Form Dialog Component
 * Add/Edit player dialog
 */
import {
  Component,
  input,
  output,
  inject,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
} from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { Select } from "primeng/select";
import { InputNumberModule } from "primeng/inputnumber";
import { ButtonModule } from "primeng/button";
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
    DialogModule,
    InputTextModule,
    Select,
    InputNumberModule,
    ButtonModule,
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
      <form [formGroup]="playerForm" class="player-form">
        <div class="form-field">
          <label for="roster-player-name">Full Name *</label>
          <input
            pInputText
            id="roster-player-name"
            name="name"
            formControlName="name"
            placeholder="Enter player name"
            class="w-full"
            autocomplete="name"
          />
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
              placeholder="Select position"
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
              placeholder="00"
              class="w-full"
              autocomplete="off"
            />
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
              placeholder="Country"
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
              placeholder="e.g., 6'2&quot;"
              class="w-full"
              autocomplete="off"
            />
          </div>

          <div class="form-field">
            <label for="roster-player-weight">Weight</label>
            <input
              pInputText
              id="roster-player-weight"
              name="weight"
              formControlName="weight"
              placeholder="e.g., 210 lbs"
              class="w-full"
              autocomplete="off"
            />
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
                placeholder="player@email.com"
                class="w-full"
                autocomplete="email"
              />
            </div>

            <div class="form-field">
              <label for="roster-player-phone">Phone</label>
              <input
                pInputText
                id="roster-player-phone"
                name="phone"
                formControlName="phone"
                placeholder="+1 234 567 8900"
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
        <p-button
          label="Cancel"
          icon="pi pi-times"
          [text]="true"
          (onClick)="visibleChange.emit(false)"
        ></p-button>
        <p-button
          [label]="editingPlayer() ? 'Save Changes' : 'Add Player'"
          icon="pi pi-check"
          (onClick)="onSave()"
          [disabled]="!playerForm.valid || isSaving()"
          [loading]="isSaving()"
        ></p-button>
      </ng-template>
    </p-dialog>
  `,
  styleUrl: './roster-player-form-dialog.component.scss',
})
export class RosterPlayerFormDialogComponent implements OnChanges {
  private fb = inject(FormBuilder);

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
    }
  }
}
