import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";

import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { ChartModule } from "primeng/chart";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { StatsGridComponent } from "../../shared/components/stats-grid/stats-grid.component";
import { DEFAULT_CHART_OPTIONS } from "../../shared/config/chart.config";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";

interface TeamMember {
  id: string;
  name: string;
  position: string;
  performance: number;
  attendance: number;
  status: string;
}

@Component({
  selector: "app-coach",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardModule,
    ButtonModule,
    ChartModule,
    TableModule,
    TagModule,
    MainLayoutComponent,
    PageHeaderComponent,
    StatsGridComponent
],
  template: `
    <app-main-layout>
      <div class="coach-page">
        <app-page-header
          title="Coach Dashboard"
          subtitle="Manage your team, track performance, and create training sessions"
          icon="pi-users"
          >
          <p-button
            label="Create Session"
            icon="pi pi-plus"
            (onClick)="openCreateSession()"
          ></p-button>
        </app-page-header>
    
        <!-- Coach Stats -->
        <app-stats-grid [stats]="stats()"></app-stats-grid>
    
        <!-- Team Performance Chart -->
        <p-card class="chart-card">
          <ng-template pTemplate="header">
            <h3>Team Performance Overview</h3>
          </ng-template>
          @if (teamChartData()) {
            <p-chart
              type="line"
              [data]="teamChartData()"
              [options]="chartOptions"
            ></p-chart>
          }
        </p-card>
    
        <!-- Team Members Table -->
        <p-card class="table-card">
          <ng-template pTemplate="header">
            <h3>Team Members</h3>
          </ng-template>
          <p-table
            [value]="teamMembers()"
            [paginator]="true"
            [rows]="10"
            [rowsPerPageOptions]="[10, 25, 50]"
            >
            <ng-template pTemplate="header">
              <tr>
                <th>Name</th>
                <th>Position</th>
                <th>Performance</th>
                <th>Attendance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-member>
              <tr [attr.data-member-id]="member.id">
                <td>{{ member.name }}</td>
                <td>{{ member.position }}</td>
                <td>
                  <p-tag
                    [value]="member.performance + '%'"
                    [severity]="getPerformanceSeverity(member.performance)"
                    >
                  </p-tag>
                </td>
                <td>{{ member.attendance }}%</td>
                <td>
                  <p-tag
                    [value]="member.status"
                    [severity]="getStatusSeverity(member.status)"
                    >
                  </p-tag>
                </td>
                <td>
                  <p-button
                    icon="pi pi-eye"
                    [text]="true"
                    [rounded]="true"
                    ariaLabel="View details"
                  ></p-button>
                  <p-button
                    icon="pi pi-pencil"
                    [text]="true"
                    [rounded]="true"
                    ariaLabel="Edit"
                  ></p-button>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>
      </div>
    </app-main-layout>
    `,
  styles: [
    `
      .coach-page {
        padding: var(--space-6);
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-6);
        padding: var(--space-5);
        background: var(--surface-primary);
        border-radius: var(--p-border-radius);
      }

      .page-title {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: var(--space-2);
        color: var(--text-primary);
      }

      .page-subtitle {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
        margin-bottom: var(--space-6);
      }

      .stat-card {
        text-align: center;
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto var(--space-4);
        font-size: 1.5rem;
      }

      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: var(--space-2);
      }

      .stat-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .chart-card,
      .table-card {
        margin-bottom: var(--space-6);
      }

      @media (max-width: 768px) {
        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .page-header {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-4);
        }
      }
    `,
  ],
})
export class CoachComponent implements OnInit {
  private apiService = inject(ApiService);

  stats = signal<any[]>([]);
  teamChartData = signal<any>(null);
  teamMembers = signal<TeamMember[]>([]);

  chartOptions = DEFAULT_CHART_OPTIONS;

  ngOnInit(): void {
    this.loadCoachData();
  }

  loadCoachData(): void {
    // Load stats
    this.stats.set([
      {
        label: "Team Members",
        value: "20",
        icon: "pi-users",
        color: "#089949",
      },
      {
        label: "Avg Performance",
        value: "85%",
        icon: "pi-chart-line",
        color: "#10c96b",
      },
      {
        label: "Active Sessions",
        value: "5",
        icon: "pi-calendar",
        color: "#f1c40f",
      },
      {
        label: "Upcoming Games",
        value: "3",
        icon: "pi-trophy",
        color: "#e74c3c",
      },
    ]);

    // Load team chart
    this.teamChartData.set({
      labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      datasets: [
        {
          label: "Team Average",
          data: [82, 84, 85, 87],
          borderColor: "#089949",
          backgroundColor: "rgba(8, 153, 73, 0.1)",
        },
      ],
    });

    // Load team members
    this.teamMembers.set([
      {
        id: "1",
        name: "Alex Johnson",
        position: "QB",
        performance: 92,
        attendance: 95,
        status: "Active",
      },
      {
        id: "2",
        name: "Sarah Williams",
        position: "WR",
        performance: 88,
        attendance: 90,
        status: "Active",
      },
      {
        id: "3",
        name: "Mike Davis",
        position: "DB",
        performance: 85,
        attendance: 88,
        status: "Active",
      },
    ]);
  }

  openCreateSession(): void {
    // Open create session modal - implementation pending
  }

  getPerformanceSeverity(performance: number): string {
    if (performance >= 90) return "success";
    if (performance >= 80) return "info";
    if (performance >= 70) return "warn";
    return "danger";
  }

  getStatusSeverity(status: string): string {
    const severities: Record<string, string> = {
      Active: "success",
      Injured: "warn",
      Inactive: "danger",
    };
    return severities[status] || "info";
  }

  trackByMemberId(index: number, member: TeamMember): string {
    return member.id;
  }
}
