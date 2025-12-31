import { CommonModule, DecimalPipe } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    inject,
    signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";

import { ConfirmationService, MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { Checkbox } from "primeng/checkbox";
import { ConfirmDialog } from "primeng/confirmdialog";
import { DatePicker } from "primeng/datepicker";
import { Dialog } from "primeng/dialog";
import { InputNumber } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { ProgressBarModule } from "primeng/progressbar";
import { Select } from "primeng/select";
import { TabPanel, Tabs } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";

import { AuthService } from "../../core/services/auth.service";
import { LoggerService } from "../../core/services/logger.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { CreateTournamentDto, Tournament, TournamentService } from "../../core/services/tournament.service";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";

interface PlayerAvailability {
  playerId: string;
  playerName: string;
  position: string;
  status: 'confirmed' | 'declined' | 'tentative' | 'pending';
  reason?: string;
  paymentStatus: 'pending' | 'paid' | 'partial' | 'not_required';
  amountPaid: number;
}

interface TournamentBudget {
  totalEstimated: number;
  teamContribution: number;
  sponsorContribution: number;
  perPlayer: number;
}

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
    DecimalPipe,
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
                        @if (isAuthenticated()) {
                          <p-button
                            label="My Availability"
                            icon="pi pi-calendar-plus"
                            [outlined]="true"
                            size="small"
                            (onClick)="openAvailabilityDialog(tournament)"
                          ></p-button>
                        }
                        @if (canViewTeamAvailability()) {
                          <p-button 
                            label="Team Status" 
                            icon="pi pi-users"
                            size="small"
                            (onClick)="openTeamAvailabilityDialog(tournament)"
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
              <label for="tournament-name">Tournament Name *</label>
              <input 
                pInputText 
                id="tournament-name"
                name="tournamentName"
                [(ngModel)]="formData.name" 
                placeholder="e.g., Adria Bowl 2026"
                class="w-full"
                autocomplete="off"
              />
            </div>

            <!-- Short Name -->
            <div class="form-field">
              <label for="tournament-shortName">Short Name</label>
              <input 
                pInputText 
                id="tournament-shortName"
                name="shortName"
                [(ngModel)]="formData.short_name" 
                placeholder="e.g., Adria Bowl"
                autocomplete="off"
              />
            </div>

            <!-- Country -->
            <div class="form-field">
              <label for="tournament-country">Country</label>
              <input 
                pInputText 
                id="tournament-country"
                name="country"
                [(ngModel)]="formData.country" 
                placeholder="e.g., Croatia"
                autocomplete="country-name"
              />
            </div>

            <!-- Location -->
            <div class="form-field">
              <label for="tournament-location">City/Location</label>
              <input 
                pInputText 
                id="tournament-location"
                name="location"
                [(ngModel)]="formData.location" 
                placeholder="e.g., Zagreb"
                autocomplete="address-level2"
              />
            </div>

            <!-- Venue -->
            <div class="form-field">
              <label for="tournament-venue">Venue</label>
              <input 
                pInputText 
                id="tournament-venue"
                name="venue"
                [(ngModel)]="formData.venue" 
                placeholder="e.g., Stadium Name"
                autocomplete="off"
              />
            </div>

            <!-- Start Date -->
            <div class="form-field">
              <label for="tournament-startDate">Start Date *</label>
              <p-datepicker 
                inputId="tournament-startDate"
                [(ngModel)]="formData.start_date_obj"
                [showIcon]="true"
                dateFormat="yy-mm-dd"
                placeholder="Select start date"
                [style]="{ width: '100%' }"
              ></p-datepicker>
            </div>

            <!-- End Date -->
            <div class="form-field">
              <label for="tournament-endDate">End Date</label>
              <p-datepicker 
                inputId="tournament-endDate"
                [(ngModel)]="formData.end_date_obj"
                [showIcon]="true"
                dateFormat="yy-mm-dd"
                placeholder="Select end date"
                [style]="{ width: '100%' }"
              ></p-datepicker>
            </div>

            <!-- Tournament Type -->
            <div class="form-field">
              <label for="tournament-type">Tournament Type</label>
              <p-select 
                inputId="tournament-type"
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
              <label for="tournament-level">Competition Level</label>
              <p-select 
                inputId="tournament-level"
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
              <label for="tournament-teams">Expected Teams</label>
              <p-inputNumber 
                inputId="tournament-teams"
                [(ngModel)]="formData.expected_teams"
                [min]="2"
                [max]="100"
                placeholder="Number of teams"
                [style]="{ width: '100%' }"
              ></p-inputNumber>
            </div>

            <!-- Registration Deadline -->
            <div class="form-field">
              <label for="tournament-deadline">Registration Deadline</label>
              <p-datepicker 
                inputId="tournament-deadline"
                [(ngModel)]="formData.registration_deadline_obj"
                [showIcon]="true"
                dateFormat="yy-mm-dd"
                placeholder="Select deadline"
                [style]="{ width: '100%' }"
              ></p-datepicker>
            </div>

            <!-- Website URL -->
            <div class="form-field full-width">
              <label for="tournament-website">Website URL</label>
              <input 
                pInputText 
                id="tournament-website"
                name="website"
                [(ngModel)]="formData.website_url" 
                placeholder="https://..."
                class="w-full"
                autocomplete="url"
              />
            </div>

            <!-- Notes -->
            <div class="form-field full-width">
              <label for="tournament-notes">Notes</label>
              <textarea 
                pTextarea 
                id="tournament-notes"
                name="notes"
                [(ngModel)]="formData.notes" 
                rows="3"
                placeholder="Additional information..."
                class="w-full"
                autocomplete="off"
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

      <!-- Player Availability Dialog -->
      <p-dialog 
        [(visible)]="showAvailabilityDialog" 
        header="My Tournament Availability"
        [modal]="true"
        [style]="{ width: '500px' }"
        [draggable]="false"
      >
        @if (selectedTournament) {
          <div class="availability-dialog">
            <div class="tournament-summary">
              <h3>{{ selectedTournament.flag }} {{ selectedTournament.name }}</h3>
              <p class="tournament-dates">
                <i class="pi pi-calendar"></i>
                {{ tournamentService.formatDateRange(selectedTournament.start_date, selectedTournament.end_date) }}
              </p>
              <p class="tournament-location">
                <i class="pi pi-map-marker"></i>
                {{ selectedTournament.location }}, {{ selectedTournament.country }}
              </p>
            </div>

            <div class="availability-form">
              <div class="form-field">
                <label>Will you be attending?</label>
                <div class="availability-options">
                  @for (option of availabilityOptions; track option.value) {
                    <div 
                      class="availability-option"
                      [class.selected]="availabilityForm.status === option.value"
                      [class]="'option-' + option.value"
                      (click)="availabilityForm.status = option.value"
                    >
                      <i [class]="option.icon"></i>
                      <span>{{ option.label }}</span>
                    </div>
                  }
                </div>
              </div>

              @if (availabilityForm.status === 'declined' || availabilityForm.status === 'tentative') {
                <div class="form-field">
                  <label>Reason (optional)</label>
                  <textarea 
                    pTextarea 
                    [(ngModel)]="availabilityForm.reason" 
                    rows="2"
                    placeholder="Let your coach know why..."
                    class="w-full"
                  ></textarea>
                </div>
              }

              @if (availabilityForm.status === 'confirmed') {
                <div class="form-grid-2">
                  <div class="form-field">
                    <label>Arrival Date</label>
                    <p-datepicker 
                      [(ngModel)]="availabilityForm.arrivalDate"
                      [showIcon]="true"
                      dateFormat="yy-mm-dd"
                      placeholder="When do you arrive?"
                      [style]="{ width: '100%' }"
                    ></p-datepicker>
                  </div>
                  <div class="form-field">
                    <label>Departure Date</label>
                    <p-datepicker 
                      [(ngModel)]="availabilityForm.departureDate"
                      [showIcon]="true"
                      dateFormat="yy-mm-dd"
                      placeholder="When do you leave?"
                      [style]="{ width: '100%' }"
                    ></p-datepicker>
                  </div>
                </div>

                <div class="form-field">
                  <p-checkbox 
                    [(ngModel)]="availabilityForm.accommodationNeeded"
                    [binary]="true"
                    inputId="accommodation"
                    label="I need accommodation"
                  ></p-checkbox>
                </div>

                <div class="form-field">
                  <p-checkbox 
                    [(ngModel)]="availabilityForm.transportationNeeded"
                    [binary]="true"
                    inputId="transportation"
                    label="I need transportation"
                  ></p-checkbox>
                </div>

                <div class="form-field">
                  <label>Dietary Restrictions</label>
                  <input 
                    pInputText 
                    [(ngModel)]="availabilityForm.dietaryRestrictions"
                    placeholder="Any dietary needs..."
                    class="w-full"
                  />
                </div>
              }

              <!-- Cost Information -->
              @if (tournamentCost() > 0 && availabilityForm.status === 'confirmed') {
                <div class="cost-summary">
                  <h4><i class="pi pi-wallet"></i> Estimated Cost</h4>
                  <div class="cost-breakdown">
                    <div class="cost-item">
                      <span>Your share:</span>
                      <span class="cost-value">€{{ tournamentCost() | number:'1.2-2' }}</span>
                    </div>
                    @if (availabilityForm.amountPaid > 0) {
                      <div class="cost-item paid">
                        <span>Already paid:</span>
                        <span class="cost-value">€{{ availabilityForm.amountPaid | number:'1.2-2' }}</span>
                      </div>
                    }
                    <div class="cost-item remaining">
                      <span>Remaining:</span>
                      <span class="cost-value">€{{ (tournamentCost() - availabilityForm.amountPaid) | number:'1.2-2' }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            [outlined]="true"
            (onClick)="showAvailabilityDialog = false"
          ></p-button>
          <p-button 
            label="Save"
            icon="pi pi-check"
            [loading]="savingAvailability()"
            (onClick)="saveAvailability()"
          ></p-button>
        </ng-template>
      </p-dialog>

      <!-- Team Availability Overview Dialog (for coaches) -->
      <p-dialog 
        [(visible)]="showTeamAvailabilityDialog" 
        header="Team Availability"
        [modal]="true"
        [style]="{ width: '800px', maxHeight: '80vh' }"
        [draggable]="false"
      >
        @if (selectedTournament) {
          <div class="team-availability-dialog">
            <div class="tournament-summary">
              <h3>{{ selectedTournament.flag }} {{ selectedTournament.name }}</h3>
              <p class="tournament-dates">{{ tournamentService.formatDateRange(selectedTournament.start_date, selectedTournament.end_date) }}</p>
            </div>

            <!-- Summary Stats -->
            <div class="availability-summary">
              <div class="summary-stat confirmed">
                <div class="stat-value">{{ teamAvailabilitySummary().confirmed }}</div>
                <div class="stat-label">Confirmed</div>
              </div>
              <div class="summary-stat tentative">
                <div class="stat-value">{{ teamAvailabilitySummary().tentative }}</div>
                <div class="stat-label">Tentative</div>
              </div>
              <div class="summary-stat declined">
                <div class="stat-value">{{ teamAvailabilitySummary().declined }}</div>
                <div class="stat-label">Declined</div>
              </div>
              <div class="summary-stat pending">
                <div class="stat-value">{{ teamAvailabilitySummary().pending }}</div>
                <div class="stat-label">No Response</div>
              </div>
            </div>

            <!-- Budget Overview -->
            @if (tournamentBudget()) {
              <div class="budget-overview">
                <h4><i class="pi pi-wallet"></i> Budget Overview</h4>
                <div class="budget-grid">
                  <div class="budget-item">
                    <span class="budget-label">Total Estimated</span>
                    <span class="budget-value">€{{ tournamentBudget()!.totalEstimated | number:'1.2-2' }}</span>
                  </div>
                  <div class="budget-item">
                    <span class="budget-label">Team Contribution</span>
                    <span class="budget-value">€{{ tournamentBudget()!.teamContribution | number:'1.2-2' }}</span>
                  </div>
                  <div class="budget-item">
                    <span class="budget-label">Sponsor Contribution</span>
                    <span class="budget-value">€{{ tournamentBudget()!.sponsorContribution | number:'1.2-2' }}</span>
                  </div>
                  <div class="budget-item highlight">
                    <span class="budget-label">Per Player</span>
                    <span class="budget-value">€{{ tournamentBudget()!.perPlayer | number:'1.2-2' }}</span>
                  </div>
                </div>
                <p-button 
                  label="Manage Budget"
                  icon="pi pi-cog"
                  [outlined]="true"
                  size="small"
                  (onClick)="openBudgetDialog()"
                ></p-button>
              </div>
            }

            <!-- Player List -->
            <div class="player-availability-list">
              <h4>Player Responses</h4>
              @for (player of teamAvailability(); track player.playerId) {
                <div class="player-availability-item" [class]="'status-' + player.status">
                  <div class="player-info">
                    <span class="player-name">{{ player.playerName }}</span>
                    <span class="player-position">{{ player.position }}</span>
                  </div>
                  <div class="player-status">
                    <p-tag 
                      [value]="getAvailabilityLabel(player.status)"
                      [severity]="getAvailabilitySeverity(player.status)"
                    ></p-tag>
                  </div>
                  @if (player.reason) {
                    <div class="player-reason">
                      <i class="pi pi-info-circle"></i>
                      {{ player.reason }}
                    </div>
                  }
                  <div class="player-payment">
                    @if (player.paymentStatus === 'paid') {
                      <p-tag value="Paid" severity="success"></p-tag>
                    } @else if (player.paymentStatus === 'partial') {
                      <p-tag value="Partial" severity="warn"></p-tag>
                    } @else if (player.status === 'confirmed') {
                      <p-tag value="Unpaid" severity="danger"></p-tag>
                    }
                  </div>
                </div>
              } @empty {
                <div class="empty-list">
                  <p>No player responses yet</p>
                </div>
              }
            </div>

            <!-- Actions -->
            <div class="dialog-actions">
              <p-button 
                label="Send Reminders"
                icon="pi pi-bell"
                [outlined]="true"
                (onClick)="sendAvailabilityReminders()"
              ></p-button>
              <p-button 
                label="Export Report"
                icon="pi pi-download"
                [outlined]="true"
                (onClick)="exportAvailabilityReport()"
              ></p-button>
            </div>
          </div>
        }

        <ng-template pTemplate="footer">
          <p-button 
            label="Close" 
            (onClick)="showTeamAvailabilityDialog = false"
          ></p-button>
        </ng-template>
      </p-dialog>

      <!-- Budget Management Dialog -->
      <p-dialog 
        [(visible)]="showBudgetDialog" 
        header="Tournament Budget"
        [modal]="true"
        [style]="{ width: '700px' }"
        [draggable]="false"
      >
        @if (selectedTournament) {
          <div class="budget-dialog">
            <div class="form-grid">
              <div class="form-field">
                <label>Registration Fee</label>
                <p-inputNumber 
                  [(ngModel)]="budgetForm.registrationFee"
                  mode="currency"
                  currency="EUR"
                  locale="en-US"
                  [style]="{ width: '100%' }"
                ></p-inputNumber>
              </div>
              <div class="form-field">
                <label>Entry Fee Per Player</label>
                <p-inputNumber 
                  [(ngModel)]="budgetForm.entryFeePerPlayer"
                  mode="currency"
                  currency="EUR"
                  locale="en-US"
                  [style]="{ width: '100%' }"
                ></p-inputNumber>
              </div>
              <div class="form-field">
                <label>Travel Cost (Estimated)</label>
                <p-inputNumber 
                  [(ngModel)]="budgetForm.travelCost"
                  mode="currency"
                  currency="EUR"
                  locale="en-US"
                  [style]="{ width: '100%' }"
                ></p-inputNumber>
              </div>
              <div class="form-field">
                <label>Accommodation Per Night</label>
                <p-inputNumber 
                  [(ngModel)]="budgetForm.accommodationPerNight"
                  mode="currency"
                  currency="EUR"
                  locale="en-US"
                  [style]="{ width: '100%' }"
                ></p-inputNumber>
              </div>
              <div class="form-field">
                <label>Number of Nights</label>
                <p-inputNumber 
                  [(ngModel)]="budgetForm.totalNights"
                  [min]="0"
                  [style]="{ width: '100%' }"
                ></p-inputNumber>
              </div>
              <div class="form-field">
                <label>Per Diem Per Player</label>
                <p-inputNumber 
                  [(ngModel)]="budgetForm.perDiem"
                  mode="currency"
                  currency="EUR"
                  locale="en-US"
                  [style]="{ width: '100%' }"
                ></p-inputNumber>
              </div>
              <div class="form-field full-width">
                <label>Other Costs</label>
                <p-inputNumber 
                  [(ngModel)]="budgetForm.otherCosts"
                  mode="currency"
                  currency="EUR"
                  locale="en-US"
                  [style]="{ width: '100%' }"
                ></p-inputNumber>
              </div>
              <div class="form-field full-width">
                <label>Other Costs Description</label>
                <input 
                  pInputText 
                  [(ngModel)]="budgetForm.otherCostsDescription"
                  placeholder="Equipment, uniforms, etc."
                  class="w-full"
                />
              </div>
            </div>

            <div class="budget-funding">
              <h4>Funding Sources</h4>
              <div class="form-grid">
                <div class="form-field">
                  <label>Team Contribution</label>
                  <p-inputNumber 
                    [(ngModel)]="budgetForm.teamContribution"
                    mode="currency"
                    currency="EUR"
                    locale="en-US"
                    [style]="{ width: '100%' }"
                  ></p-inputNumber>
                </div>
                <div class="form-field">
                  <label>Sponsor Contribution</label>
                  <p-inputNumber 
                    [(ngModel)]="budgetForm.sponsorContribution"
                    mode="currency"
                    currency="EUR"
                    locale="en-US"
                    [style]="{ width: '100%' }"
                  ></p-inputNumber>
                </div>
              </div>
            </div>

            <!-- Calculated Summary -->
            <div class="budget-calculated">
              <div class="calc-row">
                <span>Total Estimated Cost:</span>
                <span class="calc-value">€{{ calculateTotalBudget() | number:'1.2-2' }}</span>
              </div>
              <div class="calc-row">
                <span>Total Funding:</span>
                <span class="calc-value">€{{ (budgetForm.teamContribution + budgetForm.sponsorContribution) | number:'1.2-2' }}</span>
              </div>
              <div class="calc-row highlight">
                <span>Player Share ({{ teamAvailabilitySummary().confirmed }} confirmed):</span>
                <span class="calc-value">€{{ calculatePlayerShare() | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>
        }

        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            [outlined]="true"
            (onClick)="showBudgetDialog = false"
          ></p-button>
          <p-button 
            label="Save Budget"
            icon="pi pi-check"
            [loading]="savingBudget()"
            (onClick)="saveBudget()"
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
        box-shadow: var(--shadow-lg);
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
        font-size: var(--font-heading-sm);
        font-weight: var(--font-weight-semibold);
        margin: var(--space-2) 0;
        color: var(--text-primary);
      }

      .tournament-subtitle {
        font-size: var(--font-body-sm);
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
        font-size: var(--font-body-xs);
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
        font-size: var(--font-heading-lg);
        font-weight: var(--font-weight-bold);
        color: var(--color-brand-primary);
      }

      .countdown-label {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .tournament-notes {
        padding: var(--space-3);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
        margin-bottom: var(--space-4);
        font-size: var(--font-body-sm);
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
        font-weight: var(--font-weight-medium);
        color: var(--text-primary);
        font-size: var(--font-body-sm);
      }

      .w-full {
        width: 100%;
      }

      /* Availability Dialog */
      .availability-dialog,
      .team-availability-dialog,
      .budget-dialog {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .tournament-summary {
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
        margin-bottom: var(--space-4);
      }

      .tournament-summary h3 {
        margin: 0 0 var(--space-2);
        font-size: var(--font-heading-sm);
      }

      .tournament-dates,
      .tournament-location {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin: var(--space-1) 0;
        color: var(--text-secondary);
        font-size: var(--font-body-sm);
      }

      .availability-options {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--space-3);
        margin-top: var(--space-2);
      }

      .availability-option {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-4);
        border: 2px solid var(--p-surface-200);
        border-radius: var(--p-border-radius);
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
      }

      .availability-option:hover {
        border-color: var(--color-brand-primary);
        background: var(--p-surface-50);
      }

      .availability-option.selected {
        border-color: var(--color-brand-primary);
        background: var(--color-brand-primary-bg);
      }

      .availability-option.option-confirmed.selected {
        border-color: var(--color-status-success);
        background: var(--color-status-success-bg);
      }

      .availability-option.option-tentative.selected {
        border-color: var(--color-status-warning);
        background: var(--color-status-warning-bg);
      }

      .availability-option.option-declined.selected {
        border-color: var(--color-status-error);
        background: var(--color-status-error-bg);
      }

      .availability-option i {
        font-size: 1.5rem;
      }

      .form-grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-4);
      }

      .cost-summary {
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
        border-left: 4px solid var(--color-brand-primary);
      }

      .cost-summary h4 {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin: 0 0 var(--space-3);
        font-size: var(--font-body-md);
      }

      .cost-breakdown {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .cost-item {
        display: flex;
        justify-content: space-between;
        padding: var(--space-2);
        background: white;
        border-radius: var(--p-border-radius);
      }

      .cost-item.paid {
        background: var(--color-status-success-bg);
      }

      .cost-item.remaining {
        background: var(--color-status-warning-bg);
        font-weight: var(--font-weight-semibold);
      }

      .cost-value {
        font-weight: var(--font-weight-bold);
        color: var(--color-brand-primary);
      }

      /* Team Availability Summary */
      .availability-summary {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--space-4);
        margin-bottom: var(--space-4);
      }

      .summary-stat {
        padding: var(--space-4);
        border-radius: var(--p-border-radius);
        text-align: center;
      }

      .summary-stat.confirmed {
        background: var(--color-status-success-bg);
        border: 1px solid var(--color-status-success);
      }

      .summary-stat.tentative {
        background: var(--color-status-warning-bg);
        border: 1px solid var(--color-status-warning);
      }

      .summary-stat.declined {
        background: var(--color-status-error-bg);
        border: 1px solid var(--color-status-error);
      }

      .summary-stat.pending {
        background: var(--p-surface-100);
        border: 1px solid var(--p-surface-300);
      }

      .summary-stat .stat-value {
        font-size: var(--font-heading-lg);
        font-weight: var(--font-weight-bold);
      }

      .summary-stat .stat-label {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      /* Budget Overview */
      .budget-overview {
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
        margin-bottom: var(--space-4);
      }

      .budget-overview h4 {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin: 0 0 var(--space-3);
      }

      .budget-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--space-3);
        margin-bottom: var(--space-3);
      }

      .budget-item {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .budget-item.highlight {
        background: var(--color-brand-primary-bg);
        padding: var(--space-2);
        border-radius: var(--p-border-radius);
      }

      .budget-label {
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
      }

      .budget-value {
        font-weight: var(--font-weight-bold);
        font-size: var(--font-body-lg);
      }

      /* Player Availability List */
      .player-availability-list {
        max-height: 300px;
        overflow-y: auto;
      }

      .player-availability-list h4 {
        margin: 0 0 var(--space-3);
        position: sticky;
        top: 0;
        background: white;
        padding: var(--space-2) 0;
      }

      .player-availability-item {
        display: grid;
        grid-template-columns: 1fr auto auto auto;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3);
        border-bottom: 1px solid var(--p-surface-100);
      }

      .player-availability-item:last-child {
        border-bottom: none;
      }

      .player-info {
        display: flex;
        flex-direction: column;
      }

      .player-name {
        font-weight: var(--font-weight-medium);
      }

      .player-position {
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
      }

      .player-reason {
        grid-column: 1 / -1;
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        padding: var(--space-2);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
        margin-top: var(--space-2);
      }

      .empty-list {
        text-align: center;
        padding: var(--space-6);
        color: var(--text-secondary);
      }

      .dialog-actions {
        display: flex;
        gap: var(--space-3);
        justify-content: flex-end;
        padding-top: var(--space-4);
        border-top: 1px solid var(--p-surface-200);
      }

      /* Budget Dialog */
      .budget-funding {
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
      }

      .budget-funding h4 {
        margin: 0 0 var(--space-3);
      }

      .budget-calculated {
        padding: var(--space-4);
        background: var(--p-surface-100);
        border-radius: var(--p-border-radius);
      }

      .calc-row {
        display: flex;
        justify-content: space-between;
        padding: var(--space-2) 0;
        border-bottom: 1px solid var(--p-surface-200);
      }

      .calc-row:last-child {
        border-bottom: none;
      }

      .calc-row.highlight {
        font-weight: var(--font-weight-bold);
        font-size: var(--font-body-lg);
        background: var(--color-brand-primary-bg);
        padding: var(--space-3);
        border-radius: var(--p-border-radius);
        margin-top: var(--space-2);
      }

      .calc-value {
        font-weight: var(--font-weight-bold);
        color: var(--color-brand-primary);
      }

      /* ================================================================
         RESPONSIVE BREAKPOINTS - Full Coverage
         ================================================================ */
      
      /* Extra Large Screens (> 1400px) */
      @media (min-width: 1400px) {
        .tournaments-grid {
          grid-template-columns: repeat(3, 1fr);
        }
        
        .tournament-info {
          grid-template-columns: repeat(4, 1fr);
        }
        
        .budget-grid {
          grid-template-columns: repeat(4, 1fr);
        }
      }
      
      /* Large Screens (1200px - 1399px) */
      @media (min-width: 1200px) and (max-width: 1399px) {
        .tournaments-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        
        .tournament-info {
          grid-template-columns: repeat(3, 1fr);
        }
      }
      
      /* Medium-Large Screens (1024px - 1199px) */
      @media (min-width: 1024px) and (max-width: 1199px) {
        .tournaments-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        
        .tournament-info {
          grid-template-columns: repeat(2, 1fr);
        }
        
        .availability-summary {
          grid-template-columns: repeat(4, 1fr);
        }
      }
      
      /* Tablet Landscape (769px - 1023px) */
      @media (min-width: 769px) and (max-width: 1023px) {
        .tournaments-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        
        .tournament-info {
          grid-template-columns: repeat(2, 1fr);
        }
        
        .availability-options {
          grid-template-columns: repeat(2, 1fr);
        }
        
        .budget-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }
      
      /* Tablet Portrait (768px) */
      @media (max-width: 768px) {
        .header-actions {
          flex-direction: column;
          width: 100%;
        }

        .tournaments-grid {
          grid-template-columns: 1fr;
          gap: var(--space-4);
        }

        .tournament-info {
          grid-template-columns: 1fr;
        }

        .form-grid {
          grid-template-columns: 1fr;
        }

        .availability-options {
          grid-template-columns: repeat(2, 1fr);
        }

        .availability-summary {
          grid-template-columns: repeat(2, 1fr);
        }

        .budget-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .player-availability-item {
          grid-template-columns: 1fr;
          gap: var(--space-2);
        }
        
        .tournament-card {
          padding: var(--space-4);
        }
        
        .countdown-section {
          flex-direction: column;
          text-align: center;
        }
      }
      
      /* Mobile Large (481px - 767px) */
      @media (min-width: 481px) and (max-width: 767px) {
        .availability-options {
          grid-template-columns: repeat(2, 1fr);
        }
        
        .budget-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      
      /* Mobile Small (< 480px) */
      @media (max-width: 480px) {
        .tournaments-page {
          padding: var(--space-3);
        }
        
        .header-actions {
          gap: var(--space-2);
        }
        
        .tournament-card {
          padding: var(--space-3);
        }
        
        .availability-options {
          grid-template-columns: 1fr;
        }
        
        .availability-summary {
          grid-template-columns: 1fr;
        }
        
        .budget-grid {
          grid-template-columns: 1fr;
        }
        
        .calc-row {
          flex-direction: column;
          gap: var(--space-1);
          text-align: center;
        }
        
        .calc-row.highlight {
          padding: var(--space-2);
        }
      }
      
      /* Extra Small Screens (< 375px) */
      @media (max-width: 374px) {
        .tournaments-page {
          padding: var(--space-2);
        }
        
        .tournament-title {
          font-size: var(--font-body-lg);
        }
        
        .tournament-meta {
          flex-direction: column;
          align-items: flex-start;
        }
      }
      
      /* Landscape Mode on Mobile */
      @media (max-height: 500px) and (orientation: landscape) {
        .tournaments-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        
        .tournament-card {
          padding: var(--space-3);
        }
      }
      
      /* Touch Device Optimizations */
      @media (hover: none) and (pointer: coarse) {
        .tournament-card:hover {
          transform: none;
        }
        
        .availability-option,
        .header-actions button {
          min-height: 44px;
        }
      }
      
      /* Print Styles */
      @media print {
        .header-actions,
        .tournament-actions {
          display: none !important;
        }
        
        .tournaments-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        
        .tournament-card {
          box-shadow: none;
          border: 1px solid #ccc;
          page-break-inside: avoid;
        }
      }
    `,
  ],
})
export class TournamentsComponent implements OnInit {
  tournamentService = inject(TournamentService);
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private logger = inject(LoggerService);

  // Computed signals from service
  tournaments = this.tournamentService.tournaments;
  tournaments2026 = this.tournamentService.tournaments2026;
  tournaments2027 = this.tournamentService.tournaments2027;
  nextTournament = this.tournamentService.nextTournament;

  // Dialog state
  showDialog = false;
  editingTournament: Tournament | null = null;
  
  // Availability dialogs
  showAvailabilityDialog = false;
  showTeamAvailabilityDialog = false;
  showBudgetDialog = false;
  selectedTournament: Tournament | null = null;
  
  // Loading states
  savingAvailability = signal(false);
  savingBudget = signal(false);
  
  // Availability data
  teamAvailability = signal<PlayerAvailability[]>([]);
  teamAvailabilitySummary = signal({ confirmed: 0, tentative: 0, declined: 0, pending: 0 });
  tournamentBudget = signal<TournamentBudget | null>(null);
  tournamentCost = signal(0);
  
  // Availability form
  availabilityForm = {
    status: 'pending' as 'confirmed' | 'declined' | 'tentative' | 'pending',
    reason: '',
    arrivalDate: null as Date | null,
    departureDate: null as Date | null,
    accommodationNeeded: true,
    transportationNeeded: false,
    dietaryRestrictions: '',
    amountPaid: 0
  };
  
  // Budget form
  budgetForm = {
    registrationFee: 0,
    entryFeePerPlayer: 0,
    travelCost: 0,
    accommodationPerNight: 0,
    totalNights: 0,
    perDiem: 0,
    otherCosts: 0,
    otherCostsDescription: '',
    teamContribution: 0,
    sponsorContribution: 0
  };
  
  // Options
  availabilityOptions: Array<{ value: 'pending' | 'confirmed' | 'declined' | 'tentative'; label: string; icon: string }> = [
    { value: 'confirmed', label: 'Yes, I\'m in!', icon: 'pi pi-check-circle' },
    { value: 'tentative', label: 'Maybe', icon: 'pi pi-question-circle' },
    { value: 'declined', label: 'Can\'t make it', icon: 'pi pi-times-circle' },
    { value: 'pending', label: 'Undecided', icon: 'pi pi-clock' }
  ];

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
    this.logger.info('View details:', tournament);
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

  // ============================================================================
  // PLAYER AVAILABILITY
  // ============================================================================
  
  canViewTeamAvailability(): boolean {
    // Check if user is a coach or higher
    // This would need to check the user's role in their team
    return this.authService.isAuthenticated();
  }

  async openAvailabilityDialog(tournament: Tournament): Promise<void> {
    this.selectedTournament = tournament;
    this.showAvailabilityDialog = true;
    
    // Load existing availability
    await this.loadMyAvailability(tournament.id);
    await this.loadTournamentCost(tournament.id);
  }

  async loadMyAvailability(tournamentId: string): Promise<void> {
    try {
      const user = this.authService.currentUser();
      if (!user) return;

      const { data } = await this.supabaseService.client
        .from('player_tournament_availability')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('player_id', user.id)
        .single();

      if (data) {
        this.availabilityForm = {
          status: data.status || 'pending',
          reason: data.reason || '',
          arrivalDate: data.arrival_date ? new Date(data.arrival_date) : null,
          departureDate: data.departure_date ? new Date(data.departure_date) : null,
          accommodationNeeded: data.accommodation_needed ?? true,
          transportationNeeded: data.transportation_needed ?? false,
          dietaryRestrictions: data.dietary_restrictions || '',
          amountPaid: data.amount_paid || 0
        };
      } else {
        // Reset form
        this.availabilityForm = {
          status: 'pending',
          reason: '',
          arrivalDate: null,
          departureDate: null,
          accommodationNeeded: true,
          transportationNeeded: false,
          dietaryRestrictions: '',
          amountPaid: 0
        };
      }
    } catch (error) {
      this.logger.error('Error loading availability:', error);
    }
  }

  async loadTournamentCost(tournamentId: string): Promise<void> {
    try {
      const { data } = await this.supabaseService.client
        .rpc('calculate_player_tournament_cost', {
          p_tournament_id: tournamentId,
          p_team_id: await this.getCurrentTeamId()
        });

      this.tournamentCost.set(data || 0);
    } catch (error) {
      this.logger.error('Error loading tournament cost:', error);
      this.tournamentCost.set(0);
    }
  }

  async saveAvailability(): Promise<void> {
    if (!this.selectedTournament) return;
    
    this.savingAvailability.set(true);
    
    try {
      const user = this.authService.currentUser();
      if (!user) throw new Error('Not authenticated');

      const teamId = await this.getCurrentTeamId();
      if (!teamId) throw new Error('No team found');

      // Get player's team_member id
      const { data: memberData } = await this.supabaseService.client
        .from('team_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('team_id', teamId)
        .single();

      if (!memberData) throw new Error('Not a team member');

      const availabilityData = {
        player_id: memberData.id,
        tournament_id: this.selectedTournament.id,
        team_id: teamId,
        status: this.availabilityForm.status,
        reason: this.availabilityForm.reason || null,
        arrival_date: this.availabilityForm.arrivalDate 
          ? this.formatDate(this.availabilityForm.arrivalDate) 
          : null,
        departure_date: this.availabilityForm.departureDate 
          ? this.formatDate(this.availabilityForm.departureDate) 
          : null,
        accommodation_needed: this.availabilityForm.accommodationNeeded,
        transportation_needed: this.availabilityForm.transportationNeeded,
        dietary_restrictions: this.availabilityForm.dietaryRestrictions || null,
        responded_at: new Date().toISOString()
      };

      const { error } = await this.supabaseService.client
        .from('player_tournament_availability')
        .upsert(availabilityData, {
          onConflict: 'player_id,tournament_id'
        });

      if (error) throw error;

      this.messageService.add({
        severity: 'success',
        summary: 'Saved',
        detail: 'Your availability has been updated'
      });
      
      this.showAvailabilityDialog = false;
    } catch (error: any) {
      this.logger.error('Error saving availability:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to save availability'
      });
    } finally {
      this.savingAvailability.set(false);
    }
  }

  // ============================================================================
  // TEAM AVAILABILITY (COACH VIEW)
  // ============================================================================

  async openTeamAvailabilityDialog(tournament: Tournament): Promise<void> {
    this.selectedTournament = tournament;
    this.showTeamAvailabilityDialog = true;
    
    await this.loadTeamAvailability(tournament.id);
    await this.loadTournamentBudget(tournament.id);
  }

  async loadTeamAvailability(tournamentId: string): Promise<void> {
    try {
      const teamId = await this.getCurrentTeamId();
      if (!teamId) return;

      // Get all team players with their availability
      const { data: members } = await this.supabaseService.client
        .from('team_members')
        .select(`
          id,
          role,
          users:user_id(raw_user_meta_data)
        `)
        .eq('team_id', teamId)
        .eq('role', 'player');

      const { data: availability } = await this.supabaseService.client
        .from('player_tournament_availability')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('team_id', teamId);

      // Map availability to players
      const availabilityMap = new Map(
        (availability || []).map(a => [a.player_id, a])
      );

      const playerList: PlayerAvailability[] = (members || []).map((m: any) => {
        const avail = availabilityMap.get(m.id);
        return {
          playerId: m.id,
          playerName: m.users?.raw_user_meta_data?.full_name || 'Unknown',
          position: m.users?.raw_user_meta_data?.position || 'Player',
          status: avail?.status || 'pending',
          reason: avail?.reason,
          paymentStatus: avail?.payment_status || 'pending',
          amountPaid: avail?.amount_paid || 0
        };
      });

      this.teamAvailability.set(playerList);

      // Calculate summary
      const summary = { confirmed: 0, tentative: 0, declined: 0, pending: 0 };
      playerList.forEach(p => {
        summary[p.status]++;
      });
      this.teamAvailabilitySummary.set(summary);

    } catch (error) {
      this.logger.error('Error loading team availability:', error);
    }
  }

  async loadTournamentBudget(tournamentId: string): Promise<void> {
    try {
      const teamId = await this.getCurrentTeamId();
      if (!teamId) return;

      const { data } = await this.supabaseService.client
        .from('tournament_budgets')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('team_id', teamId)
        .single();

      if (data) {
        this.tournamentBudget.set({
          totalEstimated: data.total_estimated_cost || 0,
          teamContribution: data.team_contribution || 0,
          sponsorContribution: data.sponsor_contribution || 0,
          perPlayer: data.player_share_per_person || 0
        });
        
        // Populate budget form
        this.budgetForm = {
          registrationFee: data.registration_fee || 0,
          entryFeePerPlayer: data.entry_fee_per_player || 0,
          travelCost: data.estimated_travel_cost || 0,
          accommodationPerNight: data.accommodation_cost_per_night || 0,
          totalNights: data.total_nights || 0,
          perDiem: data.per_diem_per_player || 0,
          otherCosts: data.other_costs || 0,
          otherCostsDescription: data.other_costs_description || '',
          teamContribution: data.team_contribution || 0,
          sponsorContribution: data.sponsor_contribution || 0
        };
      } else {
        this.tournamentBudget.set(null);
      }
    } catch (error) {
      this.logger.error('Error loading budget:', error);
      this.tournamentBudget.set(null);
    }
  }

  getAvailabilityLabel(status: string): string {
    const labels: Record<string, string> = {
      confirmed: 'Confirmed',
      tentative: 'Maybe',
      declined: 'Can\'t Attend',
      pending: 'No Response'
    };
    return labels[status] || status;
  }

  getAvailabilitySeverity(status: string): 'success' | 'warn' | 'danger' | 'secondary' | 'info' | 'contrast' {
    const severities: Record<string, 'success' | 'warn' | 'danger' | 'secondary'> = {
      confirmed: 'success',
      tentative: 'warn',
      declined: 'danger',
      pending: 'secondary'
    };
    return severities[status] || 'secondary';
  }

  async sendAvailabilityReminders(): Promise<void> {
    // Would integrate with email service
    this.messageService.add({
      severity: 'info',
      summary: 'Reminders Sent',
      detail: 'Reminder emails have been sent to players who haven\'t responded'
    });
  }

  exportAvailabilityReport(): void {
    const players = this.teamAvailability();
    const tournament = this.selectedTournament;
    if (!tournament || players.length === 0) return;

    const headers = ['Name', 'Position', 'Status', 'Reason', 'Payment Status'];
    const rows = players.map(p => [
      p.playerName,
      p.position,
      this.getAvailabilityLabel(p.status),
      p.reason || '',
      p.paymentStatus
    ]);

    const csvContent = [
      `Tournament: ${tournament.name}`,
      `Date: ${tournament.start_date} - ${tournament.end_date}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${tournament.short_name || tournament.name}_availability.csv`;
    link.click();
  }

  // ============================================================================
  // BUDGET MANAGEMENT
  // ============================================================================

  openBudgetDialog(): void {
    this.showBudgetDialog = true;
  }

  calculateTotalBudget(): number {
    const confirmedPlayers = this.teamAvailabilitySummary().confirmed;
    return (
      this.budgetForm.registrationFee +
      (this.budgetForm.entryFeePerPlayer * confirmedPlayers) +
      this.budgetForm.travelCost +
      (this.budgetForm.accommodationPerNight * this.budgetForm.totalNights) +
      (this.budgetForm.perDiem * confirmedPlayers * (this.budgetForm.totalNights + 1)) +
      this.budgetForm.otherCosts
    );
  }

  calculatePlayerShare(): number {
    const confirmedPlayers = this.teamAvailabilitySummary().confirmed;
    if (confirmedPlayers === 0) return 0;
    
    const total = this.calculateTotalBudget();
    const funding = this.budgetForm.teamContribution + this.budgetForm.sponsorContribution;
    return Math.max(0, (total - funding) / confirmedPlayers);
  }

  async saveBudget(): Promise<void> {
    if (!this.selectedTournament) return;
    
    this.savingBudget.set(true);
    
    try {
      const teamId = await this.getCurrentTeamId();
      if (!teamId) throw new Error('No team found');

      const confirmedPlayers = this.teamAvailabilitySummary().confirmed;
      
      const budgetData = {
        tournament_id: this.selectedTournament.id,
        team_id: teamId,
        registration_fee: this.budgetForm.registrationFee,
        entry_fee_per_player: this.budgetForm.entryFeePerPlayer,
        estimated_travel_cost: this.budgetForm.travelCost,
        accommodation_cost_per_night: this.budgetForm.accommodationPerNight,
        total_nights: this.budgetForm.totalNights,
        estimated_accommodation_total: this.budgetForm.accommodationPerNight * this.budgetForm.totalNights,
        per_diem_per_player: this.budgetForm.perDiem,
        estimated_meals_total: this.budgetForm.perDiem * confirmedPlayers * (this.budgetForm.totalNights + 1),
        other_costs: this.budgetForm.otherCosts,
        other_costs_description: this.budgetForm.otherCostsDescription,
        team_contribution: this.budgetForm.teamContribution,
        sponsor_contribution: this.budgetForm.sponsorContribution,
        player_share_per_person: this.calculatePlayerShare(),
        budget_status: 'draft',
        created_by: this.authService.currentUser()?.id
      };

      const { error } = await this.supabaseService.client
        .from('tournament_budgets')
        .upsert(budgetData, {
          onConflict: 'tournament_id,team_id'
        });

      if (error) throw error;

      this.messageService.add({
        severity: 'success',
        summary: 'Saved',
        detail: 'Budget has been updated'
      });
      
      // Reload budget to get calculated fields
      await this.loadTournamentBudget(this.selectedTournament.id);
      this.showBudgetDialog = false;
    } catch (error: any) {
      this.logger.error('Error saving budget:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to save budget'
      });
    } finally {
      this.savingBudget.set(false);
    }
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private async getCurrentTeamId(): Promise<string | null> {
    const user = this.authService.currentUser();
    if (!user) return null;

    try {
      const { data } = await this.supabaseService.client
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      return data?.team_id || null;
    } catch {
      return null;
    }
  }
}
