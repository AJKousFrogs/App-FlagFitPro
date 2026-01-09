/**
 * Roster Component (Refactored)
 *
 * ⭐ CANONICAL PAGE — Design System Exemplar (Pending Cleanup)
 * ============================================================
 * This page is marked as canonical but requires cleanup before freeze.
 * 
 * RULES:
 * - Future refactors copy FROM this page, never INTO it
 * - Changes require design system curator approval
 * - Must be cleaned to full compliance before canonical freeze
 * 
 * See docs/CANONICAL_PAGES.md for full documentation.
 *
 * CLEANUP REQUIRED:
 * - Remove PrimeNG overrides from component SCSS
 * - Replace raw colors with tokens
 *
 * Container component that orchestrates roster sub-components
 *
 * Refactored from 3,360 lines to ~800 lines by extracting:
 * - RosterService: Data operations and state management
 * - RosterPlayerCardComponent: Player card display
 * - RosterStaffCardComponent: Staff card display
 * - RosterOverviewComponent: Team stats overview
 * - RosterFiltersComponent: Search and filters
 * - RosterPlayerFormDialogComponent: Add/Edit player form
 * - roster.models.ts: Shared interfaces
 * - roster-utils.ts: Helper functions
 */
import { DatePipe, DecimalPipe, TitleCasePipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ConfirmationService } from "primeng/api";
import { BadgeModule } from "primeng/badge";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DialogModule } from "primeng/dialog";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { Select } from "primeng/select";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";

import { ToastService } from "../../core/services/toast.service";
import { TOAST } from "../../core/constants/toast-messages.constants";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";

import {
  COMPONENT_SIZES,
  DIALOG_STYLES,
} from "../../core/utils/design-tokens.util";
import {
  PlayerFormData,
  RosterFiltersComponent,
  RosterOverviewComponent,
  RosterPlayerCardComponent,
  RosterPlayerFormDialogComponent,
  RosterStaffCardComponent,
} from "./components";
import {
  formatHeight,
  formatWeight,
  getCountryFlag,
  getJerseyColor,
  getPlayerStats,
  getPositionFullName,
  getPositionIcon,
  getStatusSeverity,
} from "./roster-utils";
import {
  Player,
  PlayerRiskLevel,
  PlayerStatus,
  PositionGroup,
  ROLE_OPTIONS,
  STATUS_OPTIONS,
  TeamInvitation,
} from "./roster.models";
import { RosterService } from "./roster.service";
import {
  PlayerMetricsService,
  PlayerWithMetrics,
  RiskAssessment,
} from "./services/player-metrics.service";

@Component({
  selector: "app-roster",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ConfirmationService],
  imports: [
    // PrimeNG
    CardModule,
    TagModule,
    ProgressSpinnerModule,
    DialogModule,
    TooltipModule,
    ConfirmDialogModule,
    BadgeModule,
    ButtonModule,
    Select,
    // Angular
    FormsModule,
    DatePipe,
    DecimalPipe,
    TitleCasePipe,
    // Layout
    MainLayoutComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    PageErrorStateComponent,
    AppLoadingComponent,
    // Roster Components
    RosterPlayerCardComponent,
    RosterStaffCardComponent,
    RosterOverviewComponent,
    RosterFiltersComponent,
    RosterPlayerFormDialogComponent,
    ButtonComponent,
    IconButtonComponent,
  ],
  template: `
    <app-main-layout>
      <!-- Loading State -->
      <app-loading
        [visible]="isPageLoading()"
        variant="skeleton"
        message="Loading roster..."
      ></app-loading>

      <!-- Error State -->
      @if (hasPageError()) {
        <app-page-error-state
          title="Unable to load roster"
          [message]="rosterService.error() || 'Something went wrong'"
          (retry)="retryLoad()"
        ></app-page-error-state>
      }

      <!-- Content -->
      @else {
        <div class="roster-page section-stack">
          <!-- Page Header -->
          <app-page-header
            title="Team Roster"
            [subtitle]="headerSubtitle()"
            icon="pi-users"
          >
            <div class="header-actions">
              @if (rosterService.canManageRoster()) {
                <app-button
                  variant="outlined"
                  iconLeft="pi-download"
                  (clicked)="exportRoster()"
                  >Export</app-button
                >

                <p-button
                  label="Invitations"
                  icon="pi pi-envelope"
                  [outlined]="true"
                  severity="info"
                  (onClick)="openInvitationsDialog()"
                  pTooltip="Manage pending invitations"
                  [badge]="
                    rosterService.pendingInvitations().length > 0
                      ? rosterService.pendingInvitations().length.toString()
                      : ''
                  "
                  badgeSeverity="danger"
                ></p-button>

                <app-button
                  variant="outlined"
                  iconLeft="pi-user-plus"
                  (clicked)="openInviteDialog()"
                  >Invite</app-button
                >

                <app-button iconLeft="pi-plus" (clicked)="openAddPlayer()"
                  >Add Player</app-button
                >
              }
            </div>
          </app-page-header>

          <!-- Search and Filter Bar -->
          <app-roster-filters
            [(searchQuery)]="searchQuery"
            [selectedCount]="selectedPlayerIds().size"
            [canManage]="rosterService.canManageRoster()"
            [canDelete]="rosterService.canDeletePlayers()"
            (positionFilterChange)="positionFilter = $event"
            (statusFilterChange)="statusFilter = $event"
            (bulkStatusChange)="openBulkStatusDialog()"
            (bulkRemove)="confirmBulkRemove()"
            (clearSelection)="clearSelection()"
          ></app-roster-filters>

          <!-- Loading State -->
          @if (rosterService.isLoading()) {
            <div class="loading-state">
              <p-progressSpinner
                [style]="{
                  width: componentSizes.avatar.lg,
                  height: componentSizes.avatar.lg,
                }"
                strokeWidth="4"
              ></p-progressSpinner>
              <p class="loading-message">Loading roster data...</p>
            </div>
          }

          <!-- Empty State -->
          @if (
            !rosterService.isLoading() &&
            filteredPlayers().length === 0 &&
            !searchQuery() &&
            !positionFilter &&
            !statusFilter
          ) {
            <app-empty-state
              title="No Players Found"
              message="Your roster is empty. Add players to get started."
              icon="pi-users"
              [actionLabel]="
                rosterService.canManageRoster() ? 'Add First Player' : ''
              "
              actionIcon="pi pi-plus"
              [actionHandler]="
                rosterService.canManageRoster()
                  ? openAddPlayer.bind(this)
                  : null
              "
            ></app-empty-state>
          }

          <!-- No Results State -->
          @if (
            !rosterService.isLoading() &&
            filteredPlayers().length === 0 &&
            (searchQuery() || positionFilter || statusFilter)
          ) {
            <div class="no-results">
              <i class="pi pi-search"></i>
              <h3>No players match your filters</h3>
              <p>Try adjusting your search or filter criteria</p>
              <app-button
                variant="outlined"
                iconLeft="pi-filter-slash"
                (clicked)="clearFilters()"
                >Clear Filters</app-button
              >
            </div>
          }

          <!-- Content -->
          @if (
            !rosterService.isLoading() &&
            (filteredPlayers().length > 0 ||
              rosterService.coachingStaff().length > 0)
          ) {
            <!-- Team Overview Stats -->
            <app-roster-overview
              [stats]="rosterService.teamStats()"
            ></app-roster-overview>

            <!-- Coaching Staff -->
            @if (rosterService.coachingStaffByCategory().coaching.length > 0) {
              <div class="position-section">
                <h2 class="section-title">
                  <i class="pi pi-users"></i>
                  Coaching Staff
                  <span class="position-count"
                    >({{
                      rosterService.coachingStaffByCategory().coaching.length
                    }})</span
                  >
                </h2>
                <div class="roster-grid">
                  @for (
                    member of rosterService.coachingStaffByCategory().coaching;
                    track member.id || member.name
                  ) {
                    <app-roster-staff-card
                      [member]="member"
                      [showEmail]="rosterService.canManageRoster()"
                    ></app-roster-staff-card>
                  }
                </div>
              </div>
            }

            <!-- Medical Staff -->
            @if (rosterService.coachingStaffByCategory().medical.length > 0) {
              <div class="position-section">
                <h2 class="section-title">
                  <i class="pi pi-heart"></i>
                  Medical Staff
                  <span class="position-count"
                    >({{
                      rosterService.coachingStaffByCategory().medical.length
                    }})</span
                  >
                </h2>
                <div class="roster-grid">
                  @for (
                    member of rosterService.coachingStaffByCategory().medical;
                    track member.id || member.name
                  ) {
                    <app-roster-staff-card
                      [member]="member"
                      [showEmail]="rosterService.canManageRoster()"
                    ></app-roster-staff-card>
                  }
                </div>
              </div>
            }

            <!-- Performance Staff -->
            @if (
              rosterService.coachingStaffByCategory().performance.length > 0
            ) {
              <div class="position-section">
                <h2 class="section-title">
                  <i class="pi pi-chart-line"></i>
                  Performance Staff
                  <span class="position-count"
                    >({{
                      rosterService.coachingStaffByCategory().performance
                        .length
                    }})</span
                  >
                </h2>
                <div class="roster-grid">
                  @for (
                    member of rosterService.coachingStaffByCategory()
                      .performance;
                    track member.id || member.name
                  ) {
                    <app-roster-staff-card
                      [member]="member"
                      [showEmail]="rosterService.canManageRoster()"
                    ></app-roster-staff-card>
                  }
                </div>
              </div>
            }

            <!-- Players by Position -->
            @for (
              positionGroup of filteredPlayersByPosition();
              track positionGroup.position
            ) {
              <div class="position-section">
                <h2 class="section-title">
                  <i [class]="getPositionIcon(positionGroup.position)"></i>
                  {{ positionGroup.position }}
                  <span class="position-count"
                    >({{ positionGroup.players.length }})</span
                  >
                </h2>
                <div class="roster-grid">
                  @for (player of positionGroup.players; track player.id) {
                    <app-roster-player-card
                      [player]="player"
                      [isSelected]="isPlayerSelected(player.id)"
                      [canManage]="rosterService.canManageRoster()"
                      [canDelete]="rosterService.canDeletePlayers()"
                      (viewDetails)="viewPlayerDetails($event)"
                      (edit)="editPlayer($event)"
                      (changeStatus)="openStatusDialog($event)"
                      (remove)="confirmRemovePlayer($event)"
                      (selectionChange)="togglePlayerSelection($event)"
                    ></app-roster-player-card>
                  }
                </div>
              </div>
            }
          }
        </div>

        <!-- Add/Edit Player Dialog -->
        <app-roster-player-form-dialog
          [visible]="showPlayerDialog()"
          [editingPlayer]="editingPlayer()"
          [isSaving]="isSaving()"
          [showContactFields]="rosterService.canManageRoster()"
          (visibleChange)="showPlayerDialog.set($event)"
          (save)="savePlayer($event)"
        ></app-roster-player-form-dialog>

        <!-- Player Details Dialog (Phase 1 Enhanced) -->
        <p-dialog
          [visible]="showDetailsDialog()"
          (visibleChange)="showDetailsDialog.set($event)"
          [modal]="true"
          header="Player Details"
          [style]="dialogStyles.playerDetail"
          [closable]="true"
        >
          @if (selectedPlayer()) {
            <div class="player-details-modal">
              <div class="details-header">
                <div
                  class="details-jersey"
                  [style.background]="
                    getJerseyColor(selectedPlayer()!.position)
                  "
                >
                  {{ selectedPlayer()!.jersey }}
                </div>
                <div class="details-info">
                  <h2>{{ selectedPlayer()!.name }}</h2>
                  <p class="details-position">
                    {{ getPositionFullName(selectedPlayer()!.position) }}
                  </p>
                  <div class="details-tags">
                    <p-tag
                      [value]="selectedPlayer()!.status | titlecase"
                      [severity]="getStatusSeverity(selectedPlayer()!.status)"
                    ></p-tag>
                    @if (
                      enrichedSelectedPlayer()?.riskLevel &&
                      enrichedSelectedPlayer()!.riskLevel !== "low"
                    ) {
                      <p-tag
                        [value]="
                          'Risk: ' +
                          (enrichedSelectedPlayer()!.riskLevel | titlecase)
                        "
                        [severity]="
                          getRiskSeverity(enrichedSelectedPlayer()!.riskLevel!)
                        "
                      ></p-tag>
                    }
                  </div>
                </div>
              </div>

              <!-- Live Metrics Summary -->
              @if (enrichedSelectedPlayer()) {
                <div class="details-metrics-summary">
                  <div class="metric-card">
                    <span class="metric-label">Readiness</span>
                    <span
                      class="metric-value"
                      [class]="
                        getReadinessClass(enrichedSelectedPlayer()!.readiness)
                      "
                    >
                      {{ enrichedSelectedPlayer()!.readiness }}%
                    </span>
                  </div>
                  <div class="metric-card">
                    <span class="metric-label">ACWR</span>
                    <span
                      class="metric-value"
                      [class]="getACWRClass(enrichedSelectedPlayer()!.acwr)"
                    >
                      {{ enrichedSelectedPlayer()!.acwr | number: "1.2-2" }}
                    </span>
                  </div>
                  <div class="metric-card">
                    <span class="metric-label">Performance</span>
                    <span
                      class="metric-value"
                      [class]="
                        getPerformanceClass(
                          enrichedSelectedPlayer()!.performanceScore
                        )
                      "
                    >
                      {{ enrichedSelectedPlayer()!.performanceScore }}%
                    </span>
                  </div>
                </div>
              }

              <div class="details-grid">
                <div class="details-item">
                  <span class="details-label">Country</span>
                  <span class="details-value">
                    <span class="country-flag">{{ getCountryFlag(selectedPlayer()!.country) }}</span>
                    {{ selectedPlayer()!.country }}
                  </span>
                </div>
                <div class="details-item">
                  <span class="details-label">Age</span>
                  <span class="details-value">{{ selectedPlayer()!.age }}</span>
                </div>
                <div class="details-item">
                  <span class="details-label">Height</span>
                  <span class="details-value">{{
                    formatHeight(selectedPlayer()!.height)
                  }}</span>
                </div>
                <div class="details-item">
                  <span class="details-label">Weight</span>
                  <span class="details-value">{{
                    formatWeight(selectedPlayer()!.weight)
                  }}</span>
                </div>
                @if (
                  rosterService.canManageRoster() && selectedPlayer()!.email
                ) {
                  <div class="details-item">
                    <span class="details-label">Email</span>
                    <span class="details-value">{{
                      selectedPlayer()!.email
                    }}</span>
                  </div>
                }
                @if (
                  rosterService.canManageRoster() && selectedPlayer()!.phone
                ) {
                  <div class="details-item">
                    <span class="details-label">Phone</span>
                    <span class="details-value">{{
                      selectedPlayer()!.phone
                    }}</span>
                  </div>
                }
              </div>

              <!-- Position Benchmarks Section -->
              @if (enrichedSelectedPlayer()?.benchmarkComparison?.length) {
                <div class="details-benchmarks">
                  <h3><i class="pi pi-chart-bar"></i> Position Benchmarks</h3>
                  <div class="benchmarks-grid">
                    @for (
                      benchmark of enrichedSelectedPlayer()!
                        .benchmarkComparison;
                      track benchmark.metric
                    ) {
                      <div class="benchmark-item">
                        <div class="benchmark-header">
                          <span class="benchmark-name">{{
                            benchmark.metric
                          }}</span>
                          <span
                            class="benchmark-rating"
                            [class]="'rating-' + benchmark.rating"
                          >
                            {{ benchmark.rating | titlecase }}
                          </span>
                        </div>
                        @if (benchmark.value !== null) {
                          <div class="benchmark-value">
                            {{ benchmark.value }}{{ benchmark.unit }}
                            <span class="benchmark-target"
                              >(Target: {{ benchmark.target
                              }}{{ benchmark.unit }})</span
                            >
                          </div>
                        } @else {
                          <div class="benchmark-value not-tested">
                            Not tested
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Training Priorities -->
              @if (trainingPriorities().length > 0) {
                <div class="details-priorities">
                  <h3><i class="pi pi-list-check"></i> Training Priorities</h3>
                  <ul class="priorities-list">
                    @for (priority of trainingPriorities(); track priority) {
                      <li>{{ priority }}</li>
                    }
                  </ul>
                </div>
              }

              <!-- Risk Assessment (for coaches) -->
              @if (
                rosterService.canManageRoster() &&
                riskAssessment()?.factors?.length
              ) {
                <div
                  class="details-risk"
                  [class]="'risk-level-' + riskAssessment()!.level"
                >
                  <h3>
                    <i class="pi pi-exclamation-triangle"></i> Risk Assessment
                  </h3>
                  <div class="risk-factors">
                    @for (factor of riskAssessment()!.factors; track factor) {
                      <div class="risk-factor">
                        <i class="pi pi-info-circle"></i>
                        {{ factor }}
                      </div>
                    }
                  </div>
                  @if (riskAssessment()!.recommendations.length) {
                    <div class="risk-recommendations">
                      <strong>Recommendations:</strong>
                      <ul>
                        @for (
                          rec of riskAssessment()!.recommendations;
                          track rec
                        ) {
                          <li>{{ rec }}</li>
                        }
                      </ul>
                    </div>
                  }
                </div>
              }

              @if (
                selectedPlayer()!.stats &&
                getPlayerStats(selectedPlayer()!).length > 0
              ) {
                <div class="details-stats">
                  <h3>Performance Stats</h3>
                  <div class="stats-chips">
                    @for (
                      stat of getPlayerStats(selectedPlayer()!);
                      track stat.key
                    ) {
                      <p-tag
                        [value]="stat.label + ': ' + stat.value"
                        severity="info"
                      ></p-tag>
                    }
                  </div>
                </div>
              }
            </div>
          }

          <ng-template pTemplate="footer">
            <app-button variant="text" (clicked)="showDetailsDialog.set(false)"
              >Close</app-button
            >
            @if (rosterService.canManageRoster()) {
              <app-button
                iconLeft="pi-pencil"
                (clicked)="editPlayerFromDetails()"
                >Edit Player</app-button
              >
            }
          </ng-template>
        </p-dialog>

        <!-- Status Change Dialog -->
        <p-dialog
          [visible]="showStatusDialog()"
          (visibleChange)="showStatusDialog.set($event)"
          [modal]="true"
          header="Change Player Status"
          [style]="dialogStyles.form"
          [closable]="true"
        >
          <div class="status-dialog-content">
            <p>
              Select new status for
              <strong>{{ statusChangePlayer()?.name }}</strong
              >:
            </p>
            <div class="status-options">
              @for (option of statusOptions; track option.value) {
                <div
                  class="status-option"
                  [class.selected]="newStatus() === option.value"
                  (click)="newStatus.set(option.value)"
                >
                  <div
                    class="status-indicator"
                    [class]="'status-' + option.value"
                  ></div>
                  <span>{{ option.label }}</span>
                </div>
              }
            </div>
          </div>

          <ng-template pTemplate="footer">
            <app-button variant="text" (clicked)="showStatusDialog.set(false)"
              >Cancel</app-button
            >
            <app-button
              iconLeft="pi-check"
              [loading]="isSaving()"
              (clicked)="updatePlayerStatus()"
              >Update Status</app-button
            >
          </ng-template>
        </p-dialog>

        <!-- Bulk Status Change Dialog -->
        <p-dialog
          [visible]="showBulkStatusDialog()"
          (visibleChange)="showBulkStatusDialog.set($event)"
          [modal]="true"
          header="Change Status for Selected Players"
          [style]="dialogStyles.form"
          [closable]="true"
        >
          <div class="status-dialog-content">
            <p>
              Update status for
              <strong>{{ selectedPlayerIds().size }} players</strong>:
            </p>
            <div class="status-options">
              @for (option of statusOptions; track option.value) {
                <div
                  class="status-option"
                  [class.selected]="bulkStatus() === option.value"
                  (click)="bulkStatus.set(option.value)"
                >
                  <div
                    class="status-indicator"
                    [class]="'status-' + option.value"
                  ></div>
                  <span>{{ option.label }}</span>
                </div>
              }
            </div>
          </div>

          <ng-template pTemplate="footer">
            <app-button
              variant="text"
              (clicked)="showBulkStatusDialog.set(false)"
              >Cancel</app-button
            >
            <app-button
              iconLeft="pi-check"
              [loading]="isSaving()"
              (clicked)="updateBulkStatus()"
              >Update All</app-button
            >
          </ng-template>
        </p-dialog>

        <!-- Invite Dialog -->
        <p-dialog
          [visible]="showInviteDialog()"
          (visibleChange)="showInviteDialog.set($event)"
          [modal]="true"
          header="Invite to Team"
          [style]="dialogStyles.form"
          [closable]="true"
        >
          <div class="invite-form">
            <div class="form-field">
              <label for="inviteEmail">Email Address *</label>
              <input
                pInputText
                id="inviteEmail"
                [(ngModel)]="inviteEmail"
                placeholder="player@email.com"
                class="w-full"
              />
            </div>

            <div class="form-field">
              <label for="inviteRole">Role</label>
              <p-select
                id="inviteRole"
                [(ngModel)]="inviteRole"
                [options]="roleOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select role"
                styleClass="w-full"
              ></p-select>
            </div>

            <div class="form-field">
              <label for="inviteMessage">Personal Message (Optional)</label>
              <textarea
                pInputText
                id="inviteMessage"
                [(ngModel)]="inviteMessage"
                placeholder="Add a personal message to the invitation..."
                rows="3"
                class="w-full"
              ></textarea>
            </div>
          </div>

          <ng-template pTemplate="footer">
            <app-button variant="text" (clicked)="showInviteDialog.set(false)"
              >Cancel</app-button
            >
            <app-button
              iconLeft="pi-send"
              [loading]="isSaving()"
              [disabled]="!inviteEmail || isSaving()"
              (clicked)="sendInvitation()"
              >Send Invitation</app-button
            >
          </ng-template>
        </p-dialog>

        <!-- Invitations Management Dialog -->
        <p-dialog
          [visible]="showInvitationsDialog()"
          (visibleChange)="showInvitationsDialog.set($event)"
          [modal]="true"
          header="Pending Invitations"
          [style]="dialogStyles.scrollable"
          [closable]="true"
        >
          <div class="invitations-list">
            @if (rosterService.pendingInvitations().length === 0) {
              <div class="empty-invitations">
                <i class="pi pi-inbox"></i>
                <p>No pending invitations</p>
                <app-button
                  iconLeft="pi-plus"
                  (clicked)="
                    showInvitationsDialog.set(false); openInviteDialog()
                  "
                  >Send New Invitation</app-button
                >
              </div>
            } @else {
              @for (
                invitation of rosterService.pendingInvitations();
                track invitation.id
              ) {
                <div
                  class="invitation-item"
                  [class.expired]="invitation.isExpired"
                >
                  <div class="invitation-info">
                    <div class="invitation-email">
                      <i class="pi pi-envelope"></i>
                      {{ invitation.email }}
                    </div>
                    <div class="invitation-meta">
                      <p-tag
                        [value]="
                          rosterService.getRoleDisplayName(invitation.role)
                        "
                        severity="info"
                      ></p-tag>
                      <span class="invited-by">
                        Invited by {{ invitation.invitedBy }}
                      </span>
                      <span class="invitation-date">
                        {{ invitation.createdAt | date: "short" }}
                      </span>
                    </div>
                    @if (invitation.isExpired) {
                      <p-tag value="Expired" severity="danger"></p-tag>
                    } @else {
                      <span class="expires-text">
                        Expires {{ invitation.expiresAt | date: "short" }}
                      </span>
                    }
                  </div>
                  <div class="invitation-actions">
                    <app-icon-button
                      icon="pi-refresh"
                      variant="text"
                      (clicked)="resendInvitation(invitation)"
                      ariaLabel="refresh"
                    />
                    <app-icon-button
                      icon="pi-times"
                      variant="text"
                      (clicked)="cancelInvitation(invitation)"
                      ariaLabel="times"
                    />
                  </div>
                </div>
              }
            }
          </div>

          <ng-template pTemplate="footer">
            <app-button
              variant="text"
              (clicked)="showInvitationsDialog.set(false)"
              >Close</app-button
            >
            <app-button
              iconLeft="pi-plus"
              (clicked)="showInvitationsDialog.set(false); openInviteDialog()"
              >Send New Invitation</app-button
            >
          </ng-template>
        </p-dialog>

        <!-- Confirmation Dialog -->
        <p-confirmDialog></p-confirmDialog>
      }
    </app-main-layout>
  `,
  styleUrl: "./roster.component.scss",
})
export class RosterComponent implements OnInit {
  // Services
  readonly rosterService = inject(RosterService);
  private readonly metricsService = inject(PlayerMetricsService);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  // Design system tokens
  protected readonly dialogStyles = DIALOG_STYLES;
  protected readonly componentSizes = COMPONENT_SIZES;

  // Page state
  isPageLoading = signal(true);
  hasPageError = signal(false);
  isSaving = signal(false);

  // Dialog visibility
  showPlayerDialog = signal(false);
  showDetailsDialog = signal(false);
  showStatusDialog = signal(false);
  showBulkStatusDialog = signal(false);
  showInviteDialog = signal(false);
  showInvitationsDialog = signal(false);

  // Player editing
  editingPlayer = signal<Player | null>(null);
  selectedPlayer = signal<Player | null>(null);
  statusChangePlayer = signal<Player | null>(null);
  newStatus = signal<PlayerStatus>("active");
  bulkStatus = signal<PlayerStatus>("active");

  // Selection
  selectedPlayerIds = signal<Set<string>>(new Set());

  // Filters
  searchQuery = signal("");
  positionFilter: string | null = null;
  statusFilter: string | null = null;

  // Invite form
  inviteEmail = "";
  inviteRole = "player";
  inviteMessage = "";

  // Options
  statusOptions = STATUS_OPTIONS;
  roleOptions = ROLE_OPTIONS;

  // Expose utility functions
  getPositionFullName = getPositionFullName;
  getPositionIcon = getPositionIcon;
  getJerseyColor = getJerseyColor;
  getStatusSeverity = getStatusSeverity;
  getPlayerStats = getPlayerStats;
  formatHeight = formatHeight;
  formatWeight = formatWeight;
  getCountryFlag = getCountryFlag;

  // Phase 1: Enriched player computed signals
  enrichedSelectedPlayer = computed<PlayerWithMetrics | null>(() => {
    const player = this.selectedPlayer();
    if (!player) return null;
    return this.metricsService.enrichPlayer(player);
  });

  trainingPriorities = computed<string[]>(() => {
    const player = this.selectedPlayer();
    if (!player) return [];
    return this.metricsService.getTrainingPriorities(player);
  });

  riskAssessment = computed<RiskAssessment | null>(() => {
    const player = this.selectedPlayer();
    if (!player) return null;
    return this.metricsService.getRiskAssessment(player);
  });

  // Computed
  headerSubtitle = computed(() => {
    const stats = this.rosterService.teamStats();
    if (stats.length === 0) return "Manage your team";
    const countryStat = stats.find((s) => s.label === "Countries");
    return `Manage your team • ${countryStat?.value || 0} countries represented`;
  });

  filteredPlayers = computed(() => {
    let players = this.rosterService.allPlayers();

    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      players = players.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.position.toLowerCase().includes(query) ||
          p.country.toLowerCase().includes(query),
      );
    }

    if (this.positionFilter) {
      players = players.filter((p) => p.position === this.positionFilter);
    }

    if (this.statusFilter) {
      players = players.filter((p) => p.status === this.statusFilter);
    }

    return players;
  });

  filteredPlayersByPosition = computed<PositionGroup[]>(() => {
    const players = this.filteredPlayers();
    const positionMap = new Map<string, Player[]>();

    players.forEach((player) => {
      const positionName = getPositionFullName(player.position);
      if (!positionMap.has(positionName)) {
        positionMap.set(positionName, []);
      }
      positionMap.get(positionName)!.push(player);
    });

    return Array.from(positionMap.entries()).map(([position, players]) => ({
      position,
      players,
    }));
  });

  // Phase 1: Helper methods for details dialog styling
  getReadinessClass(readiness: number): string {
    if (readiness >= 75) return "readiness-high";
    if (readiness >= 55) return "readiness-medium";
    return "readiness-low";
  }

  getACWRClass(acwr: number): string {
    if (acwr >= 0.8 && acwr <= 1.3) return "acwr-safe";
    if (acwr > 1.3 && acwr <= 1.5) return "acwr-elevated";
    if (acwr > 1.5) return "acwr-danger";
    if (acwr < 0.8) return "acwr-low";
    return "acwr-safe";
  }

  getPerformanceClass(score: number): string {
    if (score >= 80) return "perf-excellent";
    if (score >= 60) return "perf-good";
    if (score >= 40) return "perf-average";
    return "perf-poor";
  }

  getRiskSeverity(
    level: PlayerRiskLevel,
  ): "success" | "info" | "warn" | "danger" {
    switch (level) {
      case "low":
        return "success";
      case "moderate":
        return "warn";
      case "high":
        return "warn";
      case "critical":
        return "danger";
      default:
        return "info";
    }
  }

  ngOnInit(): void {
    this.initializePage();
  }

  private async initializePage(): Promise<void> {
    this.isPageLoading.set(true);
    this.hasPageError.set(false);

    await this.rosterService.loadRosterData();
    await this.rosterService.loadPendingInvitations();

    if (this.rosterService.error()) {
      this.hasPageError.set(true);
    }

    this.isPageLoading.set(false);
  }

  retryLoad(): void {
    this.initializePage();
  }

  // Player CRUD
  openAddPlayer(): void {
    this.editingPlayer.set(null);
    this.showPlayerDialog.set(true);
  }

  editPlayer(player: Player): void {
    this.editingPlayer.set(player);
    this.showPlayerDialog.set(true);
  }

  async savePlayer(formData: PlayerFormData): Promise<void> {
    // Validate jersey number
    const excludeId = this.editingPlayer()?.id;
    if (this.rosterService.isJerseyNumberTaken(formData.jersey, excludeId)) {
      this.toastService.error(
        `Jersey number ${formData.jersey} is already taken`,
      );
      return;
    }

    this.isSaving.set(true);

    const result = this.editingPlayer()
      ? await this.rosterService.updatePlayer(
          this.editingPlayer()!.id,
          formData as Partial<Player>,
        )
      : await this.rosterService.addPlayer(formData as Partial<Player>);

    if (result.success) {
      this.toastService.success(
        this.editingPlayer() ? TOAST.SUCCESS.PLAYER_UPDATED : TOAST.SUCCESS.PLAYER_ADDED,
      );
      this.showPlayerDialog.set(false);
      this.editingPlayer.set(null);
    } else {
      this.toastService.error(result.error || TOAST.ERROR.PLAYER_SAVE_FAILED);
    }

    this.isSaving.set(false);
  }

  confirmRemovePlayer(player: Player): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to remove ${player.name} from the team?`,
      header: "Confirm Removal",
      icon: "pi pi-exclamation-triangle",
      acceptButtonStyleClass: "p-button-danger",
      accept: async () => {
        const result = await this.rosterService.removePlayer(player.id);
        if (result.success) {
          this.toastService.success(`${player.name} has been removed`);
        } else {
          this.toastService.error(result.error || TOAST.ERROR.PLAYER_REMOVE_FAILED);
        }
      },
    });
  }

  // Player details
  viewPlayerDetails(player: Player): void {
    this.selectedPlayer.set(player);
    this.showDetailsDialog.set(true);
  }

  editPlayerFromDetails(): void {
    const player = this.selectedPlayer();
    if (player) {
      this.showDetailsDialog.set(false);
      this.editPlayer(player);
    }
  }

  // Status management
  openStatusDialog(player: Player): void {
    this.statusChangePlayer.set(player);
    this.newStatus.set(player.status);
    this.showStatusDialog.set(true);
  }

  async updatePlayerStatus(): Promise<void> {
    const player = this.statusChangePlayer();
    if (!player) return;

    this.isSaving.set(true);
    const result = await this.rosterService.updatePlayerStatus(
      player.id,
      this.newStatus(),
    );

    if (result.success) {
      this.toastService.success(`${player.name}'s status updated`);
      this.showStatusDialog.set(false);
    } else {
      this.toastService.error(result.error || TOAST.ERROR.STATUS_UPDATE_FAILED);
    }

    this.isSaving.set(false);
  }

  // Bulk operations
  togglePlayerSelection(playerId: string): void {
    const current = this.selectedPlayerIds();
    const newSet = new Set(current);

    if (newSet.has(playerId)) {
      newSet.delete(playerId);
    } else {
      newSet.add(playerId);
    }

    this.selectedPlayerIds.set(newSet);
  }

  isPlayerSelected(playerId: string): boolean {
    return this.selectedPlayerIds().has(playerId);
  }

  clearSelection(): void {
    this.selectedPlayerIds.set(new Set());
  }

  openBulkStatusDialog(): void {
    this.bulkStatus.set("active");
    this.showBulkStatusDialog.set(true);
  }

  async updateBulkStatus(): Promise<void> {
    const ids = Array.from(this.selectedPlayerIds());
    if (ids.length === 0) return;

    this.isSaving.set(true);
    const result = await this.rosterService.bulkUpdateStatus(
      ids,
      this.bulkStatus(),
    );

    if (result.success) {
      this.toastService.success(`Updated status for ${ids.length} players`);
      this.showBulkStatusDialog.set(false);
      this.clearSelection();
    } else {
      this.toastService.error(result.error || TOAST.ERROR.STATUS_UPDATE_FAILED);
    }

    this.isSaving.set(false);
  }

  confirmBulkRemove(): void {
    const count = this.selectedPlayerIds().size;
    this.confirmationService.confirm({
      message: `Are you sure you want to remove ${count} player(s)?`,
      header: "Confirm Bulk Removal",
      icon: "pi pi-exclamation-triangle",
      acceptButtonStyleClass: "p-button-danger",
      accept: async () => {
        const ids = Array.from(this.selectedPlayerIds());
        const result = await this.rosterService.bulkRemovePlayers(ids);

        if (result.success) {
          this.toastService.success(`Removed ${count} players`);
          this.clearSelection();
        } else {
          this.toastService.error(result.error || TOAST.ERROR.PLAYERS_REMOVE_FAILED);
        }
      },
    });
  }

  // Filters
  clearFilters(): void {
    this.searchQuery.set("");
    this.positionFilter = null;
    this.statusFilter = null;
  }

  // Export
  exportRoster(): void {
    const csv = this.rosterService.exportRosterToCsv();
    if (!csv) {
      this.toastService.warn(TOAST.WARN.NO_PLAYERS_TO_EXPORT);
      return;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `roster_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.toastService.success(TOAST.SUCCESS.ROSTER_EXPORTED);
  }

  // Invitations
  openInviteDialog(): void {
    this.inviteEmail = "";
    this.inviteRole = "player";
    this.inviteMessage = "";
    this.showInviteDialog.set(true);
  }

  async sendInvitation(): Promise<void> {
    if (!this.inviteEmail) {
      this.toastService.warn(TOAST.WARN.MISSING_EMAIL);
      return;
    }

    this.isSaving.set(true);
    const result = await this.rosterService.sendInvitation(
      this.inviteEmail,
      this.inviteRole,
      this.inviteMessage,
    );

    if (result.success) {
      this.toastService.success(`Invitation sent to ${this.inviteEmail}`);
      this.showInviteDialog.set(false);
    } else {
      this.toastService.error(result.error || TOAST.ERROR.INVITATION_SEND_FAILED);
    }

    this.isSaving.set(false);
  }

  openInvitationsDialog(): void {
    this.rosterService.loadPendingInvitations();
    this.showInvitationsDialog.set(true);
  }

  async resendInvitation(invitation: TeamInvitation): Promise<void> {
    const result = await this.rosterService.resendInvitation(invitation.id);
    if (result.success) {
      this.toastService.success(`Invitation resent to ${invitation.email}`);
    } else {
      this.toastService.error(result.error || TOAST.ERROR.INVITATION_RESEND_FAILED);
    }
  }

  async cancelInvitation(invitation: TeamInvitation): Promise<void> {
    this.confirmationService.confirm({
      message: `Cancel invitation for ${invitation.email}?`,
      header: "Cancel Invitation",
      icon: "pi pi-exclamation-triangle",
      acceptButtonStyleClass: "p-button-danger",
      accept: async () => {
        const result = await this.rosterService.cancelInvitation(invitation.id);
        if (result.success) {
          this.toastService.success(TOAST.SUCCESS.INVITATION_CANCELLED);
        } else {
          this.toastService.error(
            result.error || "Failed to cancel invitation",
          );
        }
      },
    });
  }
}
