import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { NgOptimizedImage } from "@angular/common";
import { TopbarComponent } from "../shared/topbar.component";

import { AcwrService } from "../core/services/acwr.service";
import { IdentityService } from "../core/services/identity.service";
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
  imports: [NgOptimizedImage, TopbarComponent, RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./more.component.html",
  styles: [
    // Planned-but-unbuilt rows: muted + a "Soon" tag, no chevron — so they read as
    // not-yet-available rather than masquerading as working navigation.
    `
      .lrow.soon {
        opacity: 0.55;
        cursor: default;
      }
    `,
  ],
})
export class MoreComponent {
  private readonly acwrSvc = inject(AcwrService);
  private readonly membership = inject(TeamMembershipService);
  private readonly identitySvc = inject(IdentityService);

  /** Staff (coach/physio/nutritionist/psychologist) can jump to the staff track. */
  readonly isStaff = computed(
    () => staffLaneFor(this.membership.role()) !== null,
  );

  constructor() {
    this.membership.loadMembership().catch(() => null);
  }

  /** "Joao Maioto · #1 · QB · Ljubljana Frogs" from the signed-in user + team. */
  readonly identity = computed(() => {
    const id = this.identitySvc;
    const name = id.displayName();
    const j = id.jersey();
    return [
      name,
      j != null ? `#${j}` : null,
      id.position() || null,
      id.teamName() || null,
    ]
      .filter(Boolean)
      .join(" · ");
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
