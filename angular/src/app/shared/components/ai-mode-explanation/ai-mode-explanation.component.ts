/**
 * AI Mode Explanation Component
 * 
 * Phase 2.3 - Motivation & Safety
 * Shows when AI switches to conservative mode, why, confidence level, and actions to improve
 */

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  input,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { CardModule } from "primeng/card";
import { TagModule } from "primeng/tag";
import { ButtonModule } from "primeng/button";
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
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    TagModule,
    ButtonModule,
    TooltipModule,
  ],
  template: `
    @if (modeStatus() && modeStatus()!.isConservative) {
      <p-card styleClass="ai-mode-card conservative">
        <div class="mode-header">
          <div class="mode-icon">
            <i class="pi pi-shield"></i>
          </div>
          <div class="mode-content">
            <h3>AI Coach is in Conservative Mode</h3>
            <p class="mode-subtitle">
              Providing cautious recommendations due to incomplete data
            </p>
          </div>
          <p-tag
            value="Conservative"
            severity="warn"
            styleClass="mode-badge"
            [pTooltip]="'AI is being cautious because data confidence is below 70%'"
          ></p-tag>
        </div>

        <div class="mode-details">
          <!-- Why Conservative Mode -->
          <div class="reason-section">
            <strong>Why conservative mode:</strong>
            <p>{{ modeStatus()!.reason }}</p>
          </div>

          <!-- Confidence Level -->
          <div class="confidence-section">
            <strong>Data Confidence:</strong>
            <div class="confidence-display">
              <div class="confidence-bar">
                <div
                  class="confidence-fill"
                  [style.width.%]="modeStatus()!.confidence * 100"
                  [class]="getConfidenceClass()"
                ></div>
              </div>
              <span class="confidence-value">
                {{ (modeStatus()!.confidence * 100) | number: "1.0-0" }}%
              </span>
            </div>
            <p class="confidence-note">
              AI recommendations are more cautious when confidence is below 70%
            </p>
          </div>

          <!-- Missing Data -->
          @if (modeStatus()!.missingData.length > 0) {
            <div class="missing-data-section">
              <strong>Missing data:</strong>
              <ul class="missing-list">
                @for (item of modeStatus()!.missingData; track item) {
                  <li>{{ getDataLabel(item) }}</li>
                }
              </ul>
            </div>
          }

          <!-- Stale Data -->
          @if (modeStatus()!.staleData.length > 0) {
            <div class="stale-data-section">
              <strong>Stale data:</strong>
              <ul class="stale-list">
                @for (item of modeStatus()!.staleData; track item) {
                  <li>{{ getDataLabel(item) }}</li>
                }
              </ul>
            </div>
          }

          <!-- Actions to Improve -->
          <div class="actions-section">
            <strong>Improve data quality:</strong>
            <div class="action-buttons">
              @if (hasMissingWellness()) {
                <button
                  pButton
                  label="Complete Wellness Check-in"
                  icon="pi pi-heart"
                  [routerLink]="['/wellness']"
                  styleClass="p-button-outlined p-button-sm"
                ></button>
              }
              @if (hasMissingTraining()) {
                <button
                  pButton
                  label="Log Training Session"
                  icon="pi pi-plus"
                  [routerLink]="['/training/log']"
                  styleClass="p-button-outlined p-button-sm"
                ></button>
              }
            </div>
          </div>
        </div>
      </p-card>
    }
  `,
  styles: [
    `
      .ai-mode-card {
        margin-bottom: var(--space-4);
        border-left: 4px solid;
      }

      .ai-mode-card.conservative {
        border-left-color: var(--color-status-warning);
        background: var(--color-status-warning-subtle);
      }

      .mode-header {
        display: flex;
        gap: var(--space-3);
        align-items: flex-start;
        margin-bottom: var(--space-4);
      }

      .mode-icon {
        font-size: var(--font-size-h2);
        color: var(--color-status-warning);
      }

      .mode-content {
        flex: 1;
      }

      .mode-content h3 {
        margin: 0 0 var(--space-1) 0;
        font-size: var(--font-size-h3);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .mode-subtitle {
        margin: 0;
        font-size: var(--font-size-body);
        color: var(--color-text-secondary);
      }

      .mode-badge {
        font-size: var(--font-size-h4);
      }

      .mode-details {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .reason-section,
      .confidence-section,
      .missing-data-section,
      .stale-data-section,
      .actions-section {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .reason-section strong,
      .confidence-section strong,
      .missing-data-section strong,
      .stale-data-section strong,
      .actions-section strong {
        font-size: var(--font-size-body);
        color: var(--color-text-primary);
        font-weight: var(--font-weight-semibold);
      }

      .reason-section p {
        margin: 0;
        font-size: var(--font-size-body);
        color: var(--color-text-secondary);
        line-height: 1.5;
      }

      .confidence-display {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .confidence-bar {
        flex: 1;
        height: 8px;
        background: var(--surface-ground);
        border-radius: var(--radius-sm);
        overflow: hidden;
      }

      .confidence-fill {
        height: 100%;
        transition: width 0.3s ease;
        border-radius: var(--radius-sm);
      }

      .confidence-fill.low {
        background: var(--color-status-error);
      }

      .confidence-fill.moderate {
        background: var(--color-status-warning);
      }

      .confidence-value {
        font-size: var(--font-size-h3);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
        min-width: 50px;
        text-align: right;
      }

      .confidence-note {
        margin: 0;
        font-size: var(--font-size-h4);
        color: var(--color-text-secondary);
        font-style: italic;
      }

      .missing-list,
      .stale-list {
        margin: var(--space-1) 0 0 var(--space-4);
        padding: 0;
        list-style: disc;
        color: var(--color-text-secondary);
        font-size: var(--font-size-body);
      }

      .action-buttons {
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
        margin-top: var(--space-2);
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
        item.includes("soreness")
    );
  }

  hasMissingTraining(): boolean {
    const missing = this.modeStatus()?.missingData || [];
    return missing.some((item) => item.includes("training") || item.includes("session"));
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

