import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
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
import {
  ManagedUserAccount,
  SuperadminService,
} from "../../core/services/superadmin.service";
import { ToastService } from "../../core/services/toast.service";

type User = ManagedUserAccount;

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
    SearchInputComponent,
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
  templateUrl: "./superadmin-users.component.html",
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
  readonly isLoading = signal(false);
  readonly loadError = signal<string | null>(null);
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
    void this.loadUsers();
  }

  async loadUsers(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set(null);

    try {
      this.users = await this.superadminService.getAllUsers();
      this.filterUsers();
    } catch (_error) {
      this.users = [];
      this.filteredUsers = [];
      this.loadError.set("Unable to load users right now. Please try again.");
      this.toast.error("Failed to load user management data.");
    } finally {
      this.isLoading.set(false);
    }
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

  async suspendUser(user: User): Promise<void> {
    await this.persistUserUpdate(user, {
      role: user.role,
      status: "suspended",
    });
  }

  async reactivateUser(user: User): Promise<void> {
    await this.persistUserUpdate(user, {
      role: user.role,
      status: "active",
    });
  }

  private syncEditDraftFromSelectedUser(user = this.selectedUser): void {
    if (!user) return;
    this.editRole = user.role;
    this.editStatus = user.status;
  }

  closeUserDialog(): void {
    this.showUserDialog = false;
  }

  closeEditDialog(): void {
    this.showEditDialog = false;
    this.syncEditDraftFromSelectedUser();
  }

  private openEditDialogForUser(user: User, closeUserDialog = false): void {
    this.selectedUser = user;
    this.syncEditDraftFromSelectedUser(user);
    if (closeUserDialog) {
      this.closeUserDialog();
    }
    this.showEditDialog = true;
  }

  editUser(user: User): void {
    this.openEditDialogForUser(user);
  }

  viewUser(user: User): void {
    this.selectedUser = user;
    this.showUserDialog = true;
  }

  openEditUserDialog(): void {
    if (!this.selectedUser) return;
    this.openEditDialogForUser(this.selectedUser, true);
  }

  async saveUserEdits(): Promise<void> {
    if (!this.selectedUser) return;

    await this.persistUserUpdate(this.selectedUser, {
      role: this.editRole,
      status: this.editStatus,
    }, () => this.closeEditDialog());
  }

  private isUserRole(value: string | undefined): value is User["role"] {
    return Boolean(value && USER_ROLES.includes(value as User["role"]));
  }

  private isUserStatus(value: string | undefined): value is User["status"] {
    return Boolean(value && USER_STATUSES.includes(value as User["status"]));
  }

  private async persistUserUpdate(
    user: User,
    updates: Pick<User, "role" | "status">,
    onSuccess?: () => void,
  ): Promise<void> {
    try {
      await this.superadminService.updateUserAccount(user.id, updates);
      await this.loadUsers();
      this.selectedUser =
        this.users.find((candidate) => candidate.id === user.id) ?? null;
      onSuccess?.();
      this.toast.success("User account updated successfully.", "User Updated");
    } catch (_error) {
      this.toast.error("Failed to update this user. Please try again.");
    }
  }
}
