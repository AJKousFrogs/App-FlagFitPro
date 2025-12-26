import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { ProgressBarModule } from "primeng/progressbar";
import { Tabs, TabPanel } from "primeng/tabs";
import { Dialog } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { TextareaModule } from "primeng/textarea";
import { DatePicker } from "primeng/datepicker";
import { Select } from "primeng/select";
import { InputNumber } from "primeng/inputnumber";
import { Checkbox } from "primeng/checkbox";
import { ToastModule } from "primeng/toast";
import { ConfirmDialog } from "primeng/confirmdialog";
import { MessageService, ConfirmationService } from "primeng/api";

import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { TournamentService, Tournament, CreateTournamentDto } from "../../core/services/tournament.service";
import { AuthService } from "../../core/services/auth.service";

@Component({
  selector: "app-tournaments",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    ProgressBarModule,
    Tabs,
    TabPanel,
    Dialog,
    InputTextModule,
    TextareaModule,
    DatePicker,
    Select,
    InputNumber,
    Checkbox,
    ToastModule,
    ConfirmDialog,
    MainLayoutComponent,
    PageHeaderComponent,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <app-main-layout>
      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>
      
      <div class="tournaments-page">
        <app-page-header
          title="Tournament Schedule"
          subtitle="View and manage upcoming flag football tournaments"
          icon="pi-trophy"
        >
          <div class="header-actions">
            @if (nextTournament(); as next) {
              <p-button 
                [label]="'Next: ' + next.name" 
                icon="pi pi-calendar"
                [outlined]="true"
                (onClick)="scrollToTournament(next.id)"
              ></p-button>
            }
            @if (isAuthenticated()) {
              <p-button 
                label="Add Tournament" 
                icon="pi pi-plus"
                (onClick)="openCreateDialog()"
              ></p-button>
            }
          </div>
        </app-page-header>

        <!-- Loading State -->
        @if (tournamentService.loading()) {
          <div class="loading-state">
            <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
            <p>Loading tournaments...</p>
          </div>
        }

        <!-- Empty State -->
        @if (!tournamentService.loading() && tournaments().length === 0) {
          <div class="empty-state">
            <i class="pi pi-calendar-times" style="font-size: 3rem; color: var(--text-secondary)"></i>
            <h3>No Tournaments Scheduled</h3>
            <p>There are no tournaments in the system yet.</p>
            @if (isAuthenticated()) {
              <p-button 
                label="Add First Tournament" 
                icon="pi pi-plus"
                (onClick)="openCreateDialog()"
              ></p-button>
            }
          </div>
        }

        <!-- Tournament Tabs -->
        @if (tournaments().length > 0) {
          <p-tabs>
            <p-tabpanel header="2026 Season" leftIcon="pi pi-calendar">
              <div class="tournaments-grid">
                @for (tournament of tournaments2026(); track tournament.id) {
                  <p-card class="tournament-card" [attr.data-id]="tournament.id">
                    <div class="tournament-header">
                      <div class="header-row">
                        <p-tag
                          [value]="tournamentService.getStatusLabel(tournament.calculatedStatus || 'upcoming')"
                          [severity]="tournamentService.getStatusSeverity(tournament.calculatedStatus || 'upcoming')"
                        ></p-tag>
                        @if (isAuthenticated()) {
                          <div class="card-actions">
                            <p-button 
                              icon="pi pi-pencil" 
                              [rounded]="true" 
                              [text]="true"
                              size="small"
                              (onClick)="openEditDialog(tournament)"
                            ></p-button>
                            <p-button 
                              icon="pi pi-trash" 
                              [rounded]="true" 
                              [text]="true"
                              severity="danger"
                              size="small"
                              (onClick)="confirmDelete(tournament)"
                            ></p-button>
                          </div>
                        }
                      </div>
                      <h3 class="tournament-title">{{ tournament.flag }} {{ tournament.name }}</h3>
                      <p class="tournament-subtitle">{{ tournament.tournament_type || 'Championship' }}</p>
                    </div>
                    <div class="tournament-body">
                      <div class="tournament-info">
                        <div class="info-item">
                          <div class="info-icon">
                            <i class="pi pi-calendar"></i>
                          </div>
                          <div>
                            <div class="info-value">{{ tournamentService.formatDateRange(tournament.start_date, tournament.end_date) }}</div>
                            <div class="info-label">Date</div>
                          </div>
                        </div>
                        <div class="info-item">
                          <div class="info-icon">📍</div>
                          <div>
                            <div class="info-value">{{ tournament.location || 'TBD' }}</div>
                            <div class="info-label">{{ tournament.country || 'Location' }}</div>
                          </div>
                        </div>
                        @if (tournament.venue) {
                          <div class="info-item">
                            <div class="info-icon">🏟️</div>
                            <div>
                              <div class="info-value">{{ tournament.venue }}</div>
                              <div class="info-label">Venue</div>
                            </div>
                          </div>
                        }
                        @if (tournament.expected_teams) {
                          <div class="info-item">
                            <div class="info-icon">
                              <i class="pi pi-users"></i>
                            </div>
                            <div>
                              <div class="info-value">{{ tournament.expected_teams }}</div>
                              <div class="info-label">Expected Teams</div>
                            </div>
                          </div>
                        }
                      </div>
                      
                      @if (tournament.daysUntil && tournament.daysUntil > 0) {
                        <div class="tournament-countdown">
                          <span class="countdown-value">{{ tournament.daysUntil }}</span>
                          <span class="countdown-label">days until tournament</span>
                        </div>
                      }
                      
                      @if (tournament.notes) {
                        <div class="tournament-notes">
                          <p>{{ tournament.notes }}</p>
                        </div>
                      }
                      
                      <div class="tournament-actions">
                        @if (tournament.website_url) {
                          <p-button
                            label="Website"
                            icon="pi pi-external-link"
                            [outlined]="true"
                            size="small"
                            (onClick)="openWebsite(tournament.website_url)"
                          ></p-button>
                        }
                        <p-button 
                          label="View Details" 
                          size="small"
                          (onClick)="viewDetails(tournament)"
                        ></p-button>
                      </div>
                    </div>
                  </p-card>
                } @empty {
                  <div class="empty-season">
                    <p>No tournaments scheduled for 2026 yet.</p>
                    @if (isAuthenticated()) {
                      <p-button 
                        label="Add Tournament" 
                        icon="pi pi-plus"
                        [outlined]="true"
                        (onClick)="openCreateDialog()"
                      ></p-button>
                    }
                  </div>
                }
              </div>
            </p-tabpanel>
            
            <p-tabpanel header="2027 Season" leftIcon="pi pi-calendar">
              <div class="tournaments-grid">
                @for (tournament of tournaments2027(); track tournament.id) {
                  <p-card class="tournament-card" [attr.data-id]="tournament.id">
                    <div class="tournament-header">
                      <div class="header-row">
                        <p-tag
                          [value]="tournamentService.getStatusLabel(tournament.calculatedStatus || 'upcoming')"
                          [severity]="tournamentService.getStatusSeverity(tournament.calculatedStatus || 'upcoming')"
                        ></p-tag>
                        @if (isAuthenticated()) {
                          <div class="card-actions">
                            <p-button 
                              icon="pi pi-pencil" 
                              [rounded]="true" 
                              [text]="true"
                              size="small"
                              (onClick)="openEditDialog(tournament)"
                            ></p-button>
                            <p-button 
                              icon="pi pi-trash" 
                              [rounded]="true" 
                              [text]="true"
                              severity="danger"
                              size="small"
                              (onClick)="confirmDelete(tournament)"
                            ></p-button>
                          </div>
                        }
                      </div>
                      <h3 class="tournament-title">{{ tournament.flag }} {{ tournament.name }}</h3>
                      <p class="tournament-subtitle">{{ tournament.tournament_type || 'Championship' }}</p>
                    </div>
                    <div class="tournament-body">
                      <div class="tournament-info">
                        <div class="info-item">
                          <div class="info-icon">
                            <i class="pi pi-calendar"></i>
                          </div>
                          <div>
                            <div class="info-value">{{ tournamentService.formatDateRange(tournament.start_date, tournament.end_date) }}</div>
                            <div class="info-label">Date</div>
                          </div>
                        </div>
                        <div class="info-item">
                          <div class="info-icon">📍</div>
                          <div>
                            <div class="info-value">{{ tournament.location || 'TBD' }}</div>
                            <div class="info-label">{{ tournament.country || 'Location' }}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div class="tournament-actions">
                        <p-button 
                          label="View Details" 
                          size="small"
                          (onClick)="viewDetails(tournament)"
                        ></p-button>
                      </div>
                    </div>
                  </p-card>
                } @empty {
                  <div class="empty-season">
                    <p>No tournaments scheduled for 2027 yet.</p>
                    @if (isAuthenticated()) {
                      <p-button 
                        label="Add Tournament" 
                        icon="pi pi-plus"
                        [outlined]="true"
                        (onClick)="openCreateDialog()"
                      ></p-button>
                    }
                  </div>
                }
              </div>
            </p-tabpanel>
          </p-tabs>
        }
      </div>

      <!-- Create/Edit Tournament Dialog -->
      <p-dialog 
        [(visible)]="showDialog" 
        [header]="editingTournament ? 'Edit Tournament' : 'Add Tournament'"
        [modal]="true"
        [style]="{ width: '600px' }"
        [draggable]="false"
        [resizable]="false"
      >
        <div class="dialog-content">
          <div class="form-grid">
            <!-- Name -->
            <div class="form-field full-width">
              <label for="name">Tournament Name *</label>
              <input 
                pInputText 
                id="name" 
                [(ngModel)]="formData.name" 
                placeholder="e.g., Adria Bowl 2026"
                class="w-full"
              />
            </div>

            <!-- Short Name -->
            <div class="form-field">
              <label for="shortName">Short Name</label>
              <input 
                pInputText 
                id="shortName" 
                [(ngModel)]="formData.short_name" 
                placeholder="e.g., Adria Bowl"
              />
            </div>

            <!-- Country -->
            <div class="form-field">
              <label for="country">Country</label>
              <input 
                pInputText 
                id="country" 
                [(ngModel)]="formData.country" 
                placeholder="e.g., Croatia"
              />
            </div>

            <!-- Location -->
            <div class="form-field">
              <label for="location">City/Location</label>
              <input 
                pInputText 
                id="location" 
                [(ngModel)]="formData.location" 
                placeholder="e.g., Zagreb"
              />
            </div>

            <!-- Venue -->
            <div class="form-field">
              <label for="venue">Venue</label>
              <input 
                pInputText 
                id="venue" 
                [(ngModel)]="formData.venue" 
                placeholder="e.g., Stadium Name"
              />
            </div>

            <!-- Start Date -->
            <div class="form-field">
              <label for="startDate">Start Date *</label>
              <p-datepicker 
                [(ngModel)]="formData.start_date_obj"
                [showIcon]="true"
                dateFormat="yy-mm-dd"
                placeholder="Select start date"
                [style]="{ width: '100%' }"
              ></p-datepicker>
            </div>

            <!-- End Date -->
            <div class="form-field">
              <label for="endDate">End Date</label>
              <p-datepicker 
                [(ngModel)]="formData.end_date_obj"
                [showIcon]="true"
                dateFormat="yy-mm-dd"
                placeholder="Select end date"
                [style]="{ width: '100%' }"
              ></p-datepicker>
            </div>

            <!-- Tournament Type -->
            <div class="form-field">
              <label for="type">Tournament Type</label>
              <p-select 
                [(ngModel)]="formData.tournament_type"
                [options]="tournamentTypes"
                optionLabel="label"
                optionValue="value"
                placeholder="Select type"
                [style]="{ width: '100%' }"
              ></p-select>
            </div>

            <!-- Competition Level -->
            <div class="form-field">
              <label for="level">Competition Level</label>
              <p-select 
                [(ngModel)]="formData.competition_level"
                [options]="competitionLevels"
                optionLabel="label"
                optionValue="value"
                placeholder="Select level"
                [style]="{ width: '100%' }"
              ></p-select>
            </div>

            <!-- Expected Teams -->
            <div class="form-field">
              <label for="teams">Expected Teams</label>
              <p-inputNumber 
                [(ngModel)]="formData.expected_teams"
                [min]="2"
                [max]="100"
                placeholder="Number of teams"
                [style]="{ width: '100%' }"
              ></p-inputNumber>
            </div>

            <!-- Registration Deadline -->
            <div class="form-field">
              <label for="deadline">Registration Deadline</label>
              <p-datepicker 
                [(ngModel)]="formData.registration_deadline_obj"
                [showIcon]="true"
                dateFormat="yy-mm-dd"
                placeholder="Select deadline"
                [style]="{ width: '100%' }"
              ></p-datepicker>
            </div>

            <!-- Website URL -->
            <div class="form-field full-width">
              <label for="website">Website URL</label>
              <input 
                pInputText 
                id="website" 
                [(ngModel)]="formData.website_url" 
                placeholder="https://..."
                class="w-full"
              />
            </div>

            <!-- Notes -->
            <div class="form-field full-width">
              <label for="notes">Notes</label>
              <textarea 
                pTextarea 
                id="notes" 
                [(ngModel)]="formData.notes" 
                rows="3"
                placeholder="Additional information..."
                class="w-full"
              ></textarea>
            </div>

            <!-- Home Tournament Checkbox -->
            <div class="form-field full-width">
              <p-checkbox 
                [(ngModel)]="formData.is_home_tournament"
                [binary]="true"
                inputId="homeTournament"
                label="This is a home tournament"
              ></p-checkbox>
            </div>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            [outlined]="true"
            (onClick)="closeDialog()"
          ></p-button>
          <p-button 
            [label]="editingTournament ? 'Update' : 'Create'"
            [loading]="tournamentService.loading()"
            (onClick)="saveTournament()"
          ></p-button>
        </ng-template>
      </p-dialog>
    </app-main-layout>
  `,
  styles: [
    `
      .tournaments-page {
        padding: var(--space-6);
      }

      .header-actions {
        display: flex;
        gap: var(--space-3);
      }

      .loading-state,
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-8);
        text-align: center;
        gap: var(--space-4);
      }

      .empty-state h3 {
        margin: 0;
        color: var(--text-primary);
      }

      .empty-state p {
        margin: 0;
        color: var(--text-secondary);
      }

      .empty-season {
        grid-column: 1 / -1;
        text-align: center;
        padding: var(--space-8);
        color: var(--text-secondary);
      }

      .tournaments-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: var(--space-6);
        margin-top: var(--space-6);
      }

      .tournament-card {
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .tournament-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .tournament-header {
        margin-bottom: var(--space-4);
      }

      .header-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--space-2);
      }

      .card-actions {
        display: flex;
        gap: var(--space-1);
      }

      .tournament-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin: var(--space-2) 0;
        color: var(--text-primary);
      }

      .tournament-subtitle {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0;
        text-transform: capitalize;
      }

      .tournament-info {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-4);
        margin-bottom: var(--space-4);
      }

      .info-item {
        display: flex;
        align-items: flex-start;
        gap: var(--space-3);
      }

      .info-icon {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
        color: var(--color-brand-primary);
        flex-shrink: 0;
      }

      .info-value {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: var(--space-1);
      }

      .info-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .tournament-countdown {
        display: flex;
        align-items: baseline;
        gap: var(--space-2);
        padding: var(--space-3);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
        margin-bottom: var(--space-4);
      }

      .countdown-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--color-brand-primary);
      }

      .countdown-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .tournament-notes {
        padding: var(--space-3);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
        margin-bottom: var(--space-4);
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .tournament-notes p {
        margin: 0;
      }

      .tournament-actions {
        display: flex;
        gap: var(--space-3);
        justify-content: flex-end;
      }

      /* Dialog Styles */
      .dialog-content {
        padding: var(--space-4) 0;
      }

      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-4);
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .form-field.full-width {
        grid-column: 1 / -1;
      }

      .form-field label {
        font-weight: 500;
        color: var(--text-primary);
        font-size: 0.875rem;
      }

      .w-full {
        width: 100%;
      }

      @media (max-width: 768px) {
        .header-actions {
          flex-direction: column;
          width: 100%;
        }

        .tournaments-grid {
          grid-template-columns: 1fr;
        }

        .tournament-info {
          grid-template-columns: 1fr;
        }

        .form-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class TournamentsComponent implements OnInit {
  tournamentService = inject(TournamentService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Computed signals from service
  tournaments = this.tournamentService.tournaments;
  tournaments2026 = this.tournamentService.tournaments2026;
  tournaments2027 = this.tournamentService.tournaments2027;
  nextTournament = this.tournamentService.nextTournament;

  // Dialog state
  showDialog = false;
  editingTournament: Tournament | null = null;

  // Form data
  formData: CreateTournamentDto & { 
    start_date_obj?: Date; 
    end_date_obj?: Date;
    registration_deadline_obj?: Date;
  } = this.getEmptyFormData();

  // Dropdown options
  tournamentTypes = [
    { label: 'League', value: 'league' },
    { label: 'Cup', value: 'cup' },
    { label: 'Championship', value: 'championship' },
    { label: 'Friendly', value: 'friendly' },
    { label: 'Qualifier', value: 'qualifier' },
    { label: 'International', value: 'international' },
  ];

  competitionLevels = [
    { label: 'National', value: 'national' },
    { label: 'Regional', value: 'regional' },
    { label: 'European', value: 'european' },
    { label: 'World', value: 'world' },
    { label: 'Friendly', value: 'friendly' },
  ];

  ngOnInit(): void {
    this.loadTournaments();
  }

  async loadTournaments(): Promise<void> {
    await this.tournamentService.fetchTournaments();
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  getEmptyFormData(): CreateTournamentDto & { 
    start_date_obj?: Date; 
    end_date_obj?: Date;
    registration_deadline_obj?: Date;
  } {
    return {
      name: '',
      short_name: '',
      location: '',
      country: '',
      venue: '',
      start_date: '',
      end_date: '',
      tournament_type: 'championship',
      competition_level: 'regional',
      expected_teams: undefined,
      registration_deadline: '',
      website_url: '',
      notes: '',
      is_home_tournament: false,
      start_date_obj: undefined,
      end_date_obj: undefined,
      registration_deadline_obj: undefined,
    };
  }

  openCreateDialog(): void {
    this.editingTournament = null;
    this.formData = this.getEmptyFormData();
    this.showDialog = true;
  }

  openEditDialog(tournament: Tournament): void {
    this.editingTournament = tournament;
    this.formData = {
      name: tournament.name,
      short_name: tournament.short_name || '',
      location: tournament.location || '',
      country: tournament.country || '',
      venue: tournament.venue || '',
      start_date: tournament.start_date,
      end_date: tournament.end_date || '',
      tournament_type: tournament.tournament_type || 'championship',
      competition_level: tournament.competition_level || 'regional',
      expected_teams: tournament.expected_teams,
      registration_deadline: tournament.registration_deadline || '',
      website_url: tournament.website_url || '',
      notes: tournament.notes || '',
      is_home_tournament: tournament.is_home_tournament || false,
      start_date_obj: tournament.start_date ? new Date(tournament.start_date) : undefined,
      end_date_obj: tournament.end_date ? new Date(tournament.end_date) : undefined,
      registration_deadline_obj: tournament.registration_deadline ? new Date(tournament.registration_deadline) : undefined,
    };
    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
    this.editingTournament = null;
    this.formData = this.getEmptyFormData();
  }

  async saveTournament(): Promise<void> {
    // Validate required fields
    if (!this.formData.name || !this.formData.start_date_obj) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Tournament name and start date are required',
      });
      return;
    }

    // Convert date objects to strings
    const data: CreateTournamentDto = {
      ...this.formData,
      start_date: this.formatDate(this.formData.start_date_obj),
      end_date: this.formData.end_date_obj ? this.formatDate(this.formData.end_date_obj) : undefined,
      registration_deadline: this.formData.registration_deadline_obj 
        ? this.formatDate(this.formData.registration_deadline_obj) 
        : undefined,
      flag: this.formData.country ? this.tournamentService.getCountryFlag(this.getCountryCode(this.formData.country)) : undefined,
    };

    // Remove date objects before sending
    delete (data as any).start_date_obj;
    delete (data as any).end_date_obj;
    delete (data as any).registration_deadline_obj;

    let success = false;
    if (this.editingTournament) {
      const result = await this.tournamentService.updateTournament(this.editingTournament.id, data);
      success = !!result;
    } else {
      const result = await this.tournamentService.createTournament(data);
      success = !!result;
    }

    if (success) {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: this.editingTournament ? 'Tournament updated' : 'Tournament created',
      });
      this.closeDialog();
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: this.tournamentService.error() || 'Failed to save tournament',
      });
    }
  }

  confirmDelete(tournament: Tournament): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${tournament.name}"?`,
      header: 'Delete Tournament',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        const success = await this.tournamentService.deleteTournament(tournament.id);
        if (success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Tournament deleted successfully',
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete tournament',
          });
        }
      },
    });
  }

  viewDetails(tournament: Tournament): void {
    // Could navigate to detail page or open a dialog
    console.log('View details:', tournament);
  }

  scrollToTournament(id: string): void {
    const element = document.querySelector(`[data-id="${id}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  openWebsite(url?: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getCountryCode(country: string): string {
    // Simple mapping for common countries
    const codes: Record<string, string> = {
      'croatia': 'HR',
      'slovenia': 'SI',
      'germany': 'DE',
      'austria': 'AT',
      'italy': 'IT',
      'france': 'FR',
      'spain': 'ES',
      'usa': 'US',
      'united states': 'US',
      'uk': 'GB',
      'united kingdom': 'GB',
      'denmark': 'DK',
      'serbia': 'RS',
      'hungary': 'HU',
      'poland': 'PL',
      'czech republic': 'CZ',
      'slovakia': 'SK',
    };
    return codes[country.toLowerCase()] || country.substring(0, 2).toUpperCase();
  }
}
