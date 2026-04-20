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
import { InputNumber } from "primeng/inputnumber";
import { type SelectChangeEvent } from "primeng/select";
import { FormInputComponent } from "../../../../shared/components/form-input/form-input.component";
import { TextareaComponent } from "../../../../shared/components/textarea/textarea.component";
import { SelectComponent } from "../../../../shared/components/select/select.component";
import { DatePickerComponent } from "../../../../shared/components/date-picker/date-picker.component";
import { Tag } from "primeng/tag";
import { StatusTagComponent } from "../../../../shared/components/status-tag/status-tag.component";
import { Tooltip } from "primeng/tooltip";

import { ApiService, API_ENDPOINTS } from "../../../../core/services/api.service";
import { LoggerService } from "../../../../core/services/logger.service";
import { DialogService } from "../../../../core/ui/dialog.service";
import { extractApiPayload } from "../../../../core/utils/api-response-mapper";
import {
  DIALOG_BREAKPOINTS,
} from "../../../../core/utils/design-tokens.util";
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
    FormInputComponent,
    TextareaComponent,
    InputNumber,
    DatePickerComponent,
    SelectComponent,
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
  templateUrl: "./tournament-calendar.component.html",
  styleUrl: "./tournament-calendar.component.scss",
})
export class TournamentCalendarComponent {
  readonly dialogBreakpoints = DIALOG_BREAKPOINTS.mobileFull;
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

  onFormCountryInput(event: Event): void {
    this.onFormCountryChange(this.readInputValue(event));
  }

  onFormCityChange(value: string): void {
    this.formData = { ...this.formData, city: value };
  }

  onFormCityInput(event: Event): void {
    this.onFormCityChange(this.readInputValue(event));
  }

  onFormEventTypeSelect(event: SelectChangeEvent): void {
    this.onFormEventTypeChange(
      (event.value as Tournament["eventType"] | null | undefined) ?? null,
    );
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

  onFormIsPeakEventToggle(event: Event): void {
    this.onFormIsPeakEventChange(this.readChecked(event));
  }

  onFormIsNationalTeamEventChange(value: boolean): void {
    this.formData = { ...this.formData, isNationalTeamEvent: value };
  }

  onFormIsNationalTeamEventToggle(event: Event): void {
    this.onFormIsNationalTeamEventChange(this.readChecked(event));
  }

  onFormExternalUrlChange(value: string): void {
    this.formData = { ...this.formData, externalUrl: value };
  }

  onFormExternalUrlInput(event: Event): void {
    this.onFormExternalUrlChange(this.readInputValue(event));
  }

  onFormNotesChange(value: string): void {
    this.formData = { ...this.formData, notes: value };
  }

  onFormNotesInput(event: Event): void {
    this.onFormNotesChange(this.readInputValue(event));
  }

  private readInputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement | null)
      ?.value ?? "";
  }

  private readChecked(event: Event): boolean {
    return (event.target as HTMLInputElement | null)?.checked ?? false;
  }

  async loadTournaments(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set(null);

    try {
      const response = await firstValueFrom(
        this.api.get<Tournament[] | null>(API_ENDPOINTS.tournamentCalendar.list),
      );
      const payload = extractApiPayload<Tournament[] | null>(response);
      if (payload) {
        this.tournaments.set(payload);
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
