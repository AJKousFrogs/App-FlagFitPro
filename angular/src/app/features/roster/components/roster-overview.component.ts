/**
 * Roster Overview Component
 * Displays team statistics overview card
 */
import { Component, input, ChangeDetectionStrategy } from "@angular/core";
import { CardModule } from "primeng/card";
import { TeamStat } from "../roster.models";

@Component({
  selector: "app-roster-overview",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardModule],
  template: `
    <p-card class="overview-card">
      <ng-template pTemplate="header">
        <h2 class="card-title">
          <i class="pi pi-trophy"></i>
          Team Overview
        </h2>
      </ng-template>
      <div class="team-overview-grid">
        @for (stat of stats(); track stat.label) {
          <div class="overview-stat">
            <div class="overview-value">{{ stat.value }}</div>
            <div class="overview-label">{{ stat.label }}</div>
          </div>
        }
      </div>
    </p-card>
  `,
  styles: [
    `
      .overview-card {
        margin-bottom: var(--space-8);
      }

      .card-title {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: var(--font-heading-lg);
        font-weight: var(--font-weight-bold);
        margin: 0;
        color: var(--text-primary);
      }

      .card-title i {
        color: var(--color-brand-primary);
      }

      .team-overview-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: var(--space-4);
      }

      .overview-stat {
        text-align: center;
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
        transition: transform 0.2s;
      }

      .overview-stat:hover {
        transform: translateY(-2px);
      }

      .overview-value {
        font-size: var(--font-heading-2xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-brand-primary);
        margin-bottom: var(--space-2);
      }

      .overview-label {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        font-weight: var(--font-weight-medium);
      }

      /* Responsive */
      @media (min-width: 1400px) {
        .team-overview-grid {
          grid-template-columns: repeat(6, 1fr);
        }
      }

      @media (min-width: 1200px) and (max-width: 1399px) {
        .team-overview-grid {
          grid-template-columns: repeat(5, 1fr);
        }
      }

      @media (min-width: 1024px) and (max-width: 1199px) {
        .team-overview-grid {
          grid-template-columns: repeat(4, 1fr);
        }
      }

      @media (min-width: 769px) and (max-width: 1023px) {
        .team-overview-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      @media (max-width: 768px) {
        .team-overview-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .card-title {
          font-size: var(--font-heading-md);
        }
      }

      @media (max-width: 480px) {
        .team-overview-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-2);
        }

        .overview-stat {
          padding: var(--space-3);
        }

        .overview-value {
          font-size: var(--font-heading-lg);
        }
      }

      @media (max-width: 374px) {
        .team-overview-grid {
          grid-template-columns: 1fr;
        }
      }

      /* Touch devices */
      @media (hover: none) and (pointer: coarse) {
        .overview-stat:hover {
          transform: none;
        }
      }
    `,
  ],
})
export class RosterOverviewComponent {
  stats = input.required<TeamStat[]>();
}
