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

import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonComponent } from "../button/button.component";
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
    message:
      "Start logging data to see your personalized metrics and insights.",
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardModule, RouterModule, ButtonComponent],
  template: `
    <div
      class="no-data-entry"
      [class.compact]="compact()"
      [class.inline]="inline()"
    >
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
              <app-button
                routerLink="customRoute() || config().route"
                (clicked)="onAction.emit()"
              ></app-button>
            }
            @if (showSecondaryAction()) {
              <app-button
                variant="outlined"
                (clicked)="onSecondaryAction.emit()"
              ></app-button>
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
  styleUrl: "./no-data-entry.component.scss",
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
