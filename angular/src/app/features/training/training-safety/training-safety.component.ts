/**
 * Training Safety Component
 *
 * Comprehensive safety dashboard showing:
 * - Current safety warnings and alerts
 * - Age-adjusted recovery recommendations
 * - Sleep debt analysis
 * - Movement volume limits
 * - Return-to-play protocols
 *
 * CRITICAL SAFETY COMPONENT - This helps prevent athlete injuries
 */

import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  DestroyRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { ProgressBarModule } from "primeng/progressbar";
import { Tabs, TabPanel } from "primeng/tabs";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { SafetyWarningsComponent } from "../../../shared/components/safety-warnings/safety-warnings.component";
import { TrafficLightRiskComponent } from "../../../shared/components/traffic-light-risk/traffic-light-risk.component";
import {
  TrainingSafetyService,
  SafetyWarning,
} from "../../../core/services/training-safety.service";
import { AcwrService } from "../../../core/services/acwr.service";
import { AgeAdjustedRecoveryService } from "../../../core/services/age-adjusted-recovery.service";
import { SleepDebtService } from "../../../core/services/sleep-debt.service";
import { TrainingLimitsService } from "../../../core/services/training-limits.service";
import { ReturnToPlayService } from "../../../core/services/return-to-play.service";
import { AuthService } from "../../../core/services/auth.service";
import { LoggerService } from "../../../core/services/logger.service";

@Component({
  selector: "app-training-safety",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    ProgressBarModule,
    Tabs,
    TabPanel,
    MainLayoutComponent,
    PageHeaderComponent,
    SafetyWarningsComponent,
    TrafficLightRiskComponent,
  ],
  template: `
    <app-main-layout>
      <div class="training-safety-page">
        <app-page-header
          title="Training Safety Dashboard"
          subtitle="Monitor your training load, recovery, and injury prevention metrics"
          icon="pi-shield"
        >
          <p-button
            label="Log Wellness"
            icon="pi pi-heart"
            [outlined]="true"
            routerLink="/wellness"
          ></p-button>
        </app-page-header>

        <!-- Safety Warnings Banner -->
        <app-safety-warnings></app-safety-warnings>

        <!-- Safety Overview Cards -->
        <div class="safety-overview">
          <!-- ACWR Status -->
          <p-card class="safety-card">
            <div class="card-content">
              <div class="card-header">
                <h3>ACWR Status</h3>
                <app-traffic-light-risk
                  [riskZone]="acwrRiskZone()"
                  [acwrValue]="acwrValue()"
                ></app-traffic-light-risk>
              </div>
              <div class="metric-display">
                <span class="metric-value">{{ acwrValue() | number: "1.2-2" }}</span>
                <span class="metric-label">Acute:Chronic Ratio</span>
              </div>
              <div class="metric-details">
                <div class="detail-item">
                  <span class="detail-label">Acute Load (7d)</span>
                  <span class="detail-value">{{ acuteLoad() | number: "1.0-0" }} AU</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Chronic Load (28d)</span>
                  <span class="detail-value">{{ chronicLoad() | number: "1.0-0" }} AU</span>
                </div>
              </div>
            </div>
          </p-card>

          <!-- Age-Adjusted Recovery -->
          <p-card class="safety-card">
            <div class="card-content">
              <div class="card-header">
                <h3>Recovery Status</h3>
                <p-tag
                  [value]="ageGroup()"
                  [severity]="getAgeGroupSeverity()"
                ></p-tag>
              </div>
              <div class="metric-display">
                <span class="metric-value">{{ recoveryMultiplier() | number: "1.1-1" }}x</span>
                <span class="metric-label">Recovery Time Multiplier</span>
              </div>
              <div class="metric-details">
                <div class="detail-item">
                  <span class="detail-label">Max Sessions/Week</span>
                  <span class="detail-value">{{ maxSessionsPerWeek() }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Min Rest Between High-Intensity</span>
                  <span class="detail-value">{{ minRestDays() }} days</span>
                </div>
              </div>
            </div>
          </p-card>

          <!-- Sleep Debt -->
          <p-card class="safety-card">
            <div class="card-content">
              <div class="card-header">
                <h3>Sleep Debt</h3>
                <p-tag
                  [value]="sleepDebtLevel()"
                  [severity]="getSleepDebtSeverity()"
                ></p-tag>
              </div>
              <div class="metric-display">
                <span class="metric-value">{{ sleepDebtHours() | number: "1.1-1" }}h</span>
                <span class="metric-label">Accumulated Debt</span>
              </div>
              <div class="sleep-impact">
                <p-progressBar
                  [value]="trainingCapacity()"
                  [showValue]="false"
                ></p-progressBar>
                <span class="capacity-label">
                  Training Capacity: {{ trainingCapacity() | number: "1.0-0" }}%
                </span>
              </div>
            </div>
          </p-card>

          <!-- Weekly Movement Limits -->
          <p-card class="safety-card">
            <div class="card-content">
              <div class="card-header">
                <h3>Movement Limits</h3>
                <p-tag
                  [value]="movementLimitStatus()"
                  [severity]="getMovementLimitSeverity()"
                ></p-tag>
              </div>
              <div class="movement-limits">
                @for (limit of movementLimits(); track limit.type) {
                  <div class="limit-item">
                    <div class="limit-header">
                      <span class="limit-type">{{ limit.type }}</span>
                      <span class="limit-count">
                        {{ limit.current }}/{{ limit.max }}
                      </span>
                    </div>
                    <p-progressBar
                      [value]="(limit.current / limit.max) * 100"
                      [showValue]="false"
                      [style]="{ height: '8px' }"
                    ></p-progressBar>
                  </div>
                }
              </div>
            </div>
          </p-card>
        </div>

        <!-- Detailed Tabs -->
        <p-tabs class="safety-tabs">
          <!-- Safety Recommendations Tab -->
          <p-tabpanel header="Recommendations">
            <div class="recommendations-list">
              @for (rec of recommendations(); track rec.id) {
                <div class="recommendation-item" [class]="'rec-' + rec.priority">
                  <div class="rec-icon">
                    @switch (rec.priority) {
                      @case ('critical') { 🚨 }
                      @case ('high') { ⚠️ }
                      @case ('medium') { 💡 }
                      @default { ℹ️ }
                    }
                  </div>
                  <div class="rec-content">
                    <h4>{{ rec.title }}</h4>
                    <p>{{ rec.message }}</p>
                    @if (rec.action) {
                      <p-button
                        [label]="rec.action.label"
                        size="small"
                        [outlined]="true"
                        (onClick)="executeAction(rec.action)"
                      ></p-button>
                    }
                  </div>
                </div>
              }
              @empty {
                <div class="no-recommendations">
                  <i class="pi pi-check-circle"></i>
                  <p>No safety concerns at this time. Keep up the good work!</p>
                </div>
              }
            </div>
          </p-tabpanel>

          <!-- Return to Play Tab -->
          <p-tabpanel header="Return to Play">
            @if (hasActiveRTP()) {
              <div class="rtp-protocol">
                <div class="rtp-header">
                  <h3>Active Return-to-Play Protocol</h3>
                  <p-tag
                    [value]="rtpStage()"
                    severity="info"
                  ></p-tag>
                </div>
                <div class="rtp-progress">
                  <p-progressBar
                    [value]="rtpProgress()"
                    [showValue]="true"
                  ></p-progressBar>
                </div>
                <div class="rtp-details">
                  <p><strong>Injury Type:</strong> {{ rtpInjuryType() }}</p>
                  <p><strong>Days in Protocol:</strong> {{ rtpDaysInProtocol() }}</p>
                  <p><strong>Current Restrictions:</strong> {{ rtpRestrictions() }}</p>
                </div>
                <div class="rtp-checkin">
                  <p-button
                    label="Daily Check-in"
                    icon="pi pi-check"
                    (onClick)="openRTPCheckin()"
                  ></p-button>
                </div>
              </div>
            } @else {
              <div class="no-rtp">
                <i class="pi pi-heart"></i>
                <p>No active return-to-play protocol. Stay healthy!</p>
                <p-button
                  label="Report Injury"
                  icon="pi pi-plus"
                  [outlined]="true"
                  (onClick)="reportInjury()"
                ></p-button>
              </div>
            }
          </p-tabpanel>

          <!-- Training History Tab -->
          <p-tabpanel header="Training History">
            <div class="training-history">
              <div class="history-summary">
                <div class="summary-item">
                  <span class="summary-value">{{ totalSessionsThisWeek() }}</span>
                  <span class="summary-label">Sessions This Week</span>
                </div>
                <div class="summary-item">
                  <span class="summary-value">{{ totalLoadThisWeek() | number: "1.0-0" }}</span>
                  <span class="summary-label">Total Load (AU)</span>
                </div>
                <div class="summary-item">
                  <span class="summary-value">{{ consecutiveTrainingDays() }}</span>
                  <span class="summary-label">Consecutive Days</span>
                </div>
                <div class="summary-item">
                  <span class="summary-value">{{ weeklyLoadChange() | number: "1.0-0" }}%</span>
                  <span class="summary-label">Week-over-Week Change</span>
                </div>
              </div>
            </div>
          </p-tabpanel>
        </p-tabs>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .training-safety-page {
        padding: var(--space-6);
      }

      .safety-overview {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--space-4);
        margin-bottom: var(--space-6);
      }

      .safety-card {
        height: 100%;
      }

      .card-content {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .card-header h3 {
        font-size: var(--font-heading-sm);
        font-weight: var(--font-weight-semibold);
        margin: 0;
        color: var(--text-primary);
      }

      .metric-display {
        text-align: center;
        padding: var(--space-4) 0;
      }

      .metric-value {
        display: block;
        font-size: var(--font-display-lg);
        font-weight: var(--font-weight-bold);
        color: var(--color-brand-primary);
      }

      .metric-label {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .metric-details {
        display: flex;
        justify-content: space-between;
        padding-top: var(--space-3);
        border-top: 1px solid var(--p-surface-200);
      }

      .detail-item {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .detail-label {
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
      }

      .detail-value {
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
      }

      .sleep-impact {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .capacity-label {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        text-align: center;
      }

      .movement-limits {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .limit-item {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .limit-header {
        display: flex;
        justify-content: space-between;
        font-size: var(--font-body-sm);
      }

      .limit-type {
        color: var(--text-primary);
      }

      .limit-count {
        font-weight: var(--font-weight-semibold);
        color: var(--text-secondary);
      }

      .safety-tabs {
        margin-top: var(--space-6);
      }

      .recommendations-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .recommendation-item {
        display: flex;
        gap: var(--space-3);
        padding: var(--space-4);
        border-radius: var(--radius-lg);
        border-left: 4px solid;
      }

      .rec-critical {
        background: var(--p-red-50);
        border-left-color: var(--p-red-500);
      }

      .rec-high {
        background: var(--p-orange-50);
        border-left-color: var(--p-orange-500);
      }

      .rec-medium {
        background: var(--p-yellow-50);
        border-left-color: var(--p-yellow-500);
      }

      .rec-low {
        background: var(--p-blue-50);
        border-left-color: var(--p-blue-500);
      }

      .rec-icon {
        font-size: 1.5rem;
      }

      .rec-content h4 {
        margin: 0 0 var(--space-2) 0;
        font-size: var(--font-body-md);
        font-weight: var(--font-weight-semibold);
      }

      .rec-content p {
        margin: 0 0 var(--space-3) 0;
        color: var(--text-secondary);
      }

      .no-recommendations,
      .no-rtp {
        text-align: center;
        padding: var(--space-8);
        color: var(--text-secondary);
      }

      .no-recommendations i,
      .no-rtp i {
        font-size: 3rem;
        color: var(--p-green-500);
        margin-bottom: var(--space-4);
        display: block;
      }

      .rtp-protocol {
        padding: var(--space-4);
      }

      .rtp-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-4);
      }

      .rtp-progress {
        margin-bottom: var(--space-4);
      }

      .rtp-details {
        margin-bottom: var(--space-4);
      }

      .rtp-details p {
        margin: var(--space-2) 0;
      }

      .training-history {
        padding: var(--space-4);
      }

      .history-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: var(--space-4);
      }

      .summary-item {
        text-align: center;
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-radius: var(--radius-lg);
      }

      .summary-value {
        display: block;
        font-size: var(--font-heading-lg);
        font-weight: var(--font-weight-bold);
        color: var(--color-brand-primary);
      }

      .summary-label {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      @media (max-width: 768px) {
        .safety-overview {
          grid-template-columns: 1fr;
        }

        .history-summary {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `,
  ],
})
export class TrainingSafetyComponent implements OnInit {
  private safetyService = inject(TrainingSafetyService);
  private acwrService = inject(AcwrService);
  private ageRecoveryService = inject(AgeAdjustedRecoveryService);
  private sleepDebtService = inject(SleepDebtService);
  private trainingLimitsService = inject(TrainingLimitsService);
  private returnToPlayService = inject(ReturnToPlayService);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);
  private destroyRef = inject(DestroyRef);

  // ACWR signals
  acwrValue = computed(() => this.acwrService.acwrRatio());
  acwrRiskZone = computed(() => this.acwrService.riskZone());
  acuteLoad = computed(() => this.acwrService.acuteLoad());
  chronicLoad = computed(() => this.acwrService.chronicLoad());

  // Age-adjusted recovery signals
  ageGroup = signal<string>("Adult");
  recoveryMultiplier = signal<number>(1.0);
  maxSessionsPerWeek = signal<number>(6);
  minRestDays = signal<number>(1);

  // Sleep debt signals
  sleepDebtHours = signal<number>(0);
  sleepDebtLevel = signal<string>("None");
  trainingCapacity = signal<number>(100);

  // Movement limits signals
  movementLimits = signal<Array<{ type: string; current: number; max: number }>>([
    { type: "Sprints", current: 0, max: 100 },
    { type: "Cuts", current: 0, max: 200 },
    { type: "Throws", current: 0, max: 300 },
    { type: "Jumps", current: 0, max: 150 },
  ]);
  movementLimitStatus = signal<string>("Safe");

  // Recommendations
  recommendations = signal<Array<{
    id: string;
    title: string;
    message: string;
    priority: string;
    action?: { label: string; route: string };
  }>>([]);

  // Return to play
  hasActiveRTP = signal<boolean>(false);
  rtpStage = signal<string>("");
  rtpProgress = signal<number>(0);
  rtpInjuryType = signal<string>("");
  rtpDaysInProtocol = signal<number>(0);
  rtpRestrictions = signal<string>("");

  // Training history
  totalSessionsThisWeek = signal<number>(0);
  totalLoadThisWeek = signal<number>(0);
  consecutiveTrainingDays = signal<number>(0);
  weeklyLoadChange = signal<number>(0);

  ngOnInit(): void {
    this.loadSafetyData();
  }

  private loadSafetyData(): void {
    const user = this.authService.getUser();
    if (!user) return;

    // Load age-adjusted recovery data
    // In real implementation, this would come from the service
    this.ageGroup.set("Adult");
    this.recoveryMultiplier.set(1.0);
    this.maxSessionsPerWeek.set(6);
    this.minRestDays.set(1);

    // Load sleep debt data
    this.sleepDebtHours.set(2.5);
    this.sleepDebtLevel.set("Mild");
    this.trainingCapacity.set(90);

    // Load movement limits
    this.movementLimits.set([
      { type: "Sprints", current: 45, max: 100 },
      { type: "Cuts", current: 120, max: 200 },
      { type: "Throws", current: 180, max: 300 },
      { type: "Jumps", current: 60, max: 150 },
    ]);

    // Generate recommendations
    this.generateRecommendations();

    // Load training history
    this.totalSessionsThisWeek.set(4);
    this.totalLoadThisWeek.set(2400);
    this.consecutiveTrainingDays.set(2);
    this.weeklyLoadChange.set(8);
  }

  private generateRecommendations(): void {
    const recs: Array<{
      id: string;
      title: string;
      message: string;
      priority: string;
      action?: { label: string; route: string };
    }> = [];

    // Check ACWR
    const acwr = this.acwrValue();
    if (acwr > 1.5) {
      recs.push({
        id: "acwr-high",
        title: "High Injury Risk",
        message: "Your ACWR is above 1.5. Consider reducing training load by 20-30%.",
        priority: "critical",
        action: { label: "View Training Plan", route: "/training" },
      });
    } else if (acwr > 1.3) {
      recs.push({
        id: "acwr-elevated",
        title: "Elevated Risk Zone",
        message: "Your ACWR is in the caution zone. Monitor closely and avoid high-intensity work.",
        priority: "high",
      });
    }

    // Check sleep debt
    if (this.sleepDebtHours() > 5) {
      recs.push({
        id: "sleep-debt",
        title: "Significant Sleep Debt",
        message: "You have accumulated significant sleep debt. Prioritize sleep to reduce injury risk.",
        priority: "high",
        action: { label: "Log Sleep", route: "/wellness" },
      });
    }

    this.recommendations.set(recs);
  }

  getAgeGroupSeverity(): "success" | "info" | "warn" | "danger" {
    const group = this.ageGroup();
    if (group === "Youth" || group === "Young Adult") return "success";
    if (group === "Adult") return "info";
    if (group === "Masters") return "warn";
    return "danger";
  }

  getSleepDebtSeverity(): "success" | "info" | "warn" | "danger" {
    const level = this.sleepDebtLevel();
    if (level === "None") return "success";
    if (level === "Mild") return "info";
    if (level === "Moderate") return "warn";
    return "danger";
  }

  getMovementLimitSeverity(): "success" | "info" | "warn" | "danger" {
    const status = this.movementLimitStatus();
    if (status === "Safe") return "success";
    if (status === "Caution") return "warn";
    return "danger";
  }

  executeAction(action: { label: string; route: string }): void {
    // Navigate to the action route
    // In real implementation, use Router
    this.logger.info("Executing action", action);
  }

  openRTPCheckin(): void {
    // Open return-to-play check-in dialog
    this.logger.info("Opening RTP check-in");
  }

  reportInjury(): void {
    // Open injury report dialog
    this.logger.info("Opening injury report");
  }
}
