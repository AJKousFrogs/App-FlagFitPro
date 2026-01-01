/**
 * Roster Component (Refactored)
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
import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { DatePipe, TitleCasePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { TagModule } from "primeng/tag";
import { ButtonModule } from "primeng/button";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { DialogModule } from "primeng/dialog";
import { TooltipModule } from "primeng/tooltip";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { ConfirmationService } from "primeng/api";
import { BadgeModule } from "primeng/badge";
import { Select } from "primeng/select";

import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { PageLoadingStateComponent } from "../../shared/components/page-loading-state/page-loading-state.component";
import { ToastService } from "../../core/services/toast.service";

import { RosterService } from "./roster.service";
import {
  Player,
  PlayerStatus,
  TeamInvitation,
  PositionGroup,
  STATUS_OPTIONS,
  ROLE_OPTIONS,
} from "./roster.models";
import {
  getPositionFullName,
  getPositionIcon,
  getJerseyColor,
  getStatusSeverity,
  getPlayerStats,
} from "./roster-utils";
import {
  RosterPlayerCardComponent,
  RosterStaffCardComponent,
  RosterOverviewComponent,
  RosterFiltersComponent,
  RosterPlayerFormDialogComponent,
  PlayerFormData,
} from "./components";

@Component({
  selector: "app-roster",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ConfirmationService],
  imports: [
    // PrimeNG
    CardModule,
    TagModule,
    ButtonModule,
    ProgressSpinnerModule,
    DialogModule,
    TooltipModule,
    ConfirmDialogModule,
    BadgeModule,
    Select,
    // Angular
    FormsModule,
    DatePipe,
    TitleCasePipe,
    // Layout
    MainLayoutComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    PageErrorStateComponent,
    PageLoadingStateComponent,
    // Roster Components
    RosterPlayerCardComponent,
    RosterStaffCardComponent,
    RosterOverviewComponent,
    RosterFiltersComponent,
    RosterPlayerFormDialogComponent,
  ],
  template: `
    <app-main-layout>
      <!-- Loading State -->
      @if (isPageLoading()) {
        <app-page-loading-state
          message="Loading roster..."
          variant="skeleton"
        ></app-page-loading-state>
      }

      <!-- Error State -->
      @else if (hasPageError()) {
        <app-page-error-state
          title="Unable to load roster"
          [message]="rosterService.error() || 'Something went wrong'"
          (retry)="retryLoad()"
        ></app-page-error-state>
      }

      <!-- Content -->
      @else {
        <div class="roster-page">
          <!-- Page Header -->
          <app-page-header
            title="Team Roster"
            [subtitle]="headerSubtitle()"
            icon="pi-users"
          >
            <div class="header-actions">
              @if (rosterService.canManageRoster()) {
                <p-button
                  label="Export"
                  icon="pi pi-download"
                  [outlined]="true"
                  severity="secondary"
                  (onClick)="exportRoster()"
                  pTooltip="Export roster to CSV"
                ></p-button>

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

                <p-button
                  label="Invite"
                  icon="pi pi-user-plus"
                  [outlined]="true"
                  (onClick)="openInviteDialog()"
                ></p-button>

                <p-button
                  label="Add Player"
                  icon="pi pi-plus"
                  (onClick)="openAddPlayer()"
                ></p-button>
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
                [style]="{ width: '50px', height: '50px' }"
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
              <p-button
                label="Clear Filters"
                icon="pi pi-filter-slash"
                [outlined]="true"
                (onClick)="clearFilters()"
              ></p-button>
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

        <!-- Player Details Dialog -->
        <p-dialog
          [visible]="showDetailsDialog()"
          (visibleChange)="showDetailsDialog.set($event)"
          [modal]="true"
          header="Player Details"
          [style]="{ width: '600px' }"
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
                  <p-tag
                    [value]="selectedPlayer()!.status | titlecase"
                    [severity]="getStatusSeverity(selectedPlayer()!.status)"
                  ></p-tag>
                </div>
              </div>

              <div class="details-grid">
                <div class="details-item">
                  <span class="details-label">Country</span>
                  <span class="details-value">{{
                    selectedPlayer()!.country
                  }}</span>
                </div>
                <div class="details-item">
                  <span class="details-label">Age</span>
                  <span class="details-value">{{ selectedPlayer()!.age }}</span>
                </div>
                <div class="details-item">
                  <span class="details-label">Height</span>
                  <span class="details-value">{{
                    selectedPlayer()!.height
                  }}</span>
                </div>
                <div class="details-item">
                  <span class="details-label">Weight</span>
                  <span class="details-value">{{
                    selectedPlayer()!.weight
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
            <p-button
              label="Close"
              [text]="true"
              (onClick)="showDetailsDialog.set(false)"
            ></p-button>
            @if (rosterService.canManageRoster()) {
              <p-button
                label="Edit Player"
                icon="pi pi-pencil"
                (onClick)="editPlayerFromDetails()"
              ></p-button>
            }
          </ng-template>
        </p-dialog>

        <!-- Status Change Dialog -->
        <p-dialog
          [visible]="showStatusDialog()"
          (visibleChange)="showStatusDialog.set($event)"
          [modal]="true"
          header="Change Player Status"
          [style]="{ width: '400px' }"
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
            <p-button
              label="Cancel"
              [text]="true"
              (onClick)="showStatusDialog.set(false)"
            ></p-button>
            <p-button
              label="Update Status"
              icon="pi pi-check"
              (onClick)="updatePlayerStatus()"
              [loading]="isSaving()"
            ></p-button>
          </ng-template>
        </p-dialog>

        <!-- Bulk Status Change Dialog -->
        <p-dialog
          [visible]="showBulkStatusDialog()"
          (visibleChange)="showBulkStatusDialog.set($event)"
          [modal]="true"
          header="Change Status for Selected Players"
          [style]="{ width: '400px' }"
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
            <p-button
              label="Cancel"
              [text]="true"
              (onClick)="showBulkStatusDialog.set(false)"
            ></p-button>
            <p-button
              label="Update All"
              icon="pi pi-check"
              (onClick)="updateBulkStatus()"
              [loading]="isSaving()"
            ></p-button>
          </ng-template>
        </p-dialog>

        <!-- Invite Dialog -->
        <p-dialog
          [visible]="showInviteDialog()"
          (visibleChange)="showInviteDialog.set($event)"
          [modal]="true"
          header="Invite to Team"
          [style]="{ width: '450px' }"
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
            <p-button
              label="Cancel"
              [text]="true"
              (onClick)="showInviteDialog.set(false)"
            ></p-button>
            <p-button
              label="Send Invitation"
              icon="pi pi-send"
              (onClick)="sendInvitation()"
              [disabled]="!inviteEmail || isSaving()"
              [loading]="isSaving()"
            ></p-button>
          </ng-template>
        </p-dialog>

        <!-- Invitations Management Dialog -->
        <p-dialog
          [visible]="showInvitationsDialog()"
          (visibleChange)="showInvitationsDialog.set($event)"
          [modal]="true"
          header="Pending Invitations"
          [style]="{ width: '700px', maxHeight: '80vh' }"
          [closable]="true"
        >
          <div class="invitations-list">
            @if (rosterService.pendingInvitations().length === 0) {
              <div class="empty-invitations">
                <i class="pi pi-inbox"></i>
                <p>No pending invitations</p>
                <p-button
                  label="Send New Invitation"
                  icon="pi pi-plus"
                  (onClick)="
                    showInvitationsDialog.set(false); openInviteDialog()
                  "
                ></p-button>
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
                    <p-button
                      icon="pi pi-refresh"
                      [rounded]="true"
                      [text]="true"
                      severity="info"
                      pTooltip="Resend invitation"
                      (onClick)="resendInvitation(invitation)"
                    ></p-button>
                    <p-button
                      icon="pi pi-times"
                      [rounded]="true"
                      [text]="true"
                      severity="danger"
                      pTooltip="Cancel invitation"
                      (onClick)="cancelInvitation(invitation)"
                    ></p-button>
                  </div>
                </div>
              }
            }
          </div>

          <ng-template pTemplate="footer">
            <p-button
              label="Close"
              [text]="true"
              (onClick)="showInvitationsDialog.set(false)"
            ></p-button>
            <p-button
              label="Send New Invitation"
              icon="pi pi-plus"
              (onClick)="showInvitationsDialog.set(false); openInviteDialog()"
            ></p-button>
          </ng-template>
        </p-dialog>

        <!-- Confirmation Dialog -->
        <p-confirmDialog></p-confirmDialog>
      }
    </app-main-layout>
  `,
  styles: [
    `
      .roster-page {
        padding: var(--space-6);
      }

      .header-actions {
        display: flex;
        gap: var(--space-3);
        flex-wrap: wrap;
      }

      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-12);
        min-height: 300px;
      }

      .loading-message {
        margin-top: var(--space-4);
        font-size: var(--font-body-md);
        color: var(--text-secondary);
      }

      .no-results {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-12);
        text-align: center;
        color: var(--text-secondary);
      }

      .no-results i {
        font-size: 3rem;
        margin-bottom: var(--space-4);
        opacity: 0.5;
      }

      .no-results h3 {
        margin: 0 0 var(--space-2);
        color: var(--text-primary);
      }

      .no-results p {
        margin: 0 0 var(--space-4);
      }

      .position-section {
        margin-bottom: var(--space-8);
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: var(--font-heading-lg);
        font-weight: var(--font-weight-bold);
        margin-bottom: var(--space-6);
        color: var(--text-primary);
      }

      .section-title i {
        color: var(--color-brand-primary);
      }

      .position-count {
        font-size: var(--font-body-md);
        font-weight: var(--font-weight-normal);
        color: var(--text-secondary);
      }

      .roster-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: var(--space-6);
      }

      /* Player Details Modal */
      .player-details-modal {
        padding: var(--space-2);
      }

      .details-header {
        display: flex;
        align-items: center;
        gap: var(--space-6);
        margin-bottom: var(--space-6);
        padding-bottom: var(--space-6);
        border-bottom: 1px solid var(--p-surface-200);
      }

      .details-jersey {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: var(--font-weight-bold);
        font-size: var(--font-heading-xl);
        color: white;
        box-shadow: var(--shadow-lg);
      }

      .details-info h2 {
        margin: 0 0 var(--space-2);
        font-size: var(--font-heading-xl);
      }

      .details-position {
        color: var(--text-secondary);
        margin: 0 0 var(--space-2);
      }

      .details-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-4);
        margin-bottom: var(--space-6);
      }

      .details-item {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .details-label {
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .details-value {
        font-size: var(--font-body-md);
        font-weight: var(--font-weight-medium);
        color: var(--text-primary);
      }

      .details-stats h3 {
        font-size: var(--font-body-md);
        margin: 0 0 var(--space-3);
      }

      .stats-chips {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
      }

      /* Status Dialog */
      .status-dialog-content p {
        margin: 0 0 var(--space-4);
      }

      .status-options {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .status-option {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        border: 1px solid var(--p-surface-200);
        border-radius: var(--p-border-radius);
        cursor: pointer;
        transition: all 0.2s;
      }

      .status-option:hover {
        background: var(--p-surface-50);
      }

      .status-option.selected {
        border-color: var(--color-brand-primary);
        background: var(--color-brand-primary-bg);
      }

      .status-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }

      .status-indicator.status-active {
        background: var(--color-status-success);
      }

      .status-indicator.status-injured {
        background: var(--color-status-error);
      }

      .status-indicator.status-inactive {
        background: var(--text-secondary);
      }

      /* Invite Form */
      .invite-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .form-field label {
        font-weight: var(--font-weight-medium);
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .w-full {
        width: 100%;
      }

      /* Invitations List */
      .invitations-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        max-height: 400px;
        overflow-y: auto;
      }

      .empty-invitations {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-8);
        text-align: center;
        color: var(--text-secondary);
      }

      .empty-invitations i {
        font-size: 3rem;
        margin-bottom: var(--space-4);
        opacity: 0.5;
      }

      .empty-invitations p {
        margin: 0 0 var(--space-4);
      }

      .invitation-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4);
        border: 1px solid var(--p-surface-200);
        border-radius: var(--p-border-radius);
        background: var(--p-surface-50);
        transition: all 0.2s;
      }

      .invitation-item:hover {
        border-color: var(--color-brand-primary);
        background: white;
      }

      .invitation-item.expired {
        opacity: 0.7;
        background: var(--color-status-error-bg);
        border-color: var(--color-status-error);
      }

      .invitation-info {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .invitation-email {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
      }

      .invitation-meta {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .invited-by,
      .invitation-date,
      .expires-text {
        font-size: var(--font-body-xs);
        color: var(--text-tertiary);
      }

      .invitation-actions {
        display: flex;
        gap: var(--space-2);
      }

      /* Responsive */
      @media (min-width: 1400px) {
        .roster-grid {
          grid-template-columns: repeat(4, 1fr);
        }
      }

      @media (min-width: 1200px) and (max-width: 1399px) {
        .roster-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      @media (min-width: 1024px) and (max-width: 1199px) {
        .roster-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 768px) {
        .roster-page {
          padding: var(--space-4);
        }

        .roster-grid {
          grid-template-columns: 1fr;
          gap: var(--space-4);
        }

        .header-actions {
          width: 100%;
          justify-content: stretch;
        }

        .header-actions p-button {
          flex: 1;
        }

        .details-header {
          flex-direction: column;
          text-align: center;
        }

        .details-grid {
          grid-template-columns: 1fr;
        }

        .section-title {
          font-size: var(--font-heading-md);
        }

        .invitation-item {
          flex-direction: column;
          gap: var(--space-3);
          align-items: flex-start;
        }

        .invitation-actions {
          width: 100%;
          justify-content: flex-end;
        }
      }

      @media (max-width: 480px) {
        .roster-page {
          padding: var(--space-3);
        }

        .details-jersey {
          width: 60px;
          height: 60px;
          font-size: var(--font-heading-lg);
        }

        .invitation-meta {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-1);
        }

        .invitations-list {
          max-height: 300px;
        }

        .status-options {
          gap: var(--space-1);
        }

        .status-option {
          padding: var(--space-2) var(--space-3);
        }
      }

      @media (max-width: 374px) {
        .roster-page {
          padding: var(--space-2);
        }

        .header-actions {
          flex-direction: column;
        }

        .section-title {
          font-size: var(--font-body-lg);
          flex-wrap: wrap;
        }

        .position-count {
          width: 100%;
        }
      }

      /* Touch devices */
      @media (hover: none) and (pointer: coarse) {
        .header-actions button {
          min-height: 44px;
          min-width: 44px;
        }
      }

      /* Print */
      @media print {
        .header-actions {
          display: none !important;
        }

        .roster-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-2);
        }
      }
    `,
  ],
})
export class RosterComponent implements OnInit {
  // Services
  readonly rosterService = inject(RosterService);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

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
        this.editingPlayer() ? "Player updated!" : "Player added!",
      );
      this.showPlayerDialog.set(false);
      this.editingPlayer.set(null);
    } else {
      this.toastService.error(result.error || "Failed to save player");
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
          this.toastService.error(result.error || "Failed to remove player");
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
      this.toastService.error(result.error || "Failed to update status");
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
      this.toastService.error(result.error || "Failed to update status");
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
          this.toastService.error(result.error || "Failed to remove players");
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
      this.toastService.warn("No players to export");
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

    this.toastService.success("Roster exported successfully");
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
      this.toastService.warn("Please enter an email address");
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
      this.toastService.error(result.error || "Failed to send invitation");
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
      this.toastService.error(result.error || "Failed to resend invitation");
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
          this.toastService.success("Invitation cancelled");
        } else {
          this.toastService.error(
            result.error || "Failed to cancel invitation",
          );
        }
      },
    });
  }
}
