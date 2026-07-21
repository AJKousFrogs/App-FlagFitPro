import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, finalize, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoadingComponent } from '../shared/loading.component';
import { ErrorComponent } from '../shared/error.component';

interface AlertSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  acknowledged: number;
  unacknowledged: number;
}

interface AlertHistory {
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface AlertDashboardData {
  summary: AlertSummary;
  history: AlertHistory[];
  topRules: { ruleName: string; count: number; alertType: string }[];
}

@Component({
  selector: 'app-alert-dashboard',
  standalone: true,
  imports: [CommonModule, LoadingComponent, ErrorComponent],
  template: `
    <div class="alert-dashboard-container">
      <h2>Alert Dashboard</h2>

      @if (isLoading()) {
        <app-loading></app-loading>
      }
      @if (error()) {
        <app-error [message]="error()"></app-error>
      }

      @if (!isLoading() && !error() && dashboardData()) {
      <div class="dashboard">
        <!-- Summary Cards -->
        <div class="summary-cards">
          <div class="card total">
            <span class="label">Total Alerts</span>
            <span class="value">{{ dashboardData()?.summary.total || 0 }}</span>
          </div>
          <div class="card critical">
            <span class="label">Critical</span>
            <span class="value">{{ dashboardData()?.summary.critical || 0 }}</span>
          </div>
          <div class="card high">
            <span class="label">High</span>
            <span class="value">{{ dashboardData()?.summary.high || 0 }}</span>
          </div>
          <div class="card medium">
            <span class="label">Medium</span>
            <span class="value">{{ dashboardData()?.summary.medium || 0 }}</span>
          </div>
          <div class="card low">
            <span class="label">Low</span>
            <span class="value">{{ dashboardData()?.summary.low || 0 }}</span>
          </div>
          <div class="card acknowledged">
            <span class="label">Acknowledged</span>
            <span class="value">
              {{ dashboardData()?.summary.acknowledged || 0 }} /
              {{ dashboardData()?.summary.unacknowledged || 0 }}
            </span>
          </div>
        </div>

        <!-- 7-Day Heatmap -->
        <div class="heatmap-section">
          <h3>7-Day Alert Trend</h3>
          <div class="heatmap">
            <div class="heatmap-header">
              <div class="day-label">Date</div>
              @for (entry of dashboardData()?.history; track entry.date) {
              <div class="day-column">
                <span class="day-name">{{ entry.date }}</span>
              </div>
              }
            </div>

            <div class="heatmap-row critical-row">
              <span class="row-label">Critical</span>
              @for (entry of dashboardData()?.history; track entry.date) {
              <div
                class="heatmap-cell"
                [style.opacity]="getHeatmapOpacity(entry.critical)"
                [class.has-data]="entry.critical > 0"
              >
                {{ entry.critical > 0 ? entry.critical : '—' }}
              </div>
              }
            </div>

            <div class="heatmap-row high-row">
              <span class="row-label">High</span>
              @for (entry of dashboardData()?.history; track entry.date) {
              <div
                class="heatmap-cell"
                [style.opacity]="getHeatmapOpacity(entry.high)"
                [class.has-data]="entry.high > 0"
              >
                {{ entry.high > 0 ? entry.high : '—' }}
              </div>
              }
            </div>

            <div class="heatmap-row medium-row">
              <span class="row-label">Medium</span>
              @for (entry of dashboardData()?.history; track entry.date) {
              <div
                class="heatmap-cell"
                [style.opacity]="getHeatmapOpacity(entry.medium)"
                [class.has-data]="entry.medium > 0"
              >
                {{ entry.medium > 0 ? entry.medium : '—' }}
              </div>
              }
            </div>

            <div class="heatmap-row low-row">
              <span class="row-label">Low</span>
              @for (entry of dashboardData()?.history; track entry.date) {
              <div
                class="heatmap-cell"
                [style.opacity]="getHeatmapOpacity(entry.low)"
                [class.has-data]="entry.low > 0"
              >
                {{ entry.low > 0 ? entry.low : '—' }}
              </div>
              }
            </div>
          </div>
        </div>

        <!-- Top Alert Rules -->
        <div class="top-rules-section">
          <h3>Top Alert Rules</h3>
          <table class="top-rules-table">
            <thead>
              <tr>
                <th>Rule Name</th>
                <th>Severity</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              @for (rule of dashboardData()?.topRules; track rule.ruleName) {
              <tr>
                <td>{{ rule.ruleName }}</td>
                <td>
                  <span class="badge" [class]="rule.alertType">
                    {{ rule.alertType.toUpperCase() }}
                  </span>
                </td>
                <td>{{ rule.count }}</td>
              </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .alert-dashboard-container {
        padding: 1rem;
        max-width: 1400px;
        margin: 0 auto;
      }

      .dashboard {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .summary-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
      }

      .card {
        padding: 1rem;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
      }

      .card.total {
        background-color: #2196f3;
      }

      .card.critical {
        background-color: #d32f2f;
      }

      .card.high {
        background-color: #f57c00;
      }

      .card.medium {
        background-color: #fbc02d;
        color: #333;
      }

      .card.low {
        background-color: #1976d2;
      }

      .card.acknowledged {
        background-color: #4caf50;
      }

      .card .label {
        font-size: 0.85rem;
        opacity: 0.9;
        margin-bottom: 0.5rem;
      }

      .card .value {
        font-size: 2rem;
        font-weight: bold;
      }

      .heatmap-section {
        background-color: #f5f5f5;
        padding: 1.5rem;
        border-radius: 8px;
      }

      .heatmap {
        overflow-x: auto;
        margin-top: 1rem;
      }

      .heatmap-header,
      .heatmap-row {
        display: flex;
        gap: 0.5rem;
      }

      .heatmap-header {
        margin-bottom: 1rem;
        font-weight: bold;
      }

      .heatmap-row {
        margin-bottom: 0.5rem;
        align-items: center;
      }

      .day-label,
      .row-label {
        width: 80px;
        min-width: 80px;
        text-align: right;
        font-size: 0.85rem;
      }

      .day-column {
        width: 80px;
        min-width: 80px;
        text-align: center;
      }

      .day-name {
        display: block;
        font-size: 0.75rem;
        font-weight: bold;
      }

      .heatmap-cell {
        width: 80px;
        min-width: 80px;
        padding: 0.5rem;
        border-radius: 4px;
        text-align: center;
        font-size: 0.85rem;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.1s;
      }

      .heatmap-cell:hover {
        transform: scale(1.05);
      }

      .critical-row .heatmap-cell.has-data {
        background-color: #d32f2f;
        color: white;
      }

      .high-row .heatmap-cell.has-data {
        background-color: #f57c00;
        color: white;
      }

      .medium-row .heatmap-cell.has-data {
        background-color: #fbc02d;
        color: #333;
      }

      .low-row .heatmap-cell.has-data {
        background-color: #1976d2;
        color: white;
      }

      .top-rules-section {
        background-color: #f5f5f5;
        padding: 1.5rem;
        border-radius: 8px;
      }

      .top-rules-table {
        width: 100%;
        margin-top: 1rem;
        border-collapse: collapse;
      }

      .top-rules-table thead {
        background-color: #ddd;
        font-weight: bold;
      }

      .top-rules-table th,
      .top-rules-table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #ccc;
      }

      .top-rules-table tbody tr:hover {
        background-color: #eee;
      }

      .badge {
        padding: 0.25rem 0.5rem;
        border-radius: 3px;
        font-size: 0.75rem;
        font-weight: bold;
        color: white;
      }

      .badge.critical {
        background-color: #d32f2f;
      }

      .badge.high {
        background-color: #f57c00;
      }

      .badge.medium {
        background-color: #fbc02d;
        color: #333;
      }

      .badge.low {
        background-color: #1976d2;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertDashboardComponent implements OnInit {
  private http = inject(HttpClient);

  isLoading = signal(false);
  error = signal<string | null>(null);
  dashboardData = signal<AlertDashboardData | null>(null);

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading.set(true);
    this.error.set(null);

    const params = new HttpParams().set('days', '7');

    this.http
      .get<AlertDashboardData>('/api/alert-dashboard', { params })
      .pipe(
        tap((data) => {
          this.dashboardData.set(data);
        }),
        catchError(() => {
          this.error.set('Failed to load dashboard data');
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe();
  }

  getHeatmapOpacity(value: number): string {
    if (value === 0) return '0.1';
    if (value <= 2) return '0.4';
    if (value <= 5) return '0.7';
    return '1.0';
  }
}
