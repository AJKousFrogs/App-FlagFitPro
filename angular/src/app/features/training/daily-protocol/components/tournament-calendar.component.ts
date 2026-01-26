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
import { firstValueFrom } from "rxjs";
import { FormsModule } from "@angular/forms";
import { DatePipe } from "@angular/common";
import { ButtonComponent } from "../../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../../shared/components/button/icon-button.component";
import { Checkbox } from "primeng/checkbox";
import { DatePicker } from "primeng/datepicker";
import { Dialog } from "primeng/dialog";
import { PrimeTemplate } from "primeng/api";
import { InputNumber } from "primeng/inputnumber";
import { InputText } from "primeng/inputtext";
import { Select } from "primeng/select";
import { Tag } from "primeng/tag";
import { StatusTagComponent } from "../../../../shared/components/status-tag/status-tag.component";
import { Tooltip } from "primeng/tooltip";

import { ApiService } from "../../../../core/services/api.service";
import { LoggerService } from "../../../../core/services/logger.service";

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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    Dialog,
    PrimeTemplate,
    InputText,
    InputNumber,
    DatePicker,
    Select,
    Checkbox,
    Tag,
    StatusTagComponent,
    Tooltip,
    DatePipe,

    ButtonComponent,
    IconButtonComponent,
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
        <div class="loading-state" role="status" aria-live="polite">
          <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
          <span>Loading tournaments...</span>
        </div>
      } @else if (tournaments().length === 0) {
        <div class="empty-state" role="status">
          <i class="pi pi-calendar-times" aria-hidden="true"></i>
          <p>No upcoming tournaments</p>
          <app-button iconLeft="pi-plus" (clicked)="openAddDialog()"
            >Add Your First Tournament</app-button
          >
        </div>
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
                <div class="taper-banner" role="alert">
                  <i class="pi pi-info-circle" aria-hidden="true"></i>
                  <span>
                    <strong>Taper Period Active</strong> - Training volume
                    reduced to peak for this event. Started
                    {{ tournament.taperStartDate | date: "MMM d" }}.
                  </span>
                </div>
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
    <p-dialog
      [header]="isEditing() ? 'Edit Tournament' : 'Add Tournament'"
      [modal]="true"
      [visible]="showDialog()"
      (visibleChange)="showDialog.set($event)"
      [breakpoints]="{ '640px': '95vw' }"
      [draggable]="false"
      styleClass="training-tournament-dialog"
    >
      <div class="tournament-form">
        <div class="form-field">
          <label for="name">Tournament Name *</label>
          <input
            pInputText
            id="name"
            [(ngModel)]="formData.name"
            placeholder="e.g., Adria Bowl 2026"
            class="w-full"
          />
        </div>

        <div class="form-row">
          <div class="form-field">
            <label for="startDate">Start Date *</label>
            <p-datepicker
              id="startDate"
              [(ngModel)]="formData.startDate"
              dateFormat="yy-mm-dd"
              [showIcon]="true"
              styleClass="w-full"
            ></p-datepicker>
          </div>
          <div class="form-field">
            <label for="endDate">End Date *</label>
            <p-datepicker
              id="endDate"
              [(ngModel)]="formData.endDate"
              dateFormat="yy-mm-dd"
              [showIcon]="true"
              styleClass="w-full"
            ></p-datepicker>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label for="country">Country</label>
            <input
              pInputText
              id="country"
              [(ngModel)]="formData.country"
              placeholder="e.g., Croatia"
              class="w-full"
            />
          </div>
          <div class="form-field">
            <label for="city">City</label>
            <input
              pInputText
              id="city"
              [(ngModel)]="formData.city"
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
            [(ngModel)]="formData.eventType"
            optionLabel="label"
            optionValue="value"
            styleClass="w-full"
          ></p-select>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label for="gamesExpected">Expected Games</label>
            <p-inputNumber
              id="gamesExpected"
              [(ngModel)]="formData.gamesExpected"
              [min]="1"
              [max]="20"
              [showButtons]="true"
              styleClass="w-full"
            ></p-inputNumber>
          </div>
          <div class="form-field">
            <label for="taperWeeks">Taper Weeks Before</label>
            <p-inputNumber
              id="taperWeeks"
              [(ngModel)]="formData.taperWeeksBefore"
              [min]="0"
              [max]="4"
              [showButtons]="true"
              styleClass="w-full"
            ></p-inputNumber>
          </div>
        </div>

        <div class="form-field checkbox-group">
          <p-checkbox
            [(ngModel)]="formData.isPeakEvent"
            [binary]="true"
            variant="filled"
            inputId="isPeakEvent"
          ></p-checkbox>
          <label for="isPeakEvent">
            <strong>Peak Event</strong> - Maximum taper and preparation
          </label>
        </div>

        @if (isCoach()) {
          <div class="form-field checkbox-group">
            <p-checkbox
              [(ngModel)]="formData.isNationalTeamEvent"
              [binary]="true"
              variant="filled"
              inputId="isNationalTeam"
            ></p-checkbox>
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
            [(ngModel)]="formData.externalUrl"
            placeholder="https://..."
            [style]="{ width: '100%' }"
          />
        </div>

        <div class="form-field">
          <label for="notes">Notes</label>
          <textarea
            pInputText
            id="notes"
            [(ngModel)]="formData.notes"
            rows="2"
            placeholder="Any additional notes..."
            [style]="{ width: '100%' }"
          ></textarea>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <app-button variant="outlined" (clicked)="closeDialog()"
          >Cancel</app-button
        >
        <app-icon-button
          icon="pi-check"
          [loading]="isSaving()"
          [disabled]="!isFormValid()"
          (clicked)="saveTournament()"
          ariaLabel="Save tournament"
          tooltip="Save"
        />
      </ng-template>
    </p-dialog>
  `,
  styleUrl: "./tournament-calendar.component.scss",
})
export class TournamentCalendarComponent {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  // Angular 21 signal inputs/outputs
  readonly isCoach = input(false);
  readonly tournamentChanged = output<void>();

  // State
  readonly tournaments = signal<Tournament[]>([]);
  readonly isLoading = signal(true);
  readonly showDialog = signal(false);
  readonly isEditing = signal(false);
  readonly isSaving = signal(false);
  readonly editingId = signal<string | null>(null);

  // Form
  formData: Partial<Tournament> = this.getEmptyForm();

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

  async loadTournaments(): Promise<void> {
    this.isLoading.set(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await firstValueFrom(
        this.api.get("/api/tournament-calendar"),
      );
      if (response?.success && response.data) {
        this.tournaments.set(response.data);
      }
    } catch (err) {
      this.logger.error("Failed to load tournaments", err);
    } finally {
      this.isLoading.set(false);
    }
  }

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

      await firstValueFrom(this.api.post("/api/tournament-calendar", payload));

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
    if (!confirm(`Delete "${tournament.name}"?`)) return;

    try {
      await firstValueFrom(
        this.api.post("/api/tournament-calendar/delete", { id: tournament.id }),
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
  getEmptyForm(): Partial<Tournament> {
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
