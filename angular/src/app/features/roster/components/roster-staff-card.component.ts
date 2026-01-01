/**
 * Roster Staff Card Component
 * Displays a single staff member card
 */
import { Component, input, ChangeDetectionStrategy } from "@angular/core";
import { CardModule } from "primeng/card";
import { StaffMember } from "../roster.models";
import { getInitials, getYears } from "../roster-utils";

@Component({
  selector: "app-roster-staff-card",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardModule],
  template: `
    <p-card class="staff-card" [class]="'staff-' + member().roleCategory">
      <div class="role-badge" [class]="member().roleCategory">
        {{ member().position }}
      </div>
      <div class="player-header">
        <div
          class="player-jersey staff-avatar"
          [class]="member().roleCategory + '-avatar'"
        >
          {{ getInitials(member().name) }}
        </div>
        <div class="player-info">
          <h3 class="player-name">{{ member().name }}</h3>
          <div class="player-position">{{ member().position }}</div>
          @if (member().email && showEmail()) {
            <div class="player-meta">
              <i class="pi pi-envelope"></i>
              {{ member().email }}
            </div>
          }
        </div>
      </div>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">
            {{ getYears(member().experience) }}
          </div>
          <div class="stat-label">Years Exp.</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ member().country }}</div>
          <div class="stat-label">Country</div>
        </div>
      </div>
      @if (member().achievements && member().achievements!.length > 0) {
        <div class="achievements">
          <div class="achievements-title">Achievements:</div>
          @for (
            achievement of member().achievements!.slice(0, 2);
            track achievement
          ) {
            <div class="achievement-item">• {{ achievement }}</div>
          }
        </div>
      }
    </p-card>
  `,
  styles: [
    `
      .staff-card {
        position: relative;
        transition:
          transform var(--transition-base),
          box-shadow var(--transition-base);
      }

      .staff-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
      }

      /* Staff card category borders */
      .staff-card.staff-coaching {
        border-left: 3px solid var(--color-staff-coaching);
      }

      .staff-card.staff-medical {
        border-left: 3px solid var(--color-staff-medical);
      }

      .staff-card.staff-performance {
        border-left: 3px solid var(--color-staff-performance);
      }

      .role-badge {
        position: absolute;
        top: var(--space-3);
        right: var(--space-3);
        padding: var(--space-1) var(--space-3);
        border-radius: var(--radius-lg);
        font-size: var(--font-body-xs);
        font-weight: var(--font-weight-semibold);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .role-badge.coaching {
        background: var(--color-staff-coaching-light);
        color: var(--color-staff-coaching);
      }

      .role-badge.medical {
        background: var(--color-staff-medical-light);
        color: var(--color-staff-medical);
      }

      .role-badge.performance {
        background: var(--color-staff-performance-light);
        color: var(--color-staff-performance);
      }

      .player-header {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        margin-bottom: var(--space-4);
        margin-top: var(--space-4);
      }

      .player-jersey {
        width: 56px;
        height: 56px;
        border-radius: var(--radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: var(--font-weight-bold);
        font-size: var(--font-body-lg);
        color: var(--color-text-on-primary);
        box-shadow: var(--shadow-md);
        flex-shrink: 0;
      }

      .staff-avatar {
        background: var(--color-staff-coaching-gradient);
      }

      .coaching-avatar {
        background: var(--color-staff-coaching-gradient);
      }

      .medical-avatar {
        background: var(--color-staff-medical-gradient);
      }

      .performance-avatar {
        background: var(--color-staff-performance-gradient);
      }

      .player-info {
        flex: 1;
        min-width: 0;
      }

      .player-name {
        font-size: var(--font-body-lg);
        font-weight: var(--font-weight-semibold);
        margin-bottom: var(--space-1);
        color: var(--text-primary);
      }

      .player-position {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        font-weight: var(--font-weight-medium);
        margin-bottom: var(--space-1);
      }

      .player-meta {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-3);
        margin-top: var(--space-4);
      }

      .stat-item {
        text-align: center;
        padding: var(--space-3);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
      }

      .stat-value {
        font-weight: var(--font-weight-bold);
        font-size: var(--font-body-lg);
        color: var(--color-brand-primary);
        margin-bottom: var(--space-1);
      }

      .stat-label {
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
      }

      .achievements {
        margin-top: var(--space-4);
        padding-top: var(--space-4);
        border-top: 1px solid var(--p-surface-200);
      }

      .achievements-title {
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
        font-weight: var(--font-weight-medium);
        margin-bottom: var(--space-2);
      }

      .achievement-item {
        font-size: var(--font-body-xs);
        color: var(--text-primary);
        margin-bottom: var(--space-1);
      }

      /* Touch devices */
      @media (hover: none) and (pointer: coarse) {
        .staff-card:hover {
          transform: none;
          box-shadow: var(--shadow-md);
        }
      }
    `,
  ],
})
export class RosterStaffCardComponent {
  // Inputs
  member = input.required<StaffMember>();
  showEmail = input<boolean>(false);

  // Expose utility functions
  getInitials = getInitials;
  getYears = getYears;
}
