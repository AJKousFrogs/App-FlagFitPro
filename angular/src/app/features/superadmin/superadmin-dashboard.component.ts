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
import { ButtonComponent } from "../../shared/components/button/button.component";
import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";

import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { TableModule } from "primeng/table";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
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
    StatusTagComponent,
    TableModule,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    CardShellComponent,
    IconButtonComponent,
    AppLoadingComponent,
    EmptyStateComponent,
    PageErrorStateComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
  ],
  templateUrl: "./superadmin-dashboard.component.html",
  styleUrl: "./superadmin-dashboard.component.scss",
})
export class SuperadminDashboardComponent implements OnInit {
  private superadminService = inject(SuperadminService);
  private destroyRef = inject(DestroyRef);

  // State
  pendingApprovals = this.superadminService.pendingApprovals;
  stats = this.superadminService.stats;
  isLoading = this.superadminService.isLoading;
  loadError = this.superadminService.loadError;

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
