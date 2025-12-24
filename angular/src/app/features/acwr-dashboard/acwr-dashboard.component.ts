/**
 * ACWR Dashboard Component
 *
 * Displays real-time Acute:Chronic Workload Ratio with:
 * - Color-coded risk zones
 * - Load trend charts
 * - Training recommendations
 * - Alert notifications
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import { Component, computed, signal, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AcwrService } from "../../core/services/acwr.service";
import { LoadMonitoringService } from "../../core/services/load-monitoring.service";
import { AcwrAlertsService } from "../../core/services/acwr-alerts.service";
import { LoggerService } from "../../core/services/logger.service";
import {
  ACWRData,
  RiskZone,
  TrainingSession,
} from "../../core/models/acwr.models";

@Component({
  selector: "app-acwr-dashboard",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="acwr-dashboard">
      <!-- Header -->
      <div class="dashboard-header">
        <h1>
          <i class="icon-activity"></i>
          Load Monitoring & Injury Prevention
        </h1>
        <p class="subtitle">Acute:Chronic Workload Ratio (ACWR) Analysis</p>
      </div>

      <!-- Alert Banner -->
      @if (alerts().length > 0 && topAlert()) {
        <div class="alert-banner" [class]="'alert-' + topAlert()!.severity">
          <div class="alert-icon">
            @if (topAlert()!.severity === "critical") {
              🚨
            } @else if (topAlert()!.severity === "warning") {
              ⚠️
            } @else {
              ℹ️
            }
          </div>
          <div class="alert-content">
            <h3>{{ topAlert()!.message }}</h3>
            <p>{{ topAlert()!.recommendation }}</p>
          </div>
          <button class="alert-dismiss" (click)="dismissTopAlert()">✕</button>
        </div>
      }

      <!-- Main ACWR Display -->
      <div class="acwr-main-card">
        <div class="acwr-ratio-display">
          <div class="ratio-circle" [style.border-color]="riskZone().color">
            <div class="ratio-value">{{ acwrRatio() | number: "1.2-2" }}</div>
            <div class="ratio-label">ACWR</div>
          </div>

          <div
            class="risk-zone-indicator"
            [style.background-color]="riskZone().color"
          >
            <div class="risk-icon">
              @if (riskZone().level === "sweet-spot") {
                ✓
              } @else if (riskZone().level === "danger-zone") {
                ⚠
              } @else {
                ●
              }
            </div>
            <div class="risk-label">{{ riskZone().label }}</div>
            <div class="risk-description">{{ riskZone().description }}</div>
          </div>
        </div>

        <!-- Load Breakdown -->
        <div class="load-breakdown">
          <div class="load-metric">
            <div class="metric-label">Acute Load (7-day)</div>
            <div class="metric-value">
              {{ acuteLoad() | number: "1.0-0" }} AU
            </div>
            <div class="metric-description">Current fatigue level</div>
          </div>

          <div class="load-divider">÷</div>

          <div class="load-metric">
            <div class="metric-label">Chronic Load (28-day)</div>
            <div class="metric-value">
              {{ chronicLoad() | number: "1.0-0" }} AU
            </div>
            <div class="metric-description">Training fitness base</div>
          </div>
        </div>
      </div>

      <!-- Risk Zones Guide -->
      <div class="risk-zones-guide">
        <h3>Understanding Risk Zones</h3>
        <div class="zones-grid">
          <div class="zone-card zone-under">
            <div class="zone-header">
              <span class="zone-dot" style="background: orange"></span>
              <span class="zone-range">&lt; 0.80</span>
            </div>
            <div class="zone-label">Under-Training</div>
            <p>Player lacks conditioning. Gradually increase load by 5-10%.</p>
          </div>

          <div class="zone-card zone-sweet">
            <div class="zone-header">
              <span class="zone-dot" style="background: green"></span>
              <span class="zone-range">0.80 - 1.30</span>
            </div>
            <div class="zone-label">Sweet Spot</div>
            <p>Optimal workload. Lowest injury risk. Maintain current load.</p>
          </div>

          <div class="zone-card zone-elevated">
            <div class="zone-header">
              <span class="zone-dot" style="background: yellow"></span>
              <span class="zone-range">1.30 - 1.50</span>
            </div>
            <div class="zone-label">Elevated Risk</div>
            <p>Caution needed. Reduce high-intensity work, monitor closely.</p>
          </div>

          <div class="zone-card zone-danger">
            <div class="zone-header">
              <span class="zone-dot" style="background: red"></span>
              <span class="zone-range">&gt; 1.50</span>
            </div>
            <div class="zone-label">Danger Zone</div>
            <p>Highest injury risk. Reduce load 20-30%, skip sprints.</p>
          </div>
        </div>
      </div>

      <!-- Weekly Progression Check -->
      <div class="weekly-progression">
        <h3>Weekly Load Progression</h3>
        <div
          class="progression-card"
          [class.unsafe]="!weeklyProgression().isSafe"
        >
          <div class="progression-stats">
            <div class="stat">
              <div class="stat-label">Current Week</div>
              <div class="stat-value">
                {{ weeklyProgression().currentWeek | number: "1.0-0" }} AU
              </div>
            </div>
            <div class="stat">
              <div class="stat-label">Previous Week</div>
              <div class="stat-value">
                {{ weeklyProgression().previousWeek | number: "1.0-0" }} AU
              </div>
            </div>
            <div class="stat">
              <div class="stat-label">Change</div>
              <div
                class="stat-value"
                [class.positive]="weeklyProgression().changePercent > 0"
              >
                {{ weeklyProgression().changePercent > 0 ? "+" : ""
                }}{{ weeklyProgression().changePercent | number: "1.1-1" }}%
              </div>
            </div>
          </div>

          @if (weeklyProgression().warning) {
            <div class="progression-warning">
              <i class="icon-alert"></i>
              {{ weeklyProgression().warning }}
            </div>
          } @else {
            <div class="progression-safe">
              <i class="icon-check"></i>
              Weekly progression is within safe limits (&lt;10%)
            </div>
          }
        </div>
      </div>

      <!-- Training Recommendations -->
      <div class="recommendations-section">
        <h3>Training Recommendations</h3>
        <div class="recommendation-card" [class]="'rec-' + riskZone().level">
          <div class="rec-icon">💡</div>
          <div class="rec-content">
            <h4>{{ riskZone().label }} Guidance</h4>
            <p>{{ riskZone().recommendation }}</p>

            @if (trainingMods().shouldModify) {
              <div class="modifications">
                <strong>Recommended Modifications:</strong>
                <ul>
                  @for (mod of trainingMods().modifications; track mod) {
                    <li>{{ mod }}</li>
                  }
                </ul>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button class="action-btn primary" (click)="logSession()">
          <i class="icon-plus"></i>
          Log Training Session
        </button>
        <button class="action-btn" (click)="viewHistory()">
          <i class="icon-chart"></i>
          View Load History
        </button>
        <button class="action-btn" (click)="downloadReport()">
          <i class="icon-download"></i>
          Export Report
        </button>
      </div>

      <!-- Last Updated -->
      <div class="dashboard-footer">
        <small> Last updated: {{ lastUpdated() | date: "short" }} </small>
      </div>
    </div>
  `,
  styles: [
    `
      .acwr-dashboard {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        font-family: "Poppins", sans-serif;
      }

      .dashboard-header {
        margin-bottom: 2rem;
        text-align: center;
      }

      .dashboard-header h1 {
        font-size: 2rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 0.5rem;
      }

      .subtitle {
        color: var(--text-secondary);
        font-size: 1rem;
      }

      /* Alert Banner */
      .alert-banner {
        display: flex;
        align-items: center;
        padding: 1rem;
        border-radius: 12px;
        margin-bottom: 2rem;
        gap: 1rem;
      }

      .alert-critical {
        background: rgba(239, 68, 68, 0.1);
        border: 2px solid rgb(239, 68, 68);
      }

      .alert-warning {
        background: rgba(251, 191, 36, 0.1);
        border: 2px solid rgb(251, 191, 36);
      }

      .alert-info {
        background: rgba(59, 130, 246, 0.1);
        border: 2px solid rgb(59, 130, 246);
      }

      .alert-icon {
        font-size: 2rem;
      }

      .alert-content {
        flex: 1;
      }

      .alert-content h3 {
        margin: 0 0 0.5rem 0;
        font-weight: 600;
      }

      .alert-dismiss {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.5rem;
      }

      /* Main ACWR Card */
      .acwr-main-card {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        margin-bottom: 2rem;
      }

      .acwr-ratio-display {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 3rem;
        margin-bottom: 2rem;
      }

      .ratio-circle {
        width: 180px;
        height: 180px;
        border-radius: 50%;
        border: 8px solid;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: white;
      }

      .ratio-value {
        font-size: 3rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .ratio-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .risk-zone-indicator {
        padding: 1.5rem 2rem;
        border-radius: 12px;
        color: white;
        min-width: 250px;
      }

      .risk-icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
      }

      .risk-label {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
      }

      .risk-description {
        font-size: 0.875rem;
        opacity: 0.9;
      }

      /* Load Breakdown */
      .load-breakdown {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2rem;
        padding-top: 2rem;
        border-top: 1px solid var(--border-color);
      }

      .load-metric {
        text-align: center;
      }

      .metric-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: 0.5rem;
      }

      .metric-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--brand-primary);
      }

      .metric-description {
        font-size: 0.75rem;
        color: var(--text-muted);
      }

      .load-divider {
        font-size: 2rem;
        color: var(--text-muted);
      }

      /* Risk Zones Guide */
      .risk-zones-guide {
        margin-bottom: 2rem;
      }

      .risk-zones-guide h3 {
        margin-bottom: 1rem;
      }

      .zones-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
      }

      .zone-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        border: 2px solid var(--border-color);
      }

      .zone-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }

      .zone-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        display: inline-block;
      }

      .zone-range {
        font-weight: 600;
        font-size: 0.875rem;
      }

      .zone-label {
        font-weight: 700;
        margin-bottom: 0.5rem;
      }

      .zone-card p {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0;
      }

      /* Quick Actions */
      .quick-actions {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
      }

      .action-btn {
        flex: 1;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        border: 2px solid var(--border-color);
        background: white;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .action-btn.primary {
        background: var(--brand-primary);
        color: white;
        border-color: var(--brand-primary);
      }

      .action-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      @media (max-width: 768px) {
        .acwr-ratio-display {
          flex-direction: column;
        }

        .quick-actions {
          flex-direction: column;
        }

        .zones-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AcwrDashboardComponent implements OnInit {
  // Inject services using Angular's inject() function
  private readonly acwrService = inject(AcwrService);
  private readonly loadService = inject(LoadMonitoringService);
  private readonly alertsService = inject(AcwrAlertsService);
  private logger = inject(LoggerService);

  // Reactive signals from services
  public readonly acwrRatio = this.acwrService.acwrRatio;
  public readonly riskZone = this.acwrService.riskZone;
  public readonly acuteLoad = this.acwrService.acuteLoad;
  public readonly chronicLoad = this.acwrService.chronicLoad;
  public readonly weeklyProgression = this.acwrService.weeklyProgression;

  public readonly alerts = computed(() => this.alertsService.getActiveAlerts());
  public readonly topAlert = computed(() => {
    const alerts = this.alerts();
    return alerts.length > 0 ? alerts[0] : undefined;
  });

  public readonly trainingMods = computed(() =>
    this.acwrService.getTrainingModification(),
  );

  public readonly lastUpdated = computed(
    () => this.acwrService.acwrData().lastUpdated,
  );

  ngOnInit(): void {
    // Load sample data for demonstration
    this.loadSampleData();

    // Request notification permission
    this.alertsService.requestNotificationPermission();
  }

  /**
   * Load sample training data
   */
  private async loadSampleData(): Promise<void> {
    // Simulate 28 days of training
    for (let i = 28; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Vary intensity to create realistic ACWR
      const baseRPE = 6;
      const variation = Math.sin(i / 7) * 2; // Weekly variation
      const rpe = Math.max(3, Math.min(9, baseRPE + variation));

      const session = await this.loadService.createQuickSession(
        "player123",
        "technical",
        rpe,
        90,
        `Training session day ${28 - i}`,
      );

      session.date = date;
      this.acwrService.addSession(session);
    }
  }

  public dismissTopAlert(): void {
    const alert = this.topAlert();
    if (alert) {
      this.alertsService.acknowledgeAlert(alert.id, "current-user");
    }
  }

  public logSession(): void {
    // See issue #15 - Implement ACWR session logging modal
    this.logger.debug("Open session logging form");
  }

  public viewHistory(): void {
    // See issue #16 - Implement ACWR history navigation
    this.logger.debug("Navigate to load history");
  }

  public downloadReport(): void {
    // See issue #17 - Implement PDF report generation
    this.logger.debug("Generate ACWR report");
  }
}
