/**
 * Roster Overview Component
 * Displays team statistics overview card
 */
import { Component, input, ChangeDetectionStrategy } from "@angular/core";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { TeamStat } from "../roster.models";

@Component({
  selector: "app-roster-overview",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardShellComponent],
  template: `
    <app-card-shell
      class="overview-card"
      title="Team Overview"
      headerIcon="pi-trophy"
    >
      <div class="team-overview-grid">
        @for (stat of stats(); track stat.label) {
          <div class="overview-stat">
            <div class="overview-value">{{ stat.value }}</div>
            <div class="overview-label">{{ stat.label }}</div>
          </div>
        }
      </div>
    </app-card-shell>
  `,
  styleUrl: "./roster-overview.component.scss",
})
export class RosterOverviewComponent {
  stats = input.required<TeamStat[]>();
}
