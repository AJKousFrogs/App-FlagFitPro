import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";

import { AcwrService } from "../core/services/acwr.service";
import { SupabaseService } from "../core/services/supabase.service";
import { TeamMembershipService } from "../core/services/team-membership.service";
import { staffLaneFor } from "../core/guards/staff.guard";

/**
 * More — the grouped hub. Ported 1:1 from redesign/ground-zero/02-hifi/more.html.
 * The identity banner reads the signed-in user; the Load row shows the live ACWR
 * band. Rows whose secondary screens aren't ported yet are inert placeholders —
 * they activate as those screens land after the core-journey gate.
 */
@Component({
  selector: "app-more",
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./more.component.html",
})
export class MoreComponent {
  private readonly acwrSvc = inject(AcwrService);
  private readonly supabase = inject(SupabaseService);
  private readonly membership = inject(TeamMembershipService);

  /** Staff (coach/physio/nutritionist/psychologist) can jump to the staff track. */
  readonly isStaff = computed(() => staffLaneFor(this.membership.role()) !== null);

  constructor() {
    this.membership.loadMembership().catch(() => null);
  }

  /** "Joao Maioto · #1 · QB" from the signed-in user; generic fallback. */
  readonly identity = computed(() => {
    const meta = (this.supabase.currentUser()?.user_metadata ?? {}) as Record<string, unknown>;
    const name = ((meta["full_name"] ?? meta["name"] ?? "") as string).trim();
    const jersey = meta["jersey_number"];
    const pos = (meta["position"] ?? "") as string;
    if (!name) return "Your hub";
    return [name, jersey != null ? `#${jersey}` : null, pos || null].filter(Boolean).join(" · ");
  });

  /** Live ACWR band for the Load row (null → no number, never faked). */
  readonly acwrBand = computed<{ label: string; cls: string } | null>(() => {
    if (!this.acwrSvc.sufficientDataForACWR()) return null;
    const r = this.acwrSvc.acwrRatio();
    if (r == null) return null;
    const cls = r > 1.5 ? "danger" : r > 1.3 || r < 0.8 ? "caution" : "good";
    return { label: r.toFixed(2), cls };
  });
}
