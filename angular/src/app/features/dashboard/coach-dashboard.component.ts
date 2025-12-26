import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardModule } from "primeng/card";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { ButtonModule } from "primeng/button";
import { ChartModule } from "primeng/chart";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import { HeaderService } from "../../core/services/header.service";
import { DEFAULT_CHART_OPTIONS } from "../../shared/config/chart.config";

interface SquadMember {
  id: string;
  name: string;
  position: string;
  workload: number;
  acwr: number;
  readiness: number;
  riskFlag: "low" | "medium" | "high";
}

interface UpcomingFixture {
  id: string;
  opponent: string;
  date: Date;
  location: string;
  gameType: string;
}

@Component({
  selector: "app-coach-dashboard",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    TagModule,
    ButtonModule,
    ChartModule,
    MainLayoutComponent,
    PageHeaderComponent,
  ],
  template: `
    <app-main-layout>
      <div class="dashboard-content">
        <app-page-header
          title="Coach Dashboard"
          subtitle="Squad overview and risk management"
        ></app-page-header>

        <!-- Squad Stats -->
        <div class="stats-row">
          <p-card class="stat-card">
            <div class="stat-content">
              <div class="stat-label">Squad Size</div>
              <div class="stat-value">{{ squadSize() }}</div>
            </div>
          </p-card>
          <p-card class="stat-card">
            <div class="stat-content">
              <div class="stat-label">Avg Workload</div>
              <div class="stat-value">
                {{ avgWorkload() | number: "1.0-0" }} AU
              </div>
            </div>
          </p-card>
          <p-card class="stat-card">
            <div class="stat-content">
              <div class="stat-label">Risk Flags</div>
              <div class="stat-value risk-value">{{ riskFlags().length }}</div>
              <div class="stat-subtitle">Players needing attention</div>
            </div>
          </p-card>
          <p-card class="stat-card">
            <div class="stat-content">
              <div class="stat-label">Upcoming Fixtures</div>
              <div class="stat-value">{{ upcomingFixtures().length }}</div>
            </div>
          </p-card>
        </div>

        <!-- Workload Distribution Chart -->
        <p-card class="chart-card">
          <ng-template pTemplate="header">
            <h3>Squad Workload Distribution</h3>
          </ng-template>
          @if (workloadChartData()) {
            <p-chart
              type="bar"
              [data]="workloadChartData()"
              [options]="chartOptions"
            ></p-chart>
          }
        </p-card>

        <!-- Risk Flags Table -->
        <p-card class="table-card">
          <ng-template pTemplate="header">
            <h3>Risk Flags</h3>
          </ng-template>
          <p-table
            [value]="riskFlags()"
            [paginator]="true"
            [rows]="10"
            [rowsPerPageOptions]="[10, 25, 50]"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>Player</th>
                <th>Position</th>
                <th>ACWR</th>
                <th>Readiness</th>
                <th>Risk Level</th>
                <th>Actions</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-member>
              <tr>
                <td>{{ member.name }}</td>
                <td>{{ member.position }}</td>
                <td>
                  <span [class]="getACWRClass(member.acwr)">
                    {{ member.acwr | number: "1.2-2" }}
                  </span>
                </td>
                <td>
                  <span [class]="getReadinessClass(member.readiness)">
                    {{ member.readiness }}/100
                  </span>
                </td>
                <td>
                  <p-tag
                    [value]="member.riskFlag | titlecase"
                    [severity]="getRiskSeverity(member.riskFlag)"
                  ></p-tag>
                </td>
                <td>
                  <p-button
                    icon="pi pi-eye"
                    [text]="true"
                    [rounded]="true"
                    ariaLabel="View details"
                  ></p-button>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>

        <!-- Upcoming Fixtures -->
        <p-card class="fixtures-card">
          <ng-template pTemplate="header">
            <h3>Upcoming Fixtures</h3>
          </ng-template>
          <div class="fixtures-list">
            @for (fixture of upcomingFixtures(); track fixture.id) {
              <div class="fixture-item">
                <div class="fixture-date">
                  <div class="fixture-day">{{ fixture.date | date: "d" }}</div>
                  <div class="fixture-month">
                    {{ fixture.date | date: "MMM" }}
                  </div>
                </div>
                <div class="fixture-info">
                  <div class="fixture-title">{{ fixture.opponent }}</div>
                  <div class="fixture-details">
                    <span>{{ fixture.gameType }}</span>
                    @if (fixture.location) {
                      <span> • {{ fixture.location }}</span>
                    }
                  </div>
                </div>
                <p-tag
                  [value]="getFixtureStatus(fixture.date)"
                  [severity]="getFixtureSeverity(fixture.date)"
                ></p-tag>
              </div>
            }
            @if (upcomingFixtures().length === 0) {
              <div class="no-fixtures">
                <p>No upcoming fixtures scheduled</p>
              </div>
            }
          </div>
        </p-card>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .dashboard-content {
        padding: var(--space-6);
      }

      .stats-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
        margin-bottom: var(--space-6);
      }

      .stat-card {
        min-height: 120px;
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        height: 100%;
        justify-content: center;
      }

      .stat-label {
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
        margin-bottom: var(--space-2);
      }

      .stat-value {
        font-size: var(--text-3xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
      }

      .stat-value.risk-value {
        color: var(--color-status-error);
      }

      .stat-subtitle {
        font-size: var(--text-xs);
        color: var(--color-text-secondary);
        margin-top: var(--space-1);
      }

      .chart-card,
      .table-card,
      .fixtures-card {
        margin-bottom: var(--space-6);
      }

      .fixtures-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .fixture-item {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-4);
        border-radius: var(--p-border-radius);
        border: 1px solid var(--p-surface-200);
        transition: background 0.2s;
      }

      .fixture-item:hover {
        background: var(--p-surface-50);
      }

      .fixture-date {
        text-align: center;
        min-width: 60px;
      }

      .fixture-day {
        font-size: var(--text-2xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-brand-primary);
      }

      .fixture-month {
        font-size: var(--text-xs);
        color: var(--color-text-secondary);
        text-transform: uppercase;
      }

      .fixture-info {
        flex: 1;
      }

      .fixture-title {
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        margin-bottom: var(--space-1);
      }

      .fixture-details {
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
      }

      .no-fixtures {
        text-align: center;
        padding: var(--space-6);
        color: var(--color-text-secondary);
      }

      .acwr-green {
        color: var(--color-status-success);
        font-weight: var(--font-weight-semibold);
      }

      .acwr-yellow {
        color: var(--color-status-warning);
        font-weight: var(--font-weight-semibold);
      }

      .acwr-red {
        color: var(--color-status-error);
        font-weight: var(--font-weight-semibold);
      }

      .readiness-high {
        color: var(--color-status-success);
        font-weight: var(--font-weight-semibold);
      }

      .readiness-medium {
        color: var(--color-status-warning);
        font-weight: var(--font-weight-semibold);
      }

      .readiness-low {
        color: var(--color-status-error);
        font-weight: var(--font-weight-semibold);
      }

      @media (max-width: 768px) {
        .stats-row {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `,
  ],
})
export class CoachDashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private headerService = inject(HeaderService);
  private destroyRef = inject(DestroyRef);

  squadSize = signal<number>(0);
  avgWorkload = signal<number>(0);
  squadMembers = signal<SquadMember[]>([]);
  riskFlags = signal<SquadMember[]>([]);
  upcomingFixtures = signal<UpcomingFixture[]>([]);
  workloadChartData = signal<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string;
    }>;
  } | null>(null);

  chartOptions = DEFAULT_CHART_OPTIONS;

  ngOnInit(): void {
    this.headerService.setDashboardHeader();
    this.loadCoachDashboardData();
  }

  loadCoachDashboardData(): void {
    const user = this.authService.getUser();
    const userId = user?.id;

    if (!userId) return;

    // Load squad data
    this.loadSquadData(userId);

    // Load upcoming fixtures
    this.loadUpcomingFixtures(userId);
  }

  loadSquadData(userId: string): void {
    this.apiService
      .get(API_ENDPOINTS.coach.team, { coachId: userId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const members = Array.isArray(response.data) ? response.data : [];
            this.processSquadData(members);
          } else {
            // Mock data for development
            this.loadMockSquadData();
          }
        },
        error: () => {
          this.loadMockSquadData();
        },
      });
  }

  processSquadData(members: unknown[]): void {
    const squadMembers: SquadMember[] = members
      .filter((member): member is Record<string, unknown> => 
        member !== null && typeof member === 'object'
      )
      .map((member) => {
        const memberAcwr = member['acwr'];
        const memberReadiness = member['readiness'];
        const memberId = member['id'];
        const memberUserId = member['user_id'];
        const memberName = member['name'];
        const memberFullName = member['full_name'];
        const memberPosition = member['position'];
        const memberWorkload = member['workload'];
        const memberTodayWorkload = member['today_workload'];
        
        const acwr = typeof memberAcwr === 'number' ? memberAcwr : 1.0;
        const readiness = typeof memberReadiness === 'number' ? memberReadiness : 75;

        let riskFlag: "low" | "medium" | "high" = "low";
        if (acwr > 1.5 || readiness < 55) {
          riskFlag = "high";
        } else if (acwr > 1.3 || readiness < 70) {
          riskFlag = "medium";
        }

        return {
          id: 
            typeof memberId === 'string' ? memberId :
            typeof memberUserId === 'string' ? memberUserId :
            'unknown',
          name: 
            typeof memberName === 'string' ? memberName :
            typeof memberFullName === 'string' ? memberFullName :
            "Unknown",
          position: typeof memberPosition === 'string' ? memberPosition : "N/A",
          workload: 
            typeof memberWorkload === 'number' ? memberWorkload :
            typeof memberTodayWorkload === 'number' ? memberTodayWorkload :
            0,
          acwr,
          readiness,
          riskFlag,
        };
      });

    this.squadMembers.set(squadMembers);
    this.squadSize.set(squadMembers.length);

    // Calculate average workload
    const avg =
      squadMembers.reduce((sum, m) => sum + m.workload, 0) /
      squadMembers.length;
    this.avgWorkload.set(avg || 0);

    // Filter risk flags (medium and high)
    const flags = squadMembers.filter((m) => m.riskFlag !== "low");
    this.riskFlags.set(flags);

    // Create workload distribution chart
    this.createWorkloadChart(squadMembers);
  }

  createWorkloadChart(members: SquadMember[]): void {
    const workloads = members.map((m) => m.workload);
    const labels = members.map((m) => m.name.split(" ")[0]); // First name only

    this.workloadChartData.set({
      labels,
      datasets: [
        {
          label: "Workload (AU)",
          data: workloads,
          backgroundColor: "rgb(var(--ds-primary-green-rgb))",
        },
      ],
    });
  }

  loadUpcomingFixtures(userId: string): void {
    this.apiService
      .get(API_ENDPOINTS.coach.games, { coachId: userId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const fixtures = Array.isArray(response.data) ? response.data : [];
            this.processFixtures(fixtures);
          } else {
            this.loadMockFixtures();
          }
        },
        error: () => {
          this.loadMockFixtures();
        },
      });
  }

  processFixtures(fixtures: unknown[]): void {
    const upcoming: UpcomingFixture[] = fixtures
      .filter((f): f is Record<string, unknown> => 
        f !== null && typeof f === 'object'
      )
      .filter((f) => {
        const dateValue = f['game_start'] || f['date'] || f['game_date'];
        if (!dateValue) return false;
        const date = new Date(String(dateValue));
        return date >= new Date();
      })
      .map((f) => {
        const dateValue = f['game_start'] || f['date'] || f['game_date'];
        const fId = f['id'];
        const fGameId = f['game_id'];
        const fOpponent = f['opponent'];
        const fOpponentName = f['opponent_name'];
        const fLocation = f['location'];
        const fGameType = f['game_type'];
        
        return {
          id: 
            typeof fId === 'string' ? fId :
            typeof fGameId === 'string' ? fGameId :
            'unknown',
          opponent: 
            typeof fOpponent === 'string' ? fOpponent :
            typeof fOpponentName === 'string' ? fOpponentName :
            "TBD",
          date: new Date(String(dateValue)),
          location: typeof fLocation === 'string' ? fLocation : "",
          gameType: typeof fGameType === 'string' ? fGameType : "Game",
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5); // Next 5 fixtures

    this.upcomingFixtures.set(upcoming);
  }

  loadMockSquadData(): void {
    const mockMembers: SquadMember[] = [
      {
        id: "1",
        name: "Alex Johnson",
        position: "QB",
        workload: 450,
        acwr: 1.15,
        readiness: 82,
        riskFlag: "low",
      },
      {
        id: "2",
        name: "Sarah Williams",
        position: "WR",
        workload: 520,
        acwr: 1.45,
        readiness: 68,
        riskFlag: "medium",
      },
      {
        id: "3",
        name: "Mike Davis",
        position: "DB",
        workload: 380,
        acwr: 1.65,
        readiness: 55,
        riskFlag: "high",
      },
      {
        id: "4",
        name: "Chris Brown",
        position: "RB",
        workload: 490,
        acwr: 1.25,
        readiness: 75,
        riskFlag: "low",
      },
    ];

    this.processSquadData(mockMembers);
  }

  loadMockFixtures(): void {
    const mockFixtures: UpcomingFixture[] = [
      {
        id: "1",
        opponent: "Eagles",
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        location: "Home Field",
        gameType: "Regular Season",
      },
      {
        id: "2",
        opponent: "Hawks",
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        location: "Away",
        gameType: "Regular Season",
      },
    ];

    this.upcomingFixtures.set(mockFixtures);
  }

  getACWRClass(acwr: number): string {
    if (acwr > 1.5) return "acwr-red";
    if (acwr > 1.3) return "acwr-yellow";
    return "acwr-green";
  }

  getReadinessClass(readiness: number): string {
    if (readiness >= 75) return "readiness-high";
    if (readiness >= 55) return "readiness-medium";
    return "readiness-low";
  }

  getRiskSeverity(risk: string): "success" | "warn" | "danger" | "info" {
    const severities: Record<string, "success" | "warn" | "danger" | "info"> = {
      low: "success",
      medium: "warn",
      high: "danger",
    };
    return severities[risk] || "info";
  }

  getFixtureStatus(date: Date): string {
    const daysUntil = Math.ceil(
      (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (daysUntil < 0) return "Past";
    if (daysUntil === 0) return "Today";
    if (daysUntil === 1) return "Tomorrow";
    if (daysUntil <= 7) return `${daysUntil} days`;
    return "Upcoming";
  }

  getFixtureSeverity(date: Date): "danger" | "warn" | "info" {
    const daysUntil = Math.ceil(
      (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (daysUntil <= 3) return "danger";
    if (daysUntil <= 7) return "warn";
    return "info";
  }
}
