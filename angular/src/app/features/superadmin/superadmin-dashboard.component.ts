import { Component, inject, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { TagModule } from "primeng/tag";
import { TableModule } from "primeng/table";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import {
  SuperadminService,
  ApprovalRequest,
  SuperadminStats,
} from "../../core/services/superadmin.service";

@Component({
  selector: "app-superadmin-dashboard",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    CardModule,
    TagModule,
    TableModule,
    MainLayoutComponent,
    PageHeaderComponent,
  
    ButtonComponent,
    IconButtonComponent,
  ],
  template: `
    <app-main-layout>
      <div class="dashboard-content">
        <app-page-header
          title="Superadmin Dashboard"
          subtitle="Platform management and approval workflow"
        >
          <div class="header-actions">
            <a
              routerLink="/superadmin/settings"
              class="p-button p-button-outlined"
            >
              <i class="pi pi-cog"></i>
              Settings
            </a>
            <a routerLink="/dashboard" class="p-button p-button-text">
              Exit Admin
            </a>
          </div>
        </app-page-header>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <p-card styleClass="stat-card">
            <div class="stat-content">
              <div class="stat-icon pending">
                <i class="pi pi-clock"></i>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ stats().pendingTeams }}</span>
                <span class="stat-label">Pending Teams</span>
              </div>
            </div>
          </p-card>

          <p-card styleClass="stat-card">
            <div class="stat-content">
              <div class="stat-icon roles">
                <i class="pi pi-users"></i>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ stats().pendingRoles }}</span>
                <span class="stat-label">Pending Roles</span>
              </div>
            </div>
          </p-card>

          <p-card styleClass="stat-card">
            <div class="stat-content">
              <div class="stat-icon approved">
                <i class="pi pi-check-circle"></i>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ stats().approvedTeams }}</span>
                <span class="stat-label">Active Teams</span>
              </div>
            </div>
          </p-card>

          <p-card styleClass="stat-card">
            <div class="stat-content">
              <div class="stat-icon users">
                <i class="pi pi-user"></i>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ stats().totalUsers }}</span>
                <span class="stat-label">Total Athletes</span>
              </div>
            </div>
          </p-card>
        </div>

        <!-- Pending Approvals Section -->
        <p-card>
          <ng-template pTemplate="header">
            <div class="card-header">
              <h3>
                <i class="pi pi-inbox"></i>
                Pending Approvals
              </h3>
              <app-icon-button icon="pi-refresh" variant="text" (clicked)="refreshData()" ariaLabel="Refresh" />
            </div>
          </ng-template>

          @if (isLoading()) {
            <div class="loading-state">
              <i class="pi pi-spin pi-spinner"></i>
              <span>Loading approvals...</span>
            </div>
          } @else if (pendingApprovals().length === 0) {
            <div class="empty-state">
              <i class="pi pi-check-circle"></i>
              <h4>All Caught Up!</h4>
              <p>No pending approvals at this time.</p>
            </div>
          } @else {
            <div class="approvals-list">
              @for (approval of pendingApprovals(); track approval.id) {
                <div
                  class="approval-card"
                  [class.team]="approval.request_type === 'team_creation'"
                  [class.role]="approval.request_type === 'role_elevation'"
                >
                  <div class="approval-header">
                    <p-tag
                      [value]="
                        approval.request_type === 'team_creation'
                          ? 'Team Request'
                          : 'Role Request'
                      "
                      [severity]="
                        approval.request_type === 'team_creation'
                          ? 'warn'
                          : 'info'
                      "
                    ></p-tag>
                    <span class="approval-date">{{
                      approval.created_at | date: "short"
                    }}</span>
                  </div>

                  <div class="approval-body">
                    @if (approval.request_type === "team_creation") {
                      <h4>{{ approval.team_name || "Unnamed Team" }}</h4>
                      <div class="approval-meta">
                        @if (approval.country_code) {
                          <span class="meta-tag">{{
                            approval.country_code
                          }}</span>
                        }
                        @if (approval.olympic_track) {
                          <span class="meta-tag olympic">{{
                            formatOlympicTrack(approval.olympic_track)
                          }}</span>
                        }
                        @if (approval.team_type) {
                          <span class="meta-tag">{{ approval.team_type }}</span>
                        }
                      </div>
                    } @else {
                      <h4>
                        {{
                          approval.requester_name || approval.requester_email
                        }}
                      </h4>
                      <p class="role-request">
                        Requesting:
                        <strong>{{ approval.requested_role }}</strong>
                      </p>
                      @if (approval.team_name) {
                        <p class="team-ref">Team: {{ approval.team_name }}</p>
                      }
                    }

                    @if (approval.olympic_goals) {
                      <div class="olympic-goals">
                        <strong>Olympic Goals:</strong>
                        <p>{{ approval.olympic_goals }}</p>
                      </div>
                    }

                    @if (approval.federation_affiliation) {
                      <p class="federation">
                        Federation: {{ approval.federation_affiliation }}
                      </p>
                    }
                  </div>

                  <div class="approval-actions">
                    <app-button variant="success" iconLeft="pi-check" (clicked)="handleApprove(approval)">Approve</app-button>
                    <app-button variant="outlined" iconLeft="pi-times" (clicked)="openRejectModal(approval)">Reject</app-button>
                  </div>
                </div>
              }
            </div>
          }
        </p-card>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <h3>Quick Actions</h3>
          <div class="actions-grid">
            <a routerLink="/superadmin/teams" class="action-card">
              <i class="pi pi-building"></i>
              <span>Manage Teams</span>
            </a>
            <a routerLink="/superadmin/users" class="action-card">
              <i class="pi pi-users"></i>
              <span>Manage Users</span>
            </a>
            <a routerLink="/superadmin/settings" class="action-card">
              <i class="pi pi-cog"></i>
              <span>Settings</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Reject Modal -->
      @if (showRejectModal) {
        <div class="modal-overlay" (click)="closeRejectModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Reject Request</h3>
              <button class="modal-close" (click)="closeRejectModal()">
                <i class="pi pi-times"></i>
              </button>
            </div>
            <div class="modal-body">
              <p>Please provide a reason for rejection:</p>
              <textarea
                [(ngModel)]="rejectReason"
                placeholder="Enter rejection reason..."
                rows="4"
              ></textarea>
            </div>
            <div class="modal-footer">
              <app-button variant="text" (clicked)="closeRejectModal()">Cancel</app-button>
              <app-button variant="danger" [disabled]="!rejectReason.trim()" (clicked)="confirmReject()">Confirm Rejection</app-button>
            </div>
          </div>
        </div>
      }
    </app-main-layout>
  `,
  styleUrl: './superadmin-dashboard.component.scss',
})
export class SuperadminDashboardComponent implements OnInit {
  private superadminService = inject(SuperadminService);

  // State
  pendingApprovals = this.superadminService.pendingApprovals;
  stats = this.superadminService.stats;
  isLoading = this.superadminService.isLoading;

  // Modal state
  showRejectModal = false;
  selectedApproval = signal<ApprovalRequest | null>(null);
  rejectReason = "";

  ngOnInit(): void {
    this.refreshData();
  }

  refreshData(): void {
    this.superadminService.loadPendingApprovals();
    this.superadminService.loadStats();
  }

  formatOlympicTrack(track: string): string {
    const tracks: Record<string, string> = {
      la_2028: "LA 2028",
      brisbane_2032: "Brisbane 2032",
      both: "LA 2028 & Brisbane 2032",
      domestic_only: "Domestic",
    };
    return tracks[track] || track;
  }

  handleApprove(approval: ApprovalRequest): void {
    if (approval.request_type === "team_creation" && approval.team_id) {
      this.superadminService
        .approveTeam(approval.team_id, "Approved via dashboard")
        .subscribe();
    } else if (
      approval.request_type === "role_elevation" &&
      approval.team_id &&
      approval.user_id
    ) {
      this.superadminService
        .approveAdminRole(
          approval.team_id,
          approval.user_id,
          "Approved via dashboard",
        )
        .subscribe();
    }
  }

  openRejectModal(approval: ApprovalRequest): void {
    this.selectedApproval.set(approval);
    this.rejectReason = "";
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedApproval.set(null);
    this.rejectReason = "";
  }

  confirmReject(): void {
    const approval = this.selectedApproval();
    if (!approval || !this.rejectReason.trim()) return;

    if (approval.request_type === "team_creation" && approval.team_id) {
      this.superadminService
        .rejectTeam(approval.team_id, this.rejectReason)
        .subscribe(() => {
          this.closeRejectModal();
        });
    }
  }
}
