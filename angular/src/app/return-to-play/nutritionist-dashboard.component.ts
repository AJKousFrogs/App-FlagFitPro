import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { LucideAngularModule } from "lucide-angular";

import { ApiService } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";
import { extractApiPayload } from "../core/utils/api-response-mapper";

interface AthleteNutritionProfile {
  athlete_id: string;
  athlete_name: string;
  position: string;
  body_weight_kg: number;
  body_fat_percent: number;
  nutrition_status: "optimal" | "caution" | "concern";
  hydration_status: "adequate" | "borderline" | "concerning";
  supplement_compliance: number;
  last_assessment: string;
}

interface NutritionSummary {
  totalAthletes: number;
  optimalNutrition: number;
  cautionCount: number;
  concernCount: number;
  avgSupplementCompliance: number;
}

interface NutritionistDashboardResponse {
  success: boolean;
  summary: NutritionSummary;
  athleteProfiles: AthleteNutritionProfile[];
  recentUpdates: {
    athlete_name: string;
    update_type: string;
    update_date: string;
  }[];
}

/**
 * Nutritionist Dashboard
 * Route: /staff/nutritionist-dashboard
 * Tracks athlete nutrition profiles, body composition, supplement compliance,
 * and hydration status to support personalized nutrition programs.
 */
@Component({
  selector: "app-nutritionist-dashboard",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="dashboard-container">
      <div class="header">
        <h1>Nutritionist Dashboard</h1>
        <p class="subtitle">Monitor athlete nutrition, body composition, and supplement compliance</p>
      </div>

      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading nutrition data...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <i-lucide name="alert-triangle"></i-lucide>
          <p>{{ error() }}</p>
        </div>
      } @else {
        <!-- Summary Cards -->
        <section class="summary-grid">
          <div class="summary-card">
            <div class="card-icon optimal">
              <i-lucide name="apple"></i-lucide>
            </div>
            <div class="card-content">
              <div class="card-value">{{ dashboardData().summary.optimalNutrition }}</div>
              <div class="card-label">Optimal Nutrition</div>
              <div class="card-subtext">{{ totalAthletes() }} athletes</div>
            </div>
          </div>

          <div class="summary-card">
            <div class="card-icon caution">
              <i-lucide name="alert-circle"></i-lucide>
            </div>
            <div class="card-content">
              <div class="card-value">{{ dashboardData().summary.cautionCount }}</div>
              <div class="card-label">Needs Review</div>
              <div class="card-subtext">Monitor closely</div>
            </div>
          </div>

          <div class="summary-card">
            <div class="card-icon concern">
              <i-lucide name="alert-triangle"></i-lucide>
            </div>
            <div class="card-content">
              <div class="card-value">{{ dashboardData().summary.concernCount }}</div>
              <div class="card-label">High Priority</div>
              <div class="card-subtext">Intervention needed</div>
            </div>
          </div>

          <div class="summary-card">
            <div class="card-icon compliance">
              <i-lucide name="check-square"></i-lucide>
            </div>
            <div class="card-content">
              <div class="card-value">{{ dashboardData().summary.avgSupplementCompliance }}%</div>
              <div class="card-label">Avg Compliance</div>
              <div class="card-subtext">Supplement adherence</div>
            </div>
          </div>
        </section>

        <!-- Athlete Nutrition Profiles -->
        <section class="profiles-section">
          <h2>Athlete Nutrition Profiles</h2>
          <div class="profiles-table">
            <table>
              <thead>
                <tr>
                  <th>Athlete</th>
                  <th>Position</th>
                  <th>Body Weight (kg)</th>
                  <th>Body Fat %</th>
                  <th>Nutrition Status</th>
                  <th>Hydration</th>
                  <th>Supplement Compliance</th>
                  <th>Last Assessment</th>
                </tr>
              </thead>
              <tbody>
                @for (athlete of dashboardData().athleteProfiles; track athlete.athlete_id) {
                  <tr [class]="'nutrition-' + athlete.nutrition_status">
                    <td class="athlete-name">{{ athlete.athlete_name }}</td>
                    <td>{{ athlete.position }}</td>
                    <td class="weight">{{ athlete.body_weight_kg | number: "1.1-1" }}</td>
                    <td class="body-fat">{{ athlete.body_fat_percent }}%</td>
                    <td>
                      <span [class]="'badge ' + athlete.nutrition_status">
                        {{ formatNutritionStatus(athlete.nutrition_status) }}
                      </span>
                    </td>
                    <td>
                      <span [class]="'badge ' + athlete.hydration_status">
                        {{ formatHydrationStatus(athlete.hydration_status) }}
                      </span>
                    </td>
                    <td>
                      <div class="compliance-bar">
                        <div class="compliance-fill" [style.width.%]="athlete.supplement_compliance"></div>
                        <span class="compliance-percent">{{ athlete.supplement_compliance }}%</span>
                      </div>
                    </td>
                    <td class="date">{{ formatDate(athlete.last_assessment) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        <!-- Recent Updates -->
        <section class="updates-section">
          <h2>Recent Updates</h2>
          <div class="updates-list">
            @if (dashboardData().recentUpdates.length > 0) {
              @for (update of dashboardData().recentUpdates.slice(0, 15); track update.athlete_name + update.update_date) {
                <div class="update-item">
                  <div class="update-icon">
                    <i-lucide name="info"></i-lucide>
                  </div>
                  <div class="update-content">
                    <p><strong>{{ update.athlete_name }}</strong> – {{ update.update_type }}</p>
                    <span class="update-time">{{ formatDate(update.update_date) }}</span>
                  </div>
                </div>
              }
            } @else {
              <div class="empty-state">
                <i-lucide name="inbox"></i-lucide>
                <p>No recent updates</p>
              </div>
            }
          </div>
        </section>

        <!-- Export Actions -->
        <section class="export-section">
          <button (click)="exportReport()" class="export-btn">
            <i-lucide name="download"></i-lucide>
            Export Nutrition Report
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

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: var(--s-3);
      }

      .summary-card {
        display: flex;
        gap: var(--s-3);
        padding: var(--s-3);
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r-md);
      }

      .card-icon {
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-size: 28px;
        flex-shrink: 0;
      }

      .card-icon.optimal {
        background: color-mix(in srgb, var(--good) 20%, transparent);
        color: var(--good);
      }

      .card-icon.caution {
        background: color-mix(in srgb, var(--warn) 20%, transparent);
        color: var(--warn);
      }

      .card-icon.concern {
        background: color-mix(in srgb, var(--danger) 20%, transparent);
        color: var(--danger);
      }

      .card-icon.compliance {
        background: color-mix(in srgb, var(--accent) 20%, transparent);
        color: var(--accent);
      }

      .card-content {
        flex: 1;
      }

      .card-value {
        font-size: var(--fs-xl);
        font-weight: var(--fw-bold);
        color: var(--text-strong);
      }

      .card-label {
        font-size: var(--fs-sm);
        color: var(--text-muted);
        margin-top: var(--s-1);
      }

      .card-subtext {
        font-size: var(--fs-xs);
        color: var(--text-faint);
      }

      .profiles-section h2,
      .updates-section h2 {
        margin-bottom: var(--s-3);
        color: var(--text-strong);
        font-weight: var(--fw-bold);
      }

      .profiles-table {
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

      .weight,
      .body-fat {
        font-family: var(--font-mono);
      }

      .badge {
        display: inline-block;
        padding: var(--s-1) var(--s-2);
        border-radius: var(--r-sm);
        font-size: var(--fs-xs);
        font-weight: var(--fw-semibold);
      }

      .badge.optimal {
        background: color-mix(in srgb, var(--good) 20%, transparent);
        color: var(--good);
      }

      .badge.caution {
        background: color-mix(in srgb, var(--warn) 20%, transparent);
        color: var(--warn);
      }

      .badge.concern {
        background: color-mix(in srgb, var(--danger) 20%, transparent);
        color: var(--danger);
      }

      .badge.adequate {
        background: color-mix(in srgb, var(--good) 20%, transparent);
        color: var(--good);
      }

      .badge.borderline {
        background: color-mix(in srgb, var(--warn) 20%, transparent);
        color: var(--warn);
      }

      .badge.concerning {
        background: color-mix(in srgb, var(--danger) 20%, transparent);
        color: var(--danger);
      }

      .compliance-bar {
        display: flex;
        align-items: center;
        gap: var(--s-1);
        flex: 1;
      }

      .compliance-fill {
        height: 6px;
        background: var(--accent);
        border-radius: 3px;
        min-width: 40px;
      }

      .compliance-percent {
        font-size: var(--fs-xs);
        color: var(--text-strong);
        font-weight: var(--fw-bold);
        min-width: 40px;
      }

      .date {
        font-size: var(--fs-xs);
        color: var(--text-muted);
      }

      .updates-list {
        display: grid;
        gap: var(--s-2);
      }

      .update-item {
        display: flex;
        gap: var(--s-2);
        padding: var(--s-2);
        background: var(--surface);
        border-left: 3px solid var(--accent);
        border-radius: var(--r-sm);
      }

      .update-icon {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: color-mix(in srgb, var(--accent) 20%, transparent);
        color: var(--accent);
        border-radius: 50%;
        flex-shrink: 0;
      }

      .update-content {
        flex: 1;
      }

      .update-content p {
        margin: 0;
        color: var(--text-muted);
        font-size: var(--fs-sm);
      }

      .update-time {
        display: block;
        font-size: var(--fs-xs);
        color: var(--text-faint);
        margin-top: var(--s-1);
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
export class NutritionistDashboardComponent {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly dashboardData = signal<NutritionistDashboardResponse>({
    success: false,
    summary: {
      totalAthletes: 0,
      optimalNutrition: 0,
      cautionCount: 0,
      concernCount: 0,
      avgSupplementCompliance: 0,
    },
    athleteProfiles: [],
    recentUpdates: [],
  });

  readonly totalAthletes = computed(() => {
    return this.dashboardData().summary.totalAthletes;
  });

  constructor() {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.api.get<NutritionistDashboardResponse>("/api/staff-nutritionist").subscribe({
      next: (apiResponse) => {
        const response = extractApiPayload<NutritionistDashboardResponse>(
          apiResponse
        );
        if (response) {
          this.dashboardData.set(response);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error("nutritionist_dashboard_load_failed", err);
        this.error.set("Failed to load nutrition data");
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

  formatNutritionStatus(status: string): string {
    const labels: Record<string, string> = {
      optimal: "✓ Optimal",
      caution: "⚠ Review",
      concern: "! Concern",
    };
    return labels[status] || status;
  }

  formatHydrationStatus(status: string): string {
    const labels: Record<string, string> = {
      adequate: "✓ Adequate",
      borderline: "⚠ Monitor",
      concerning: "! Concern",
    };
    return labels[status] || status;
  }

  exportReport(): void {
    try {
      const data = this.dashboardData();
      const timestamp = new Date().toLocaleString();

      const html = `
        <html>
          <head>
            <title>Nutrition Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
              h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
              h2 { color: #34495e; margin-top: 30px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th { background: #34495e; color: white; padding: 12px; text-align: left; }
              td { border-bottom: 1px solid #ddd; padding: 10px; }
              .timestamp { color: #7f8c8d; font-size: 0.9em; }
              .summary { margin: 20px 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
              .summary-item { padding: 15px; background: #ecf0f1; border-radius: 5px; }
              .summary-value { font-size: 1.8em; font-weight: bold; color: #2c3e50; }
            </style>
          </head>
          <body>
            <h1>Nutrition Report</h1>
            <p class="timestamp">Generated: ${timestamp}</p>

            <h2>Summary</h2>
            <div class="summary">
              <div class="summary-item">
                <div>Optimal Nutrition</div>
                <div class="summary-value">${data.summary.optimalNutrition}</div>
              </div>
              <div class="summary-item">
                <div>Needs Review</div>
                <div class="summary-value">${data.summary.cautionCount}</div>
              </div>
              <div class="summary-item">
                <div>High Priority</div>
                <div class="summary-value">${data.summary.concernCount}</div>
              </div>
              <div class="summary-item">
                <div>Avg Compliance</div>
                <div class="summary-value">${data.summary.avgSupplementCompliance}%</div>
              </div>
            </div>

            <h2>Athlete Nutrition Profiles</h2>
            <table>
              <thead>
                <tr>
                  <th>Athlete</th>
                  <th>Position</th>
                  <th>Body Weight (kg)</th>
                  <th>Body Fat %</th>
                  <th>Nutrition Status</th>
                  <th>Hydration</th>
                  <th>Supplement Compliance</th>
                </tr>
              </thead>
              <tbody>
                ${data.athleteProfiles
                  .map(
                    (a) => `
                  <tr>
                    <td><strong>${a.athlete_name}</strong></td>
                    <td>${a.position}</td>
                    <td>${a.body_weight_kg.toFixed(1)}</td>
                    <td>${a.body_fat_percent}%</td>
                    <td>${this.formatNutritionStatus(a.nutrition_status)}</td>
                    <td>${this.formatHydrationStatus(a.hydration_status)}</td>
                    <td>${a.supplement_compliance}%</td>
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
      a.download = `nutrition-report-${new Date().toISOString().split("T")[0]}.html`;
      a.click();
      window.URL.revokeObjectURL(url);

      this.logger.info("nutrition_report_exported", {
        athleteCount: data.athleteProfiles.length,
      });
    } catch (err) {
      this.logger.error("nutrition_report_export_failed", err);
    }
  }
}
