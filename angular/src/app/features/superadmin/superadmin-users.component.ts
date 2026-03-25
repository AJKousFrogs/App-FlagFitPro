import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from "@angular/core";
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
import { InputText } from "primeng/inputtext";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import {
  AppDialogComponent,
  DialogFooterComponent,
  DialogHeaderComponent,
} from "../../shared/components/ui-components";
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

const USER_ROLES = ["player", "coach", "admin", "superadmin"] as const;
const USER_STATUSES = ["active", "suspended", "pending"] as const;

@Component({
  selector: "app-superadmin-users",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    CardShellComponent,
    StatusTagComponent,
    TableModule,
    InputText,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    IconButtonComponent,
    EmptyStateComponent,
    AppLoadingComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
  ],
  template: `
    <app-main-layout>
      <div class="users-content ui-page-shell ui-page-shell--wide ui-page-stack">
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
        <app-card-shell class="filters-card">
          <div class="filters-row">
            <span class="p-input-icon-left users-search">
              <i class="pi pi-search"></i>
              <input
                type="text"
                pInputText
                [value]="searchQuery"
                (input)="onSearchInput($event)"
                placeholder="Search users..."
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
        </app-card-shell>

        <!-- Users Table -->
        <app-card-shell class="users-table-card" title="Users">
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
              [scrollable]="true"
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
        </app-card-shell>

        <!-- Stats Summary -->
        <div class="stats-row">
          <app-card-shell class="stat-card">
            <div class="stat-content stat-block__content">
              <span class="stat-block__value">{{ totalUsers }}</span>
              <span class="stat-block__label">Total Users</span>
            </div>
          </app-card-shell>
          <app-card-shell class="stat-card">
            <div class="stat-content stat-block__content">
              <span class="stat-block__value">{{ playerCount }}</span>
              <span class="stat-block__label">Players</span>
            </div>
          </app-card-shell>
          <app-card-shell class="stat-card">
            <div class="stat-content stat-block__content">
              <span class="stat-block__value">{{ coachCount }}</span>
              <span class="stat-block__label">Coaches</span>
            </div>
          </app-card-shell>
          <app-card-shell class="stat-card">
            <div class="stat-content stat-block__content">
              <span class="stat-block__value">{{ adminCount }}</span>
              <span class="stat-block__label">Admins</span>
            </div>
          </app-card-shell>
        </div>

        <app-dialog
          [(visible)]="showUserDialog"
          [modal]="true"
          [draggable]="false"
          [blockScroll]="true"
          styleClass="superadmin-user-dialog"
          ariaLabel="User details"
        >
          <app-dialog-header
            icon="users"
            [title]="selectedUser?.full_name || 'User Details'"
            subtitle="Review user account information and membership context."
            (close)="showUserDialog = false"
          />
          @if (selectedUser; as user) {
            <div class="goal-details">
              <div class="goal-detail-card">
                <span class="goal-detail-label">Email</span>
                <span class="goal-detail-value">{{ user.email }}</span>
              </div>
              <div class="goal-detail-card">
                <span class="goal-detail-label">Role</span>
                <span class="goal-detail-value">{{ user.role }}</span>
              </div>
              <div class="goal-detail-card">
                <span class="goal-detail-label">Status</span>
                <span class="goal-detail-value">{{ user.status }}</span>
              </div>
              <div class="goal-detail-card">
                <span class="goal-detail-label">Team</span>
                <span class="goal-detail-value">{{ user.team_name || "-" }}</span>
              </div>
            </div>
          }
          <app-dialog-footer
            dialogFooter
            cancelLabel="Close"
            primaryLabel="Edit User"
            primaryIcon="pencil"
            (cancel)="showUserDialog = false"
            (primary)="openEditUserDialog()"
          />
        </app-dialog>

        <app-dialog
          [(visible)]="showEditDialog"
          [modal]="true"
          [draggable]="false"
          [blockScroll]="true"
          styleClass="superadmin-user-dialog"
          ariaLabel="Edit user"
        >
          <app-dialog-header
            icon="user-edit"
            [title]="selectedUser?.full_name || 'Edit User'"
            subtitle="Adjust the local review state for this user."
            (close)="showEditDialog = false"
          />
          @if (selectedUser) {
            <div class="goal-form">
              <div class="form-field">
                <label for="superadmin-user-role">Role</label>
                <select
                  id="superadmin-user-role"
                  class="w-full"
                  [value]="editRole"
                  (change)="onEditRoleChange($event)"
                >
                  @for (option of roleOptions; track option.value) {
                    <option [value]="option.value">{{ option.label }}</option>
                  }
                </select>
              </div>
              <div class="form-field">
                <label for="superadmin-user-status">Status</label>
                <select
                  id="superadmin-user-status"
                  class="w-full"
                  [value]="editStatus"
                  (change)="onEditStatusChange($event)"
                >
                  @for (option of statusOptions; track option.value) {
                    <option [value]="option.value">{{ option.label }}</option>
                  }
                </select>
              </div>
            </div>
          }
          <app-dialog-footer
            dialogFooter
            cancelLabel="Cancel"
            primaryLabel="Save Changes"
            primaryIcon="check"
            (cancel)="showEditDialog = false"
            (primary)="saveUserEdits()"
          />
        </app-dialog>
      </div>
    </app-main-layout>
  `,
  styleUrl: "./superadmin-users.component.scss",
})
export class SuperadminUsersComponent implements OnInit {
  private superadminService = inject(SuperadminService);
  private toast = inject(ToastService);

  users: User[] = [];
  filteredUsers: User[] = [];
  searchQuery = "";
  roleFilter: "all" | "player" | "coach" | "admin" | "superadmin" = "all";
  showUserDialog = false;
  showEditDialog = false;
  selectedUser: User | null = null;
  editRole: User["role"] = "player";
  editStatus: User["status"] = "active";
  isLoading = this.superadminService.isLoading;
  readonly roleOptions = [
    { label: "Player", value: "player" },
    { label: "Coach", value: "coach" },
    { label: "Admin", value: "admin" },
    { label: "Superadmin", value: "superadmin" },
  ];
  readonly statusOptions = [
    { label: "Active", value: "active" },
    { label: "Suspended", value: "suspended" },
    { label: "Pending", value: "pending" },
  ];

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

  onSearchInput(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement | null)?.value ?? "";
    this.filterUsers();
  }

  onEditRoleChange(event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value;

    if (this.isUserRole(value)) {
      this.editRole = value;
    }
  }

  onEditStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value;

    if (this.isUserStatus(value)) {
      this.editStatus = value;
    }
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
    this.selectedUser = _user;
    this.editRole = _user.role;
    this.editStatus = _user.status;
    this.showEditDialog = true;
  }

  viewUser(_user: User): void {
    this.selectedUser = _user;
    this.showUserDialog = true;
  }

  openEditUserDialog(): void {
    if (!this.selectedUser) return;
    this.editRole = this.selectedUser.role;
    this.editStatus = this.selectedUser.status;
    this.showUserDialog = false;
    this.showEditDialog = true;
  }

  saveUserEdits(): void {
    if (!this.selectedUser) return;
    this.selectedUser.role = this.editRole;
    this.selectedUser.status = this.editStatus;
    this.filterUsers();
    this.showEditDialog = false;
    this.toast.success("User details updated locally.", "User Updated");
  }

  private isUserRole(value: string | undefined): value is User["role"] {
    return Boolean(value && USER_ROLES.includes(value as User["role"]));
  }

  private isUserStatus(value: string | undefined): value is User["status"] {
    return Boolean(value && USER_STATUSES.includes(value as User["status"]));
  }
}
