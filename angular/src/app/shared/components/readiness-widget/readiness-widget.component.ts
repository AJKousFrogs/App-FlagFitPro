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
import { SkeletonLoaderComponent } from "../skeleton-loader/skeleton-loader.component";
import { ReadinessService } from "../../../core/services/readiness.service";
import { FeatureFlagsService } from "../../../core/services/feature-flags.service";
import { NextGenMetricsService } from "../../../core/services/next-gen-metrics.service";
import { WellnessService } from "../../../core/services/wellness.service";
import { PerformanceDataService } from "../../../core/services/performance-data.service";
import { BodyCompositionService } from "../../../core/services/body-composition.service";
import { ButtonComponent, CardComponent } from "../ui-components";
import { nextGen_computeLbmTrend } from "../../../core/utils/next-gen-metrics";
import { AlertComponent, type AlertVariant } from "../alert/alert.component";
import { EmptyStateComponent } from "../empty-state/empty-state.component";

interface ReadinessWidgetAlert {
  key: string;
  icon: string;
  message: string;
  variant: AlertVariant;
}

@Component({
  selector: "app-readiness-widget",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CardComponent,
    StatusTagComponent,
    SkeletonLoaderComponent,
    ButtonComponent,
    AlertComponent,
    EmptyStateComponent,
  ],
  template: `
    <app-card title="Readiness Today">
      <div header-actions>
        <app-button
          iconLeft="pi-refresh"
          variant="text"
          [loading]="loading()"
          (clicked)="refresh()"
          [disabled]="loading()"
          ariaLabel="Refresh readiness score"
        ></app-button>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <app-skeleton-loader variant="block" width="100%" height="var(--space-16)" class="mb-4" />
          <app-skeleton-loader variant="block" width="60%" height="var(--space-8)" />
        </div>
      } @else if (error()) {
        <app-alert
          variant="error"
          title="Unable to load readiness"
          [message]="error() || ''"
          styleClass="widget-alert"
        >
          <div class="widget-alert-actions">
            <app-button
              variant="secondary"
              size="sm"
              iconLeft="pi-refresh"
              (clicked)="refresh()"
            >
              Retry
            </app-button>
          </div>
        </app-alert>
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
                <div
                  class="metric-value font-bold"
                  [class]="getACWRValueClass()"
                >
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
                <app-alert
                  variant="error"
                  density="compact"
                  [message]="nextGenError() || ''"
                  styleClass="widget-alert widget-alert--compact"
                />
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
                    [class]="getNextGenRiskValueClass()"
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
          @if (nextGenEnabled() && nextGenAlerts().length > 0) {
            <div class="widget-alert-stack">
              @for (alert of nextGenAlerts(); track alert.key) {
                <app-alert
                  [variant]="alert.variant"
                  [icon]="alert.icon"
                  [message]="alert.message"
                  density="compact"
                  styleClass="widget-alert widget-alert--compact"
                />
              }
            </div>
          }

          <!-- Data Mode Indicator -->
          @if (readiness()?.dataMode === "reduced") {
            <app-alert
              variant="warning"
              icon="pi pi-info-circle"
              title="Reduced Data Mode"
              [message]="reducedDataModeMessage()"
              density="compact"
              styleClass="widget-alert"
            />
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
        <app-empty-state
          icon="pi-calculator"
          heading="No readiness data available"
          description="Calculate readiness to see today’s score, workload, and recovery guidance."
          [compact]="true"
          [inline]="true"
        >
          <app-button iconLeft="pi-calculator" (clicked)="refresh()">
            Calculate Readiness
          </app-button>
        </app-empty-state>
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
  nextGenAlerts = computed<ReadinessWidgetAlert[]>(() => {
    const alerts: ReadinessWidgetAlert[] = [];
    const loadAlert = this.loadSpikeAlert();
    const hydrationAlert = this.hydrationAlert();
    const lbmAlert = this.lbmAlert();

    if (loadAlert) {
      alerts.push({
        key: "load-spike",
        icon: "pi pi-exclamation-triangle",
        message: loadAlert,
        variant: "error",
      });
    }

    if (hydrationAlert) {
      alerts.push({
        key: "hydration",
        icon: "pi pi-info-circle",
        message: hydrationAlert,
        variant: "warning",
      });
    }

    if (lbmAlert) {
      alerts.push({
        key: "lbm",
        icon: "pi pi-info-circle",
        message: lbmAlert,
        variant: "warning",
      });
    }

    return alerts;
  });
  reducedDataModeMessage = computed(() => {
    const completeness = this.readiness()?.wellnessIndex?.completeness;

    return `Wellness questionnaire completion is low. Sleep metrics are weighted more heavily as a proxy.${typeof completeness === "number" ? ` Completeness: ${completeness}%.` : ""}`;
  });

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

  getACWRValueClass(): string {
    const acwr = this.readiness()?.acwr || 0;
    if (acwr > 1.5) return "metric-value--danger";
    if (acwr > 1.3) return "metric-value--warning";
    if (acwr < 0.8) return "metric-value--caution";
    return "metric-value--success";
  }

  getNextGenRiskValueClass(): string {
    const risk = this.nextGenPreview()?.workload?.riskLevel;
    switch (risk) {
      case "critical":
        return "metric-value--danger";
      case "high":
        return "metric-value--caution";
      case "moderate":
        return "metric-value--warning";
      default:
        return "metric-value--success";
    }
  }
}
