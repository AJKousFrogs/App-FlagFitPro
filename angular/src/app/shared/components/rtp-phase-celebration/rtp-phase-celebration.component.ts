/**
 * RTP Phase Celebration Component
 *
 * Phase 2.3 - Motivation & Safety
 * Celebrates RTP phase advancement with progress context, clear instructions, and next phase unlock info
 */
import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed,
} from "@angular/core";
import { RouterModule } from "@angular/router";

import { ButtonComponent } from "../button/button.component";
import { CardShellComponent } from "../card-shell/card-shell.component";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, CardShellComponent, ButtonComponent],
  template: `
    @if (showCelebration()) {
      <app-card-shell class="celebration-card" [flush]="true">
        <div class="celebration-header">
          <div class="celebration-icon"><i class="pi pi-sparkles" aria-hidden="true"></i></div>
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
      </app-card-shell>
    }
  `,
  styleUrl: "./rtp-phase-celebration.component.scss",
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
