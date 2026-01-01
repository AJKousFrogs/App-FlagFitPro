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
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { ProgressBarModule } from "primeng/progressbar";
import { TooltipModule } from "primeng/tooltip";
import { SkeletonModule } from "primeng/skeleton";

// Services
import { LoggerService } from "../../../core/services/logger.service";
import { AcwrService } from "../../../core/services/acwr.service";
import { WellnessService } from "../../../core/services/wellness.service";

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
    ButtonModule,
    TagModule,
    ProgressBarModule,
    TooltipModule,
    SkeletonModule,
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
        <p-button
          icon="pi pi-refresh"
          [text]="true"
          [rounded]="true"
          (onClick)="refreshInsights()"
          pTooltip="Refresh insights"
        ></p-button>
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
                      <p-button
                        [label]="insight.action.label"
                        [routerLink]="insight.action.route"
                        size="small"
                        styleClass="p-button-sm"
                      ></p-button>
                    } @else {
                      <p-button
                        [label]="insight.action.label"
                        (onClick)="executeAction(insight)"
                        size="small"
                        styleClass="p-button-sm"
                      ></p-button>
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
  styles: [
    `
      .actionable-insights {
        background: var(--surface-primary);
        border-radius: 16px;
        padding: var(--space-5);
        border: 1px solid var(--p-surface-200);
      }

      /* Header */
      .insights-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-5);
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .header-left i {
        font-size: 1.25rem;
        color: var(--p-purple-500);
      }

      .header-left h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      /* Loading */
      .insights-loading {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      /* Insights List */
      .insights-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .insight-card {
        display: flex;
        gap: var(--space-4);
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-radius: 12px;
        border-left: 4px solid var(--p-surface-300);
        position: relative;
        transition: all 0.2s;
      }

      .insight-card:hover {
        background: var(--p-surface-100);
      }

      .insight-card.high-impact {
        animation: pulse-border 2s infinite;
      }

      @keyframes pulse-border {
        0%,
        100% {
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.2);
        }
        50% {
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0);
        }
      }

      /* Type-based styling */
      .insight-card.type-warning {
        border-left-color: var(--p-red-400);
        background: var(--p-red-50);
      }

      .insight-card.type-opportunity {
        border-left-color: var(--p-green-400);
        background: var(--p-green-50);
      }

      .insight-card.type-success {
        border-left-color: var(--p-blue-400);
        background: var(--p-blue-50);
      }

      .insight-card.type-info {
        border-left-color: var(--p-surface-400);
      }

      /* Icon */
      .insight-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .insight-icon i {
        font-size: 1.25rem;
      }

      .insight-icon.icon-warning {
        background: var(--p-red-100);
        color: var(--p-red-600);
      }

      .insight-icon.icon-opportunity {
        background: var(--p-green-100);
        color: var(--p-green-600);
      }

      .insight-icon.icon-success {
        background: var(--p-blue-100);
        color: var(--p-blue-600);
      }

      .insight-icon.icon-info {
        background: var(--p-surface-200);
        color: var(--text-secondary);
      }

      /* Content */
      .insight-content {
        flex: 1;
        min-width: 0;
      }

      .insight-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--space-2);
        margin-bottom: var(--space-2);
      }

      .insight-header h4 {
        margin: 0;
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .insight-badges {
        display: flex;
        gap: var(--space-1);
        flex-shrink: 0;
      }

      .insight-description {
        margin: 0 0 var(--space-3) 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
        line-height: 1.5;
      }

      /* Metric */
      .insight-metric {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        background: white;
        border-radius: 8px;
        margin-bottom: var(--space-3);
      }

      .metric-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .metric-value {
        font-size: 0.875rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: var(--space-1);
      }

      .metric-value.trend-up {
        color: var(--p-green-600);
      }

      .metric-value.trend-down {
        color: var(--p-red-600);
      }

      .metric-value.trend-stable {
        color: var(--text-primary);
      }

      /* Evidence */
      .insight-evidence {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin-bottom: var(--space-3);
      }

      .insight-evidence i {
        font-size: 0.875rem;
        color: var(--p-purple-400);
      }

      /* Action */
      .insight-action {
        margin-top: var(--space-2);
      }

      /* Dismiss */
      .dismiss-btn {
        position: absolute;
        top: var(--space-2);
        right: var(--space-2);
        width: 28px;
        height: 28px;
        border: none;
        background: transparent;
        border-radius: 50%;
        cursor: pointer;
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }

      .dismiss-btn:hover {
        background: var(--p-surface-200);
        color: var(--text-primary);
      }

      /* No Insights */
      .no-insights {
        text-align: center;
        padding: var(--space-8);
      }

      .no-insights i {
        font-size: 3rem;
        color: var(--p-green-400);
        margin-bottom: var(--space-3);
      }

      .no-insights h4 {
        margin: 0 0 var(--space-2) 0;
        font-size: 1.125rem;
        color: var(--text-primary);
      }

      .no-insights p {
        margin: 0;
        color: var(--text-secondary);
      }

      /* Show More */
      .show-more-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        width: 100%;
        padding: var(--space-3);
        margin-top: var(--space-4);
        background: var(--p-surface-100);
        border: none;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s;
      }

      .show-more-btn:hover {
        background: var(--p-surface-200);
        color: var(--text-primary);
      }

      /* Responsive */
      @media (max-width: 480px) {
        .insight-card {
          flex-direction: column;
        }

        .insight-header {
          flex-direction: column;
        }

        .insight-badges {
          flex-wrap: wrap;
        }
      }
    `,
  ],
})
export class ActionableInsightsComponent implements OnInit {
  private logger = inject(LoggerService);
  private acwrService = inject(AcwrService);
  private wellnessService = inject(WellnessService);

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
      const acwrData = this.acwrService.acwrData();
      const riskZone = this.acwrService.riskZone();

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

      // Wellness-based insights (mock for now)
      generatedInsights.push({
        id: "sleep-debt",
        type: "warning",
        category: "recovery",
        title: "Sleep Debt Accumulating",
        description:
          "You've averaged less than 7 hours of sleep this week. Prioritize sleep to optimize recovery and performance.",
        impact: "high",
        action: {
          label: "View Sleep Trends",
          route: "/wellness",
        },
        metric: {
          label: "Avg Sleep",
          value: "6.2 hrs",
          trend: "down",
        },
        evidence: "Sleep <7h reduces reaction time by 10-15%",
        dismissable: true,
      });

      // Performance opportunity
      generatedInsights.push({
        id: "sprint-improvement",
        type: "opportunity",
        category: "performance",
        title: "Sprint Speed Improving",
        description:
          "Your 40-yard dash time has improved 3% over the last month. Consider adding more speed work to capitalize on this trend.",
        impact: "medium",
        metric: {
          label: "40-yard",
          value: "4.52s",
          trend: "down",
        },
        dismissable: true,
      });

      // Nutrition insight
      generatedInsights.push({
        id: "hydration-low",
        type: "info",
        category: "nutrition",
        title: "Hydration Reminder",
        description:
          "Based on today's training intensity, aim for at least 3L of water. Dehydration impacts sprint performance.",
        impact: "low",
        action: {
          label: "View Nutrition Plan",
          route: "/game/nutrition",
        },
        dismissable: true,
      });

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
