/**
 * Roster Overview Component
 * Displays team statistics overview card
 */
import { Component, input, ChangeDetectionStrategy } from "@angular/core";
import { Card } from "primeng/card";
import { TeamStat } from "../roster.models";

@Component({
  selector: "app-roster-overview",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card],
  template: `
    <p-card class="overview-card">
      <ng-template #header>
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
  styleUrl: "./roster-overview.component.scss",
})
export class RosterOverviewComponent {
  stats = input.required<TeamStat[]>();
}
