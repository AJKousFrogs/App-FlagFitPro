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

import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import {
  accountStatusSeverityMap,
  getMappedStatusSeverity,
} from "../../shared/utils/status.utils";
import { TableModule } from "primeng/table";
import { InputText } from "primeng/inputtext";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { SuperadminService } from "../../core/services/superadmin.service";
import { ToastService } from "../../core/services/toast.service";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: "player" | "coach" | "admin" | "superadmin";
  team_name?: string;
  status: "active" | "suspended" | "pending";
  created_at: string;
  last_login?: string;
}

@Component({
  selector: "app-superadmin-users",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    Card,
    StatusTagComponent,
    TableModule,
    InputText,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    IconButtonComponent,
    EmptyStateComponent,
    AppLoadingComponent,
  ],
  template: `
    <app-main-layout>
      <div class="users-content">
        <app-page-header
          title="User Management"
          subtitle="View and manage all users on the platform"
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
        <p-card class="filters-card">
          <div class="filters-row">
            <span class="p-input-icon-left">
              <i class="pi pi-search"></i>
              <input
                type="text"
                pInputText
                [(ngModel)]="searchQuery"
                placeholder="Search users..."
                (input)="filterUsers()"
              />
            </span>
            <div class="filter-buttons">
              <app-button
                [variant]="roleFilter === 'all' ? 'primary' : 'outlined'"
                size="sm"
                (clicked)="setRoleFilter('all')"
                >All</app-button
              >
              <app-button
                [variant]="roleFilter === 'player' ? 'primary' : 'outlined'"
                size="sm"
                (clicked)="setRoleFilter('player')"
                >Players</app-button
              >
              <app-button
                [variant]="roleFilter === 'coach' ? 'primary' : 'outlined'"
                size="sm"
                (clicked)="setRoleFilter('coach')"
                >Coaches</app-button
              >
              <app-button
                [variant]="roleFilter === 'admin' ? 'primary' : 'outlined'"
                size="sm"
                (clicked)="setRoleFilter('admin')"
                >Admins</app-button
              >
            </div>
          </div>
        </p-card>

        <!-- Users Table -->
        <p-card>
          @if (isLoading()) {
            <app-loading message="Loading users..." variant="inline" />
          } @else if (filteredUsers.length === 0) {
            <app-empty-state
              icon="pi-users"
              heading="No Users Found"
              description="No users match your current filters."
            />
          } @else {
            <p-table
              [value]="filteredUsers"
              [paginator]="true"
              [rows]="10"
              [virtualScroll]="filteredUsers.length > 50"
              [virtualScrollItemSize]="46"
              class="p-datatable-sm table-standard"
            >
              <ng-template #header>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Team</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </ng-template>
              <ng-template #body let-user>
                <tr>
                  <td>{{ user.full_name }}</td>
                  <td>{{ user.email }}</td>
                  <td>
                    <app-status-tag
                      [value]="user.role"
                      [severity]="getRoleSeverity(user.role)"
                      size="sm"
                    />
                  </td>
                  <td>{{ user.team_name || "-" }}</td>
                  <td>
                    <app-status-tag
                      [value]="user.status"
                      [severity]="getStatusSeverity(user.status)"
                      size="sm"
                    />
                  </td>
                  <td>{{ user.last_login | date: "short" }}</td>
                  <td>
                    <div class="action-buttons">
                      @if (user.status === "active") {
                        <app-icon-button
                          icon="pi-ban"
                          variant="text"
                          ariaLabel="Suspend"
                          (clicked)="suspendUser(user)"
                        />
                      }
                      @if (user.status === "suspended") {
                        <app-icon-button
                          icon="pi-replay"
                          variant="text"
                          ariaLabel="Reactivate"
                          (clicked)="reactivateUser(user)"
                        />
                      }
                      <app-icon-button
                        icon="pi-pencil"
                        variant="text"
                        ariaLabel="Edit"
                        (clicked)="editUser(user)"
                      />
                      <app-icon-button
                        icon="pi-eye"
                        variant="text"
                        ariaLabel="View Profile"
                        (clicked)="viewUser(user)"
                      />
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          }
        </p-card>

        <!-- Stats Summary -->
        <div class="stats-row">
          <p-card class="stat-card">
            <div class="stat-content stat-block__content">
              <span class="stat-block__value">{{ totalUsers }}</span>
              <span class="stat-block__label">Total Users</span>
            </div>
          </p-card>
          <p-card class="stat-card">
            <div class="stat-content stat-block__content">
              <span class="stat-block__value">{{ playerCount }}</span>
              <span class="stat-block__label">Players</span>
            </div>
          </p-card>
          <p-card class="stat-card">
            <div class="stat-content stat-block__content">
              <span class="stat-block__value">{{ coachCount }}</span>
              <span class="stat-block__label">Coaches</span>
            </div>
          </p-card>
          <p-card class="stat-card">
            <div class="stat-content stat-block__content">
              <span class="stat-block__value">{{ adminCount }}</span>
              <span class="stat-block__label">Admins</span>
            </div>
          </p-card>
        </div>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .users-content {
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

      .stats-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(var(--size-150), 1fr));
        gap: var(--spacing-md);
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .stat-block__value {
        font-size: var(--ds-font-size-2xl);
        font-weight: var(--ds-font-weight-semibold);
        color: var(--color-brand-primary);
      }

      .stat-block__label {
        font-size: var(--ds-font-size-sm);
        color: var(--text-secondary);
      }

    `,
  ],
})
export class SuperadminUsersComponent implements OnInit {
  private superadminService = inject(SuperadminService);
  private toast = inject(ToastService);

  users: User[] = [];
  filteredUsers: User[] = [];
  searchQuery = "";
  roleFilter: "all" | "player" | "coach" | "admin" | "superadmin" = "all";
  isLoading = this.superadminService.isLoading;

  get totalUsers(): number {
    return this.users.length;
  }

  get playerCount(): number {
    return this.users.filter((u) => u.role === "player").length;
  }

  get coachCount(): number {
    return this.users.filter((u) => u.role === "coach").length;
  }

  get adminCount(): number {
    return this.users.filter((u) => u.role === "admin").length;
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    // Load users from service - for now use mock data
    this.users = [
      {
        id: "1",
        email: "coach@example.com",
        full_name: "John Coach",
        role: "coach",
        team_name: "Slovenia National Team",
        status: "active",
        created_at: "2024-01-15",
        last_login: "2024-12-20",
      },
      {
        id: "2",
        email: "player@example.com",
        full_name: "Jane Player",
        role: "player",
        team_name: "Slovenia National Team",
        status: "active",
        created_at: "2024-03-10",
        last_login: "2024-12-19",
      },
      {
        id: "3",
        email: "admin@example.com",
        full_name: "Bob Admin",
        role: "admin",
        team_name: "Croatia Warriors",
        status: "active",
        created_at: "2024-02-20",
        last_login: "2024-12-18",
      },
    ];
    this.filterUsers();
  }

  filterUsers(): void {
    this.filteredUsers = this.users.filter((user) => {
      const matchesSearch =
        user.full_name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesRole =
        this.roleFilter === "all" || user.role === this.roleFilter;
      return matchesSearch && matchesRole;
    });
  }

  setRoleFilter(
    role: "all" | "player" | "coach" | "admin" | "superadmin",
  ): void {
    this.roleFilter = role;
    this.filterUsers();
  }

  getRoleSeverity(
    role: string,
  ): "success" | "warning" | "danger" | "info" | "secondary" {
    switch (role) {
      case "superadmin":
        return "danger";
      case "admin":
        return "warning";
      case "coach":
        return "info";
      case "player":
        return "success";
      default:
        return "secondary";
    }
  }

  getStatusSeverity = (status: string) =>
    getMappedStatusSeverity(status, accountStatusSeverityMap, "secondary");

  suspendUser(user: User): void {
    user.status = "suspended";
    this.filterUsers();
  }

  reactivateUser(user: User): void {
    user.status = "active";
    this.filterUsers();
  }

  editUser(_user: User): void {
    this.toast.info("User edit functionality coming soon.", "User edit");
  }

  viewUser(_user: User): void {
    this.toast.info("User view functionality coming soon.", "User details");
  }
}
