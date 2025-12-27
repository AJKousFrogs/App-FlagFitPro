import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

import { CardModule } from "primeng/card";
import { TagModule } from "primeng/tag";
import { ButtonModule } from "primeng/button";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { InputNumberModule } from "primeng/inputnumber";
import { CheckboxModule } from "primeng/checkbox";
import { TooltipModule } from "primeng/tooltip";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { ConfirmationService } from "primeng/api";
import { BadgeModule } from "primeng/badge";
import { DatePipe, TitleCasePipe } from "@angular/common";
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { SupabaseService } from "../../core/services/supabase.service";
import { AuthService } from "../../core/services/auth.service";
import { ToastService } from "../../core/services/toast.service";
import { LoggerService } from "../../core/services/logger.service";

// ============================================================================
// INTERFACES
// ============================================================================

interface TeamStat {
  value: string;
  label: string;
}

interface StaffMember {
  id?: string;
  user_id?: string;
  name: string;
  position: string;
  role: string;
  roleCategory: StaffCategory;
  country: string;
  experience: string;
  email?: string;
  phone?: string;
  specialization?: string;
  certifications?: string[];
  achievements?: string[];
}

type StaffCategory = 'coaching' | 'medical' | 'performance';

interface Player {
  id: string;
  name: string;
  position: string;
  jersey: string;
  country: string;
  age: number;
  height: string;
  weight: string;
  email?: string;
  phone?: string;
  status: 'active' | 'injured' | 'inactive';
  stats?: Record<string, number | string>;
  created_at?: string;
  user_id?: string;
}

interface TeamInvitation {
  id: string;
  email: string;
  role: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
  isExpired: boolean;
}

interface TournamentAvailability {
  id: string;
  tournamentId: string;
  tournamentName: string;
  startDate: string;
  endDate: string;
  location: string;
  status: 'confirmed' | 'declined' | 'tentative' | 'pending';
  reason?: string;
  paymentStatus: 'not_required' | 'pending' | 'partial' | 'paid' | 'waived';
  amountDue: number;
  amountPaid: number;
}

// Full staff role hierarchy
type TeamRole = 
  | 'player'
  | 'head_coach'
  | 'offense_coordinator'
  | 'defense_coordinator'
  | 'assistant_coach'
  | 'physiotherapist'
  | 'nutritionist'
  | 'strength_conditioning_coach'
  | 'owner'
  | 'admin'
  // Legacy roles for backward compatibility
  | 'coach';

// ============================================================================
// COMPONENT
// ============================================================================

@Component({
  selector: "app-roster",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ConfirmationService],
  imports: [
    CardModule, 
    TagModule, 
    ButtonModule, 
    ProgressSpinnerModule, 
    MainLayoutComponent, 
    PageHeaderComponent, 
    EmptyStateComponent,
    DialogModule,
    InputTextModule,
    SelectModule,
    InputNumberModule,
    CheckboxModule,
    TooltipModule,
    ConfirmDialogModule,
    FormsModule,
    ReactiveFormsModule,
    BadgeModule,
    DatePipe,
    TitleCasePipe
  ],
  template: `
    <app-main-layout>
      <div class="roster-page">
        <!-- Page Header -->
        <app-page-header
          title="Team Roster"
          [subtitle]="'Manage your team' + (teamStats().length > 0 ? ' • ' + getCountryCount() + ' countries represented' : '')"
          icon="pi-users"
        >
          <div class="header-actions">
            <!-- Export Button -->
            @if (canManageRoster()) {
              <p-button
                label="Export"
                icon="pi pi-download"
                [outlined]="true"
                severity="secondary"
                (onClick)="exportRoster()"
                pTooltip="Export roster to CSV"
              ></p-button>
            }
            
            <!-- Manage Invitations Button -->
            @if (canManageRoster()) {
              <p-button
                label="Invitations"
                icon="pi pi-envelope"
                [outlined]="true"
                severity="info"
                (onClick)="openInvitationsDialog()"
                pTooltip="Manage pending invitations"
                [badge]="pendingInvitations().length > 0 ? pendingInvitations().length.toString() : ''"
                badgeSeverity="danger"
              ></p-button>
            }
            
            <!-- Invite Player Button -->
            @if (canManageRoster()) {
              <p-button
                label="Invite"
                icon="pi pi-user-plus"
                [outlined]="true"
                (onClick)="openInviteDialog()"
              ></p-button>
            }
            
            <!-- Add Player Button -->
            @if (canManageRoster()) {
              <p-button
                label="Add Player"
                icon="pi pi-plus"
                (onClick)="openAddPlayer()"
              ></p-button>
            }
          </div>
        </app-page-header>

        <!-- Search and Filter Bar -->
        <div class="search-filter-bar">
          <div class="search-box">
            <i class="pi pi-search"></i>
            <input 
              type="text" 
              pInputText 
              placeholder="Search players by name..."
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              class="search-input"
            />
            @if (searchQuery()) {
              <button class="clear-search" (click)="searchQuery.set('')">
                <i class="pi pi-times"></i>
              </button>
            }
          </div>
          
          <div class="filter-group">
            <p-select
              [options]="positionFilterOptions"
              [(ngModel)]="positionFilter"
              placeholder="All Positions"
              [showClear]="true"
              styleClass="filter-select"
            ></p-select>
            
            <p-select
              [options]="statusFilterOptions"
              [(ngModel)]="statusFilter"
              placeholder="All Status"
              [showClear]="true"
              styleClass="filter-select"
            ></p-select>
          </div>
          
          <!-- Bulk Actions -->
          @if (canManageRoster() && selectedPlayers().length > 0) {
            <div class="bulk-actions">
              <span class="selected-count">{{ selectedPlayers().length }} selected</span>
              <p-button
                label="Change Status"
                icon="pi pi-tag"
                [outlined]="true"
                size="small"
                (onClick)="openBulkStatusDialog()"
              ></p-button>
              @if (canDeletePlayers()) {
                <p-button
                  label="Remove"
                  icon="pi pi-trash"
                  severity="danger"
                  [outlined]="true"
                  size="small"
                  (onClick)="confirmBulkRemove()"
                ></p-button>
              }
              <p-button
                icon="pi pi-times"
                [rounded]="true"
                [text]="true"
                size="small"
                (onClick)="clearSelection()"
                pTooltip="Clear selection"
              ></p-button>
            </div>
          }
        </div>

        <!-- Loading State -->
        @if (isLoading()) {
          <div class="loading-state">
            <p-progressSpinner 
              [style]="{ width: '50px', height: '50px' }"
              strokeWidth="4"
            ></p-progressSpinner>
            <p class="loading-message">Loading roster data...</p>
          </div>
        }

        <!-- Empty State -->
        @if (!isLoading() && filteredPlayers().length === 0 && !searchQuery() && !positionFilter && !statusFilter) {
          <app-empty-state
            title="No Players Found"
            message="Your roster is empty. Add players to get started."
            icon="pi-users"
            [actionLabel]="canManageRoster() ? 'Add First Player' : ''"
            actionIcon="pi pi-plus"
            [actionHandler]="canManageRoster() ? openAddPlayer.bind(this) : undefined"
          ></app-empty-state>
        }

        <!-- No Results State -->
        @if (!isLoading() && filteredPlayers().length === 0 && (searchQuery() || positionFilter || statusFilter)) {
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
        @if (!isLoading() && (filteredPlayers().length > 0 || coachingStaff().length > 0)) {
          <!-- Team Overview Stats -->
          <p-card class="overview-card">
            <ng-template pTemplate="header">
              <h2 class="card-title">
                <i class="pi pi-trophy"></i>
                Team Overview
              </h2>
            </ng-template>
            <div class="team-overview-grid">
              @for (stat of teamStats(); track trackByStatLabel($index, stat)) {
                <div class="overview-stat">
                  <div class="overview-value">{{ stat.value }}</div>
                  <div class="overview-label">{{ stat.label }}</div>
                </div>
              }
            </div>
          </p-card>

          <!-- Coaching Staff -->
          @if (coachingStaffByCategory().coaching.length > 0) {
            <div class="position-section">
              <h2 class="section-title">
                <i class="pi pi-users"></i>
                Coaching Staff
                <span class="position-count">({{ coachingStaffByCategory().coaching.length }})</span>
              </h2>
              <div class="roster-grid">
                @for (member of coachingStaffByCategory().coaching; track trackByMemberName($index, member)) {
                  <p-card class="staff-card" [class]="'staff-' + member.roleCategory">
                    <div class="role-badge coaching">{{ member.position }}</div>
                    <div class="player-header">
                      <div class="player-jersey staff-avatar coaching-avatar">
                        {{ getInitials(member.name) }}
                      </div>
                      <div class="player-info">
                        <h3 class="player-name">{{ member.name }}</h3>
                        <div class="player-position">{{ member.position }}</div>
                        @if (member.email && canManageRoster()) {
                          <div class="player-meta">
                            <i class="pi pi-envelope"></i>
                            {{ member.email }}
                          </div>
                        }
                      </div>
                    </div>
                    <div class="stats-grid">
                      <div class="stat-item">
                        <div class="stat-value">
                          {{ getYears(member.experience) }}
                        </div>
                        <div class="stat-label">Years Exp.</div>
                      </div>
                      <div class="stat-item">
                        <div class="stat-value">{{ member.country }}</div>
                        <div class="stat-label">Country</div>
                      </div>
                    </div>
                    @if (member.achievements && member.achievements.length > 0) {
                      <div class="achievements">
                        <div class="achievements-title">Achievements:</div>
                        @for (achievement of member.achievements.slice(0, 2); track trackByAchievement($index, achievement)) {
                          <div class="achievement-item">• {{ achievement }}</div>
                        }
                      </div>
                    }
                  </p-card>
                }
              </div>
            </div>
          }

          <!-- Medical Staff -->
          @if (coachingStaffByCategory().medical.length > 0) {
            <div class="position-section">
              <h2 class="section-title">
                <i class="pi pi-heart"></i>
                Medical Staff
                <span class="position-count">({{ coachingStaffByCategory().medical.length }})</span>
              </h2>
              <div class="roster-grid">
                @for (member of coachingStaffByCategory().medical; track trackByMemberName($index, member)) {
                  <p-card class="staff-card staff-medical">
                    <div class="role-badge medical">{{ member.position }}</div>
                    <div class="player-header">
                      <div class="player-jersey staff-avatar medical-avatar">
                        {{ getInitials(member.name) }}
                      </div>
                      <div class="player-info">
                        <h3 class="player-name">{{ member.name }}</h3>
                        <div class="player-position">{{ member.position }}</div>
                        @if (member.email && canManageRoster()) {
                          <div class="player-meta">
                            <i class="pi pi-envelope"></i>
                            {{ member.email }}
                          </div>
                        }
                      </div>
                    </div>
                    <div class="stats-grid">
                      <div class="stat-item">
                        <div class="stat-value">
                          {{ getYears(member.experience) }}
                        </div>
                        <div class="stat-label">Years Exp.</div>
                      </div>
                      <div class="stat-item">
                        <div class="stat-value">{{ member.country }}</div>
                        <div class="stat-label">Country</div>
                      </div>
                    </div>
                  </p-card>
                }
              </div>
            </div>
          }

          <!-- Performance Staff -->
          @if (coachingStaffByCategory().performance.length > 0) {
            <div class="position-section">
              <h2 class="section-title">
                <i class="pi pi-chart-line"></i>
                Performance Staff
                <span class="position-count">({{ coachingStaffByCategory().performance.length }})</span>
              </h2>
              <div class="roster-grid">
                @for (member of coachingStaffByCategory().performance; track trackByMemberName($index, member)) {
                  <p-card class="staff-card staff-performance">
                    <div class="role-badge performance">{{ member.position }}</div>
                    <div class="player-header">
                      <div class="player-jersey staff-avatar performance-avatar">
                        {{ getInitials(member.name) }}
                      </div>
                      <div class="player-info">
                        <h3 class="player-name">{{ member.name }}</h3>
                        <div class="player-position">{{ member.position }}</div>
                        @if (member.email && canManageRoster()) {
                          <div class="player-meta">
                            <i class="pi pi-envelope"></i>
                            {{ member.email }}
                          </div>
                        }
                      </div>
                    </div>
                    <div class="stats-grid">
                      <div class="stat-item">
                        <div class="stat-value">
                          {{ getYears(member.experience) }}
                        </div>
                        <div class="stat-label">Years Exp.</div>
                      </div>
                      <div class="stat-item">
                        <div class="stat-value">{{ member.country }}</div>
                        <div class="stat-label">Country</div>
                      </div>
                    </div>
                  </p-card>
                }
              </div>
            </div>
          }

          <!-- Players by Position -->
          @for (positionGroup of filteredPlayersByPosition(); track trackByPosition($index, positionGroup)) {
            <div class="position-section">
              <h2 class="section-title">
                <i [class]="getPositionIcon(positionGroup.position)"></i>
                {{ positionGroup.position }}
                <span class="position-count">({{ positionGroup.players.length }})</span>
              </h2>
              <div class="roster-grid">
                @for (player of positionGroup.players; track trackByPlayerId($index, player)) {
                  <p-card class="player-card" [class.selected]="isPlayerSelected(player.id)">
                    <!-- Selection Checkbox (Coach+ only) -->
                    @if (canManageRoster()) {
                      <div class="card-checkbox">
                        <p-checkbox
                          [binary]="true"
                          [ngModel]="isPlayerSelected(player.id)"
                          (ngModelChange)="togglePlayerSelection(player.id)"
                        ></p-checkbox>
                      </div>
                    }
                    
                    <!-- Status Badge -->
                    <div class="status-badge" [class]="'status-' + player.status">
                      {{ player.status | titlecase }}
                    </div>
                    
                    <div class="player-header">
                      <div
                        class="player-jersey"
                        [style.background]="getJerseyColor(player.position)"
                      >
                        {{ player.jersey }}
                      </div>
                      <div class="player-info">
                        <h3 class="player-name">{{ player.name }}</h3>
                        <div class="player-position">{{ player.position }}</div>
                        <div class="player-meta">
                          <span>{{ player.country }}</span>
                          <span class="separator">•</span>
                          <span>Age {{ player.age }}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div class="player-details">
                      <div class="detail-item">
                        <span class="detail-label">Height:</span>
                        <span class="detail-value">{{ player.height }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">Weight:</span>
                        <span class="detail-value">{{ player.weight }}</span>
                      </div>
                    </div>
                    
                    @if (player.stats && Object.keys(player.stats).length > 0) {
                      <div class="player-stats">
                        @for (stat of getPlayerStats(player); track trackByStatKey($index, stat)) {
                          <p-tag
                            [value]="stat.label + ': ' + stat.value"
                            severity="info"
                            styleClass="mr-2 mb-2"
                          ></p-tag>
                        }
                      </div>
                    }
                    
                    <!-- Action Buttons -->
                    <div class="card-actions">
                      <p-button
                        icon="pi pi-eye"
                        [rounded]="true"
                        [text]="true"
                        severity="secondary"
                        (onClick)="viewPlayerDetails(player)"
                        pTooltip="View Details"
                      ></p-button>
                      
                      @if (canManageRoster()) {
                        <p-button
                          icon="pi pi-pencil"
                          [rounded]="true"
                          [text]="true"
                          (onClick)="editPlayer(player)"
                          pTooltip="Edit Player"
                        ></p-button>
                        
                        <p-button
                          icon="pi pi-tag"
                          [rounded]="true"
                          [text]="true"
                          severity="info"
                          (onClick)="openStatusDialog(player)"
                          pTooltip="Change Status"
                        ></p-button>
                      }
                      
                      @if (canDeletePlayers()) {
                        <p-button
                          icon="pi pi-trash"
                          [rounded]="true"
                          [text]="true"
                          severity="danger"
                          (onClick)="confirmRemovePlayer(player)"
                          pTooltip="Remove Player"
                        ></p-button>
                      }
                    </div>
                  </p-card>
                }
              </div>
            </div>
          }
        }
      </div>

      <!-- Add/Edit Player Dialog -->
      <p-dialog 
        [(visible)]="showPlayerDialog" 
        [modal]="true" 
        [header]="isEditMode() ? 'Edit Player' : 'Add New Player'"
        [style]="{ width: '550px' }"
        [closable]="true"
      >
        <form [formGroup]="playerForm" class="player-form">
          <div class="form-field">
            <label for="name">Full Name *</label>
            <input 
              pInputText 
              id="name" 
              formControlName="name" 
              placeholder="Enter player name"
              class="w-full"
            />
          </div>
          
          <div class="form-row">
            <div class="form-field">
              <label for="position">Position *</label>
              <p-select 
                id="position"
                formControlName="position"
                [options]="positionOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select position"
                styleClass="w-full"
              ></p-select>
            </div>
            
            <div class="form-field">
              <label for="jersey">Jersey # *</label>
              <input 
                pInputText 
                id="jersey" 
                formControlName="jersey" 
                placeholder="00"
                class="w-full"
              />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-field">
              <label for="country">Country</label>
              <input 
                pInputText 
                id="country" 
                formControlName="country" 
                placeholder="Country"
                class="w-full"
              />
            </div>
            
            <div class="form-field">
              <label for="age">Age</label>
              <p-inputNumber 
                id="age" 
                formControlName="age" 
                [min]="16" 
                [max]="60"
                styleClass="w-full"
              ></p-inputNumber>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-field">
              <label for="height">Height</label>
              <input 
                pInputText 
                id="height" 
                formControlName="height" 
                placeholder="e.g., 6'2&quot;"
                class="w-full"
              />
            </div>
            
            <div class="form-field">
              <label for="weight">Weight</label>
              <input 
                pInputText 
                id="weight" 
                formControlName="weight" 
                placeholder="e.g., 210 lbs"
                class="w-full"
              />
            </div>
          </div>

          @if (canManageRoster()) {
            <div class="form-row">
              <div class="form-field">
                <label for="email">Email</label>
                <input 
                  pInputText 
                  id="email" 
                  formControlName="email" 
                  placeholder="player@email.com"
                  class="w-full"
                />
              </div>
              
              <div class="form-field">
                <label for="phone">Phone</label>
                <input 
                  pInputText 
                  id="phone" 
                  formControlName="phone" 
                  placeholder="+1 234 567 8900"
                  class="w-full"
                />
              </div>
            </div>

            <div class="form-field">
              <label for="status">Status</label>
              <p-select 
                id="status"
                formControlName="status"
                [options]="statusOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select status"
                styleClass="w-full"
              ></p-select>
            </div>
          }
        </form>
        
        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            icon="pi pi-times" 
            [text]="true"
            (onClick)="closePlayerDialog()"
          ></p-button>
          <p-button 
            [label]="isEditMode() ? 'Save Changes' : 'Add Player'" 
            icon="pi pi-check" 
            (onClick)="savePlayer()"
            [disabled]="!playerForm.valid || isSaving()"
            [loading]="isSaving()"
          ></p-button>
        </ng-template>
      </p-dialog>

      <!-- Player Details Dialog -->
      <p-dialog
        [(visible)]="showDetailsDialog"
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
                [style.background]="getJerseyColor(selectedPlayer()!.position)"
              >
                {{ selectedPlayer()!.jersey }}
              </div>
              <div class="details-info">
                <h2>{{ selectedPlayer()!.name }}</h2>
                <p class="details-position">{{ getPositionFullName(selectedPlayer()!.position) }}</p>
                <p-tag 
                  [value]="selectedPlayer()!.status | titlecase"
                  [severity]="getStatusSeverity(selectedPlayer()!.status)"
                ></p-tag>
              </div>
            </div>
            
            <div class="details-grid">
              <div class="details-item">
                <span class="details-label">Country</span>
                <span class="details-value">{{ selectedPlayer()!.country }}</span>
              </div>
              <div class="details-item">
                <span class="details-label">Age</span>
                <span class="details-value">{{ selectedPlayer()!.age }}</span>
              </div>
              <div class="details-item">
                <span class="details-label">Height</span>
                <span class="details-value">{{ selectedPlayer()!.height }}</span>
              </div>
              <div class="details-item">
                <span class="details-label">Weight</span>
                <span class="details-value">{{ selectedPlayer()!.weight }}</span>
              </div>
              @if (canManageRoster() && selectedPlayer()!.email) {
                <div class="details-item">
                  <span class="details-label">Email</span>
                  <span class="details-value">{{ selectedPlayer()!.email }}</span>
                </div>
              }
              @if (canManageRoster() && selectedPlayer()!.phone) {
                <div class="details-item">
                  <span class="details-label">Phone</span>
                  <span class="details-value">{{ selectedPlayer()!.phone }}</span>
                </div>
              }
            </div>
            
            @if (selectedPlayer()!.stats && Object.keys(selectedPlayer()!.stats!).length > 0) {
              <div class="details-stats">
                <h3>Performance Stats</h3>
                <div class="stats-chips">
                  @for (stat of getPlayerStats(selectedPlayer()!); track stat.key) {
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
          @if (canManageRoster()) {
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
        [(visible)]="showStatusDialog"
        [modal]="true"
        header="Change Player Status"
        [style]="{ width: '400px' }"
        [closable]="true"
      >
        <div class="status-dialog-content">
          <p>Select new status for <strong>{{ statusChangePlayer()?.name }}</strong>:</p>
          <div class="status-options">
            @for (option of statusOptions; track option.value) {
              <div 
                class="status-option"
                [class.selected]="newStatus() === option.value"
                (click)="newStatus.set(option.value)"
              >
                <div class="status-indicator" [class]="'status-' + option.value"></div>
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
        [(visible)]="showBulkStatusDialog"
        [modal]="true"
        header="Change Status for Selected Players"
        [style]="{ width: '400px' }"
        [closable]="true"
      >
        <div class="status-dialog-content">
          <p>Update status for <strong>{{ selectedPlayers().length }} players</strong>:</p>
          <div class="status-options">
            @for (option of statusOptions; track option.value) {
              <div 
                class="status-option"
                [class.selected]="bulkStatus() === option.value"
                (click)="bulkStatus.set(option.value)"
              >
                <div class="status-indicator" [class]="'status-' + option.value"></div>
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

      <!-- Invite Player Dialog -->
      <p-dialog
        [(visible)]="showInviteDialog"
        [modal]="true"
        header="Invite Player to Team"
        [style]="{ width: '450px' }"
        [closable]="true"
      >
        <form [formGroup]="inviteForm" class="invite-form">
          <div class="form-field">
            <label for="inviteEmail">Email Address *</label>
            <input 
              pInputText 
              id="inviteEmail" 
              formControlName="email" 
              placeholder="player@email.com"
              class="w-full"
            />
          </div>
          
          <div class="form-field">
            <label for="inviteRole">Role</label>
            <p-select 
              id="inviteRole"
              formControlName="role"
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
              formControlName="message" 
              placeholder="Add a personal message to the invitation..."
              rows="3"
              class="w-full"
            ></textarea>
          </div>
        </form>
        
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
            [disabled]="!inviteForm.valid || isSaving()"
            [loading]="isSaving()"
          ></p-button>
        </ng-template>
      </p-dialog>

      <!-- Invitations Management Dialog -->
      <p-dialog
        [(visible)]="showInvitationsDialog"
        [modal]="true"
        header="Pending Invitations"
        [style]="{ width: '700px', maxHeight: '80vh' }"
        [closable]="true"
      >
        <div class="invitations-list">
          @if (pendingInvitations().length === 0) {
            <div class="empty-invitations">
              <i class="pi pi-inbox"></i>
              <p>No pending invitations</p>
              <p-button
                label="Send New Invitation"
                icon="pi pi-plus"
                (onClick)="showInvitationsDialog.set(false); openInviteDialog()"
              ></p-button>
            </div>
          } @else {
            @for (invitation of pendingInvitations(); track invitation.id) {
              <div class="invitation-item" [class.expired]="invitation.isExpired">
                <div class="invitation-info">
                  <div class="invitation-email">
                    <i class="pi pi-envelope"></i>
                    {{ invitation.email }}
                  </div>
                  <div class="invitation-meta">
                    <p-tag 
                      [value]="getRoleDisplayName(invitation.role)"
                      severity="info"
                    ></p-tag>
                    <span class="invited-by">
                      Invited by {{ invitation.invitedBy }}
                    </span>
                    <span class="invitation-date">
                      {{ invitation.createdAt | date:'short' }}
                    </span>
                  </div>
                  @if (invitation.isExpired) {
                    <p-tag value="Expired" severity="danger"></p-tag>
                  } @else {
                    <span class="expires-text">
                      Expires {{ invitation.expiresAt | date:'short' }}
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

      /* Search and Filter Bar */
      .search-filter-bar {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-4);
        align-items: center;
        margin-bottom: var(--space-6);
        padding: var(--space-4);
        background: var(--p-surface-card);
        border-radius: var(--p-border-radius);
        box-shadow: var(--shadow-sm);
      }

      .search-box {
        position: relative;
        flex: 1;
        min-width: 250px;
      }

      .search-box i {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-secondary);
      }

      .search-input {
        width: 100%;
        padding-left: 40px !important;
        padding-right: 36px !important;
      }

      .clear-search {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-secondary);
        padding: 4px;
        border-radius: 50%;
        transition: background 0.2s;
      }

      .clear-search:hover {
        background: var(--p-surface-100);
      }

      .filter-group {
        display: flex;
        gap: var(--space-3);
      }

      .filter-select {
        min-width: 150px;
      }

      .bulk-actions {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding-left: var(--space-4);
        border-left: 1px solid var(--p-surface-200);
        margin-left: auto;
      }

      .selected-count {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        font-weight: var(--font-weight-medium);
      }

      /* No Results State */
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

      .separator {
        opacity: 0.5;
      }

      .overview-card {
        margin-bottom: var(--space-8);
      }

      .card-title {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: var(--font-heading-lg);
        font-weight: var(--font-weight-bold);
        margin: 0;
        color: var(--text-primary);
      }

      .card-title i {
        color: var(--color-brand-primary);
      }

      .team-overview-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: var(--space-4);
      }

      .overview-stat {
        text-align: center;
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
        transition: transform 0.2s;
      }

      .overview-stat:hover {
        transform: translateY(-2px);
      }

      .overview-value {
        font-size: var(--font-heading-2xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-brand-primary);
        margin-bottom: var(--space-2);
      }

      .overview-label {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        font-weight: var(--font-weight-medium);
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

      .staff-card,
      .player-card {
        position: relative;
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .staff-card:hover,
      .player-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
      }

      .player-card.selected {
        outline: 2px solid var(--color-brand-primary);
        outline-offset: 2px;
      }

      .card-checkbox {
        position: absolute;
        top: 12px;
        left: 12px;
        z-index: 1;
      }

      .status-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: var(--font-body-xs);
        font-weight: var(--font-weight-semibold);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .status-active {
        background: var(--color-status-success-bg);
        color: var(--color-status-success);
      }

      .status-injured {
        background: var(--color-status-error-bg);
        color: var(--color-status-error);
      }

      .status-inactive {
        background: var(--p-surface-200);
        color: var(--text-secondary);
      }

      .player-header {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        margin-bottom: var(--space-4);
        margin-top: var(--space-4);
      }

      .player-jersey {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: var(--font-weight-bold);
        font-size: var(--font-body-lg);
        color: var(--color-text-on-primary);
        background: linear-gradient(
          135deg,
          var(--color-brand-primary),
          var(--color-brand-secondary)
        );
        box-shadow: var(--shadow-md);
        flex-shrink: 0;
      }

      .staff-avatar {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
      }

      /* Staff category avatars */
      .coaching-avatar {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
      }

      .medical-avatar {
        background: linear-gradient(135deg, #ef4444, #f97316);
      }

      .performance-avatar {
        background: linear-gradient(135deg, #10b981, #14b8a6);
      }

      /* Role badges on staff cards */
      .role-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: var(--font-body-xs);
        font-weight: var(--font-weight-semibold);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .role-badge.coaching {
        background: rgba(99, 102, 241, 0.15);
        color: #6366f1;
      }

      .role-badge.medical {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
      }

      .role-badge.performance {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
      }

      /* Staff card category borders */
      .staff-card.staff-coaching {
        border-left: 3px solid #6366f1;
      }

      .staff-card.staff-medical {
        border-left: 3px solid #ef4444;
      }

      .staff-card.staff-performance {
        border-left: 3px solid #10b981;
      }

      .player-info {
        flex: 1;
        min-width: 0;
      }

      .player-name {
        font-size: var(--font-body-lg);
        font-weight: var(--font-weight-semibold);
        margin-bottom: var(--space-1);
        color: var(--text-primary);
      }

      .player-position {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        font-weight: var(--font-weight-medium);
        margin-bottom: var(--space-1);
      }

      .player-meta {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-3);
        margin-top: var(--space-4);
      }

      .stat-item {
        text-align: center;
        padding: var(--space-3);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
      }

      .stat-value {
        font-weight: var(--font-weight-bold);
        font-size: var(--font-body-lg);
        color: var(--color-brand-primary);
        margin-bottom: var(--space-1);
      }

      .stat-label {
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
      }

      .achievements {
        margin-top: var(--space-4);
        padding-top: var(--space-4);
        border-top: 1px solid var(--p-surface-200);
      }

      .achievements-title {
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
        font-weight: var(--font-weight-medium);
        margin-bottom: var(--space-2);
      }

      .achievement-item {
        font-size: var(--font-body-xs);
        color: var(--text-primary);
        margin-bottom: var(--space-1);
      }

      .player-details {
        display: flex;
        gap: var(--space-4);
        margin-top: var(--space-4);
        padding-top: var(--space-4);
        border-top: 1px solid var(--p-surface-200);
      }

      .detail-item {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .detail-label {
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
      }

      .detail-value {
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
      }

      .player-stats {
        margin-top: var(--space-4);
        padding-top: var(--space-4);
        border-top: 1px solid var(--p-surface-200);
      }

      .card-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-1);
        margin-top: var(--space-4);
        padding-top: var(--space-4);
        border-top: 1px solid var(--p-surface-200);
      }

      /* Form Styles */
      .player-form,
      .invite-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        flex: 1;
      }

      .form-field label {
        font-weight: var(--font-weight-medium);
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .form-row {
        display: flex;
        gap: var(--space-4);
      }

      .w-full {
        width: 100%;
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

      /* Invitations Dialog */
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

      /* Jersey conflict warning */
      .jersey-warning {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        background: var(--color-status-warning-bg);
        color: var(--color-status-warning);
        border-radius: var(--p-border-radius);
        font-size: var(--font-body-sm);
        margin-top: var(--space-2);
      }

      @media (max-width: 768px) {
        .roster-grid {
          grid-template-columns: 1fr;
        }

        .team-overview-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .search-filter-bar {
          flex-direction: column;
          align-items: stretch;
        }

        .filter-group {
          flex-direction: column;
        }

        .bulk-actions {
          border-left: none;
          padding-left: 0;
          padding-top: var(--space-3);
          border-top: 1px solid var(--p-surface-200);
          margin-left: 0;
          justify-content: center;
        }

        .header-actions {
          width: 100%;
          justify-content: stretch;
        }

        .header-actions p-button {
          flex: 1;
        }

        .form-row {
          flex-direction: column;
        }

        .details-header {
          flex-direction: column;
          text-align: center;
        }

        .details-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class RosterComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private confirmationService = inject(ConfirmationService);

  // ============================================================================
  // STATE SIGNALS
  // ============================================================================
  
  isLoading = signal(true);
  isSaving = signal(false);
  
  // Dialog visibility
  showPlayerDialog = signal(false);
  showDetailsDialog = signal(false);
  showStatusDialog = signal(false);
  showBulkStatusDialog = signal(false);
  showInviteDialog = signal(false);
  
  // Data
  teamStats = signal<TeamStat[]>([]);
  coachingStaff = signal<StaffMember[]>([]);
  allPlayers = signal<Player[]>([]);
  currentTeamId = signal<string | null>(null);
  
  // Current user role
  currentUserRole = signal<TeamRole>('player');
  
  // Edit mode
  isEditMode = signal(false);
  editingPlayerId = signal<string | null>(null);
  
  // Selected player for details/status
  selectedPlayer = signal<Player | null>(null);
  statusChangePlayer = signal<Player | null>(null);
  newStatus = signal<'active' | 'injured' | 'inactive'>('active');
  bulkStatus = signal<'active' | 'injured' | 'inactive'>('active');
  
  // Selection for bulk actions
  selectedPlayerIds = signal<Set<string>>(new Set());
  
  // Search and filters
  searchQuery = signal('');
  positionFilter: string | null = null;
  statusFilter: string | null = null;

  // ============================================================================
  // COMPUTED SIGNALS
  // ============================================================================
  
  canManageRoster = computed(() => {
    const role = this.currentUserRole();
    // Coaching staff can manage roster (add/edit players)
    const managementRoles = [
      'owner', 'admin', 
      'head_coach', 'coach', 
      'offense_coordinator', 'defense_coordinator', 
      'assistant_coach'
    ];
    return managementRoles.includes(role);
  });
  
  canDeletePlayers = computed(() => {
    const role = this.currentUserRole();
    // Only owners, admins, and head coaches can delete players
    return ['owner', 'admin', 'head_coach', 'coach'].includes(role);
  });

  /**
   * Medical/performance staff can view sensitive health data
   */
  canViewHealthData = computed(() => {
    const role = this.currentUserRole();
    const healthDataRoles = [
      'owner', 'admin', 
      'head_coach', 'coach',
      'physiotherapist', 'nutritionist', 'strength_conditioning_coach'
    ];
    return healthDataRoles.includes(role);
  });

  /**
   * Group coaching staff by category for display
   */
  coachingStaffByCategory = computed(() => {
    const staff = this.coachingStaff();
    return {
      coaching: staff.filter(s => s.roleCategory === 'coaching'),
      medical: staff.filter(s => s.roleCategory === 'medical'),
      performance: staff.filter(s => s.roleCategory === 'performance'),
    };
  });
  
  selectedPlayers = computed(() => {
    return Array.from(this.selectedPlayerIds());
  });
  
  filteredPlayers = computed(() => {
    let players = this.allPlayers();
    
    // Search filter
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      players = players.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.position.toLowerCase().includes(query) ||
        p.country.toLowerCase().includes(query)
      );
    }
    
    // Position filter
    if (this.positionFilter) {
      players = players.filter(p => p.position === this.positionFilter);
    }
    
    // Status filter
    if (this.statusFilter) {
      players = players.filter(p => p.status === this.statusFilter);
    }
    
    return players;
  });
  
  filteredPlayersByPosition = computed(() => {
    const players = this.filteredPlayers();
    const positionMap = new Map<string, Player[]>();
    
    players.forEach(player => {
      const positionName = this.getPositionFullName(player.position);
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

  // ============================================================================
  // FORM SETUP
  // ============================================================================
  
  playerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    position: ['', Validators.required],
    jersey: ['', Validators.required],
    country: [''],
    age: [null],
    height: [''],
    weight: [''],
    email: ['', Validators.email],
    phone: [''],
    status: ['active'],
  });

  inviteForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['player'],
    message: [''],
  });

  // ============================================================================
  // OPTIONS
  // ============================================================================
  
  positionOptions = [
    { label: 'Quarterback (QB)', value: 'QB' },
    { label: 'Wide Receiver (WR)', value: 'WR' },
    { label: 'Running Back (RB)', value: 'RB' },
    { label: 'Defensive Back (DB)', value: 'DB' },
    { label: 'Rusher', value: 'Rusher' },
    { label: 'Center', value: 'C' },
    { label: 'Linebacker (LB)', value: 'LB' },
  ];

  positionFilterOptions = [
    { label: 'Quarterback', value: 'QB' },
    { label: 'Wide Receiver', value: 'WR' },
    { label: 'Running Back', value: 'RB' },
    { label: 'Defensive Back', value: 'DB' },
    { label: 'Rusher', value: 'Rusher' },
    { label: 'Center', value: 'C' },
    { label: 'Linebacker', value: 'LB' },
  ];

  statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Injured', value: 'injured' },
    { label: 'Inactive', value: 'inactive' },
  ];

  statusFilterOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Injured', value: 'injured' },
    { label: 'Inactive', value: 'inactive' },
  ];

  roleOptions = [
    { label: 'Player', value: 'player' },
    // Coaching Staff
    { label: 'Head Coach', value: 'head_coach' },
    { label: 'Offense Coordinator', value: 'offense_coordinator' },
    { label: 'Defense Coordinator', value: 'defense_coordinator' },
    { label: 'Assistant Coach', value: 'assistant_coach' },
    // Medical & Performance Staff
    { label: 'Physiotherapist', value: 'physiotherapist' },
    { label: 'Nutritionist', value: 'nutritionist' },
    { label: 'Strength & Conditioning Coach', value: 'strength_conditioning_coach' },
  ];

  // Grouped role options for better UX in dropdowns
  groupedRoleOptions = [
    {
      label: 'Players',
      items: [
        { label: 'Player', value: 'player' },
      ]
    },
    {
      label: 'Coaching Staff',
      items: [
        { label: 'Head Coach', value: 'head_coach' },
        { label: 'Offense Coordinator', value: 'offense_coordinator' },
        { label: 'Defense Coordinator', value: 'defense_coordinator' },
        { label: 'Assistant Coach', value: 'assistant_coach' },
      ]
    },
    {
      label: 'Medical & Performance',
      items: [
        { label: 'Physiotherapist', value: 'physiotherapist' },
        { label: 'Nutritionist', value: 'nutritionist' },
        { label: 'Strength & Conditioning Coach', value: 'strength_conditioning_coach' },
      ]
    }
  ];

  // ============================================================================
  // LIFECYCLE
  // ============================================================================
  
  ngOnInit(): void {
    this.loadRosterData();
    this.loadPendingInvitations();
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================
  
  async loadRosterData(): Promise<void> {
    this.isLoading.set(true);
    const userId = this.authService.currentUser()?.id;

    if (!userId) {
      this.isLoading.set(false);
      return;
    }

    try {
      // Get user's team and role
      const { data: teamMember } = await this.supabaseService.client
        .from('team_members')
        .select('team_id, role, teams(name)')
        .eq('user_id', userId)
        .single();

      if (!teamMember?.team_id) {
        this.teamStats.set([]);
        this.coachingStaff.set([]);
        this.allPlayers.set([]);
        this.isLoading.set(false);
        return;
      }

      this.currentTeamId.set(teamMember.team_id);
      this.currentUserRole.set(teamMember.role as TeamRole);

      // Load team members (coaches/staff)
      const { data: members } = await this.supabaseService.client
        .from('team_members')
        .select(`
          id,
          user_id,
          role,
          users:user_id (
            id,
            email,
            raw_user_meta_data
          )
        `)
        .eq('team_id', teamMember.team_id);

      // Load players from team_players table
      const { data: players, error: playersError } = await this.supabaseService.client
        .from('team_players')
        .select('*')
        .eq('team_id', teamMember.team_id)
        .order('position', { ascending: true });

      if (playersError) {
        this.logger.warn('[Roster] team_players table may not exist, using fallback');
        this.loadFallbackData(members);
        return;
      }

      // Process coaching staff - include all non-player roles
      const staffRoles = [
        'owner', 'admin',
        'head_coach', 'coach', 
        'offense_coordinator', 'defense_coordinator', 'assistant_coach',
        'physiotherapist', 'nutritionist', 'strength_conditioning_coach'
      ];
      
      const staff: StaffMember[] = (members || [])
        .filter((m: any) => staffRoles.includes(m.role))
        .map((m: any) => {
          const role = m.role;
          const category = this.getStaffCategoryFromRole(role);
          return {
            id: m.id,
            user_id: m.user_id,
            name: m.users?.raw_user_meta_data?.full_name || m.users?.email?.split('@')[0] || 'Unknown',
            position: this.getRoleDisplayName(role),
            role: role,
            roleCategory: category,
            country: m.users?.raw_user_meta_data?.country || 'Unknown',
            experience: m.users?.raw_user_meta_data?.experience || 'N/A',
            email: m.users?.email,
            phone: m.users?.raw_user_meta_data?.phone,
            specialization: m.users?.raw_user_meta_data?.specialization,
            certifications: m.users?.raw_user_meta_data?.certifications || [],
            achievements: m.users?.raw_user_meta_data?.achievements || [],
          };
        });

      this.coachingStaff.set(staff);

      // Process players
      const playerList: Player[] = (players || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        position: p.position,
        jersey: p.jersey_number?.toString() || '0',
        country: p.country || 'Unknown',
        age: p.age || 0,
        height: p.height || 'N/A',
        weight: p.weight || 'N/A',
        email: p.email || '',
        phone: p.phone || '',
        status: p.status || 'active',
        stats: p.stats || {},
        created_at: p.created_at,
        user_id: p.user_id,
      }));

      this.allPlayers.set(playerList);

      // Calculate team stats
      const activePlayers = playerList.filter(p => p.status === 'active');
      const injuredPlayers = playerList.filter(p => p.status === 'injured');
      const uniqueCountries = new Set(playerList.map(p => p.country).filter(c => c !== 'Unknown'));
      const avgAge = playerList.length > 0 
        ? Math.round(playerList.reduce((sum, p) => sum + (p.age || 0), 0) / playerList.length)
        : 0;

      this.teamStats.set([
        { value: playerList.length.toString(), label: 'Total Players' },
        { value: activePlayers.length.toString(), label: 'Active' },
        { value: injuredPlayers.length.toString(), label: 'Injured' },
        { value: uniqueCountries.size.toString(), label: 'Countries' },
        { value: avgAge.toString(), label: 'Avg Age' },
        { value: staff.length.toString(), label: 'Staff' },
      ]);

    } catch (error: any) {
      this.logger.error('[Roster] Error loading roster:', error);
      this.toastService.error('Failed to load roster data');
    } finally {
      this.isLoading.set(false);
    }
  }

  private loadFallbackData(members: any[] | null): void {
    const staffRoles = [
      'owner', 'admin',
      'head_coach', 'coach', 
      'offense_coordinator', 'defense_coordinator', 'assistant_coach',
      'physiotherapist', 'nutritionist', 'strength_conditioning_coach'
    ];

    const staff: StaffMember[] = (members || [])
      .filter((m: any) => staffRoles.includes(m.role))
      .map((m: any) => {
        const role = m.role;
        const category = this.getStaffCategoryFromRole(role);
        return {
          id: m.id,
          user_id: m.user_id,
          name: m.users?.raw_user_meta_data?.full_name || m.users?.email?.split('@')[0] || 'Unknown',
          position: this.getRoleDisplayName(role),
          role: role,
          roleCategory: category,
          country: m.users?.raw_user_meta_data?.country || 'Unknown',
          experience: m.users?.raw_user_meta_data?.experience || 'N/A',
          achievements: [],
        };
      });

    this.coachingStaff.set(staff);
    this.allPlayers.set([]);
    this.teamStats.set([
      { value: '0', label: 'Total Players' },
      { value: '0', label: 'Active' },
      { value: '0', label: 'Injured' },
      { value: '0', label: 'Countries' },
      { value: '0', label: 'Avg Age' },
      { value: staff.length.toString(), label: 'Staff' },
    ]);
    this.isLoading.set(false);
  }

  // ============================================================================
  // PLAYER CRUD OPERATIONS
  // ============================================================================
  
  openAddPlayer(): void {
    this.isEditMode.set(false);
    this.editingPlayerId.set(null);
    this.playerForm.reset({ status: 'active' });
    this.showPlayerDialog.set(true);
  }

  editPlayer(player: Player): void {
    this.isEditMode.set(true);
    this.editingPlayerId.set(player.id);
    this.playerForm.patchValue({
      name: player.name,
      position: player.position,
      jersey: player.jersey,
      country: player.country,
      age: player.age,
      height: player.height,
      weight: player.weight,
      email: player.email || '',
      phone: player.phone || '',
      status: player.status,
    });
    this.showPlayerDialog.set(true);
  }

  closePlayerDialog(): void {
    this.showPlayerDialog.set(false);
    this.playerForm.reset({ status: 'active' });
    this.isEditMode.set(false);
    this.editingPlayerId.set(null);
  }

  async savePlayer(): Promise<void> {
    if (!this.playerForm.valid) {
      this.toastService.warn('Please fill in all required fields');
      return;
    }

    // Validate jersey number before saving
    if (!this.validateJerseyNumber()) {
      return;
    }

    const userId = this.authService.currentUser()?.id;
    if (!userId) {
      this.toastService.error('You must be logged in');
      return;
    }

    this.isSaving.set(true);
    const formValue = this.playerForm.value;

    try {
      let teamId = this.currentTeamId();
      
      if (!teamId) {
        // Check if user has a team
        const { data: teamMember } = await this.supabaseService.client
          .from('team_members')
          .select('team_id')
          .eq('user_id', userId)
          .single();
        
        if (teamMember?.team_id) {
          teamId = teamMember.team_id;
          this.currentTeamId.set(teamId);
        } else {
          // Create a default team
          const { data: newTeam, error: teamError } = await this.supabaseService.client
            .from('teams')
            .insert({
              name: 'My Team',
              created_by: userId,
            })
            .select()
            .single();

          if (teamError) throw teamError;
          
          teamId = newTeam.id;
          this.currentTeamId.set(teamId);

          await this.supabaseService.client
            .from('team_members')
            .insert({
              team_id: teamId,
              user_id: userId,
              role: 'owner',
            });
        }
      }

      const playerData = {
        team_id: teamId,
        name: formValue.name,
        position: formValue.position,
        jersey_number: formValue.jersey,
        country: formValue.country || null,
        age: formValue.age || null,
        height: formValue.height || null,
        weight: formValue.weight || null,
        email: formValue.email || null,
        phone: formValue.phone || null,
        status: formValue.status || 'active',
      };

      if (this.isEditMode() && this.editingPlayerId()) {
        // Update existing player
        const { error } = await this.supabaseService.client
          .from('team_players')
          .update(playerData)
          .eq('id', this.editingPlayerId());

        if (error) throw error;
        this.toastService.success('Player updated successfully!');
      } else {
        // Insert new player
        const { error } = await this.supabaseService.client
          .from('team_players')
          .insert({
            ...playerData,
            created_by: userId,
          });

        if (error) throw error;
        this.toastService.success('Player added successfully!');
      }

      this.closePlayerDialog();
      this.loadRosterData();
    } catch (error: any) {
      this.logger.error('[Roster] Error saving player:', error);
      this.toastService.error(error.message || 'Failed to save player');
    } finally {
      this.isSaving.set(false);
    }
  }

  confirmRemovePlayer(player: Player): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to remove ${player.name} from the team?`,
      header: 'Confirm Removal',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.removePlayer(player),
    });
  }

  async removePlayer(player: Player): Promise<void> {
    try {
      const { error } = await this.supabaseService.client
        .from('team_players')
        .delete()
        .eq('id', player.id);

      if (error) throw error;

      this.toastService.success(`${player.name} has been removed from the team`);
      this.loadRosterData();
    } catch (error: any) {
      this.logger.error('[Roster] Error removing player:', error);
      this.toastService.error('Failed to remove player');
    }
  }

  // ============================================================================
  // PLAYER DETAILS
  // ============================================================================
  
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

  // ============================================================================
  // STATUS MANAGEMENT
  // ============================================================================
  
  openStatusDialog(player: Player): void {
    this.statusChangePlayer.set(player);
    this.newStatus.set(player.status);
    this.showStatusDialog.set(true);
  }

  async updatePlayerStatus(): Promise<void> {
    const player = this.statusChangePlayer();
    if (!player) return;

    this.isSaving.set(true);
    try {
      const { error } = await this.supabaseService.client
        .from('team_players')
        .update({ status: this.newStatus() })
        .eq('id', player.id);

      if (error) throw error;

      this.toastService.success(`${player.name}'s status updated to ${this.newStatus()}`);
      this.showStatusDialog.set(false);
      this.loadRosterData();
    } catch (error: any) {
      this.logger.error('[Roster] Error updating status:', error);
      this.toastService.error('Failed to update status');
    } finally {
      this.isSaving.set(false);
    }
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================
  
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
    this.bulkStatus.set('active');
    this.showBulkStatusDialog.set(true);
  }

  async updateBulkStatus(): Promise<void> {
    const ids = Array.from(this.selectedPlayerIds());
    if (ids.length === 0) return;

    this.isSaving.set(true);
    try {
      const { error } = await this.supabaseService.client
        .from('team_players')
        .update({ status: this.bulkStatus() })
        .in('id', ids);

      if (error) throw error;

      this.toastService.success(`Updated status for ${ids.length} players`);
      this.showBulkStatusDialog.set(false);
      this.clearSelection();
      this.loadRosterData();
    } catch (error: any) {
      this.logger.error('[Roster] Error bulk updating status:', error);
      this.toastService.error('Failed to update status');
    } finally {
      this.isSaving.set(false);
    }
  }

  confirmBulkRemove(): void {
    const count = this.selectedPlayerIds().size;
    this.confirmationService.confirm({
      message: `Are you sure you want to remove ${count} player(s) from the team?`,
      header: 'Confirm Bulk Removal',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.bulkRemovePlayers(),
    });
  }

  async bulkRemovePlayers(): Promise<void> {
    const ids = Array.from(this.selectedPlayerIds());
    if (ids.length === 0) return;

    try {
      const { error } = await this.supabaseService.client
        .from('team_players')
        .delete()
        .in('id', ids);

      if (error) throw error;

      this.toastService.success(`Removed ${ids.length} players from the team`);
      this.clearSelection();
      this.loadRosterData();
    } catch (error: any) {
      this.logger.error('[Roster] Error bulk removing players:', error);
      this.toastService.error('Failed to remove players');
    }
  }

  // ============================================================================
  // JERSEY NUMBER VALIDATION
  // ============================================================================
  
  /**
   * Check if a jersey number is already taken by another player
   */
  isJerseyNumberTaken(jerseyNumber: string, excludePlayerId?: string): boolean {
    const players = this.allPlayers();
    return players.some(p => 
      p.jersey === jerseyNumber && 
      p.id !== excludePlayerId
    );
  }

  /**
   * Get list of available jersey numbers
   */
  getAvailableJerseyNumbers(): string[] {
    const usedNumbers = new Set(this.allPlayers().map(p => p.jersey));
    const available: string[] = [];
    
    // Common jersey numbers 0-99
    for (let i = 0; i <= 99; i++) {
      const num = i.toString();
      if (!usedNumbers.has(num)) {
        available.push(num);
      }
    }
    
    return available;
  }

  /**
   * Validate jersey number before saving
   */
  validateJerseyNumber(): boolean {
    const jerseyNumber = this.playerForm.get('jersey')?.value;
    if (!jerseyNumber) return true;
    
    const excludeId = this.isEditMode() ? this.editingPlayerId() : undefined;
    
    if (this.isJerseyNumberTaken(jerseyNumber, excludeId ?? undefined)) {
      this.toastService.error(`Jersey number ${jerseyNumber} is already taken by another player`);
      return false;
    }
    
    return true;
  }

  // ============================================================================
  // INVITATION MANAGEMENT
  // ============================================================================
  
  pendingInvitations = signal<TeamInvitation[]>([]);
  showInvitationsDialog = signal(false);
  
  openInviteDialog(): void {
    this.inviteForm.reset({ role: 'player' });
    this.showInviteDialog.set(true);
  }

  async sendInvitation(): Promise<void> {
    if (!this.inviteForm.valid) {
      this.toastService.warn('Please enter a valid email');
      return;
    }

    const teamId = this.currentTeamId();
    if (!teamId) {
      this.toastService.error('No team selected');
      return;
    }

    this.isSaving.set(true);
    const formValue = this.inviteForm.value;

    try {
      // Check if invitation already exists
      const { data: existing } = await this.supabaseService.client
        .from('team_invitations')
        .select('id, status')
        .eq('team_id', teamId)
        .eq('email', formValue.email)
        .eq('status', 'pending')
        .single();
      
      if (existing) {
        this.toastService.warn('An invitation is already pending for this email');
        return;
      }

      // Create invitation record
      const { error } = await this.supabaseService.client
        .from('team_invitations')
        .insert({
          team_id: teamId,
          email: formValue.email,
          role: formValue.role,
          message: formValue.message || null,
          invited_by: this.authService.currentUser()?.id,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        });

      if (error) {
        if (error.code === '42P01') {
          this.toastService.info('Invitation feature coming soon! The team_invitations table needs to be created.');
        } else {
          throw error;
        }
      } else {
        // Log the invitation
        await this.logRosterChange('invitation_sent', 'invitation', undefined, formValue.email, null, {
          email: formValue.email,
          role: formValue.role
        });
        
        this.toastService.success(`Invitation sent to ${formValue.email}`);
        this.loadPendingInvitations();
      }

      this.showInviteDialog.set(false);
    } catch (error: any) {
      this.logger.error('[Roster] Error sending invitation:', error);
      this.toastService.error('Failed to send invitation');
    } finally {
      this.isSaving.set(false);
    }
  }

  async loadPendingInvitations(): Promise<void> {
    const teamId = this.currentTeamId();
    if (!teamId) return;

    try {
      const { data, error } = await this.supabaseService.client
        .from('team_invitations')
        .select(`
          id,
          email,
          role,
          message,
          status,
          invited_by,
          expires_at,
          created_at,
          inviter:invited_by(raw_user_meta_data)
        `)
        .eq('team_id', teamId)
        .in('status', ['pending', 'expired'])
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code !== '42P01') throw error;
        return;
      }

      this.pendingInvitations.set((data || []).map((inv: any) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        message: inv.message,
        status: inv.status,
        invitedBy: inv.inviter?.raw_user_meta_data?.full_name || 'Unknown',
        expiresAt: inv.expires_at,
        createdAt: inv.created_at,
        isExpired: new Date(inv.expires_at) < new Date()
      })));
    } catch (error: any) {
      this.logger.error('[Roster] Error loading invitations:', error);
    }
  }

  openInvitationsDialog(): void {
    this.loadPendingInvitations();
    this.showInvitationsDialog.set(true);
  }

  async resendInvitation(invitation: TeamInvitation): Promise<void> {
    try {
      const { error } = await this.supabaseService.client
        .from('team_invitations')
        .update({
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (error) throw error;

      this.toastService.success(`Invitation resent to ${invitation.email}`);
      this.loadPendingInvitations();
    } catch (error: any) {
      this.logger.error('[Roster] Error resending invitation:', error);
      this.toastService.error('Failed to resend invitation');
    }
  }

  async cancelInvitation(invitation: TeamInvitation): Promise<void> {
    this.confirmationService.confirm({
      message: `Cancel invitation for ${invitation.email}?`,
      header: 'Cancel Invitation',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          const { error } = await this.supabaseService.client
            .from('team_invitations')
            .update({ status: 'cancelled' })
            .eq('id', invitation.id);

          if (error) throw error;

          await this.logRosterChange('invitation_cancelled', 'invitation', invitation.id, invitation.email, 
            { status: 'pending' }, { status: 'cancelled' });

          this.toastService.success('Invitation cancelled');
          this.loadPendingInvitations();
        } catch (error: any) {
          this.logger.error('[Roster] Error cancelling invitation:', error);
          this.toastService.error('Failed to cancel invitation');
        }
      }
    });
  }

  getInvitationStatusSeverity(invitation: TeamInvitation): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    if (invitation.isExpired) return 'danger';
    if (invitation.status === 'pending') return 'info';
    if (invitation.status === 'accepted') return 'success';
    return 'secondary';
  }

  // ============================================================================
  // ROSTER AUDIT LOG
  // ============================================================================
  
  async logRosterChange(
    action: string,
    targetType: string,
    targetId: string | undefined,
    targetName: string,
    oldValues: any,
    newValues: any
  ): Promise<void> {
    const teamId = this.currentTeamId();
    if (!teamId) return;

    try {
      await this.supabaseService.client.rpc('log_roster_change', {
        p_team_id: teamId,
        p_action: action,
        p_target_type: targetType,
        p_target_id: targetId || null,
        p_target_name: targetName,
        p_old_values: oldValues ? JSON.stringify(oldValues) : null,
        p_new_values: newValues ? JSON.stringify(newValues) : null
      });
    } catch (error) {
      // Non-critical, just log
      this.logger.warn('[Roster] Failed to log audit entry:', error);
    }
  }

  // ============================================================================
  // EXPORT
  // ============================================================================
  
  exportRoster(): void {
    const players = this.allPlayers();
    if (players.length === 0) {
      this.toastService.warn('No players to export');
      return;
    }

    // Create CSV content
    const headers = ['Name', 'Position', 'Jersey #', 'Country', 'Age', 'Height', 'Weight', 'Status', 'Email'];
    const rows = players.map(p => [
      p.name,
      p.position,
      p.jersey,
      p.country,
      p.age.toString(),
      p.height,
      p.weight,
      p.status,
      p.email || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `roster_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.toastService.success('Roster exported successfully');
  }

  // ============================================================================
  // FILTERS
  // ============================================================================
  
  clearFilters(): void {
    this.searchQuery.set('');
    this.positionFilter = null;
    this.statusFilter = null;
  }

  // ============================================================================
  // HELPERS
  // ============================================================================
  
  getRoleDisplayName(role: string): string {
    const roleNames: Record<string, string> = {
      // Ownership & Admin
      owner: 'Team Owner',
      admin: 'Administrator',
      // Coaching Staff
      head_coach: 'Head Coach',
      coach: 'Head Coach', // Legacy support
      offense_coordinator: 'Offense Coordinator',
      defense_coordinator: 'Defense Coordinator',
      assistant_coach: 'Assistant Coach',
      // Medical & Performance Staff
      physiotherapist: 'Physiotherapist',
      nutritionist: 'Nutritionist',
      strength_conditioning_coach: 'Strength & Conditioning Coach',
      // Players
      player: 'Player',
      manager: 'Team Manager',
    };
    return roleNames[role] || role;
  }

  /**
   * Get the category of a staff role for grouping in the UI
   */
  private getStaffCategoryFromRole(role: string): StaffCategory {
    const coachingRoles = ['owner', 'admin', 'head_coach', 'coach', 'offense_coordinator', 'defense_coordinator', 'assistant_coach'];
    const medicalRoles = ['physiotherapist', 'nutritionist'];
    const performanceRoles = ['strength_conditioning_coach'];
    
    if (medicalRoles.includes(role)) return 'medical';
    if (performanceRoles.includes(role)) return 'performance';
    if (coachingRoles.includes(role)) return 'coaching';
    return 'coaching'; // Default
  }

  /**
   * Check if a role has roster management permissions
   */
  private isManagementRole(role: string): boolean {
    const managementRoles = [
      'owner', 'admin', 'head_coach', 'coach', 
      'offense_coordinator', 'defense_coordinator', 'assistant_coach'
    ];
    return managementRoles.includes(role);
  }

  getPositionFullName(position: string): string {
    const positionNames: Record<string, string> = {
      QB: 'Quarterback',
      WR: 'Wide Receiver',
      RB: 'Running Back',
      DB: 'Defensive Back',
      C: 'Center',
      LB: 'Linebacker',
      Rusher: 'Rusher',
    };
    return positionNames[position] || position;
  }

  getCountryCount(): number {
    const countries = new Set(this.allPlayers().map(p => p.country).filter(c => c !== 'Unknown'));
    return countries.size;
  }

  getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2);
  }

  getYears(experience: string): string {
    return experience.split(" ")[0];
  }

  getPositionIcon(position: string): string {
    const icons: Record<string, string> = {
      Quarterback: "pi pi-user",
      "Wide Receiver": "pi pi-users",
      "Running Back": "pi pi-bolt",
      "Defensive Back": "pi pi-shield",
      Rusher: "pi pi-forward",
      Center: "pi pi-circle",
      Linebacker: "pi pi-shield",
    };
    return icons[position] || "pi pi-user";
  }

  getJerseyColor(position: string): string {
    const primaryGreen = "#089949";
    const primaryLight = "#10c96b";
    const colors: Record<string, string> = {
      QB: `linear-gradient(135deg, ${primaryGreen}, ${primaryLight})`,
      WR: "linear-gradient(135deg, #3498db, #2980b9)",
      RB: "linear-gradient(135deg, #e74c3c, #c0392b)",
      DB: "linear-gradient(135deg, #9b59b6, #8e44ad)",
      Rusher: "linear-gradient(135deg, #f39c12, #e67e22)",
      C: "linear-gradient(135deg, #1abc9c, #16a085)",
      LB: "linear-gradient(135deg, #34495e, #2c3e50)",
    };
    return colors[position] || `linear-gradient(135deg, ${primaryGreen}, ${primaryLight})`;
  }

  getStatusSeverity(status: string): 'success' | 'danger' | 'secondary' {
    switch (status) {
      case 'active': return 'success';
      case 'injured': return 'danger';
      default: return 'secondary';
    }
  }

  getPlayerStats(player: Player): Array<{ label: string; value: string | number; key: string }> {
    if (!player.stats) return [];
    return Object.entries(player.stats).map(([key, value]) => ({
      label: key.charAt(0).toUpperCase() + key.slice(1),
      value: value,
      key: key,
    }));
  }

  // ============================================================================
  // TRACK BY FUNCTIONS
  // ============================================================================
  
  trackByStatLabel(index: number, stat: TeamStat): string {
    return stat.label;
  }

  trackByMemberName(index: number, member: StaffMember): string {
    return member.id || member.name;
  }

  trackByAchievement(index: number, achievement: string): string {
    return achievement;
  }

  trackByPosition(index: number, positionGroup: { position: string; players: Player[] }): string {
    return positionGroup.position;
  }

  trackByPlayerId(index: number, player: Player): string {
    return player.id;
  }

  trackByStatKey(index: number, stat: { label: string; value: string | number; key: string }): string {
    return stat.key || index.toString();
  }
}
