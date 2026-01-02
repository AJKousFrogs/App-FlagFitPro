/**
 * Metric Card Component
 *
 * A reusable bento-style card for displaying key metrics.
 * Used in dashboards for workload, ACWR, readiness, etc.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 * - Decision 14: Border-first cards with shadow-only hover
 * - Decision 33: Card header pattern (title left, actions right)
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

export type MetricStatus = "success" | "warning" | "danger" | "info" | "neutral";
export type MetricSize = "sm" | "md" | "lg";

export interface MetricTrend {
  direction: "up" | "down" | "stable";
  value: number;
  label?: string;
}

@Component({
  selector: "app-metric-card",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  template: `
    <div
      class="metric-card"
      [class.metric-card--sm]="size() === 'sm'"
      [class.metric-card--lg]="size() === 'lg'"
      [class.metric-card--clickable]="clickable()"
      [class.metric-card--loading]="loading()"
      [attr.role]="clickable() ? 'button' : 'article'"
      [attr.tabindex]="clickable() ? 0 : null"
      [attr.aria-label]="ariaLabel()"
    >
      <!-- Header -->
      <div class="metric-card__header">
        <div class="metric-card__title-row">
          @if (icon()) {
            <i class="metric-card__icon pi" [class]="'pi-' + icon()"></i>
          }
          <span class="metric-card__label">{{ label() }}</span>
        </div>

        @if (status()) {
          <div class="metric-card__status" [class]="'status--' + status()">
            <span class="status-dot"></span>
            @if (statusLabel()) {
              <span class="status-label">{{ statusLabel() }}</span>
            }
          </div>
        }
      </div>

      <!-- Value -->
      <div class="metric-card__value-container">
        @if (loading()) {
          <div class="metric-card__skeleton"></div>
        } @else {
          <span class="metric-card__value" [class]="'value--' + status()">
            {{ formattedValue() }}
          </span>
          @if (unit()) {
            <span class="metric-card__unit">{{ unit() }}</span>
          }
        }
      </div>

      <!-- Subtitle / Description -->
      @if (subtitle()) {
        <p class="metric-card__subtitle">{{ subtitle() }}</p>
      }

      <!-- Trend Indicator -->
      @if (trend()) {
        <div class="metric-card__trend" [class]="'trend--' + trend()!.direction">
          <i
            class="pi"
            [class.pi-arrow-up]="trend()!.direction === 'up'"
            [class.pi-arrow-down]="trend()!.direction === 'down'"
            [class.pi-minus]="trend()!.direction === 'stable'"
          ></i>
          <span class="trend-value">{{ trend()!.value | number : "1.0-1" }}%</span>
          @if (trend()!.label) {
            <span class="trend-label">{{ trend()!.label }}</span>
          }
        </div>
      }

      <!-- Optional Footer Slot -->
      <ng-content select="[metric-footer]"></ng-content>
    </div>
  `,
  styleUrls: ["./metric-card.component.scss"],
})
export class MetricCardComponent {
  // Required inputs
  label = input.required<string>();
  value = input.required<string | number>();

  // Optional inputs
  icon = input<string>();
  unit = input<string>();
  subtitle = input<string>();
  status = input<MetricStatus>();
  statusLabel = input<string>();
  trend = input<MetricTrend>();
  size = input<MetricSize>("md");
  clickable = input<boolean>(false);
  loading = input<boolean>(false);
  link = input<string>();

  // Computed aria label for accessibility
  ariaLabel = computed(() => {
    const base = `${this.label()}: ${this.value()}`;
    const unitPart = this.unit() ? ` ${this.unit()}` : "";
    const statusPart = this.statusLabel() ? `. Status: ${this.statusLabel()}` : "";
    const trendPart = this.trend()
      ? `. Trend: ${this.trend()!.direction} ${this.trend()!.value}%`
      : "";
    return base + unitPart + statusPart + trendPart;
  });

  // Format value for display
  formattedValue = computed(() => {
    const val = this.value();
    if (typeof val === "number") {
      // Check if it's a decimal that should be formatted
      if (val % 1 !== 0) {
        return val.toFixed(2);
      }
      return val.toLocaleString();
    }
    return val;
  });
}
