import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { TagModule } from "primeng/tag";
import { CardComponent } from "../card/card.component";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardComponent, TagModule],
  template: `
    <app-card [title]="data().title" [subtitle]="data().subtitle">
      <div header-actions>
        <div class="trend-icon" [class]="data().icon || 'pi-chart-line'">
          <i [class]="'pi ' + (data().icon || 'pi-chart-line')"></i>
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
    </app-card>
  `,
  styleUrl: "./trend-card.component.scss",
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
