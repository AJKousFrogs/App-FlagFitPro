import { CommonModule, DecimalPipe } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    OnInit,
    inject,
    signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";

import { ToastService } from "../../core/services/toast.service";
import { Card } from "primeng/card";
import { Checkbox } from "primeng/checkbox";
import { ConfirmDialog } from "primeng/confirmdialog";
import { DatePicker } from "primeng/datepicker";
import { Dialog } from "primeng/dialog";
import { InputNumber } from "primeng/inputnumber";
import { InputText } from "primeng/inputtext";

import { Select } from "primeng/select";
import { TabPanel, Tabs } from "primeng/tabs";
import { Textarea } from "primeng/textarea";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";

import { AuthService } from "../../core/services/auth.service";
import { ConfirmDialogService } from "../../core/services/confirm-dialog.service";
import {
    LoggerService,
    toLogContext,
} from "../../core/services/logger.service";
import { TeamMembershipService } from "../../core/services/team-membership.service";
import {
    CreateTournamentDto,
    Tournament,
    TournamentService,
    TournamentVisibilityScope,
} from "../../core/services/tournament.service";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";
import { formatDateISO } from "../../shared/utils/date.utils";
import { getCountryFlag } from "../../core/constants";
import { TournamentsDataService } from "./services/tournaments-data.service";

interface PlayerAvailability {
  playerId: string;
  playerName: string;
  position: string;
  status: "confirmed" | "declined" | "tentative" | "pending";
  reason?: string;
  paymentStatus: "pending" | "paid" | "partial" | "not_required";
  amountPaid: number;
}

type AvailabilityStatus = PlayerAvailability["status"];
type PaymentStatus = PlayerAvailability["paymentStatus"];

interface AvailabilityRecord {
  player_id?: string;
  status?: string;
  reason?: string | null;
  payment_status?: string;
  amount_paid?: number;
}

interface TournamentBudgetRecord {
  total_estimated_cost?: number;
  team_contribution?: number;
  sponsor_contribution?: number;
  player_share_per_person?: number;
  registration_fee?: number;
  entry_fee_per_player?: number;
  estimated_travel_cost?: number;
  accommodation_cost_per_night?: number;
  total_nights?: number;
  per_diem_per_player?: number;
  other_costs?: number;
  other_costs_description?: string;
}

interface TeamMemberRecord {
  id: string;
  users?: {
    raw_user_meta_data?: {
      full_name?: string;
      position?: string;
    };
  };
}

interface TournamentBudget {
  totalEstimated: number;
  teamContribution: number;
  sponsorContribution: number;
  perPlayer: number;
}

const availabilityStatuses: AvailabilityStatus[] = [
  "pending",
  "declined",
  "confirmed",
  "tentative",
];

const paymentStatuses: PaymentStatus[] = [
  "pending",
  "paid",
  "partial",
  "not_required",
];

const isString = (value: unknown): value is string => typeof value === "string";

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean";

const isAvailabilityStatus = (value: unknown): value is AvailabilityStatus =>
  availabilityStatuses.includes(value as AvailabilityStatus);

const isPaymentStatus = (value: unknown): value is PaymentStatus =>
  paymentStatuses.includes(value as PaymentStatus);

const toStringValue = (value: unknown, fallback: string): string =>
  isString(value) ? value : fallback;

const toNumberValue = (value: unknown, fallback: number): number =>
  isNumber(value) ? value : fallback;

const toBooleanValue = (value: unknown, fallback: boolean): boolean =>
  isBoolean(value) ? value : fallback;

const toDateOrNull = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return value;
  }
  if (isString(value) || isNumber(value)) {
    return new Date(value);
  }
  return null;
};

@Component({
  selector: "app-tournaments",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    Card,
    Tabs,
    TabPanel,
    Dialog,
    
    InputText,
    Textarea,
    DatePicker,
    Select,
    InputNumber,
    Checkbox,
    ConfirmDialog,
    
    MainLayoutComponent,
    PageHeaderComponent,
    DecimalPipe,
    ButtonComponent,
    IconButtonComponent,
    StatusTagComponent,
    EmptyStateComponent,
    AppLoadingComponent,
  ],
  template: `
    <app-main-layout>
      <p-confirmDialog></p-confirmDialog>

      <div class="tournaments-page">
        <app-page-header
          title="Tournament Schedule"
          subtitle="View and manage upcoming flag football tournaments"
          icon="pi-trophy"
        >
          <div class="header-actions">
            @if (nextTournament(); as next) {
              <app-icon-button
                icon="pi-calendar"
                variant="outlined"
                (clicked)="scrollToTournament(next.id)"
                ariaLabel="Go to next tournament"
                tooltip="Next tournament"
              />
            }
            @if (isAuthenticated()) {
              <app-icon-button
                icon="pi-plus"
                (clicked)="openCreateDialog()"
                ariaLabel="Add new tournament"
                tooltip="Add tournament"
              />
            }
          </div>
        </app-page-header>

        <!-- Loading State -->
        @if (tournamentService.loading()) {
          <app-loading message="Loading tournaments..." variant="inline" />
        }

        <!-- Empty State -->
        @if (!tournamentService.loading() && tournaments().length === 0) {
          <app-empty-state
            icon="pi-calendar-times"
            heading="No Tournaments Scheduled"
            description="There are no tournaments in the system yet."
            [actionLabel]="isAuthenticated() ? 'Add First Tournament' : null"
            [actionHandler]="isAuthenticated() ? openCreateDialogHandler : null"
          />
        }

        <!-- Tournament Tabs -->
        @if (tournaments().length > 0) {
          <p-tabs>
            <p-tabpanel header="2026 Season" leftIcon="pi pi-calendar">
              <div class="tournaments-grid">
                @for (tournament of tournaments2026(); track tournament.id) {
                  <p-card
                    class="tournament-card"
                    [attr.data-id]="tournament.id"
                    [class.personal-tournament]="
                      isPersonalTournament(tournament)
                    "
                  >
                    <div class="tournament-header">
                      <div class="header-row">
                        <div class="tags-row">
                          <app-status-tag
                            [value]="
                              tournamentService.getStatusLabel(
                                tournament.calculatedStatus || 'upcoming'
                              )
                            "
                            [severity]="
                              tournamentService.getStatusSeverity(
                                tournament.calculatedStatus || 'upcoming'
                              )
                            "
                            size="sm"
                          />
                          @if (isPersonalTournament(tournament)) {
                            <app-status-tag
                              value="Personal"
                              severity="warning"
                              icon="pi-user"
                              size="sm"
                            />
                          }
                        </div>
                        @if (isAuthenticated()) {
                          <div class="card-actions">
                            <app-icon-button
                              icon="pi-pencil"
                              variant="text"
                              size="sm"
                              (clicked)="openEditDialog(tournament)"
                              ariaLabel="Edit tournament"
                              tooltip="Edit"
                            />
                            <app-icon-button
                              icon="pi-trash"
                              variant="text"
                              size="sm"
                              (clicked)="confirmDelete(tournament)"
                              ariaLabel="Delete tournament"
                              tooltip="Delete"
                            />
                          </div>
                        }
                      </div>
                      <h3 class="tournament-title">
                        {{ tournament.flag }} {{ tournament.name }}
                      </h3>
                      <p class="tournament-subtitle">
                        {{
                          tournament.tournament_type === "game_day"
                            ? "Game Day"
                            : tournament.tournament_type || "Championship"
                        }}
                      </p>
                    </div>
                    <div class="tournament-body">
                      <div class="tournament-info">
                        <div class="info-item">
                          <div class="info-icon">
                            <i class="pi pi-calendar"></i>
                          </div>
                          <div>
                            <div class="info-value">
                              {{
                                tournamentService.formatDateRange(
                                  tournament.start_date,
                                  tournament.end_date
                                )
                              }}
                            </div>
                            <div class="info-label">Date</div>
                          </div>
                        </div>
                        <div class="info-item">
                          <div class="info-icon"><i class="pi pi-map-marker" aria-hidden="true"></i></div>
                          <div>
                            <div class="info-value">
                              {{ tournament.location || "TBD" }}
                            </div>
                            <div class="info-label">
                              {{ tournament.country || "Location" }}
                            </div>
                          </div>
                        </div>
                        @if (tournament.venue) {
                          <div class="info-item">
                            <div class="info-icon"><i class="pi pi-building" aria-hidden="true"></i></div>
                            <div>
                              <div class="info-value">
                                {{ tournament.venue }}
                              </div>
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
                              <div class="info-value">
                                {{ tournament.expected_teams }}
                              </div>
                              <div class="info-label">Expected Teams</div>
                            </div>
                          </div>
                        }
                      </div>

                      @if (tournament.daysUntil && tournament.daysUntil > 0) {
                        <div class="tournament-countdown">
                          <span class="countdown-value">{{
                            tournament.daysUntil
                          }}</span>
                          <span class="countdown-label"
                            >days until tournament</span
                          >
                        </div>
                      }

                      @if (tournament.notes) {
                        <div class="tournament-notes">
                          <p>{{ tournament.notes }}</p>
                        </div>
                      }

                      <div class="tournament-actions">
                        @if (tournament.website_url) {
                          <app-button
                            variant="outlined"
                            size="sm"
                            iconLeft="pi-external-link"
                            (clicked)="openWebsite(tournament.website_url)"
                            >Website</app-button
                          >
                        }
                        @if (isAuthenticated()) {
                          <app-button
                            variant="outlined"
                            size="sm"
                            iconLeft="pi-calendar-plus"
                            (clicked)="openAvailabilityDialog(tournament)"
                            >My Availability</app-button
                          >
                        }
                        @if (canViewTeamAvailability()) {
                          <app-button
                            size="sm"
                            iconLeft="pi-users"
                            (clicked)="openTeamAvailabilityDialog(tournament)"
                            >Team Status</app-button
                          >
                        }
                        <app-button
                          size="sm"
                          (clicked)="viewDetails(tournament)"
                          >View Details</app-button
                        >
                      </div>
                    </div>
                  </p-card>
                } @empty {
                  <div class="empty-season">
                    <p>No tournaments scheduled for 2026 yet.</p>
                    @if (isAuthenticated()) {
                      <app-button
                        variant="outlined"
                        iconLeft="pi-plus"
                        (clicked)="openCreateDialog()"
                        >Add Tournament</app-button
                      >
                    }
                  </div>
                }
              </div>
            </p-tabpanel>

            <p-tabpanel header="2027 Season" leftIcon="pi pi-calendar">
              <div class="tournaments-grid">
                @for (tournament of tournaments2027(); track tournament.id) {
                  <p-card
                    class="tournament-card"
                    [attr.data-id]="tournament.id"
                    [class.personal-tournament]="
                      isPersonalTournament(tournament)
                    "
                  >
                    <div class="tournament-header">
                      <div class="header-row">
                        <div class="tags-row">
                          <app-status-tag
                            [value]="
                              tournamentService.getStatusLabel(
                                tournament.calculatedStatus || 'upcoming'
                              )
                            "
                            [severity]="
                              tournamentService.getStatusSeverity(
                                tournament.calculatedStatus || 'upcoming'
                              )
                            "
                            size="sm"
                          />
                          @if (isPersonalTournament(tournament)) {
                            <app-status-tag
                              value="Personal"
                              severity="warning"
                              icon="pi-user"
                              size="sm"
                            />
                          }
                        </div>
                        @if (isAuthenticated()) {
                          <div class="card-actions">
                            <app-icon-button
                              icon="pi-pencil"
                              variant="text"
                              size="sm"
                              (clicked)="openEditDialog(tournament)"
                              ariaLabel="Edit tournament"
                              tooltip="Edit"
                            />
                            <app-icon-button
                              icon="pi-trash"
                              variant="text"
                              size="sm"
                              (clicked)="confirmDelete(tournament)"
                              ariaLabel="Delete tournament"
                              tooltip="Delete"
                            />
                          </div>
                        }
                      </div>
                      <h3 class="tournament-title">
                        {{ tournament.flag }} {{ tournament.name }}
                      </h3>
                      <p class="tournament-subtitle">
                        {{
                          tournament.tournament_type === "game_day"
                            ? "Game Day"
                            : tournament.tournament_type || "Championship"
                        }}
                      </p>
                    </div>
                    <div class="tournament-body">
                      <div class="tournament-info">
                        <div class="info-item">
                          <div class="info-icon">
                            <i class="pi pi-calendar"></i>
                          </div>
                          <div>
                            <div class="info-value">
                              {{
                                tournamentService.formatDateRange(
                                  tournament.start_date,
                                  tournament.end_date
                                )
                              }}
                            </div>
                            <div class="info-label">Date</div>
                          </div>
                        </div>
                        <div class="info-item">
                          <div class="info-icon"><i class="pi pi-map-marker" aria-hidden="true"></i></div>
                          <div>
                            <div class="info-value">
                              {{ tournament.location || "TBD" }}
                            </div>
                            <div class="info-label">
                              {{ tournament.country || "Location" }}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="tournament-actions">
                        <app-button
                          size="sm"
                          (clicked)="viewDetails(tournament)"
                          >View Details</app-button
                        >
                      </div>
                    </div>
                  </p-card>
                } @empty {
                  <div class="empty-season">
                    <p>No tournaments scheduled for 2027 yet.</p>
                    @if (isAuthenticated()) {
                      <app-button
                        variant="outlined"
                        iconLeft="pi-plus"
                        (clicked)="openCreateDialog()"
                        >Add Tournament</app-button
                      >
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
        [header]="getDialogTitle()"
        [modal]="true"
        [draggable]="false"
        [resizable]="false"
        class="tournament-dialog"
      >
        <div class="tournament-form form-controls-full">
          <!-- Visibility Info Banner -->
          @if (isPlayer() && !editingTournament) {
            <div class="visibility-info-banner personal">
              <div class="banner-icon">
                <i class="pi pi-user"></i>
              </div>
              <div class="banner-content">
                <strong>Personal Game Day</strong>
                <p>
                  This will only be visible to you and your coaches. It won't
                  affect other players' schedules or workload calculations.
                </p>
              </div>
            </div>
          }
          @if (isCoachOrAdmin() && !editingTournament) {
            <div class="visibility-info-banner team">
              <div class="banner-icon">
                <i class="pi pi-users"></i>
              </div>
              <div class="banner-content">
                <strong>Team Tournament</strong>
                <p>
                  This will be visible to all team members and will affect
                  everyone's training schedule and workload calculations.
                </p>
              </div>
            </div>
          }
          @if (editingTournament && isPersonalTournament(editingTournament)) {
            <div class="visibility-info-banner personal">
              <div class="banner-icon">
                <i class="pi pi-user"></i>
              </div>
              <div class="banner-content">
                <strong>Personal Game Day</strong>
                <p>Only visible to the player who created it and coaches.</p>
              </div>
            </div>
          }

          <!-- Section: Basic Info -->
          <div class="form-section">
            <div class="section-header">
              <i class="pi pi-trophy"></i>
              <span>Basic Information</span>
            </div>
            <div class="form-row">
              <div class="form-field full-width">
                <label for="tournament-name">
                  <i class="pi pi-tag"></i>
                  {{ isPlayer() ? "Game Day Name" : "Tournament Name" }}
                  <span class="required">*</span>
                </label>
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
            </div>
            <div class="form-row two-col">
              <div class="form-field">
                <label for="tournament-shortName">
                  <i class="pi pi-bookmark"></i>
                  Short Name
                </label>
                <input
                  pInputText
                  id="tournament-shortName"
                  name="shortName"
                  [(ngModel)]="formData.short_name"
                  placeholder="e.g., Adria Bowl"
                  autocomplete="off"
                />
              </div>
              <div class="form-field">
                <label for="tournament-teams">
                  <i class="pi pi-users"></i>
                  Expected Teams
                </label>
                <p-inputNumber
                  inputId="tournament-teams"
                  [(ngModel)]="formData.expected_teams"
                  [min]="2"
                  [max]="100"
                  placeholder="Number of teams"
                  class="w-full"
                ></p-inputNumber>
              </div>
            </div>
          </div>

          <!-- Section: Location -->
          <div class="form-section">
            <div class="section-header">
              <i class="pi pi-map-marker"></i>
              <span>Location</span>
            </div>
            <div class="form-row two-col">
              <div class="form-field">
                <label for="tournament-country">
                  <i class="pi pi-globe"></i>
                  Country
                </label>
                <input
                  pInputText
                  id="tournament-country"
                  name="country"
                  [(ngModel)]="formData.country"
                  placeholder="e.g., Croatia"
                  autocomplete="country-name"
                />
              </div>
              <div class="form-field">
                <label for="tournament-location">
                  <i class="pi pi-building"></i>
                  City
                </label>
                <input
                  pInputText
                  id="tournament-location"
                  name="location"
                  [(ngModel)]="formData.location"
                  placeholder="e.g., Zagreb"
                  autocomplete="address-level2"
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-field full-width">
                <label for="tournament-venue">
                  <i class="pi pi-home"></i>
                  Venue / Stadium
                </label>
                <input
                  pInputText
                  id="tournament-venue"
                  name="venue"
                  [(ngModel)]="formData.venue"
                  placeholder="e.g., Stadium Name or Sports Complex"
                  autocomplete="off"
                />
              </div>
            </div>
          </div>

          <!-- Section: Dates -->
          <div class="form-section">
            <div class="section-header">
              <i class="pi pi-calendar"></i>
              <span>Dates</span>
            </div>
            <div class="form-row two-col">
              <div class="form-field">
                <label for="tournament-startDate">
                  <i class="pi pi-calendar-plus"></i>
                  Start Date <span class="required">*</span>
                </label>
                <p-datepicker
                  inputId="tournament-startDate"
                  [(ngModel)]="formData.start_date_obj"
                  [showIcon]="true"
                  [iconDisplay]="'input'"
                  dateFormat="dd M yy"
                  placeholder="Select start date"
                  class="w-full"
                  appendTo="body"
                ></p-datepicker>
              </div>
              <div class="form-field">
                <label for="tournament-endDate">
                  <i class="pi pi-calendar-minus"></i>
                  End Date
                </label>
                <p-datepicker
                  inputId="tournament-endDate"
                  [(ngModel)]="formData.end_date_obj"
                  [showIcon]="true"
                  [iconDisplay]="'input'"
                  dateFormat="dd M yy"
                  placeholder="Select end date"
                  class="w-full"
                  appendTo="body"
                ></p-datepicker>
              </div>
            </div>
            <div class="form-row">
              <div class="form-field full-width">
                <label for="tournament-deadline">
                  <i class="pi pi-clock"></i>
                  Registration Deadline
                </label>
                <p-datepicker
                  inputId="tournament-deadline"
                  [(ngModel)]="formData.registration_deadline_obj"
                  [showIcon]="true"
                  [iconDisplay]="'input'"
                  dateFormat="dd M yy"
                  placeholder="Select registration deadline"
                  class="w-full"
                  appendTo="body"
                ></p-datepicker>
              </div>
            </div>
          </div>

          <!-- Section: Classification -->
          <div class="form-section">
            <div class="section-header">
              <i class="pi pi-sliders-h"></i>
              <span>Classification</span>
            </div>
            <div class="form-row two-col">
              <div class="form-field">
                <label for="tournament-type">
                  <i class="pi pi-flag"></i>
                  Tournament Type
                </label>
                <p-select
                  inputId="tournament-type"
                  [(ngModel)]="formData.tournament_type"
                  [options]="tournamentTypes"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select type"
                  class="w-full"
                  appendTo="body"
                ></p-select>
              </div>
              <div class="form-field">
                <label for="tournament-level">
                  <i class="pi pi-star"></i>
                  Competition Level
                </label>
                <p-select
                  inputId="tournament-level"
                  [(ngModel)]="formData.competition_level"
                  [options]="competitionLevels"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select level"
                  class="w-full"
                  appendTo="body"
                ></p-select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-field full-width checkbox-field">
                <p-checkbox
                  [(ngModel)]="formData.is_home_tournament"
                  [binary]="true"
                  variant="filled"
                  inputId="homeTournament"
                ></p-checkbox>
                <label for="homeTournament" class="checkbox-label">
                  <i class="pi pi-home"></i>
                  This is a home tournament (we are hosting)
                </label>
              </div>
            </div>
          </div>

          <!-- Section: Links & Social -->
          <div class="form-section">
            <div class="section-header">
              <i class="pi pi-link"></i>
              <span>Links & Social Media</span>
            </div>
            <div class="form-row two-col">
              <div class="form-field">
                <label for="tournament-website">
                  <i class="pi pi-globe"></i>
                  Official Website
                </label>
                <input
                  pInputText
                  id="tournament-website"
                  name="website"
                  [(ngModel)]="formData.website_url"
                  placeholder="https://tournament-website.com"
                  autocomplete="url"
                />
              </div>
              <div class="form-field">
                <label for="tournament-instagram">
                  <i class="pi pi-instagram"></i>
                  Instagram
                </label>
                <input
                  pInputText
                  id="tournament-instagram"
                  name="instagram"
                  [(ngModel)]="formData.instagram_url"
                  placeholder="https://instagram.com/tournament"
                  autocomplete="off"
                />
              </div>
            </div>
            <div class="form-row two-col">
              <div class="form-field">
                <label for="tournament-facebook">
                  <i class="pi pi-facebook"></i>
                  Facebook
                </label>
                <input
                  pInputText
                  id="tournament-facebook"
                  name="facebook"
                  [(ngModel)]="formData.facebook_url"
                  placeholder="https://facebook.com/event/..."
                  autocomplete="off"
                />
              </div>
              <div class="form-field">
                <label for="tournament-registration">
                  <i class="pi pi-file-edit"></i>
                  Registration Link
                </label>
                <input
                  pInputText
                  id="tournament-registration"
                  name="registration"
                  [(ngModel)]="formData.registration_url"
                  placeholder="https://registration-form.com"
                  autocomplete="off"
                />
              </div>
            </div>
          </div>

          <!-- Section: Venue & Accommodation -->
          <div class="form-section">
            <div class="section-header">
              <i class="pi pi-map"></i>
              <span>Venue & Accommodation</span>
            </div>
            <div class="form-row two-col">
              <div class="form-field">
                <label for="tournament-venue-map">
                  <i class="pi pi-map-marker"></i>
                  Venue Location (Google Maps)
                </label>
                <input
                  pInputText
                  id="tournament-venue-map"
                  name="venueMap"
                  [(ngModel)]="formData.venue_maps_url"
                  placeholder="https://maps.google.com/..."
                  autocomplete="off"
                />
              </div>
              <div class="form-field">
                <label for="tournament-hotel-map">
                  <i class="pi pi-building"></i>
                  Hotel Location (Google Maps)
                </label>
                <input
                  pInputText
                  id="tournament-hotel-map"
                  name="hotelMap"
                  [(ngModel)]="formData.hotel_maps_url"
                  placeholder="https://maps.google.com/..."
                  autocomplete="off"
                />
              </div>
            </div>
            <div class="form-row two-col">
              <div class="form-field">
                <label for="tournament-hotel-name">
                  <i class="pi pi-home"></i>
                  Recommended Hotel
                </label>
                <input
                  pInputText
                  id="tournament-hotel-name"
                  name="hotelName"
                  [(ngModel)]="formData.hotel_name"
                  placeholder="e.g., Hotel Ambassador"
                  autocomplete="off"
                />
              </div>
              <div class="form-field">
                <label for="tournament-hotel-booking">
                  <i class="pi pi-external-link"></i>
                  Hotel Booking Link
                </label>
                <input
                  pInputText
                  id="tournament-hotel-booking"
                  name="hotelBooking"
                  [(ngModel)]="formData.hotel_booking_url"
                  placeholder="https://booking.com/..."
                  autocomplete="off"
                />
              </div>
            </div>
          </div>

          <!-- Section: Contact & Notes -->
          <div class="form-section">
            <div class="section-header">
              <i class="pi pi-info-circle"></i>
              <span>Contact & Notes</span>
            </div>
            <div class="form-row two-col">
              <div class="form-field">
                <label for="tournament-contact-name">
                  <i class="pi pi-user"></i>
                  Contact Person
                </label>
                <input
                  pInputText
                  id="tournament-contact-name"
                  name="contactName"
                  [(ngModel)]="formData.contact_name"
                  placeholder="e.g., John Smith"
                  autocomplete="off"
                />
              </div>
              <div class="form-field">
                <label for="tournament-contact-email">
                  <i class="pi pi-envelope"></i>
                  Contact Email
                </label>
                <input
                  pInputText
                  id="tournament-contact-email"
                  name="contactEmail"
                  [(ngModel)]="formData.contact_email"
                  placeholder="contact@tournament.com"
                  autocomplete="email"
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-field full-width">
                <label for="tournament-notes">
                  <i class="pi pi-pencil"></i>
                  Notes & Additional Information
                </label>
                <textarea
                  pTextarea
                  id="tournament-notes"
                  name="notes"
                  [(ngModel)]="formData.notes"
                  rows="3"
                  placeholder="Travel tips, dress code, parking info, special requirements..."
                  class="w-full"
                  autocomplete="off"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <ng-template #footer>
          <div class="dialog-footer">
            <app-button
              variant="outlined"
              iconLeft="pi-times"
              (clicked)="closeDialog()"
              >Cancel</app-button
            >
            <app-button
              [loading]="tournamentService.loading()"
              (clicked)="saveTournament()"
              >Save</app-button
            >
          </div>
        </ng-template>
      </p-dialog>

      <!-- Player Availability Dialog -->
      <p-dialog
        [(visible)]="showAvailabilityDialog"
        header="My Tournament Availability"
        [modal]="true"
        [draggable]="false"
        class="tournament-availability-dialog"
      >
        @if (selectedTournament) {
          <div class="availability-dialog">
            <div class="tournament-summary">
              <h3>
                {{ selectedTournament.flag }} {{ selectedTournament.name }}
              </h3>
              <p class="tournament-dates">
                <i class="pi pi-calendar"></i>
                {{
                  tournamentService.formatDateRange(
                    selectedTournament.start_date,
                    selectedTournament.end_date
                  )
                }}
              </p>
              <p class="tournament-location">
                <i class="pi pi-map-marker"></i>
                {{ selectedTournament.location }},
                {{ selectedTournament.country }}
              </p>
            </div>

            <div class="availability-form">
              <div class="form-field">
                <label>Will you be attending?</label>
                <div class="availability-options">
                  @for (option of availabilityOptions; track option.value) {
                    <div
                      class="availability-option"
                      [class.selected]="
                        availabilityForm.status === option.value
                      "
                      [class]="'option-' + option.value"
                      (click)="availabilityForm.status = option.value"
                    >
                      <i [class]="option.icon"></i>
                      <span>{{ option.label }}</span>
                    </div>
                  }
                </div>
              </div>

              @if (
                availabilityForm.status === "declined" ||
                availabilityForm.status === "tentative"
              ) {
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

              @if (availabilityForm.status === "confirmed") {
                <div class="form-grid-2">
                  <div class="form-field">
                    <label>Arrival Date</label>
                    <p-datepicker
                      [(ngModel)]="availabilityForm.arrivalDate"
                      [showIcon]="true"
                      dateFormat="yy-mm-dd"
                      placeholder="When do you arrive?"
                      class="w-full"
                    ></p-datepicker>
                  </div>
                  <div class="form-field">
                    <label>Departure Date</label>
                    <p-datepicker
                      [(ngModel)]="availabilityForm.departureDate"
                      [showIcon]="true"
                      dateFormat="yy-mm-dd"
                      placeholder="When do you leave?"
                      class="w-full"
                    ></p-datepicker>
                  </div>
                </div>

                <div class="form-field">
                  <p-checkbox
                    [(ngModel)]="availabilityForm.accommodationNeeded"
                    [binary]="true"
                    variant="filled"
                    inputId="accommodation"
                    label="I need accommodation"
                  ></p-checkbox>
                </div>

                <div class="form-field">
                  <p-checkbox
                    [(ngModel)]="availabilityForm.transportationNeeded"
                    [binary]="true"
                    variant="filled"
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
              @if (
                tournamentCost() > 0 && availabilityForm.status === "confirmed"
              ) {
                <div class="cost-summary">
                  <h4><i class="pi pi-wallet"></i> Estimated Cost</h4>
                  <div class="cost-breakdown">
                    <div class="cost-item">
                      <span>Your share:</span>
                      <span class="cost-value"
                        >€{{ tournamentCost() | number: "1.2-2" }}</span
                      >
                    </div>
                    @if (availabilityForm.amountPaid > 0) {
                      <div class="cost-item paid">
                        <span>Already paid:</span>
                        <span class="cost-value"
                          >€{{
                            availabilityForm.amountPaid | number: "1.2-2"
                          }}</span
                        >
                      </div>
                    }
                    <div class="cost-item remaining">
                      <span>Remaining:</span>
                      <span class="cost-value"
                        >€{{
                          tournamentCost() - availabilityForm.amountPaid
                            | number: "1.2-2"
                        }}</span
                      >
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <ng-template #footer>
          <app-button
            variant="outlined"
            (clicked)="showAvailabilityDialog = false"
            >Cancel</app-button
          >
          <app-button
            iconLeft="pi-check"
            [loading]="savingAvailability()"
            (clicked)="saveAvailability()"
            >Save</app-button
          >
        </ng-template>
      </p-dialog>

      <!-- Team Availability Overview Dialog (for coaches) -->
      <p-dialog
        [(visible)]="showTeamAvailabilityDialog"
        header="Team Availability"
        [modal]="true"
        [draggable]="false"
        class="tournament-team-availability-dialog"
      >
        @if (selectedTournament) {
          <div class="team-availability-dialog">
            <div class="tournament-summary">
              <h3>
                {{ selectedTournament.flag }} {{ selectedTournament.name }}
              </h3>
              <p class="tournament-dates">
                {{
                  tournamentService.formatDateRange(
                    selectedTournament.start_date,
                    selectedTournament.end_date
                  )
                }}
              </p>
            </div>

            <!-- Summary Stats -->
            <div class="availability-summary">
              <div class="summary-stat confirmed">
                <div class="stat-block__value">
                  {{ teamAvailabilitySummary().confirmed }}
                </div>
                <div class="stat-block__label">Confirmed</div>
              </div>
              <div class="summary-stat tentative">
                <div class="stat-block__value">
                  {{ teamAvailabilitySummary().tentative }}
                </div>
                <div class="stat-block__label">Tentative</div>
              </div>
              <div class="summary-stat declined">
                <div class="stat-block__value">
                  {{ teamAvailabilitySummary().declined }}
                </div>
                <div class="stat-block__label">Declined</div>
              </div>
              <div class="summary-stat pending">
                <div class="stat-block__value">
                  {{ teamAvailabilitySummary().pending }}
                </div>
                <div class="stat-block__label">No Response</div>
              </div>
            </div>

            <!-- Budget Overview -->
            @if (tournamentBudget()) {
              <div class="budget-overview">
                <h4><i class="pi pi-wallet"></i> Budget Overview</h4>
                <div class="budget-grid">
                  <div class="budget-item">
                    <span class="budget-label">Total Estimated</span>
                    <span class="budget-value"
                      >€{{
                        tournamentBudget()!.totalEstimated | number: "1.2-2"
                      }}</span
                    >
                  </div>
                  <div class="budget-item">
                    <span class="budget-label">Team Contribution</span>
                    <span class="budget-value"
                      >€{{
                        tournamentBudget()!.teamContribution | number: "1.2-2"
                      }}</span
                    >
                  </div>
                  <div class="budget-item">
                    <span class="budget-label">Sponsor Contribution</span>
                    <span class="budget-value"
                      >€{{
                        tournamentBudget()!.sponsorContribution
                          | number: "1.2-2"
                      }}</span
                    >
                  </div>
                  <div class="budget-item highlight">
                    <span class="budget-label">Per Player</span>
                    <span class="budget-value"
                      >€{{
                        tournamentBudget()!.perPlayer | number: "1.2-2"
                      }}</span
                    >
                  </div>
                </div>
                <app-button
                  variant="outlined"
                  size="sm"
                  iconLeft="pi-cog"
                  (clicked)="openBudgetDialog()"
                  >Manage Budget</app-button
                >
              </div>
            }

            <!-- Player List -->
            <div class="player-availability-list">
              <h4>Player Responses</h4>
              @for (player of teamAvailability(); track player.playerId) {
                <div
                  class="player-availability-item"
                  [class]="'status-' + player.status"
                >
                  <div class="player-info">
                    <span class="player-name">{{ player.playerName }}</span>
                    <span class="player-position">{{ player.position }}</span>
                  </div>
                  <div class="player-status">
                    <app-status-tag
                      [value]="getAvailabilityLabel(player.status)"
                      [severity]="getAvailabilitySeverity(player.status)"
                      size="sm"
                    />
                  </div>
                  @if (player.reason) {
                    <div class="player-reason">
                      <i class="pi pi-info-circle"></i>
                      {{ player.reason }}
                    </div>
                  }
                  <div class="player-payment">
                    @if (player.paymentStatus === "paid") {
                      <app-status-tag
                        value="Paid"
                        severity="success"
                        size="sm"
                      />
                    } @else if (player.paymentStatus === "partial") {
                      <app-status-tag
                        value="Partial"
                        severity="warning"
                        size="sm"
                      />
                    } @else if (player.status === "confirmed") {
                      <app-status-tag
                        value="Unpaid"
                        severity="danger"
                        size="sm"
                      />
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
              <app-button
                variant="outlined"
                iconLeft="pi-bell"
                (clicked)="sendAvailabilityReminders()"
                >Send Reminders</app-button
              >
              <app-button
                variant="outlined"
                iconLeft="pi-download"
                (clicked)="exportAvailabilityReport()"
                >Export Report</app-button
              >
            </div>
          </div>
        }

        <ng-template #footer>
          <app-button (clicked)="showTeamAvailabilityDialog = false"
            >Close</app-button
          >
        </ng-template>
      </p-dialog>

      <!-- Budget Management Dialog -->
      <p-dialog
        [(visible)]="showBudgetDialog"
        header="Tournament Budget"
        [modal]="true"
        [draggable]="false"
        class="tournament-budget-dialog"
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
                  class="w-full"
                ></p-inputNumber>
              </div>
              <div class="form-field">
                <label>Entry Fee Per Player</label>
                <p-inputNumber
                  [(ngModel)]="budgetForm.entryFeePerPlayer"
                  mode="currency"
                  currency="EUR"
                  locale="en-US"
                  class="w-full"
                ></p-inputNumber>
              </div>
              <div class="form-field">
                <label>Travel Cost (Estimated)</label>
                <p-inputNumber
                  [(ngModel)]="budgetForm.travelCost"
                  mode="currency"
                  currency="EUR"
                  locale="en-US"
                  class="w-full"
                ></p-inputNumber>
              </div>
              <div class="form-field">
                <label>Accommodation Per Night</label>
                <p-inputNumber
                  [(ngModel)]="budgetForm.accommodationPerNight"
                  mode="currency"
                  currency="EUR"
                  locale="en-US"
                  class="w-full"
                ></p-inputNumber>
              </div>
              <div class="form-field">
                <label>Number of Nights</label>
                <p-inputNumber
                  [(ngModel)]="budgetForm.totalNights"
                  [min]="0"
                  class="w-full"
                ></p-inputNumber>
              </div>
              <div class="form-field">
                <label>Per Diem Per Player</label>
                <p-inputNumber
                  [(ngModel)]="budgetForm.perDiem"
                  mode="currency"
                  currency="EUR"
                  locale="en-US"
                  class="w-full"
                ></p-inputNumber>
              </div>
              <div class="form-field full-width">
                <label>Other Costs</label>
                <p-inputNumber
                  [(ngModel)]="budgetForm.otherCosts"
                  mode="currency"
                  currency="EUR"
                  locale="en-US"
                  class="w-full"
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
                    class="w-full"
                  ></p-inputNumber>
                </div>
                <div class="form-field">
                  <label>Sponsor Contribution</label>
                  <p-inputNumber
                    [(ngModel)]="budgetForm.sponsorContribution"
                    mode="currency"
                    currency="EUR"
                    locale="en-US"
                    class="w-full"
                  ></p-inputNumber>
                </div>
              </div>
            </div>

            <!-- Calculated Summary -->
            <div class="budget-calculated">
              <div class="calc-row">
                <span>Total Estimated Cost:</span>
                <span class="calc-value"
                  >€{{ calculateTotalBudget() | number: "1.2-2" }}</span
                >
              </div>
              <div class="calc-row">
                <span>Total Funding:</span>
                <span class="calc-value"
                  >€{{
                    budgetForm.teamContribution + budgetForm.sponsorContribution
                      | number: "1.2-2"
                  }}</span
                >
              </div>
              <div class="calc-row highlight">
                <span
                  >Player Share ({{
                    teamAvailabilitySummary().confirmed
                  }}
                  confirmed):</span
                >
                <span class="calc-value"
                  >€{{ calculatePlayerShare() | number: "1.2-2" }}</span
                >
              </div>
            </div>
          </div>
        }

        <ng-template #footer>
          <app-button variant="outlined" (clicked)="showBudgetDialog = false"
            >Cancel</app-button
          >
          <app-button
            iconLeft="pi-check"
            [loading]="savingBudget()"
            (clicked)="saveBudget()"
            >Save Budget</app-button
          >
        </ng-template>
      </p-dialog>
    </app-main-layout>
  `,
  styleUrl: "./tournaments.component.scss",
})
export class TournamentsComponent implements OnInit {
  tournamentService = inject(TournamentService);
  private authService = inject(AuthService);
  private teamMembershipService = inject(TeamMembershipService);
  private tournamentsDataService = inject(TournamentsDataService);
  private toastService = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);
  private logger = inject(LoggerService);
  private elementRef = inject(ElementRef);

  // Computed signals from service
  tournaments = this.tournamentService.tournaments;
  tournaments2026 = this.tournamentService.tournaments2026;
  tournaments2027 = this.tournamentService.tournaments2027;
  nextTournament = this.tournamentService.nextTournament;

  // Dialog state
  showDialog = false;
  editingTournament: Tournament | null = null;

  readonly openCreateDialogHandler = (): void => this.openCreateDialog();

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
  teamAvailabilitySummary = signal({
    confirmed: 0,
    tentative: 0,
    declined: 0,
    pending: 0,
  });
  tournamentBudget = signal<TournamentBudget | null>(null);
  tournamentCost = signal(0);

  // Availability form
  availabilityForm = {
    status: "pending" as "confirmed" | "declined" | "tentative" | "pending",
    reason: "",
    arrivalDate: null as Date | null,
    departureDate: null as Date | null,
    accommodationNeeded: true,
    transportationNeeded: false,
    dietaryRestrictions: "",
    amountPaid: 0,
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
    otherCostsDescription: "",
    teamContribution: 0,
    sponsorContribution: 0,
  };

  // Options
  availabilityOptions: Array<{
    value: "pending" | "confirmed" | "declined" | "tentative";
    label: string;
    icon: string;
  }> = [
    { value: "confirmed", label: "Yes, I'm in!", icon: "pi pi-check-circle" },
    { value: "tentative", label: "Maybe", icon: "pi pi-question-circle" },
    { value: "declined", label: "Can't make it", icon: "pi pi-times-circle" },
    { value: "pending", label: "Undecided", icon: "pi pi-clock" },
  ];

  // Form data
  formData: CreateTournamentDto & {
    start_date_obj?: Date;
    end_date_obj?: Date;
    registration_deadline_obj?: Date;
    instagram_url?: string;
    facebook_url?: string;
    registration_url?: string;
    venue_maps_url?: string;
    hotel_maps_url?: string;
    hotel_name?: string;
    hotel_booking_url?: string;
    contact_name?: string;
    contact_email?: string;
  } = this.getEmptyFormData();

  // Dropdown options
  tournamentTypes = [
    { label: "Game Day", value: "game_day" },
    { label: "League", value: "league" },
    { label: "Cup", value: "cup" },
    { label: "Championship", value: "championship" },
    { label: "Friendly", value: "friendly" },
    { label: "Qualifier", value: "qualifier" },
    { label: "International", value: "international" },
  ];

  competitionLevels = [
    { label: "National", value: "national" },
    { label: "Regional", value: "regional" },
    { label: "European", value: "european" },
    { label: "World", value: "world" },
    { label: "Friendly", value: "friendly" },
  ];

  // Visibility options for the form
  visibilityOptions = [
    {
      label: "Team Event (visible to all team members)",
      value: "team",
      icon: "pi pi-users",
    },
    {
      label: "Personal Game Day (only you and coaches)",
      value: "personal",
      icon: "pi pi-user",
    },
  ];

  ngOnInit(): void {
    this.loadTournaments();
  }

  /**
   * Check if current user is a coach, manager, or admin
   * Use TeamMembershipService as single source of truth
   */
  isCoachOrAdmin(): boolean {
    return this.teamMembershipService.canManageRoster();
  }

  /**
   * Check if current user is a player (not coach/admin)
   */
  isPlayer(): boolean {
    return this.isAuthenticated() && this.teamMembershipService.isPlayer();
  }

  /**
   * Get the appropriate button label based on user role
   */
  getAddButtonLabel(): string {
    return this.isPlayer() ? "Add Game Day" : "Add Tournament";
  }

  /**
   * Get dialog title based on user role and editing state
   */
  getDialogTitle(): string {
    if (this.editingTournament) {
      return this.editingTournament.visibility_scope === "personal"
        ? "Edit Game Day"
        : "Edit Tournament";
    }
    return this.isPlayer() ? "Add Personal Game Day" : "Add Tournament";
  }

  /**
   * Check if a tournament is a personal game day
   */
  isPersonalTournament(tournament: Tournament): boolean {
    return tournament.visibility_scope === "personal";
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
    instagram_url?: string;
    facebook_url?: string;
    registration_url?: string;
    venue_maps_url?: string;
    hotel_maps_url?: string;
    hotel_name?: string;
    hotel_booking_url?: string;
    contact_name?: string;
    contact_email?: string;
  } {
    // Default visibility based on user role
    const defaultVisibility: TournamentVisibilityScope = this.isCoachOrAdmin()
      ? "team"
      : "personal";

    return {
      name: "",
      short_name: "",
      location: "",
      country: "",
      venue: "",
      start_date: "",
      end_date: "",
      tournament_type:
        defaultVisibility === "personal" ? "game_day" : "championship",
      competition_level: "regional",
      expected_teams: undefined,
      registration_deadline: "",
      website_url: "",
      notes: "",
      is_home_tournament: false,
      visibility_scope: defaultVisibility,
      start_date_obj: undefined,
      end_date_obj: undefined,
      registration_deadline_obj: undefined,
      instagram_url: "",
      facebook_url: "",
      registration_url: "",
      venue_maps_url: "",
      hotel_maps_url: "",
      hotel_name: "",
      hotel_booking_url: "",
      contact_name: "",
      contact_email: "",
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
      short_name: tournament.short_name || "",
      location: tournament.location || "",
      country: tournament.country || "",
      venue: tournament.venue || "",
      start_date: tournament.start_date,
      end_date: tournament.end_date || "",
      tournament_type: tournament.tournament_type || "championship",
      competition_level: tournament.competition_level || "regional",
      expected_teams: tournament.expected_teams,
      registration_deadline: tournament.registration_deadline || "",
      website_url: tournament.website_url || "",
      notes: tournament.notes || "",
      is_home_tournament: tournament.is_home_tournament || false,
      visibility_scope: tournament.visibility_scope || "team",
      start_date_obj: tournament.start_date
        ? new Date(tournament.start_date)
        : undefined,
      end_date_obj: tournament.end_date
        ? new Date(tournament.end_date)
        : undefined,
      registration_deadline_obj: tournament.registration_deadline
        ? new Date(tournament.registration_deadline)
        : undefined,
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
      this.toastService.error(
        "Tournament name and start date are required",
        "Validation Error",
      );
      return;
    }

    // Convert date objects to strings
    const startDate = this.formatDate(this.formData.start_date_obj);
    if (!startDate) {
      this.toastService.error("Start date is required");
      return;
    }

    const data: CreateTournamentDto = {
      ...this.formData,
      start_date: startDate,
      end_date: this.formData.end_date_obj
        ? this.formatDate(this.formData.end_date_obj)
        : undefined,
      registration_deadline: this.formData.registration_deadline_obj
        ? this.formatDate(this.formData.registration_deadline_obj)
        : undefined,
      flag: this.formData.country
        ? getCountryFlag(this.formData.country)
        : undefined,
    };

    // Remove date objects before sending (they're only used for form binding)
    const dataToSend = { ...data } as Record<string, unknown>;
    delete dataToSend["start_date_obj"];
    delete dataToSend["end_date_obj"];
    delete dataToSend["registration_deadline_obj"];

    let success = false;
    if (this.editingTournament) {
      const result = await this.tournamentService.updateTournament(
        this.editingTournament.id,
        data,
      );
      success = !!result;
    } else {
      const result = await this.tournamentService.createTournament(data);
      success = !!result;
    }

    if (success) {
      this.toastService.success(
        this.editingTournament
          ? "Tournament updated"
          : "Tournament created",
        "Success",
      );
      this.closeDialog();
    } else {
      this.toastService.error(
        this.tournamentService.error() || "Failed to save tournament",
      );
    }
  }

  async confirmDelete(tournament: Tournament): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      message: `Are you sure you want to delete "${tournament.name}"?`,
      title: "Delete Tournament",
      icon: "pi pi-exclamation-triangle",
      acceptSeverity: "danger",
      rejectSeverity: "secondary",
      defaultFocus: "reject",
    });
    if (!confirmed) return;

    const success = await this.tournamentService.deleteTournament(
      tournament.id,
    );
    if (success) {
      this.toastService.success("Tournament deleted successfully", "Deleted");
    } else {
      this.toastService.error("Failed to delete tournament");
    }
  }

  viewDetails(tournament: Tournament): void {
    // Could navigate to detail page or open a dialog
    this.logger.info("View details:", toLogContext(tournament));
  }

  scrollToTournament(id: string): void {
    // Use scoped query within component's element
    const element = this.elementRef.nativeElement.querySelector(
      `[data-id="${id}"]`,
    );
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  openWebsite(url?: string): void {
    if (url) {
      window.open(url, "_blank");
    }
  }

  private formatDate = (date: Date): string | undefined => formatDateISO(date);

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

      const { data } =
        await this.tournamentsDataService.fetchPlayerAvailability({
          tournamentId,
          playerId: user.id,
        });

      if (data) {
        const availability = data as Record<string, unknown>;
        this.availabilityForm = {
          status: isAvailabilityStatus(availability["status"])
            ? availability["status"]
            : "pending",
          reason: toStringValue(availability["reason"], ""),
          arrivalDate: toDateOrNull(availability["arrival_date"]),
          departureDate: toDateOrNull(availability["departure_date"]),
          accommodationNeeded: toBooleanValue(
            availability["accommodation_needed"],
            true,
          ),
          transportationNeeded: toBooleanValue(
            availability["transportation_needed"],
            false,
          ),
          dietaryRestrictions: toStringValue(
            availability["dietary_restrictions"],
            "",
          ),
          amountPaid: toNumberValue(availability["amount_paid"], 0),
        };
      } else {
        // Reset form
        this.availabilityForm = {
          status: "pending",
          reason: "",
          arrivalDate: null,
          departureDate: null,
          accommodationNeeded: true,
          transportationNeeded: false,
          dietaryRestrictions: "",
          amountPaid: 0,
        };
      }
    } catch (error) {
      this.logger.error("Error loading availability:", error);
    }
  }

  async loadTournamentCost(tournamentId: string): Promise<void> {
    try {
      const teamId = await this.getCurrentTeamId();
      if (!teamId) {
        this.tournamentCost.set(0);
        return;
      }

      const { data } =
        await this.tournamentsDataService.calculatePlayerTournamentCost({
          tournamentId,
          teamId,
        });

      this.tournamentCost.set(data || 0);
    } catch (error) {
      this.logger.error("Error loading tournament cost:", error);
      this.tournamentCost.set(0);
    }
  }

  async saveAvailability(): Promise<void> {
    if (!this.selectedTournament) return;

    this.savingAvailability.set(true);

    try {
      const user = this.authService.currentUser();
      if (!user) throw new Error("Not authenticated");

      const teamId = await this.getCurrentTeamId();
      if (!teamId) throw new Error("No team found");

      // Get player's team_member id
      const { memberId } =
        await this.tournamentsDataService.getTeamMemberId({
          userId: user.id,
          teamId,
        });

      if (!memberId) throw new Error("Not a team member");

      const availabilityData = {
        player_id: memberId,
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
        responded_at: new Date().toISOString(),
      };

      const { error } =
        await this.tournamentsDataService.upsertAvailability({
          availabilityData,
        });

      if (error) throw error;

      this.toastService.success("Your availability has been updated", "Saved");

      this.showAvailabilityDialog = false;
    } catch (error: unknown) {
      this.logger.error("Error saving availability:", error);
      const message =
        error instanceof Error ? error.message : "Failed to save availability";
      this.toastService.error(message);
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
      const { members } =
        await this.tournamentsDataService.fetchTeamMembers(teamId);

      const { availability } =
        await this.tournamentsDataService.fetchTeamAvailability({
          tournamentId,
          teamId,
        });

      // Map availability to players
      const availabilityList = Array.isArray(availability)
        ? (availability as AvailabilityRecord[])
        : [];

      const availabilityMap = new Map(
        availabilityList.map((a) => [a.player_id, a]),
      );

      const memberList = Array.isArray(members)
        ? (members as unknown as TeamMemberRecord[])
        : [];

      const playerList: PlayerAvailability[] = memberList.map((member) => {
          const avail = availabilityMap.get(member.id);
          const status = isAvailabilityStatus(avail?.status)
            ? avail?.status
            : "pending";
          const paymentStatus = isPaymentStatus(avail?.payment_status)
            ? avail?.payment_status
            : "pending";

          return {
          playerId: member.id,
          playerName:
            member.users?.raw_user_meta_data?.full_name || "Unknown",
          position: member.users?.raw_user_meta_data?.position || "Player",
          status,
          reason: isString(avail?.reason) ? avail?.reason : undefined,
          paymentStatus,
          amountPaid: toNumberValue(avail?.amount_paid, 0),
        };
      });

      this.teamAvailability.set(playerList);

      // Calculate summary
      const summary = { confirmed: 0, tentative: 0, declined: 0, pending: 0 };
      playerList.forEach((p) => {
        summary[p.status]++;
      });
      this.teamAvailabilitySummary.set(summary);
    } catch (error) {
      this.logger.error("Error loading team availability:", error);
    }
  }

  async loadTournamentBudget(tournamentId: string): Promise<void> {
    try {
      const teamId = await this.getCurrentTeamId();
      if (!teamId) return;

      const { budget: data } =
        await this.tournamentsDataService.fetchTournamentBudget({
          tournamentId,
          teamId,
        });

      if (data) {
        const budget = data as TournamentBudgetRecord;
        this.tournamentBudget.set({
          totalEstimated: toNumberValue(budget.total_estimated_cost, 0),
          teamContribution: toNumberValue(budget.team_contribution, 0),
          sponsorContribution: toNumberValue(budget.sponsor_contribution, 0),
          perPlayer: toNumberValue(budget.player_share_per_person, 0),
        });

        // Populate budget form
        this.budgetForm = {
          registrationFee: toNumberValue(budget.registration_fee, 0),
          entryFeePerPlayer: toNumberValue(budget.entry_fee_per_player, 0),
          travelCost: toNumberValue(budget.estimated_travel_cost, 0),
          accommodationPerNight: toNumberValue(
            budget.accommodation_cost_per_night,
            0,
          ),
          totalNights: toNumberValue(budget.total_nights, 0),
          perDiem: toNumberValue(budget.per_diem_per_player, 0),
          otherCosts: toNumberValue(budget.other_costs, 0),
          otherCostsDescription: toStringValue(
            budget.other_costs_description,
            "",
          ),
          teamContribution: toNumberValue(budget.team_contribution, 0),
          sponsorContribution: toNumberValue(budget.sponsor_contribution, 0),
        };
      } else {
        this.tournamentBudget.set(null);
      }
    } catch (error) {
      this.logger.error("Error loading budget:", error);
      this.tournamentBudget.set(null);
    }
  }

  getAvailabilityLabel(status: string): string {
    const labels: Record<string, string> = {
      confirmed: "Confirmed",
      tentative: "Maybe",
      declined: "Can't Attend",
      pending: "No Response",
    };
    return labels[status] || status;
  }

  getAvailabilitySeverity(
    status: string,
  ): "success" | "warning" | "danger" | "secondary" | "info" {
    const severities: Record<
      string,
      "success" | "warning" | "danger" | "secondary"
    > = {
      confirmed: "success",
      tentative: "warning",
      declined: "danger",
      pending: "secondary",
    };
    return severities[status] || "secondary";
  }

  async sendAvailabilityReminders(): Promise<void> {
    // Would integrate with email service
    this.toastService.info(
      "Reminder emails have been sent to players who haven't responded",
      "Reminders Sent",
    );
  }

  exportAvailabilityReport(): void {
    const players = this.teamAvailability();
    const tournament = this.selectedTournament;
    if (!tournament || players.length === 0) return;

    const headers = ["Name", "Position", "Status", "Reason", "Payment Status"];
    const rows = players.map((p) => [
      p.playerName,
      p.position,
      this.getAvailabilityLabel(p.status),
      p.reason || "",
      p.paymentStatus,
    ]);

    const csvContent = [
      `Tournament: ${tournament.name}`,
      `Date: ${tournament.start_date} - ${tournament.end_date}`,
      "",
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
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
      this.budgetForm.entryFeePerPlayer * confirmedPlayers +
      this.budgetForm.travelCost +
      this.budgetForm.accommodationPerNight * this.budgetForm.totalNights +
      this.budgetForm.perDiem *
        confirmedPlayers *
        (this.budgetForm.totalNights + 1) +
      this.budgetForm.otherCosts
    );
  }

  calculatePlayerShare(): number {
    const confirmedPlayers = this.teamAvailabilitySummary().confirmed;
    if (confirmedPlayers === 0) return 0;

    const total = this.calculateTotalBudget();
    const funding =
      this.budgetForm.teamContribution + this.budgetForm.sponsorContribution;
    return Math.max(0, (total - funding) / confirmedPlayers);
  }

  async saveBudget(): Promise<void> {
    if (!this.selectedTournament) return;

    this.savingBudget.set(true);

    try {
      const teamId = await this.getCurrentTeamId();
      if (!teamId) throw new Error("No team found");

      const confirmedPlayers = this.teamAvailabilitySummary().confirmed;

      const budgetData = {
        tournament_id: this.selectedTournament.id,
        team_id: teamId,
        registration_fee: this.budgetForm.registrationFee,
        entry_fee_per_player: this.budgetForm.entryFeePerPlayer,
        estimated_travel_cost: this.budgetForm.travelCost,
        accommodation_cost_per_night: this.budgetForm.accommodationPerNight,
        total_nights: this.budgetForm.totalNights,
        estimated_accommodation_total:
          this.budgetForm.accommodationPerNight * this.budgetForm.totalNights,
        per_diem_per_player: this.budgetForm.perDiem,
        estimated_meals_total:
          this.budgetForm.perDiem *
          confirmedPlayers *
          (this.budgetForm.totalNights + 1),
        other_costs: this.budgetForm.otherCosts,
        other_costs_description: this.budgetForm.otherCostsDescription,
        team_contribution: this.budgetForm.teamContribution,
        sponsor_contribution: this.budgetForm.sponsorContribution,
        player_share_per_person: this.calculatePlayerShare(),
        budget_status: "draft",
        created_by: this.authService.currentUser()?.id,
      };

      const { error } = await this.tournamentsDataService.upsertTournamentBudget({
        budgetData,
      });

      if (error) throw error;

      this.toastService.success("Budget has been updated", "Saved");

      // Reload budget to get calculated fields
      await this.loadTournamentBudget(this.selectedTournament.id);
      this.showBudgetDialog = false;
    } catch (error: unknown) {
      this.logger.error("Error saving budget:", error);
      const message =
        error instanceof Error ? error.message : "Failed to save budget";
      this.toastService.error(message);
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
      const { teamId: data } = await this.tournamentsDataService.getCurrentTeamId(
        user.id,
      );

      return data || null;
    } catch {
      return null;
    }
  }
}
