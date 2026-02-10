import { CommonModule } from "@angular/common";
import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  ChangeDetectionStrategy,
  computed,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { StatusTagComponent } from "../status-tag/status-tag.component";
import { Skeleton } from "primeng/skeleton";
import { ReadinessService } from "../../../core/services/readiness.service";
import { FeatureFlagsService } from "../../../core/services/feature-flags.service";
import { NextGenMetricsService } from "../../../core/services/next-gen-metrics.service";
import { WellnessService } from "../../../core/services/wellness.service";
import { PerformanceDataService } from "../../../core/services/performance-data.service";
import { BodyCompositionService } from "../../../core/services/body-composition.service";
import { ButtonComponent, CardComponent } from "../ui-components";
import { nextGen_computeLbmTrend } from "../../../core/utils/next-gen-metrics";

@Component({
  selector: "app-readiness-widget",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CardComponent,
    StatusTagComponent,
    Skeleton,
    ButtonComponent,
  ],
  template: `
    <app-card title="Readiness Today">
      <div header-actions>
        <app-button
          icon="refresh"
          variant="text"
          [loading]="loading()"
          (clicked)="refresh()"
          [disabled]="loading()"
          ariaLabel="Refresh readiness score"
        ></app-button>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <p-skeleton width="100%" height="var(--space-16)" class="mb-4"></p-skeleton>
          <p-skeleton width="60%" height="var(--space-8)"></p-skeleton>
        </div>
      } @else if (error()) {
        <div class="error-state p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-800 font-semibold mb-2">Error</p>
          <p class="text-red-700 text-sm">{{ error() }}</p>
          <app-button
            variant="outlined"
            size="sm"
            icon="refresh"
            (clicked)="refresh()"
            class="mt-3"
            >Retry</app-button
          >
        </div>
      } @else if (readiness()) {
        <div class="readiness-content">
          <!-- Main Score Display -->
          <div class="score-display mb-6 text-center">
            <div class="score-value" [class]="getScoreColorClass()">
              {{ readiness()?.score }}
            </div>
            <div class="score-label text-text-secondary text-sm">
              Readiness Score / 100
            </div>
          </div>

          <!-- Level and Suggestion -->
          <div class="meta-section mb-6">
            <div class="flex items-center justify-center gap-3 mb-4">
              <app-status-tag
                [severity]="getSeverity()"
                [value]="readiness()?.level || 'moderate' | titlecase"
                size="sm"
              />
            </div>
            <p
              class="suggestion-text text-center text-text-primary font-medium"
            >
              {{ getSuggestionText() }}
            </p>
          </div>

          <!-- ACWR Metrics -->
          <div class="acwr-section bg-surface-secondary rounded-lg p-4 mb-4">
            <div class="text-xs text-text-secondary mb-3 font-semibold">
              Workload Metrics
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div class="metric-item">
                <div class="metric-label text-xs text-text-secondary">ACWR</div>
                <div class="metric-value font-bold" [class]="getACWRColor()">
                  {{ readiness()?.acwr | number: "1.2-2" }}
                </div>
              </div>
              <div class="metric-item">
                <div class="metric-label text-xs text-text-secondary">
                  Acute
                </div>
                <div class="metric-value font-semibold text-text-primary">
                  {{ readiness()?.acuteLoad | number: "1.0-0" }}
                </div>
              </div>
              <div class="metric-item">
                <div class="metric-label text-xs text-text-secondary">
                  Chronic
                </div>
                <div class="metric-value font-semibold text-text-primary">
                  {{ readiness()?.chronicLoad | number: "1.0-0" }}
                </div>
              </div>
            </div>
          </div>

          <!-- Next-Gen Preview -->
          @if (nextGenEnabled()) {
            <div
              class="next-gen-preview bg-surface-secondary rounded-lg p-4 mb-4"
            >
              <div class="text-xs text-text-secondary mb-3 font-semibold">
                Next-Gen Preview
              </div>
              @if (nextGenLoading()) {
                <p class="text-xs text-text-secondary">Loading preview…</p>
              } @else if (nextGenError()) {
                <p class="text-xs text-red-600">
                  {{ nextGenError() }}
                </p>
              } @else if (nextGenPreview()) {
                <div class="grid grid-cols-2 gap-3">
                  <div class="metric-item">
                    <div class="metric-label text-xs text-text-secondary">
                      Readiness
                    </div>
                    <div class="metric-value font-bold text-text-primary">
                      {{ nextGenPreview()?.readiness?.score | number: "1.0-0" }}
                    </div>
                  </div>
                  <div class="metric-item">
                    <div class="metric-label text-xs text-text-secondary">
                      Spike Risk
                    </div>
                    <div
                      class="metric-value font-bold"
                      [class]="getNextGenRiskClass()"
                    >
                      {{ nextGenPreview()?.workload?.riskLevel | titlecase }}
                    </div>
                  </div>
                  <div class="metric-item">
                    <div class="metric-label text-xs text-text-secondary">
                      Spike %
                    </div>
                    <div class="metric-value font-semibold text-text-primary">
                      {{
                        (nextGenPreview()?.workload?.spikePct || 0) * 100
                          | number: "1.0-0"
                      }}%
                    </div>
                  </div>
                  <div class="metric-item">
                    <div class="metric-label text-xs text-text-secondary">
                      Wellness
                    </div>
                    <div class="metric-value font-semibold text-text-primary">
                      {{ nextGenPreview()?.wellness?.score || "N/A" }}
                    </div>
                  </div>
                </div>
              } @else {
                <p class="text-xs text-text-secondary">
                  Preview data not available yet.
                </p>
              }
            </div>
          }

          <!-- Next-Gen Alerts -->
          @if (nextGenEnabled() && (loadSpikeAlert() || hydrationAlert() || lbmAlert())) {
            <div class="next-gen-alerts bg-surface-secondary rounded-lg p-4 mb-4">
              <div class="text-xs text-text-secondary mb-2 font-semibold">
                Next-Gen Alerts
              </div>
              <div class="alert-list">
                @if (loadSpikeAlert()) {
                  <div class="alert-item text-red-600">
                    <i class="pi pi-exclamation-triangle"></i>
                    <span>{{ loadSpikeAlert() }}</span>
                  </div>
                }
                @if (hydrationAlert()) {
                  <div class="alert-item text-yellow-600">
                    <i class="pi pi-info-circle"></i>
                    <span>{{ hydrationAlert() }}</span>
                  </div>
                }
                @if (lbmAlert()) {
                  <div class="alert-item text-orange-500">
                    <i class="pi pi-info-circle"></i>
                    <span>{{ lbmAlert() }}</span>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Data Mode Indicator -->
          @if (readiness()?.dataMode === "reduced") {
            <div
              class="data-mode-indicator bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4"
            >
              <div class="flex items-center gap-2">
                <i
                  class="pi pi-info-circle text-yellow-600 dark:text-yellow-400"
                ></i>
                <div class="flex-1">
                  <div
                    class="text-xs font-semibold text-yellow-800 dark:text-yellow-200 mb-1"
                  >
                    Reduced Data Mode
                  </div>
                  <div class="text-xs text-yellow-700 dark:text-yellow-300">
                    Wellness questionnaire completion is low. Sleep metrics are
                    weighted more heavily as a proxy. Completeness:
                    {{ readiness()?.wellnessIndex?.completeness }}%
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Wellness Index Details -->
          @if (readiness()?.wellnessIndex) {
            <div
              class="wellness-index bg-surface-secondary rounded-lg p-4 mb-4"
            >
              <div class="text-xs text-text-secondary mb-3 font-semibold">
                Wellness Index
              </div>
              <div class="grid grid-cols-2 gap-2 mb-2">
                <div class="wellness-item">
                  <span class="text-xs text-text-secondary">Fatigue:</span>
                  <span class="font-semibold ml-2"
                    >{{ readiness()?.wellnessIndex?.fatigue || "N/A" }}/5</span
                  >
                </div>
                <div class="wellness-item">
                  <span class="text-xs text-text-secondary"
                    >Sleep Quality:</span
                  >
                  <span class="font-semibold ml-2"
                    >{{
                      readiness()?.wellnessIndex?.sleepQuality || "N/A"
                    }}/5</span
                  >
                </div>
                <div class="wellness-item">
                  <span class="text-xs text-text-secondary">Soreness:</span>
                  <span class="font-semibold ml-2"
                    >{{ readiness()?.wellnessIndex?.soreness || "N/A" }}/5</span
                  >
                </div>
                @if (readiness()?.wellnessIndex?.mood) {
                  <div class="wellness-item">
                    <span class="text-xs text-text-secondary">Mood:</span>
                    <span class="font-semibold ml-2"
                      >{{ readiness()?.wellnessIndex?.mood }}/5</span
                    >
                  </div>
                }
                @if (readiness()?.wellnessIndex?.stress) {
                  <div class="wellness-item">
                    <span class="text-xs text-text-secondary">Stress:</span>
                    <span class="font-semibold ml-2"
                      >{{ readiness()?.wellnessIndex?.stress }}/5</span
                    >
                  </div>
                }
              </div>
              <div class="mt-2 pt-2 border-t border-surface-border">
                <div class="flex justify-between items-center">
                  <span class="text-xs text-text-secondary"
                    >Wellness Subscore:</span
                  >
                  <span class="font-bold"
                    >{{ readiness()?.wellnessIndex?.subscore }}/100</span
                  >
                </div>
              </div>
            </div>
          }

          <!-- Component Scores Breakdown -->
          @if (readiness()?.componentScores) {
            <div class="component-scores">
              <div class="text-xs text-text-secondary mb-2 font-semibold">
                Component Scores
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div class="component-item">
                  <span class="text-xs text-text-secondary">Workload:</span>
                  <span class="font-semibold ml-2">{{
                    readiness()?.componentScores?.workload
                  }}</span>
                </div>
                <div class="component-item">
                  <span class="text-xs text-text-secondary">Wellness:</span>
                  <span class="font-semibold ml-2">{{
                    readiness()?.componentScores?.wellness
                  }}</span>
                </div>
                <div class="component-item">
                  <span class="text-xs text-text-secondary">Sleep:</span>
                  <span class="font-semibold ml-2">{{
                    readiness()?.componentScores?.sleep
                  }}</span>
                </div>
                <div class="component-item">
                  <span class="text-xs text-text-secondary">Proximity:</span>
                  <span class="font-semibold ml-2">{{
                    readiness()?.componentScores?.proximity
                  }}</span>
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="no-data-state p-4 text-center">
          <p class="text-text-secondary mb-4">No readiness data available</p>
          <app-button iconLeft="pi-calculator" (clicked)="refresh()"
            >Calculate Readiness</app-button
          >
        </div>
      }
    </app-card>
  `,
  styleUrl: "./readiness-widget.component.scss",
})
export class ReadinessWidgetComponent {
  // Angular 21: Use input.required() for required inputs instead of @Input() with !
  athleteId = input.required<string>();

  private readinessService = inject(ReadinessService);
  private featureFlags = inject(FeatureFlagsService);
  private nextGenMetricsService = inject(NextGenMetricsService);
  private wellnessService = inject(WellnessService);
  private performanceDataService = inject(PerformanceDataService);
  private bodyCompositionService = inject(BodyCompositionService);
  private destroyRef = inject(DestroyRef);

  loading = this.readinessService.loading;
  readiness = this.readinessService.current;
  error = this.readinessService.error;
  nextGenEnabled = this.featureFlags.nextGenMetricsPreview;
  nextGenLoading = this.nextGenMetricsService.loading;
  nextGenError = this.nextGenMetricsService.error;
  nextGenPreview = this.nextGenMetricsService.loadPreview;
  latestWellness = this.wellnessService.latestWellnessEntry;

  loadSpikeAlert = computed(() => {
    if (!this.nextGenEnabled()) return null;
    const preview = this.nextGenPreview();
    if (!preview) return null;
    const spike = preview.workload;
    if (!spike.spikeDetected) return null;
    const pct = spike.spikePct !== null ? Math.round(spike.spikePct * 100) : null;
    return pct !== null
      ? `Training load spike detected (+${pct}%).`
      : "Training load spike detected.";
  });

  hydrationAlert = computed(() => {
    if (!this.nextGenEnabled()) return null;
    const hydration = this.latestWellness()?.hydration;
    if (hydration === undefined || hydration === null) return null;
    if (hydration >= 6) return null;
    return `Hydration is low (${hydration}/10). Focus on fluids today.`;
  });

  lbmAlert = computed(() => {
    if (!this.nextGenEnabled()) return null;
    const measurements = this.performanceDataService.recentMeasurements();
    if (measurements.length < 2) return null;
    const entries = measurements
      .filter((m) => typeof m.bodyFat === "number" && typeof m.weight === "number")
      .map((m) => ({
        date: m.timestamp.split("T")[0],
        lbm: this.bodyCompositionService.calculateLeanBodyMass(
          m.weight,
          m.bodyFat ?? 0,
        ),
      }));
    if (entries.length < 2) return null;
    const trend = nextGen_computeLbmTrend(entries);
    if (!trend.alert) return null;
    if (trend.change !== undefined) {
      return `Lean mass trending down (${trend.change} kg). Review recovery and nutrition.`;
    }
    return "Lean mass trending down. Review recovery and nutrition.";
  });

  constructor() {
    // Angular 21: Use effect() to react to input changes
    effect(() => {
      const id = this.athleteId();
      if (!id) return;
      this.refresh();
      if (this.nextGenEnabled()) {
        this.nextGenMetricsService.refreshLoadPreview();
      }
    });

    effect(() => {
      if (!this.nextGenEnabled()) {
        this.nextGenMetricsService.clearPreview();
      }
    });
  }

  refresh() {
    const id = this.athleteId();
    if (id) {
      // Use takeUntilDestroyed for proper subscription cleanup
      this.readinessService
        .calculateToday(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }
    if (this.nextGenEnabled()) {
      this.nextGenMetricsService.refreshLoadPreview();
    }
  }

  getSeverity() {
    return this.readinessService.getSeverity(
      this.readiness()?.level || "moderate",
    );
  }

  getSuggestionText(): string {
    return this.readinessService.getSuggestionText(
      this.readiness()?.suggestion || "maintain",
    );
  }

  getScoreColorClass(): string {
    const score = this.readiness()?.score || 0;
    return this.readinessService.getScoreColor(score);
  }

  getACWRColor(): string {
    const acwr = this.readiness()?.acwr || 0;
    if (acwr > 1.5) return "text-red-600";
    if (acwr > 1.3) return "text-yellow-600";
    if (acwr < 0.8) return "text-orange-500";
    return "text-green-600";
  }

  getNextGenRiskClass(): string {
    const risk = this.nextGenPreview()?.workload?.riskLevel;
    switch (risk) {
      case "critical":
        return "text-red-600";
      case "high":
        return "text-orange-500";
      case "moderate":
        return "text-yellow-600";
      default:
        return "text-green-600";
    }
  }
}
