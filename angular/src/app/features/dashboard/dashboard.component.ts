import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MainLayoutComponent } from '../../shared/components/layout/main-layout.component';
import { ApiService, API_ENDPOINTS } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ChartModule,
    ButtonModule,
    TagModule,
    MainLayoutComponent
  ],
  template: `
    <app-main-layout>
      <div class="dashboard-content">
        <h1 class="dashboard-title">Dashboard</h1>

        <div class="stats-grid">
          <p-card *ngFor="let stat of stats()" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" [style.background]="stat.color + '20'" [style.color]="stat.color">
                <i [class]="'pi ' + stat.icon"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
              </div>
            </div>
          </p-card>
        </div>

        <div class="dashboard-grid">
          <p-card class="dashboard-card">
            <ng-template pTemplate="header">
              <h3>Performance Overview</h3>
            </ng-template>
            <p-chart *ngIf="performanceChartData()" type="line" [data]="performanceChartData()" 
                    [options]="chartOptions"></p-chart>
          </p-card>

          <p-card class="dashboard-card">
            <ng-template pTemplate="header">
              <h3>Training Sessions</h3>
            </ng-template>
            <p-chart *ngIf="trainingChartData()" type="bar" [data]="trainingChartData()" 
                    [options]="chartOptions"></p-chart>
          </p-card>

          <p-card class="dashboard-card">
            <ng-template pTemplate="header">
              <h3>Recent Activity</h3>
            </ng-template>
            <div class="activity-list">
              <div *ngFor="let activity of activities()" class="activity-item">
                <div class="activity-icon">
                  <i [class]="'pi ' + activity.icon"></i>
                </div>
                <div class="activity-content">
                  <div class="activity-title">{{ activity.title }}</div>
                  <div class="activity-time">{{ activity.time }}</div>
                </div>
              </div>
            </div>
          </p-card>

          <p-card class="dashboard-card">
            <ng-template pTemplate="header">
              <h3>Upcoming Sessions</h3>
            </ng-template>
            <div class="sessions-list">
              <div *ngFor="let session of upcomingSessions()" class="session-item">
                <div class="session-date">
                  <div class="session-day">{{ session.day }}</div>
                  <div class="session-month">{{ session.month }}</div>
                </div>
                <div class="session-info">
                  <div class="session-title">{{ session.title }}</div>
                  <div class="session-time">{{ session.time }}</div>
                </div>
                <p-tag [value]="session.status" [severity]="getStatusSeverity(session.status)"></p-tag>
              </div>
            </div>
          </p-card>
        </div>
      </div>
    </app-main-layout>
  `,
  styles: [`
    .dashboard-content {
      padding: var(--space-6);
    }

    .dashboard-title {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: var(--space-6);
      color: var(--text-primary);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .stat-card {
      height: 100%;
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .stat-info {
      flex: 1;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: var(--space-6);
    }

    .dashboard-card {
      min-height: 300px;
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
      border-radius: var(--p-border-radius);
      transition: background 0.2s;
    }

    .activity-item:hover {
      background: var(--p-surface-50);
    }

    .activity-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--p-primary-50);
      color: var(--p-primary-600);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .activity-content {
      flex: 1;
    }

    .activity-title {
      font-weight: 600;
      color: var(--text-primary);
    }

    .activity-time {
      font-size: 0.875rem;
      color: var(--text-secondary);
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
      border-radius: var(--p-border-radius);
      border: 1px solid var(--p-surface-200);
    }

    .session-date {
      text-align: center;
      min-width: 60px;
    }

    .session-day {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-brand-primary);
    }

    .session-month {
      font-size: 0.75rem;
      color: var(--text-secondary);
      text-transform: uppercase;
    }

    .session-info {
      flex: 1;
    }

    .session-title {
      font-weight: 600;
      color: var(--text-primary);
    }

    .session-time {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
  `]
})
export class DashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  stats = signal<any[]>([]);
  performanceChartData = signal<any>(null);
  trainingChartData = signal<any>(null);
  activities = signal<any[]>([]);
  upcomingSessions = signal<any[]>([]);

  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true
      }
    }
  };

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    const userId = this.authService.getUser()?.id;

    // Load dashboard overview
    this.apiService.get(API_ENDPOINTS.dashboard.overview, { userId }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.processDashboardData(response.data);
        }
      },
      error: (error) => {
        console.error('Error loading dashboard:', error);
        // Load mock data on error
        this.loadMockData();
      }
    });
  }

  processDashboardData(data: any): void {
    // Process stats
    if (data.stats) {
      this.stats.set(data.stats);
    }

    // Process charts
    if (data.performanceTrends) {
      this.performanceChartData.set({
        labels: data.performanceTrends.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Performance',
          data: data.performanceTrends.data || [65, 72, 80, 85, 90, 88],
          borderColor: '#089949',
          backgroundColor: 'rgba(8, 153, 73, 0.1)'
        }]
      });
    }

    if (data.trainingDistribution) {
      this.trainingChartData.set({
        labels: data.trainingDistribution.labels || ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
          label: 'Sessions',
          data: data.trainingDistribution.data || [12, 15, 18, 16],
          backgroundColor: '#10c96b'
        }]
      });
    }

    // Process activities
    if (data.activities) {
      this.activities.set(data.activities);
    }

    // Process sessions
    if (data.upcomingSessions) {
      this.upcomingSessions.set(data.upcomingSessions);
    }
  }

  loadMockData(): void {
    // Mock stats
    this.stats.set([
      { label: 'Total Sessions', value: '24', icon: 'pi-calendar', color: '#089949' },
      { label: 'Performance Score', value: '85%', icon: 'pi-chart-line', color: '#10c96b' },
      { label: 'Active Streak', value: '7 days', icon: 'pi-fire', color: '#f1c40f' },
      { label: 'Tournaments', value: '3', icon: 'pi-trophy', color: '#cc9610' }
    ]);

    // Mock charts
    this.performanceChartData.set({
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Performance',
        data: [65, 72, 80, 85, 90, 88],
        borderColor: '#089949',
        backgroundColor: 'rgba(8, 153, 73, 0.1)'
      }]
    });

    this.trainingChartData.set({
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [{
        label: 'Sessions',
        data: [12, 15, 18, 16],
        backgroundColor: '#10c96b'
      }]
    });

    // Mock activities
    this.activities.set([
      { title: 'Completed Training Session', time: '2 hours ago', icon: 'pi-check-circle' },
      { title: 'New Tournament Registration', time: '5 hours ago', icon: 'pi-trophy' },
      { title: 'Performance Goal Achieved', time: '1 day ago', icon: 'pi-star' }
    ]);

    // Mock sessions
    this.upcomingSessions.set([
      { day: '15', month: 'Jan', title: 'Speed Training', time: '10:00 AM', status: 'Scheduled' },
      { day: '17', month: 'Jan', title: 'Strength Workout', time: '2:00 PM', status: 'Confirmed' },
      { day: '20', month: 'Jan', title: 'Game Practice', time: '9:00 AM', status: 'Pending' }
    ]);
  }

  getStatusSeverity(status: string): string {
    const statusMap: Record<string, string> = {
      'Scheduled': 'info',
      'Confirmed': 'success',
      'Pending': 'warning',
      'Cancelled': 'danger'
    };
    return statusMap[status] || 'info';
  }
}

