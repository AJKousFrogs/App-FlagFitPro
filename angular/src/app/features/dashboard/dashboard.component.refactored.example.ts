/**
 * Dashboard Component - Refactored Example
 *
 * This is an example showing how to refactor DashboardComponent
 * to use the new ViewModel pattern.
 *
 * Key Changes:
 * 1. Inject DashboardViewModel instead of ApiService
 * 2. Use view model signals instead of component signals
 * 3. Call viewModel.initialize() instead of manual API calls
 * 4. Template uses view model signals directly
 */

import {
  Component,
  OnInit,
  inject,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";

import { CardModule } from "primeng/card";
import { ChartModule } from "primeng/chart";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { StatsGridComponent } from "../../shared/components/stats-grid/stats-grid.component";
import { PerformanceDashboardComponent } from "../../shared/components/performance-dashboard/performance-dashboard.component";
import { WellnessWidgetComponent } from "../../shared/components/wellness-widget/wellness-widget.component";
import { DEFAULT_CHART_OPTIONS } from "../../shared/config/chart.config";
import { DashboardViewModel } from "../../core/view-models/dashboard.view-model";
import { AuthService } from "../../core/services/auth.service";
import { HeaderService } from "../../core/services/header.service";

@Component({
  selector: "app-dashboard",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardModule,
    ChartModule,
    ButtonModule,
    TagModule,
    MainLayoutComponent,
    PageHeaderComponent,
    StatsGridComponent,
    PerformanceDashboardComponent,
    WellnessWidgetComponent,
  ],
  template: `
    <app-main-layout>
      <div class="dashboard-content">
        <app-page-header
          title="Dashboard"
          subtitle="Welcome back! Here's your performance overview."
        ></app-page-header>

        <!-- Loading State -->
        @if (viewModel.loading()) {
          <div class="loading-state">
            <p>Loading dashboard...</p>
          </div>
        }

        <!-- Error State -->
        @if (viewModel.error()) {
          <div class="error-state">
            <p>Error: {{ viewModel.error() }}</p>
            <p-button label="Retry" (onClick)="viewModel.refresh()"></p-button>
          </div>
        }

        <!-- Dashboard Content -->
        @if (!viewModel.loading() && !viewModel.error()) {
          <app-stats-grid [stats]="stats()"></app-stats-grid>

          <!-- Real-Time Performance Dashboard -->
          <app-performance-dashboard
            [athleteId]="athleteId()"
            [realTimeEnabled]="true"
          >
          </app-performance-dashboard>

          <div class="dashboard-grid">
            <!-- Wellness Widget -->
            <app-wellness-widget></app-wellness-widget>

            <!-- Performance Chart -->
            <p-card class="dashboard-card">
              <ng-template pTemplate="header">
                <h3>Performance Overview</h3>
              </ng-template>
              @if (performanceChartData()) {
                <p-chart
                  type="line"
                  [data]="performanceChartData()"
                  [options]="chartOptions"
                ></p-chart>
              }
            </p-card>

            <!-- Training Chart -->
            <p-card class="dashboard-card">
              <ng-template pTemplate="header">
                <h3>Training Sessions</h3>
              </ng-template>
              @if (trainingChartData()) {
                <p-chart
                  type="bar"
                  [data]="trainingChartData()"
                  [options]="chartOptions"
                ></p-chart>
              }
            </p-card>

            <!-- Recent Activity -->
            <p-card class="dashboard-card">
              <ng-template pTemplate="header">
                <h3>Recent Activity</h3>
              </ng-template>
              <div class="activity-list">
                @for (
                  activity of recentActivity();
                  track trackByActivityId($index, activity)
                ) {
                  <div class="activity-item">
                    <div class="activity-icon">
                      <i [class]="'pi ' + activity.icon"></i>
                    </div>
                    <div class="activity-content">
                      <div class="activity-title">{{ activity.title }}</div>
                      <div class="item-time">{{ activity.time }}</div>
                    </div>
                  </div>
                }
              </div>
            </p-card>

            <!-- Upcoming Sessions -->
            <p-card class="dashboard-card">
              <ng-template pTemplate="header">
                <h3>Upcoming Sessions</h3>
              </ng-template>
              <div class="sessions-list">
                @for (
                  session of upcomingSessions();
                  track trackBySessionId($index, session)
                ) {
                  <div class="session-item">
                    <div class="session-date">
                      <div class="session-day">{{ session.day }}</div>
                      <div class="session-month">{{ session.month }}</div>
                    </div>
                    <div class="session-info">
                      <div class="session-title">{{ session.title }}</div>
                      <div class="session-time">{{ session.time }}</div>
                    </div>
                    <p-tag
                      [value]="session.status"
                      [severity]="getStatusSeverity(session.status)"
                    ></p-tag>
                  </div>
                }
              </div>
            </p-card>
          </div>
        }
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .dashboard-content {
        padding: var(--space-6);
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: var(--space-6);
      }

      .dashboard-card {
        min-height: 300px;
      }

      .loading-state,
      .error-state {
        padding: var(--space-8);
        text-align: center;
      }

      .activity-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .activity-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3);
        border-radius: var(--radius-lg);
        transition: background 0.2s;
      }

      .activity-item:hover {
        background: var(--surface-secondary);
      }

      .activity-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--ds-primary-green-subtle);
        color: var(--ds-primary-green);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .activity-content {
        flex: 1;
      }

      .activity-title {
        font-weight: 600;
        color: var(--color-text-primary);
      }

      .item-time {
        font-size: 0.875rem;
        color: var(--color-text-secondary);
      }

      .sessions-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .session-item {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-3);
        border-radius: var(--radius-lg);
        border: 1px solid var(--color-border-primary);
      }

      .session-date {
        text-align: center;
        min-width: 60px;
      }

      .session-day {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--ds-primary-green);
      }

      .session-month {
        font-size: 0.75rem;
        color: var(--color-text-secondary);
        text-transform: uppercase;
      }

      .session-info {
        flex: 1;
      }

      .session-title {
        font-weight: 600;
        color: var(--color-text-primary);
      }

      .session-time {
        font-size: 0.875rem;
        color: var(--color-text-secondary);
      }
    `,
  ],
})
export class DashboardComponentRefactoredExample implements OnInit {
  // Inject ViewModel instead of ApiService
  protected viewModel = inject(DashboardViewModel);
  private authService = inject(AuthService);
  private headerService = inject(HeaderService);

  // Expose view model signals to template
  readonly stats = this.viewModel.stats;
  readonly loading = this.viewModel.loading;
  readonly error = this.viewModel.error;
  readonly recentActivity = this.viewModel.recentActivity;
  readonly upcomingSessions = this.viewModel.upcomingSessions;
  readonly performanceChartData = this.viewModel.performanceChartData;
  readonly trainingChartData = this.viewModel.trainingChartData;

  // Derived signals from view model
  readonly athleteId = computed(() => {
    const user = this.authService.getUser();
    return user?.id;
  });

  readonly chartOptions = DEFAULT_CHART_OPTIONS;

  ngOnInit(): void {
    // Configure header
    this.headerService.setDashboardHeader();

    // Initialize view model - loads all data
    const user = this.authService.getUser();
    this.viewModel.initialize(user?.id);
  }

  // Helper methods
  trackByActivityId(index: number, activity: { id?: string }): string | number {
    return activity.id || index;
  }

  trackBySessionId(index: number, session: { id?: string }): string | number {
    return session.id || index;
  }

  getStatusSeverity(status: string): string {
    const severityMap: Record<string, string> = {
      scheduled: "info",
      in_progress: "warning",
      completed: "success",
      cancelled: "danger",
    };
    return severityMap[status] || "info";
  }
}

// Note: This is an example file showing the refactored pattern.
// To use this pattern:
// 1. Rename this file to dashboard.component.ts
// 2. Update the class name to DashboardComponent
// 3. Remove the .example suffix from the file name
