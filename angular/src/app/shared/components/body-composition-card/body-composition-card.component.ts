/**
 * Body Composition Card Component
 * 
 * Displays latest body composition metrics from smart scale.
 * Shows weight, body fat, muscle mass with trend indicators.
 * 
 * Design System Compliant (DESIGN_SYSTEM_RULES.md):
 * - Decision 14: Border-first cards
 * - Decision 33: Card header pattern
 */

import { CommonModule, DecimalPipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { RouterModule } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { PerformanceDataService } from "../../../core/services/performance-data.service";
import { AuthService } from "../../../core/services/auth.service";

interface BodyCompositionData {
  weight: number | null;
  bodyFat: number | null;
  muscleMass: number | null;
  bodyWater: number | null;
  bmi: number | null;
  visceralFat: number | null;
  basalMetabolicRate: number | null;
  measurementDate: string | null;
  weightTrend: "up" | "down" | "stable" | null;
  fatTrend: "up" | "down" | "stable" | null;
}

@Component({
  selector: "app-body-composition-card",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    SkeletonModule,
    DecimalPipe,
  ],
  template: `
    <div class="body-comp-card">
      <!-- Header -->
      <div class="card-header">
        <div class="header-title">
          <i class="pi pi-chart-pie"></i>
          <h3>Body Composition</h3>
        </div>
        @if (lastUpdated()) {
          <span class="last-updated">
            {{ formatDate(lastUpdated()!) }}
          </span>
        }
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-state">
          <div class="metric-skeleton">
            <p-skeleton width="60%" height="2rem"></p-skeleton>
            <p-skeleton width="40%" height="1rem"></p-skeleton>
          </div>
          <div class="metrics-grid">
            @for (i of [1, 2, 3, 4]; track i) {
              <div class="metric-skeleton-small">
                <p-skeleton width="100%" height="3rem"></p-skeleton>
              </div>
            }
          </div>
        </div>
      }

      <!-- Empty State -->
      @else if (!hasData()) {
        <div class="empty-state">
          <i class="pi pi-scale empty-icon"></i>
          <p class="empty-title">No measurements yet</p>
          <p class="empty-description">
            Log your first body composition measurement to track changes over time.
          </p>
          <button 
            class="log-btn"
            routerLink="/dashboard"
            [queryParams]="{ action: 'log-metrics' }"
          >
            <i class="pi pi-plus"></i>
            Log Measurement
          </button>
        </div>
      }

      <!-- Data Display -->
      @else {
        <div class="body-comp-content">
          <!-- Primary Metric: Weight -->
          <div class="primary-metric">
            <div class="metric-main">
              <span class="metric-value">{{ data().weight | number:'1.1-1' }}</span>
              <span class="metric-unit">kg</span>
              @if (data().weightTrend) {
                <span 
                  class="trend-indicator"
                  [class.up]="data().weightTrend === 'up'"
                  [class.down]="data().weightTrend === 'down'"
                >
                  <i [class]="getTrendIcon(data().weightTrend!)"></i>
                </span>
              }
            </div>
            <span class="metric-label">Total Weight</span>
          </div>

          <!-- Secondary Metrics Grid -->
          <div class="metrics-grid">
            <!-- Body Fat -->
            @if (data().bodyFat !== null) {
              <div class="metric-item">
                <div class="metric-row">
                  <span class="metric-value-sm">{{ data().bodyFat | number:'1.1-1' }}%</span>
                  @if (data().fatTrend) {
                    <span 
                      class="trend-small"
                      [class.good]="data().fatTrend === 'down'"
                      [class.neutral]="data().fatTrend === 'stable'"
                    >
                      <i [class]="getTrendIcon(data().fatTrend!)"></i>
                    </span>
                  }
                </div>
                <span class="metric-label-sm">Body Fat</span>
                <div 
                  class="fat-bar"
                  [pTooltip]="getFatRangeTooltip(data().bodyFat!)"
                >
                  <div 
                    class="fat-fill"
                    [style.width.%]="getFatBarWidth(data().bodyFat!)"
                    [class.low]="data().bodyFat! < 10"
                    [class.ideal]="data().bodyFat! >= 10 && data().bodyFat! <= 20"
                    [class.moderate]="data().bodyFat! > 20 && data().bodyFat! <= 30"
                    [class.high]="data().bodyFat! > 30"
                  ></div>
                </div>
              </div>
            }

            <!-- Muscle Mass -->
            @if (data().muscleMass !== null) {
              <div class="metric-item">
                <span class="metric-value-sm">{{ data().muscleMass | number:'1.1-1' }} kg</span>
                <span class="metric-label-sm">Muscle Mass</span>
              </div>
            }

            <!-- Body Water -->
            @if (data().bodyWater !== null) {
              <div class="metric-item">
                <span class="metric-value-sm">{{ data().bodyWater | number:'1.1-1' }}%</span>
                <span class="metric-label-sm">Body Water</span>
              </div>
            }

            <!-- BMR -->
            @if (data().basalMetabolicRate !== null) {
              <div class="metric-item">
                <span class="metric-value-sm">{{ data().basalMetabolicRate }}</span>
                <span class="metric-label-sm">BMR (kcal)</span>
              </div>
            }
          </div>

          <!-- View Details Link -->
          <div class="card-footer">
            <a routerLink="/performance/body-composition" class="view-link">
              View Full History
              <i class="pi pi-arrow-right"></i>
            </a>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './body-composition-card.component.scss',
})
export class BodyCompositionCardComponent implements OnInit {
  private performanceDataService = inject(PerformanceDataService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  // State
  isLoading = signal(true);
  data = signal<BodyCompositionData>({
    weight: null,
    bodyFat: null,
    muscleMass: null,
    bodyWater: null,
    bmi: null,
    visceralFat: null,
    basalMetabolicRate: null,
    measurementDate: null,
    weightTrend: null,
    fatTrend: null,
  });

  hasData = computed(() => this.data().weight !== null);
  lastUpdated = computed(() => this.data().measurementDate);

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    const userId = this.authService.getUser()?.id;
    if (!userId) {
      this.isLoading.set(false);
      return;
    }

    this.performanceDataService
      .getMeasurements("3m", 1, 10)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const measurements = response.data;
          if (measurements && measurements.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const latest = measurements[0] as any;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const previous = measurements.length > 1 ? (measurements[1] as any) : null;

            this.data.set({
              weight: latest.weight || null,
              bodyFat: latest.body_fat_percentage || latest.bodyFat || null,
              muscleMass: latest.muscle_mass || latest.muscleMass || null,
              bodyWater: latest.body_water_percentage || latest.bodyWater || null,
              bmi: latest.bmi || null,
              visceralFat: latest.visceral_fat_rating || null,
              basalMetabolicRate: latest.basal_metabolic_rate || null,
              measurementDate: latest.measurement_date || latest.created_at || null,
              weightTrend: previous
                ? this.calculateTrend(latest.weight, previous.weight)
                : null,
              fatTrend: previous
                ? this.calculateTrend(
                    latest.body_fat_percentage || latest.bodyFat,
                    previous.body_fat_percentage || previous.bodyFat
                  )
                : null,
            });
          }
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  private calculateTrend(
    current: number | null | undefined,
    previous: number | null | undefined
  ): "up" | "down" | "stable" | null {
    if (current == null || previous == null) return null;
    const diff = current - previous;
    if (Math.abs(diff) < 0.1) return "stable";
    return diff > 0 ? "up" : "down";
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

  getFatBarWidth(fatPercent: number): number {
    // Scale 0-40% body fat to 0-100% bar width
    return Math.min(100, (fatPercent / 40) * 100);
  }

  getFatRangeTooltip(fatPercent: number): string {
    if (fatPercent < 10) return "Below essential fat range";
    if (fatPercent <= 14) return "Athletic range";
    if (fatPercent <= 20) return "Fitness range";
    if (fatPercent <= 25) return "Average range";
    return "Above average";
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    }
  }
}
