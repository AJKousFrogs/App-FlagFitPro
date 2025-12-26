import { Component, input, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardModule } from "primeng/card";
import { TagModule } from "primeng/tag";

export interface TrendData {
  title: string;
  value: string | number;
  change?: number; // Percentage change
  changeLabel?: string;
  icon?: string;
  trend?: "up" | "down" | "stable";
  subtitle?: string;
}

@Component({
  selector: "app-trend-card",
  standalone: true,
  imports: [CommonModule, CardModule, TagModule],
  template: `
    <p-card class="trend-card">
      <div class="trend-header">
        <div class="trend-icon" [class]="data().icon || 'pi-chart-line'">
          <i [class]="'pi ' + (data().icon || 'pi-chart-line')"></i>
        </div>
        <div class="trend-content">
          <h4 class="trend-title">{{ data().title }}</h4>
          @if (data().subtitle) {
            <p class="trend-subtitle">{{ data().subtitle }}</p>
          }
        </div>
      </div>

      <div class="trend-body">
        <div class="trend-value">{{ formatValue(data().value) }}</div>
        @if (data().change !== undefined) {
          <div class="trend-change" [class]="trendClass()">
            <i [class]="'pi ' + trendIcon()"></i>
            <span>{{ formatChange(data().change!) }}</span>
            @if (data().changeLabel) {
              <span class="change-label">{{ data().changeLabel }}</span>
            }
          </div>
        }
      </div>
    </p-card>
  `,
  styles: [
    `
      .trend-card {
        height: 100%;
      }

      .trend-header {
        display: flex;
        align-items: flex-start;
        gap: var(--space-4);
        margin-bottom: var(--space-4);
      }

      .trend-icon {
        width: 48px;
        height: 48px;
        border-radius: var(--radius-xl);
        background: var(--color-brand-primary-subtle);
        color: var(--color-brand-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--text-2xl);
        flex-shrink: 0;
      }

      .trend-content {
        flex: 1;
      }

      .trend-title {
        font-size: var(--text-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        margin: 0 0 var(--space-1) 0;
      }

      .trend-subtitle {
        font-size: var(--text-xs);
        color: var(--color-text-secondary);
        margin: 0;
      }

      .trend-body {
        margin-top: var(--space-4);
      }

      .trend-value {
        font-size: var(--text-3xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
        margin-bottom: var(--space-2);
      }

      .trend-change {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--text-sm);
        font-weight: var(--font-weight-semibold);
      }

      .trend-change.up {
        color: var(--color-status-success);
      }

      .trend-change.down {
        color: var(--color-status-error);
      }

      .trend-change.stable {
        color: var(--color-text-secondary);
      }

      .change-label {
        font-size: var(--text-xs);
        color: var(--color-text-secondary);
        font-weight: var(--font-weight-normal);
      }
    `,
  ],
})
export class TrendCardComponent {
  // Angular 21: Use input() signal with required() instead of @Input() with !
  data = input.required<TrendData>();

  // Angular 21: Use computed signals for derived values
  trendClass = computed(() => {
    const change = this.data().change || 0;
    if (change > 0) return "up";
    if (change < 0) return "down";
    return "stable";
  });

  trendIcon = computed(() => {
    const change = this.data().change || 0;
    if (change > 0) return "pi-arrow-up";
    if (change < 0) return "pi-arrow-down";
    return "pi-minus";
  });

  formatValue(value: string | number): string {
    if (typeof value === "number") {
      return value.toLocaleString();
    }
    return value;
  }

  formatChange(change: number): string {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(1)}%`;
  }
}
