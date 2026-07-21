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

interface AcwrAthleteData {
  user_id: string;
  full_name: string;
  position: string;
  acwr_ratio: number | null;
  acwr_status: "red_flag" | "yellow_flag" | "safe" | "underload" | "building_base";
  acute_load_au: number | null;
  chronic_load_au: number | null;
  snapshot_date: string;
}

interface TeamAcwrResponse {
  success: boolean;
  data: AcwrAthleteData[];
  date: string;
  teamSummary: {
    safe: number;
    yellow_flag: number;
    red_flag: number;
    underload: number;
    building_base: number;
  };
}

type DateRangeOption = "1-day" | "7-day" | "2-week";
type PositionFilter = string | "all";

/**
 * Team ACWR Heatmap Dashboard
 * Route: /coach/acwr-team-heatmap
 * Displays real-time ACWR status for all team athletes, grouped by position.
 * Allows coaches to quickly identify athletes at risk (red flag) or underloaded (underload).
 */
@Component({
  selector: "app-team-acwr-heatmap",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="heatmap-container">
      <div class="header">
        <h1>Team Load Status</h1>
        <p class="subtitle">Real-time ACWR monitoring for squad members</p>
      </div>

      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading team data...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <i-lucide name="alert-triangle"></i-lucide>
          <p>{{ error() }}</p>
        </div>
      } @else {
        <!-- Filters Section -->
        <section class="filters">
          <div class="filter-group">
            <label for="dateRange">Date Range</label>
            <div class="date-range-buttons">
              @for (opt of dateRangeOptions; track opt.value) {
                <button
                  id="dateRange"
                  [class.active]="selectedDateRange() === opt.value"
                  (click)="setDateRange(opt.value)"
                  class="filter-btn"
                >
                  {{ opt.label }}
                </button>
              }
            </div>
          </div>

          <div class="filter-group">
            <label for="position">Position</label>
            <div class="position-buttons">
              <button
                id="position"
                [class.active]="selectedPosition() === 'all'"
                (click)="setPosition('all')"
                class="filter-btn"
              >
                All
              </button>
              @for (pos of uniquePositions(); track pos) {
                <button
                  [class.active]="selectedPosition() === pos"
                  (click)="setPosition(pos)"
                  class="filter-btn"
                >
                  {{ pos }}
                </button>
              }
            </div>
          </div>

          <div class="legend">
            <div class="legend-item">
              <span class="badge red"></span>
              <span>Red (ACWR &gt; 1.8)</span>
            </div>
            <div class="legend-item">
              <span class="badge yellow"></span>
              <span>Yellow (1.3–1.8)</span>
            </div>
            <div class="legend-item">
              <span class="badge green"></span>
              <span>Safe (0.8–1.3)</span>
            </div>
            <div class="legend-item">
              <span class="badge underload"></span>
              <span>Underload (&lt;0.8)</span>
            </div>
          </div>

          <div class="export-actions">
            <button (click)="exportToCSV()" class="export-btn">
              <i-lucide name="download"></i-lucide>
              Export CSV
            </button>
            <button (click)="exportToPDF()" class="export-btn">
              <i-lucide name="file-pdf"></i-lucide>
              Export PDF
            </button>
          </div>
        </section>

        <!-- Team Summary Bar -->
        <section class="summary-bar">
          <div class="summary-stat">
            <span class="count">{{ teamSummary().safe }}</span>
            <span class="label">Safe</span>
          </div>
          <div class="summary-stat">
            <span class="count warn">{{ teamSummary().yellow_flag }}</span>
            <span class="label">Yellow</span>
          </div>
          <div class="summary-stat">
            <span class="count danger">{{ teamSummary().red_flag }}</span>
            <span class="label">Red</span>
          </div>
          <div class="summary-stat">
            <span class="count underload">{{ teamSummary().underload }}</span>
            <span class="label">Underload</span>
          </div>
        </section>

        <!-- Heatmap Table -->
        @if (filteredData().length > 0) {
          <section class="heatmap-table">
            <table>
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Athlete</th>
                  <th class="acwr-col">ACWR</th>
                  <th class="status-col">Status</th>
                  <th class="loads-col">Acute / Chronic</th>
                </tr>
              </thead>
              <tbody>
                @for (athlete of filteredData(); track athlete.user_id) {
                  <tr [class]="'status-' + athlete.acwr_status">
                    <td class="position">{{ athlete.position }}</td>
                    <td class="athlete-name">{{ athlete.full_name }}</td>
                    <td class="acwr-value">
                      @if (athlete.acwr_ratio !== null) {
                        {{ athlete.acwr_ratio.toFixed(2) }}
                      } @else {
                        —
                      }
                    </td>
                    <td class="status-badge">
                      <span [class]="'badge ' + athlete.acwr_status">
                        {{ statusLabel(athlete.acwr_status) }}
                      </span>
                    </td>
                    <td class="loads">
                      @if (athlete.acute_load_au !== null && athlete.chronic_load_au !== null) {
                        {{ athlete.acute_load_au.toFixed(0) }} / {{ athlete.chronic_load_au.toFixed(0) }} AU
                      } @else {
                        — AU
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </section>
        } @else {
          <div class="empty-state">
            <p>No athletes match the selected filters</p>
          </div>
        }

        <div class="data-info">
          <p class="text-muted">
            Last updated: {{ lastUpdated() }}
          </p>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .heatmap-container {
        max-width: 1400px;
        margin: 0 auto;
        padding: var(--s-5);
        background: var(--surface);
        min-height: 100vh;
      }

      .header {
        margin-bottom: var(--s-6);
      }

      .header h1 {
        font-size: var(--fs-xl);
        color: var(--text-strong);
        margin: 0 0 var(--s-2) 0;
      }

      .subtitle {
        color: var(--text-muted);
        font-size: var(--fs-sm);
        margin: 0;
      }

      .loading,
      .error-state,
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 300px;
        gap: var(--s-3);
        color: var(--text-muted);
      }

      .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid var(--surface-2);
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
        color: var(--danger);
        gap: var(--s-2);
      }

      section {
        background: var(--surface-2);
        border: 1px solid var(--border);
        border-radius: var(--r-lg);
        padding: var(--s-4);
        margin-bottom: var(--s-5);
      }

      /* Filters */
      .filters {
        display: flex;
        flex-direction: column;
        gap: var(--s-4);
      }

      .filter-group {
        display: flex;
        flex-direction: column;
        gap: var(--s-2);
      }

      .filter-group label {
        font-size: var(--fs-sm);
        font-weight: var(--fw-bold);
        color: var(--text-strong);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .date-range-buttons,
      .position-buttons {
        display: flex;
        gap: var(--s-2);
        flex-wrap: wrap;
      }

      .filter-btn {
        padding: var(--s-2) var(--s-3);
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--text-muted);
        border-radius: var(--r-md);
        cursor: pointer;
        font-size: var(--fs-sm);
        transition: all 0.2s ease;
      }

      .filter-btn:hover {
        border-color: var(--accent);
        color: var(--text-strong);
      }

      .filter-btn.active {
        background: var(--accent);
        color: var(--on-accent);
        border-color: var(--accent);
      }

      .legend {
        display: flex;
        gap: var(--s-3);
        flex-wrap: wrap;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: var(--s-2);
        font-size: var(--fs-sm);
        color: var(--text-muted);
      }

      .badge {
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }

      .badge.red {
        background: var(--danger);
      }

      .badge.yellow {
        background: var(--warn);
      }

      .badge.green {
        background: var(--good);
      }

      .badge.underload {
        background: var(--info);
      }

      .export-actions {
        display: flex;
        gap: var(--s-2);
        flex-wrap: wrap;
        margin-top: var(--s-3);
        padding-top: var(--s-3);
        border-top: 1px solid var(--border);
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

      .export-btn:active {
        transform: translateY(0);
      }

      /* Summary Bar */
      .summary-bar {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        gap: var(--s-3);
      }

      .summary-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--s-1);
        padding: var(--s-3);
        background: var(--surface);
        border-radius: var(--r-md);
        border: 1px solid var(--border);
      }

      .summary-stat .count {
        font-size: var(--fs-xl);
        font-weight: var(--fw-bold);
        color: var(--text-strong);
      }

      .summary-stat .count.warn {
        color: var(--warn);
      }

      .summary-stat .count.danger {
        color: var(--danger);
      }

      .summary-stat .count.underload {
        color: var(--info);
      }

      .summary-stat .label {
        font-size: var(--fs-xs);
        color: var(--text-faint);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      /* Heatmap Table */
      .heatmap-table {
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

      th.acwr-col,
      th.status-col,
      th.loads-col {
        text-align: center;
      }

      tbody tr {
        border-bottom: 1px solid var(--border);
        transition: background-color 0.2s ease;
      }

      tbody tr:hover {
        background: color-mix(in srgb, var(--accent) 5%, transparent);
      }

      tbody tr.status-red_flag {
        --row-stripe: var(--danger);
      }

      tbody tr.status-yellow_flag {
        --row-stripe: var(--warn);
      }

      tbody tr.status-safe {
        --row-stripe: var(--good);
      }

      tbody tr.status-underload {
        --row-stripe: var(--info);
      }

      tbody tr.status-building_base {
        --row-stripe: var(--text-faint);
      }

      tbody tr::before {
        content: "";
        position: absolute;
        left: 0;
        width: 3px;
        height: 100%;
        background: var(--row-stripe);
      }

      td {
        padding: var(--s-3);
        color: var(--text-muted);
      }

      td.position {
        font-weight: var(--fw-bold);
        color: var(--text-strong);
        min-width: 80px;
      }

      td.athlete-name {
        font-weight: var(--fw-bold);
        color: var(--text-strong);
      }

      td.acwr-value {
        text-align: center;
        font-family: var(--font-mono);
        font-size: var(--fs-md);
        font-weight: var(--fw-bold);
        color: var(--text-strong);
      }

      td.status-badge {
        text-align: center;
      }

      td.loads {
        text-align: right;
        font-family: var(--font-mono);
      }

      .badge {
        display: inline-block;
        padding: var(--s-1) var(--s-2);
        border-radius: var(--r-sm);
        font-size: var(--fs-xs);
        font-weight: var(--fw-bold);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .badge.red_flag {
        background: color-mix(in srgb, var(--danger) 20%, transparent);
        color: var(--danger);
      }

      .badge.yellow_flag {
        background: color-mix(in srgb, var(--warn) 20%, transparent);
        color: var(--warn);
      }

      .badge.safe {
        background: color-mix(in srgb, var(--good) 20%, transparent);
        color: var(--good);
      }

      .badge.underload {
        background: color-mix(in srgb, var(--info) 20%, transparent);
        color: var(--info);
      }

      .badge.building_base {
        background: color-mix(in srgb, var(--text-faint) 20%, transparent);
        color: var(--text-faint);
      }

      /* Data Info */
      .data-info {
        text-align: center;
        color: var(--text-faint);
        font-size: var(--fs-xs);
      }

      .text-muted {
        color: var(--text-muted);
      }
    `,
  ],
})
export class TeamAcwrHeatmapComponent {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly athleteData = signal<AcwrAthleteData[]>([]);

  readonly selectedDateRange = signal<DateRangeOption>("7-day");
  readonly selectedPosition = signal<PositionFilter>("all");
  readonly lastUpdatedTime = signal<string>("");

  readonly dateRangeOptions = [
    { value: "1-day" as DateRangeOption, label: "Today" },
    { value: "7-day" as DateRangeOption, label: "Last 7 days" },
    { value: "2-week" as DateRangeOption, label: "Last 2 weeks" },
  ];

  readonly teamSummary = computed(() => {
    return this.athleteData().reduce(
      (acc, athlete) => {
        if (athlete.acwr_status === "red_flag") acc.red_flag++;
        else if (athlete.acwr_status === "yellow_flag") acc.yellow_flag++;
        else if (athlete.acwr_status === "safe") acc.safe++;
        else if (athlete.acwr_status === "underload") acc.underload++;
        else if (athlete.acwr_status === "building_base") acc.building_base++;
        return acc;
      },
      { safe: 0, yellow_flag: 0, red_flag: 0, underload: 0, building_base: 0 }
    );
  });

  readonly uniquePositions = computed(() => {
    const positions = new Set(this.athleteData().map((a) => a.position));
    return Array.from(positions).sort();
  });

  readonly filteredData = computed(() => {
    let data = this.athleteData();

    if (this.selectedPosition() !== "all") {
      data = data.filter((a) => a.position === this.selectedPosition());
    }

    return data;
  });

  readonly lastUpdated = computed(() => {
    if (this.lastUpdatedTime()) {
      const date = new Date(this.lastUpdatedTime());
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
    return "—";
  });

  constructor() {
    this.fetchTeamAcwr();
  }

  private fetchTeamAcwr(): void {
    this.api.get<TeamAcwrResponse>("/api/team-acwr").subscribe({
      next: (apiResponse) => {
        const response = extractApiPayload<TeamAcwrResponse>(apiResponse);
        if (response?.data) {
          this.athleteData.set(response.data);
          this.lastUpdatedTime.set(response.date);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error("team_acwr_fetch_failed", err);
        this.error.set("Failed to load team ACWR data");
        this.loading.set(false);
      },
    });
  }

  setDateRange(range: DateRangeOption): void {
    this.selectedDateRange.set(range);
  }

  setPosition(position: PositionFilter): void {
    this.selectedPosition.set(position);
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      red_flag: "🔴 Red",
      yellow_flag: "🟡 Yellow",
      safe: "🟢 Safe",
      underload: "🟡 Underload",
      building_base: "— Building",
    };
    return labels[status] || status;
  }

  exportToCSV(): void {
    try {
      const summary = this.teamSummary();
      const timestamp = new Date().toLocaleString();

      let csv = "TEAM ACWR HEATMAP REPORT\n";
      csv += `Date: ${timestamp}\n`;
      csv += `Date Range: ${this.selectedDateRange()}\n`;
      csv += `Position Filter: ${this.selectedPosition()}\n\n`;

      csv += "SUMMARY STATISTICS\n";
      csv += "Status,Count\n";
      csv += `Safe,${summary.safe}\n`;
      csv += `Yellow Flag,${summary.yellow_flag}\n`;
      csv += `Red Flag,${summary.red_flag}\n`;
      csv += `Underload,${summary.underload}\n`;
      csv += `Building Base,${summary.building_base}\n\n`;

      csv += "ATHLETE LOAD DATA\n";
      csv +=
        "Name,Position,ACWR Ratio,Acute Load (AU),Chronic Load (AU),Status\n";

      this.filteredData().forEach((athlete) => {
        const name = athlete.full_name || "Unknown";
        const acwr = athlete.acwr_ratio ?? "—";
        const acute = athlete.acute_load_au ?? "—";
        const chronic = athlete.chronic_load_au ?? "—";
        const status = this.statusLabel(athlete.acwr_status);

        csv += `"${name}",${athlete.position},${acwr},${acute},${chronic},"${status}"\n`;
      });

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `team-acwr-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      this.logger.info("team_acwr_export_csv_success", {
        rowCount: this.filteredData().length,
      });
    } catch (err) {
      this.logger.error("team_acwr_export_csv_failed", err);
    }
  }

  exportToPDF(): void {
    try {
      const summary = this.teamSummary();
      const timestamp = new Date().toLocaleString();

      const html = `
        <html>
          <head>
            <title>Team ACWR Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
              h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
              h2 { color: #34495e; margin-top: 30px; }
              .summary { margin: 20px 0; }
              .summary-item { display: inline-block; margin-right: 30px; }
              .summary-item .label { font-weight: bold; color: #555; }
              .summary-item .value { font-size: 1.5em; color: #2c3e50; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th { background: #34495e; color: white; padding: 12px; text-align: left; }
              td { border-bottom: 1px solid #ddd; padding: 10px; }
              tr:hover { background: #f5f5f5; }
              .timestamp { color: #7f8c8d; font-size: 0.9em; }
            </style>
          </head>
          <body>
            <h1>Team ACWR Heatmap Report</h1>
            <p class="timestamp">Generated: ${timestamp}</p>
            <p>Date Range: <strong>${this.selectedDateRange()}</strong> | Position: <strong>${this.selectedPosition()}</strong></p>

            <h2>Summary Statistics</h2>
            <div class="summary">
              <div class="summary-item">
                <div class="label">Safe</div>
                <div class="value">${summary.safe}</div>
              </div>
              <div class="summary-item">
                <div class="label">Yellow Flag</div>
                <div class="value">${summary.yellow_flag}</div>
              </div>
              <div class="summary-item">
                <div class="label">Red Flag</div>
                <div class="value">${summary.red_flag}</div>
              </div>
              <div class="summary-item">
                <div class="label">Underload</div>
                <div class="value">${summary.underload}</div>
              </div>
              <div class="summary-item">
                <div class="label">Building Base</div>
                <div class="value">${summary.building_base}</div>
              </div>
            </div>

            <h2>Athlete Load Data</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Position</th>
                  <th>ACWR Ratio</th>
                  <th>Acute Load (AU)</th>
                  <th>Chronic Load (AU)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${this.filteredData()
                  .map(
                    (athlete) => `
                  <tr>
                    <td>${athlete.full_name || "Unknown"}</td>
                    <td>${athlete.position}</td>
                    <td>${athlete.acwr_ratio?.toFixed(2) ?? "—"}</td>
                    <td>${athlete.acute_load_au ?? "—"}</td>
                    <td>${athlete.chronic_load_au ?? "—"}</td>
                    <td>${this.statusLabel(athlete.acwr_status)}</td>
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
      a.download = `team-acwr-${new Date().toISOString().split("T")[0]}.html`;
      a.click();
      window.URL.revokeObjectURL(url);

      this.logger.info("team_acwr_export_pdf_success", {
        rowCount: this.filteredData().length,
      });
    } catch (err) {
      this.logger.error("team_acwr_export_pdf_failed", err);
    }
  }
}
