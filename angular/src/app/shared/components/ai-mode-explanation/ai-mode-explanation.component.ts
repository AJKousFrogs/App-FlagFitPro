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
  styleUrl: "./ai-mode-explanation.component.scss",
})
export class AIModeExplanationComponent {
  modeStatus = input<AIModeStatus | null>(null);
  isCollapsed = signal(false);

  toggleCollapsed(): void {
    this.isCollapsed.update((value) => !value);
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
