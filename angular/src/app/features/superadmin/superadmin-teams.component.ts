import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { Card } from "primeng/card";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { Tag } from "primeng/tag";
import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { TableModule } from "primeng/table";
import { InputText } from "primeng/inputtext";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { SuperadminService } from "../../core/services/superadmin.service";

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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    Card,
    Tag,
    StatusTagComponent,
    TableModule,
    InputText,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    IconButtonComponent,
  ],
  template: `
    <app-main-layout>
      <div class="teams-content">
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
        <p-card styleClass="filters-card">
          <div class="filters-row">
            <span class="p-input-icon-left">
              <i class="pi pi-search"></i>
              <input
                type="text"
                pInputText
                [(ngModel)]="searchQuery"
                placeholder="Search teams..."
                (input)="filterTeams()"
              />
            </span>
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
        </p-card>

        <!-- Teams Table -->
        <p-card>
          @if (isLoading()) {
            <div class="loading-state">
              <i class="pi pi-spin pi-spinner"></i>
              <span>Loading teams...</span>
            </div>
          } @else if (filteredTeams.length === 0) {
            <div class="empty-state">
              <i class="pi pi-building"></i>
              <h4>No Teams Found</h4>
              <p>No teams match your current filters.</p>
            </div>
          } @else {
            <p-table
              [value]="filteredTeams"
              [paginator]="true"
              [rows]="10"
              styleClass="p-datatable-sm"
            >
              <ng-template pTemplate="header">
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
              <ng-template pTemplate="body" let-team>
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
        </p-card>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .teams-content {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
      }

      .filters-row {
        display: flex;
        gap: var(--spacing-md);
        align-items: center;
        flex-wrap: wrap;
      }

      .filter-buttons {
        display: flex;
        gap: var(--spacing-xs);
      }

      .action-buttons {
        display: flex;
        gap: var(--spacing-xs);
      }

      .loading-state,
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--spacing-xl);
        text-align: center;
        color: var(--text-secondary);
      }

      .empty-state i,
      .loading-state i {
        font-size: 2.5rem;
        margin-bottom: var(--spacing-md);
        opacity: 0.5;
      }
    `,
  ],
})
export class SuperadminTeamsComponent implements OnInit {
  private superadminService = inject(SuperadminService);

  teams: Team[] = [];
  filteredTeams: Team[] = [];
  searchQuery = "";
  statusFilter: "all" | "active" | "pending" | "suspended" = "all";
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

  getStatusSeverity(
    status: string,
  ): "success" | "warning" | "danger" | "info" | "secondary" {
    switch (status) {
      case "active":
        return "success";
      case "pending":
        return "warning";
      case "suspended":
        return "danger";
      default:
        return "secondary";
    }
  }

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

  approveTeam(team: Team): void {
    this.superadminService.approveTeam(team.id, "Approved").subscribe(() => {
      team.status = "active";
      this.filterTeams();
    });
  }

  suspendTeam(team: Team): void {
    team.status = "suspended";
    this.filterTeams();
  }

  reactivateTeam(team: Team): void {
    team.status = "active";
    this.filterTeams();
  }

  viewTeam(_team: Team): void {
    // TODO: Implement team view functionality
  }
}
