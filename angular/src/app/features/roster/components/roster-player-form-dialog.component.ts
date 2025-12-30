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
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { Player, POSITION_OPTIONS, STATUS_OPTIONS } from '../roster.models';

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
  status: 'active' | 'injured' | 'inactive';
}

@Component({
  selector: 'app-roster-player-form-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    SelectModule,
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
          <label for="name">Full Name *</label>
          <input 
            pInputText 
            id="name" 
            formControlName="name" 
            placeholder="Enter player name"
            class="w-full"
          />
        </div>
        
        <div class="form-row">
          <div class="form-field">
            <label for="position">Position *</label>
            <p-select 
              id="position"
              formControlName="position"
              [options]="positionOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select position"
              styleClass="w-full"
            ></p-select>
          </div>
          
          <div class="form-field">
            <label for="jersey">Jersey # *</label>
            <input 
              pInputText 
              id="jersey" 
              formControlName="jersey" 
              placeholder="00"
              class="w-full"
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-field">
            <label for="country">Country</label>
            <input 
              pInputText 
              id="country" 
              formControlName="country" 
              placeholder="Country"
              class="w-full"
            />
          </div>
          
          <div class="form-field">
            <label for="age">Age</label>
            <p-inputNumber 
              id="age" 
              formControlName="age" 
              [min]="16" 
              [max]="60"
              styleClass="w-full"
            ></p-inputNumber>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-field">
            <label for="height">Height</label>
            <input 
              pInputText 
              id="height" 
              formControlName="height" 
              placeholder="e.g., 6'2&quot;"
              class="w-full"
            />
          </div>
          
          <div class="form-field">
            <label for="weight">Weight</label>
            <input 
              pInputText 
              id="weight" 
              formControlName="weight" 
              placeholder="e.g., 210 lbs"
              class="w-full"
            />
          </div>
        </div>

        @if (showContactFields()) {
          <div class="form-row">
            <div class="form-field">
              <label for="email">Email</label>
              <input 
                pInputText 
                id="email" 
                formControlName="email" 
                placeholder="player@email.com"
                class="w-full"
              />
            </div>
            
            <div class="form-field">
              <label for="phone">Phone</label>
              <input 
                pInputText 
                id="phone" 
                formControlName="phone" 
                placeholder="+1 234 567 8900"
                class="w-full"
              />
            </div>
          </div>

          <div class="form-field">
            <label for="status">Status</label>
            <p-select 
              id="status"
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
  styles: [`
    .player-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      flex: 1;
    }

    .form-field label {
      font-weight: var(--font-weight-medium);
      font-size: var(--font-body-sm);
      color: var(--text-secondary);
    }

    .form-row {
      display: flex;
      gap: var(--space-4);
    }

    .w-full {
      width: 100%;
    }

    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
      }
    }
  `],
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
    name: ['', [Validators.required, Validators.minLength(2)]],
    position: ['', Validators.required],
    jersey: ['', Validators.required],
    country: [''],
    age: [null],
    height: [''],
    weight: [''],
    email: ['', Validators.email],
    phone: [''],
    status: ['active'],
  });

  // Options
  positionOptions = POSITION_OPTIONS;
  statusOptions = STATUS_OPTIONS;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editingPlayer'] || changes['visible']) {
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
          email: player.email || '',
          phone: player.phone || '',
          status: player.status,
        });
      } else if (this.visible() && !player) {
        this.playerForm.reset({ status: 'active' });
      }
    }
  }

  onSave(): void {
    if (this.playerForm.valid) {
      this.save.emit(this.playerForm.value as PlayerFormData);
    }
  }
}

