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

import { Component, computed, signal, OnInit, inject, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { AcwrService } from "../../core/services/acwr.service";
import { LoadMonitoringService } from "../../core/services/load-monitoring.service";
import { AcwrAlertsService } from "../../core/services/acwr-alerts.service";
import { LoggerService } from "../../core/services/logger.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { AuthService } from "../../core/services/auth.service";
import { ToastService } from "../../core/services/toast.service";
import {
  ACWRData,
  RiskZone,
  TrainingSession,
} from "../../core/models/acwr.models";
import { METRIC_INSUFFICIENT_DATA } from "../../shared/utils/privacy-ux-copy";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { PageLoadingStateComponent } from "../../shared/components/page-loading-state/page-loading-state.component";

@Component({
  selector: "app-acwr-dashboard",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, PageErrorStateComponent, PageLoadingStateComponent],
  template: `
    <!-- Loading State -->
    @if (isPageLoading()) {
      <app-page-loading-state
        message="Loading ACWR data..."
        variant="skeleton"
      ></app-page-loading-state>
    }

    <!-- Error State -->
    @else if (hasPageError()) {
      <app-page-error-state
        title="Unable to load ACWR dashboard"
        [message]="pageErrorMessage()"
        (retry)="retryLoad()"
      ></app-page-error-state>
    }

    <!-- Content -->
    @else {
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
        @if (hasInsufficientData()) {
          <!-- Empty State for New Athletes - Using Centralized UX Copy -->
          <div class="acwr-empty-state">
            <div class="empty-icon"><i [class]="'pi ' + insufficientDataMessage.icon"></i></div>
            <h3>{{ insufficientDataMessage.title }}</h3>
            <p>{{ insufficientDataMessage.reason }}</p>
            
            <div class="data-progress">
              <div class="progress-item">
                <span class="progress-label">Days with data</span>
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="(dataQuality().daysWithData || 0) / 21 * 100"></div>
                </div>
                <span class="progress-value">{{ dataQuality().daysWithData || 0 }} / 21</span>
              </div>
              <div class="progress-item">
                <span class="progress-label">Sessions logged</span>
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="(dataQuality().sessionsInChronicWindow || 0) / 10 * 100"></div>
                </div>
                <span class="progress-value">{{ dataQuality().sessionsInChronicWindow || 0 }} / 10</span>
              </div>
            </div>
            
            <p class="empty-tip">💡 <strong>Olympic Tip:</strong> Consistent training logging helps prevent overtraining injuries during your LA28 preparation.</p>
            
            <a [routerLink]="insufficientDataMessage.helpLink" class="action-btn primary">
              <i class="icon-plus"></i>
              {{ insufficientDataMessage.actionLabel }}
            </a>
          </div>
        } @else {
          <!-- Full ACWR Display -->
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
        }
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
    } <!-- End of @else for content -->
  `,
  styles: [
    `
      .acwr-dashboard {
        max-width: 1200px;
        margin: 0 auto;
        padding: var(--space-8);
        font-family: var(--font-family-sans);
      }

      .dashboard-header {
        margin-bottom: var(--space-8);
        text-align: center;
      }

      .dashboard-header h1 {
        font-size: var(--font-heading-2xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
        margin-bottom: var(--space-2);
      }

      .subtitle {
        color: var(--color-text-secondary);
        font-size: var(--text-base);
      }

      /* Alert Banner */
      .alert-banner {
        display: flex;
        align-items: center;
        padding: var(--space-4);
        border-radius: var(--radius-xl);
        margin-bottom: var(--space-8);
        gap: var(--space-4);
      }

      .alert-critical {
        background: var(--color-status-error-subtle);
        border: 2px solid var(--color-status-error);
      }

      .alert-warning {
        background: var(--color-status-warning-subtle);
        border: 2px solid var(--color-status-warning);
      }

      .alert-info {
        background: var(--color-status-info-subtle);
        border: 2px solid var(--color-status-info);
      }

      .alert-icon {
        font-size: var(--text-3xl);
      }

      .alert-content {
        flex: 1;
      }

      .alert-content h3 {
        margin: 0 0 var(--space-2) 0;
        font-weight: var(--font-weight-semibold);
      }

      .alert-dismiss {
        background: none;
        border: none;
        font-size: var(--text-2xl);
        cursor: pointer;
        padding: var(--space-2);
      }

      /* Main ACWR Card */
      .acwr-main-card {
        background: var(--surface-primary);
        border-radius: var(--radius-2xl);
        padding: var(--space-8);
        box-shadow: var(--shadow-md);
        margin-bottom: var(--space-8);
      }

      .acwr-ratio-display {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-12);
        margin-bottom: var(--space-8);
      }

      .ratio-circle {
        width: 180px;
        height: 180px;
        border-radius: var(--radius-full);
        border: 8px solid;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: var(--surface-primary);
      }

      .ratio-value {
        font-size: var(--font-display-xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
      }

      .ratio-label {
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .risk-zone-indicator {
        padding: var(--space-6) var(--space-8);
        border-radius: var(--radius-xl);
        color: var(--color-text-on-primary);
        min-width: 250px;
      }

      .risk-icon {
        font-size: var(--text-3xl);
        margin-bottom: var(--space-2);
      }

      .risk-label {
        font-size: var(--text-2xl);
        font-weight: var(--font-weight-bold);
        margin-bottom: var(--space-2);
      }

      .risk-description {
        font-size: var(--text-sm);
        opacity: 0.9;
      }

      /* Load Breakdown */
      .load-breakdown {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-8);
        padding-top: var(--space-8);
        border-top: 1px solid var(--color-border-primary);
      }

      .load-metric {
        text-align: center;
      }

      .metric-label {
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
        margin-bottom: var(--space-2);
      }

      .metric-value {
        font-size: var(--text-3xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-brand-primary);
      }

      .metric-description {
        font-size: var(--text-xs);
        color: var(--color-text-muted);
      }

      .load-divider {
        font-size: var(--text-3xl);
        color: var(--color-text-muted);
      }

      /* Risk Zones Guide */
      .risk-zones-guide {
        margin-bottom: var(--space-8);
      }

      .risk-zones-guide h3 {
        margin-bottom: var(--space-4);
      }

      .zones-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--space-4);
      }

      .zone-card {
        background: var(--surface-primary);
        border-radius: var(--radius-xl);
        padding: var(--space-6);
        border: 2px solid var(--color-border-primary);
      }

      .zone-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-2);
      }

      .zone-dot {
        width: 12px;
        height: 12px;
        border-radius: var(--radius-full);
        display: inline-block;
      }

      .zone-range {
        font-weight: var(--font-weight-semibold);
        font-size: var(--text-sm);
      }

      .zone-label {
        font-weight: var(--font-weight-bold);
        margin-bottom: var(--space-2);
      }

      .zone-card p {
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
        margin: 0;
      }

      /* Quick Actions */
      .quick-actions {
        display: flex;
        gap: var(--space-4);
        margin-top: var(--space-8);
      }

      .action-btn {
        flex: 1;
        padding: var(--space-4) var(--space-6);
        border-radius: var(--radius-lg);
        border: 2px solid var(--color-border-primary);
        background: var(--surface-primary);
        font-weight: var(--font-weight-semibold);
        cursor: pointer;
        transition: all var(--transition-base);
      }

      .action-btn.primary {
        background: var(--color-brand-primary);
        color: var(--color-text-on-primary);
        border-color: var(--color-brand-primary);
      }

      .action-btn:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }

      /* Empty State */
      .acwr-empty-state {
        text-align: center;
        padding: var(--space-10);
      }

      .acwr-empty-state .empty-icon {
        font-size: 4rem;
        margin-bottom: var(--space-4);
      }

      .acwr-empty-state h3 {
        font-size: var(--text-2xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
        margin-bottom: var(--space-3);
      }

      .acwr-empty-state p {
        color: var(--color-text-secondary);
        font-size: var(--text-base);
        margin-bottom: var(--space-6);
        max-width: 500px;
        margin-left: auto;
        margin-right: auto;
      }

      .data-progress {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        max-width: 400px;
        margin: 0 auto var(--space-6);
      }

      .progress-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .progress-label {
        flex: 0 0 140px;
        text-align: left;
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
      }

      .progress-bar {
        flex: 1;
        height: 8px;
        background: var(--p-surface-200);
        border-radius: var(--radius-full);
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: var(--color-brand-primary);
        border-radius: var(--radius-full);
        transition: width 0.3s ease;
        max-width: 100%;
      }

      .progress-value {
        flex: 0 0 60px;
        text-align: right;
        font-size: var(--text-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .empty-tip {
        background: var(--color-status-info-subtle);
        padding: var(--space-4);
        border-radius: var(--radius-lg);
        border: 1px solid var(--color-status-info);
        margin-bottom: var(--space-6);
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

        .progress-item {
          flex-wrap: wrap;
        }

        .progress-label {
          flex: 1 1 100%;
          margin-bottom: var(--space-1);
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

  // Runtime guard signals - prevent white screen crashes
  isPageLoading = signal<boolean>(false);
  hasPageError = signal<boolean>(false);
  pageErrorMessage = signal<string>('Something went wrong while loading ACWR data. Please try again.');

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

  // Data quality signal from service
  public readonly dataQuality = computed(() => this.acwrService.acwrData().dataQuality);
  public readonly hasInsufficientData = computed(() => {
    const quality = this.dataQuality();
    return quality?.level === 'insufficient' || quality?.level === 'low';
  });

  // Centralized UX copy for insufficient data state
  public readonly insufficientDataMessage = METRIC_INSUFFICIENT_DATA.acwr;

  ngOnInit(): void {
    this.initializeDashboard();
  }

  /**
   * Initialize dashboard with error handling
   */
  private initializeDashboard(): void {
    try {
      // Request notification permission for alerts
      this.alertsService.requestNotificationPermission();
      
      // Real training data is loaded automatically by AcwrService 
      // when user authenticates (via effect in constructor)
      this.logger.info('[ACWR Dashboard] Initialized - waiting for real training data');
    } catch (error) {
      this.logger.error('[ACWR Dashboard] Init error:', error);
      this.hasPageError.set(true);
      this.pageErrorMessage.set('Failed to initialize ACWR dashboard. Please try again.');
    }
  }

  /**
   * Retry loading the dashboard
   */
  retryLoad(): void {
    this.hasPageError.set(false);
    this.initializeDashboard();
  }

  private router = inject(Router);
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  public dismissTopAlert(): void {
    const alert = this.topAlert();
    if (alert) {
      this.alertsService.acknowledgeAlert(alert.id, "current-user");
    }
  }

  public logSession(): void {
    // Navigate to smart training form for logging a new session
    this.router.navigate(["/training/smart-form"]);
  }

  public viewHistory(): void {
    // Navigate to training schedule to view history
    this.router.navigate(["/training/schedule"]);
  }

  public async downloadReport(): Promise<void> {
    try {
      const user = this.authService.getUser();
      if (!user?.id) {
        this.toastService.error("Please log in to download reports");
        return;
      }

      this.toastService.info("Generating ACWR report...");

      // Get current ACWR data from the service's computed signal
      const acwrData = this.acwrService.acwrData();
      const alerts = this.alerts();

      // Build report data
      const reportData = {
        generatedAt: new Date().toISOString(),
        userId: user.id,
        acwr: {
          current: acwrData.ratio,
          riskZone: acwrData.riskZone.label,
          acuteLoad: acwrData.acute,
          chronicLoad: acwrData.chronic,
          weeklyProgression: acwrData.weeklyProgression,
        },
        alerts: alerts.map((a) => ({
          message: a.message,
          severity: a.severity,
          recommendation: a.recommendation,
        })),
        recommendations: this.getRecommendationsForRiskZone(acwrData.riskZone.label),
      };

      // Save report to Supabase
      const { error } = await this.supabaseService.client
        .from("acwr_reports")
        .insert({
          user_id: user.id,
          report_data: reportData,
          acwr_value: acwrData.ratio,
          risk_zone: acwrData.riskZone,
        });

      if (error) {
        // If table doesn't exist, just download locally
        this.logger.debug("ACWR reports table not available, generating local report");
      }

      // Generate and download JSON report
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `acwr-report-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      this.toastService.success("ACWR report downloaded successfully");
    } catch (error) {
      this.logger.error("Error generating ACWR report:", error);
      this.toastService.error("Failed to generate report");
    }
  }

  private getRecommendationsForRiskZone(riskZoneLabel: string): string[] {
    switch (riskZoneLabel) {
      case "Danger Zone (High)":
      case "danger-high":
        return [
          "Immediately reduce training load by 30-40%",
          "Focus on recovery activities (sleep, nutrition, hydration)",
          "Consider active recovery sessions only",
          "Monitor for signs of overtraining or injury",
        ];
      case "Warning (High)":
      case "warning-high":
        return [
          "Reduce training intensity by 15-20%",
          "Add an extra rest day this week",
          "Prioritize sleep and nutrition",
          "Monitor fatigue levels closely",
        ];
      case "Optimal Zone":
      case "optimal":
        return [
          "Maintain current training load",
          "Continue balanced progression",
          "Keep monitoring ACWR trends",
        ];
      case "Warning (Low)":
      case "warning-low":
        return [
          "Gradually increase training load by 10-15%",
          "Add one additional session this week",
          "Focus on building chronic fitness base",
        ];
      case "Danger Zone (Low)":
      case "danger-low":
        return [
          "Significant increase in training needed",
          "Build up gradually over 2-3 weeks",
          "Focus on aerobic base development",
          "Consider adding more volume before intensity",
        ];
      default:
        return ["Continue monitoring your training load"];
    }
  }
}
