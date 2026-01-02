/**
 * Player Settings Dialog Component
 *
 * Dialog for configuring player training settings:
 * - Position (QB, WR/DB, Blitzer, etc.)
 * - Flag practice schedule
 * - Birth date (for age-based recovery)
 * - Training preferences
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { DatePicker } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelect } from 'primeng/multiselect';
import { Select } from 'primeng/select';

import { ApiService } from '../../../../core/services/api.service';
import { LoggerService } from '../../../../core/services/logger.service';

export interface FlagPracticeSlot {
  day: number; // 0-6 (Sunday-Saturday)
  dayName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  expectedThrows?: number; // For QBs
}

export interface PlayerSettings {
  primaryPosition: string;
  secondaryPosition?: string;
  birthDate?: Date;
  flagPracticeSchedule: FlagPracticeSlot[];
  preferredTrainingDays: number[];
  maxSessionsPerWeek: number;
  hasGymAccess: boolean;
  hasFieldAccess: boolean;
}

interface PositionOption {
  label: string;
  value: string;
  description: string;
}

interface DayOption {
  label: string;
  value: number;
}

@Component({
  selector: 'app-player-settings-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    Select,
    DatePicker,
    Checkbox,
    InputTextModule,
    MultiSelect,
  ],
  template: `
    <p-dialog
      header="Training Settings"
      [modal]="true"
      [visible]="visible"
      (visibleChange)="onVisibleChange($event)"
      [style]="{ width: '500px' }"
      [breakpoints]="{ '640px': '95vw' }"
      [draggable]="false"
      [resizable]="false"
    >
      <div class="settings-form">
        <!-- Position Selection -->
        <div class="form-section">
          <h4>Position</h4>
          <div class="form-field">
            <label for="position">Primary Position *</label>
            <p-select
              id="position"
              [options]="positions"
              [(ngModel)]="settings.primaryPosition"
              optionLabel="label"
              optionValue="value"
              placeholder="Select position"
              [style]="{ width: '100%' }"
              (onChange)="updatePositionDescription()"
            ></p-select>
            @if (selectedPositionDescription()) {
              <small class="field-hint">{{ selectedPositionDescription() }}</small>
            }
          </div>

          <div class="form-field">
            <label for="secondaryPosition">Secondary Position</label>
            <p-select
              id="secondaryPosition"
              [options]="positions"
              [(ngModel)]="settings.secondaryPosition"
              optionLabel="label"
              optionValue="value"
              placeholder="Optional"
              [showClear]="true"
              [style]="{ width: '100%' }"
            ></p-select>
          </div>
        </div>

        <!-- Birth Date (for age-based recovery) -->
        <div class="form-section">
          <h4>Age-Based Recovery</h4>
          <div class="form-field">
            <label for="birthDate">Birth Date</label>
            <p-datepicker
              id="birthDate"
              [(ngModel)]="settings.birthDate"
              dateFormat="yy-mm-dd"
              [showIcon]="true"
              [maxDate]="maxBirthDate"
              [style]="{ width: '100%' }"
              placeholder="Select birth date"
              (onSelect)="updateAge()"
            ></p-datepicker>
            <small class="field-hint">
              Used to calculate age-based recovery recommendations.
              @if (calculatedAge() !== null) {
                <strong>Age: {{ calculatedAge() }}</strong>
                @if (ageRecoveryNote()) {
                  <span class="recovery-note"> - {{ ageRecoveryNote() }}</span>
                }
              }
            </small>
          </div>
        </div>

        <!-- Flag Practice Schedule -->
        <div class="form-section">
          <h4>Flag Football Practice Schedule</h4>
          <p class="section-description">
            Add your team practice times. Training will be adjusted on practice days.
          </p>

          @for (slot of settings.flagPracticeSchedule; track slot.day) {
            <div class="practice-slot">
              <div class="slot-header">
                <span class="day-name">{{ slot.dayName }}</span>
                <p-button
                  icon="pi pi-trash"
                  [rounded]="true"
                  [text]="true"
                  severity="danger"
                  size="small"
                  (onClick)="removePracticeSlot(slot.day)"
                ></p-button>
              </div>
              <div class="slot-times">
                <div class="time-field">
                  <label>Start</label>
                  <input
                    pInputText
                    type="time"
                    [(ngModel)]="slot.startTime"
                    (change)="updateSlotDuration(slot)"
                  />
                </div>
                <div class="time-field">
                  <label>End</label>
                  <input
                    pInputText
                    type="time"
                    [(ngModel)]="slot.endTime"
                    (change)="updateSlotDuration(slot)"
                  />
                </div>
                @if (settings.primaryPosition === 'quarterback') {
                  <div class="time-field">
                    <label>Expected Throws</label>
                    <input
                      pInputText
                      type="number"
                      [(ngModel)]="slot.expectedThrows"
                      placeholder="40-50"
                      min="0"
                      max="200"
                    />
                  </div>
                }
              </div>
            </div>
          }

          <!-- Add Practice Button -->
          @if (availableDays.length > 0) {
            <div class="add-practice">
              <p-select
                [options]="availableDays"
                [(ngModel)]="selectedNewDay"
                optionLabel="label"
                optionValue="value"
                placeholder="Add practice day..."
                [style]="{ width: '100%' }"
              ></p-select>
              <p-button
                icon="pi pi-plus"
                label="Add"
                [disabled]="selectedNewDay === null"
                (onClick)="addPracticeSlot()"
              ></p-button>
            </div>
          }
        </div>

        <!-- Training Preferences -->
        <div class="form-section">
          <h4>Training Preferences</h4>

          <div class="form-field">
            <label>Preferred Training Days</label>
            <p-multiselect
              [options]="allDays"
              [(ngModel)]="settings.preferredTrainingDays"
              optionLabel="label"
              optionValue="value"
              placeholder="Select days"
              [style]="{ width: '100%' }"
            ></p-multiselect>
          </div>

          <div class="form-field checkbox-group">
            <p-checkbox
              [(ngModel)]="settings.hasGymAccess"
              [binary]="true"
              inputId="gymAccess"
            ></p-checkbox>
            <label for="gymAccess">I have gym access</label>
          </div>

          <div class="form-field checkbox-group">
            <p-checkbox
              [(ngModel)]="settings.hasFieldAccess"
              [binary]="true"
              inputId="fieldAccess"
            ></p-checkbox>
            <label for="fieldAccess">I have field access</label>
          </div>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <p-button
          label="Cancel"
          [outlined]="true"
          (onClick)="onCancel()"
        ></p-button>
        <p-button
          label="Save Settings"
          icon="pi pi-check"
          (onClick)="onSave()"
          [loading]="isSaving()"
        ></p-button>
      </ng-template>
    </p-dialog>
  `,
  styleUrl: './player-settings-dialog.component.scss',
})
export class PlayerSettingsDialogComponent implements OnInit {
  private api = inject(ApiService);
  private logger = inject(LoggerService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() settingsSaved = new EventEmitter<PlayerSettings>();

  // Form state
  settings: PlayerSettings = {
    primaryPosition: 'wr_db',
    secondaryPosition: undefined,
    birthDate: undefined,
    flagPracticeSchedule: [],
    preferredTrainingDays: [1, 2, 4, 5, 6], // Mon, Tue, Thu, Fri, Sat
    maxSessionsPerWeek: 5,
    hasGymAccess: true,
    hasFieldAccess: true,
  };

  isSaving = signal(false);
  selectedNewDay: number | null = null;
  maxBirthDate = new Date();

  // Options
  positions: PositionOption[] = [
    { label: 'Quarterback', value: 'quarterback', description: 'Field general with throwing-specific training and arm care protocols' },
    { label: 'Wide Receiver / Defensive Back', value: 'wr_db', description: 'Standard speed and agility training for receivers and coverage specialists' },
    { label: 'Blitzer / Rusher', value: 'blitzer', description: 'Enhanced deceleration training for chase/stop demands' },
    { label: 'Center', value: 'center', description: 'Balanced training with core stability focus' },
  ];

  allDays: DayOption[] = [
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 },
    { label: 'Sunday', value: 0 },
  ];

  // Computed
  get availableDays(): DayOption[] {
    const usedDays = this.settings.flagPracticeSchedule.map((s) => s.day);
    return this.allDays.filter((d) => !usedDays.includes(d.value));
  }

  selectedPositionDescription = signal<string>('');
  calculatedAge = signal<number | null>(null);
  ageRecoveryNote = signal<string>('');

  ngOnInit(): void {
    this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await this.api.get('/api/player-settings').toPromise();
      if (response?.success && response.data) {
        this.settings = {
          ...this.settings,
          ...response.data,
          birthDate: response.data.birthDate ? new Date(response.data.birthDate) : undefined,
        };
        this.updatePositionDescription();
        this.updateAge();
      }
    } catch (err) {
      this.logger.warn('Could not load player settings', err);
    }
  }

  onVisibleChange(visible: boolean): void {
    this.visibleChange.emit(visible);
    if (visible) {
      this.loadSettings();
    }
  }

  updatePositionDescription(): void {
    const pos = this.positions.find((p) => p.value === this.settings.primaryPosition);
    this.selectedPositionDescription.set(pos?.description || '');
  }

  updateAge(): void {
    if (!this.settings.birthDate) {
      this.calculatedAge.set(null);
      this.ageRecoveryNote.set('');
      return;
    }

    const today = new Date();
    const birth = new Date(this.settings.birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    this.calculatedAge.set(age);

    // Set recovery note based on age
    if (age < 25) {
      this.ageRecoveryNote.set('Standard recovery');
    } else if (age < 30) {
      this.ageRecoveryNote.set('+10% recovery time');
    } else if (age < 35) {
      this.ageRecoveryNote.set('+25% recovery time');
    } else if (age < 40) {
      this.ageRecoveryNote.set('+40% recovery time');
    } else {
      this.ageRecoveryNote.set('+50% recovery time');
    }
  }

  addPracticeSlot(): void {
    if (this.selectedNewDay === null) return;

    const dayOption = this.allDays.find((d) => d.value === this.selectedNewDay);
    if (!dayOption) return;

    this.settings.flagPracticeSchedule.push({
      day: this.selectedNewDay,
      dayName: dayOption.label,
      startTime: '18:00',
      endTime: '19:30',
      durationMinutes: 90,
      expectedThrows: this.settings.primaryPosition === 'quarterback' ? 50 : undefined,
    });

    // Sort by day
    this.settings.flagPracticeSchedule.sort((a, b) => a.day - b.day);
    this.selectedNewDay = null;
  }

  removePracticeSlot(day: number): void {
    this.settings.flagPracticeSchedule = this.settings.flagPracticeSchedule.filter(
      (s) => s.day !== day
    );
  }

  updateSlotDuration(slot: FlagPracticeSlot): void {
    if (slot.startTime && slot.endTime) {
      const [startH, startM] = slot.startTime.split(':').map(Number);
      const [endH, endM] = slot.endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      slot.durationMinutes = endMinutes - startMinutes;
    }
  }

  onCancel(): void {
    this.visibleChange.emit(false);
  }

  async onSave(): Promise<void> {
    this.isSaving.set(true);

    try {
      const payload = {
        ...this.settings,
        birthDate: this.settings.birthDate?.toISOString().split('T')[0],
      };

      await this.api.post('/api/player-settings', payload).toPromise();

      this.settingsSaved.emit(this.settings);
      this.visibleChange.emit(false);
    } catch (err) {
      this.logger.error('Failed to save player settings', err);
    } finally {
      this.isSaving.set(false);
    }
  }
}
