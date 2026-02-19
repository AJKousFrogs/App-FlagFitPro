import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { Card } from "primeng/card";

import { ButtonComponent } from "../button/button.component";

/** Context presets for "no data entered yet" scenarios (replaces legacy app-no-data-entry) */
export type EmptyStateContext =
  | "training"
  | "wellness"
  | "performance"
  | "nutrition"
  | "recovery"
  | "measurements"
  | "generic";

const CONTEXT_CONFIGS: Record<
  EmptyStateContext,
  { icon: string; title: string; message: string; actionLabel: string; actionIcon: string; route: string; benefits: string[] }
> = {
  training: {
    icon: "pi-calendar",
    title: "No Training Data Yet",
    message: "Start logging your training sessions to track workload, calculate ACWR, and prevent overtraining injuries.",
    actionLabel: "Log First Session",
    actionIcon: "pi pi-plus",
    route: "/training/log",
    benefits: ["Track your training load over time", "Calculate your ACWR (injury risk indicator)", "Get personalized recovery recommendations", "Monitor progress toward your goals"],
  },
  wellness: {
    icon: "pi-heart",
    title: "No Wellness Check-ins Yet",
    message: "Daily wellness check-ins help track your recovery, sleep quality, and readiness to train.",
    actionLabel: "Log Wellness",
    actionIcon: "pi pi-plus",
    route: "/wellness",
    benefits: ["Track sleep quality and duration", "Monitor energy and mood levels", "Identify patterns affecting performance", "Get alerts when recovery is needed"],
  },
  performance: {
    icon: "pi-chart-line",
    title: "No Performance Tests Yet",
    message: "Log your performance tests (40-yard dash, vertical jump, etc.) to track improvements and set goals.",
    actionLabel: "Log Performance Test",
    actionIcon: "pi pi-plus",
    route: "/performance-tracking",
    benefits: ["Track speed, power, and agility metrics", "Compare against position benchmarks", "Identify areas for improvement", "Monitor progress over time"],
  },
  nutrition: {
    icon: "pi-apple",
    title: "No Nutrition Data Yet",
    message: "Track your nutrition to optimize performance, recovery, and body composition.",
    actionLabel: "Log Nutrition",
    actionIcon: "pi pi-plus",
    route: "/game/nutrition",
    benefits: ["Track macros and calories", "Monitor hydration levels", "Optimize pre/post workout nutrition", "Support recovery with proper fueling"],
  },
  recovery: {
    icon: "pi-refresh",
    title: "No Recovery Data Yet",
    message: "Log your recovery activities (stretching, massage, ice baths) to optimize your training response.",
    actionLabel: "Log Recovery",
    actionIcon: "pi pi-plus",
    route: "/wellness",
    benefits: ["Track recovery modalities used", "Monitor soreness and fatigue", "Optimize recovery protocols", "Reduce injury risk"],
  },
  measurements: {
    icon: "pi-user",
    title: "No Body Measurements Yet",
    message: "Track your weight, body composition, and physical measurements to monitor changes over time.",
    actionLabel: "Log Measurements",
    actionIcon: "pi pi-plus",
    route: "/profile",
    benefits: ["Track weight and body composition", "Monitor muscle mass changes", "Set and track body goals", "Correlate with performance"],
  },
  generic: {
    icon: "pi-database",
    title: "No Data Available",
    message: "Start logging data to see your personalized metrics and insights.",
    actionLabel: "Get Started",
    actionIcon: "pi pi-arrow-right",
    route: "/dashboard",
    benefits: ["Track your progress", "Get personalized recommendations", "Monitor your performance", "Achieve your goals faster"],
  },
};

/**
 * Empty State Component - Enhanced
 *
 * Displays a consistent empty state when no data is available.
 * Supports context presets (training, wellness, etc.) for "no data entered yet" scenarios.
 * Replaces legacy app-no-data-entry.
 */
@Component({
  selector: "app-empty-state",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, Card, ButtonComponent],
  template: `
    <div
      class="empty-state-wrapper"
      [class.inline]="inline()"
      [attr.data-context]="context()"
    >
      @if (useCard() && !inline()) {
        <p-card class="empty-state-card">
          <ng-container *ngTemplateOutlet="content"></ng-container>
        </p-card>
      } @else {
        <ng-container *ngTemplateOutlet="content"></ng-container>
      }

      <ng-template #content>
    <div class="empty-state" [class.compact]="compact()" [class.has-context]="context()">
      @if (resolvedIcon()) {
        <div class="empty-icon" [class.emphasized]="context()" [style.--empty-icon-color]="iconColor()">
          <i [class]="'pi ' + resolvedIcon()"></i>
        </div>
      }
      <h3 class="empty-title">{{ resolvedTitle() }}</h3>
      @if (resolvedMessage()) {
        <p class="empty-message">{{ resolvedMessage() }}</p>
      }

      <!-- Benefits list (optional) - from context or explicit -->
      @if (showBenefits() && resolvedBenefits().length > 0) {
        @if (resolvedBenefitsTitle()) {
          <h4 class="empty-benefits-title">{{ resolvedBenefitsTitle() }}</h4>
        }
        <ul class="empty-benefits">
          @for (benefit of resolvedBenefits(); track benefit) {
            <li>
              <i class="pi pi-check-circle"></i>
              <span>{{ benefit }}</span>
            </li>
          }
        </ul>
      }

      <!-- Minimum info (context only) -->
      @if (showMinimumInfo() && minimumEntries() && metricName()) {
        <div class="empty-minimum-info">
          <i class="pi pi-info-circle"></i>
          <span>Minimum {{ minimumEntries() }} entries needed for reliable {{ metricName() }} calculations</span>
        </div>
      }

      <!-- Action buttons -->
      <div class="empty-actions">
        <!-- Primary action -->
        @if (resolvedActionLabel()) {
          @if (resolvedActionLink()) {
            <app-button
              [routerLink]="resolvedActionLink()!"
              [iconLeft]="resolvedActionIcon()"
              (clicked)="onAction.emit()"
              >{{ resolvedActionLabel() }}</app-button
            >
          } @else if (resolvedActionHandler()) {
            <app-button
              (clicked)="handleAction()"
              [iconLeft]="resolvedActionIcon()"
              >{{ resolvedActionLabel() }}</app-button
            >
          }
        }

        <!-- Secondary action (optional) -->
        @if (secondaryActionLabel()) {
          @if (secondaryActionLink()) {
            <app-button
              variant="outlined"
              [routerLink]="secondaryActionLink()!"
              [iconLeft]="secondaryActionIcon() || ''"
              >{{ secondaryActionLabel() }}</app-button
            >
          } @else {
            <app-button
              variant="outlined"
              (clicked)="handleSecondaryAction()"
              [iconLeft]="secondaryActionIcon() || ''"
              >{{ secondaryActionLabel() }}</app-button
            >
          }
        }

        <!-- Projected content (for ng-content) -->
        <ng-content></ng-content>
      </div>

      <!-- Tip (optional, from V2 API) -->
      @if (tip()) {
        <div class="empty-tip">
          <i class="pi pi-info-circle"></i>
          <span>{{ tip() }}</span>
        </div>
      }

      <!-- Safety note (context only) -->
      @if (showSafetyNote()) {
        <div class="empty-safety-note">
          <i class="pi pi-shield"></i>
          <span>We never show fake data. Your metrics will appear here once you start logging real entries.</span>
        </div>
      }

      <!-- Help link (optional) -->
      @if (helpText() && helpLink()) {
        <div class="empty-help">
          <a [routerLink]="helpLink()!" class="empty-help-link">
            <i class="pi pi-question-circle"></i>
            {{ helpText() }}
          </a>
        </div>
      }
    </div>
      </ng-template>
    </div>
  `,
  styleUrl: "./empty-state.component.scss",
})
export class EmptyStateComponent {
  // Basic display
  title = input<string>("No Data Available");
  message = input<string | null>(null);
  icon = input<string | null>(null);
  iconColor = input<string>("var(--color-text-secondary)");
  compact = input<boolean>(false);

  // Context preset (replaces app-no-data-entry)
  context = input<EmptyStateContext | null>(null);
  inline = input<boolean>(false);
  useCard = input<boolean>(false);
  showBenefits = input<boolean>(true);
  showSafetyNote = input<boolean>(false);
  showMinimumInfo = input<boolean>(false);
  minimumEntries = input<number>(7);
  metricName = input<string>("metric");
  benefitsSectionTitle = input<string | null>(null); // e.g. "Why track this?"

  // Custom overrides (override context config when set)
  customTitle = input<string | null>(null);
  customMessage = input<string | null>(null);
  customActionLabel = input<string | null>(null);
  customActionIcon = input<string | null>(null);
  customRoute = input<string | null>(null);

  // V2 API aliases for backward compatibility
  heading = input<string | null>(null);
  description = input<string | null>(null);
  tip = input<string | null>(null);

  // Benefits list (explicit override when no context)
  benefits = input<string[] | null>(null);

  // Primary action
  actionLabel = input<string | null>(null);
  actionIcon = input<string | null>(null);
  actionLink = input<string | null>(null);
  actionHandler = input<(() => void) | null>(null);
  actionSeverity = input<
    | "primary"
    | "secondary"
    | "success"
    | "info"
    | "warning"
    | "danger"
    | "help"
    | "contrast"
  >("primary");

  // Secondary action (NEW)
  secondaryActionLabel = input<string | null>(null);
  secondaryActionIcon = input<string | null>(null);
  secondaryActionLink = input<string | null>(null);

  // Help link (NEW)
  helpText = input<string | null>(null);
  helpLink = input<string | null>(null);

  // Events
  onAction = output<void>();
  onSecondaryAction = output<void>();

  // Resolved values (context config + overrides)
  private config = computed(() => {
    const ctx = this.context();
    return ctx ? CONTEXT_CONFIGS[ctx] : null;
  });
  resolvedIcon = computed(() => this.icon() ?? this.config()?.icon ?? null);
  resolvedTitle = computed(() =>
    this.customTitle() ||
    this.heading() ||
    this.title() ||
    this.config()?.title ||
    "No Data Available"
  );
  resolvedMessage = computed(() =>
    this.customMessage() ||
    this.description() ||
    this.message() ||
    this.config()?.message ||
    null
  );
  resolvedBenefits = computed(() => {
    const expl = this.benefits();
    if (expl?.length) return expl;
    const cfg = this.config();
    return this.showBenefits() && cfg ? (cfg.benefits ?? []) : [];
  });
  resolvedBenefitsTitle = computed(() =>
    this.benefitsSectionTitle() ?? (this.context() && this.showBenefits() ? "Why track this?" : null)
  );
  resolvedActionLabel = computed(() =>
    this.customActionLabel() ||
    this.actionLabel() ||
    this.config()?.actionLabel ||
    null
  );
  resolvedActionIcon = computed(() => {
    const icon = this.customActionIcon() || this.actionIcon() || this.config()?.actionIcon || "";
    return icon.replace(/^pi\s+/, "");
  });
  resolvedActionLink = computed(() => {
    if (this.actionHandler()) return null;
    return this.customRoute() || this.actionLink() || this.config()?.route || null;
  });
  resolvedActionHandler = computed(() => this.actionHandler());

  // Event handlers
  handleAction(): void {
    const handler = this.actionHandler();
    if (handler) {
      handler();
    }
    this.onAction.emit();
  }

  handleSecondaryAction(): void {
    this.onSecondaryAction.emit();
  }
}
