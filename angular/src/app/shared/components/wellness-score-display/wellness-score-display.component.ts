/**
 * Unified Wellness Score Display Component
 *
 * SINGLE SOURCE OF TRUTH for displaying wellness scores across the app.
 * All components should use this component instead of implementing their own wellness display.
 *
 * Features:
 * - Multiple display variants (ring, bar, compact, full)
 * - Consistent scoring from WellnessService
 * - Responsive design
 * - Accessibility support
 *
 * Usage:
 * <app-wellness-score-display variant="ring" [showDetails]="true"></app-wellness-score-display>
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import {
  Component,
  input,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
  OnInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { ProgressBarModule } from "primeng/progressbar";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { SkeletonModule } from "primeng/skeleton";
import { WellnessService } from "../../../core/services/wellness.service";
import { LoggerService } from "../../../core/services/logger.service";

export type WellnessDisplayVariant = "ring" | "bar" | "compact" | "full" | "mini";

export interface WellnessMetric {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  score?: number;
}

@Component({
  selector: "app-wellness-score-display",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    ProgressBarModule,
    TagModule,
    TooltipModule,
    SkeletonModule,
  ],
  template: `
    <!-- Loading State -->
    @if (loading()) {
      <div class="wellness-loading" [class]="'variant-' + variant()">
        @if (variant() === 'ring' || variant() === 'full') {
          <p-skeleton shape="circle" [size]="variant() === 'mini' ? '60px' : '120px'"></p-skeleton>
        } @else {
          <p-skeleton width="100%" height="40px"></p-skeleton>
        }
      </div>
    } @else {
      <!-- Ring Variant -->
      @if (variant() === 'ring') {
        <div class="wellness-ring" [class.clickable]="clickable()" (click)="handleClick()">
          <div class="ring-outer" [style.border-color]="statusColor()">
            <div class="ring-inner">
              <span class="score-value">{{ overallScore() }}</span>
              <span class="score-label">{{ statusLabel() }}</span>
            </div>
          </div>
          @if (showDetails()) {
            <div class="ring-details">
              @for (metric of metrics(); track metric.label) {
                <div class="metric-pill" [pTooltip]="metric.label">
                  <i [class]="'pi ' + metric.icon" [style.color]="metric.color"></i>
                  <span>{{ metric.value }}</span>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Bar Variant -->
      @if (variant() === 'bar') {
        <div class="wellness-bar" [class.clickable]="clickable()" (click)="handleClick()">
          <div class="bar-header">
            <div class="bar-title">
              <i class="pi pi-heart" [style.color]="statusColor()"></i>
              <span>Wellness</span>
            </div>
            <p-tag
              [value]="statusLabel()"
              [severity]="tagSeverity()"
              size="small"
            ></p-tag>
          </div>
          <p-progressBar
            [value]="overallScore()"
            [showValue]="false"
            [style]="{ height: '8px' }"
            [styleClass]="'wellness-progress ' + statusClass()"
          ></p-progressBar>
          <div class="bar-footer">
            <span class="score-text">{{ overallScore() }}/100</span>
            @if (showDetails() && metrics().length > 0) {
              <div class="metrics-inline">
                @for (metric of metrics().slice(0, 3); track metric.label) {
                  <span class="metric-inline" [pTooltip]="metric.label">
                    <i [class]="'pi ' + metric.icon" [style.color]="metric.color"></i>
                    {{ metric.value }}
                  </span>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Compact Variant -->
      @if (variant() === 'compact') {
        <div
          class="wellness-compact"
          [class.clickable]="clickable()"
          (click)="handleClick()"
          [pTooltip]="'Wellness: ' + statusLabel()"
        >
          <div class="compact-score" [style.background]="statusColor()">
            {{ overallScore() }}
          </div>
          <i class="pi pi-heart"></i>
        </div>
      }

      <!-- Mini Variant -->
      @if (variant() === 'mini') {
        <div
          class="wellness-mini"
          [class.clickable]="clickable()"
          (click)="handleClick()"
          [pTooltip]="'Wellness Score: ' + overallScore() + '/100 (' + statusLabel() + ')'"
        >
          <div class="mini-ring" [style.border-color]="statusColor()">
            <span>{{ overallScore() }}</span>
          </div>
        </div>
      }

      <!-- Full Variant -->
      @if (variant() === 'full') {
        <p-card class="wellness-full" [class.clickable]="clickable()">
          <ng-template pTemplate="header">
            <div class="full-header">
              <div class="header-content">
                <i class="pi pi-heart icon"></i>
                <h3>Wellness Status</h3>
              </div>
              @if (clickable()) {
                <p-button
                  icon="pi pi-external-link"
                  [text]="true"
                  [rounded]="true"
                  size="small"
                  (onClick)="handleClick()"
                  [attr.aria-label]="'View full wellness details'"
                ></p-button>
              }
            </div>
          </ng-template>

          <div class="full-content">
            <!-- Score Ring -->
            <div class="score-section">
              <div class="score-ring" [style.border-color]="statusColor()">
                <span class="score-value">{{ overallScore() }}</span>
                <span class="score-label">{{ statusLabel() }}</span>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="progress-section">
              <p-progressBar
                [value]="overallScore()"
                [showValue]="false"
                [style]="{ height: '8px' }"
                [styleClass]="'wellness-progress ' + statusClass()"
              ></p-progressBar>
            </div>

            <!-- Metrics Grid -->
            @if (showDetails() && metrics().length > 0) {
              <div class="metrics-grid">
                @for (metric of metrics(); track metric.label) {
                  <div class="metric-item">
                    <i [class]="'pi ' + metric.icon" [style.color]="metric.color"></i>
                    <div class="metric-info">
                      <span class="metric-label">{{ metric.label }}</span>
                      <span class="metric-value">{{ metric.value }}</span>
                    </div>
                  </div>
                }
              </div>
            }

            <!-- No Data State -->
            @if (metrics().length === 0 && overallScore() === 0) {
              <div class="no-data">
                <i class="pi pi-info-circle"></i>
                <p>No wellness data yet</p>
                <p-button
                  label="Log Check-in"
                  icon="pi pi-plus"
                  size="small"
                  (onClick)="handleClick()"
                ></p-button>
              </div>
            }
          </div>
        </p-card>
      }
    }
  `,
  styles: [
    `
      /* Ring Variant */
      .wellness-ring {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-3);
      }

      .ring-outer {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        border: 4px solid var(--brand-primary-700);
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--surface-primary);
        transition: all 0.3s ease;
      }

      .ring-inner {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .score-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1;
      }

      .score-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin-top: var(--space-1);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .ring-details {
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
        justify-content: center;
      }

      .metric-pill {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        padding: var(--space-1) var(--space-2);
        background: var(--surface-secondary);
        border-radius: var(--p-border-radius);
        font-size: 0.75rem;
      }

      /* Bar Variant */
      .wellness-bar {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        padding: var(--space-3);
        background: var(--surface-primary);
        border-radius: var(--p-border-radius);
        border: 1px solid var(--surface-border);
      }

      .bar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .bar-title {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-weight: 600;
        color: var(--text-primary);
      }

      .bar-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .score-text {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .metrics-inline {
        display: flex;
        gap: var(--space-3);
      }

      .metric-inline {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      /* Compact Variant */
      .wellness-compact {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2);
        background: var(--surface-secondary);
        border-radius: var(--p-border-radius);
      }

      .compact-score {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        font-size: 0.875rem;
      }

      /* Mini Variant */
      .wellness-mini {
        display: inline-flex;
      }

      .mini-ring {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 3px solid var(--brand-primary-700);
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--surface-primary);
        font-weight: 700;
        font-size: 0.875rem;
        color: var(--text-primary);
      }

      /* Full Variant */
      .wellness-full {
        height: 100%;
      }

      .full-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4);
        border-bottom: 1px solid var(--surface-border);
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .header-content .icon {
        color: var(--brand-primary-700);
        font-size: 1.25rem;
      }

      .header-content h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .full-content {
        padding: var(--space-4);
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .score-section {
        display: flex;
        justify-content: center;
        padding: var(--space-3) 0;
      }

      .score-ring {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        border: 4px solid var(--brand-primary-700);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: var(--surface-primary);
        transition: all 0.3s ease;
      }

      .progress-section {
        padding: 0 var(--space-2);
      }

      :host ::ng-deep .wellness-progress .p-progressbar-value {
        background: linear-gradient(
          90deg,
          var(--brand-primary-700) 0%,
          var(--status-success-500) 100%
        );
      }

      :host ::ng-deep .wellness-progress.status-excellent .p-progressbar-value {
        background: var(--status-success-500);
      }

      :host ::ng-deep .wellness-progress.status-good .p-progressbar-value {
        background: var(--brand-primary-700);
      }

      :host ::ng-deep .wellness-progress.status-moderate .p-progressbar-value {
        background: var(--status-warning-500);
      }

      :host ::ng-deep .wellness-progress.status-poor .p-progressbar-value {
        background: var(--status-error-500);
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--space-3);
      }

      .metric-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-2);
        background: var(--surface-secondary);
        border-radius: var(--p-border-radius);
        transition: background-color 0.2s ease;
      }

      .metric-item:hover {
        background: var(--surface-hover);
      }

      .metric-item i {
        font-size: var(--icon-lg);
      }

      .metric-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .metric-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .metric-value {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .no-data {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-4);
        text-align: center;
      }

      .no-data i {
        font-size: var(--icon-2xl);
        color: var(--color-text-muted);
      }

      .no-data p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.875rem;
      }

      /* Clickable State */
      .clickable {
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .clickable:hover {
        transform: translateY(-2px);
      }

      .clickable:active {
        transform: translateY(0);
      }

      /* Loading State */
      .wellness-loading {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: var(--space-4);
      }

      /* Responsive */
      @media (max-width: 768px) {
        .ring-outer,
        .score-ring {
          width: 100px;
          height: 100px;
        }

        .score-value {
          font-size: 1.5rem;
        }

        .mini-ring {
          width: 40px;
          height: 40px;
          font-size: 0.75rem;
        }
      }
    `,
  ],
})
export class WellnessScoreDisplayComponent implements OnInit {
  // Inputs
  variant = input<WellnessDisplayVariant>("ring");
  showDetails = input<boolean>(true);
  clickable = input<boolean>(true);
  navigateTo = input<string>("/wellness");

  // Services
  private wellnessService = inject(WellnessService);
  private router = inject(Router);
  private logger = inject(LoggerService);

  // State
  loading = signal(true);
  overallScore = signal(0);
  statusLabel = signal("N/A");
  statusColor = signal("var(--brand-primary-700)");
  metrics = signal<WellnessMetric[]>([]);

  // Computed
  statusClass = computed(() => {
    const score = this.overallScore();
    if (score >= 80) return "status-excellent";
    if (score >= 60) return "status-good";
    if (score >= 40) return "status-moderate";
    return "status-poor";
  });

  tagSeverity = computed((): "success" | "info" | "warn" | "danger" | "secondary" => {
    const score = this.overallScore();
    if (score >= 80) return "success";
    if (score >= 60) return "info";
    if (score >= 40) return "warn";
    if (score > 0) return "danger";
    return "secondary";
  });

  ngOnInit(): void {
    this.loadWellnessData();
  }

  loadWellnessData(): void {
    this.loading.set(true);

    this.wellnessService.getWellnessData("7d").subscribe({
      next: (response) => {
        if (response.success && response.data && response.data.length > 0) {
          const latestData = response.data[0];
          const score = this.wellnessService.getWellnessScore(latestData);
          const status = this.wellnessService.getWellnessStatus(score);

          this.overallScore.set(Math.round(score * 10));
          this.statusLabel.set(status.status);
          this.statusColor.set(status.color);

          // Build metrics array
          const metricsData: WellnessMetric[] = [];

          if (latestData.sleep) {
            metricsData.push({
              icon: "pi-moon",
              label: "Sleep",
              value: `${latestData.sleep}h`,
              color: "#3498db",
              score: latestData.sleep,
            });
          }

          if (latestData.energy) {
            metricsData.push({
              icon: "pi-bolt",
              label: "Energy",
              value: `${latestData.energy}/10`,
              color: "#f1c40f",
              score: latestData.energy,
            });
          }

          if (latestData.stress !== undefined && latestData.stress !== null) {
            const stressLabel =
              latestData.stress <= 3
                ? "Low"
                : latestData.stress <= 6
                  ? "Moderate"
                  : "High";
            metricsData.push({
              icon: "pi-shield",
              label: "Stress",
              value: stressLabel,
              color: latestData.stress <= 3 ? "#10c96b" : "#f39c12",
              score: 10 - latestData.stress, // Invert for display
            });
          }

          if (latestData.soreness !== undefined) {
            metricsData.push({
              icon: "pi-heart",
              label: "Soreness",
              value: `${latestData.soreness}/10`,
              color: latestData.soreness <= 3 ? "#10c96b" : "#ef4444",
              score: 10 - latestData.soreness,
            });
          }

          if (latestData.hydration !== undefined) {
            metricsData.push({
              icon: "pi-cloud",
              label: "Hydration",
              value: `${latestData.hydration}/10`,
              color: "#3498db",
              score: latestData.hydration,
            });
          }

          this.metrics.set(metricsData);
        } else {
          this.setNoDataState();
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error("Error loading wellness data:", err);
        this.setNoDataState();
        this.loading.set(false);
      },
    });
  }

  private setNoDataState(): void {
    this.overallScore.set(0);
    this.statusLabel.set("No data");
    this.statusColor.set("#94a3b8");
    this.metrics.set([]);
  }

  handleClick(): void {
    if (this.clickable()) {
      this.router.navigate([this.navigateTo()]);
    }
  }
}
