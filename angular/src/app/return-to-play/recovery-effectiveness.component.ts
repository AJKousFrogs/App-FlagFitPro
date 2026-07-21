import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { LucideAngularModule } from "lucide-angular";

import { ApiService } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";
import { extractApiPayload } from "../core/utils/api-response-mapper";

interface ModalityEffectiveness {
  modality_name: string;
  usage_count: number;
  avg_effectiveness: number;
  std_dev?: number;
  trend?: number;
}

interface DomainEffectiveness {
  domain: string;
  top_modality: string;
  avg_score: number;
  trend?: string;
}

interface EffectivenessResponse {
  success: boolean;
  timeframe: string;
  modalities: ModalityEffectiveness[];
  domains: DomainEffectiveness[];
  acwrCorrelation?: Record<string, { name: string; score: number; count: number }[]>;
}

type TimeframeOption = "1-week" | "2-week" | "4-week";

/**
 * Recovery Modality Effectiveness Dashboard
 * Route: /athlete/recovery-effectiveness or /coach/recovery-insights
 * Tracks which recovery modalities are most effective for this athlete.
 * Helps personalize recovery protocols based on effectiveness data.
 */
@Component({
  selector: "app-recovery-effectiveness",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="effectiveness-container">
      <div class="header">
        <h1>Recovery Modality Effectiveness</h1>
        <p class="subtitle">Track which recovery methods work best for you</p>
      </div>

      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading effectiveness data...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <i-lucide name="alert-triangle"></i-lucide>
          <p>{{ error() }}</p>
        </div>
      } @else {
        <!-- Filters -->
        <section class="filters">
          <div class="filter-group">
            <label for="timeframe">Time Period</label>
            <div class="timeframe-buttons">
              @for (opt of timeframeOptions; track opt.value) {
                <button
                  id="timeframe"
                  [class.active]="selectedTimeframe() === opt.value"
                  (click)="setTimeframe(opt.value)"
                  class="filter-btn"
                >
                  {{ opt.label }}
                </button>
              }
            </div>
          </div>
        </section>

        <!-- Modality Effectiveness Table -->
        <section class="modality-table">
          <h3>Modality Effectiveness</h3>
          @if (sortedModalities().length > 0) {
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Modality</th>
                    <th class="numeric">Usage</th>
                    <th class="numeric">Avg Effectiveness</th>
                    <th class="numeric">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  @for (mod of sortedModalities(); track mod.modality_name) {
                    <tr>
                      <td class="modality-name">{{ mod.modality_name }}</td>
                      <td class="numeric">{{ mod.usage_count }}×</td>
                      <td class="numeric">
                        <div class="effectiveness-display">
                          <div class="bar-mini">
                            <div
                              class="filled"
                              [style.width.%]="(mod.avg_effectiveness / 10) * 100"
                            ></div>
                          </div>
                          <span class="score">{{ mod.avg_effectiveness.toFixed(1) }}/10</span>
                        </div>
                      </td>
                      <td class="numeric trend">
                        @if (mod.trend !== undefined && mod.trend !== 0) {
                          <span [class]="mod.trend > 0 ? 'up' : 'down'">
                            {{ mod.trend > 0 ? '↑' : '↓' }} {{ Math.abs(mod.trend).toFixed(1) }}
                          </span>
                        } @else {
                          <span class="neutral">—</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="empty-state">
              <p>No recovery logs yet. Add one below!</p>
            </div>
          }
        </section>

        <!-- Effectiveness by Domain -->
        @if (domainsData().length > 0) {
          <section class="domain-breakdown">
            <h3>Effectiveness by Recovery Domain</h3>
            <div class="domain-grid">
              @for (domain of domainsData(); track domain.domain) {
                <div class="domain-card">
                  <div class="domain-header">
                    <h4>{{ domain.domain }}</h4>
                  </div>
                  <div class="domain-content">
                    <p class="top-modality">
                      <strong>Top:</strong> {{ domain.top_modality }}
                    </p>
                    <div class="score-display">
                      <div class="bar-mini">
                        <div
                          class="filled"
                          [style.width.%]="(domain.avg_score / 10) * 100"
                        ></div>
                      </div>
                      <span class="score">{{ domain.avg_score.toFixed(1) }}/10</span>
                    </div>
                    @if (domain.trend) {
                      <p class="trend-label" [class]="domain.trend.includes('↑') ? 'up' : 'down'">
                        {{ domain.trend }}
                      </p>
                    }
                  </div>
                </div>
              }
            </div>
          </section>
        }

        <!-- ACWR Correlation -->
        @if (acwrCorrelation().size > 0) {
          <section class="acwr-correlation">
            <h3>Effectiveness by Training Load Status</h3>
            <div class="correlation-grid">
              @for (status of acwrStatuses(); track status) {
                <div class="correlation-card">
                  <h4 [class]="'status-' + status">
                    {{ acwrStatusLabel(status) }}
                  </h4>
                  <div class="modality-list">
                    @for (
                      rec of acwrCorrelation().get(status) || [];
                      track rec.name;
                      let idx = $index
                    ) {
                      @if (idx < 3) {
                        <div class="modality-item">
                          <span class="rank">{{ idx + 1 }}.</span>
                          <span class="name">{{ rec.name }}</span>
                          <span class="score">{{ rec.score.toFixed(1) }}/10</span>
                          <span class="count">(n={{ rec.count }})</span>
                        </div>
                      }
                    }
                  </div>
                </div>
              }
            </div>
          </section>
        }

        <!-- Log Recovery Form -->
        <section class="log-recovery">
          <h3>Log Recovery Session</h3>
          <form (ngSubmit)="submitRecoveryLog()" #recoveryForm="ngForm">
            <div class="form-row">
              <div class="form-group">
                <label for="modality">Modality</label>
                <select
                  id="modality"
                  [(ngModel)]="selectedModality"
                  name="modality"
                  class="form-control"
                >
                  <option value="">Select a modality...</option>
                  @for (mod of availableModalities(); track mod) {
                    <option [value]="mod">
                      {{ mod }}
                    </option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label for="logDate">Date</label>
                <input
                  id="logDate"
                  type="date"
                  [(ngModel)]="logDate"
                  name="logDate"
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <label for="effectiveness">Effectiveness (1-10)</label>
                <div class="effectiveness-input">
                  <input
                    id="effectiveness"
                    type="range"
                    min="1"
                    max="10"
                    [(ngModel)]="effectiveness"
                    name="effectiveness"
                    class="slider"
                  />
                  <span class="value">{{ effectiveness() }}/10</span>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button
                type="submit"
                [disabled]="submitting() || !selectedModality()"
                class="btn-primary"
              >
                {{ submitting() ? "Logging..." : "Log Session" }}
              </button>
            </div>

            @if (submitMessage()) {
              <div class="message" [class.error]="isError()">
                {{ submitMessage() }}
              </div>
            }
          </form>
        </section>
      }
    </div>
  `,
  styles: [
    `
      .effectiveness-container {
        max-width: 1200px;
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

      /* Filters */
      .filters {
        display: flex;
        gap: var(--s-4);
        flex-wrap: wrap;
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

      .timeframe-buttons {
        display: flex;
        gap: var(--s-2);
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

      /* Table */
      .table-container {
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

      th.numeric {
        text-align: right;
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

      td.modality-name {
        font-weight: var(--fw-bold);
        color: var(--text-strong);
      }

      td.numeric {
        text-align: right;
      }

      .effectiveness-display {
        display: flex;
        align-items: center;
        gap: var(--s-2);
        justify-content: flex-end;
      }

      .bar-mini {
        width: 80px;
        height: 6px;
        background: var(--surface);
        border-radius: var(--r-pill);
        overflow: hidden;
      }

      .bar-mini .filled {
        height: 100%;
        background: var(--accent);
        border-radius: var(--r-pill);
        transition: width 0.3s ease;
      }

      .score {
        font-weight: var(--fw-bold);
        color: var(--text-strong);
        min-width: 50px;
        text-align: right;
      }

      .trend {
        font-size: var(--fs-xs);
      }

      .trend.up {
        color: var(--good);
      }

      .trend.down {
        color: var(--warn);
      }

      .trend.neutral {
        color: var(--text-faint);
      }

      /* Domain Breakdown */
      .domain-breakdown {
      }

      .domain-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--s-3);
      }

      .domain-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        padding: var(--s-3);
        display: flex;
        flex-direction: column;
        gap: var(--s-2);
      }

      .domain-header h4 {
        margin: 0;
        font-size: var(--fs-sm);
        color: var(--text-strong);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .domain-content {
        display: flex;
        flex-direction: column;
        gap: var(--s-2);
      }

      .top-modality {
        margin: 0;
        font-size: var(--fs-sm);
        color: var(--text-muted);
      }

      .score-display {
        display: flex;
        align-items: center;
        gap: var(--s-2);
      }

      .trend-label {
        margin: 0;
        font-size: var(--fs-xs);
        font-weight: var(--fw-bold);
      }

      .trend-label.up {
        color: var(--good);
      }

      .trend-label.down {
        color: var(--warn);
      }

      /* ACWR Correlation */
      .acwr-correlation {
      }

      .correlation-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--s-3);
      }

      .correlation-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        padding: var(--s-3);
      }

      .correlation-card h4 {
        margin: 0 0 var(--s-2) 0;
        font-size: var(--fs-sm);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .correlation-card h4.status-red_flag {
        color: var(--danger);
      }

      .correlation-card h4.status-yellow_flag {
        color: var(--warn);
      }

      .correlation-card h4.status-safe {
        color: var(--good);
      }

      .modality-list {
        display: flex;
        flex-direction: column;
        gap: var(--s-2);
      }

      .modality-item {
        display: flex;
        align-items: center;
        gap: var(--s-2);
        font-size: var(--fs-xs);
        padding: var(--s-2);
        background: color-mix(in srgb, var(--surface-2) 80%, transparent);
        border-radius: var(--r-sm);
      }

      .rank {
        font-weight: var(--fw-bold);
        color: var(--accent);
        min-width: 20px;
      }

      .name {
        flex: 1;
        color: var(--text-strong);
        font-weight: var(--fw-bold);
      }

      .count {
        color: var(--text-faint);
      }

      /* Recovery Log Form */
      .log-recovery {
      }

      .form-row {
        display: flex;
        gap: var(--s-3);
        flex-wrap: wrap;
        margin-bottom: var(--s-4);
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--s-2);
        flex: 1;
        min-width: 200px;
      }

      .form-group label {
        font-weight: var(--fw-bold);
        color: var(--text-strong);
        font-size: var(--fs-sm);
      }

      .form-control {
        padding: var(--s-2);
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        background: var(--surface);
        color: var(--text-strong);
        font-family: var(--font-body);
        font-size: var(--fs-sm);
      }

      .form-control:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent);
      }

      .effectiveness-input {
        display: flex;
        align-items: center;
        gap: var(--s-3);
      }

      .slider {
        flex: 1;
        height: 6px;
        border-radius: var(--r-pill);
        background: var(--surface);
        outline: none;
        -webkit-appearance: none;
        appearance: none;
      }

      .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--accent);
        cursor: pointer;
        border: 2px solid var(--surface);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .slider::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--accent);
        cursor: pointer;
        border: 2px solid var(--surface);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .form-actions {
        display: flex;
        gap: var(--s-3);
        margin-bottom: var(--s-4);
      }

      .btn-primary {
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

      .btn-primary:hover:not(:disabled) {
        background: var(--accent-strong);
      }

      .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .message {
        padding: var(--s-3);
        border-radius: var(--r-md);
        background: color-mix(in srgb, var(--good) 20%, transparent);
        color: var(--good);
        font-size: var(--fs-sm);
        border: 1px solid color-mix(in srgb, var(--good) 40%, transparent);
      }

      .message.error {
        background: color-mix(in srgb, var(--danger) 20%, transparent);
        color: var(--danger);
        border-color: color-mix(in srgb, var(--danger) 40%, transparent);
      }
    `,
  ],
})
export class RecoveryEffectivenessComponent {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  readonly Math = Math;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly modalitiesData = signal<ModalityEffectiveness[]>([]);
  readonly domainsData = signal<DomainEffectiveness[]>([]);
  readonly acwrCorrelationData = signal<Record<string, { name: string; score: number; count: number }[]>>({});

  readonly selectedTimeframe = signal<TimeframeOption>("4-week");
  readonly selectedModality = signal("");
  readonly logDate = signal(new Date().toISOString().slice(0, 10));
  readonly effectiveness = signal(7);
  readonly submitting = signal(false);
  readonly submitMessage = signal<string | null>(null);
  readonly isError = signal(false);

  readonly timeframeOptions = [
    { value: "1-week" as TimeframeOption, label: "Last Week" },
    { value: "2-week" as TimeframeOption, label: "Last 2 Weeks" },
    { value: "4-week" as TimeframeOption, label: "Last 4 Weeks" },
  ];

  readonly sortedModalities = computed(() => {
    return [...this.modalitiesData()].sort((a, b) => b.avg_effectiveness - a.avg_effectiveness);
  });

  readonly availableModalities = computed(() => {
    return [
      "Foam Rolling",
      "Massage Gun",
      "Ice Bath",
      "Compression Boots",
      "Sleep Optimization",
      "Yoga / Mobility",
      "Stretching",
      "Sport Psychology",
      "Sauna",
      "Cold Plunge",
      "Cupping",
      "Acupuncture",
    ];
  });

  readonly acwrCorrelation = computed(() => {
    const map = new Map<string, { name: string; score: number; count: number }[]>();
    const data = this.acwrCorrelationData();
    if (data.red_flag) map.set("red_flag", data.red_flag);
    if (data.yellow_flag) map.set("yellow_flag", data.yellow_flag);
    if (data.safe) map.set("safe", data.safe);
    return map;
  });

  readonly acwrStatuses = computed(() => {
    return Array.from(this.acwrCorrelation().keys());
  });

  constructor() {
    this.fetchEffectivenessData();
  }

  private fetchEffectivenessData(): void {
    const params: Record<string, string> = { timeframe: this.selectedTimeframe() };
    this.api.get<EffectivenessResponse>("/api/recovery-effectiveness", params).subscribe({
      next: (apiResponse) => {
        const response = extractApiPayload<EffectivenessResponse>(apiResponse);
        if (response) {
          this.modalitiesData.set(response.modalities || []);
          this.domainsData.set(response.domains || []);
          if (response.acwrCorrelation) {
            this.acwrCorrelationData.set(response.acwrCorrelation);
          }
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error("recovery_effectiveness_fetch_failed", err);
        this.error.set("Failed to load recovery effectiveness data");
        this.loading.set(false);
      },
    });
  }

  setTimeframe(timeframe: TimeframeOption): void {
    this.selectedTimeframe.set(timeframe);
    this.fetchEffectivenessData();
  }

  submitRecoveryLog(): void {
    if (this.submitting() || !this.selectedModality()) return;

    this.submitting.set(true);
    this.submitMessage.set(null);

    const payload = {
      modality_name: this.selectedModality(),
      log_date: this.logDate(),
      effectiveness_1_10: this.effectiveness(),
    };

    this.api.post("/api/recovery-log", payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitMessage.set("Recovery session logged!");
        this.isError.set(false);
        this.selectedModality.set("");
        this.effectiveness.set(7);
        this.logDate.set(new Date().toISOString().slice(0, 10));
        setTimeout(() => this.submitMessage.set(null), 2000);
        this.fetchEffectivenessData();
      },
      error: (err) => {
        this.submitting.set(false);
        this.logger.error("recovery_log_failed", err);
        this.submitMessage.set("Failed to log recovery. Try again.");
        this.isError.set(true);
      },
    });
  }

  acwrStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      red_flag: "🔴 High Load (Red)",
      yellow_flag: "🟡 Moderate Load (Yellow)",
      safe: "🟢 Safe Load",
    };
    return labels[status] || status;
  }
}
