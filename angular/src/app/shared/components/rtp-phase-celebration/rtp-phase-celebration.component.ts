/**
 * RTP Phase Celebration Component
 *
 * Phase 2.3 - Motivation & Safety
 * Celebrates RTP phase advancement with progress context, clear instructions, and next phase unlock info
 */

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { Card } from "primeng/card";

import { ButtonComponent } from "../button/button.component";

export interface RTPPhaseInfo {
  currentPhase: number;
  phaseName: string;
  daysInPhase: number;
  minimumDays: number;
  allowedActivities: string[];
  restrictions: string[];
  progressionCriteria: string[];
  nextPhase?: {
    phase: number;
    name: string;
    unlockCriteria: string[];
  };
}

@Component({
  selector: "app-rtp-phase-celebration",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, Card, ButtonComponent],
  template: `
    @if (showCelebration()) {
      <p-card class="celebration-card">
        <div class="celebration-header">
          <div class="celebration-icon">🎉</div>
          <div class="celebration-content">
            <h2>You've Progressed to {{ phaseInfo()!.phaseName }}!</h2>
            <p class="celebration-subtitle">
              Stage {{ phaseInfo()!.currentPhase }} • Day
              {{ phaseInfo()!.daysInPhase }} of {{ phaseInfo()!.minimumDays }}
            </p>
          </div>
        </div>

        <!-- Progress Context -->
        <div class="progress-context">
          <div class="context-item">
            <span class="context-label"
              >Days in Phase {{ phaseInfo()!.currentPhase - 1 }}:</span
            >
            <span class="context-value">{{ daysInPreviousPhase() }} days</span>
          </div>
          <div class="context-item">
            <span class="context-label">What unlocked this phase:</span>
            <span class="context-value">{{ getUnlockReason() }}</span>
          </div>
        </div>

        <!-- Clear Activity Instructions -->
        <div class="instructions-section">
          <h3><i class="pi pi-check-circle"></i> Allowed Activities</h3>
          <ul class="activities-list allowed">
            @for (activity of phaseInfo()!.allowedActivities; track activity) {
              <li>{{ activity }}</li>
            }
          </ul>

          @if (phaseInfo()!.restrictions.length > 0) {
            <h3><i class="pi pi-times-circle"></i> Restrictions</h3>
            <ul class="activities-list restricted">
              @for (
                restriction of phaseInfo()!.restrictions;
                track restriction
              ) {
                <li>{{ restriction }}</li>
              }
            </ul>
          }
        </div>

        <!-- What Unlocks Next Phase -->
        @if (phaseInfo()!.nextPhase) {
          <div class="next-phase-section">
            <h3>
              <i class="pi pi-flag"></i> What Unlocks Phase
              {{ phaseInfo()!.nextPhase!.phase }}
            </h3>
            <p class="next-phase-name">{{ phaseInfo()!.nextPhase!.name }}</p>
            <ul class="unlock-criteria">
              @for (
                criterion of phaseInfo()!.nextPhase!.unlockCriteria;
                track criterion
              ) {
                <li>{{ criterion }}</li>
              }
            </ul>
          </div>
        }

        <!-- Coach Notification -->
        <div class="coach-notification">
          <i class="pi pi-bell"></i>
          <span>Your coach has been informed of your progress.</span>
        </div>

        <!-- Action Button -->
        <div class="celebration-actions">
          <app-button
            iconRight="pi-arrow-right"
            [routerLink]="['/return-to-play']"
            >Continue Recovery Journey</app-button
          >
        </div>
      </p-card>
    }
  `,
  styles: [
    `
      .celebration-card {
        margin-bottom: var(--space-6);
        background: linear-gradient(
          135deg,
          var(--color-status-success-subtle) 0%,
          var(--surface-primary) 100%
        );
        border: var(--border-2) solid var(--color-status-success);
        border-radius: var(--radius-xl);
        padding: var(--space-6);
      }

      .celebration-header {
        display: flex;
        gap: var(--space-4);
        align-items: flex-start;
        margin-bottom: var(--space-4);
      }

      .celebration-icon {
        font-size: var(--ds-font-size-3xl);
        line-height: var(--ds-line-height-1);
      }

      .celebration-content {
        flex: 1;
      }

      .celebration-content h2 {
        margin: 0 0 var(--space-2) 0;
        font-size: var(--ds-font-size-2xl);
        font-weight: var(--ds-font-weight-bold);
        color: var(--color-text-primary);
      }

      .celebration-subtitle {
        margin: 0;
        font-size: var(--ds-font-size-md);
        color: var(--color-text-secondary);
      }

      .progress-context {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        padding: var(--space-4);
        background: var(--overlay-white-50);
        border-radius: var(--radius-md);
        margin-bottom: var(--space-4);
      }

      .context-item {
        display: flex;
        gap: var(--space-2);
        font-size: var(--ds-font-size-md);
      }

      .context-label {
        font-weight: var(--ds-font-weight-medium);
        color: var(--color-text-secondary);
      }

      .context-value {
        color: var(--color-text-primary);
        font-weight: var(--ds-font-weight-semibold);
      }

      .instructions-section {
        margin-bottom: var(--space-4);
      }

      .instructions-section h3 {
        margin: 0 0 var(--space-2) 0;
        font-size: var(--ds-font-size-xl);
        font-weight: var(--ds-font-weight-semibold);
        color: var(--color-text-primary);
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .instructions-section h3 i {
        color: var(--color-status-success);
      }

      .activities-list {
        margin: var(--space-2) 0 var(--space-4) var(--space-4);
        padding: 0;
        list-style: disc;
        color: var(--color-text-primary);
        font-size: var(--ds-font-size-md);
      }

      .activities-list.allowed li {
        color: var(--color-status-success-text);
      }

      .activities-list.restricted li {
        color: var(--color-status-warning-text);
      }

      .next-phase-section {
        padding: var(--space-4);
        background: var(--surface-secondary);
        border-radius: var(--radius-md);
        margin-bottom: var(--space-4);
      }

      .next-phase-section h3 {
        margin: 0 0 var(--space-2) 0;
        font-size: var(--ds-font-size-xl);
        font-weight: var(--ds-font-weight-semibold);
        color: var(--color-text-primary);
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .next-phase-section h3 i {
        color: var(--color-brand-primary);
      }

      .next-phase-name {
        margin: 0 0 var(--space-2) 0;
        font-size: var(--ds-font-size-md);
        font-weight: var(--ds-font-weight-semibold);
        color: var(--color-brand-primary);
      }

      .unlock-criteria {
        margin: var(--space-2) 0 0 var(--space-4);
        padding: 0;
        list-style: disc;
        color: var(--color-text-secondary);
        font-size: var(--ds-font-size-md);
      }

      .coach-notification {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-3);
        background: var(--color-status-info-subtle);
        border-radius: var(--radius-md);
        margin-bottom: var(--space-4);
        font-size: var(--ds-font-size-md);
        color: var(--color-text-primary);
      }

      .coach-notification i {
        color: var(--color-status-info);
        font-size: var(--ds-font-size-xl);
      }

      .celebration-actions {
        display: flex;
        justify-content: center;
      }
    `,
  ],
})
export class RTPPhaseCelebrationComponent {
  phaseInfo = input<RTPPhaseInfo | null>(null);
  daysInPreviousPhase = input<number>(0);
  showCelebration = computed(() => this.phaseInfo() !== null);

  getUnlockReason(): string {
    // This would come from the actual phase progression logic
    return "Completed all progression criteria and minimum days";
  }
}
