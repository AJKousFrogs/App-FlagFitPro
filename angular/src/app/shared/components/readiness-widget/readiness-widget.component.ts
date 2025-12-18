import { Component, input, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ButtonModule } from 'primeng/button';
import { ReadinessService, ReadinessResponse } from '../../../core/services/readiness.service';

@Component({
  selector: 'app-readiness-widget',
  standalone: true,
  imports: [CommonModule, CardModule, TagModule, SkeletonModule, ButtonModule],
  template: `
    <div class="readiness-widget bg-surface-primary rounded-lg shadow-medium p-6">
      <div class="header mb-4 flex items-center justify-between">
        <h3 class="text-xl font-bold text-text-primary">Readiness Today</h3>
        <p-button
          icon="pi pi-refresh"
          [text]="true"
          [rounded]="true"
          [loading]="loading()"
          (onClick)="refresh()"
          [disabled]="loading()"
          ariaLabel="Refresh readiness score">
        </p-button>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <p-skeleton width="100%" height="4rem" class="mb-4"></p-skeleton>
          <p-skeleton width="60%" height="2rem"></p-skeleton>
        </div>
      } @else if (error()) {
        <div class="error-state p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-800 font-semibold mb-2">Error</p>
          <p class="text-red-700 text-sm">{{ error() }}</p>
          <p-button
            label="Retry"
            icon="pi pi-refresh"
            size="small"
            [outlined]="true"
            (onClick)="refresh()"
            class="mt-3">
          </p-button>
        </div>
      } @else if (readiness()) {
        <div class="readiness-content">
          <!-- Main Score Display -->
          <div class="score-display mb-6 text-center">
            <div class="score-value" [class]="getScoreColorClass()">
              {{ readiness()?.score }}
            </div>
            <div class="score-label text-text-secondary text-sm">Readiness Score / 100</div>
          </div>

          <!-- Level and Suggestion -->
          <div class="meta-section mb-6">
            <div class="flex items-center justify-center gap-3 mb-4">
              <p-tag
                [severity]="getSeverity()"
                [value]="(readiness()?.level || 'moderate') | titlecase">
              </p-tag>
            </div>
            <p class="suggestion-text text-center text-text-primary font-medium">
              {{ getSuggestionText() }}
            </p>
          </div>

          <!-- ACWR Metrics -->
          <div class="acwr-section bg-surface-secondary rounded-lg p-4 mb-4">
            <div class="text-xs text-text-secondary mb-3 font-semibold">Workload Metrics</div>
            <div class="grid grid-cols-3 gap-4">
              <div class="metric-item">
                <div class="metric-label text-xs text-text-secondary">ACWR</div>
                <div class="metric-value font-bold" [class]="getACWRColor()">
                  {{ readiness()?.acwr | number:'1.2-2' }}
                </div>
              </div>
              <div class="metric-item">
                <div class="metric-label text-xs text-text-secondary">Acute</div>
                <div class="metric-value font-semibold text-text-primary">
                  {{ readiness()?.acuteLoad | number:'1.0-0' }}
                </div>
              </div>
              <div class="metric-item">
                <div class="metric-label text-xs text-text-secondary">Chronic</div>
                <div class="metric-value font-semibold text-text-primary">
                  {{ readiness()?.chronicLoad | number:'1.0-0' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Data Mode Indicator -->
          @if (readiness()?.dataMode === 'reduced') {
            <div class="data-mode-indicator bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
              <div class="flex items-center gap-2">
                <i class="pi pi-info-circle text-yellow-600 dark:text-yellow-400"></i>
                <div class="flex-1">
                  <div class="text-xs font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                    Reduced Data Mode
                  </div>
                  <div class="text-xs text-yellow-700 dark:text-yellow-300">
                    Wellness questionnaire completion is low. Sleep metrics are weighted more heavily as a proxy.
                    Completeness: {{ readiness()?.wellnessIndex?.completeness }}%
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Wellness Index Details -->
          @if (readiness()?.wellnessIndex) {
            <div class="wellness-index bg-surface-secondary rounded-lg p-4 mb-4">
              <div class="text-xs text-text-secondary mb-3 font-semibold">Wellness Index</div>
              <div class="grid grid-cols-2 gap-2 mb-2">
                <div class="wellness-item">
                  <span class="text-xs text-text-secondary">Fatigue:</span>
                  <span class="font-semibold ml-2">{{ readiness()?.wellnessIndex?.fatigue || 'N/A' }}/5</span>
                </div>
                <div class="wellness-item">
                  <span class="text-xs text-text-secondary">Sleep Quality:</span>
                  <span class="font-semibold ml-2">{{ readiness()?.wellnessIndex?.sleepQuality || 'N/A' }}/5</span>
                </div>
                <div class="wellness-item">
                  <span class="text-xs text-text-secondary">Soreness:</span>
                  <span class="font-semibold ml-2">{{ readiness()?.wellnessIndex?.soreness || 'N/A' }}/5</span>
                </div>
                @if (readiness()?.wellnessIndex?.mood) {
                  <div class="wellness-item">
                    <span class="text-xs text-text-secondary">Mood:</span>
                    <span class="font-semibold ml-2">{{ readiness()?.wellnessIndex?.mood }}/5</span>
                  </div>
                }
                @if (readiness()?.wellnessIndex?.stress) {
                  <div class="wellness-item">
                    <span class="text-xs text-text-secondary">Stress:</span>
                    <span class="font-semibold ml-2">{{ readiness()?.wellnessIndex?.stress }}/5</span>
                  </div>
                }
              </div>
              <div class="mt-2 pt-2 border-t border-surface-border">
                <div class="flex justify-between items-center">
                  <span class="text-xs text-text-secondary">Wellness Subscore:</span>
                  <span class="font-bold">{{ readiness()?.wellnessIndex?.subscore }}/100</span>
                </div>
              </div>
            </div>
          }

          <!-- Component Scores Breakdown -->
          @if (readiness()?.componentScores) {
            <div class="component-scores">
              <div class="text-xs text-text-secondary mb-2 font-semibold">Component Scores</div>
              <div class="grid grid-cols-2 gap-2">
                <div class="component-item">
                  <span class="text-xs text-text-secondary">Workload:</span>
                  <span class="font-semibold ml-2">{{ readiness()?.componentScores?.workload }}</span>
                </div>
                <div class="component-item">
                  <span class="text-xs text-text-secondary">Wellness:</span>
                  <span class="font-semibold ml-2">{{ readiness()?.componentScores?.wellness }}</span>
                </div>
                <div class="component-item">
                  <span class="text-xs text-text-secondary">Sleep:</span>
                  <span class="font-semibold ml-2">{{ readiness()?.componentScores?.sleep }}</span>
                </div>
                <div class="component-item">
                  <span class="text-xs text-text-secondary">Proximity:</span>
                  <span class="font-semibold ml-2">{{ readiness()?.componentScores?.proximity }}</span>
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="no-data-state p-4 text-center">
          <p class="text-text-secondary mb-4">No readiness data available</p>
          <p-button
            label="Calculate Readiness"
            icon="pi pi-calculator"
            (onClick)="refresh()">
          </p-button>
        </div>
      }
    </div>
  `,
  styles: [`
    .score-value {
      @apply text-5xl font-bold mb-2;
    }

    .score-label {
      @apply text-sm;
    }

    .suggestion-text {
      @apply text-base;
    }

    .metric-item {
      @apply text-center;
    }

    .metric-label {
      @apply mb-1;
    }

    .metric-value {
      @apply text-lg;
    }

    .component-item {
      @apply flex justify-between items-center p-2 bg-white rounded;
    }

    .text-green-600 {
      color: #16a34a;
    }

    .text-yellow-600 {
      color: #ca8a04;
    }

    .text-red-600 {
      color: #dc2626;
    }
  `]
})
export class ReadinessWidgetComponent {
  // Angular 21: Use input.required() for required inputs instead of @Input() with !
  athleteId = input.required<string>();

  private readinessService = inject(ReadinessService);

  loading = this.readinessService.loading;
  readiness = this.readinessService.current;
  error = this.readinessService.error;

  constructor() {
    // Angular 21: Use effect() to react to input changes
    effect(() => {
      const id = this.athleteId();
      if (id) {
        this.refresh();
      }
    });
  }

  refresh() {
    const id = this.athleteId();
    if (id) {
      this.readinessService.calculateToday(id).subscribe();
    }
  }

  getSeverity() {
    return this.readinessService.getSeverity(this.readiness()?.level || 'moderate');
  }

  getSuggestionText(): string {
    return this.readinessService.getSuggestionText(this.readiness()?.suggestion || 'maintain');
  }

  getScoreColorClass(): string {
    const score = this.readiness()?.score || 0;
    return this.readinessService.getScoreColor(score);
  }

  getACWRColor(): string {
    const acwr = this.readiness()?.acwr || 0;
    if (acwr > 1.5) return 'text-red-600';
    if (acwr > 1.3) return 'text-yellow-600';
    if (acwr < 0.8) return 'text-orange-500';
    return 'text-green-600';
  }
}

