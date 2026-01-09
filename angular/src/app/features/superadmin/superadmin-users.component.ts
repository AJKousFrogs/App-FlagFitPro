import { ChangeDetectionStrategy, Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { TagModule } from "primeng/tag";
import { TableModule } from "primeng/table";
import { InputTextModule } from "primeng/inputtext";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { SuperadminService } from "../../core/services/superadmin.service";

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
    CardModule,
    TagModule,
    TableModule,
    InputTextModule,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    IconButtonComponent,
  ],
  template: `
    <app-main-layout>
      <div class="users-content">
        <app-page-header
          title="User Management"
          subtitle="View and manage all users on the platform"
        >
          <div class="header-actions">
            <a routerLink="/superadmin" class="p-button p-button-text">
              <i class="pi pi-arrow-left"></i>
              Back to Dashboard
            </a>
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
            <div class="loading-state">
              <i class="pi pi-spin pi-spinner"></i>
              <span>Loading users...</span>
            </div>
          } @else if (filteredUsers.length === 0) {
            <div class="empty-state">
              <i class="pi pi-users"></i>
              <h4>No Users Found</h4>
              <p>No users match your current filters.</p>
            </div>
          } @else {
            <p-table
              [value]="filteredUsers"
              [paginator]="true"
              [rows]="10"
              styleClass="p-datatable-sm"
            >
              <ng-template pTemplate="header">
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
              <ng-template pTemplate="body" let-user>
                <tr>
                  <td>{{ user.full_name }}</td>
                  <td>{{ user.email }}</td>
                  <td>
                    <p-tag
                      [value]="user.role"
                      [severity]="getRoleSeverity(user.role)"
                    ></p-tag>
                  </td>
                  <td>{{ user.team_name || "-" }}</td>
                  <td>
                    <p-tag
                      [value]="user.status"
                      [severity]="getStatusSeverity(user.status)"
                    ></p-tag>
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
          <p-card styleClass="stat-card">
            <div class="stat-content">
              <span class="stat-value">{{ totalUsers }}</span>
              <span class="stat-label">Total Users</span>
            </div>
          </p-card>
          <p-card styleClass="stat-card">
            <div class="stat-content">
              <span class="stat-value">{{ playerCount }}</span>
              <span class="stat-label">Players</span>
            </div>
          </p-card>
          <p-card styleClass="stat-card">
            <div class="stat-content">
              <span class="stat-value">{{ coachCount }}</span>
              <span class="stat-label">Coaches</span>
            </div>
          </p-card>
          <p-card styleClass="stat-card">
            <div class="stat-content">
              <span class="stat-value">{{ adminCount }}</span>
              <span class="stat-label">Admins</span>
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
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: var(--spacing-md);
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .stat-value {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--primary-color);
      }

      .stat-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
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
export class SuperadminUsersComponent implements OnInit {
  private superadminService = inject(SuperadminService);

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
  ): "success" | "warn" | "danger" | "info" | "secondary" {
    switch (role) {
      case "superadmin":
        return "danger";
      case "admin":
        return "warn";
      case "coach":
        return "info";
      case "player":
        return "success";
      default:
        return "secondary";
    }
  }

  getStatusSeverity(
    status: string,
  ): "success" | "warn" | "danger" | "info" | "secondary" {
    switch (status) {
      case "active":
        return "success";
      case "pending":
        return "warn";
      case "suspended":
        return "danger";
      default:
        return "secondary";
    }
  }

  suspendUser(user: User): void {
    user.status = "suspended";
    this.filterUsers();
  }

  reactivateUser(user: User): void {
    user.status = "active";
    this.filterUsers();
  }

  editUser(_user: User): void {
    // TODO: Implement user edit functionality
  }

  viewUser(_user: User): void {
    // TODO: Implement user view functionality
  }
}
