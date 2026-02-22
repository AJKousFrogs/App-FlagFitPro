/**
 * AI Mode Explanation Component
 *
 * Phase 2.3 - Motivation & Safety
 * Shows when AI switches to conservative mode, why, confidence level, and actions to improve
 *
 * Design: Modern, clean card with left accent border matching design system
 */

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { Tooltip } from "primeng/tooltip";

export interface AIModeStatus {
  isConservative: boolean;
  confidence: number;
  reason: string;
  missingData: string[];
  staleData: string[];
}

@Component({
  selector: "app-ai-mode-explanation",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, Tooltip],
  template: `
    @if (modeStatus() && modeStatus()!.isConservative) {
      <div class="ai-mode-card">
        <!-- Header with Icon, Title, Badge, and Controls -->
        <div class="mode-header">
          <div class="mode-icon-wrapper">
            <i class="pi pi-shield mode-icon"></i>
          </div>
          <div class="mode-content">
            <h3 class="mode-title">Merlin AI is in Conservative Mode</h3>
            <p class="mode-subtitle">
              Providing cautious recommendations due to incomplete data
            </p>
          </div>
          <div class="mode-header-actions">
            <span
              class="mode-badge"
              pTooltip="AI is being cautious because data confidence is below 70%"
            >
              Conservative
            </span>
            <div class="mode-controls">
              <button
                class="mode-control-btn"
                (click)="toggleCollapsed()"
                [pTooltip]="isCollapsed() ? 'Expand details' : 'Collapse'"
                aria-label="Toggle details"
              >
                <i
                  class="pi"
                  [class.pi-chevron-down]="isCollapsed()"
                  [class.pi-chevron-up]="!isCollapsed()"
                ></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Details Section (collapsible) -->
        @if (!isCollapsed()) {
          <div class="mode-details">
            <!-- Why Conservative Mode -->
            <div class="detail-section">
              <div class="section-label">Why conservative mode:</div>
              <p class="section-text">{{ modeStatus()!.reason }}</p>
            </div>

            <!-- Confidence Level -->
            <div class="detail-section">
              <div class="section-label">Data Confidence:</div>
              <div class="confidence-display">
                <div class="confidence-bar-wrapper">
                  <div class="confidence-bar">
                    <div
                      class="confidence-fill"
                      [style.width.%]="modeStatus()!.confidence * 100"
                      [class.low]="modeStatus()!.confidence < 0.5"
                      [class.moderate]="
                        modeStatus()!.confidence >= 0.5 &&
                        modeStatus()!.confidence < 0.7
                      "
                    ></div>
                  </div>
                </div>
                <span class="confidence-value">
                  {{ modeStatus()!.confidence * 100 | number: "1.0-0" }}%
                </span>
              </div>
              <p class="confidence-note">
                <i class="pi pi-info-circle"></i>
                AI recommendations are more cautious when confidence is below
                70%
              </p>
            </div>

            <!-- Missing Data -->
            @if (modeStatus()!.missingData.length > 0) {
              <div class="detail-section">
                <div class="section-label">Missing data:</div>
                <ul class="data-list">
                  @for (item of modeStatus()!.missingData; track item) {
                    <li>{{ getDataLabel(item) }}</li>
                  }
                </ul>
              </div>
            }

            <!-- Stale Data -->
            @if (modeStatus()!.staleData.length > 0) {
              <div class="detail-section">
                <div class="section-label">Stale data:</div>
                <ul class="data-list">
                  @for (item of modeStatus()!.staleData; track item) {
                    <li>{{ getDataLabel(item) }}</li>
                  }
                </ul>
              </div>
            }

            <!-- Actions to Improve -->
            <div class="detail-section">
              <div class="section-label">Improve data quality:</div>
              <div class="action-buttons">
                @if (hasMissingWellness()) {
                  <button
                    class="action-btn"
                    [routerLink]="['/wellness']"
                  >
                    <i class="pi pi-heart"></i>
                    <span>Complete Wellness Check-in</span>
                  </button>
                }
                @if (hasMissingTraining()) {
                  <button
                    class="action-btn"
                    [routerLink]="['/training/log']"
                  >
                    <i class="pi pi-plus"></i>
                    <span>Log Training Session</span>
                  </button>
                }
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      /* ========================================
         AI MODE CARD - Modern Design
         ======================================== */

      .ai-mode-card {
        background: var(--surface-primary);
        border: var(--border-1) solid var(--color-border-secondary);
        border-left: var(--space-1) solid var(--color-status-warning);
        border-radius: var(--radius-lg);
        padding: var(--space-5);
        margin: var(--space-4) var(--space-5);
        box-shadow: var(--shadow-1);
        transition:
          box-shadow var(--transition-fast),
          border-color var(--transition-fast);
      }

      .ai-mode-card:hover {
        box-shadow: var(--shadow-2);
      }

      /* Header Section */
      .mode-header {
        display: flex;
        align-items: flex-start;
        gap: var(--space-4);
        margin-bottom: var(--space-4);
      }

      .mode-header-actions {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        flex-shrink: 0;
      }

      .mode-controls {
        display: flex;
        align-items: center;
        gap: var(--space-1);
      }

      .mode-control-btn {
        width: var(--space-8);
        height: var(--space-8);
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: var(--border-1) solid var(--color-border-secondary);
        border-radius: var(--radius-lg);
        color: var(--color-text-secondary);
        cursor: pointer;
        transition:
          background-color var(--transition-fast),
          border-color var(--transition-fast),
          color var(--transition-fast);
      }

      .mode-control-btn:hover {
        background: var(--ds-primary-green-ultra-subtle);
        border-color: var(--ds-primary-green);
        color: var(--ds-primary-green);
      }

      .mode-control-btn i {
        font-size: var(--ds-font-size-md);
      }

      .mode-icon-wrapper {
        width: var(--icon-container-lg);
        height: var(--icon-container-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(
          135deg,
          rgba(var(--primitive-warning-500-rgb), 0.1) 0%,
          rgba(var(--primitive-warning-500-rgb), 0.05) 100%
        );
        border-radius: var(--radius-lg);
        flex-shrink: 0;
      }

      .mode-icon {
        font-size: var(--ds-font-size-2xl);
        color: var(--color-status-warning);
      }

      .mode-content {
        flex: 1;
        min-width: 0;
      }

      .mode-title {
        margin: 0 0 var(--space-1) 0;
        font-size: var(--ds-font-size-xl);
        font-weight: var(--ds-font-weight-bold);
        color: var(--color-text-primary);
        line-height: var(--ds-line-height-h3);
      }

      .mode-subtitle {
        margin: 0;
        font-size: var(--ds-font-size-md);
        color: var(--color-text-secondary);
        line-height: var(--ds-line-height-body);
      }

      .mode-badge {
        display: inline-flex;
        align-items: center;
        padding: var(--space-2) var(--space-4);
        background: linear-gradient(
          135deg,
          rgba(var(--primitive-warning-500-rgb), 0.15) 0%,
          rgba(var(--primitive-warning-500-rgb), 0.08) 100%
        );
        border: var(--border-1) solid
          rgba(var(--primitive-warning-500-rgb), 0.3);
        border-radius: var(--radius-full);
        font-size: var(--ds-font-size-md);
        font-weight: var(--ds-font-weight-semibold);
        color: var(--color-status-warning);
        cursor: help;
        flex-shrink: 0;
        transition:
          background var(--transition-fast),
          border-color var(--transition-fast);
      }

      .mode-badge:hover {
        background: rgba(var(--primitive-warning-500-rgb), 0.2);
        border-color: var(--color-status-warning);
      }

      /* Details Section */
      .mode-details {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .detail-section {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .section-label {
        font-size: var(--ds-font-size-md);
        font-weight: var(--ds-font-weight-bold);
        color: var(--color-text-primary);
        line-height: var(--ds-line-height-1-4);
      }

      .section-text {
        margin: 0;
        font-size: var(--ds-font-size-md);
        color: var(--color-text-secondary);
        line-height: var(--ds-line-height-1-6);
      }

      /* Confidence Display */
      .confidence-display {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .confidence-bar-wrapper {
        flex: 1;
      }

      .confidence-bar {
        width: 100%;
        height: var(--space-2);
        background: var(--surface-secondary);
        border-radius: var(--radius-full);
        overflow: hidden;
        box-shadow: inset 0 var(--border-1) var(--border-2)
          var(--color-border-subtle);
      }

      .confidence-fill {
        height: 100%;
        border-radius: var(--radius-full);
        transition:
          width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
          background var(--transition-fast);
        background: var(--ds-primary-green);
      }

      .confidence-fill.low {
        background: var(--color-status-error);
      }

      .confidence-fill.moderate {
        background: var(--color-status-warning);
      }

      .confidence-value {
        font-size: var(--ds-font-size-2xl);
        font-weight: var(--ds-font-weight-bold);
        color: var(--color-text-primary);
        min-width: calc(var(--size-120) * 0.5);
        text-align: right;
        font-variant-numeric: tabular-nums;
      }

      .confidence-note {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin: var(--space-1) 0 0 0;
        font-size: var(--ds-font-size-md);
        color: var(--color-text-muted);
        line-height: var(--ds-line-height-body);
      }

      .confidence-note i {
        font-size: var(--ds-font-size-md);
        color: var(--color-text-muted);
      }

      /* Data Lists */
      .data-list {
        margin: 0;
        padding-left: var(--space-5);
        list-style: disc;
      }

      .data-list li {
        margin: var(--space-1) 0;
        font-size: var(--ds-font-size-md);
        color: var(--color-text-secondary);
        line-height: var(--ds-line-height-1-6);
      }

      /* Action Buttons */
      .action-buttons {
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
      }

      .action-btn {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-3) var(--space-5);
        background: var(--ds-primary-green);
        color: var(--color-text-on-primary);
        border: none;
        border-radius: var(--radius-lg);
        font-size: var(--ds-font-size-md);
        font-weight: var(--ds-font-weight-medium);
        cursor: pointer;
        transition:
          transform var(--transition-fast),
          box-shadow var(--transition-fast),
          background var(--transition-fast);
        min-height: var(--touch-target-md);
        text-decoration: none;
      }

      .action-btn:hover {
        transform: translateY(calc(var(--border-1) * -1));
        box-shadow: var(--hover-shadow-md);
        background: var(--ds-primary-green-hover);
      }

      .action-btn:active {
        transform: translateY(0);
      }

      .action-btn i {
        font-size: var(--ds-font-size-md);
      }

      /* Responsive */
      @media (max-width: 768px) {
        .ai-mode-card {
          margin: var(--space-3) var(--space-4);
          padding: var(--space-4);
        }

        .mode-header {
          flex-direction: column;
          gap: var(--space-3);
        }

        .mode-header-actions {
          width: 100%;
          justify-content: space-between;
        }

        .mode-badge {
          align-self: flex-start;
        }

        .mode-icon-wrapper {
          width: var(--icon-container-md);
          height: var(--icon-container-md);
        }

        .mode-icon {
          font-size: var(--ds-font-size-xl);
        }

        .mode-title {
          font-size: var(--ds-font-size-md);
        }

        .action-buttons {
          flex-direction: column;
        }

        .action-btn {
          width: 100%;
          justify-content: center;
        }
      }
    `,
  ],
})
export class AIModeExplanationComponent {
  modeStatus = input<AIModeStatus | null>(null);
  isCollapsed = signal(false);

  toggleCollapsed(): void {
    this.isCollapsed.update((value) => !value);
  }

  getConfidenceClass(): string {
    const confidence = this.modeStatus()?.confidence || 0;
    if (confidence < 0.5) return "low";
    return "moderate";
  }

  hasMissingWellness(): boolean {
    const missing = this.modeStatus()?.missingData || [];
    return missing.some(
      (item) =>
        item.includes("wellness") ||
        item.includes("sleep") ||
        item.includes("energy") ||
        item.includes("soreness"),
    );
  }

  hasMissingTraining(): boolean {
    const missing = this.modeStatus()?.missingData || [];
    return missing.some(
      (item) => item.includes("training") || item.includes("session"),
    );
  }

  getDataLabel(item: string): string {
    const labels: Record<string, string> = {
      wellness_checkin: "Wellness check-in",
      wellness_sleep_quality: "Sleep quality",
      wellness_energy_level: "Energy level",
      wellness_soreness: "Muscle soreness",
      wellness_stress_level: "Stress level",
      wellness_mood: "Mood",
      training_sessions: "Training sessions",
      stale_wellness: "Wellness data (older than 2 days)",
    };

    // Handle patterns like "5 training_sessions"
    const match = item.match(/^(\d+)\s+(.+)$/);
    if (match) {
      const count = match[1];
      const type = match[2];
      return `${count} ${labels[type] || type}`;
    }

    return labels[item] || item.replace(/_/g, " ");
  }
}
