import {
  ChangeDetectionStrategy,
  Component,
  inject,
  DestroyRef,
  OnInit,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";

import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import {
  accountStatusSeverityMap,
  getMappedStatusSeverity,
} from "../../shared/utils/status.utils";
import { TableModule } from "primeng/table";
import { SearchInputComponent } from "../../shared/components/search-input/search-input.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import {
  AppDialogComponent,
  DialogFooterComponent,
  DialogHeaderComponent,
} from "../../shared/components/ui-components";
import { ConfirmDialog } from "primeng/confirmdialog";
import { ConfirmDialogService } from "../../core/services/confirm-dialog.service";
import { SuperadminService } from "../../core/services/superadmin.service";
import { ToastService } from "../../core/services/toast.service";

interface Team {
  id: string;
  name: string;
  status: "pending" | "active" | "suspended";
  country_code: string;
  member_count: number;
  created_at: string;
  olympic_track?: string;
}

@Component({
  selector: "app-superadmin-teams",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    CardShellComponent,
    StatusTagComponent,
    TableModule,
    SearchInputComponent,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    IconButtonComponent,
    EmptyStateComponent,
    AppLoadingComponent,
    AppDialogComponent,
    ConfirmDialog,
    DialogHeaderComponent,
    DialogFooterComponent,
  ],
  templateUrl: "./superadmin-teams.component.html",
  styleUrl: "./superadmin-teams.component.scss",
})
export class SuperadminTeamsComponent implements OnInit {
  private superadminService = inject(SuperadminService);
  private confirmDialog = inject(ConfirmDialogService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  teams: Team[] = [];
  filteredTeams: Team[] = [];
  searchQuery = "";
  statusFilter: "all" | "active" | "pending" | "suspended" = "all";
  showTeamDialog = false;
  selectedTeam: Team | null = null;
  isLoading = this.superadminService.isLoading;

  ngOnInit(): void {
    this.loadTeams();
  }

  loadTeams(): void {
    // Load teams from service - for now use mock data
    this.teams = [
      {
        id: "1",
        name: "Slovenia National Team",
        status: "active",
        country_code: "SI",
        member_count: 24,
        created_at: "2024-01-15",
        olympic_track: "la_2028",
      },
      {
        id: "2",
        name: "Croatia Warriors",
        status: "pending",
        country_code: "HR",
        member_count: 18,
        created_at: "2024-06-20",
        olympic_track: "brisbane_2032",
      },
    ];
    this.filterTeams();
  }

  filterTeams(): void {
    this.filteredTeams = this.teams.filter((team) => {
      const matchesSearch = team.name
        .toLowerCase()
        .includes(this.searchQuery.toLowerCase());
      const matchesStatus =
        this.statusFilter === "all" || team.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }



  setStatusFilter(status: "all" | "active" | "pending" | "suspended"): void {
    this.statusFilter = status;
    this.filterTeams();
  }

  getStatusSeverity = (status: string) =>
    getMappedStatusSeverity(status, accountStatusSeverityMap, "secondary");

  formatOlympicTrack(track?: string): string {
    if (!track) return "-";
    const tracks: Record<string, string> = {
      la_2028: "LA 2028",
      brisbane_2032: "Brisbane 2032",
      both: "Both",
      domestic_only: "Domestic",
    };
    return tracks[track] || track;
  }

  private applyLocalTeamStatusUpdate(
    team: Team,
    status: Team["status"],
    successMessage?: string,
  ): void {
    team.status = status;
    this.filterTeams();
    if (this.selectedTeam?.id === team.id) {
      this.selectedTeam = { ...team };
    }
    if (successMessage) {
      this.toast.success(successMessage);
    }
  }

  closeTeamDialog(): void {
    this.showTeamDialog = false;
  }

  async approveTeam(team: Team): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: "Approve Team",
      message: `Grant "${team.name}" full platform access? This takes effect immediately.`,
      acceptLabel: "Approve",
      acceptSeverity: "success",
      icon: "pi pi-check-circle",
    });
    if (!confirmed) return;

    this.superadminService
      .approveTeam(team.id, "Approved")
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.applyLocalTeamStatusUpdate(team, "active", "Team approved successfully.");
      });
  }

  async suspendTeam(team: Team): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: "Suspend Team",
      message: `Suspend "${team.name}"? Their members will lose access until reactivated.`,
      acceptLabel: "Suspend",
      acceptSeverity: "danger",
      icon: "pi pi-ban",
    });
    if (!confirmed) return;

    this.applyLocalTeamStatusUpdate(team, "suspended", "Team suspended.");
  }

  async reactivateTeam(team: Team): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: "Reactivate Team",
      message: `Reactivate "${team.name}" and restore their platform access?`,
      acceptLabel: "Reactivate",
      acceptSeverity: "success",
      icon: "pi pi-refresh",
    });
    if (!confirmed) return;

    this.applyLocalTeamStatusUpdate(team, "active", "Team reactivated.");
  }

  viewTeam(team: Team): void {
    this.selectedTeam = team;
    this.showTeamDialog = true;
  }
}
