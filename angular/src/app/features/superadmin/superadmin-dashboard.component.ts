import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { MainLayoutComponent } from '../../shared/components/layout/main-layout.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SuperadminService, ApprovalRequest, SuperadminStats } from '../../core/services/superadmin.service';

@Component({
  selector: 'app-superadmin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    TableModule,
    MainLayoutComponent,
    PageHeaderComponent
  ],
  template: `
    <app-main-layout>
      <div class="dashboard-content">
        <app-page-header
          title="Superadmin Dashboard"
          subtitle="Platform management and approval workflow"
        >
          <div class="header-actions">
            <a routerLink="/superadmin/settings" class="p-button p-button-outlined">
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
              <p-button
                icon="pi pi-refresh"
                [text]="true"
                [rounded]="true"
                (onClick)="refreshData()"
                ariaLabel="Refresh"
              ></p-button>
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
                <div class="approval-card" [class.team]="approval.request_type === 'team_creation'" [class.role]="approval.request_type === 'role_elevation'">
                  <div class="approval-header">
                    <p-tag
                      [value]="approval.request_type === 'team_creation' ? 'Team Request' : 'Role Request'"
                      [severity]="approval.request_type === 'team_creation' ? 'warn' : 'info'"
                    ></p-tag>
                    <span class="approval-date">{{ approval.created_at | date:'short' }}</span>
                  </div>

                  <div class="approval-body">
                    @if (approval.request_type === 'team_creation') {
                      <h4>{{ approval.team_name || 'Unnamed Team' }}</h4>
                      <div class="approval-meta">
                        @if (approval.country_code) {
                          <span class="meta-tag">{{ approval.country_code }}</span>
                        }
                        @if (approval.olympic_track) {
                          <span class="meta-tag olympic">{{ formatOlympicTrack(approval.olympic_track) }}</span>
                        }
                        @if (approval.team_type) {
                          <span class="meta-tag">{{ approval.team_type }}</span>
                        }
                      </div>
                    } @else {
                      <h4>{{ approval.requester_name || approval.requester_email }}</h4>
                      <p class="role-request">Requesting: <strong>{{ approval.requested_role }}</strong></p>
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
                      <p class="federation">Federation: {{ approval.federation_affiliation }}</p>
                    }
                  </div>

                  <div class="approval-actions">
                    <p-button
                      label="Approve"
                      icon="pi pi-check"
                      severity="success"
                      (onClick)="handleApprove(approval)"
                    ></p-button>
                    <p-button
                      label="Reject"
                      icon="pi pi-times"
                      severity="danger"
                      [outlined]="true"
                      (onClick)="openRejectModal(approval)"
                    ></p-button>
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
              <p-button
                label="Cancel"
                [text]="true"
                (onClick)="closeRejectModal()"
              ></p-button>
              <p-button
                label="Confirm Rejection"
                severity="danger"
                (onClick)="confirmReject()"
                [disabled]="!rejectReason.trim()"
              ></p-button>
            </div>
          </div>
        </div>
      }
    </app-main-layout>
  `,
  styles: [`
    .dashboard-content {
      padding: var(--space-6);
    }

    .header-actions {
      display: flex;
      gap: var(--space-3);
      align-items: center;
    }

    .header-actions a {
      text-decoration: none;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    :host ::ng-deep .stat-card {
      .p-card-body {
        padding: var(--space-4);
      }
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .stat-icon.pending {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }

    .stat-icon.roles {
      background: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
    }

    .stat-icon.approved {
      background: var(--ds-primary-green-subtle);
      color: var(--ds-primary-green);
    }

    .stat-icon.users {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: var(--text-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      line-height: 1;
    }

    .stat-label {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      margin-top: var(--space-1);
    }

    /* Card Header */
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-4);
      border-bottom: 1px solid var(--color-border-primary);
    }

    .card-header h3 {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin: 0;
      font-size: var(--text-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }

    .card-header h3 i {
      color: var(--ds-primary-green);
    }

    /* Loading & Empty States */
    .loading-state,
    .empty-state {
      text-align: center;
      padding: var(--space-8);
      color: var(--color-text-secondary);
    }

    .loading-state i,
    .empty-state i {
      font-size: 2.5rem;
      margin-bottom: var(--space-3);
    }

    .empty-state i {
      color: var(--ds-primary-green);
    }

    .empty-state h4 {
      margin: 0 0 var(--space-2);
      color: var(--color-text-primary);
    }

    .empty-state p {
      margin: 0;
    }

    /* Approvals List */
    .approvals-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      padding: var(--space-4);
    }

    .approval-card {
      background: var(--surface-secondary);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border-primary);
      overflow: hidden;
      transition: border-color 0.2s ease;
    }

    .approval-card:hover {
      border-color: var(--ds-primary-green);
    }

    .approval-card.team {
      border-left: 4px solid #f59e0b;
    }

    .approval-card.role {
      border-left: 4px solid #8b5cf6;
    }

    .approval-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3) var(--space-4);
      background: var(--surface-tertiary);
      border-bottom: 1px solid var(--color-border-primary);
    }

    .approval-date {
      font-size: var(--text-sm);
      color: var(--color-text-muted);
    }

    .approval-body {
      padding: var(--space-4);
    }

    .approval-body h4 {
      margin: 0 0 var(--space-2);
      font-size: var(--text-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }

    .approval-meta {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      margin-bottom: var(--space-3);
    }

    .meta-tag {
      display: inline-block;
      padding: var(--space-1) var(--space-2);
      background: var(--surface-tertiary);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      color: var(--color-text-secondary);
    }

    .meta-tag.olympic {
      background: var(--ds-primary-green-subtle);
      color: var(--ds-primary-green);
      font-weight: var(--font-weight-medium);
    }

    .role-request,
    .team-ref,
    .federation {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      margin: var(--space-1) 0;
    }

    .role-request strong {
      color: #8b5cf6;
    }

    .olympic-goals {
      background: var(--ds-primary-green-ultra-subtle);
      padding: var(--space-3);
      border-radius: var(--radius-md);
      margin-top: var(--space-3);
    }

    .olympic-goals strong {
      color: var(--ds-primary-green);
      font-size: var(--text-sm);
    }

    .olympic-goals p {
      margin: var(--space-2) 0 0;
      color: var(--color-text-primary);
      font-size: var(--text-sm);
    }

    .approval-actions {
      display: flex;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      background: var(--surface-tertiary);
      border-top: 1px solid var(--color-border-primary);
    }

    /* Quick Actions */
    .quick-actions {
      margin-top: var(--space-6);
    }

    .quick-actions h3 {
      margin: 0 0 var(--space-4);
      font-size: var(--text-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: var(--space-4);
    }

    .action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-6);
      background: white;
      border: 1px solid var(--color-border-primary);
      border-radius: var(--radius-lg);
      text-decoration: none;
      color: var(--color-text-secondary);
      transition: all 0.2s ease;
    }

    .action-card:hover {
      border-color: var(--ds-primary-green);
      color: var(--ds-primary-green);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(8, 153, 73, 0.1);
    }

    .action-card i {
      font-size: 2rem;
    }

    .action-card span {
      font-weight: var(--font-weight-semibold);
    }

    /* Reject Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: var(--radius-lg);
      width: 90%;
      max-width: 450px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-4);
      border-bottom: 1px solid var(--color-border-primary);
    }

    .modal-header h3 {
      margin: 0;
      font-size: var(--text-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }

    .modal-close {
      background: none;
      border: none;
      cursor: pointer;
      padding: var(--space-2);
      color: var(--color-text-muted);
      transition: color 0.2s;
    }

    .modal-close:hover {
      color: var(--color-text-primary);
    }

    .modal-body {
      padding: var(--space-4);
    }

    .modal-body p {
      margin: 0 0 var(--space-3);
      color: var(--color-text-secondary);
    }

    .modal-body textarea {
      width: 100%;
      padding: var(--space-3);
      border: 1px solid var(--color-border-primary);
      border-radius: var(--radius-md);
      font-family: inherit;
      font-size: var(--text-sm);
      resize: vertical;
    }

    .modal-body textarea:focus {
      outline: none;
      border-color: var(--ds-primary-green);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-2);
      padding: var(--space-4);
      border-top: 1px solid var(--color-border-primary);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .dashboard-content {
        padding: var(--space-4);
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .approval-actions {
        flex-direction: column;
      }

      .header-actions {
        flex-direction: column;
        width: 100%;
      }
    }
  `]
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
  rejectReason = '';

  ngOnInit(): void {
    this.refreshData();
  }

  refreshData(): void {
    this.superadminService.loadPendingApprovals();
    this.superadminService.loadStats();
  }

  formatOlympicTrack(track: string): string {
    const tracks: Record<string, string> = {
      'la_2028': 'LA 2028',
      'brisbane_2032': 'Brisbane 2032',
      'both': 'LA 2028 & Brisbane 2032',
      'domestic_only': 'Domestic'
    };
    return tracks[track] || track;
  }

  handleApprove(approval: ApprovalRequest): void {
    if (approval.request_type === 'team_creation' && approval.team_id) {
      this.superadminService.approveTeam(approval.team_id, 'Approved via dashboard').subscribe();
    } else if (approval.request_type === 'role_elevation' && approval.team_id && approval.user_id) {
      this.superadminService.approveAdminRole(approval.team_id, approval.user_id, 'Approved via dashboard').subscribe();
    }
  }

  openRejectModal(approval: ApprovalRequest): void {
    this.selectedApproval.set(approval);
    this.rejectReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedApproval.set(null);
    this.rejectReason = '';
  }

  confirmReject(): void {
    const approval = this.selectedApproval();
    if (!approval || !this.rejectReason.trim()) return;

    if (approval.request_type === 'team_creation' && approval.team_id) {
      this.superadminService.rejectTeam(approval.team_id, this.rejectReason).subscribe(() => {
        this.closeRejectModal();
      });
    }
  }
}
