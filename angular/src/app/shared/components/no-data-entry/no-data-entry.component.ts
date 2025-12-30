/**
 * No Data Entry Component
 *
 * CRITICAL: Distinguishes between "no data entered yet" vs "mock data"
 *
 * This component is specifically for cases where:
 * - The user hasn't logged any data for this metric yet
 * - We want to encourage data entry without showing misleading mock data
 *
 * DO NOT use mock data as a placeholder - it can lead to:
 * - Athletes making training decisions on false information
 * - Incorrect load calculations that could cause injury
 * - False sense of readiness/recovery status
 */

import { Component, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { RouterModule } from "@angular/router";

export type NoDataContext =
  | "training"
  | "wellness"
  | "performance"
  | "nutrition"
  | "recovery"
  | "measurements"
  | "generic";

interface ContextConfig {
  icon: string;
  title: string;
  message: string;
  actionLabel: string;
  actionIcon: string;
  route: string;
  benefits: string[];
}

const CONTEXT_CONFIGS: Record<NoDataContext, ContextConfig> = {
  training: {
    icon: "pi-calendar",
    title: "No Training Data Yet",
    message:
      "Start logging your training sessions to track workload, calculate ACWR, and prevent overtraining injuries.",
    actionLabel: "Log First Session",
    actionIcon: "pi pi-plus",
    route: "/training/log",
    benefits: [
      "Track your training load over time",
      "Calculate your ACWR (injury risk indicator)",
      "Get personalized recovery recommendations",
      "Monitor progress toward your goals",
    ],
  },
  wellness: {
    icon: "pi-heart",
    title: "No Wellness Check-ins Yet",
    message:
      "Daily wellness check-ins help track your recovery, sleep quality, and readiness to train.",
    actionLabel: "Log Wellness",
    actionIcon: "pi pi-plus",
    route: "/wellness",
    benefits: [
      "Track sleep quality and duration",
      "Monitor energy and mood levels",
      "Identify patterns affecting performance",
      "Get alerts when recovery is needed",
    ],
  },
  performance: {
    icon: "pi-chart-line",
    title: "No Performance Tests Yet",
    message:
      "Log your performance tests (40-yard dash, vertical jump, etc.) to track improvements and set goals.",
    actionLabel: "Log Performance Test",
    actionIcon: "pi pi-plus",
    route: "/performance/tests",
    benefits: [
      "Track speed, power, and agility metrics",
      "Compare against position benchmarks",
      "Identify areas for improvement",
      "Monitor progress over time",
    ],
  },
  nutrition: {
    icon: "pi-apple",
    title: "No Nutrition Data Yet",
    message:
      "Track your nutrition to optimize performance, recovery, and body composition.",
    actionLabel: "Log Nutrition",
    actionIcon: "pi pi-plus",
    route: "/nutrition",
    benefits: [
      "Track macros and calories",
      "Monitor hydration levels",
      "Optimize pre/post workout nutrition",
      "Support recovery with proper fueling",
    ],
  },
  recovery: {
    icon: "pi-refresh",
    title: "No Recovery Data Yet",
    message:
      "Log your recovery activities (stretching, massage, ice baths) to optimize your training response.",
    actionLabel: "Log Recovery",
    actionIcon: "pi pi-plus",
    route: "/recovery",
    benefits: [
      "Track recovery modalities used",
      "Monitor soreness and fatigue",
      "Optimize recovery protocols",
      "Reduce injury risk",
    ],
  },
  measurements: {
    icon: "pi-user",
    title: "No Body Measurements Yet",
    message:
      "Track your weight, body composition, and physical measurements to monitor changes over time.",
    actionLabel: "Log Measurements",
    actionIcon: "pi pi-plus",
    route: "/profile/measurements",
    benefits: [
      "Track weight and body composition",
      "Monitor muscle mass changes",
      "Set and track body goals",
      "Correlate with performance",
    ],
  },
  generic: {
    icon: "pi-database",
    title: "No Data Available",
    message: "Start logging data to see your personalized metrics and insights.",
    actionLabel: "Get Started",
    actionIcon: "pi pi-arrow-right",
    route: "/dashboard",
    benefits: [
      "Track your progress",
      "Get personalized recommendations",
      "Monitor your performance",
      "Achieve your goals faster",
    ],
  },
};

@Component({
  selector: "app-no-data-entry",
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, RouterModule],
  template: `
    <div class="no-data-entry" [class.compact]="compact()" [class.inline]="inline()">
      @if (!inline()) {
        <p-card [styleClass]="'no-data-card'">
          <ng-container *ngTemplateOutlet="content"></ng-container>
        </p-card>
      } @else {
        <ng-container *ngTemplateOutlet="content"></ng-container>
      }

      <ng-template #content>
        <div class="no-data-content">
          <div class="no-data-icon" [class.pulse]="animateIcon()">
            <i [class]="'pi ' + config().icon"></i>
          </div>

          <h3 class="no-data-title">{{ customTitle() || config().title }}</h3>

          <p class="no-data-message">
            {{ customMessage() || config().message }}
          </p>

          @if (showBenefits() && !compact()) {
            <div class="benefits-section">
              <h4 class="benefits-title">Why track this?</h4>
              <ul class="benefits-list">
                @for (benefit of config().benefits; track benefit) {
                  <li class="benefit-item">
                    <i class="pi pi-check-circle"></i>
                    <span>{{ benefit }}</span>
                  </li>
                }
              </ul>
            </div>
          }

          @if (showMinimumInfo()) {
            <div class="minimum-info">
              <i class="pi pi-info-circle"></i>
              <span>
                Minimum {{ minimumEntries() }} entries needed for reliable
                {{ metricName() }} calculations
              </span>
            </div>
          }

          <div class="no-data-actions">
            @if (showAction()) {
              <p-button
                [label]="customActionLabel() || config().actionLabel"
                [icon]="customActionIcon() || config().actionIcon"
                [routerLink]="customRoute() || config().route"
                (onClick)="onAction.emit()"
              ></p-button>
            }
            @if (showSecondaryAction()) {
              <p-button
                [label]="secondaryActionLabel()"
                [outlined]="true"
                (onClick)="onSecondaryAction.emit()"
              ></p-button>
            }
          </div>

          @if (showSafetyNote()) {
            <div class="safety-note">
              <i class="pi pi-shield"></i>
              <span>
                We never show fake data. Your metrics will appear here once you
                start logging real entries.
              </span>
            </div>
          }
        </div>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .no-data-entry {
        width: 100%;
      }

      :host ::ng-deep .no-data-card {
        border: 2px dashed var(--p-surface-300);
        background: linear-gradient(
          135deg,
          var(--p-surface-50) 0%,
          var(--p-surface-100) 100%
        );
      }

      .no-data-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: var(--space-8);
      }

      .compact .no-data-content {
        padding: var(--space-4);
      }

      .inline .no-data-content {
        padding: var(--space-6);
        background: var(--p-surface-50);
        border-radius: var(--radius-lg);
        border: 1px dashed var(--p-surface-300);
      }

      .no-data-icon {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: linear-gradient(
          135deg,
          var(--color-brand-primary) 0%,
          var(--color-brand-secondary) 100%
        );
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: var(--space-4);
        box-shadow: var(--shadow-lg);
      }

      .compact .no-data-icon {
        width: 60px;
        height: 60px;
      }

      .no-data-icon i {
        font-size: var(--icon-4xl);
        color: white;
      }

      .compact .no-data-icon i {
        font-size: var(--icon-3xl);
      }

      .no-data-icon.pulse {
        animation: iconPulse 2s infinite;
      }

      @keyframes iconPulse {
        0%,
        100% {
          transform: scale(1);
          box-shadow: var(--shadow-lg);
        }
        50% {
          transform: scale(1.05);
          box-shadow: 0 0 20px rgba(16, 201, 107, 0.4);
        }
      }

      .no-data-title {
        font-size: var(--font-heading-lg);
        font-weight: var(--font-weight-bold);
        color: var(--text-primary);
        margin-bottom: var(--space-2);
      }

      .compact .no-data-title {
        font-size: var(--font-heading-sm);
      }

      .no-data-message {
        font-size: var(--font-body-md);
        color: var(--text-secondary);
        max-width: 500px;
        margin-bottom: var(--space-6);
        line-height: 1.6;
      }

      .compact .no-data-message {
        font-size: var(--font-body-sm);
        margin-bottom: var(--space-4);
      }

      .benefits-section {
        width: 100%;
        max-width: 400px;
        margin-bottom: var(--space-6);
        text-align: left;
      }

      .benefits-title {
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--text-secondary);
        margin-bottom: var(--space-3);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .benefits-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .benefit-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) 0;
        font-size: var(--font-body-sm);
        color: var(--text-primary);
      }

      .benefit-item i {
        color: var(--color-brand-primary);
        font-size: var(--icon-md);
      }

      .minimum-info {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-3) var(--space-4);
        background: var(--p-surface-100);
        border-radius: var(--radius-md);
        margin-bottom: var(--space-4);
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .minimum-info i {
        color: var(--color-brand-primary);
      }

      .no-data-actions {
        display: flex;
        gap: var(--space-3);
        flex-wrap: wrap;
        justify-content: center;
      }

      .safety-note {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin-top: var(--space-6);
        padding: var(--space-3) var(--space-4);
        background: var(--color-status-success-light);
        border-radius: var(--radius-md);
        font-size: var(--font-body-xs);
        color: var(--color-status-success);
        max-width: 400px;
      }

      .safety-note i {
        font-size: var(--icon-lg);
        flex-shrink: 0;
      }

      @media (max-width: 768px) {
        .no-data-content {
          padding: var(--space-6);
        }

        .no-data-icon {
          width: 60px;
          height: 60px;
        }

        .no-data-icon i {
          font-size: var(--icon-3xl);
        }

        .no-data-title {
          font-size: var(--font-heading-md);
        }

        .no-data-message {
          font-size: var(--font-body-sm);
        }
      }
    `,
  ],
})
export class NoDataEntryComponent {
  // Context determines the type of data we're showing empty state for
  context = input<NoDataContext>("generic");

  // Display options
  compact = input<boolean>(false);
  inline = input<boolean>(false);
  showBenefits = input<boolean>(true);
  showAction = input<boolean>(true);
  showSecondaryAction = input<boolean>(false);
  showSafetyNote = input<boolean>(true);
  showMinimumInfo = input<boolean>(false);
  animateIcon = input<boolean>(true);

  // Custom overrides
  customTitle = input<string | null>(null);
  customMessage = input<string | null>(null);
  customActionLabel = input<string | null>(null);
  customActionIcon = input<string | null>(null);
  customRoute = input<string | null>(null);
  secondaryActionLabel = input<string>("Learn More");

  // For minimum data info
  minimumEntries = input<number>(7);
  metricName = input<string>("metric");

  // Events
  onAction = output<void>();
  onSecondaryAction = output<void>();

  // Get config based on context
  config = () => CONTEXT_CONFIGS[this.context()];
}
