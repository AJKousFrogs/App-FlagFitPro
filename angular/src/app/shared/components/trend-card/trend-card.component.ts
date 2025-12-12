import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

export interface TrendData {
  title: string;
  value: string | number;
  change?: number; // Percentage change
  changeLabel?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'stable';
  subtitle?: string;
}

@Component({
  selector: 'app-trend-card',
  standalone: true,
  imports: [CommonModule, CardModule, TagModule],
  template: `
    <p-card class="trend-card">
      <div class="trend-header">
        <div class="trend-icon" [class]="data.icon || 'pi-chart-line'">
          <i [class]="'pi ' + (data.icon || 'pi-chart-line')"></i>
        </div>
        <div class="trend-content">
          <h4 class="trend-title">{{ data.title }}</h4>
          @if (data.subtitle) {
            <p class="trend-subtitle">{{ data.subtitle }}</p>
          }
        </div>
      </div>
      
      <div class="trend-body">
        <div class="trend-value">{{ formatValue(data.value) }}</div>
        @if (data.change !== undefined) {
          <div class="trend-change" [class]="getTrendClass()">
            <i [class]="'pi ' + getTrendIcon()"></i>
            <span>{{ formatChange(data.change) }}</span>
            @if (data.changeLabel) {
              <span class="change-label">{{ data.changeLabel }}</span>
            }
          </div>
        }
      </div>
    </p-card>
  `,
  styles: [`
    .trend-card {
      height: 100%;
    }

    .trend-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .trend-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: var(--p-primary-50);
      color: var(--p-primary-600);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .trend-content {
      flex: 1;
    }

    .trend-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.25rem 0;
    }

    .trend-subtitle {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .trend-body {
      margin-top: 1rem;
    }

    .trend-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }

    .trend-change {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .trend-change.up {
      color: #22c55e;
    }

    .trend-change.down {
      color: #ef4444;
    }

    .trend-change.stable {
      color: var(--text-secondary);
    }

    .change-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
      font-weight: normal;
    }
  `]
})
export class TrendCardComponent {
  @Input() data!: TrendData;

  formatValue(value: string | number): string {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return value;
  }

  formatChange(change: number): string {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  }

  getTrendClass(): string {
    const change = this.data.change || 0;
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'stable';
  }

  getTrendIcon(): string {
    const change = this.data.change || 0;
    if (change > 0) return 'pi-arrow-up';
    if (change < 0) return 'pi-arrow-down';
    return 'pi-minus';
  }
}

