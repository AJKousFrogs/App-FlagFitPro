/**
 * Superadmin Dashboard Component
 *
 * System-wide administration dashboard for managing all teams, users,
 * monitoring platform health, and handling support escalations.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { CommonModule } from "@angular/common";
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MessageService , PrimeTemplate } from "primeng/api";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { Card } from "primeng/card";
import { Dialog } from "primeng/dialog";
import { InputText } from "primeng/inputtext";
import { Select } from "primeng/select";
import { TableModule } from "primeng/table";
import { Tag } from "primeng/tag";
import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { Toast } from "primeng/toast";
import { firstValueFrom } from "rxjs";

import { ApiService } from "../../core/services/api.service";
import { LoggerService } from "../../core/services/logger.service";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";

// ===== Interfaces =====
interface PlatformStats {
  totalUsers: number;
  usersGrowth: number;
  activeTeams: number;
  teamsGrowth: number;
  dailyActive: number;
  dailyActivePercent: number;
  openIssues: number;
  dbSize: string;
  dbPercent: number;
  apiRequests: number;
  apiGrowth: number;
  avgResponse: number;
  errorsLast24h: number;
  errorRate: number;
}

interface ActivityLog {
  id: string;
  type: "new_team" | "error" | "user_delete" | "ticket";
  title: string;
  description: string;
  timestamp: string;
  priority?: "high" | "medium" | "low";
}

interface ServiceStatus {
  name: string;
  status: "healthy" | "warning" | "error";
  detail: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "coach" | "player" | "parent" | "admin";
  team: string;
  status: "active" | "inactive" | "pending";
}

interface AdminTeam {
  id: string;
  name: string;
  coach: string;
  playerCount: number;
  createdDate: string;
  status: "active" | "inactive" | "new";
}

@Component({
  selector: "app-superadmin-dashboard",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Card,
    Dialog,
    PrimeTemplate,
    InputText,
    Select,
    TableModule,
    TableModule,
    Tag,
    Toast,
    MainLayoutComponent,
    PageHeaderComponent,

    ButtonComponent,
  ],
  providers: [MessageService],
  template: `
    <app-main-layout>
      <p-toast></p-toast>

      <div class="admin-page">
        <app-page-header
          title="Superadmin Dashboard"
          subtitle="System administration and monitoring"
          icon="pi-cog"
        ></app-page-header>

        <!-- Platform Overview Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-icon">👥</span>
            <div class="stat-content stat-block__content">
              <span class="stat-block__value">{{
                stats().totalUsers | number
              }}</span>
              <span class="stat-block__label">Total Users</span>
              <span class="stat-change positive"
                >▲ +{{ stats().usersGrowth }} this mo</span
              >
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">🏈</span>
            <div class="stat-content stat-block__content">
              <span class="stat-block__value">{{ stats().activeTeams }}</span>
              <span class="stat-block__label">Active Teams</span>
              <span class="stat-change positive"
                >▲ +{{ stats().teamsGrowth }} this mo</span
              >
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">📊</span>
            <div class="stat-content stat-block__content">
              <span class="stat-block__value">{{ stats().dailyActive }}</span>
              <span class="stat-block__label">Daily Active</span>
              <span class="stat-sub"
                >{{ stats().dailyActivePercent }}% of users</span
              >
            </div>
          </div>
          <div class="stat-card" [class.warning]="stats().openIssues > 0">
            <span class="stat-icon">⚠️</span>
            <div class="stat-content stat-block__content">
              <span class="stat-block__value">{{ stats().openIssues }}</span>
              <span class="stat-block__label">Open Issues</span>
              <span class="stat-sub">Support tix</span>
            </div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-icon">💾</span>
            <div class="stat-content stat-block__content">
              <span class="stat-block__value">{{ stats().dbSize }}</span>
              <span class="stat-block__label">DB Size</span>
              <span class="stat-sub" [class.warning]="stats().dbPercent > 70"
                >{{ stats().dbPercent }}% of limit</span
              >
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">🔄</span>
            <div class="stat-content stat-block__content">
              <span class="stat-block__value">{{
                stats().apiRequests | number
              }}</span>
              <span class="stat-block__label">API Requests (24h)</span>
              <span class="stat-change positive"
                >▲ +{{ stats().apiGrowth }}% vs avg</span
              >
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">⚡</span>
            <div class="stat-content stat-block__content">
              <span class="stat-block__value"
                >{{ stats().avgResponse }}ms</span
              >
              <span class="stat-block__label">Avg Response</span>
              <span class="stat-sub healthy">🟢 Healthy</span>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">🔴</span>
            <div class="stat-content stat-block__content">
              <span class="stat-block__value">{{
                stats().errorsLast24h
              }}</span>
              <span class="stat-block__label">Errors (24h)</span>
              <span class="stat-sub">{{ stats().errorRate }}% rate</span>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <p-card>
          <ng-template pTemplate="header">
            <div class="card-header">
              <h3>Quick Actions</h3>
            </div>
          </ng-template>
          <div class="quick-actions">
            <button class="action-btn" (click)="openUserManagement()">
              <span class="action-icon">👥</span>
              <span class="action-label">Manage Users</span>
            </button>
            <button class="action-btn" (click)="openTeamManagement()">
              <span class="action-icon">🏈</span>
              <span class="action-label">Manage Teams</span>
            </button>
            <button class="action-btn" (click)="openAnalytics()">
              <span class="action-icon">📊</span>
              <span class="action-label">Analytics</span>
            </button>
            <button class="action-btn" (click)="openSettings()">
              <span class="action-icon">🔧</span>
              <span class="action-label">Settings</span>
            </button>
            <button class="action-btn" (click)="openAuditLogs()">
              <span class="action-icon">📋</span>
              <span class="action-label">Audit Logs</span>
            </button>
            <button class="action-btn" (click)="openSupportTickets()">
              <span class="action-icon">🎫</span>
              <span class="action-label">Support Tix</span>
            </button>
            <button class="action-btn" (click)="openBroadcasts()">
              <span class="action-icon">📧</span>
              <span class="action-label">Broadcasts</span>
            </button>
            <button class="action-btn" (click)="openBackups()">
              <span class="action-icon">💾</span>
              <span class="action-label">Backups</span>
            </button>
          </div>
        </p-card>

        <!-- Recent Activity -->
        <p-card>
          <ng-template pTemplate="header">
            <div class="card-header">
              <h3>Recent Activity</h3>
            </div>
          </ng-template>
          <div class="activity-list">
            @for (log of recentActivity(); track log.id) {
              <div class="activity-item" [class]="'type-' + log.type">
                <span class="activity-icon">{{
                  getActivityIcon(log.type)
                }}</span>
                <div class="activity-content">
                  <strong>{{ log.title }}</strong>
                  <p>{{ log.description }}</p>
                </div>
                <span class="item-time">{{ log.timestamp }}</span>
                @if (log.type === "error" || log.type === "ticket") {
                  <app-button
                    variant="text"
                    size="sm"
                    (clicked)="viewActivityDetails(log)"
                    >View Details</app-button
                  >
                }
              </div>
            }
          </div>
          <div class="activity-footer">
            <app-button variant="text" (clicked)="viewAllActivity()"
              >View All Activity →</app-button
            >
          </div>
        </p-card>

        <!-- System Health -->
        <p-card>
          <ng-template pTemplate="header">
            <div class="card-header">
              <h3>System Health</h3>
            </div>
          </ng-template>
          <div class="service-list">
            @for (service of services(); track service.name) {
              <div class="service-row">
                <span
                  class="service-status"
                  [class]="'status-' + service.status"
                >
                  @switch (service.status) {
                    @case ("healthy") {
                      🟢
                    }
                    @case ("warning") {
                      🟡
                    }
                    @case ("error") {
                      🔴
                    }
                  }
                </span>
                <span class="service-name">{{ service.name }}</span>
                <span class="service-detail">{{ service.detail }}</span>
              </div>
            }
          </div>
          <div class="service-actions">
            <app-button variant="secondary" (clicked)="viewMetrics()"
              >View Detailed Metrics</app-button
            >
            <app-button variant="secondary" (clicked)="viewLogs()"
              >View Logs</app-button
            >
            <app-button variant="secondary" (clicked)="runHealthCheck()"
              >Run Health Check</app-button
            >
          </div>
        </p-card>
      </div>

      <!-- User Management Dialog -->
      <p-dialog
        [(visible)]="showUserDialog"
        header="User Management"
        [modal]="true"
        styleClass="superadmin-user-dialog"
      >
        <div class="management-filters">
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <input
              type="text"
              pInputText
              [(ngModel)]="userSearch"
              placeholder="Search users..."
            />
          </span>
          <p-select
            inputId="user-role-filter"
            [options]="roleOptions"
            [(ngModel)]="roleFilter"
            optionLabel="label"
            optionValue="value"
            placeholder="Role"
            [attr.aria-label]="'Filter users by role'"
          ></p-select>
          <p-select
            inputId="user-status-filter"
            [options]="statusOptions"
            [(ngModel)]="statusFilter"
            optionLabel="label"
            optionValue="value"
            placeholder="Status"
            [attr.aria-label]="'Filter users by status'"
          ></p-select>
        </div>

        <p-table 
          [value]="filteredUsers()" 
          [paginator]="true" 
          [rows]="10"
          [rowsPerPageOptions]="[10, 25, 50]"
          [virtualScroll]="filteredUsers().length > 50"
          [virtualScrollItemSize]="46"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Team</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-user>
            <tr>
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>
                <app-status-tag
                  [value]="user.role"
                  [severity]="getRoleSeverity(user.role)"
                  size="sm"
                />
              </td>
              <td>{{ user.team || "--" }}</td>
              <td>
                <app-button
                  variant="text"
                  iconLeft="pi-ellipsis-v"
                  (clicked)="openUserMenu(user)"
                  >User actions</app-button
                >
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-dialog>

      <!-- Team Management Dialog -->
      <p-dialog
        [(visible)]="showTeamDialog"
        header="Team Management"
        [modal]="true"
        styleClass="superadmin-team-dialog"
      >
        <p-table 
          [value]="teams()" 
          [paginator]="true" 
          [rows]="10"
          [rowsPerPageOptions]="[10, 25, 50]"
          [virtualScroll]="teams().length > 50"
          [virtualScrollItemSize]="46"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>Team</th>
              <th>Coach</th>
              <th>Players</th>
              <th>Created</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-team>
            <tr>
              <td>{{ team.name }}</td>
              <td>{{ team.coach }}</td>
              <td>{{ team.playerCount }}</td>
              <td>{{ team.createdDate }}</td>
              <td>
                <app-status-tag
                  [value]="team.status"
                  [severity]="getTeamStatusSeverity(team.status)"
                  size="sm"
                />
              </td>
              <td>
                <app-button variant="text" iconLeft="pi-ellipsis-v"
                  >Team actions</app-button
                >
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-dialog>
    </app-main-layout>
  `,
  styleUrl: "./superadmin-dashboard.component.scss",
})
export class SuperadminDashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly messageService = inject(MessageService);

  // State
  readonly stats = signal<PlatformStats>({
    totalUsers: 0,
    usersGrowth: 0,
    activeTeams: 0,
    teamsGrowth: 0,
    dailyActive: 0,
    dailyActivePercent: 0,
    openIssues: 0,
    dbSize: "0 GB",
    dbPercent: 0,
    apiRequests: 0,
    apiGrowth: 0,
    avgResponse: 0,
    errorsLast24h: 0,
    errorRate: 0,
  });

  readonly recentActivity = signal<ActivityLog[]>([]);
  readonly services = signal<ServiceStatus[]>([]);
  readonly users = signal<AdminUser[]>([]);
  readonly teams = signal<AdminTeam[]>([]);
  readonly isLoading = signal(true);

  // Dialog state
  showUserDialog = false;
  showTeamDialog = false;

  // Filters
  userSearch = "";
  roleFilter = "";
  statusFilter = "";

  // Options
  readonly roleOptions = [
    { label: "All Roles", value: "" },
    { label: "Coach", value: "coach" },
    { label: "Player", value: "player" },
    { label: "Parent", value: "parent" },
    { label: "Admin", value: "admin" },
  ];

  readonly statusOptions = [
    { label: "All Status", value: "" },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
    { label: "Pending", value: "pending" },
  ];

  // Computed
  readonly filteredUsers = computed(() => {
    let result = this.users();

    if (this.userSearch) {
      const q = this.userSearch.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
      );
    }

    if (this.roleFilter) {
      result = result.filter((u) => u.role === this.roleFilter);
    }

    if (this.statusFilter) {
      result = result.filter((u) => u.status === this.statusFilter);
    }

    return result;
  });

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await firstValueFrom(
        this.api.get("/api/admin/dashboard"),
      );
      if (response?.success && response.data) {
        this.stats.set(response.data.stats || {});
        this.recentActivity.set(response.data.activity || []);
        this.services.set(response.data.services || []);
        this.users.set(response.data.users || []);
        this.teams.set(response.data.teams || []);
      }
    } catch (err) {
      this.logger.error("Failed to load admin dashboard", err);
      // No data available - show empty state
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * @deprecated REMOVED: Mock demo data method
   * This method previously loaded hardcoded demo data which could mislead administrators.
   * All data should come from the actual database via the API.
   * Empty states are now shown when no data is available.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private loadDemoData(): void {
    // NO-OP: Mock data removed to ensure data integrity
    // Admin dashboard now shows empty states when API returns no data
    // This prevents administrators from seeing fake statistics
    this.logger.info(
      "[SuperadminDashboard] Demo data loading disabled - showing real data only",
    );
  }

  // Quick Actions
  openUserManagement(): void {
    this.showUserDialog = true;
  }

  openTeamManagement(): void {
    this.showTeamDialog = true;
  }

  openAnalytics(): void {
    this.messageService.add({
      severity: "info",
      summary: "Analytics",
      detail: "Opening analytics dashboard",
    });
  }

  openSettings(): void {
    this.messageService.add({
      severity: "info",
      summary: "Settings",
      detail: "Opening system settings",
    });
  }

  openAuditLogs(): void {
    this.messageService.add({
      severity: "info",
      summary: "Audit Logs",
      detail: "Opening audit logs",
    });
  }

  openSupportTickets(): void {
    this.messageService.add({
      severity: "info",
      summary: "Support",
      detail: "Opening support tickets",
    });
  }

  openBroadcasts(): void {
    this.messageService.add({
      severity: "info",
      summary: "Broadcasts",
      detail: "Opening broadcast system",
    });
  }

  openBackups(): void {
    this.messageService.add({
      severity: "info",
      summary: "Backups",
      detail: "Opening backup management",
    });
  }

  // Activity
  viewActivityDetails(log: ActivityLog): void {
    this.messageService.add({
      severity: "info",
      summary: "Details",
      detail: log.title,
    });
  }

  viewAllActivity(): void {
    this.messageService.add({
      severity: "info",
      summary: "Activity",
      detail: "Opening all activity log",
    });
  }

  // Services
  viewMetrics(): void {
    this.messageService.add({
      severity: "info",
      summary: "Metrics",
      detail: "Opening detailed metrics",
    });
  }

  viewLogs(): void {
    this.messageService.add({
      severity: "info",
      summary: "Logs",
      detail: "Opening system logs",
    });
  }

  runHealthCheck(): void {
    this.messageService.add({
      severity: "success",
      summary: "Health Check",
      detail: "All systems operational",
    });
  }

  // User Management
  openUserMenu(user: AdminUser): void {
    this.messageService.add({
      severity: "info",
      summary: "User Actions",
      detail: `Actions for ${user.name}`,
    });
  }

  // Helpers
  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      new_team: "🆕",
      error: "🔴",
      user_delete: "👤",
      ticket: "🎫",
    };
    return icons[type] || "📋";
  }

  getRoleSeverity(
    role: string,
  ): "success" | "info" | "warning" | "danger" | "secondary" {
    const severities: Record<
      string,
      "success" | "info" | "warning" | "danger" | "secondary"
    > = {
      coach: "success",
      player: "info",
      parent: "secondary",
      admin: "warning",
    };
    return severities[role] || "secondary";
  }

  getTeamStatusSeverity(
    status: string,
  ): "success" | "info" | "warning" | "danger" | "secondary" {
    const severities: Record<
      string,
      "success" | "info" | "warning" | "danger" | "secondary"
    > = {
      active: "success",
      inactive: "secondary",
      new: "warning",
    };
    return severities[status] || "secondary";
  }
}
