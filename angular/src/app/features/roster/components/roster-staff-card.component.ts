/**
 * Roster Staff Card Component
 * Displays a single staff member card
 */
import { Component, input, ChangeDetectionStrategy } from "@angular/core";
import { StaffMember } from "../roster.models";
import { getInitials } from "../../../shared/utils/format.utils";
import { getYears } from "../roster-utils";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";

@Component({
  selector: "app-roster-staff-card",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardShellComponent],
  template: `
    <app-card-shell
      class="staff-card"
      [class]="'staff-' + member().roleCategory"
      [flush]="true"
    >
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
        <div class="stat-item stat-block stat-block--compact">
          <div class="stat-block__content">
            <div class="stat-block__value">
              {{ getYears(member().experience) }}
            </div>
            <div class="stat-block__label">Years Exp.</div>
          </div>
        </div>
        <div class="stat-item stat-block stat-block--compact">
          <div class="stat-block__content">
            <div class="stat-block__value">{{ member().country }}</div>
            <div class="stat-block__label">Country</div>
          </div>
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
    </app-card-shell>
  `,
  styleUrl: "./roster-staff-card.component.scss",
})
export class RosterStaffCardComponent {
  // Inputs
  member = input.required<StaffMember>();
  showEmail = input<boolean>(false);

  // Expose utility functions
  getInitials = getInitials;
  getYears = getYears;
}
