/**
 * Actionable Insights Component
 *
 * AI-powered recommendations based on athlete data:
 * - Training load adjustments
 * - Recovery suggestions
 * - Performance opportunities
 * - Risk alerts
 *
 * Transforms raw analytics into actionable guidance
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  input,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

// PrimeNG
import { CardModule } from "primeng/card";
import { ButtonComponent } from "../button/button.component";
import { IconButtonComponent } from "../button/icon-button.component";
import { TagModule } from "primeng/tag";
import { ProgressBarModule } from "primeng/progressbar";
import { TooltipModule } from "primeng/tooltip";
import { SkeletonModule } from "primeng/skeleton";

// Services
import { LoggerService } from "../../../core/services/logger.service";
import { UnifiedTrainingService } from "../../../core/services/unified-training.service";

export interface Insight {
  id: string;
  type: "warning" | "opportunity" | "success" | "info";
  category: "training" | "recovery" | "nutrition" | "performance" | "health";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  action?: {
    label: string;
    route?: string;
    callback?: () => void;
  };
  metric?: {
    label: string;
    value: string | number;
    trend?: "up" | "down" | "stable";
  };
  evidence?: string;
  dismissable?: boolean;
}

@Component({
  selector: "app-actionable-insights",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    TagModule,
    ProgressBarModule,
    TooltipModule,
    SkeletonModule,
  
    ButtonComponent,
    IconButtonComponent,
  ],
  template: `
    <div class="actionable-insights">
      <!-- Header -->
      <div class="insights-header">
        <div class="header-left">
          <i class="pi pi-sparkles"></i>
          <h3>AI Insights</h3>
          <p-tag
            [value]="highPriorityCount() + ' action needed'"
            [severity]="highPriorityCount() > 0 ? 'danger' : 'success'"
            size="small"
          ></p-tag>
        </div>
        <app-icon-button icon="pi-refresh" variant="text" (clicked)="refreshInsights()" ariaLabel="refresh" />
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="insights-loading">
          @for (i of [1, 2, 3]; track i) {
            <div class="insight-skeleton">
              <p-skeleton width="100%" height="100px"></p-skeleton>
            </div>
          }
        </div>
      } @else {
        <!-- Insights List -->
        <div class="insights-list">
          @for (insight of visibleInsights(); track insight.id) {
            <div
              class="insight-card"
              [class]="'type-' + insight.type"
              [class.high-impact]="insight.impact === 'high'"
            >
              <!-- Icon -->
              <div class="insight-icon" [class]="'icon-' + insight.type">
                <i [class]="getInsightIcon(insight)"></i>
              </div>

              <!-- Content -->
              <div class="insight-content">
                <div class="insight-header">
                  <h4>{{ insight.title }}</h4>
                  <div class="insight-badges">
                    <p-tag
                      [value]="insight.category"
                      [severity]="getCategorySeverity(insight.category)"
                      size="small"
                    ></p-tag>
                    @if (insight.impact === "high") {
                      <p-tag
                        value="High Impact"
                        severity="danger"
                        size="small"
                      ></p-tag>
                    }
                  </div>
                </div>

                <p class="insight-description">{{ insight.description }}</p>

                <!-- Metric -->
                @if (insight.metric) {
                  <div class="insight-metric">
                    <span class="metric-label"
                      >{{ insight.metric.label }}:</span
                    >
                    <span
                      class="metric-value"
                      [class]="getTrendClass(insight.metric.trend)"
                    >
                      {{ insight.metric.value }}
                      @if (insight.metric.trend) {
                        <i [class]="getTrendIcon(insight.metric.trend)"></i>
                      }
                    </span>
                  </div>
                }

                <!-- Evidence -->
                @if (insight.evidence) {
                  <div class="insight-evidence">
                    <i class="pi pi-book"></i>
                    <span>{{ insight.evidence }}</span>
                  </div>
                }

                <!-- Action -->
                @if (insight.action) {
                  <div class="insight-action">
                    @if (insight.action.route) {
                      <app-button size="sm" routerLink="insight.action.route"></app-button>
                    } @else {
                      <app-button size="sm" (clicked)="executeAction(insight)"></app-button>
                    }
                  </div>
                }
              </div>

              <!-- Dismiss -->
              @if (insight.dismissable) {
                <button
                  class="dismiss-btn"
                  (click)="dismissInsight(insight.id)"
                  pTooltip="Dismiss"
                >
                  <i class="pi pi-times"></i>
                </button>
              }
            </div>
          }

          @if (visibleInsights().length === 0) {
            <div class="no-insights">
              <i class="pi pi-check-circle"></i>
              <h4>All Clear!</h4>
              <p>No immediate actions needed. Keep up the great work!</p>
            </div>
          }
        </div>

        <!-- Show More -->
        @if (hasMoreInsights()) {
          <button class="show-more-btn" (click)="showMore()">
            Show {{ remainingCount() }} more insights
            <i class="pi pi-chevron-down"></i>
          </button>
        }
      }
    </div>
  `,
  styleUrl: './actionable-insights.component.scss',
})
export class ActionableInsightsComponent implements OnInit {
  private logger = inject(LoggerService);
  private trainingService = inject(UnifiedTrainingService);

  // Inputs
  maxVisible = input<number>(5);
  athleteId = input<string>("");

  // State
  isLoading = signal(true);
  insights = signal<Insight[]>([]);
  dismissedIds = signal<Set<string>>(new Set());
  showCount = signal(3);

  // Computed
  visibleInsights = computed(() => {
    const all = this.insights();
    const dismissed = this.dismissedIds();
    const filtered = all.filter((i) => !dismissed.has(i.id));
    return filtered.slice(0, this.showCount());
  });

  highPriorityCount = computed(() => {
    return this.insights().filter(
      (i) =>
        i.impact === "high" &&
        (i.type === "warning" || i.type === "opportunity"),
    ).length;
  });

  hasMoreInsights = computed(() => {
    const all = this.insights();
    const dismissed = this.dismissedIds();
    const filtered = all.filter((i) => !dismissed.has(i.id));
    return filtered.length > this.showCount();
  });

  remainingCount = computed(() => {
    const all = this.insights();
    const dismissed = this.dismissedIds();
    const filtered = all.filter((i) => !dismissed.has(i.id));
    return Math.max(0, filtered.length - this.showCount());
  });

  ngOnInit(): void {
    this.generateInsights();
    this.loadDismissedInsights();
  }

  refreshInsights(): void {
    this.isLoading.set(true);
    this.generateInsights();
  }

  showMore(): void {
    this.showCount.update((c) => c + 3);
  }

  dismissInsight(id: string): void {
    this.dismissedIds.update((set) => {
      const newSet = new Set(set);
      newSet.add(id);
      return newSet;
    });
    this.saveDismissedInsights();
  }

  executeAction(insight: Insight): void {
    if (insight.action?.callback) {
      insight.action.callback();
    }
  }

  getInsightIcon(insight: Insight): string {
    switch (insight.type) {
      case "warning":
        return "pi pi-exclamation-triangle";
      case "opportunity":
        return "pi pi-star";
      case "success":
        return "pi pi-check-circle";
      default:
        return "pi pi-info-circle";
    }
  }

  getCategorySeverity(
    category: string,
  ): "success" | "info" | "warn" | "danger" | "secondary" {
    switch (category) {
      case "training":
        return "info";
      case "recovery":
        return "success";
      case "nutrition":
        return "warn";
      case "performance":
        return "info";
      case "health":
        return "danger";
      default:
        return "secondary";
    }
  }

  getTrendClass(trend?: "up" | "down" | "stable"): string {
    if (!trend) return "";
    return `trend-${trend}`;
  }

  getTrendIcon(trend: "up" | "down" | "stable"): string {
    switch (trend) {
      case "up":
        return "pi pi-arrow-up";
      case "down":
        return "pi pi-arrow-down";
      default:
        return "pi pi-minus";
    }
  }

  private async generateInsights(): Promise<void> {
    try {
      // Get current data
      const acwrData = this.trainingService.acwrData();
      const _riskZone = this.trainingService.acwrRiskZone();

      const generatedInsights: Insight[] = [];

      // ACWR-based insights
      if (acwrData.ratio > 1.5) {
        generatedInsights.push({
          id: "acwr-high",
          type: "warning",
          category: "training",
          title: "Training Load Too High",
          description:
            "Your ACWR is above 1.5, putting you at increased injury risk. Consider reducing training intensity for the next 2-3 days.",
          impact: "high",
          action: {
            label: "View ACWR Dashboard",
            route: "/analytics",
          },
          metric: {
            label: "ACWR",
            value: acwrData.ratio.toFixed(2),
            trend: "up",
          },
          evidence: "Research shows ACWR >1.5 increases injury risk by 2-4x",
          dismissable: false,
        });
      } else if (acwrData.ratio < 0.8) {
        generatedInsights.push({
          id: "acwr-low",
          type: "opportunity",
          category: "training",
          title: "Room to Increase Training",
          description:
            "Your ACWR is below optimal. You can safely increase training load to improve fitness without injury risk.",
          impact: "medium",
          action: {
            label: "View Training Plan",
            route: "/training",
          },
          metric: {
            label: "ACWR",
            value: acwrData.ratio.toFixed(2),
            trend: "down",
          },
          dismissable: true,
        });
      } else if (acwrData.ratio >= 0.8 && acwrData.ratio <= 1.3) {
        generatedInsights.push({
          id: "acwr-optimal",
          type: "success",
          category: "training",
          title: "Training Load Optimal",
          description:
            "Your ACWR is in the sweet spot (0.8-1.3). Maintain current training intensity for best results.",
          impact: "low",
          metric: {
            label: "ACWR",
            value: acwrData.ratio.toFixed(2),
            trend: "stable",
          },
          dismissable: true,
        });
      }

      // Sort by impact and type
      generatedInsights.sort((a, b) => {
        const impactOrder = { high: 0, medium: 1, low: 2 };
        const typeOrder = { warning: 0, opportunity: 1, success: 2, info: 3 };

        const impactDiff = impactOrder[a.impact] - impactOrder[b.impact];
        if (impactDiff !== 0) return impactDiff;

        return typeOrder[a.type] - typeOrder[b.type];
      });

      this.insights.set(generatedInsights);
      this.isLoading.set(false);
    } catch (error) {
      this.logger.error("Error generating insights:", error);
      this.isLoading.set(false);
    }
  }

  private loadDismissedInsights(): void {
    try {
      const stored = localStorage.getItem("dismissed-insights");
      if (stored) {
        const ids = JSON.parse(stored) as string[];
        this.dismissedIds.set(new Set(ids));
      }
    } catch (error) {
      this.logger.error("Error loading dismissed insights:", error);
    }
  }

  private saveDismissedInsights(): void {
    try {
      const ids = Array.from(this.dismissedIds());
      localStorage.setItem("dismissed-insights", JSON.stringify(ids));
    } catch (error) {
      this.logger.error("Error saving dismissed insights:", error);
    }
  }
}
