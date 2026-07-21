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

interface InjuryStats {
  total_injuries: number;
  currently_active: number;
  recovering: number;
  returned: number;
  avg_rtp_timeline_days: number;
  rtp_rate_percent: number;
  most_common: Array<{ injury_type: string; count: number }>;
}

interface InjuryTypeRate {
  injury_type: string;
  rtp_rate_percent: number;
  count: number;
  avg_days: number;
}

interface TimelineEntry {
  month: string;
  athletes: Array<{
    athlete_id: string;
    athlete_name: string;
    injury_type: string;
    status: "active" | "recovering" | "rehab" | "returned";
  }>;
}

interface InjuryAnalyticsResponse {
  success: boolean;
  stats: InjuryStats;
  rtpRatesByType: InjuryTypeRate[];
  timeline: TimelineEntry[];
  season: string;
}

/**
 * Coach Injury Analytics Dashboard
 * Route: /staff/injury-analytics
 * Provides comprehensive injury statistics, RTP rates, and timeline analysis.
 * Audience: Head coach, medical staff
 */
@Component({
  selector: "app-injury-analytics",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="analytics-container">
      <div class="header">
        <h1>Injury Analytics</h1>
        <p class="subtitle">Season overview and return-to-play performance</p>
      </div>

      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading injury analytics...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <i-lucide name="alert-triangle"></i-lucide>
          <p>{{ error() }}</p>
        </div>
      } @else {
        <!-- Injury Summary Statistics -->
        <section class="summary-stats">
          <div class="stat-card">
            <span class="label">Total Injuries</span>
            <span class="value">{{ stats().total_injuries }}</span>
          </div>
          <div class="stat-card">
            <span class="label">Currently Active</span>
            <span class="value alert">{{ stats().currently_active }}</span>
          </div>
          <div class="stat-card">
            <span class="label">Recovering</span>
            <span class="value warning">{{ stats().recovering }}</span>
          </div>
          <div class="stat-card">
            <span class="label">Returned</span>
            <span class="value success">{{ stats().returned }}</span>
          </div>
        </section>

        <!-- Key Metrics -->
        <section class="key-metrics">
          <div class="metric-group">
            <div class="metric">
              <span class="label">Average RTP Timeline</span>
              <span class="value">{{ stats().avg_rtp_timeline_days }} days</span>
              <span class="range">(range: 14–180 days)</span>
            </div>
            <div class="metric">
              <span class="label">Return-to-Play Rate</span>
              <span class="value percent">{{ stats().rtp_rate_percent }}%</span>
              <span class="sublabel">
                {{ stats().returned }}/{{ stats().total_injuries }} athletes
              </span>
            </div>
          </div>

          <div class="common-injuries">
            <span class="label">Most Common Injuries</span>
            <div class="injury-list">
              @for (injury of mostCommon(); track injury.injury_type) {
                <div class="injury-item">
                  <span class="type">{{ injury.injury_type }}</span>
                  <span class="count">(n={{ injury.count }})</span>
                </div>
              }
            </div>
          </div>
        </section>

        <!-- Injury Timeline Heatmap -->
        <section class="timeline-section">
          <h3>Injury Timeline (Season Overview)</h3>
          <div class="timeline-info">
            <span class="season">Season: {{ season() }}</span>
          </div>

          <div class="heatmap">
            <div class="timeline-header">
              @for (month of timelineMonths(); track month) {
                <div class="month-header">{{ month }}</div>
              }
            </div>

            <div class="timeline-rows">
              @if (timelineEntries().length > 0) {
                @for (entry of timelineEntries(); track entry.athlete_id) {
                  <div class="timeline-row">
                    <div class="athlete-label">{{ entry.athlete_name }}</div>
                    <div class="timeline-cells">
                      @for (cell of entry.monthCells; track $index) {
                        <div
                          class="timeline-cell"
                          [class]="'status-' + cell"
                          [title]="statusHint(cell)"
                        >
                          {{ statusEmoji(cell) }}
                        </div>
                      }
                    </div>
                  </div>
                }
              } @else {
                <div class="empty">No injury data for this season</div>
              }
            </div>
          </div>

          <div class="timeline-legend">
            <div class="legend-item">
              <span class="emoji">🔴</span>
              <span class="label">Active</span>
            </div>
            <div class="legend-item">
              <span class="emoji">🟠</span>
              <span class="label">Recovering</span>
            </div>
            <div class="legend-item">
              <span class="emoji">🟡</span>
              <span class="label">Rehab</span>
            </div>
            <div class="legend-item">
              <span class="emoji">🟢</span>
              <span class="label">Returned</span>
            </div>
          </div>
        </section>

        <!-- RTP Rate by Injury Type -->
        <section class="rtp-rates">
          <h3>Return-to-Play Rate by Injury Type</h3>
          @if (rtpRates().length > 0) {
            <div class="rates-grid">
              @for (rate of rtpRates(); track rate.injury_type) {
                <div class="rate-card">
                  <div class="rate-header">
                    <span class="injury-type">{{ rate.injury_type }}</span>
                    <span class="count">(n={{ rate.count }})</span>
                  </div>
                  <div class="rate-bar">
                    <div
                      class="filled"
                      [style.width.%]="rate.rtp_rate_percent"
                    ></div>
                  </div>
                  <div class="rate-details">
                    <span class="rate-percent">{{ rate.rtp_rate_percent }}%</span>
                    <span class="avg-days">Avg {{ rate.avg_days }} days</span>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="empty-state">No RTP data available</div>
          }
        </section>

        <!-- Export Section -->
        <section class="export-section">
          <h3>Export Report</h3>
          <div class="export-buttons">
            <button (click)="exportToCSV()" class="btn-export">
              <i-lucide name="download" size="16"></i-lucide>
              Export CSV
            </button>
            <button (click)="exportToPDF()" class="btn-export">
              <i-lucide name="download" size="16"></i-lucide>
              Export PDF
            </button>
          </div>
        </section>
      }
    </div>
  `,
  styles: [
    `
      .analytics-container {
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

      section h3 {
        font-size: var(--fs-md);
        color: var(--text-strong);
        margin: 0 0 var(--s-3) 0;
      }

      /* Summary Stats */
      .summary-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: var(--s-3);
      }

      .stat-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--s-2);
        padding: var(--s-3);
        background: var(--surface);
        border-radius: var(--r-md);
        border: 1px solid var(--border);
      }

      .stat-card .label {
        font-size: var(--fs-xs);
        color: var(--text-faint);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        text-align: center;
      }

      .stat-card .value {
        font-size: var(--fs-xl);
        font-weight: var(--fw-bold);
        color: var(--text-strong);
      }

      .stat-card .value.alert {
        color: var(--danger);
      }

      .stat-card .value.warning {
        color: var(--warn);
      }

      .stat-card .value.success {
        color: var(--good);
      }

      /* Key Metrics */
      .key-metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--s-4);
      }

      .metric-group {
        display: flex;
        flex-direction: column;
        gap: var(--s-3);
      }

      .metric {
        display: flex;
        flex-direction: column;
        gap: var(--s-1);
        padding: var(--s-3);
        background: var(--surface);
        border-radius: var(--r-md);
        border: 1px solid var(--border);
      }

      .metric .label {
        font-size: var(--fs-xs);
        color: var(--text-faint);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .metric .value {
        font-size: var(--fs-lg);
        font-weight: var(--fw-bold);
        color: var(--text-strong);
      }

      .metric .value.percent {
        font-size: var(--fs-xl);
        color: var(--accent);
      }

      .metric .range {
        font-size: var(--fs-xs);
        color: var(--text-muted);
      }

      .metric .sublabel {
        font-size: var(--fs-sm);
        color: var(--text-muted);
      }

      .common-injuries {
        display: flex;
        flex-direction: column;
        gap: var(--s-2);
      }

      .common-injuries .label {
        font-size: var(--fs-xs);
        color: var(--text-faint);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .injury-list {
        display: flex;
        flex-direction: column;
        gap: var(--s-1);
      }

      .injury-item {
        display: flex;
        align-items: center;
        gap: var(--s-2);
        padding: var(--s-2);
        background: var(--surface);
        border-radius: var(--r-sm);
        border: 1px solid var(--border);
        font-size: var(--fs-sm);
      }

      .injury-item .type {
        flex: 1;
        font-weight: var(--fw-bold);
        color: var(--text-strong);
      }

      .injury-item .count {
        color: var(--text-muted);
        font-size: var(--fs-xs);
      }

      /* Timeline */
      .timeline-section {
      }

      .timeline-info {
        margin-bottom: var(--s-3);
      }

      .season {
        font-size: var(--fs-sm);
        color: var(--text-muted);
      }

      .heatmap {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        padding: var(--s-3);
        overflow-x: auto;
      }

      .timeline-header {
        display: flex;
        gap: var(--s-1);
        margin-bottom: var(--s-2);
      }

      .month-header {
        width: 24px;
        font-size: var(--fs-xs);
        text-align: center;
        color: var(--text-faint);
        font-weight: var(--fw-bold);
      }

      .timeline-rows {
        display: flex;
        flex-direction: column;
        gap: var(--s-2);
      }

      .empty {
        text-align: center;
        color: var(--text-muted);
        padding: var(--s-4);
      }

      .timeline-row {
        display: flex;
        align-items: center;
        gap: var(--s-3);
      }

      .athlete-label {
        min-width: 150px;
        font-size: var(--fs-sm);
        color: var(--text-strong);
        font-weight: var(--fw-bold);
      }

      .timeline-cells {
        display: flex;
        gap: var(--s-1);
      }

      .timeline-cell {
        width: 24px;
        height: 24px;
        border-radius: var(--r-sm);
        display: grid;
        place-items: center;
        font-size: var(--fs-xs);
        cursor: pointer;
        transition: transform 0.2s ease;
      }

      .timeline-cell:hover {
        transform: scale(1.1);
      }

      .timeline-cell.status-active {
        background: var(--danger);
      }

      .timeline-cell.status-recovering {
        background: var(--warn);
      }

      .timeline-cell.status-rehab {
        background: color-mix(in srgb, var(--warn) 60%, var(--surface));
      }

      .timeline-cell.status-returned {
        background: var(--good);
      }

      .timeline-cell.status-none {
        background: var(--surface);
        border: 1px solid var(--border);
      }

      .timeline-legend {
        display: flex;
        gap: var(--s-4);
        margin-top: var(--s-3);
        flex-wrap: wrap;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: var(--s-1);
        font-size: var(--fs-xs);
        color: var(--text-muted);
      }

      .emoji {
        font-size: var(--fs-md);
      }

      /* RTP Rates */
      .rtp-rates {
      }

      .rates-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--s-3);
      }

      .rate-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        padding: var(--s-3);
        display: flex;
        flex-direction: column;
        gap: var(--s-2);
      }

      .rate-header {
        display: flex;
        flex-direction: column;
        gap: var(--s-1);
      }

      .rate-header .injury-type {
        font-weight: var(--fw-bold);
        color: var(--text-strong);
        font-size: var(--fs-sm);
      }

      .rate-header .count {
        font-size: var(--fs-xs);
        color: var(--text-faint);
      }

      .rate-bar {
        height: 8px;
        background: var(--surface-2);
        border-radius: var(--r-pill);
        overflow: hidden;
      }

      .rate-bar .filled {
        height: 100%;
        background: linear-gradient(90deg, var(--good), var(--accent));
        border-radius: var(--r-pill);
        transition: width 0.3s ease;
      }

      .rate-details {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: var(--fs-xs);
      }

      .rate-percent {
        font-weight: var(--fw-bold);
        color: var(--text-strong);
      }

      .avg-days {
        color: var(--text-muted);
      }

      /* Export */
      .export-section {
      }

      .export-buttons {
        display: flex;
        gap: var(--s-3);
        flex-wrap: wrap;
      }

      .btn-export {
        display: flex;
        align-items: center;
        gap: var(--s-2);
        padding: var(--s-2) var(--s-4);
        background: var(--accent);
        color: var(--on-accent);
        border: none;
        border-radius: var(--r-md);
        font-weight: var(--fw-bold);
        font-size: var(--fs-sm);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .btn-export:hover {
        background: var(--accent-strong);
      }

      .btn-export:active {
        transform: scale(0.98);
      }
    `,
  ],
})
export class InjuryAnalyticsComponent {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly statsData = signal<InjuryStats | null>(null);
  readonly rtpRatesData = signal<InjuryTypeRate[]>([]);
  readonly timelineData = signal<TimelineEntry[]>([]);
  readonly seasonData = signal<string>("");

  readonly stats = computed(() => this.statsData() || {
    total_injuries: 0,
    currently_active: 0,
    recovering: 0,
    returned: 0,
    avg_rtp_timeline_days: 0,
    rtp_rate_percent: 0,
    most_common: [],
  });

  readonly mostCommon = computed(() => this.stats().most_common || []);
  readonly rtpRates = computed(() => this.rtpRatesData());
  readonly season = computed(() => this.seasonData());

  readonly timelineMonths = computed(() => {
    return [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
  });

  readonly timelineEntries = computed(() => {
    return this.timelineData().map((entry) => ({
      athlete_id: entry.athletes[0]?.athlete_id || "",
      athlete_name: entry.athletes[0]?.athlete_name || entry.month,
      injury_type: entry.athletes[0]?.injury_type || "",
      monthCells: this.generateMonthCells(entry),
    }));
  });

  constructor() {
    this.fetchAnalyticsData();
  }

  private fetchAnalyticsData(): void {
    this.api.get<InjuryAnalyticsResponse>("/api/injury-analytics").subscribe({
      next: (apiResponse) => {
        const response = extractApiPayload<InjuryAnalyticsResponse>(apiResponse);
        if (response) {
          this.statsData.set(response.stats);
          this.rtpRatesData.set(response.rtpRatesByType || []);
          this.timelineData.set(response.timeline || []);
          this.seasonData.set(response.season || "");
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error("injury_analytics_fetch_failed", err);
        this.error.set("Failed to load injury analytics");
        this.loading.set(false);
      },
    });
  }

  private generateMonthCells(entry: TimelineEntry): string[] {
    const cells: string[] = [];
    for (let i = 0; i < 12; i++) {
      const athlete = entry.athletes.find((a) => a.athlete_id === entry.athletes[0]?.athlete_id);
      cells.push(athlete?.status || "none");
    }
    return cells;
  }

  statusEmoji(status: string): string {
    const emojis: Record<string, string> = {
      active: "🔴",
      recovering: "🟠",
      rehab: "🟡",
      returned: "🟢",
      none: "•",
    };
    return emojis[status] || "•";
  }

  statusHint(status: string): string {
    const hints: Record<string, string> = {
      active: "Active injury",
      recovering: "Recovering",
      rehab: "Rehabilitation",
      returned: "Returned to play",
      none: "No injury",
    };
    return hints[status] || "";
  }

  exportToCSV(): void {
    this.logger.info("export_csv_requested");
    alert("CSV export coming soon");
  }

  exportToPDF(): void {
    this.logger.info("export_pdf_requested");
    alert("PDF export coming soon");
  }
}
