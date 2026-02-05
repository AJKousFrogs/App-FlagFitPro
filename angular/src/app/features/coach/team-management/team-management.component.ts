/**
 * Team Management Component (Coach View)
 *
 * Central hub for managing team roster, depth chart, player invitations,
 * and team settings. Coaches can invite players, manage positions, and
 * configure team preferences.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { CommonModule, DatePipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  DestroyRef,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { MessageService, PrimeTemplate } from "primeng/api";
import { Avatar } from "primeng/avatar";
import { Card } from "primeng/card";
import { Checkbox } from "primeng/checkbox";
import { ColorPicker } from "primeng/colorpicker";
import { Dialog } from "primeng/dialog";

import { InputText } from "primeng/inputtext";
import { RadioButton } from "primeng/radiobutton";
import { Select } from "primeng/select";
import { TableModule } from "primeng/table";

import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { Textarea } from "primeng/textarea";
import { firstValueFrom } from "rxjs";
import { ButtonComponent } from "../../../shared/components/button/button.component";

import { ApiService } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ApiResponse } from "../../../core/models/common.models";
import { DialogService } from "../../../core/ui/dialog.service";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { getInitials } from "../../../shared/utils/format.utils";

// ===== Interfaces =====
interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  position: string;
  secondaryPosition?: string;
  jerseyNumber: string;
  status: PlayerStatus;
  acwr?: number;
  depthChartRank?: number;
  joinedAt: string;
  coachNotes?: string;
}

interface DepthChartEntry {
  position: string;
  players: {
    rank: number;
    player: TeamMember;
    note?: string;
  }[];
}

interface Invitation {
  id: string;
  email: string;
  role: InvitationRole;
  sentAt: string;
  expiresAt: string;
  status: "pending" | "accepted" | "expired";
  acceptedBy?: string;
}

interface TeamSettings {
  name: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  league: string;
  homeField: string;
  preferences: {
    requireWellnessCheckin: boolean;
    autoSendRsvpReminders: boolean;
    allowPlayersViewAnalytics: boolean;
    requireCoachApprovalPosts: boolean;
  };
}

type PlayerStatus = "active" | "minor-injury" | "rtp" | "inactive";
type InvitationRole = "player" | "assistant-coach" | "team-manager";

// ===== Constants =====
const POSITIONS = [
  { label: "Quarterback (QB)", value: "QB" },
  { label: "Wide Receiver (WR)", value: "WR" },
  { label: "Center (C)", value: "C" },
  { label: "Rusher", value: "Rusher" },
  { label: "Defensive Back (DB)", value: "DB" },
];

const STATUS_CONFIG: Record<
  PlayerStatus,
  {
    label: string;
    icon: string;
    severity: "success" | "warning" | "danger" | "secondary";
  }
> = {
  active: { label: "Active", icon: "🟢", severity: "success" },
  "minor-injury": { label: "Minor Injury", icon: "🟡", severity: "warning" },
  rtp: { label: "RTP", icon: "🔴", severity: "danger" },
  inactive: { label: "Inactive", icon: "⚪", severity: "secondary" },
};

@Component({
  selector: "app-team-management",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    Avatar,
    Card,
    Checkbox,
    ColorPicker,
    Dialog,
    PrimeTemplate,
    InputText,
    RadioButton,
    Select,
    TableModule,
    TableModule,
    StatusTagComponent,
    Textarea,

    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
  ],
  providers: [MessageService],
  template: `
    <app-main-layout>
<div class="team-management-page">
        <app-page-header
          title="Team Management"
          subtitle="Manage roster, depth chart, invitations, and team settings"
          icon="pi-users"
        >
          <app-button iconLeft="pi-plus" (clicked)="openInviteDialog()"
            >Invite Player</app-button
          >
        </app-page-header>

        <!-- Tab Navigation -->
        <div class="tab-navigation">
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'roster'"
            (click)="activeTab.set('roster')"
          >
            <i class="pi pi-users"></i>
            Roster
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'depth-chart'"
            (click)="activeTab.set('depth-chart')"
          >
            <i class="pi pi-sitemap"></i>
            Depth Chart
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'invitations'"
            (click)="activeTab.set('invitations')"
          >
            <i class="pi pi-envelope"></i>
            Invitations
            @if (pendingInvitations().length > 0) {
              <span class="badge">{{ pendingInvitations().length }}</span>
            }
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'settings'"
            (click)="activeTab.set('settings')"
          >
            <i class="pi pi-cog"></i>
            Settings
          </button>
        </div>

        <!-- Roster Tab -->
        @if (activeTab() === "roster") {
          <p-card styleClass="tab-content-card">
            <!-- Filters -->
            <div class="filters-row">
              <span class="p-input-icon-left filter-search">
                <i class="pi pi-search"></i>
                <input
                  type="text"
                  pInputText
                  placeholder="Search players..."
                  [(ngModel)]="searchQuery"
                />
              </span>
              <p-select
                inputId="position-filter"
                [options]="positionOptions"
                [(ngModel)]="positionFilter"
                placeholder="Position"
                [showClear]="true"
                styleClass="filter-select"
                [attr.aria-label]="'Filter by position'"
              ></p-select>
              <p-select
                inputId="status-filter"
                [options]="statusOptions"
                [(ngModel)]="statusFilter"
                placeholder="Status"
                [showClear]="true"
                styleClass="filter-select"
                [attr.aria-label]="'Filter by status'"
              ></p-select>
            </div>

            <!-- Roster Table -->
            <p-table
              [value]="filteredMembers()"
              [paginator]="filteredMembers().length > 10"
              [rows]="10"
              styleClass="p-datatable-sm"
              [rowHover]="true"
            >
              <ng-template pTemplate="header">
                <tr>
                  <th class="roster-avatar-col"></th>
                  <th pSortableColumn="name">Player</th>
                  <th pSortableColumn="position">Position</th>
                  <th>Jersey</th>
                  <th pSortableColumn="status">Status</th>
                  <th>ACWR</th>
                  <th class="roster-actions-col"></th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-member>
                <tr>
                  <td>
                    <p-avatar
                      [image]="member.avatarUrl"
                      [label]="
                        !member.avatarUrl ? getInitialsStr(member.name) : ''
                      "
                      shape="circle"
                    ></p-avatar>
                  </td>
                  <td>
                    <div class="player-name-cell">
                      <strong>{{ member.name }}</strong>
                    </div>
                  </td>
                  <td>{{ member.position }}</td>
                  <td>#{{ member.jerseyNumber }}</td>
                  <td>
                    <app-status-tag
                      [value]="getStatusConfig(member.status).label"
                      [severity]="getStatusConfig(member.status).severity"
                      size="sm"
                    />
                  </td>
                  <td>
                    @if (member.acwr) {
                      <span [class]="getAcwrClass(member.acwr)">{{
                        member.acwr | number: "1.2-2"
                      }}</span>
                    } @else {
                      <span class="no-data">--</span>
                    }
                  </td>
                  <td>
                    <app-button
                      variant="text"
                      iconLeft="pi-ellipsis-v"
                      (clicked)="openPlayerMenu($event, member)"
                      >Player actions</app-button
                    >
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="7" class="empty-message">No players found</td>
                </tr>
              </ng-template>
            </p-table>

            <!-- Position Summary -->
            <div class="position-summary">
              <h4>Position Summary</h4>
              <div class="position-cards">
                @for (pos of positionSummary(); track pos.position) {
                  <div class="pos-card">
                    <span class="pos-name">{{ pos.position }}</span>
                    <span class="pos-count">{{ pos.count }}</span>
                    <span class="pos-label">players</span>
                  </div>
                }
              </div>
            </div>
          </p-card>
        }

        <!-- Depth Chart Tab -->
        @if (activeTab() === "depth-chart") {
          <p-card styleClass="tab-content-card">
            <div class="depth-chart-header">
              <h3>Team Depth Chart</h3>
              <app-button
                variant="secondary"
                iconLeft="pi-pencil"
                (clicked)="editDepthChart()"
                >Edit Depth Chart</app-button
              >
            </div>

            <div class="depth-chart-sections">
              <!-- Offense -->
              <div class="dc-section">
                <h4 class="section-title">OFFENSE</h4>
                @for (entry of offenseDepthChart(); track entry.position) {
                  <div class="position-group">
                    <div class="position-label">{{ entry.position }}</div>
                    <div class="players-list">
                      @for (p of entry.players; track p.player.id) {
                        <div
                          class="depth-player"
                          [class.starter]="p.rank === 1"
                        >
                          <span class="rank">{{ getRankLabel(p.rank) }}</span>
                          <span class="name"
                            >{{ p.player.name }} #{{
                              p.player.jerseyNumber
                            }}</span
                          >
                          <app-status-tag
                            [value]="getStatusConfig(p.player.status).label"
                            [severity]="
                              getStatusConfig(p.player.status).severity
                            "
                            size="sm"
                          />
                          @if (p.note) {
                            <span class="player-note">{{ p.note }}</span>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- Defense -->
              <div class="dc-section">
                <h4 class="section-title">DEFENSE</h4>
                @for (entry of defenseDepthChart(); track entry.position) {
                  <div class="position-group">
                    <div class="position-label">{{ entry.position }}</div>
                    <div class="players-list">
                      @for (p of entry.players; track p.player.id) {
                        <div
                          class="depth-player"
                          [class.starter]="p.rank === 1"
                        >
                          <span class="rank">{{ getRankLabel(p.rank) }}</span>
                          <span class="name"
                            >{{ p.player.name }} #{{
                              p.player.jerseyNumber
                            }}</span
                          >
                          <app-status-tag
                            [value]="getStatusConfig(p.player.status).label"
                            [severity]="
                              getStatusConfig(p.player.status).severity
                            "
                            size="sm"
                          />
                          @if (p.note) {
                            <span class="player-note">{{ p.note }}</span>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          </p-card>
        }

        <!-- Invitations Tab -->
        @if (activeTab() === "invitations") {
          <p-card styleClass="tab-content-card">
            <div class="invitations-header">
              <h3>Player Invitations</h3>
              <app-button iconLeft="pi-plus" (clicked)="openInviteDialog()"
                >Send New Invitation</app-button
              >
            </div>

            @if (pendingInvitations().length > 0) {
              <div class="invitations-section">
                <h4>Pending Invitations</h4>
                @for (inv of pendingInvitations(); track inv.id) {
                  <div class="invitation-card pending">
                    <div class="inv-info">
                      <i class="pi pi-envelope"></i>
                      <div class="inv-details">
                        <span class="inv-email">{{ inv.email }}</span>
                        <span class="inv-meta">
                          Sent: {{ inv.sentAt | date: "MMM d, y" }} • Expires:
                          {{ inv.expiresAt | date: "MMM d, y" }}
                        </span>
                        <span class="inv-role"
                          >Role: {{ getRoleLabel(inv.role) }}</span
                        >
                      </div>
                    </div>
                    <div class="inv-actions">
                      <app-button
                        variant="secondary"
                        size="sm"
                        iconLeft="pi-refresh"
                        (clicked)="resendInvitation(inv)"
                        >Resend</app-button
                      >
                      <app-button
                        variant="text"
                        size="sm"
                        iconLeft="pi-times"
                        (clicked)="cancelInvitation(inv)"
                        >Cancel</app-button
                      >
                    </div>
                  </div>
                }
              </div>
            }

            @if (acceptedInvitations().length > 0) {
              <div class="invitations-section">
                <h4>Accepted</h4>
                @for (inv of acceptedInvitations(); track inv.id) {
                  <div class="invitation-card accepted">
                    <div class="inv-info">
                      <i class="pi pi-check-circle"></i>
                      <div class="inv-details">
                        <span class="inv-email"
                          >{{ inv.email }} → {{ inv.acceptedBy }}</span
                        >
                        <span class="inv-meta"
                          >Accepted: {{ inv.sentAt | date: "MMM d, y" }}</span
                        >
                      </div>
                    </div>
                  </div>
                }
              </div>
            }

            @if (invitations().length === 0) {
              <div class="empty-invitations">
                <i class="pi pi-envelope"></i>
                <p>No invitations sent yet</p>
                <app-button iconLeft="pi-plus" (clicked)="openInviteDialog()"
                  >Invite Your First Player</app-button
                >
              </div>
            }
          </p-card>
        }

        <!-- Settings Tab -->
        @if (activeTab() === "settings") {
          <p-card styleClass="tab-content-card">
            <div class="settings-form">
              <!-- Team Information -->
              <div class="settings-section">
                <h4><i class="pi pi-flag"></i> Team Information</h4>

                <div class="form-field">
                  <label for="teamName">Team Name</label>
                  <input
                    id="teamName"
                    type="text"
                    pInputText
                    [(ngModel)]="teamSettings().name"
                    class="w-full"
                  />
                </div>

                <div class="form-row">
                  <div class="form-field">
                    <label>Primary Color</label>
                    <p-colorPicker
                      [(ngModel)]="teamSettings().primaryColor"
                    ></p-colorPicker>
                    <span class="color-code">{{
                      teamSettings().primaryColor
                    }}</span>
                  </div>
                  <div class="form-field">
                    <label>Secondary Color</label>
                    <p-colorPicker
                      [(ngModel)]="teamSettings().secondaryColor"
                    ></p-colorPicker>
                    <span class="color-code">{{
                      teamSettings().secondaryColor
                    }}</span>
                  </div>
                </div>

                <div class="form-field">
                  <label for="league">League / Division</label>
                  <input
                    id="league"
                    type="text"
                    pInputText
                    [(ngModel)]="teamSettings().league"
                    class="w-full"
                  />
                </div>

                <div class="form-field">
                  <label for="homeField">Home Field</label>
                  <input
                    id="homeField"
                    type="text"
                    pInputText
                    [(ngModel)]="teamSettings().homeField"
                    class="w-full"
                  />
                </div>
              </div>

              <!-- Team Preferences -->
              <div class="settings-section">
                <h4><i class="pi pi-cog"></i> Team Preferences</h4>

                <div class="preference-item">
                  <p-checkbox
                    [(ngModel)]="
                      teamSettings().preferences.requireWellnessCheckin
                    "
                    [binary]="true"
                    variant="filled"
                    inputId="reqWellness"
                  ></p-checkbox>
                  <label for="reqWellness"
                    >Require wellness check-in before practice</label
                  >
                </div>

                <div class="preference-item">
                  <p-checkbox
                    [(ngModel)]="
                      teamSettings().preferences.autoSendRsvpReminders
                    "
                    [binary]="true"
                    variant="filled"
                    inputId="autoRsvp"
                  ></p-checkbox>
                  <label for="autoRsvp"
                    >Auto-send RSVP reminders 24 hours before events</label
                  >
                </div>

                <div class="preference-item">
                  <p-checkbox
                    [(ngModel)]="
                      teamSettings().preferences.allowPlayersViewAnalytics
                    "
                    [binary]="true"
                    variant="filled"
                    inputId="allowAnalytics"
                  ></p-checkbox>
                  <label for="allowAnalytics"
                    >Allow players to see team analytics</label
                  >
                </div>

                <div class="preference-item">
                  <p-checkbox
                    [(ngModel)]="
                      teamSettings().preferences.requireCoachApprovalPosts
                    "
                    [binary]="true"
                    variant="filled"
                    inputId="reqApproval"
                  ></p-checkbox>
                  <label for="reqApproval"
                    >Require coach approval for community posts</label
                  >
                </div>
              </div>

              <div class="settings-actions">
                <app-button iconLeft="pi-check" (clicked)="saveSettings()"
                  >Save Changes</app-button
                >
              </div>
            </div>
          </p-card>
        }
      </div>

      <!-- Invite Player Dialog -->
      <p-dialog
        [(visible)]="showInviteDialog"
        header="Invite Player"
        [modal]="true"
        styleClass="team-invite-dialog"
      >
        <form #inviteFormRef="ngForm" class="invite-form">
          <div class="form-field">
            <label for="inviteEmail">Email Address *</label>
            <input
              id="inviteEmail"
              type="email"
              pInputText
              [(ngModel)]="inviteForm.email"
              name="email"
              #emailField="ngModel"
              required
              email
              placeholder="player@email.com"
              class="w-full"
              [class.ng-invalid]="emailField.invalid && emailField.touched"
            />
            @if (emailField.invalid && emailField.touched) {
              <small class="p-error">
                @if (emailField.errors?.["required"]) {
                  Email address is required
                } @else if (emailField.errors?.["email"]) {
                  Please enter a valid email address
                }
              </small>
            }
          </div>

          <div class="form-field">
            <label>Role *</label>
            <div class="role-options">
              <div class="role-option">
                <p-radioButton
                  name="role"
                  value="player"
                  [(ngModel)]="inviteForm.role"
                  inputId="rolePlayer"
                  required
                ></p-radioButton>
                <label for="rolePlayer">Player</label>
              </div>
              <div class="role-option">
                <p-radioButton
                  name="role"
                  value="assistant-coach"
                  [(ngModel)]="inviteForm.role"
                  inputId="roleAssistant"
                ></p-radioButton>
                <label for="roleAssistant">Assistant Coach</label>
              </div>
              <div class="role-option">
                <p-radioButton
                  name="role"
                  value="team-manager"
                  [(ngModel)]="inviteForm.role"
                  inputId="roleManager"
                ></p-radioButton>
                <label for="roleManager">Team Manager</label>
              </div>
            </div>
          </div>

          <div class="form-field">
            <label for="inviteMessage">Personal Message (optional)</label>
            <textarea
              pTextarea
              id="inviteMessage"
              [(ngModel)]="inviteForm.message"
              name="message"
              placeholder="Welcome to the team!"
              rows="3"
              maxlength="500"
            ></textarea>
          </div>

          <p class="invite-note">
            <i class="pi pi-info-circle"></i>
            Invitation expires after 7 days
          </p>
        </form>

        <ng-template pTemplate="footer">
          <app-button variant="secondary" (clicked)="showInviteDialog = false"
            >Cancel</app-button
          >
          <app-button
            iconLeft="pi-send"
            [disabled]="inviteFormRef.invalid || isSendingInvite()"
            [loading]="isSendingInvite()"
            (clicked)="sendInvitation()"
            >Send Invitation</app-button
          >
        </ng-template>
      </p-dialog>

      <!-- Edit Player Dialog -->
      <p-dialog
        [(visible)]="showEditPlayerDialog"
        [header]="'Edit Player: ' + (selectedPlayer()?.name || '')"
        [modal]="true"
        styleClass="team-edit-player-dialog"
      >
        @if (selectedPlayer(); as player) {
          <div class="edit-player-form">
            <div class="player-header">
              <p-avatar
                [image]="player.avatarUrl"
                [label]="!player.avatarUrl ? getInitialsStr(player.name) : ''"
                size="large"
                shape="circle"
              ></p-avatar>
              <div class="player-info">
                <h4>{{ player.name }}</h4>
                <p>{{ player.email }}</p>
                <p class="join-date">
                  Joined: {{ player.joinedAt | date: "MMM d, y" }}
                </p>
              </div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label for="editJersey">Jersey Number</label>
                <input
                  id="editJersey"
                  type="text"
                  pInputText
                  [(ngModel)]="editForm.jerseyNumber"
                />
              </div>
              <div class="form-field">
                <label for="editPosition">Primary Position</label>
                <p-select
                  inputId="editPosition"
                  [options]="positionOptions"
                  [(ngModel)]="editForm.position"
                  optionLabel="label"
                  optionValue="value"
                ></p-select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label for="editSecondary">Secondary Position</label>
                <p-select
                  inputId="editSecondary"
                  [options]="positionOptions"
                  [(ngModel)]="editForm.secondaryPosition"
                  optionLabel="label"
                  optionValue="value"
                  [showClear]="true"
                ></p-select>
              </div>
              <div class="form-field">
                <label for="editDepth">Depth Chart Position</label>
                <p-select
                  inputId="editDepth"
                  [options]="depthOptions"
                  [(ngModel)]="editForm.depthChartRank"
                  optionLabel="label"
                  optionValue="value"
                ></p-select>
              </div>
            </div>

            <div class="form-field">
              <label>Status</label>
              <div class="status-options">
                @for (status of statusOptions; track status.value) {
                  <div class="status-option">
                    <p-radioButton
                      name="status"
                      [value]="status.value"
                      [(ngModel)]="editForm.status"
                      [inputId]="'status-' + status.value"
                    ></p-radioButton>
                    <label [for]="'status-' + status.value">{{
                      status.label
                    }}</label>
                  </div>
                }
              </div>
            </div>

            <div class="form-field">
              <label for="editNotes">Coach Notes (private)</label>
              <textarea
                pTextarea
                id="editNotes"
                [(ngModel)]="editForm.coachNotes"
                placeholder="Private notes about this player..."
                rows="3"
              ></textarea>
            </div>

            <div class="danger-zone">
              <h5>Danger Zone</h5>
              <app-button
                variant="text"
                iconLeft="pi-trash"
                (clicked)="removePlayer(player)"
                >Remove from Team</app-button
              >
              <span class="danger-note"
                >This will archive the player's membership</span
              >
            </div>
          </div>

          <ng-template pTemplate="footer">
            <app-button
              variant="secondary"
              (clicked)="showEditPlayerDialog = false"
              >Cancel</app-button
            >
            <app-button iconLeft="pi-check" (clicked)="savePlayerChanges()"
              >Save Changes</app-button
            >
          </ng-template>
        }
      </p-dialog>
    </app-main-layout>
  `,
  styleUrl: "./team-management.component.scss",
})
export class TeamManagementComponent implements OnInit {
  private readonly api = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);
  private readonly messageService = inject(MessageService);
  private readonly dialogService = inject(DialogService);

  // State
  readonly activeTab = signal<
    "roster" | "depth-chart" | "invitations" | "settings"
  >("roster");
  readonly teamMembers = signal<TeamMember[]>([]);
  readonly depthChart = signal<DepthChartEntry[]>([]);
  readonly invitations = signal<Invitation[]>([]);
  readonly teamSettings = signal<TeamSettings>({
    name: "",
    primaryColor: "#1E40AF",
    secondaryColor: "#FFFFFF",
    league: "",
    homeField: "",
    preferences: {
      requireWellnessCheckin: true,
      autoSendRsvpReminders: true,
      allowPlayersViewAnalytics: true,
      requireCoachApprovalPosts: false,
    },
  });
  readonly selectedPlayer = signal<TeamMember | null>(null);
  readonly isLoading = signal(true);
  readonly isSendingInvite = signal(false);

  // Filter state
  searchQuery = "";
  positionFilter: string | null = null;
  statusFilter: PlayerStatus | null = null;

  // Dialog state
  showInviteDialog = false;
  showEditPlayerDialog = false;
  inviteForm = { email: "", role: "player" as InvitationRole, message: "" };
  editForm = {
    jerseyNumber: "",
    position: "",
    secondaryPosition: "",
    depthChartRank: 1,
    status: "active" as PlayerStatus,
    coachNotes: "",
  };

  // Options
  readonly positionOptions = POSITIONS;
  readonly statusOptions = [
    { label: "Active", value: "active" },
    { label: "Minor Injury", value: "minor-injury" },
    { label: "Return to Play", value: "rtp" },
    { label: "Inactive", value: "inactive" },
  ];
  readonly depthOptions = [
    { label: "1st String", value: 1 },
    { label: "2nd String", value: 2 },
    { label: "3rd String", value: 3 },
  ];

  // Computed
  readonly filteredMembers = computed(() => {
    let result = this.teamMembers();

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
      );
    }

    if (this.positionFilter) {
      result = result.filter((m) => m.position === this.positionFilter);
    }

    if (this.statusFilter) {
      result = result.filter((m) => m.status === this.statusFilter);
    }

    return result;
  });

  readonly positionSummary = computed(() => {
    const members = this.teamMembers();
    const summary: { position: string; count: number }[] = [];

    POSITIONS.forEach((pos) => {
      const count = members.filter((m) => m.position === pos.value).length;
      summary.push({ position: pos.value, count });
    });

    return summary;
  });

  readonly offenseDepthChart = computed(() =>
    this.depthChart().filter((e) => ["QB", "WR", "C"].includes(e.position)),
  );

  readonly defenseDepthChart = computed(() =>
    this.depthChart().filter((e) => ["Rusher", "DB"].includes(e.position)),
  );

  readonly pendingInvitations = computed(() =>
    this.invitations().filter((i) => i.status === "pending"),
  );

  readonly acceptedInvitations = computed(() =>
    this.invitations().filter((i) => i.status === "accepted"),
  );

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      const response: ApiResponse<{
        members?: TeamMember[];
        depthChart?: DepthChartEntry[];
        invitations?: Invitation[];
        settings?: TeamSettings;
      }> = await firstValueFrom(
        this.api.get("/api/team-management"),
      );
      if (response?.success && response.data) {
        if (response.data.members) this.teamMembers.set(response.data.members);
        if (response.data.depthChart)
          this.depthChart.set(response.data.depthChart);
        if (response.data.invitations)
          this.invitations.set(response.data.invitations);
        if (response.data.settings)
          this.teamSettings.set(response.data.settings);
      }
    } catch (err) {
      this.logger.error("Failed to load team management data", err);
      this.teamMembers.set([]);
      this.depthChart.set([]);
      this.invitations.set([]);
      this.teamSettings.set({
        name: "",
        primaryColor: "#1E40AF",
        secondaryColor: "#FFFFFF",
        league: "",
        homeField: "",
        preferences: {
          requireWellnessCheckin: true,
          autoSendRsvpReminders: true,
          allowPlayersViewAnalytics: true,
          requireCoachApprovalPosts: false,
        },
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  // Dialog methods
  openInviteDialog(): void {
    this.inviteForm = { email: "", role: "player", message: "" };
    this.showInviteDialog = true;
  }

  sendInvitation(): void {
    if (!this.inviteForm.email || this.isSendingInvite()) return;

    this.isSendingInvite.set(true);

    const newInvitation: Invitation = {
      id: `inv-${Date.now()}`,
      email: this.inviteForm.email,
      role: this.inviteForm.role,
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      status: "pending",
    };

    this.api.post("/api/team/invite", this.inviteForm).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.invitations.update((inv) => [...inv, newInvitation]);
        this.messageService.add({
          severity: "success",
          summary: "Invitation Sent",
          detail: `Invitation sent to ${this.inviteForm.email}`,
        });
        this.showInviteDialog = false;
        this.isSendingInvite.set(false);
      },
      error: (err) => {
        this.logger.error("Failed to send invitation", err);
        this.messageService.add({
          severity: "error",
          summary: "Failed to Send",
          detail: "Could not send the invitation. Please try again.",
        });
        this.isSendingInvite.set(false);
      },
    });
  }

  resendInvitation(inv: Invitation): void {
    this.api
      .post("/api/team/invite/resend", { invitationId: inv.id })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.messageService.add({
            severity: "success",
            summary: "Invitation Resent",
            detail: `Invitation resent to ${inv.email}`,
          });
        },
        error: (err) => this.logger.error("Failed to resend invitation", err),
      });
  }

  cancelInvitation(inv: Invitation): void {
    this.invitations.update((invs) => invs.filter((i) => i.id !== inv.id));

    this.api.delete(`/api/team/invite/${inv.id}`).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.messageService.add({
          severity: "info",
          summary: "Invitation Cancelled",
        });
      },
      error: (err) => this.logger.error("Failed to cancel invitation", err),
    });
  }

  openPlayerMenu(event: Event, member: TeamMember): void {
    this.selectedPlayer.set(member);
    this.editForm = {
      jerseyNumber: member.jerseyNumber,
      position: member.position,
      secondaryPosition: member.secondaryPosition || "",
      depthChartRank: member.depthChartRank || 1,
      status: member.status,
      coachNotes: member.coachNotes || "",
    };
    this.showEditPlayerDialog = true;
  }

  savePlayerChanges(): void {
    const player = this.selectedPlayer();
    if (!player) return;

    this.teamMembers.update((members) =>
      members.map((m) =>
        m.id === player.id
          ? {
              ...m,
              jerseyNumber: this.editForm.jerseyNumber,
              position: this.editForm.position,
              secondaryPosition: this.editForm.secondaryPosition,
              depthChartRank: this.editForm.depthChartRank,
              status: this.editForm.status,
              coachNotes: this.editForm.coachNotes,
            }
          : m,
      ),
    );

    this.api.put(`/api/team/members/${player.id}`, this.editForm).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.messageService.add({
          severity: "success",
          summary: "Player Updated",
          detail: `${player.name}'s profile has been updated`,
        });
      },
      error: (err) => this.logger.error("Failed to update player", err),
    });

    this.showEditPlayerDialog = false;
  }

  async removePlayer(player: TeamMember): Promise<void> {
    const confirmed = await this.dialogService.confirm(
      `Remove ${player.name} from the team?`,
      "Remove Player",
    );
    if (!confirmed) return;

    this.teamMembers.update((members) =>
      members.filter((m) => m.id !== player.id),
    );

    this.api.delete(`/api/team/members/${player.id}`).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.messageService.add({
          severity: "info",
          summary: "Player Removed",
          detail: `${player.name} has been removed from the team`,
        });
      },
      error: (err) => this.logger.error("Failed to remove player", err),
    });

    this.showEditPlayerDialog = false;
  }

  editDepthChart(): void {
    this.messageService.add({
      severity: "info",
      summary: "Edit Depth Chart",
      detail: "Drag and drop functionality would be implemented here",
    });
  }

  saveSettings(): void {
    this.api.put("/api/team/settings", this.teamSettings()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.messageService.add({
          severity: "success",
          summary: "Settings Saved",
          detail: "Team settings have been updated",
        });
      },
      error: (err) => this.logger.error("Failed to save settings", err),
    });
  }

  // Helper methods
  /**
   * Get initials from name using centralized utility
   */
  getInitialsStr(name: string): string {
    return getInitials(name);
  }

  getStatusConfig(status: PlayerStatus): (typeof STATUS_CONFIG)[PlayerStatus] {
    return STATUS_CONFIG[status];
  }

  getAcwrClass(acwr: number): string {
    if (acwr <= 1.0) return "acwr-optimal";
    if (acwr <= 1.3) return "acwr-moderate";
    if (acwr <= 1.5) return "acwr-high";
    return "acwr-danger";
  }

  getRankLabel(rank: number): string {
    const labels: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };
    return labels[rank] || `${rank}th`;
  }

  getRoleLabel(role: InvitationRole): string {
    const labels: Record<InvitationRole, string> = {
      player: "Player",
      "assistant-coach": "Assistant Coach",
      "team-manager": "Team Manager",
    };
    return labels[role];
  }
}
