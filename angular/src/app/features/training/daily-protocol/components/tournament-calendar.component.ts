/**
 * Tournament Calendar Component
 *
 * Displays upcoming tournaments with countdown and taper information.
 * Players can add personal tournaments, coaches can add national team events.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import { DatePipe } from "@angular/common";
import { AlertComponent } from "../../../../shared/components/alert/alert.component";
import { ButtonComponent } from "../../../../shared/components/button/button.component";
import { EmptyStateComponent } from "../../../../shared/components/empty-state/empty-state.component";
import { AppLoadingComponent } from "../../../../shared/components/loading/loading.component";
import { IconButtonComponent } from "../../../../shared/components/button/icon-button.component";
import { PageErrorStateComponent } from "../../../../shared/components/page-error-state/page-error-state.component";
import { DatePicker } from "primeng/datepicker";
import { InputNumber } from "primeng/inputnumber";
import { InputText } from "primeng/inputtext";
import { Select } from "primeng/select";
import { Tag } from "primeng/tag";
import { StatusTagComponent } from "../../../../shared/components/status-tag/status-tag.component";
import { Tooltip } from "primeng/tooltip";

import { ApiService, API_ENDPOINTS } from "../../../../core/services/api.service";
import { LoggerService } from "../../../../core/services/logger.service";
import { DialogService } from "../../../../core/ui/dialog.service";
import { ApiResponse } from "../../../../core/models/common.models";
import { DIALOG_WIDTHS } from "../../../../core/utils/design-tokens.util";
import { DesignTokens } from "../../../../shared/models/design-tokens";
import {
  AppDialogComponent,
  DialogFooterComponent,
  DialogHeaderComponent,
} from "../../../../shared/components/ui-components";

export interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  country?: string;
  city?: string;
  isPeakEvent: boolean;
  gamesExpected: number;
  throwsPerGameQb: number;
  eventType: "club" | "national_team" | "international" | "friendly";
  isNationalTeamEvent: boolean;
  taperWeeksBefore: number;
  notes?: string;
  externalUrl?: string;
  // Computed
  daysUntil?: number;
  taperStartDate?: string;
  isInTaperPeriod?: boolean;
}

interface EventTypeOption {
  label: string;
  value: string;
}

@Component({
  selector: "app-tournament-calendar",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    InputText,
    InputNumber,
    DatePicker,
    Select,
    Tag,
    StatusTagComponent,
    Tooltip,
    DatePipe,
    AlertComponent,

    ButtonComponent,
    IconButtonComponent,
    EmptyStateComponent,
    AppLoadingComponent,
    PageErrorStateComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
  ],
  template: `
    <div class="tournament-calendar">
      <div class="calendar-header">
        <h3>
          <i class="pi pi-trophy" aria-hidden="true"></i>
          Tournament Calendar
        </h3>
        <app-button
          variant="outlined"
          size="sm"
          iconLeft="pi-plus"
          (clicked)="openAddDialog()"
          >Add Tournament</app-button
        >
      </div>

      @if (isLoading()) {
        <app-loading message="Loading tournaments..." variant="inline" />
      } @else if (loadError() && tournaments().length === 0) {
        <app-page-error-state
          title="Unable to load tournaments"
          [message]="loadError()!"
          (retry)="retryLoadTournaments()"
        />
      } @else if (tournaments().length === 0) {
        <app-empty-state
          icon="pi-calendar-times"
          heading="No upcoming tournaments"
          description="Add your first tournament to plan your season."
          actionLabel="Add Your First Tournament"
          actionIcon="pi-plus"
          [actionHandler]="openAddDialogHandler"
        />
      } @else {
        <div class="tournament-list">
          @for (tournament of tournaments(); track tournament.id) {
            <div
              class="tournament-card"
              [class.peak-event]="tournament.isPeakEvent"
              [class.in-taper]="tournament.isInTaperPeriod"
            >
              <div class="tournament-main">
                <div class="tournament-info">
                  <div class="tournament-name">
                    {{ tournament.name }}
                    @if (tournament.isPeakEvent) {
                      <app-status-tag
                        value="PEAK"
                        severity="danger"
                        size="sm"
                      />
                    }
                    @if (tournament.isNationalTeamEvent) {
                      <app-status-tag
                        value="National Team"
                        severity="info"
                        size="sm"
                      />
                    }
                  </div>
                  <div class="tournament-details">
                    <span class="detail">
                      <i class="pi pi-calendar" aria-hidden="true"></i>
                      <span class="visually-hidden">Date:</span>
                      {{
                        formatDateRange(
                          tournament.startDate,
                          tournament.endDate
                        )
                      }}
                    </span>
                    @if (tournament.country) {
                      <span class="detail">
                        <i class="pi pi-map-marker" aria-hidden="true"></i>
                        <span class="visually-hidden">Location:</span>
                        {{ tournament.city ? tournament.city + ", " : ""
                        }}{{ tournament.country }}
                      </span>
                    }
                    <span class="detail">
                      <i class="pi pi-flag" aria-hidden="true"></i>
                      <span class="visually-hidden">Games:</span>
                      {{ tournament.gamesExpected }} games
                    </span>
                  </div>
                </div>

                <div class="tournament-countdown">
                  @if (
                    tournament.daysUntil !== undefined &&
                    tournament.daysUntil >= 0
                  ) {
                    <div class="countdown-number">
                      {{ tournament.daysUntil }}
                    </div>
                    <div class="countdown-label">days</div>
                  } @else {
                    <div class="countdown-label past">Past</div>
                  }
                </div>
              </div>

              @if (tournament.isInTaperPeriod) {
                <app-alert
                  class="taper-banner"
                  variant="warning"
                  density="compact"
                  title="Taper Period Active"
                  [message]="
                    'Training volume reduced to peak for this event. Started ' +
                    (tournament.taperStartDate | date: 'MMM d') +
                    '.'
                  "
                />
              } @else if (
                tournament.daysUntil !== undefined &&
                tournament.daysUntil > 0 &&
                tournament.daysUntil <= 21
              ) {
                <div class="taper-info">
                  <i class="pi pi-clock" aria-hidden="true"></i>
                  <span>
                    Taper starts
                    {{ tournament.taperStartDate | date: "MMM d" }} ({{
                      getTaperDaysUntil(tournament)
                    }}
                    days)
                  </span>
                </div>
              }

              <div class="tournament-actions">
                @if (tournament.externalUrl) {
                  <app-icon-button
                    icon="pi-external-link"
                    variant="text"
                    size="sm"
                    (clicked)="openExternalUrl(tournament.externalUrl)"
                    ariaLabel="Open tournament website"
                    tooltip="Open external link"
                  />
                }
                <app-icon-button
                  icon="pi-pencil"
                  variant="text"
                  size="sm"
                  (clicked)="editTournament(tournament)"
                  ariaLabel="Edit tournament"
                  tooltip="Edit"
                />
                <app-icon-button
                  icon="pi-trash"
                  variant="text"
                  size="sm"
                  (clicked)="deleteTournament(tournament)"
                  ariaLabel="Delete tournament"
                  tooltip="Delete"
                />
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Add/Edit Tournament Dialog -->
    <app-dialog
      [visible]="showDialog()"
      (visibleChange)="showDialog.set($event)"
      [blockScroll]="true"
      [breakpoints]="dialogBreakpoints"
      [draggable]="false"
      styleClass="training-tournament-dialog"
      [ariaLabel]="isEditing() ? 'Edit tournament' : 'Add tournament'"
    >
      <app-dialog-header
        icon="trophy"
        [title]="isEditing() ? 'Edit Tournament' : 'Add Tournament'"
        subtitle="Manage your upcoming events and taper windows"
        (close)="closeDialog()"
      />

      <div class="tournament-form">
        <div class="form-field">
          <label for="name">Tournament Name *</label>
          <input
            pInputText
            id="name"
            [value]="formData.name ?? ''"
            (input)="onFormNameChange(getInputValue($event))"
            placeholder="e.g., Adria Bowl 2026"
            class="w-full"
          />
        </div>

        <div class="form-row">
          <div class="form-field">
            <label for="startDate">Start Date *</label>
            <p-datepicker
              id="startDate"
              [ngModel]="formData.startDate"
              (onSelect)="onFormStartDateChange($event)"
              dateFormat="yy-mm-dd"
              [showIcon]="true"
              class="w-full"
            ></p-datepicker>
          </div>
          <div class="form-field">
            <label for="endDate">End Date *</label>
            <p-datepicker
              id="endDate"
              [ngModel]="formData.endDate"
              (onSelect)="onFormEndDateChange($event)"
              dateFormat="yy-mm-dd"
              [showIcon]="true"
              class="w-full"
            ></p-datepicker>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label for="country">Country</label>
            <input
              pInputText
              id="country"
              [value]="formData.country ?? ''"
              (input)="onFormCountryChange(getInputValue($event))"
              placeholder="e.g., Croatia"
              class="w-full"
            />
          </div>
          <div class="form-field">
            <label for="city">City</label>
            <input
              pInputText
              id="city"
              [value]="formData.city ?? ''"
              (input)="onFormCityChange(getInputValue($event))"
              placeholder="e.g., Zagreb"
              class="w-full"
            />
          </div>
        </div>

        <div class="form-field">
          <label for="eventType">Event Type</label>
          <p-select
            id="eventType"
            [options]="eventTypes"
            [ngModel]="formData.eventType"
            (onChange)="onFormEventTypeChange($event.value)"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          ></p-select>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label for="gamesExpected">Expected Games</label>
            <p-inputNumber
              id="gamesExpected"
              [ngModel]="formData.gamesExpected"
              (ngModelChange)="onFormGamesExpectedChange($event ?? null)"
              [min]="1"
              [max]="20"
              [showButtons]="true"
              class="w-full"
            ></p-inputNumber>
          </div>
          <div class="form-field">
            <label for="taperWeeks">Taper Weeks Before</label>
            <p-inputNumber
              id="taperWeeks"
              [ngModel]="formData.taperWeeksBefore"
              (ngModelChange)="onFormTaperWeeksBeforeChange($event ?? null)"
              [min]="0"
              [max]="4"
              [showButtons]="true"
              class="w-full"
            ></p-inputNumber>
          </div>
        </div>

        <div class="form-field checkbox-group">
          <input
            id="isPeakEvent"
            type="checkbox"
            [checked]="!!formData.isPeakEvent"
            (change)="onFormIsPeakEventChange(isChecked($event))"
          />
          <label for="isPeakEvent">
            <strong>Peak Event</strong> - Maximum taper and preparation
          </label>
        </div>

        @if (isCoach()) {
          <div class="form-field checkbox-group">
            <input
              id="isNationalTeam"
              type="checkbox"
              [checked]="!!formData.isNationalTeamEvent"
              (change)="onFormIsNationalTeamEventChange(isChecked($event))"
            />
            <label for="isNationalTeam">
              <strong>National Team Event</strong> - Visible to all team members
            </label>
          </div>
        }

        <div class="form-field">
          <label for="externalUrl">External URL (optional)</label>
          <input
            pInputText
            id="externalUrl"
            [value]="formData.externalUrl ?? ''"
            (input)="onFormExternalUrlChange(getInputValue($event))"
            placeholder="https://..."
            class="w-full"
          />
        </div>

        <div class="form-field">
          <label for="notes">Notes</label>
          <textarea
            pInputText
            id="notes"
            [value]="formData.notes ?? ''"
            (input)="onFormNotesChange(getInputValue($event))"
            rows="2"
            placeholder="Any additional notes..."
            class="w-full"
          ></textarea>
        </div>
      </div>

      <app-dialog-footer
        cancelLabel="Cancel"
        primaryLabel="Save Tournament"
        primaryIcon="check"
        [loading]="isSaving()"
        [disabled]="!isFormValid()"
        (cancel)="closeDialog()"
        (primary)="saveTournament()"
      />
    </app-dialog>
  `,
  styleUrl: "./tournament-calendar.component.scss",
})
export class TournamentCalendarComponent {
  readonly dialogBreakpoints = {
    [DesignTokens.breakpoints.mobile]: DIALOG_WIDTHS.full,
  };
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly dialogService = inject(DialogService);

  // Angular 21 signal inputs/outputs
  readonly isCoach = input(false);
  readonly tournamentChanged = output<void>();

  // State
  readonly tournaments = signal<Tournament[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly showDialog = signal(false);
  readonly isEditing = signal(false);
  readonly isSaving = signal(false);
  readonly editingId = signal<string | null>(null);

  // Form
  formData: Omit<Partial<Tournament>, "startDate" | "endDate"> & {
    startDate?: string | Date;
    endDate?: string | Date;
  } = this.getEmptyForm();

  readonly eventTypes: EventTypeOption[] = [
    { label: "Club Tournament", value: "club" },
    { label: "International", value: "international" },
    { label: "National Team", value: "national_team" },
    { label: "Friendly", value: "friendly" },
  ];

  constructor() {
    // Initialize on construction (Angular 21 pattern)
    this.loadTournaments();
  }

  onFormNameChange(value: string): void {
    this.formData = { ...this.formData, name: value };
  }

  onFormStartDateChange(value: string | Date | null): void {
    this.formData = { ...this.formData, startDate: value ?? undefined };
  }

  onFormEndDateChange(value: string | Date | null): void {
    this.formData = { ...this.formData, endDate: value ?? undefined };
  }

  onFormCountryChange(value: string): void {
    this.formData = { ...this.formData, country: value };
  }

  onFormCityChange(value: string): void {
    this.formData = { ...this.formData, city: value };
  }

  onFormEventTypeChange(value: Tournament["eventType"] | null): void {
    this.formData = { ...this.formData, eventType: value ?? "club" };
  }

  onFormGamesExpectedChange(value: number | null): void {
    this.formData = { ...this.formData, gamesExpected: value ?? 1 };
  }

  onFormTaperWeeksBeforeChange(value: number | null): void {
    this.formData = { ...this.formData, taperWeeksBefore: value ?? 0 };
  }

  onFormIsPeakEventChange(value: boolean): void {
    this.formData = { ...this.formData, isPeakEvent: value };
  }

  onFormIsNationalTeamEventChange(value: boolean): void {
    this.formData = { ...this.formData, isNationalTeamEvent: value };
  }

  onFormExternalUrlChange(value: string): void {
    this.formData = { ...this.formData, externalUrl: value };
  }

  onFormNotesChange(value: string): void {
    this.formData = { ...this.formData, notes: value };
  }

  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement | null)
      ?.value ?? "";
  }

  isChecked(event: Event): boolean {
    return (event.target as HTMLInputElement | null)?.checked ?? false;
  }

  async loadTournaments(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set(null);

    try {
      const response: ApiResponse<Tournament[] | null> = await firstValueFrom(
        this.api.get(API_ENDPOINTS.tournamentCalendar.list),
      );
      if (response?.success && response.data) {
        this.tournaments.set(response.data);
        return;
      }

      this.tournaments.set([]);
      this.loadError.set(
        "We couldn't load your tournament calendar. Please try again.",
      );
    } catch (err) {
      this.logger.error("Failed to load tournaments", err);
      this.loadError.set(
        "We couldn't load your tournament calendar. Please try again.",
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  retryLoadTournaments(): void {
    void this.loadTournaments();
  }

  readonly openAddDialogHandler = (): void => this.openAddDialog();

  openAddDialog(): void {
    this.formData = this.getEmptyForm();
    this.isEditing.set(false);
    this.editingId.set(null);
    this.showDialog.set(true);
  }

  editTournament(tournament: Tournament): void {
    this.formData = {
      ...tournament,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
    };
    this.isEditing.set(true);
    this.editingId.set(tournament.id);
    this.showDialog.set(true);
  }

  closeDialog(): void {
    this.showDialog.set(false);
    this.formData = this.getEmptyForm();
  }

  async saveTournament(): Promise<void> {
    if (!this.isFormValid()) return;

    this.isSaving.set(true);

    try {
      const payload = {
        ...this.formData,
        startDate: this.formatDate(this.formData.startDate),
        endDate: this.formatDate(this.formData.endDate),
        id: this.editingId(),
      };

      await firstValueFrom(
        this.api.post(API_ENDPOINTS.tournamentCalendar.create, payload),
      );

      await this.loadTournaments();
      this.tournamentChanged.emit();
      this.closeDialog();
    } catch (err) {
      this.logger.error("Failed to save tournament", err);
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteTournament(tournament: Tournament): Promise<void> {
    const confirmed = await this.dialogService.confirm(
      `Delete "${tournament.name}"?`,
      "Delete Tournament",
    );
    if (!confirmed) return;

    try {
      await firstValueFrom(
        this.api.post(API_ENDPOINTS.tournamentCalendar.delete, {
          id: tournament.id,
        }),
      );
      await this.loadTournaments();
      this.tournamentChanged.emit();
    } catch (err) {
      this.logger.error("Failed to delete tournament", err);
    }
  }

  openExternalUrl(url: string): void {
    window.open(url, "_blank");
  }

  // Helpers
  getEmptyForm(): Omit<Partial<Tournament>, "startDate" | "endDate"> & {
    startDate?: string | Date;
    endDate?: string | Date;
  } {
    return {
      name: "",
      startDate: undefined,
      endDate: undefined,
      country: "",
      city: "",
      isPeakEvent: false,
      gamesExpected: 8,
      throwsPerGameQb: 40,
      eventType: "club",
      isNationalTeamEvent: false,
      taperWeeksBefore: 1,
      notes: "",
      externalUrl: "",
    };
  }

  isFormValid(): boolean {
    return !!(
      this.formData.name &&
      this.formData.startDate &&
      this.formData.endDate
    );
  }

  formatDate(date: string | Date | undefined): string | undefined {
    if (!date) return undefined;
    if (typeof date === "string") return date;
    return date.toISOString().split("T")[0];
  }

  formatDateRange(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
    };

    if (start === end) {
      return startDate.toLocaleDateString("en-US", {
        ...options,
        year: "numeric",
      });
    }

    if (startDate.getMonth() === endDate.getMonth()) {
      return `${startDate.toLocaleDateString("en-US", options)}-${endDate.getDate()}, ${endDate.getFullYear()}`;
    }

    return `${startDate.toLocaleDateString("en-US", options)} - ${endDate.toLocaleDateString("en-US", { ...options, year: "numeric" })}`;
  }

  getTaperDaysUntil(tournament: Tournament): number {
    if (!tournament.taperStartDate) return 0;
    const today = new Date();
    const taperStart = new Date(tournament.taperStartDate);
    return Math.ceil(
      (taperStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
  }
}
