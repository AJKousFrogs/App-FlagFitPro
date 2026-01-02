/**
 * Tournament Calendar Component
 *
 * Displays upcoming tournaments with countdown and taper information.
 * Players can add personal tournaments, coaches can add national team events.
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
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { ApiService } from '../../../../core/services/api.service';
import { LoggerService } from '../../../../core/services/logger.service';

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
  eventType: 'club' | 'national_team' | 'international' | 'friendly';
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
  selector: 'app-tournament-calendar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    DatePicker,
    Select,
    Checkbox,
    TagModule,
    TooltipModule,
  ],
  template: `
    <div class="tournament-calendar">
      <div class="calendar-header">
        <h3>
          <i class="pi pi-trophy"></i>
          Tournament Calendar
        </h3>
        <p-button
          icon="pi pi-plus"
          label="Add Tournament"
          [outlined]="true"
          size="small"
          (onClick)="openAddDialog()"
        ></p-button>
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner"></i>
          <span>Loading tournaments...</span>
        </div>
      } @else if (tournaments().length === 0) {
        <div class="empty-state">
          <i class="pi pi-calendar-times"></i>
          <p>No upcoming tournaments</p>
          <p-button
            label="Add Your First Tournament"
            icon="pi pi-plus"
            (onClick)="openAddDialog()"
          ></p-button>
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
                      <p-tag value="PEAK" severity="danger" [rounded]="true"></p-tag>
                    }
                    @if (tournament.isNationalTeamEvent) {
                      <p-tag value="National Team" severity="info" [rounded]="true"></p-tag>
                    }
                  </div>
                  <div class="tournament-details">
                    <span class="detail">
                      <i class="pi pi-calendar"></i>
                      {{ formatDateRange(tournament.startDate, tournament.endDate) }}
                    </span>
                    @if (tournament.country) {
                      <span class="detail">
                        <i class="pi pi-map-marker"></i>
                        {{ tournament.city ? tournament.city + ', ' : '' }}{{ tournament.country }}
                      </span>
                    }
                    <span class="detail">
                      <i class="pi pi-flag"></i>
                      {{ tournament.gamesExpected }} games
                    </span>
                  </div>
                </div>

                <div class="tournament-countdown">
                  @if (tournament.daysUntil !== undefined && tournament.daysUntil >= 0) {
                    <div class="countdown-number">{{ tournament.daysUntil }}</div>
                    <div class="countdown-label">days</div>
                  } @else {
                    <div class="countdown-label past">Past</div>
                  }
                </div>
              </div>

              @if (tournament.isInTaperPeriod) {
                <div class="taper-banner">
                  <i class="pi pi-info-circle"></i>
                  <span>
                    <strong>Taper Period Active</strong> - Training volume reduced to peak for this event.
                    Started {{ tournament.taperStartDate | date:'MMM d' }}.
                  </span>
                </div>
              } @else if (tournament.daysUntil !== undefined && tournament.daysUntil > 0 && tournament.daysUntil <= 21) {
                <div class="taper-info">
                  <i class="pi pi-clock"></i>
                  <span>
                    Taper starts {{ tournament.taperStartDate | date:'MMM d' }} 
                    ({{ getTaperDaysUntil(tournament) }} days)
                  </span>
                </div>
              }

              <div class="tournament-actions">
                @if (tournament.externalUrl) {
                  <p-button
                    icon="pi pi-external-link"
                    [text]="true"
                    size="small"
                    (onClick)="openExternalUrl(tournament.externalUrl)"
                    pTooltip="Tournament Info"
                  ></p-button>
                }
                <p-button
                  icon="pi pi-pencil"
                  [text]="true"
                  size="small"
                  (onClick)="editTournament(tournament)"
                  pTooltip="Edit"
                ></p-button>
                <p-button
                  icon="pi pi-trash"
                  [text]="true"
                  severity="danger"
                  size="small"
                  (onClick)="deleteTournament(tournament)"
                  pTooltip="Delete"
                ></p-button>
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
      [style]="{ width: '450px' }"
      [breakpoints]="{ '640px': '95vw' }"
      [draggable]="false"
    >
      <div class="tournament-form">
        <div class="form-field">
          <label for="name">Tournament Name *</label>
          <input
            pInputText
            id="name"
            [(ngModel)]="formData.name"
            placeholder="e.g., Adria Bowl 2026"
            [style]="{ width: '100%' }"
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
              [style]="{ width: '100%' }"
            ></p-datepicker>
          </div>
          <div class="form-field">
            <label for="endDate">End Date *</label>
            <p-datepicker
              id="endDate"
              [(ngModel)]="formData.endDate"
              dateFormat="yy-mm-dd"
              [showIcon]="true"
              [style]="{ width: '100%' }"
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
              [style]="{ width: '100%' }"
            />
          </div>
          <div class="form-field">
            <label for="city">City</label>
            <input
              pInputText
              id="city"
              [(ngModel)]="formData.city"
              placeholder="e.g., Zagreb"
              [style]="{ width: '100%' }"
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
            [style]="{ width: '100%' }"
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
              [style]="{ width: '100%' }"
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
              [style]="{ width: '100%' }"
            ></p-inputNumber>
          </div>
        </div>

        <div class="form-field checkbox-group">
          <p-checkbox
            [(ngModel)]="formData.isPeakEvent"
            [binary]="true"
            inputId="isPeakEvent"
          ></p-checkbox>
          <label for="isPeakEvent">
            <strong>Peak Event</strong> - Maximum taper and preparation
          </label>
        </div>

        @if (isCoach) {
          <div class="form-field checkbox-group">
            <p-checkbox
              [(ngModel)]="formData.isNationalTeamEvent"
              [binary]="true"
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
        <p-button
          label="Cancel"
          [outlined]="true"
          (onClick)="closeDialog()"
        ></p-button>
        <p-button
          [label]="isEditing() ? 'Save Changes' : 'Add Tournament'"
          icon="pi pi-check"
          (onClick)="saveTournament()"
          [loading]="isSaving()"
          [disabled]="!isFormValid()"
        ></p-button>
      </ng-template>
    </p-dialog>
  `,
  styleUrl: './tournament-calendar.component.scss',
})
export class TournamentCalendarComponent implements OnInit {
  private api = inject(ApiService);
  private logger = inject(LoggerService);

  @Input() isCoach = false;
  @Output() tournamentChanged = new EventEmitter<void>();

  // State
  tournaments = signal<Tournament[]>([]);
  isLoading = signal(true);
  showDialog = signal(false);
  isEditing = signal(false);
  isSaving = signal(false);
  editingId = signal<string | null>(null);

  // Form
  formData: Partial<Tournament> = this.getEmptyForm();

  eventTypes: EventTypeOption[] = [
    { label: 'Club Tournament', value: 'club' },
    { label: 'International', value: 'international' },
    { label: 'National Team', value: 'national_team' },
    { label: 'Friendly', value: 'friendly' },
  ];

  ngOnInit(): void {
    this.loadTournaments();
  }

  async loadTournaments(): Promise<void> {
    this.isLoading.set(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await this.api.get('/api/tournament-calendar').toPromise();
      if (response?.success && response.data) {
        this.tournaments.set(response.data);
      }
    } catch (err) {
      this.logger.error('Failed to load tournaments', err);
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
      startDate: new Date(tournament.startDate) as unknown as string,
      endDate: new Date(tournament.endDate) as unknown as string,
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

      await this.api.post('/api/tournament-calendar', payload).toPromise();

      await this.loadTournaments();
      this.tournamentChanged.emit();
      this.closeDialog();
    } catch (err) {
      this.logger.error('Failed to save tournament', err);
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteTournament(tournament: Tournament): Promise<void> {
    if (!confirm(`Delete "${tournament.name}"?`)) return;

    try {
      await this.api
        .post('/api/tournament-calendar/delete', { id: tournament.id })
        .toPromise();
      await this.loadTournaments();
      this.tournamentChanged.emit();
    } catch (err) {
      this.logger.error('Failed to delete tournament', err);
    }
  }

  openExternalUrl(url: string): void {
    window.open(url, '_blank');
  }

  // Helpers
  getEmptyForm(): Partial<Tournament> {
    return {
      name: '',
      startDate: undefined,
      endDate: undefined,
      country: '',
      city: '',
      isPeakEvent: false,
      gamesExpected: 8,
      throwsPerGameQb: 40,
      eventType: 'club',
      isNationalTeamEvent: false,
      taperWeeksBefore: 1,
      notes: '',
      externalUrl: '',
    };
  }

  isFormValid(): boolean {
    return !!(this.formData.name && this.formData.startDate && this.formData.endDate);
  }

  formatDate(date: string | Date | undefined): string | undefined {
    if (!date) return undefined;
    if (typeof date === 'string') return date;
    return date.toISOString().split('T')[0];
  }

  formatDateRange(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

    if (start === end) {
      return startDate.toLocaleDateString('en-US', { ...options, year: 'numeric' });
    }

    if (startDate.getMonth() === endDate.getMonth()) {
      return `${startDate.toLocaleDateString('en-US', options)}-${endDate.getDate()}, ${endDate.getFullYear()}`;
    }

    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`;
  }

  getTaperDaysUntil(tournament: Tournament): number {
    if (!tournament.taperStartDate) return 0;
    const today = new Date();
    const taperStart = new Date(tournament.taperStartDate);
    return Math.ceil((taperStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }
}
