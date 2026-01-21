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
  DestroyRef
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { COLORS } from "../../../core/constants/app.constants";
import { Card } from "primeng/card";
import { ButtonComponent } from "../button/button.component";
import { IconButtonComponent } from "../button/icon-button.component";
import { ProgressBar } from "primeng/progressbar";

import { StatusTagComponent } from "../status-tag/status-tag.component";
import { Tooltip } from "primeng/tooltip";
import { Skeleton } from "primeng/skeleton";
import { WellnessService } from "../../../core/services/wellness.service";
import { LoggerService } from "../../../core/services/logger.service";

export type WellnessDisplayVariant =
  | "ring"
  | "bar"
  | "compact"
  | "full"
  | "mini";

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
    Card,
    ProgressBar,
    StatusTagComponent,
    Tooltip,
    Skeleton,
    ButtonComponent,
    IconButtonComponent
  ],
  template: `
    <!-- Loading State -->
    @if (loading()) {
      <div class="wellness-loading" [class]="'variant-' + variant()">
        @if (variant() === "ring" || variant() === "full") {
          <p-skeleton
            shape="circle"
            [size]="variant() === 'mini' ? '60px' : '120px'"
          ></p-skeleton>
        } @else {
          <p-skeleton width="100%" height="40px"></p-skeleton>
        }
      </div>
    } @else {
      <!-- Ring Variant -->
      @if (variant() === "ring") {
        <div
          class="wellness-ring"
          [class.clickable]="clickable()"
          (click)="handleClick()"
        >
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
                  <i
                    [class]="'pi ' + metric.icon"
                    [style.color]="metric.color"
                  ></i>
                  <span>{{ metric.value }}</span>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Bar Variant -->
      @if (variant() === "bar") {
        <div
          class="wellness-bar"
          [class.clickable]="clickable()"
          (click)="handleClick()"
        >
          <div class="bar-header">
            <div class="bar-title">
              <i class="pi pi-heart" [style.color]="statusColor()"></i>
              <span>Wellness</span>
            </div>
            <app-status-tag
              [value]="statusLabel()"
              [severity]="tagSeverity()"
              size="sm"
            />
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
                    <i
                      [class]="'pi ' + metric.icon"
                      [style.color]="metric.color"
                    ></i>
                    {{ metric.value }}
                  </span>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Compact Variant -->
      @if (variant() === "compact") {
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
      @if (variant() === "mini") {
        <div
          class="wellness-mini"
          [class.clickable]="clickable()"
          (click)="handleClick()"
          [pTooltip]="
            'Wellness Score: ' + overallScore() + '/100 (' + statusLabel() + ')'
          "
        >
          <div class="mini-ring" [style.border-color]="statusColor()">
            <span>{{ overallScore() }}</span>
          </div>
        </div>
      }

      <!-- Full Variant -->
      @if (variant() === "full") {
        <p-card class="wellness-full" [class.clickable]="clickable()">
          <ng-template pTemplate="header">
            <div class="full-header">
              <div class="header-content">
                <i class="pi pi-heart icon"></i>
                <h3>Wellness Status</h3>
              </div>
              @if (clickable()) {
                <app-icon-button
                  icon="pi-external-link"
                  variant="text"
                  size="sm"
                  (clicked)="handleClick()"
                  ariaLabel="View wellness details"
                  tooltip="View details"
                />
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
                    <i
                      [class]="'pi ' + metric.icon"
                      [style.color]="metric.color"
                    ></i>
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
                <app-button
                  size="sm"
                  iconLeft="pi-plus"
                  (clicked)="handleClick()"
                  >Log Check-in</app-button
                >
              </div>
            }
          </div>
        </p-card>
      }
    }
  `,
  styleUrl: "./wellness-score-display.component.scss",
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
  private destroyRef = inject(DestroyRef);

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

  tagSeverity = computed(
    (): "success" | "info" | "warning" | "danger" | "secondary" => {
      const score = this.overallScore();
      if (score >= 80) return "success";
      if (score >= 60) return "info";
      if (score >= 40) return "warning";
      if (score > 0) return "danger";
      return "secondary";
    },
  );

  ngOnInit(): void {
    this.loadWellnessData();
  }

  loadWellnessData(): void {
    this.loading.set(true);

    this.wellnessService.getWellnessData("7d").pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
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
              color: COLORS.INFO,
              score: latestData.sleep,
            });
          }

          if (latestData.energy) {
            metricsData.push({
              icon: "pi-bolt",
              label: "Energy",
              value: `${latestData.energy}/10`,
              color: COLORS.WARNING,
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
              color:
                latestData.stress <= 3 ? COLORS.PRIMARY_LIGHT : COLORS.AMBER,
              score: 10 - latestData.stress, // Invert for display
            });
          }

          if (latestData.soreness !== undefined) {
            metricsData.push({
              icon: "pi-heart",
              label: "Soreness",
              value: `${latestData.soreness}/10`,
              color:
                latestData.soreness <= 3 ? COLORS.PRIMARY_LIGHT : COLORS.ERROR,
              score: 10 - latestData.soreness,
            });
          }

          if (latestData.hydration !== undefined) {
            metricsData.push({
              icon: "pi-cloud",
              label: "Hydration",
              value: `${latestData.hydration}/10`,
              color: COLORS.INFO,
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
    this.statusColor.set(COLORS.SLATE);
    this.metrics.set([]);
  }

  handleClick(): void {
    if (this.clickable()) {
      this.router.navigate([this.navigateTo()]);
    }
  }
}
