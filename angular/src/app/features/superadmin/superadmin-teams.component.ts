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
  template: `
    <app-main-layout>
      <div class="teams-content ui-page-shell ui-page-shell--wide ui-page-stack">
        <app-page-header
          title="Team Management"
          subtitle="View and manage all teams on the platform"
        >
          <div class="header-actions">
            <app-button
              iconLeft="pi-arrow-left"
              variant="text"
              routerLink="/superadmin"
              >Back to Dashboard</app-button
            >
          </div>
        </app-page-header>

        <!-- Filters -->
        <app-card-shell class="filters-card">
          <div class="filters-row">
            <app-search-input
              class="teams-search"
              [value]="searchQuery"
              (valueChange)="searchQuery = $event; filterTeams()"
              placeholder="Search teams..."
            ></app-search-input>
            <div class="filter-buttons">
              <app-button
                [variant]="statusFilter === 'all' ? 'primary' : 'outlined'"
                size="sm"
                (clicked)="setStatusFilter('all')"
                >All</app-button
              >
              <app-button
                [variant]="statusFilter === 'active' ? 'primary' : 'outlined'"
                size="sm"
                (clicked)="setStatusFilter('active')"
                >Active</app-button
              >
              <app-button
                [variant]="statusFilter === 'pending' ? 'primary' : 'outlined'"
                size="sm"
                (clicked)="setStatusFilter('pending')"
                >Pending</app-button
              >
              <app-button
                [variant]="
                  statusFilter === 'suspended' ? 'primary' : 'outlined'
                "
                size="sm"
                (clicked)="setStatusFilter('suspended')"
                >Suspended</app-button
              >
            </div>
          </div>
        </app-card-shell>

        <!-- Teams Table -->
        <app-card-shell class="teams-table-card" title="Teams">
          @if (isLoading()) {
            <app-loading message="Loading teams..." variant="inline" />
          } @else if (filteredTeams.length === 0) {
            <app-empty-state
              icon="pi-building"
              heading="No Teams Found"
              description="No teams match your current filters."
            />
          } @else {
            <p-table
              [value]="filteredTeams"
              [paginator]="true"
              [rows]="10"
              [virtualScroll]="filteredTeams.length > 50"
              [virtualScrollItemSize]="46"
              class="table-compact table-standard"
              [scrollable]="true"
            >
              <ng-template #header>
                <tr>
                  <th>Team Name</th>
                  <th>Country</th>
                  <th>Status</th>
                  <th>Members</th>
                  <th>Olympic Track</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </ng-template>
              <ng-template #body let-team>
                <tr>
                  <td>{{ team.name }}</td>
                  <td>{{ team.country_code }}</td>
                  <td>
                    <app-status-tag
                      [value]="team.status"
                      [severity]="getStatusSeverity(team.status)"
                      size="sm"
                    />
                  </td>
                  <td>{{ team.member_count }}</td>
                  <td>{{ formatOlympicTrack(team.olympic_track) }}</td>
                  <td>{{ team.created_at | date: "short" }}</td>
                  <td>
                    <div class="action-buttons">
                      @if (team.status === "pending") {
                        <app-icon-button
                          icon="pi-check"
                          variant="text"
                          ariaLabel="Approve"
                          (clicked)="approveTeam(team)"
                        />
                      }
                      @if (team.status === "active") {
                        <app-icon-button
                          icon="pi-ban"
                          variant="text"
                          ariaLabel="Suspend"
                          (clicked)="suspendTeam(team)"
                        />
                      }
                      @if (team.status === "suspended") {
                        <app-icon-button
                          icon="pi-replay"
                          variant="text"
                          ariaLabel="Reactivate"
                          (clicked)="reactivateTeam(team)"
                        />
                      }
                      <app-icon-button
                        icon="pi-eye"
                        variant="text"
                        ariaLabel="View Details"
                        (clicked)="viewTeam(team)"
                      />
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          }
        </app-card-shell>

        <app-dialog
          [(visible)]="showTeamDialog"
          [modal]="true"
          [draggable]="false"
          [blockScroll]="true"
          styleClass="superadmin-team-dialog"
          ariaLabel="Team details"
        >
          <app-dialog-header
            icon="building"
            [title]="selectedTeam?.name || 'Team Details'"
            subtitle="Review team status and onboarding context."
            (close)="closeTeamDialog()"
          />
          @if (selectedTeam; as team) {
            <div class="goal-details">
              <div class="goal-detail-card">
                <span class="goal-detail-label">Country</span>
                <span class="goal-detail-value">{{ team.country_code }}</span>
              </div>
              <div class="goal-detail-card">
                <span class="goal-detail-label">Status</span>
                <span class="goal-detail-value">{{ team.status }}</span>
              </div>
              <div class="goal-detail-card">
                <span class="goal-detail-label">Members</span>
                <span class="goal-detail-value">{{ team.member_count }}</span>
              </div>
              <div class="goal-detail-card">
                <span class="goal-detail-label">Olympic Track</span>
                <span class="goal-detail-value">{{ formatOlympicTrack(team.olympic_track) }}</span>
              </div>
            </div>
          }
          <app-dialog-footer
            dialogFooter
            cancelLabel="Close"
            primaryLabel="Done"
            primaryIcon="check"
            (cancel)="closeTeamDialog()"
            (primary)="closeTeamDialog()"
          />
        </app-dialog>
      </div>
      <p-confirmDialog></p-confirmDialog>
    </app-main-layout>
  `,
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
