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
import { DatePicker } from "primeng/datepicker";
import { InputText } from "primeng/inputtext";
import { MultiSelect, type MultiSelectChangeEvent } from "primeng/multiselect";
import { Select, type SelectChangeEvent } from "primeng/select";
import { firstValueFrom } from "rxjs";
import { ButtonComponent } from "../../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../../shared/components/button/icon-button.component";
import {
  AppDialogComponent,
  DialogFooterComponent,
  DialogHeaderComponent,
} from "../../../../shared/components/ui-components";

import { ApiService, API_ENDPOINTS } from "../../../../core/services/api.service";
import {
  LoggerService,
  toLogContext,
} from "../../../../core/services/logger.service";
import { UnifiedTrainingService } from "../../../../core/services/unified-training.service";
import { extractApiPayload } from "../../../../core/utils/api-response-mapper";
import {
  DIALOG_BREAKPOINTS,
} from "../../../../core/utils/design-tokens.util";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    Select,
    DatePicker,
    InputText,
    MultiSelect,
    IconButtonComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
    ButtonComponent,
  ],
  template: `
    <app-dialog
      [visible]="visible()"
      (visibleChange)="onVisibleChange($event)"
      [blockScroll]="true"
      [breakpoints]="dialogBreakpoints"
      [draggable]="false"
      [resizable]="false"
      dialogSize="lg"
      ariaLabel="Training settings"
    >
      <app-dialog-header
        icon="sliders-h"
        title="Training Settings"
        subtitle="Configure your availability and training preferences"
        (close)="onCancel()"
      />

      <div class="settings-form">
        <!-- Position Selection -->
        <div class="form-section">
          <h4>Position</h4>
          <div class="form-field">
            <label for="position">Primary Position *</label>
            <p-select
              id="position"
              [options]="positions"
              [ngModel]="settings.primaryPosition"
              (onChange)="onPrimaryPositionSelect($event)"
              optionLabel="label"
              optionValue="value"
              placeholder="Select position"
              class="w-full"
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
              [ngModel]="settings.secondaryPosition"
              (onChange)="onSecondaryPositionSelect($event)"
              optionLabel="label"
              optionValue="value"
              placeholder="Optional"
              [showClear]="true"
              class="w-full"
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
              [ngModel]="settings.birthDate"
              (onSelect)="onBirthDateChange($event)"
              dateFormat="yy-mm-dd"
              [showIcon]="true"
              [maxDate]="maxBirthDate"
              class="full-width"
              placeholder="Select birth date"
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
                    [value]="slot.startTime"
                    (input)="onSlotStartTimeInput(slot.day, $event)"
                  />
                </div>
                <div class="time-field">
                  <label>End</label>
                  <input
                    pInputText
                    type="time"
                    [value]="slot.endTime"
                    (input)="onSlotEndTimeInput(slot.day, $event)"
                  />
                </div>
                @if (settings.primaryPosition === "quarterback") {
                  <div class="time-field">
                    <label>Expected Throws</label>
                    <input
                      pInputText
                      type="number"
                      [value]="slot.expectedThrows ?? ''"
                      (input)="onSlotExpectedThrowsInput(slot.day, $event)"
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
                [ngModel]="selectedNewDay"
                (onChange)="onSelectedNewDaySelect($event)"
                optionLabel="label"
                optionValue="value"
                placeholder="Add practice day..."
                class="w-full"
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
                  [value]="slot.time"
                  (input)="onRoutineTimeInput(slot.id, $event)"
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
              [value]="settings.preferredTrainingDays"
              (onChange)="onPreferredTrainingDaysSelect($event)"
              optionLabel="label"
              optionValue="value"
              placeholder="Select days"
              class="w-full"
            ></p-multiselect>
          </div>

          <div class="form-field checkbox-group">
            <input
              id="gymAccess"
              type="checkbox"
              [checked]="settings.hasGymAccess"
              (change)="onHasGymAccessToggle($event)"
            />
            <label for="gymAccess">I have gym access</label>
          </div>

          <div class="form-field checkbox-group">
            <input
              id="fieldAccess"
              type="checkbox"
              [checked]="settings.hasFieldAccess"
              (change)="onHasFieldAccessToggle($event)"
            />
            <label for="fieldAccess">I have field access</label>
          </div>

          <div class="form-field">
            <label for="warmupFocus">Warm-up Focus</label>
            <p-select
              id="warmupFocus"
              [options]="warmupFocusOptions"
              [ngModel]="settings.warmupFocus"
              (onChange)="onWarmupFocusSelect($event)"
              optionLabel="label"
              optionValue="value"
              placeholder="Auto (use position)"
              class="w-full"
            ></p-select>
            <small class="field-hint">
              Overrides the warm-up flow without changing your primary position.
            </small>
          </div>
        </div>
      </div>

      <app-dialog-footer
        cancelLabel="Cancel"
        primaryLabel="Save Settings"
        primaryIcon="check"
        [loading]="isSaving()"
        (cancel)="onCancel()"
        (primary)="onSave()"
      />
    </app-dialog>
  `,
  styleUrl: "./player-settings-dialog.component.scss",
})
export class PlayerSettingsDialogComponent {
  readonly dialogBreakpoints = DIALOG_BREAKPOINTS.mobileFull;
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly trainingService = inject(UnifiedTrainingService);

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
      const response = await firstValueFrom(
        this.api.get<
          Partial<PlayerSettings> & {
            availabilitySchedule?: FlagPracticeSlot[];
            birthDate?: string;
          }
        >(API_ENDPOINTS.playerSettings.get),
      );
      const payload = extractApiPayload<
        Partial<PlayerSettings> & {
          availabilitySchedule?: FlagPracticeSlot[];
          birthDate?: string;
        }
      >(response);
      if (payload) {
        // Map availabilitySchedule from API to flagPracticeSchedule in component
        const availabilitySchedule =
          payload.availabilitySchedule ||
          payload.flagPracticeSchedule ||
          [];
        const dailyRoutine = Array.isArray(payload.dailyRoutine)
          ? payload.dailyRoutine.map((slot) => ({ ...slot }))
          : this.settings.dailyRoutine;

        this.settings = {
          ...this.settings,
          ...payload,
          flagPracticeSchedule: availabilitySchedule, // Map API field to component field
          dailyRoutine,
          birthDate: payload.birthDate
            ? new Date(payload.birthDate)
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

  onPrimaryPositionChange(value: string): void {
    this.settings = { ...this.settings, primaryPosition: value };
    this.updatePositionDescription();
  }

  onPrimaryPositionSelect(event: SelectChangeEvent): void {
    if (typeof event.value === "string") {
      this.onPrimaryPositionChange(event.value);
    }
  }

  onSecondaryPositionChange(value: string | null): void {
    this.settings = {
      ...this.settings,
      secondaryPosition: value ?? undefined,
    };
  }

  onSecondaryPositionSelect(event: SelectChangeEvent): void {
    this.onSecondaryPositionChange(
      typeof event.value === "string" ? event.value : null,
    );
  }

  onBirthDateChange(value: Date | null): void {
    this.settings = {
      ...this.settings,
      birthDate: value ?? undefined,
    };
    this.updateAge();
  }

  onSlotStartTimeChange(day: number, value: string): void {
    this.settings = {
      ...this.settings,
      flagPracticeSchedule: this.settings.flagPracticeSchedule.map((slot) =>
        slot.day === day ? { ...slot, startTime: value } : slot,
      ),
    };
    const slot = this.settings.flagPracticeSchedule.find((s) => s.day === day);
    if (slot) this.updateSlotDuration(slot);
  }

  onSlotStartTimeInput(day: number, event: Event): void {
    this.onSlotStartTimeChange(day, this.readInputValue(event));
  }

  onSlotEndTimeChange(day: number, value: string): void {
    this.settings = {
      ...this.settings,
      flagPracticeSchedule: this.settings.flagPracticeSchedule.map((slot) =>
        slot.day === day ? { ...slot, endTime: value } : slot,
      ),
    };
    const slot = this.settings.flagPracticeSchedule.find((s) => s.day === day);
    if (slot) this.updateSlotDuration(slot);
  }

  onSlotEndTimeInput(day: number, event: Event): void {
    this.onSlotEndTimeChange(day, this.readInputValue(event));
  }

  onSlotExpectedThrowsChange(day: number, value: number | string | null): void {
    const parsed =
      typeof value === "number" ? value : Number.parseInt(value ?? "", 10);
    this.settings = {
      ...this.settings,
      flagPracticeSchedule: this.settings.flagPracticeSchedule.map((slot) =>
        slot.day === day
          ? {
              ...slot,
              expectedThrows: Number.isFinite(parsed)
                ? parsed
                : slot.expectedThrows,
            }
          : slot,
      ),
    };
  }

  onSlotExpectedThrowsInput(day: number, event: Event): void {
    this.onSlotExpectedThrowsChange(day, this.readInputValue(event));
  }

  onSelectedNewDayChange(value: number | null): void {
    this.selectedNewDay = value;
  }

  onSelectedNewDaySelect(event: SelectChangeEvent): void {
    this.onSelectedNewDayChange(
      typeof event.value === "number" ? event.value : null,
    );
  }

  onRoutineTimeChange(slotId: string, value: string): void {
    this.settings = {
      ...this.settings,
      dailyRoutine: this.settings.dailyRoutine.map((slot) =>
        slot.id === slotId ? { ...slot, time: value } : slot,
      ),
    };
  }

  onRoutineTimeInput(slotId: string, event: Event): void {
    this.onRoutineTimeChange(slotId, this.readInputValue(event));
  }

  onPreferredTrainingDaysChange(value: number[] | null): void {
    this.settings = {
      ...this.settings,
      preferredTrainingDays: value ?? [],
    };
  }

  onPreferredTrainingDaysSelect(event: MultiSelectChangeEvent): void {
    this.onPreferredTrainingDaysChange(
      (event.value as number[] | null | undefined) ?? null,
    );
  }

  onHasGymAccessChange(value: boolean): void {
    this.settings = { ...this.settings, hasGymAccess: value };
  }

  onHasGymAccessToggle(event: Event): void {
    this.onHasGymAccessChange(this.readChecked(event));
  }

  onHasFieldAccessChange(value: boolean): void {
    this.settings = { ...this.settings, hasFieldAccess: value };
  }

  onHasFieldAccessToggle(event: Event): void {
    this.onHasFieldAccessChange(this.readChecked(event));
  }

  onWarmupFocusChange(value: string | null): void {
    this.settings = { ...this.settings, warmupFocus: value };
  }

  onWarmupFocusSelect(event: SelectChangeEvent): void {
    this.onWarmupFocusChange(
      typeof event.value === "string" ? event.value : null,
    );
  }

  private readInputValue(event: Event): string {
    return (event.target as HTMLInputElement | null)?.value ?? "";
  }

  private readChecked(event: Event): boolean {
    return (event.target as HTMLInputElement | null)?.checked ?? false;
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
        dailyRoutine: this.settings.dailyRoutine.map((slot) => ({ ...slot })),
        availabilitySchedule: this.settings.flagPracticeSchedule,
        birthDate: this.settings.birthDate?.toISOString().split("T")[0],
      };
      // Remove flagPracticeSchedule from payload (API expects availabilitySchedule)
      const { flagPracticeSchedule: _flagPracticeSchedule, ...finalPayload } =
        payload as typeof payload & { flagPracticeSchedule?: unknown };

      await firstValueFrom(
        this.api.post(API_ENDPOINTS.playerSettings.save, finalPayload),
      );

      this.trainingService.applyPlayerSettingsSnapshot({
        dailyRoutine: this.settings.dailyRoutine,
      });
      this.settingsSaved.emit(this.settings);
      this.visible.set(false);
    } catch (err) {
      this.logger.error("Failed to save player settings", err);
    } finally {
      this.isSaving.set(false);
    }
  }
}
