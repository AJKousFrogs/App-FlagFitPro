import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { LucideAngularModule } from "lucide-angular";

import { ApiService } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";
import { extractApiPayload } from "../core/utils/api-response-mapper";

interface SystemStats {
  totalTeams: number;
  totalAthletes: number;
  totalStaff: number;
  activeUsers: number;
}

interface TeamOverview {
  team_id: string;
  team_name: string;
  member_count: number;
  staff_count: number;
  athletes_at_risk: number;
  system_health: "healthy" | "caution" | "warning";
  last_activity: string;
}

interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  resource_type: string;
  timestamp: string;
  status: "success" | "failure" | "pending";
}

interface AdministratorDashboardResponse {
  success: boolean;
  systemStats: SystemStats;
  teamOverviews: TeamOverview[];
  recentAuditLogs: AuditLog[];
  systemHealth: {
    dataIntegrity: number;
    performanceScore: number;
    securityStatus: string;
  };
}

/**
 * Administrator Dashboard
 * Route: /admin/dashboard
 * Provides system-wide oversight: team management, user activity auditing,
 * system health monitoring, and compliance tracking.
 */
@Component({
  selector: "app-administrator-dashboard",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="dashboard-container">
      <div class="header">
        <h1>Administration Dashboard</h1>
        <p class="subtitle">System oversight and team management</p>
      </div>

      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading system data...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <i-lucide name="alert-triangle"></i-lucide>
          <p>{{ error() }}</p>
        </div>
      } @else {
        <!-- System Health Banner -->
        <section class="health-banner" [class]="'health-' + dashboardData().systemHealth.securityStatus">
          <div class="health-content">
            <h2>System Health</h2>
            <div class="health-metrics">
              <div class="health-item">
                <span class="metric-label">Data Integrity</span>
                <div class="progress-mini">
                  <div class="progress-fill" [style.width.%]="dashboardData().systemHealth.dataIntegrity"></div>
                </div>
                {{ dashboardData().systemHealth.dataIntegrity }}%
              </div>
              <div class="health-item">
                <span class="metric-label">Performance</span>
                <div class="progress-mini">
                  <div class="progress-fill" [style.width.%]="dashboardData().systemHealth.performanceScore"></div>
                </div>
                {{ dashboardData().systemHealth.performanceScore }}%
              </div>
              <div class="health-item">
                <span class="metric-label">Security</span>
                <i-lucide [name]="getSecurityIcon(dashboardData().systemHealth.securityStatus)"></i-lucide>
                {{ dashboardData().systemHealth.securityStatus | uppercase }}
              </div>
            </div>
          </div>
        </section>

        <!-- System Statistics -->
        <section class="stats-grid">
          <div class="stat-card">
            <i-lucide name="building-2" class="stat-icon"></i-lucide>
            <div class="stat-info">
              <div class="stat-value">{{ dashboardData().systemStats.totalTeams }}</div>
              <div class="stat-label">Teams</div>
            </div>
          </div>

          <div class="stat-card">
            <i-lucide name="users" class="stat-icon"></i-lucide>
            <div class="stat-info">
              <div class="stat-value">{{ dashboardData().systemStats.totalAthletes }}</div>
              <div class="stat-label">Athletes</div>
            </div>
          </div>

          <div class="stat-card">
            <i-lucide name="user-check" class="stat-icon"></i-lucide>
            <div class="stat-info">
              <div class="stat-value">{{ dashboardData().systemStats.totalStaff }}</div>
              <div class="stat-label">Staff Members</div>
            </div>
          </div>

          <div class="stat-card">
            <i-lucide name="activity" class="stat-icon"></i-lucide>
            <div class="stat-info">
              <div class="stat-value">{{ dashboardData().systemStats.activeUsers }}</div>
              <div class="stat-label">Active Now</div>
            </div>
          </div>
        </section>

        <!-- Team Overview -->
        <section class="teams-section">
          <h2>Team Overview</h2>
          <div class="teams-grid">
            @for (team of dashboardData().teamOverviews; track team.team_id) {
              <div class="team-card" [class]="'health-' + team.system_health">
                <div class="team-header">
                  <h3>{{ team.team_name }}</h3>
                  <span [class]="'health-badge ' + team.system_health">
                    {{ formatHealth(team.system_health) }}
                  </span>
                </div>

                <div class="team-stats">
                  <div class="team-stat">
                    <i-lucide name="users" class="team-stat-icon"></i-lucide>
                    <span>{{ team.member_count }} Members</span>
                  </div>
                  <div class="team-stat">
                    <i-lucide name="user-check" class="team-stat-icon"></i-lucide>
                    <span>{{ team.staff_count }} Staff</span>
                  </div>
                  <div class="team-stat" [class.risk]="team.athletes_at_risk > 0">
                    <i-lucide name="alert-circle" class="team-stat-icon"></i-lucide>
                    <span>{{ team.athletes_at_risk }} At Risk</span>
                  </div>
                </div>

                <div class="team-footer">
                  <span class="last-activity">
                    Last active: {{ formatDate(team.last_activity) }}
                  </span>
                </div>
              </div>
            }
          </div>
        </section>

        <!-- Audit Log -->
        <section class="audit-section">
          <h2>Recent Activity Log</h2>
          <div class="audit-log">
            @if (dashboardData().recentAuditLogs.length > 0) {
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Action</th>
                    <th>Resource Type</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  @for (log of dashboardData().recentAuditLogs.slice(0, 30); track log.id) {
                    <tr [class]="'status-' + log.status">
                      <td class="user-name">
                        <i-lucide [name]="getStatusIcon(log.status)"></i-lucide>
                        {{ log.user_name }}
                      </td>
                      <td>{{ log.action }}</td>
                      <td><span class="resource-type">{{ log.resource_type }}</span></td>
                      <td>
                        <span [class]="'status-badge ' + log.status">
                          {{ log.status | uppercase }}
                        </span>
                      </td>
                      <td class="timestamp">{{ formatDateTime(log.timestamp) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else {
              <div class="empty-state">
                <i-lucide name="inbox"></i-lucide>
                <p>No recent activity</p>
              </div>
            }
          </div>
        </section>

        <!-- Export Actions -->
        <section class="export-section">
          <button (click)="exportSystemReport()" class="export-btn">
            <i-lucide name="download"></i-lucide>
            Export System Report
          </button>
          <button (click)="exportAuditLog()" class="export-btn secondary">
            <i-lucide name="file-text"></i-lucide>
            Export Audit Log
          </button>
        </section>
      }
    </div>

    <style>
      .dashboard-container {
        padding: var(--s-4);
        max-width: 1400px;
        margin: 0 auto;
      }

      .header {
        margin-bottom: var(--s-5);
      }

      .header h1 {
        font-size: var(--fs-2xl);
        font-weight: var(--fw-bold);
        color: var(--text-strong);
        margin-bottom: var(--s-1);
      }

      .subtitle {
        color: var(--text-muted);
        font-size: var(--fs-sm);
      }

      .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--s-2);
        padding: var(--s-8);
        color: var(--text-muted);
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--border);
        border-top-color: var(--accent);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .error-state {
        display: flex;
        align-items: center;
        gap: var(--s-2);
        padding: var(--s-4);
        background: color-mix(in srgb, var(--danger) 10%, transparent);
        border-left: 4px solid var(--danger);
        border-radius: var(--r-md);
        color: var(--danger);
      }

      section {
        background: var(--surface-2);
        border: 1px solid var(--border);
        border-radius: var(--r-lg);
        padding: var(--s-4);
        margin-bottom: var(--s-5);
      }

      .health-banner {
        background: linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%);
        border-left: 4px solid;
      }

      .health-banner.health-healthy {
        border-left-color: var(--good);
      }

      .health-banner.health-caution {
        border-left-color: var(--warn);
      }

      .health-banner.health-warning {
        border-left-color: var(--danger);
      }

      .health-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--s-4);
      }

      .health-content h2 {
        margin: 0;
        color: var(--text-strong);
      }

      .health-metrics {
        display: flex;
        gap: var(--s-4);
        flex-wrap: wrap;
      }

      .health-item {
        display: flex;
        align-items: center;
        gap: var(--s-2);
      }

      .metric-label {
        font-size: var(--fs-sm);
        color: var(--text-muted);
        min-width: 80px;
      }

      .progress-mini {
        width: 100px;
        height: 4px;
        background: var(--border);
        border-radius: 2px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: var(--good);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--s-3);
      }

      .stat-card {
        display: flex;
        align-items: center;
        gap: var(--s-3);
        padding: var(--s-3);
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r-md);
      }

      .stat-icon {
        width: 40px;
        height: 40px;
        color: var(--accent);
        flex-shrink: 0;
      }

      .stat-info {
        flex: 1;
      }

      .stat-value {
        font-size: var(--fs-xl);
        font-weight: var(--fw-bold);
        color: var(--text-strong);
      }

      .stat-label {
        font-size: var(--fs-xs);
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .teams-section h2,
      .audit-section h2 {
        margin-bottom: var(--s-3);
        color: var(--text-strong);
        font-weight: var(--fw-bold);
      }

      .teams-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: var(--s-3);
      }

      .team-card {
        padding: var(--s-3);
        background: var(--surface);
        border: 2px solid var(--border);
        border-radius: var(--r-md);
        border-left: 4px solid;
        transition: all 0.2s ease;
      }

      .team-card.health-healthy {
        border-left-color: var(--good);
      }

      .team-card.health-caution {
        border-left-color: var(--warn);
      }

      .team-card.health-warning {
        border-left-color: var(--danger);
      }

      .team-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .team-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--s-2);
      }

      .team-header h3 {
        margin: 0;
        color: var(--text-strong);
        font-size: var(--fs-md);
      }

      .health-badge {
        padding: var(--s-1) var(--s-2);
        border-radius: var(--r-sm);
        font-size: var(--fs-xs);
        font-weight: var(--fw-semibold);
      }

      .health-badge.healthy {
        background: color-mix(in srgb, var(--good) 20%, transparent);
        color: var(--good);
      }

      .health-badge.caution {
        background: color-mix(in srgb, var(--warn) 20%, transparent);
        color: var(--warn);
      }

      .health-badge.warning {
        background: color-mix(in srgb, var(--danger) 20%, transparent);
        color: var(--danger);
      }

      .team-stats {
        display: grid;
        gap: var(--s-2);
        margin-bottom: var(--s-2);
      }

      .team-stat {
        display: flex;
        align-items: center;
        gap: var(--s-2);
        font-size: var(--fs-sm);
        color: var(--text-muted);
      }

      .team-stat.risk {
        color: var(--danger);
        font-weight: var(--fw-bold);
      }

      .team-stat-icon {
        width: 16px;
        height: 16px;
        color: var(--accent);
      }

      .team-footer {
        padding-top: var(--s-2);
        border-top: 1px solid var(--border);
      }

      .last-activity {
        display: block;
        font-size: var(--fs-xs);
        color: var(--text-faint);
      }

      .audit-log {
        overflow-x: auto;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--fs-sm);
      }

      thead {
        background: var(--surface);
        border-bottom: 2px solid var(--border);
      }

      th {
        padding: var(--s-3);
        text-align: left;
        font-weight: var(--fw-bold);
        color: var(--text-strong);
      }

      tbody tr {
        border-bottom: 1px solid var(--border);
        transition: background-color 0.2s ease;
      }

      tbody tr:hover {
        background: color-mix(in srgb, var(--accent) 5%, transparent);
      }

      td {
        padding: var(--s-3);
        color: var(--text-muted);
      }

      .user-name {
        display: flex;
        align-items: center;
        gap: var(--s-1);
        font-weight: var(--fw-bold);
        color: var(--text-strong);
      }

      .resource-type {
        display: inline-block;
        padding: var(--s-1) var(--s-2);
        background: color-mix(in srgb, var(--accent) 10%, transparent);
        border-radius: var(--r-sm);
        font-size: var(--fs-xs);
      }

      .status-badge {
        display: inline-block;
        padding: var(--s-1) var(--s-2);
        border-radius: var(--r-sm);
        font-size: var(--fs-xs);
        font-weight: var(--fw-semibold);
      }

      .status-badge.success {
        background: color-mix(in srgb, var(--good) 20%, transparent);
        color: var(--good);
      }

      .status-badge.failure {
        background: color-mix(in srgb, var(--danger) 20%, transparent);
        color: var(--danger);
      }

      .status-badge.pending {
        background: color-mix(in srgb, var(--warn) 20%, transparent);
        color: var(--warn);
      }

      .timestamp {
        font-size: var(--fs-xs);
        color: var(--text-faint);
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--s-2);
        padding: var(--s-6);
        color: var(--text-muted);
      }

      .export-section {
        display: flex;
        gap: var(--s-2);
        justify-content: flex-end;
        flex-wrap: wrap;
      }

      .export-btn {
        display: flex;
        align-items: center;
        gap: var(--s-2);
        padding: var(--s-2) var(--s-3);
        background: var(--accent);
        color: var(--on-accent);
        border: none;
        border-radius: var(--r-md);
        cursor: pointer;
        font-size: var(--fs-sm);
        font-weight: var(--fw-semibold);
        transition: all 0.2s ease;
      }

      .export-btn:hover {
        background: color-mix(in srgb, var(--accent) 110%, white);
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .export-btn.secondary {
        background: var(--surface);
        color: var(--accent);
        border: 1px solid var(--accent);
      }

      .export-btn.secondary:hover {
        background: color-mix(in srgb, var(--accent) 10%, transparent);
      }
    </style>
  `,
})
export class AdministratorDashboardComponent {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly dashboardData = signal<AdministratorDashboardResponse>({
    success: false,
    systemStats: {
      totalTeams: 0,
      totalAthletes: 0,
      totalStaff: 0,
      activeUsers: 0,
    },
    teamOverviews: [],
    recentAuditLogs: [],
    systemHealth: {
      dataIntegrity: 0,
      performanceScore: 0,
      securityStatus: "healthy",
    },
  });

  constructor() {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.api.get<AdministratorDashboardResponse>("/api/admin").subscribe({
      next: (apiResponse) => {
        const response = extractApiPayload<AdministratorDashboardResponse>(
          apiResponse
        );
        if (response) {
          this.dashboardData.set(response);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error("admin_dashboard_load_failed", err);
        this.error.set("Failed to load system data");
        this.loading.set(false);
      },
    });
  }

  formatHealth(status: string): string {
    const labels: Record<string, string> = {
      healthy: "✓ Healthy",
      caution: "⚠ Caution",
      warning: "! Warning",
    };
    return labels[status] || status;
  }

  getSecurityIcon(status: string): string {
    switch (status) {
      case "healthy":
        return "shield-check";
      case "caution":
        return "shield-alert";
      case "warning":
        return "shield-off";
      default:
        return "shield";
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case "success":
        return "check-circle-2";
      case "failure":
        return "x-circle";
      case "pending":
        return "clock";
      default:
        return "circle";
    }
  }

  formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  }

  formatDateTime(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  }

  exportSystemReport(): void {
    try {
      const data = this.dashboardData();
      const timestamp = new Date().toLocaleString();

      const html = `
        <html>
          <head>
            <title>System Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
              h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
              h2 { color: #34495e; margin-top: 30px; }
              .summary { margin: 20px 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
              .summary-item { padding: 15px; background: #ecf0f1; border-radius: 5px; }
              .summary-value { font-size: 1.8em; font-weight: bold; color: #2c3e50; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th { background: #34495e; color: white; padding: 12px; text-align: left; }
              td { border-bottom: 1px solid #ddd; padding: 10px; }
              .timestamp { color: #7f8c8d; font-size: 0.9em; }
              .health-indicator { padding: 10px; border-radius: 5px; margin-top: 10px; }
            </style>
          </head>
          <body>
            <h1>System Administration Report</h1>
            <p class="timestamp">Generated: ${timestamp}</p>

            <h2>System Statistics</h2>
            <div class="summary">
              <div class="summary-item">
                <div>Teams</div>
                <div class="summary-value">${data.systemStats.totalTeams}</div>
              </div>
              <div class="summary-item">
                <div>Athletes</div>
                <div class="summary-value">${data.systemStats.totalAthletes}</div>
              </div>
              <div class="summary-item">
                <div>Staff</div>
                <div class="summary-value">${data.systemStats.totalStaff}</div>
              </div>
              <div class="summary-item">
                <div>Active Now</div>
                <div class="summary-value">${data.systemStats.activeUsers}</div>
              </div>
            </div>

            <h2>System Health</h2>
            <div class="health-indicator">
              <p><strong>Data Integrity:</strong> ${data.systemHealth.dataIntegrity}%</p>
              <p><strong>Performance:</strong> ${data.systemHealth.performanceScore}%</p>
              <p><strong>Security Status:</strong> ${data.systemHealth.securityStatus.toUpperCase()}</p>
            </div>

            <h2>Team Overview</h2>
            <table>
              <thead>
                <tr>
                  <th>Team Name</th>
                  <th>Members</th>
                  <th>Staff</th>
                  <th>At Risk</th>
                  <th>Health</th>
                  <th>Last Activity</th>
                </tr>
              </thead>
              <tbody>
                ${data.teamOverviews
                  .map(
                    (t) => `
                  <tr>
                    <td><strong>${t.team_name}</strong></td>
                    <td>${t.member_count}</td>
                    <td>${t.staff_count}</td>
                    <td>${t.athletes_at_risk}</td>
                    <td>${this.formatHealth(t.system_health)}</td>
                    <td>${this.formatDate(t.last_activity)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const blob = new Blob([html], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `system-report-${new Date().toISOString().split("T")[0]}.html`;
      a.click();
      window.URL.revokeObjectURL(url);

      this.logger.info("system_report_exported", {
        teamCount: data.teamOverviews.length,
      });
    } catch (err) {
      this.logger.error("system_report_export_failed", err);
    }
  }

  exportAuditLog(): void {
    try {
      const data = this.dashboardData();
      const timestamp = new Date().toLocaleString();

      let csv = "SYSTEM AUDIT LOG\n";
      csv += `Exported: ${timestamp}\n\n`;
      csv += "User,Action,Resource,Status,Timestamp\n";

      data.recentAuditLogs.forEach((log) => {
        csv += `"${log.user_name}","${log.action}","${log.resource_type}","${log.status}","${log.timestamp}"\n`;
      });

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      this.logger.info("audit_log_exported", {
        logCount: data.recentAuditLogs.length,
      });
    } catch (err) {
      this.logger.error("audit_log_export_failed", err);
    }
  }
}
