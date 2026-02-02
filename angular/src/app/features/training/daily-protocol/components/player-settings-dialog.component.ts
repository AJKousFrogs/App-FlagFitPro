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

import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  model,
  output,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Checkbox } from "primeng/checkbox";
import { DatePicker } from "primeng/datepicker";
import { Dialog } from "primeng/dialog";
import { PrimeTemplate } from "primeng/api";
import { InputText } from "primeng/inputtext";
import { MultiSelect } from "primeng/multiselect";
import { Select } from "primeng/select";
import { firstValueFrom } from "rxjs";
import { ButtonComponent } from "../../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../../shared/components/button/icon-button.component";

import { ApiService } from "../../../../core/services/api.service";
import {
  LoggerService,
  toLogContext,
} from "../../../../core/services/logger.service";

export interface FlagPracticeSlot {
  day: number; // 0-6 (Sunday-Saturday)
  dayName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  expectedThrows?: number; // For QBs
}

export interface RoutineSlot {
  id: string;
  label: string;
  time: string;
  description?: string;
  icon?: string;
}

export interface PlayerSettings {
  primaryPosition: string;
  secondaryPosition?: string;
  birthDate?: Date;
  flagPracticeSchedule: FlagPracticeSlot[];
  preferredTrainingDays: number[];
  dailyRoutine: RoutineSlot[];
  maxSessionsPerWeek: number;
  hasGymAccess: boolean;
  hasFieldAccess: boolean;
  warmupFocus?: string | null;
}

interface PositionOption {
  label: string;
  value: string | null;
  description: string;
}

interface DayOption {
  label: string;
  value: number;
}

@Component({
  selector: "app-player-settings-dialog",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    Dialog,
    PrimeTemplate,
    Select,
    DatePicker,
    Checkbox,
    InputText,
    MultiSelect,

    ButtonComponent,
    IconButtonComponent,
  ],
  template: `
    <p-dialog
      header="Training Settings"
      [modal]="true"
      [visible]="visible()"
      (visibleChange)="onVisibleChange($event)"
      [breakpoints]="{ '640px': '95vw' }"
      [draggable]="false"
      [resizable]="false"
      styleClass="player-settings-dialog"
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
              styleClass="w-full"
              (onValueChange)="updatePositionDescription()"
            ></p-select>
            @if (selectedPositionDescription()) {
              <small class="field-hint">{{
                selectedPositionDescription()
              }}</small>
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
              styleClass="w-full"
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
              styleClass="full-width"
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

        <!-- Availability Schedule -->
        <div class="form-section">
          <h4>Availability</h4>
          <p class="section-description">
            This does not schedule team practice. Coaches schedule team
            activities.
          </p>
          <p class="section-description section-description--note">
            Add your typical training times for reference. This information
            helps coaches understand your availability but does not create team
            practices.
          </p>

          @for (slot of settings.flagPracticeSchedule; track slot.day) {
            <div class="practice-slot">
              <div class="slot-header">
                <span class="day-name">{{ slot.dayName }}</span>
                <app-icon-button
                  icon="pi-trash"
                  variant="text"
                  size="sm"
                  (clicked)="removePracticeSlot(slot.day)"
                  ariaLabel="Remove practice slot"
                  tooltip="Remove"
                />
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
                @if (settings.primaryPosition === "quarterback") {
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
                styleClass="w-full"
              ></p-select>
              <app-button
                iconLeft="pi-plus"
                [disabled]="selectedNewDay === null"
                (clicked)="addPracticeSlot()"
                >Add</app-button
              >
            </div>
          }
        </div>

        <!-- Daily Routine -->
        <div class="form-section">
          <h4>My Daily Routine</h4>
          <p class="section-description">
            Set your preferred times for daily activities.
          </p>

          <div class="routine-list">
            @for (slot of settings.dailyRoutine; track slot.id) {
              <div class="routine-field">
                <div class="routine-label">
                  <i [class]="slot.icon" class="mr-2"></i>
                  <span>{{ slot.label }}</span>
                </div>
                <input
                  pInputText
                  type="time"
                  [(ngModel)]="slot.time"
                  class="routine-time-input"
                />
              </div>
            }
          </div>
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
              styleClass="w-full"
            ></p-multiselect>
          </div>

          <div class="form-field checkbox-group">
            <p-checkbox
              [(ngModel)]="settings.hasGymAccess"
              [binary]="true"
              variant="filled"
              inputId="gymAccess"
            ></p-checkbox>
            <label for="gymAccess">I have gym access</label>
          </div>

          <div class="form-field checkbox-group">
            <p-checkbox
              [(ngModel)]="settings.hasFieldAccess"
              [binary]="true"
              variant="filled"
              inputId="fieldAccess"
            ></p-checkbox>
            <label for="fieldAccess">I have field access</label>
          </div>

          <div class="form-field">
            <label for="warmupFocus">Warm-up Focus</label>
            <p-select
              id="warmupFocus"
              [options]="warmupFocusOptions"
              [(ngModel)]="settings.warmupFocus"
              optionLabel="label"
              optionValue="value"
              placeholder="Auto (use position)"
              styleClass="w-full"
            ></p-select>
            <small class="field-hint">
              Overrides the warm-up flow without changing your primary position.
            </small>
          </div>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <app-button variant="outlined" (clicked)="onCancel()"
          >Cancel</app-button
        >
        <app-button
          iconLeft="pi-check"
          [loading]="isSaving()"
          (clicked)="onSave()"
          >Save Settings</app-button
        >
      </ng-template>
    </p-dialog>
  `,
  styleUrl: "./player-settings-dialog.component.scss",
})
export class PlayerSettingsDialogComponent {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  // Angular 21 signal-based inputs/outputs
  readonly visible = model(false);
  readonly settingsSaved = output<PlayerSettings>();

  // Form state
  settings: PlayerSettings = {
    primaryPosition: "wr_db",
    secondaryPosition: undefined,
    birthDate: undefined,
    flagPracticeSchedule: [], // Internal name - API maps to availabilitySchedule
    preferredTrainingDays: [1, 2, 4, 5, 6], // Mon, Tue, Thu, Fri, Sat
    dailyRoutine: [
      { id: "wake", label: "Wake Up", time: "07:00", icon: "pi-sun" },
      { id: "breakfast", label: "Breakfast", time: "08:15", icon: "pi-apple" },
      {
        id: "work_start",
        label: "Work/Study Start",
        time: "09:00",
        icon: "pi-briefcase",
      },
      { id: "lunch", label: "Lunch", time: "12:30", icon: "pi-utensils" },
      {
        id: "work_end",
        label: "Work/Study End",
        time: "17:00",
        icon: "pi-home",
      },
      {
        id: "training",
        label: "Daily Training",
        time: "18:00",
        icon: "pi-bolt",
      },
      {
        id: "shower",
        label: "Shower (Hot)",
        time: "20:00",
        icon: "pi-info-circle",
      },
      { id: "sleep", label: "Sleep", time: "22:30", icon: "pi-moon" },
    ],
    maxSessionsPerWeek: 5,
    hasGymAccess: true,
    hasFieldAccess: true,
    warmupFocus: null,
  };

  readonly isSaving = signal(false);
  selectedNewDay: number | null = null;
  readonly maxBirthDate = new Date();

  // Options
  positions: PositionOption[] = [
    {
      label: "Quarterback",
      value: "quarterback",
      description:
        "Field general with throwing-specific training and arm care protocols",
    },
    {
      label: "Wide Receiver / Defensive Back",
      value: "wr_db",
      description:
        "Standard speed and agility training for receivers and coverage specialists",
    },
    {
      label: "Blitzer / Rusher",
      value: "blitzer",
      description: "Enhanced deceleration training for chase/stop demands",
    },
    {
      label: "Center",
      value: "center",
      description: "Balanced training with core stability focus",
    },
  ];

  allDays: DayOption[] = [
    { label: "Monday", value: 1 },
    { label: "Tuesday", value: 2 },
    { label: "Wednesday", value: 3 },
    { label: "Thursday", value: 4 },
    { label: "Friday", value: 5 },
    { label: "Saturday", value: 6 },
    { label: "Sunday", value: 0 },
  ];

  warmupFocusOptions: PositionOption[] = [
    { label: "Auto (use position)", value: null, description: "" },
    { label: "Quarterback", value: "quarterback", description: "" },
    {
      label: "Wide Receiver / Defensive Back",
      value: "wr_db",
      description: "",
    },
    { label: "Blitzer / Rusher", value: "blitzer", description: "" },
    { label: "Center", value: "center", description: "" },
  ];

  // Computed
  get availableDays(): DayOption[] {
    const usedDays = this.settings.flagPracticeSchedule.map((s) => s.day);
    return this.allDays.filter((d) => !usedDays.includes(d.value));
  }

  readonly selectedPositionDescription = signal<string>("");
  readonly calculatedAge = signal<number | null>(null);
  readonly ageRecoveryNote = signal<string>("");

  constructor() {
    // React to visible changes to load settings
    effect(() => {
      if (this.visible()) {
        this.loadSettings();
      }
    });
  }

  async loadSettings(): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await firstValueFrom(
        this.api.get("/api/player-settings"),
      );
      if (response?.success && response.data) {
        // Map availabilitySchedule from API to flagPracticeSchedule in component
        const availabilitySchedule =
          response.data.availabilitySchedule ||
          response.data.flagPracticeSchedule ||
          [];

        this.settings = {
          ...this.settings,
          ...response.data,
          flagPracticeSchedule: availabilitySchedule, // Map API field to component field
          birthDate: response.data.birthDate
            ? new Date(response.data.birthDate)
            : undefined,
        };
        this.updatePositionDescription();
        this.updateAge();
      }
    } catch (err) {
      this.logger.warn("Could not load player settings", toLogContext(err));
    }
  }

  onVisibleChange(newVisible: boolean): void {
    this.visible.set(newVisible);
  }

  updatePositionDescription(): void {
    const pos = this.positions.find(
      (p) => p.value === this.settings.primaryPosition,
    );
    this.selectedPositionDescription.set(pos?.description || "");
  }

  updateAge(): void {
    if (!this.settings.birthDate) {
      this.calculatedAge.set(null);
      this.ageRecoveryNote.set("");
      return;
    }

    const today = new Date();
    const birth = new Date(this.settings.birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    this.calculatedAge.set(age);

    // Set recovery note based on age
    if (age < 25) {
      this.ageRecoveryNote.set("Standard recovery");
    } else if (age < 30) {
      this.ageRecoveryNote.set("+10% recovery time");
    } else if (age < 35) {
      this.ageRecoveryNote.set("+25% recovery time");
    } else if (age < 40) {
      this.ageRecoveryNote.set("+40% recovery time");
    } else {
      this.ageRecoveryNote.set("+50% recovery time");
    }
  }

  addPracticeSlot(): void {
    if (this.selectedNewDay === null) return;

    const dayOption = this.allDays.find((d) => d.value === this.selectedNewDay);
    if (!dayOption) return;

    this.settings.flagPracticeSchedule.push({
      day: this.selectedNewDay,
      dayName: dayOption.label,
      startTime: "18:00",
      endTime: "19:30",
      durationMinutes: 90,
      expectedThrows:
        this.settings.primaryPosition === "quarterback" ? 50 : undefined,
    });

    // Sort by day
    this.settings.flagPracticeSchedule.sort((a, b) => a.day - b.day);
    this.selectedNewDay = null;
  }

  removePracticeSlot(day: number): void {
    this.settings.flagPracticeSchedule =
      this.settings.flagPracticeSchedule.filter((s) => s.day !== day);
  }

  updateSlotDuration(slot: FlagPracticeSlot): void {
    if (slot.startTime && slot.endTime) {
      const [startH, startM] = slot.startTime.split(":").map(Number);
      const [endH, endM] = slot.endTime.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      slot.durationMinutes = endMinutes - startMinutes;
    }
  }

  onCancel(): void {
    this.visible.set(false);
  }

  async onSave(): Promise<void> {
    this.isSaving.set(true);

    try {
      // Map flagPracticeSchedule to availabilitySchedule for API
      const payload = {
        ...this.settings,
        availabilitySchedule: this.settings.flagPracticeSchedule,
        birthDate: this.settings.birthDate?.toISOString().split("T")[0],
      };
      // Remove flagPracticeSchedule from payload (API expects availabilitySchedule)
      const { flagPracticeSchedule: _flagPracticeSchedule, ...finalPayload } =
        payload as typeof payload & { flagPracticeSchedule?: unknown };

      await firstValueFrom(this.api.post("/api/player-settings", finalPayload));

      this.settingsSaved.emit(this.settings);
      this.visible.set(false);
    } catch (err) {
      this.logger.error("Failed to save player settings", err);
    } finally {
      this.isSaving.set(false);
    }
  }
}
