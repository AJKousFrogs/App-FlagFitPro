import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  DestroyRef,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { Card } from "primeng/card";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { CardHeaderComponent } from "../../shared/components/card-header/card-header.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";

import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { TableModule } from "primeng/table";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { AppDialogComponent } from "../../shared/components/dialog/dialog.component";
import { DialogFooterComponent } from "../../shared/components/dialog-footer/dialog-footer.component";
import { DialogHeaderComponent } from "../../shared/components/dialog-header/dialog-header.component";
import {
  SuperadminService,
  ApprovalRequest,
} from "../../core/services/superadmin.service";

@Component({
  selector: "app-superadmin-dashboard",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    Card,
    StatusTagComponent,
    TableModule,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    CardHeaderComponent,
    IconButtonComponent,
    AppLoadingComponent,
    EmptyStateComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
  ],
  template: `
    <app-main-layout>
      <div class="dashboard-content">
        <app-page-header
          title="Superadmin Dashboard"
          subtitle="Platform management and approval workflow"
        >
          <div class="header-actions">
            <app-button
              iconLeft="pi-cog"
              variant="outlined"
              routerLink="/superadmin/settings"
              >Settings</app-button
            >
            <app-button variant="text" routerLink="/dashboard"
              >Exit Admin</app-button
            >
          </div>
        </app-page-header>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <p-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon pending">
                <i class="pi pi-clock"></i>
              </div>
              <div class="stat-info stat-block__content">
                <span class="stat-block__value">{{
                  stats().pendingTeams
                }}</span>
                <span class="stat-block__label">Pending Teams</span>
              </div>
            </div>
          </p-card>

          <p-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon roles">
                <i class="pi pi-users"></i>
              </div>
              <div class="stat-info stat-block__content">
                <span class="stat-block__value">{{
                  stats().pendingRoles
                }}</span>
                <span class="stat-block__label">Pending Roles</span>
              </div>
            </div>
          </p-card>

          <p-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon approved">
                <i class="pi pi-check-circle"></i>
              </div>
              <div class="stat-info stat-block__content">
                <span class="stat-block__value">{{
                  stats().approvedTeams
                }}</span>
                <span class="stat-block__label">Active Teams</span>
              </div>
            </div>
          </p-card>

          <p-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon users">
                <i class="pi pi-user"></i>
              </div>
              <div class="stat-info stat-block__content">
                <span class="stat-block__value">{{ stats().totalUsers }}</span>
                <span class="stat-block__label">Total Athletes</span>
              </div>
            </div>
          </p-card>
        </div>

        <!-- Pending Approvals Section -->
        <p-card>
          <ng-template #header>
            <app-card-header title="Pending Approvals" icon="pi-inbox">
              <app-icon-button
                header-actions
                icon="pi-refresh"
                variant="text"
                (clicked)="refreshData()"
                ariaLabel="Refresh"
              />
            </app-card-header>
          </ng-template>

          @if (isLoading()) {
            <app-loading message="Loading approvals..." variant="inline" />
          } @else if (pendingApprovals().length === 0) {
            <app-empty-state
              icon="pi-check-circle"
              heading="All Caught Up!"
              description="No pending approvals at this time."
            />
          } @else {
            <div class="approvals-list">
              @for (approval of pendingApprovals(); track approval.id) {
                <div
                  class="approval-card"
                  [class.team]="approval.request_type === 'team_creation'"
                  [class.role]="approval.request_type === 'role_elevation'"
                >
                  <div class="approval-header">
                    <app-status-tag
                      [value]="
                        approval.request_type === 'team_creation'
                          ? 'Team Request'
                          : 'Role Request'
                      "
                      [severity]="
                        approval.request_type === 'team_creation'
                          ? 'warning'
                          : 'info'
                      "
                      size="sm"
                    />
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
                    <app-button
                      variant="success"
                      iconLeft="pi-check"
                      (clicked)="handleApprove(approval)"
                      >Approve</app-button
                    >
                    <app-button
                      variant="outlined"
                      iconLeft="pi-times"
                      (clicked)="openRejectModal(approval)"
                      >Reject</app-button
                    >
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

      <app-dialog
        [visible]="showRejectModal"
        (visibleChange)="showRejectModal = $event"
        (hide)="closeRejectModal()"
        [modal]="true"
        [closable]="false"
        [draggable]="false"
        [resizable]="false"
        [dismissableMask]="true"
        [blockScroll]="true"
        [styleClass]="'dialog-md superadmin-reject-dialog'"
      >
        <app-dialog-header
          icon="times-circle"
          title="Reject Request"
          subtitle="Provide a clear reason so the requester understands what needs to change."
          [danger]="true"
          (close)="closeRejectModal()"
        />

        <div class="modal-body">
          <p>Please provide a reason for rejection:</p>
          <textarea
            [value]="rejectReason"
            (input)="onRejectReasonInput($event)"
            placeholder="Enter rejection reason..."
            rows="4"
          ></textarea>
        </div>

        <app-dialog-footer
          cancelLabel="Cancel"
          primaryLabel="Confirm Rejection"
          primaryVariant="danger"
          [disabled]="!rejectReason.trim()"
          (cancel)="closeRejectModal()"
          (primary)="confirmReject()"
        />
      </app-dialog>
    </app-main-layout>
  `,
  styleUrl: "./superadmin-dashboard.component.scss",
})
export class SuperadminDashboardComponent implements OnInit {
  private superadminService = inject(SuperadminService);
  private destroyRef = inject(DestroyRef);

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
        .pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
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
        .pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
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

  onRejectReasonInput(event: Event): void {
    this.rejectReason = (event.target as HTMLTextAreaElement | null)?.value ?? "";
  }

  confirmReject(): void {
    const approval = this.selectedApproval();
    if (!approval || !this.rejectReason.trim()) return;

    if (approval.request_type === "team_creation" && approval.team_id) {
      this.superadminService
        .rejectTeam(approval.team_id, this.rejectReason)
        .pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
          this.closeRejectModal();
        });
    }
  }
}
