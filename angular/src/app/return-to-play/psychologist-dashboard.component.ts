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

interface PsychologicalAssessment {
  assessment_id: string;
  athlete_id: string;
  athlete_name: string;
  acl_rsi_score: number;
  acl_rsi_ready: boolean;
  tsk_11_score: number;
  tsk_11_ready: boolean;
  confidence_level: number;
  assessment_date: string;
}

interface AthleteReadiness {
  athlete_id: string;
  athlete_name: string;
  position: string;
  overall_readiness: number;
  acl_rsi_status: string;
  tsk_11_status: string;
  latest_assessment: string;
}

interface PsychologistDashboardResponse {
  success: boolean;
  teamReadiness: number;
  athlReady: number;
  needsSupport: number;
  recentAssessments: PsychologicalAssessment[];
  athleteReadinessList: AthleteReadiness[];
}

/**
 * Psychologist Dashboard
 * Route: /staff/psychologist-dashboard
 * Tracks psychological readiness assessments (ACL-RSI, TSK-11 scales),
 * identifies athletes needing psychological support, and monitors trends.
 */
@Component({
  selector: "app-psychologist-dashboard",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="dashboard-container">
      <div class="header">
        <h1>Psychological Readiness Dashboard</h1>
        <p class="subtitle">Monitor athlete mental performance and readiness</p>
      </div>

      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading psychological data...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <i-lucide name="alert-triangle"></i-lucide>
          <p>{{ error() }}</p>
        </div>
      } @else {
        <!-- Key Metrics Cards -->
        <section class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon ready">
              <i-lucide name="check-circle-2"></i-lucide>
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ dashboardData().athlReady }}</div>
              <div class="metric-label">Athletes Ready</div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon warning">
              <i-lucide name="alert-circle"></i-lucide>
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ dashboardData().needsSupport }}</div>
              <div class="metric-label">Needs Support</div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon info">
              <i-lucide name="trending-up"></i-lucide>
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ dashboardData().teamReadiness }}%</div>
              <div class="metric-label">Team Readiness</div>
            </div>
          </div>
        </section>

        <!-- Recent Assessments -->
        <section class="assessments-section">
          <h2>Recent Psychological Assessments</h2>
          <div class="assessments-list">
            @if (dashboardData().recentAssessments.length > 0) {
              @for (assessment of dashboardData().recentAssessments.slice(0, 10); track assessment.assessment_id) {
                <div class="assessment-card">
                  <div class="assessment-header">
                    <h3>{{ assessment.athlete_name }}</h3>
                    <span class="assessment-date">
                      {{ formatDate(assessment.assessment_date) }}
                    </span>
                  </div>

                  <div class="assessment-scores">
                    <div class="score-row">
                      <label for="acl-rsi-{{ assessment.assessment_id }}">ACL-RSI Score:</label>
                      <span class="score-value" id="acl-rsi-{{ assessment.assessment_id }}">{{ assessment.acl_rsi_score }}/56</span>
                      <span [class]="'status-badge ' + (assessment.acl_rsi_ready ? 'ready' : 'caution')">
                        {{ assessment.acl_rsi_ready ? "Ready" : "Monitor" }}
                      </span>
                    </div>

                    <div class="score-row">
                      <label for="tsk-11-{{ assessment.assessment_id }}">TSK-11 Score:</label>
                      <span class="score-value" id="tsk-11-{{ assessment.assessment_id }}">{{ assessment.tsk_11_score }}/55</span>
                      <span [class]="'status-badge ' + (assessment.tsk_11_ready ? 'ready' : 'caution')">
                        {{ assessment.tsk_11_ready ? "Ready" : "Monitor" }}
                      </span>
                    </div>

                    <div class="score-row">
                      <label for="confidence-{{ assessment.assessment_id }}">Confidence Level:</label>
                      <span class="score-value" id="confidence-{{ assessment.assessment_id }}">{{ assessment.confidence_level }}%</span>
                    </div>
                  </div>
                </div>
              }
            } @else {
              <div class="empty-state">
                <i-lucide name="inbox"></i-lucide>
                <p>No recent assessments</p>
              </div>
            }
          </div>
        </section>

        <!-- Athlete Readiness Overview -->
        <section class="readiness-section">
          <h2>Athlete Readiness Overview</h2>
          <div class="readiness-table">
            <table>
              <thead>
                <tr>
                  <th>Athlete</th>
                  <th>Position</th>
                  <th>Overall Readiness</th>
                  <th>ACL-RSI</th>
                  <th>TSK-11</th>
                  <th>Latest Assessment</th>
                </tr>
              </thead>
              <tbody>
                @for (athlete of dashboardData().athleteReadinessList; track athlete.athlete_id) {
                  <tr [class]="'readiness-' + getReadinessClass(athlete.overall_readiness)">
                    <td class="athlete-name">{{ athlete.athlete_name }}</td>
                    <td>{{ athlete.position }}</td>
                    <td class="readiness-score">
                      <div class="progress-bar">
                        <div class="progress-fill" [style.width.%]="athlete.overall_readiness"></div>
                      </div>
                      {{ athlete.overall_readiness }}%
                    </td>
                    <td>
                      <span [class]="'badge ' + athlete.acl_rsi_status">
                        {{ formatStatus(athlete.acl_rsi_status) }}
                      </span>
                    </td>
                    <td>
                      <span [class]="'badge ' + athlete.tsk_11_status">
                        {{ formatStatus(athlete.tsk_11_status) }}
                      </span>
                    </td>
                    <td class="date">{{ formatDate(athlete.latest_assessment) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        <!-- Export Actions -->
        <section class="export-section">
          <button (click)="exportReport()" class="export-btn">
            <i-lucide name="download"></i-lucide>
            Export Psychological Report
          </button>
        </section>
      }
    </div>

    <style>
      .dashboard-container {
        padding: var(--s-4);
        max-width: 1200px;
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

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--s-3);
      }

      .metric-card {
        display: flex;
        align-items: center;
        gap: var(--s-3);
        padding: var(--s-3);
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r-md);
      }

      .metric-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-size: 24px;
      }

      .metric-icon.ready {
        background: color-mix(in srgb, var(--good) 20%, transparent);
        color: var(--good);
      }

      .metric-icon.warning {
        background: color-mix(in srgb, var(--warn) 20%, transparent);
        color: var(--warn);
      }

      .metric-icon.info {
        background: color-mix(in srgb, var(--accent) 20%, transparent);
        color: var(--accent);
      }

      .metric-info {
        flex: 1;
      }

      .metric-value {
        font-size: var(--fs-xl);
        font-weight: var(--fw-bold);
        color: var(--text-strong);
      }

      .metric-label {
        font-size: var(--fs-xs);
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .assessments-section h2,
      .readiness-section h2 {
        margin-bottom: var(--s-3);
        color: var(--text-strong);
        font-weight: var(--fw-bold);
      }

      .assessments-list {
        display: grid;
        gap: var(--s-2);
      }

      .assessment-card {
        padding: var(--s-3);
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r-md);
      }

      .assessment-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--s-2);
      }

      .assessment-header h3 {
        margin: 0;
        color: var(--text-strong);
        font-size: var(--fs-md);
      }

      .assessment-date {
        color: var(--text-muted);
        font-size: var(--fs-sm);
      }

      .assessment-scores {
        display: grid;
        gap: var(--s-2);
      }

      .score-row {
        display: flex;
        align-items: center;
        gap: var(--s-2);
      }

      .score-row label {
        flex: 1;
        color: var(--text-muted);
        font-size: var(--fs-sm);
      }

      .score-value {
        font-weight: var(--fw-bold);
        color: var(--text-strong);
        font-family: var(--font-mono);
        min-width: 60px;
      }

      .status-badge {
        padding: var(--s-1) var(--s-2);
        border-radius: var(--r-sm);
        font-size: var(--fs-xs);
        font-weight: var(--fw-semibold);
      }

      .status-badge.ready {
        background: color-mix(in srgb, var(--good) 20%, transparent);
        color: var(--good);
      }

      .status-badge.caution {
        background: color-mix(in srgb, var(--warn) 20%, transparent);
        color: var(--warn);
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

      .readiness-table {
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

      .athlete-name {
        font-weight: var(--fw-bold);
        color: var(--text-strong);
      }

      .readiness-score {
        display: flex;
        align-items: center;
        gap: var(--s-2);
      }

      .progress-bar {
        width: 80px;
        height: 6px;
        background: var(--border);
        border-radius: 3px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: var(--good);
      }

      .badge {
        display: inline-block;
        padding: var(--s-1) var(--s-2);
        border-radius: var(--r-sm);
        font-size: var(--fs-xs);
        font-weight: var(--fw-semibold);
      }

      .badge.ready {
        background: color-mix(in srgb, var(--good) 20%, transparent);
        color: var(--good);
      }

      .badge.monitor {
        background: color-mix(in srgb, var(--warn) 20%, transparent);
        color: var(--warn);
      }

      .date {
        font-size: var(--fs-xs);
        color: var(--text-muted);
      }

      .export-section {
        display: flex;
        justify-content: flex-end;
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
    </style>
  `,
})
export class PsychologistDashboardComponent {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly dashboardData = signal<PsychologistDashboardResponse>({
    success: false,
    teamReadiness: 0,
    athlReady: 0,
    needsSupport: 0,
    recentAssessments: [],
    athleteReadinessList: [],
  });

  constructor() {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.api.get<PsychologistDashboardResponse>("/api/staff-psychology").subscribe({
      next: (apiResponse) => {
        const response = extractApiPayload<PsychologistDashboardResponse>(
          apiResponse
        );
        if (response) {
          this.dashboardData.set(response);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error("psychologist_dashboard_load_failed", err);
        this.error.set("Failed to load psychological readiness data");
        this.loading.set(false);
      },
    });
  }

  formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  }

  formatStatus(status: string): string {
    const labels: Record<string, string> = {
      ready: "✓ Ready",
      monitor: "⚠ Monitor",
      concern: "⚠ Concern",
    };
    return labels[status] || status;
  }

  getReadinessClass(readiness: number): string {
    if (readiness >= 80) return "high";
    if (readiness >= 60) return "moderate";
    return "low";
  }

  exportReport(): void {
    try {
      const data = this.dashboardData();
      const timestamp = new Date().toLocaleString();

      const html = `
        <html>
          <head>
            <title>Psychological Readiness Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
              h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
              h2 { color: #34495e; margin-top: 30px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th { background: #34495e; color: white; padding: 12px; text-align: left; }
              td { border-bottom: 1px solid #ddd; padding: 10px; }
              .timestamp { color: #7f8c8d; font-size: 0.9em; }
              .summary { margin: 20px 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
              .summary-item { padding: 15px; background: #ecf0f1; border-radius: 5px; }
              .summary-value { font-size: 1.8em; font-weight: bold; color: #2c3e50; }
            </style>
          </head>
          <body>
            <h1>Psychological Readiness Report</h1>
            <p class="timestamp">Generated: ${timestamp}</p>

            <h2>Summary</h2>
            <div class="summary">
              <div class="summary-item">
                <div>Athletes Ready</div>
                <div class="summary-value">${data.athlReady}</div>
              </div>
              <div class="summary-item">
                <div>Needs Support</div>
                <div class="summary-value">${data.needsSupport}</div>
              </div>
              <div class="summary-item">
                <div>Team Readiness</div>
                <div class="summary-value">${data.teamReadiness}%</div>
              </div>
            </div>

            <h2>Recent Assessments</h2>
            <table>
              <thead>
                <tr>
                  <th>Athlete</th>
                  <th>ACL-RSI Score</th>
                  <th>TSK-11 Score</th>
                  <th>Confidence</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${data.recentAssessments
                  .slice(0, 20)
                  .map(
                    (a) => `
                  <tr>
                    <td>${a.athlete_name}</td>
                    <td>${a.acl_rsi_score}/56 ${a.acl_rsi_ready ? "✓" : "⚠"}</td>
                    <td>${a.tsk_11_score}/55 ${a.tsk_11_ready ? "✓" : "⚠"}</td>
                    <td>${a.confidence_level}%</td>
                    <td>${this.formatDate(a.assessment_date)}</td>
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
      a.download = `psychological-report-${new Date().toISOString().split("T")[0]}.html`;
      a.click();
      window.URL.revokeObjectURL(url);

      this.logger.info("psychologist_report_exported", {
        assessmentCount: data.recentAssessments.length,
      });
    } catch (err) {
      this.logger.error("psychologist_report_export_failed", err);
    }
  }
}
