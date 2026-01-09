/**
 * AI Mode Explanation Component
 *
 * Phase 2.3 - Motivation & Safety
 * Shows when AI switches to conservative mode, why, confidence level, and actions to improve
 *
 * Design: Modern, clean card with left accent border matching design system
 */

import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { RouterModule } from "@angular/router";
import { RippleModule } from "primeng/ripple";
import { TooltipModule } from "primeng/tooltip";

export interface AIModeStatus {
  isConservative: boolean;
  confidence: number;
  reason: string;
  missingData: string[];
  staleData: string[];
}

@Component({
  selector: "app-ai-mode-explanation",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, RippleModule, TooltipModule],
  template: `
    @if (modeStatus() && modeStatus()!.isConservative) {
      <div class="ai-mode-card">
        <!-- Header with Icon, Title, and Badge -->
        <div class="mode-header">
          <div class="mode-icon-wrapper">
            <i class="pi pi-shield mode-icon"></i>
          </div>
          <div class="mode-content">
            <h3 class="mode-title">AI Coach is in Conservative Mode</h3>
            <p class="mode-subtitle">
              Providing cautious recommendations due to incomplete data
            </p>
          </div>
          <span class="mode-badge" pTooltip="AI is being cautious because data confidence is below 70%">
            Conservative
          </span>
        </div>

        <!-- Details Section -->
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
                      modeStatus()!.confidence >= 0.5 && modeStatus()!.confidence < 0.7
                    "
                  ></div>
                </div>
              </div>
              <span class="confidence-value">
                {{ modeStatus()!.confidence * 100 | number : "1.0-0" }}%
              </span>
            </div>
            <p class="confidence-note">
              <i class="pi pi-info-circle"></i>
              AI recommendations are more cautious when confidence is below 70%
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
                  pRipple
                >
                  <i class="pi pi-heart"></i>
                  <span>Complete Wellness Check-in</span>
                </button>
              }
              @if (hasMissingTraining()) {
                <button
                  class="action-btn"
                  [routerLink]="['/training/log']"
                  pRipple
                >
                  <i class="pi pi-plus"></i>
                  <span>Log Training Session</span>
                </button>
              }
            </div>
          </div>
        </div>
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
        border-left: 4px solid var(--color-status-warning);
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
        margin-bottom: var(--space-5);
      }

      .mode-icon-wrapper {
        width: 48px;
        height: 48px;
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
        font-size: 1.5rem;
        color: var(--color-status-warning);
      }

      .mode-content {
        flex: 1;
        min-width: 0;
      }

      .mode-title {
        margin: 0 0 var(--space-1) 0;
        font-family: var(--font-family-sans);
        font-size: var(--font-size-h3);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
        line-height: 1.3;
      }

      .mode-subtitle {
        margin: 0;
        font-size: var(--font-size-body);
        color: var(--color-text-secondary);
        line-height: 1.5;
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
        border: var(--border-1) solid rgba(var(--primitive-warning-500-rgb), 0.3);
        border-radius: var(--radius-full);
        font-size: var(--font-size-h4);
        font-weight: var(--font-weight-semibold);
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
        font-size: var(--font-size-body);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
        line-height: 1.4;
      }

      .section-text {
        margin: 0;
        font-size: var(--font-size-body);
        color: var(--color-text-secondary);
        line-height: 1.6;
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
        height: 8px;
        background: var(--surface-secondary);
        border-radius: var(--radius-full);
        overflow: hidden;
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
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
        font-size: var(--font-size-metric-md);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
        min-width: 60px;
        text-align: right;
        font-variant-numeric: tabular-nums;
      }

      .confidence-note {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin: var(--space-1) 0 0 0;
        font-size: var(--font-size-h4);
        color: var(--color-text-muted);
        line-height: 1.5;
      }

      .confidence-note i {
        font-size: var(--font-size-h4);
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
        font-size: var(--font-size-body);
        color: var(--color-text-secondary);
        line-height: 1.6;
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
        font-family: var(--font-family-sans);
        font-size: var(--font-size-body);
        font-weight: var(--font-weight-medium);
        cursor: pointer;
        transition:
          transform var(--transition-fast),
          box-shadow var(--transition-fast),
          background var(--transition-fast);
        min-height: var(--touch-target-md);
        text-decoration: none;
      }

      .action-btn:hover {
        transform: translateY(-1px);
        box-shadow: var(--hover-shadow-md);
        background: var(--ds-primary-green-hover);
      }

      .action-btn:active {
        transform: translateY(0);
      }

      .action-btn i {
        font-size: 1rem;
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

        .mode-badge {
          align-self: flex-start;
        }

        .mode-icon-wrapper {
          width: 40px;
          height: 40px;
        }

        .mode-icon {
          font-size: 1.25rem;
        }

        .mode-title {
          font-size: var(--font-size-h4);
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
