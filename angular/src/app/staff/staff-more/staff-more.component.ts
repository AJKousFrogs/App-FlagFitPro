import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";

import { TeamMembershipService } from "../../core/services/team-membership.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { staffLaneFor } from "../../core/guards/staff.guard";

const LANE_LABEL: Record<string, string> = {
  coach: "Coach",
  physio: "Physiotherapist",
  nutrition: "Nutritionist",
  psych: "Psychologist",
};

/** Staff More — team + role, switch to the athlete view (if also a player), sign out. */
@Component({
  selector: "app-staff-more",
  standalone: true,
  imports: [LucideAngularModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./staff-more.component.html",
})
export class StaffMoreComponent {
  private readonly membership = inject(TeamMembershipService);
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  readonly teamName = this.membership.teamName;
  readonly lane = computed(() => staffLaneFor(this.membership.role()));
  readonly roleLabel = computed(() => LANE_LABEL[this.lane() ?? ""] ?? "Staff");

  goAthlete(): void {
    this.router.navigate(["/today"]);
  }
  async signOut(): Promise<void> {
    try {
      await this.supabase.signOut();
    } finally {
      this.router.navigate(["/landing"]);
    }
  }
}
