import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";

import { TeamMembershipService } from "../core/services/team-membership.service";
import { staffLaneFor } from "../core/guards/staff.guard";

/**
 * Staff shell — the parallel chrome for coach / physio / nutritionist /
 * psychologist. Same frame + tokens as the athlete shell; role-aware bottom nav
 * (coaches also get Alerts). No FAB (staff don't self-log). The lane is derived
 * from the signed-in user's team role.
 */
@Component({
  selector: "app-staff-shell",
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-shell">
      <router-outlet />
      <nav
        class="tabbar"
        aria-label="Staff"
        [style.grid-template-columns]="'repeat(' + navCount() + ', 1fr)'"
      >
        <a
          routerLink="/staff/roster"
          routerLinkActive="active"
          ariaCurrentWhenActive="page"
        >
          <lucide-icon name="users" />Roster
        </a>
        @if (lane() === "coach") {
          <a
            routerLink="/staff/alerts"
            routerLinkActive="active"
            ariaCurrentWhenActive="page"
          >
            <lucide-icon name="bell" />Alerts
          </a>
          <a
            routerLink="/staff/library"
            routerLinkActive="active"
            ariaCurrentWhenActive="page"
          >
            <lucide-icon name="video" />Library
          </a>
        }
        <a
          routerLink="/staff/more"
          routerLinkActive="active"
          ariaCurrentWhenActive="page"
        >
          <lucide-icon name="menu" />More
        </a>
      </nav>
    </div>
  `,
})
export class StaffShellComponent {
  private readonly membership = inject(TeamMembershipService);
  readonly lane = computed(() => staffLaneFor(this.membership.role()));
  readonly navCount = computed(() => (this.lane() === "coach" ? 4 : 2));
}
